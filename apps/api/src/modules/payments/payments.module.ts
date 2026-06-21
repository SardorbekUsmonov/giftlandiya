import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { ClickService } from './click.service';
import { PaymeService } from './payme.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OrdersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymeService, ClickService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
