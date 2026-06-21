import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class CrmService {
  private readonly anthropic: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.config.get<string>('ANTHROPIC_API_KEY', '') });
  }

  async getCustomers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      role: 'CUSTOMER' as const,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          segment: true,
          loyaltyCoins: true,
          ltv: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true },
          },
        },
      }),
    ]);

    return {
      data: users.map(({ _count, orders, ...u }) => ({
        ...u,
        totalOrders: _count.orders,
        lastOrderAt: orders[0]?.createdAt ?? null,
      })),
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async getCustomerDetail(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true },
        },
        addresses: {
          select: { id: true, title: true, address: true, district: true, isDefault: true },
        },
      },
    });
    const { passwordHash: _pw, ...safe } = user as typeof user & { passwordHash?: string };
    return { data: safe };
  }

  async getCustomerInsight(id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        orders: {
          take: 20,
          include: {
            items: {
              include: {
                product: { select: { nameUz: true, occasions: true, forWhom: true } },
              },
            },
          },
        },
      },
    });

    const occasionCounts: Record<string, number> = {};
    for (const order of user.orders) {
      for (const item of order.items) {
        for (const occ of item.product?.occasions ?? []) {
          occasionCounts[occ] = (occasionCounts[occ] ?? 0) + 1;
        }
      }
    }
    const topOccasions = Object.entries(occasionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);

    const summary = {
      name: user.name,
      segment: user.segment,
      ltv: user.ltv,
      totalOrders: user.orders.length,
      loyaltyCoins: user.loyaltyCoins,
      topOccasions,
    };

    const msg = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Ushbu mijoz haqida qisqa tahlil yoz (3 jumla, o'zbek tilida, do'stona ohangda):
Mijoz: ${JSON.stringify(summary)}
Tahlilda: mijozning xarid odati, eng yaxshi segment sababini va keyingi marketing tavsiyasini yoz.`,
        },
      ],
    });

    const insight = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return { data: { insight } };
  }
}
