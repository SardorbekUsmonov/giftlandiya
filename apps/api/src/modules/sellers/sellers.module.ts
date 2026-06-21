import { Module } from '@nestjs/common';
import {
  AdminSellersController,
  SellerProfileController,
  SellersController,
} from './sellers.controller';
import { SellersService } from './sellers.service';

@Module({
  controllers: [SellersController, SellerProfileController, AdminSellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
