import { Module } from '@nestjs/common';
import {
  AdminPromoController,
  AdminReviewsController,
  PromoController,
  ReviewsController,
} from './marketing.controller';
import { MarketingService } from './marketing.service';

@Module({
  controllers: [
    AdminPromoController,
    PromoController,
    AdminReviewsController,
    ReviewsController,
  ],
  providers: [MarketingService],
  exports: [MarketingService],
})
export class MarketingModule {}
