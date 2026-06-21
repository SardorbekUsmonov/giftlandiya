import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Segment } from '@prisma/client';
import { PrismaService } from '../../common/services/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── Gift Calendar Reminders — 09:00 every day ────────────────────────────

  @Cron('0 9 * * *')
  async handleGiftCalendarReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7-day window
    const day7Start = new Date(today);
    day7Start.setDate(day7Start.getDate() + 7);
    const day7End = new Date(day7Start.getTime() + 24 * 3600 * 1000);

    const sevenDay = await this.prisma.giftCalendar.findMany({
      where: {
        reminded7d: false,
        eventDate: { gte: day7Start, lt: day7End },
      },
      include: { user: { select: { phone: true } } },
    });

    for (const event of sevenDay) {
      const msg =
        `Giftlandiya: ${event.personName} uchun ${event.eventType} 7 kun qoldi! ` +
        `Sovg'a tanlang: giftlandiya.uz`;
      await this.notifications.sendSms(event.user.phone, msg);
      await this.prisma.giftCalendar.update({
        where: { id: event.id },
        data: { reminded7d: true },
      });
    }

    // 1-day window
    const day1Start = new Date(today);
    day1Start.setDate(day1Start.getDate() + 1);
    const day1End = new Date(day1Start.getTime() + 24 * 3600 * 1000);

    const oneDay = await this.prisma.giftCalendar.findMany({
      where: {
        reminded1d: false,
        eventDate: { gte: day1Start, lt: day1End },
      },
      include: { user: { select: { phone: true } } },
    });

    for (const event of oneDay) {
      const msg =
        `Giftlandiya: Ertaga ${event.personName} uchun ${event.eventType}! ` +
        `Sovg'ani vaqtida yetkizamiz 🎁 giftlandiya.uz`;
      await this.notifications.sendSms(event.user.phone, msg);
      await this.prisma.giftCalendar.update({
        where: { id: event.id },
        data: { reminded1d: true },
      });
    }

    this.logger.log(
      `Gift reminders sent: 7d=${sevenDay.length}, 1d=${oneDay.length}`,
    );
  }

  // ─── Low Stock Alerts — 08:00 every day ──────────────────────────────────

  @Cron('0 8 * * *')
  async handleStockAlerts() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { nameUz: true, sku: true, stock: true, reserved: true },
    });

    const critical = products.filter((p) => p.stock - p.reserved <= 5);
    if (critical.length === 0) return;

    const lines = critical.map(
      (p) =>
        `• ${p.nameUz} (${p.sku}): ${p.stock - p.reserved} dona qoldi`,
    );
    const text = `⚠️ Kam qolgan mahsulotlar (${critical.length} ta):\n${lines.join('\n')}`;

    await this.notifications.sendTelegram(text);
    this.logger.log(`Stock alert sent for ${critical.length} products`);
  }

  // ─── Sleeping Customers Campaign — 10:00 every Monday ────────────────────

  @Cron('0 10 * * 1')
  async handleSleepingCustomers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const users = await this.prisma.user.findMany({
      where: {
        segment: Segment.ACTIVE,
        orders: {
          none: { createdAt: { gte: thirtyDaysAgo } },
        },
      },
      select: { id: true, phone: true },
    });

    if (users.length === 0) return;

    await this.prisma.user.updateMany({
      where: { id: { in: users.map((u) => u.id) } },
      data: { segment: Segment.SLEEPING },
    });

    for (const user of users) {
      const msg =
        `Giftlandiya: Sizni sog'inib qoldik! Bugun xarid qiling ` +
        `va maxsus chegirma oling 🎁 giftlandiya.uz`;
      await this.notifications.sendSms(user.phone, msg);
    }

    this.logger.log(
      `Sleeping customers: ${users.length} moved to SLEEPING and notified`,
    );
  }
}
