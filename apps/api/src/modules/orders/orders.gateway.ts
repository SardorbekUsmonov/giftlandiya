import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: '/orders' })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(OrdersGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`WS connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:admin')
  handleJoinAdmin(client: Socket) {
    client.join('admin');
    return { event: 'joined', data: 'admin' };
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(client: Socket, orderId: string) {
    client.join(`order:${orderId}`);
    return { event: 'joined', data: `order:${orderId}` };
  }

  notifyNewOrder(order: Record<string, unknown>) {
    this.server?.to('admin').emit('order:new', order);
  }

  notifyStatusChange(orderId: string, status: string) {
    this.server?.to(`order:${orderId}`).emit('order:status', { orderId, status });
  }
}
