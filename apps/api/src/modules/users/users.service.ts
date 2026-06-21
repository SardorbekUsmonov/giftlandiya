import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateGiftCalendarDto } from './dto/create-gift-calendar.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateGiftCalendarDto } from './dto/update-gift-calendar.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: { orderBy: [{ isDefault: 'desc' }, { id: 'asc' }] },
        seller: { select: { id: true, shopName: true, isActive: true } },
        _count: { select: { orders: true, reviews: true } },
      },
    });

    if (!user) throw new HttpException('Foydalanuvchi topilmadi', HttpStatus.NOT_FOUND);

    const { passwordHash, ...rest } = user;
    return { data: rest };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        gender: dto.gender,
        telegramId: dto.telegramId,
        birthday: dto.birthday ? new Date(dto.birthday) : undefined,
      },
    });

    const { passwordHash, ...rest } = updated;
    return { data: rest };
  }

  // ─── Addresses ────────────────────────────────────────────────────────────

  async getAddresses(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
    return { data: addresses };
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await this.prisma.address.create({
      data: { ...dto, userId },
    });
    return { data: address };
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new HttpException('Manzil topilmadi', HttpStatus.NOT_FOUND);

    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });
    return { data: updated };
  }

  async deleteAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new HttpException('Manzil topilmadi', HttpStatus.NOT_FOUND);

    await this.prisma.address.delete({ where: { id: addressId } });
    return { data: { success: true } };
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const existing = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!existing) throw new HttpException('Manzil topilmadi', HttpStatus.NOT_FOUND);

    await this.prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    const updated = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });
    return { data: updated };
  }

  // ─── Coins ────────────────────────────────────────────────────────────────

  async getCoins(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { loyaltyCoins: true },
    });
    if (!user) throw new HttpException('Foydalanuvchi topilmadi', HttpStatus.NOT_FOUND);

    // Derive coin history from orders (no dedicated ledger model)
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        OR: [{ coinsUsed: { gt: 0 } }, { status: 'DELIVERED' }],
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        coinsUsed: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const history = orders.map((o) => ({
      orderId: o.id,
      orderNumber: o.orderNumber,
      type: o.coinsUsed > 0 ? ('USED' as const) : ('EARNED' as const),
      amount: o.coinsUsed > 0 ? -o.coinsUsed : Math.floor(o.total * 0.02),
      createdAt: o.createdAt,
    }));

    return { data: { balance: user.loyaltyCoins, history } };
  }

  // ─── Orders alias ─────────────────────────────────────────────────────────

  async getOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: { nameUz: true, nameRu: true, images: true, slug: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: orders };
  }

  // ─── Referral ─────────────────────────────────────────────────────────────

  async getReferral(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });
    if (!user) throw new HttpException('Foydalanuvchi topilmadi', HttpStatus.NOT_FOUND);

    const referralCount = await this.prisma.user.count({
      where: { referredById: userId },
    });

    return {
      data: {
        referralCode: user.referralCode,
        referralCount,
        referralUrl: `https://giftlandiya.uz?ref=${user.referralCode}`,
      },
    };
  }

  // ─── Gift Calendar ────────────────────────────────────────────────────────

  async getGiftCalendar(userId: string) {
    const events = await this.prisma.giftCalendar.findMany({
      where: { userId },
      orderBy: { eventDate: 'asc' },
    });
    return { data: events };
  }

  async addGiftCalendarEvent(userId: string, dto: CreateGiftCalendarDto) {
    const event = await this.prisma.giftCalendar.create({
      data: {
        userId,
        personName: dto.personName,
        eventType: dto.eventType,
        eventDate: new Date(dto.eventDate),
        budget: dto.budget,
      },
    });
    return { data: event };
  }

  async updateGiftCalendarEvent(
    userId: string,
    eventId: string,
    dto: UpdateGiftCalendarDto,
  ) {
    const existing = await this.prisma.giftCalendar.findFirst({
      where: { id: eventId, userId },
    });
    if (!existing) throw new HttpException('Tadbir topilmadi', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.giftCalendar.update({
      where: { id: eventId },
      data: {
        personName: dto.personName,
        eventType: dto.eventType,
        budget: dto.budget,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      },
    });
    return { data: updated };
  }

  async deleteGiftCalendarEvent(userId: string, eventId: string) {
    const existing = await this.prisma.giftCalendar.findFirst({
      where: { id: eventId, userId },
    });
    if (!existing) throw new HttpException('Tadbir topilmadi', HttpStatus.NOT_FOUND);

    await this.prisma.giftCalendar.delete({ where: { id: eventId } });
    return { data: { success: true } };
  }
}
