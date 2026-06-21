import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(from?: string, to?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Date range for filtered queries (analytics page)
    const rangeFilter = from && to
      ? { gte: new Date(from), lte: new Date(to) }
      : undefined;

    const [todayAgg, todayOrders, newCustomers, weeklyRevenue, recentOrders, topProducts, allActive, paymentBreakdown, topCategories, utmSources] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: {
            createdAt: rangeFilter ?? { gte: startOfDay },
            status: { not: 'CANCELLED' },
          },
          _sum: { total: true },
        }),
        this.prisma.order.count({
          where: {
            createdAt: rangeFilter ?? { gte: startOfDay },
            status: { not: 'CANCELLED' },
          },
        }),
        this.prisma.user.count({
          where: {
            createdAt: rangeFilter ?? { gte: startOfDay },
            role: 'CUSTOMER',
          },
        }),
        this.buildRevenueSeries(from, to),
        this.prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            user: { select: { name: true, phone: true } },
          },
        }),
        this.getTopProducts(rangeFilter),
        this.prisma.product.findMany({
          where: { isActive: true },
          select: { id: true, nameUz: true, slug: true, stock: true, reserved: true },
        }),
        this.getPaymentBreakdown(rangeFilter),
        this.getTopCategories(rangeFilter),
        this.getUtmSources(rangeFilter),
      ]);

    const todayRevenue = todayAgg._sum.total ?? 0;
    const avgOrderValue = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;
    const stockAlerts = allActive
      .filter((p) => p.stock - p.reserved <= 5)
      .map((p) => ({ ...p, available: p.stock - p.reserved }));

    return {
      data: {
        todayRevenue,
        todayOrders,
        newCustomers,
        avgOrderValue,
        weeklyRevenue,
        recentOrders,
        topProducts,
        stockAlerts,
        paymentBreakdown,
        topCategories,
        utmSources,
      },
    };
  }

  private async buildRevenueSeries(from?: string, to?: string): Promise<Array<{ date: string; revenue: number }>> {
    const days: Array<{ date: string; revenue: number }> = [];
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 6 * 86400000);
    start.setHours(0, 0, 0, 0);

    const diffDays = Math.min(Math.ceil((end.getTime() - start.getTime()) / 86400000), 31);

    for (let i = 0; i < diffDays; i++) {
      const dayStart = new Date(start.getTime() + i * 86400000);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      const agg = await this.prisma.order.aggregate({
        where: { createdAt: { gte: dayStart, lte: dayEnd }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
      });
      days.push({
        date: dayStart.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' }),
        revenue: agg._sum.total ?? 0,
      });
    }
    return days;
  }

  private async getTopProducts(rangeFilter?: { gte: Date; lte: Date }) {
    const dateClause = rangeFilter
      ? Prisma.sql`AND o."createdAt" >= ${rangeFilter.gte} AND o."createdAt" <= ${rangeFilter.lte}`
      : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      Array<{ productId: string; nameUz: string; slug: string; revenue: bigint }>
    >(Prisma.sql`
      SELECT oi."productId", p."nameUz", p.slug,
             SUM(oi.price * oi.qty) AS revenue
      FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status != 'CANCELLED' ${dateClause}
      GROUP BY oi."productId", p."nameUz", p.slug
      ORDER BY revenue DESC
      LIMIT 5
    `);
    return rows.map((r) => ({ ...r, revenue: Number(r.revenue) }));
  }

  private async getPaymentBreakdown(rangeFilter?: { gte: Date; lte: Date }) {
    const dateClause = rangeFilter
      ? Prisma.sql`AND o."createdAt" >= ${rangeFilter.gte} AND o."createdAt" <= ${rangeFilter.lte}`
      : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      Array<{ method: string; revenue: bigint; count: bigint }>
    >(Prisma.sql`
      SELECT p.provider AS method,
             SUM(o.total) AS revenue,
             COUNT(o.id)  AS count
      FROM "Order" o
      JOIN "Payment" p ON p."orderId" = o.id
      WHERE o.status != 'CANCELLED' ${dateClause}
      GROUP BY p.provider
      ORDER BY revenue DESC
    `);
    return rows.map((r) => ({
      method: r.method,
      revenue: Number(r.revenue),
      count: Number(r.count),
    }));
  }

  private async getTopCategories(rangeFilter?: { gte: Date; lte: Date }) {
    const dateClause = rangeFilter
      ? Prisma.sql`AND o."createdAt" >= ${rangeFilter.gte} AND o."createdAt" <= ${rangeFilter.lte}`
      : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      Array<{ name: string; revenue: bigint }>
    >(Prisma.sql`
      SELECT c."nameUz" AS name, SUM(oi.price * oi.qty) AS revenue
      FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      JOIN "Category" c ON c.id = p."categoryId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status != 'CANCELLED' ${dateClause}
      GROUP BY c."nameUz"
      ORDER BY revenue DESC
      LIMIT 8
    `);
    return rows.map((r) => ({ name: r.name, revenue: Number(r.revenue) }));
  }

  private async getUtmSources(rangeFilter?: { gte: Date; lte: Date }) {
    const where = {
      status: { not: 'CANCELLED' as const },
      ...(rangeFilter ? { createdAt: rangeFilter } : {}),
    };
    const groups = await this.prisma.order.groupBy({
      by: ['utmSource'],
      where,
      _sum: { total: true },
      _count: { id: true },
    });
    const total = groups.reduce((s, g) => s + g._count.id, 0);
    return groups
      .sort((a, b) => (b._sum.total ?? 0) - (a._sum.total ?? 0))
      .map((g) => ({
        source: g.utmSource ?? '',
        orders: g._count.id,
        revenue: g._sum.total ?? 0,
        conversion: total > 0 ? Math.round((g._count.id / total) * 100) : 0,
      }));
  }
}
