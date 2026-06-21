import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  async onNewOrder(order: any): Promise<void> {
    const text = [
      `🛍 Yangi buyurtma #${order.orderNumber}`,
      `👤 ${order.contactName} | 📞 ${order.contactPhone}`,
      `📍 ${order.address}`,
      `💰 ${Number(order.total).toLocaleString('uz-UZ')} so'm | 💳 ${order.paymentMethod ?? ''}`,
    ].join('\n');

    await this.queue.add('send_telegram', { text });
  }

  async onStatusChange(order: any, newStatus: string): Promise<void> {
    const smsMap: Record<string, string> = {
      CONFIRMED: `Giftlandiya: #${order.orderNumber} buyurtmangiz qabul qilindi! Kuzatish: giftlandiya.uz/track/${order.orderNumber}`,
      ON_COURIER: `Giftlandiya: #${order.orderNumber} buyurtmangiz yo'lda! Kuryer yaqinlashmoqda.`,
      DELIVERED: `Giftlandiya: #${order.orderNumber} buyurtmangiz topshirildi! Xaridingiz uchun rahmat 🎁`,
    };

    const message = smsMap[newStatus];
    if (message) {
      await this.queue.add('send_sms', {
        phone: order.contactPhone,
        message,
      });
    }
  }

  async sendSms(phone: string, message: string): Promise<void> {
    await this.queue.add('send_sms', { phone, message });
  }

  async sendTelegram(text: string): Promise<void> {
    await this.queue.add('send_telegram', { text });
  }
}
