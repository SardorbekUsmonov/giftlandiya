import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma.service';
import { AdminUpdateSellerDto } from './dto/admin-update-seller.dto';
import { RegisterSellerDto } from './dto/register-seller.dto';
import { ResetSellerPasswordDto } from './dto/reset-seller-password.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

@Injectable()
export class SellersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(userId: string, dto: RegisterSellerDto) {
    const existing = await this.prisma.seller.findUnique({ where: { userId } });
    if (existing) {
      throw new HttpException('Siz allaqachon sotuvchisiz', HttpStatus.CONFLICT);
    }

    const seller = await this.prisma.$transaction(async (tx) => {
      const created = await tx.seller.create({
        data: { userId, shopName: dto.shopName, description: dto.description },
      });
      await tx.user.update({
        where: { id: userId },
        data: { role: 'SELLER' },
      });
      return created;
    });

    return { data: seller };
  }

  // ─── Seller profile ───────────────────────────────────────────────────────

  async getProfile(userId: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
      },
    });
    if (!seller) throw new HttpException('Seller profili topilmadi', HttpStatus.NOT_FOUND);

    const stats = await this.computeStats(seller.id);
    return { data: { ...seller, stats } };
  }

  async updateProfile(userId: string, dto: UpdateSellerProfileDto) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new HttpException('Seller profili topilmadi', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.seller.update({
      where: { id: seller.id },
      data: dto,
    });
    return { data: updated };
  }

  async getStats(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new HttpException('Seller profili topilmadi', HttpStatus.NOT_FOUND);

    const stats = await this.computeStats(seller.id);
    return { data: stats };
  }

  async getLeaderboard() {
    const monthStart = this.monthStart();

    const sellers = await this.prisma.seller.findMany({
      where: { isActive: true },
      include: { user: { select: { name: true } } },
    });

    // One query for all monthly revenues
    const revenues = await this.prisma.order.groupBy({
      by: ['sellerId'],
      where: {
        sellerId: { not: null },
        status: { notIn: ['CANCELLED', 'RETURNED'] as OrderStatus[] },
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    });

    const revenueMap = new Map(
      revenues.map((r) => [r.sellerId!, r._sum.total ?? 0]),
    );

    const ranked = sellers
      .map((s) => ({
        id: s.id,
        shopName: s.shopName,
        sellerName: s.user.name,
        monthlyRevenue: revenueMap.get(s.id) ?? 0,
        monthlyTarget: s.monthlyTarget,
      }))
      .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
      .map((s, i) => ({ ...s, rank: i + 1 }));

    return { data: ranked };
  }

  // ─── Admin ────────────────────────────────────────────────────────────────

  async adminListSellers(page = 1, limit = 20) {
    const monthStart = this.monthStart();

    const [sellers, total] = await Promise.all([
      this.prisma.seller.findMany({
        include: {
          user: { select: { id: true, name: true, phone: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      this.prisma.seller.count(),
    ]);

    const revenues = await this.prisma.order.groupBy({
      by: ['sellerId'],
      where: {
        sellerId: { in: sellers.map((s) => s.id) },
        status: { notIn: ['CANCELLED', 'RETURNED'] as OrderStatus[] },
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    });

    const revenueMap = new Map(revenues.map((r) => [r.sellerId!, r._sum.total ?? 0]));

    const enriched = sellers.map((s) => ({
      ...s,
      monthlySales: revenueMap.get(s.id) ?? 0,
    }));

    return { data: enriched, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async adminUpdateSeller(sellerId: string, dto: AdminUpdateSellerDto) {
    const seller = await this.prisma.seller.findUnique({ where: { id: sellerId } });
    if (!seller) throw new HttpException('Seller topilmadi', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.seller.update({
      where: { id: sellerId },
      data: dto,
    });
    return { data: updated };
  }

  async adminResetPassword(sellerId: string, dto: ResetSellerPasswordDto) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: sellerId },
    });
    if (!seller) throw new HttpException('Seller topilmadi', HttpStatus.NOT_FOUND);

    const hash = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: seller.userId },
      data: { passwordHash: hash },
    });
    return { data: { success: true } };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private monthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private async computeStats(sellerId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = this.monthStart();

    const excludeStatuses: OrderStatus[] = ['CANCELLED', 'RETURNED'];
    const nonFinal = { notIn: excludeStatuses };

    const [todayAgg, monthAgg, allRevenues, seller] = await Promise.all([
      this.prisma.order.aggregate({
        where: { sellerId, status: nonFinal, createdAt: { gte: todayStart } },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.order.aggregate({
        where: { sellerId, status: nonFinal, createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: { id: true },
      }),
      this.prisma.order.groupBy({
        by: ['sellerId'],
        where: {
          sellerId: { not: null },
          status: nonFinal,
          createdAt: { gte: monthStart },
        },
        _sum: { total: true },
      }),
      this.prisma.seller.findUnique({
        where: { id: sellerId },
        select: { monthlyTarget: true },
      }),
    ]);

    const myRevenue = monthAgg._sum.total ?? 0;
    const rank = allRevenues.filter((r) => (r._sum.total ?? 0) > myRevenue).length + 1;
    const target = seller?.monthlyTarget ?? 0;

    return {
      todaySales: todayAgg._sum.total ?? 0,
      todayOrders: todayAgg._count.id,
      monthlySales: myRevenue,
      monthlyOrders: monthAgg._count.id,
      monthlyTarget: target,
      targetPercent: target > 0 ? Math.round((myRevenue / target) * 100) : 0,
      rank,
      totalSellers: allRevenues.length,
    };
  }
}
