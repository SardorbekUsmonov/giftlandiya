import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ClickService {
  private readonly logger = new Logger(ClickService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  getPaymentUrl(orderId: string, amount: number): string {
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID', '');
    const merchantUserId = this.config.get<string>(
      'CLICK_MERCHANT_USER_ID',
      '',
    );
    return (
      `https://my.click.uz/services/pay` +
      `?service_id=${serviceId}` +
      `&merchant_id=${merchantUserId}` +
      `&amount=${amount}` +
      `&transaction_param=${orderId}` +
      `&return_url=https://giftlandiya.uz/checkout/success`
    );
  }

  async prepare(body: any) {
    if (!this.verifySign(body)) {
      return { error: -1, error_note: 'SIGN CHECK FAILED' };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: body.merchant_trans_id },
    });

    if (!order) return { error: -5, error_note: 'ORDER NOT FOUND' };

    if (Number(body.amount) !== order.total) {
      return { error: -2, error_note: 'WRONG AMOUNT' };
    }

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: 'CLICK',
        amount: order.total,
        transactionId: String(body.click_trans_id),
        status: 'PENDING',
      },
      update: {
        transactionId: String(body.click_trans_id),
        status: 'PENDING',
      },
    });

    return {
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id,
      merchant_prepare_id: body.click_trans_id,
      error: 0,
      error_note: 'Success',
    };
  }

  async complete(body: any) {
    if (!this.verifySign(body)) {
      return { error: -1, error_note: 'SIGN CHECK FAILED' };
    }

    if (Number(body.error) < 0) {
      await this.prisma.payment.updateMany({
        where: {
          transactionId: String(body.click_trans_id),
          provider: 'CLICK',
        },
        data: { status: 'FAILED' },
      });

      try {
        await this.ordersService.cancelOrder(
          body.merchant_trans_id,
          'Click: to\'lov bekor qilindi',
        );
      } catch (err: any) {
        this.logger.warn(`cancelOrder after Click error: ${err.message}`);
      }

      return {
        click_trans_id: body.click_trans_id,
        merchant_trans_id: body.merchant_trans_id,
        error: 0,
        error_note: 'Success',
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: body.merchant_trans_id },
    });

    if (!order) return { error: -5, error_note: 'ORDER NOT FOUND' };

    await this.prisma.payment.updateMany({
      where: {
        transactionId: String(body.click_trans_id),
        provider: 'CLICK',
      },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await this.ordersService.confirmOrder(order.id);

    return {
      click_trans_id: body.click_trans_id,
      merchant_trans_id: body.merchant_trans_id,
      merchant_confirm_id: body.click_trans_id,
      error: 0,
      error_note: 'Success',
    };
  }

  private verifySign(body: any): boolean {
    const secret = this.config.get<string>('CLICK_SECRET', '');
    const signStr = [
      body.click_trans_id,
      body.service_id,
      secret,
      body.merchant_trans_id,
      body.amount,
      body.action,
    ].join('');
    const expected = createHash('md5').update(signStr).digest('hex');
    return body.sign_string === expected;
  }
}
