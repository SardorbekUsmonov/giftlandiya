import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Segment } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersGateway } from './orders.gateway';

const TRANSITIONS: Record<string, string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['READY', 'CANCELLED'],
  READY: ['ON_COURIER', 'CANCELLED'],
  ON_COURIER: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

const SELLER_ALLOWED = new Set(['PACKING', 'READY', 'ON_COURIER', 'DELIVERED']);

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: OrdersGateway,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(dto: CreateOrderDto, userId?: string) {
    // Step 1 — Load products and validate stock
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const unavailable: { productId: string; requested: number; available: number }[] = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      const available = product ? product.stock - product.reserved : 0;
      if (!product || available < item.qty) {
        unavailable.push({ productId: item.productId, requested: item.qty, available });
      }
    }

    if (unavailable.length > 0) {
      throw new HttpException({ unavailable }, HttpStatus.BAD_REQUEST);
    }

    // Step 2 — Calculate pricing
    const subtotal = dto.items.reduce((sum, item) => {
      return sum + productMap.get(item.productId)!.price * item.qty;
    }, 0);

    let discount = 0;

    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findFirst({
        where: {
          code: dto.promoCode,
          isActive: true,
          minOrderValue: { lte: subtotal },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!promo || (promo.maxUses !== null && promo.usedCount >= promo.maxUses)) {
        throw new HttpException(
          'Promo kod topilmadi yoki muddati tugagan',
          HttpStatus.BAD_REQUEST,
        );
      }

      discount =
        promo.discountType === 'PERCENT'
          ? Math.floor((subtotal * promo.discountValue) / 100)
          : promo.discountValue;
    }

    let coinsDiscount = 0;
    if (dto.coinsUsed && dto.coinsUsed > 0 && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyCoins: true },
      });
      const maxCoins = Math.floor(subtotal * 0.3);
      coinsDiscount = Math.min(dto.coinsUsed, user?.loyaltyCoins ?? 0, maxCoins);
    }

    const deliveryFee = subtotal >= 50_000 ? 0 : 15_000;
    const total = subtotal - discount - coinsDiscount + deliveryFee;

    // Steps 3 & 4 — Create in transaction (order number inside tx prevents collision)
    const order = await this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `GL${new Date().getFullYear()}${(count + 1).toString().padStart(6, '0')}`;

      const initialStatus =
        dto.paymentMethod === 'CASH' ? ('CONFIRMED' as const) : ('NEW' as const);

      const created = await tx.order.create({
        data: {
          orderNumber,
          status: initialStatus,
          userId: userId ?? '',
          subtotal,
          discount,
          deliveryFee,
          total,
          promoCode: dto.promoCode,
          coinsUsed: coinsDiscount,
          address: dto.address,
          district: dto.district,
          contactName: dto.contactName,
          contactPhone: dto.contactPhone,
          isGift: dto.isGift ?? false,
          giftMessage: dto.giftMessage,
          giftWrapping: dto.giftWrapping ?? false,
          secretSender: dto.secretSender ?? false,
          deliveryType: (dto.deliveryType ?? 'COURIER') as any,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
          notes: dto.notes,
          utmSource: dto.utmSource,
        },
        include: { items: true },
      });

      await tx.orderItem.createMany({
        data: dto.items.map((item) => ({
          orderId: created.id,
          productId: item.productId,
          qty: item.qty,
          price: productMap.get(item.productId)!.price,
        })),
      });

      await Promise.all(
        dto.items.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: { reserved: { increment: item.qty } },
          }),
        ),
      );

      return created;
    });

    // Step 6 — Deduct coins
    if (coinsDiscount > 0 && userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { loyaltyCoins: { decrement: coinsDiscount } },
      });
    }

    // Step 7 — Increment promo usage
    if (dto.promoCode) {
      await this.prisma.promoCode.updateMany({
        where: { code: dto.promoCode },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Step 8 — Notify (async, non-blocking)
    void this.emitNewOrder({ ...order, paymentMethod: dto.paymentMethod });

    return { data: { order } };
  }

  // ─── Customer queries ─────────────────────────────────────────────────────

  async findMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, nameUz: true, nameRu: true, images: true, slug: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { data: orders };
  }

  async track(trackId: string) {
    const order = await this.prisma.order.findFirst({
      where: { OR: [{ id: trackId }, { orderNumber: trackId }] },
      include: {
        items: {
          include: {
            product: { select: { nameUz: true, nameRu: true, images: true } },
          },
        },
      },
    });

    if (!order) throw new HttpException('Buyurtma topilmadi', HttpStatus.NOT_FOUND);

    return { data: order };
  }

  // ─── Status machine ───────────────────────────────────────────────────────

  async updateStatus(
    id: string,
    newStatus: string,
    actorUserId: string,
    actorRole: 'SELLER' | 'ADMIN' | 'SUPER_ADMIN',
  ) {
    const order = await this.findOrThrow(id);

    const allowed = TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new HttpException(
        `${order.status} → ${newStatus} o'tish mumkin emas`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (actorRole === 'SELLER' && !SELLER_ALLOWED.has(newStatus)) {
      throw new HttpException(
        "Sizda bu statusni o'rnatish huquqi yo'q",
        HttpStatus.FORBIDDEN,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: newStatus as any },
      include: { items: true },
    });

    if (newStatus === 'DELIVERED') await this.handleDelivered(updated);

    this.gateway.notifyStatusChange(id, newStatus);
    void this.notifications.onStatusChange(updated, newStatus);

    return { data: updated };
  }

  async cancelOrder(id: string, reason: string) {
    const order = await this.findOrThrow(id);

    if (order.status === 'CANCELLED') {
      throw new HttpException('Buyurtma allaqachon bekor qilingan', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED', notes: reason },
      include: { items: true },
    });

    await this.handleCancelled(updated);
    this.gateway.notifyStatusChange(id, 'CANCELLED');

    return { data: updated };
  }

  // Called by PaymentsService after successful payment
  async confirmOrder(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === 'CONFIRMED') return;

    if (!TRANSITIONS[order.status]?.includes('CONFIRMED')) {
      this.logger.warn(
        `confirmOrder: cannot transition ${order.status} → CONFIRMED for ${orderId}`,
      );
      return;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    this.gateway.notifyStatusChange(orderId, 'CONFIRMED');
    void this.notifications.onStatusChange(updated, 'CONFIRMED');
  }

  // ─── Seller ───────────────────────────────────────────────────────────────

  async findSellerOrders(
    actorUserId: string,
    query: { status?: string; page?: number; limit?: number },
  ) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: actorUserId } });
    if (!seller) throw new HttpException('Seller profili topilmadi', HttpStatus.NOT_FOUND);

    const { status, page = 1, limit = 20 } = query;
    const where: any = {
      sellerId: seller.id,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { product: { select: { nameUz: true, nameRu: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async findAdminOrders(query: AdminOrdersQueryDto) {
    const { status, dateFrom, dateTo, sellerId, search, page = 1, limit = 20 } = query;

    const where: any = {
      ...(status && { status }),
      ...(sellerId && { sellerId }),
      ...((dateFrom || dateTo) && {
        createdAt: {
          ...(dateFrom && { gte: new Date(dateFrom) }),
          ...(dateTo && { lte: new Date(dateTo) }),
        },
      }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { contactPhone: { contains: search } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          seller: { include: { user: { select: { name: true } } } },
          items: true,
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data: orders, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async assignSeller(id: string, sellerId: string) {
    await this.findOrThrow(id);

    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new HttpException('Seller topilmadi', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { sellerId },
    });

    return { data: updated };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findOrThrow(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new HttpException('Buyurtma topilmadi', HttpStatus.NOT_FOUND);
    return order;
  }

  private async handleDelivered(order: any) {
    const items: { productId: string; qty: number }[] = order.items ?? [];

    await Promise.all(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.qty },
            reserved: { decrement: item.qty },
          },
        }),
      ),
    );

    const coinsEarned = Math.floor(order.total * 0.02);

    const user = await this.prisma.user.findUnique({
      where: { id: order.userId },
      select: { ltv: true },
    });

    const newLtv = (user?.ltv ?? 0) + order.total;
    const newSegment: Segment | undefined =
      newLtv >= 500_000 ? Segment.VIP : newLtv >= 100_000 ? Segment.ACTIVE : undefined;

    await this.prisma.user.update({
      where: { id: order.userId },
      data: {
        loyaltyCoins: { increment: coinsEarned },
        ltv: { increment: order.total },
        ...(newSegment && { segment: newSegment }),
      },
    });
  }

  private async handleCancelled(order: any) {
    const items: { productId: string; qty: number }[] = order.items ?? [];

    await Promise.all(
      items.map((item) =>
        this.prisma.product.update({
          where: { id: item.productId },
          data: { reserved: { decrement: item.qty } },
        }),
      ),
    );

    if (order.promoCode) {
      await this.prisma.promoCode.updateMany({
        where: { code: order.promoCode },
        data: { usedCount: { decrement: 1 } },
      });
    }

    if (order.coinsUsed > 0) {
      await this.prisma.user.update({
        where: { id: order.userId },
        data: { loyaltyCoins: { increment: order.coinsUsed } },
      });
    }
  }

  private async emitNewOrder(order: any) {
    const full = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    const payload = { ...full, paymentMethod: order.paymentMethod };
    this.gateway.notifyNewOrder(payload as any);
    void this.notifications.onNewOrder(payload);
  }
}
