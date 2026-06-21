import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  getPaymentUrl(orderId: string, totalTiyin: number): string {
    const merchantId = this.config.get<string>('PAYME_MERCHANT_ID', '');
    const payload = Buffer.from(
      `m=${merchantId};ac.order_id=${orderId};a=${totalTiyin}`,
    ).toString('base64');
    return `https://checkout.paycom.uz/${payload}`;
  }

  async handle(body: any, authHeader: string): Promise<any> {
    if (!this.verifyAuth(authHeader)) {
      return this.rpcError(-32504, 'Insufficient privilege', body?.id);
    }

    const { method, params, id } = body ?? {};

    switch (method) {
      case 'CheckPerformTransaction':
        return this.checkPerformTransaction(params, id);
      case 'CreateTransaction':
        return this.createTransaction(params, id);
      case 'PerformTransaction':
        return this.performTransaction(params, id);
      case 'CancelTransaction':
        return this.cancelTransaction(params, id);
      case 'CheckTransaction':
        return this.checkTransaction(params, id);
      case 'GetStatement':
        return this.getStatement(params, id);
      default:
        return this.rpcError(-32601, 'Method not found', id);
    }
  }

  private verifyAuth(authHeader: string): boolean {
    const secret = this.config.get<string>('PAYME_SECRET', '');
    const expected =
      'Basic ' + Buffer.from(`Paycom:${secret}`).toString('base64');
    return authHeader === expected;
  }

  private async checkPerformTransaction(params: any, id: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: params?.account?.order_id },
    });

    if (!order) return this.rpcError(-31050, 'Order not found', id);
    if (params.amount !== order.total)
      return this.rpcError(-31001, 'Amount mismatch', id);

    return { jsonrpc: '2.0', id, result: { allow: true } };
  }

  private async createTransaction(params: any, id: any) {
    const order = await this.prisma.order.findUnique({
      where: { id: params?.account?.order_id },
    });

    if (!order) return this.rpcError(-31050, 'Order not found', id);
    if (params.amount !== order.total)
      return this.rpcError(-31001, 'Amount mismatch', id);

    const existing = await this.prisma.payment.findFirst({
      where: { orderId: order.id, status: 'PAID' },
    });
    if (existing) return this.rpcError(-31060, 'Already performed', id);

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        provider: 'PAYME',
        amount: params.amount,
        transactionId: String(params.id),
        status: 'PENDING',
      },
      update: { transactionId: String(params.id), status: 'PENDING' },
    });

    return {
      jsonrpc: '2.0',
      id,
      result: {
        transaction: String(params.id),
        state: 1,
        create_time: Date.now(),
      },
    };
  }

  private async performTransaction(params: any, id: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: String(params.id) },
    });

    if (!payment) return this.rpcError(-31003, 'Transaction not found', id);

    if (payment.status !== 'PAID') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await this.ordersService.confirmOrder(payment.orderId);
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        transaction: String(params.id),
        state: 2,
        perform_time: Date.now(),
      },
    };
  }

  private async cancelTransaction(params: any, id: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: String(params.id) },
    });

    if (!payment) return this.rpcError(-31003, 'Transaction not found', id);

    if (payment.status === 'PAID') {
      return this.rpcError(-31007, 'Cannot cancel performed transaction', id);
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });

    try {
      await this.ordersService.cancelOrder(payment.orderId, 'Payme: bekor qilindi');
    } catch (err: any) {
      this.logger.warn(`cancelOrder after Payme cancel: ${err.message}`);
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        transaction: String(params.id),
        state: -1,
        cancel_time: Date.now(),
      },
    };
  }

  private async checkTransaction(params: any, id: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: String(params.id) },
    });

    if (!payment) return this.rpcError(-31003, 'Transaction not found', id);

    const stateMap: Record<string, number> = {
      PENDING: 1,
      PAID: 2,
      FAILED: -1,
      REFUNDED: -1,
    };

    return {
      jsonrpc: '2.0',
      id,
      result: {
        transaction: String(params.id),
        state: stateMap[payment.status] ?? 0,
        create_time: payment.createdAt.getTime(),
        perform_time: payment.paidAt?.getTime() ?? 0,
        cancel_time:
          payment.status === 'FAILED' || payment.status === 'REFUNDED'
            ? Date.now()
            : 0,
      },
    };
  }

  private async getStatement(params: any, id: any) {
    const payments = await this.prisma.payment.findMany({
      where: {
        provider: 'PAYME',
        createdAt: {
          gte: new Date(params.from),
          lte: new Date(params.to),
        },
      },
    });

    const transactions = payments.map((p) => ({
      id: p.transactionId,
      time: p.createdAt.getTime(),
      amount: p.amount,
      account: { order_id: p.orderId },
      create_time: p.createdAt.getTime(),
      perform_time: p.paidAt?.getTime() ?? 0,
      cancel_time: 0,
      transaction: p.transactionId,
      state: p.status === 'PAID' ? 2 : p.status === 'PENDING' ? 1 : -1,
      reason: null,
    }));

    return { jsonrpc: '2.0', id, result: { transactions } };
  }

  private rpcError(code: number, message: string, id: any) {
    return { jsonrpc: '2.0', id, error: { code, message } };
  }
}
