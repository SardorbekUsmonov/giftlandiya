import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { MarketingService } from './marketing.service';

// ─── Admin: promo codes ───────────────────────────────────────────────────────

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/promo-codes')
export class AdminPromoController {
  constructor(private readonly marketingService: MarketingService) {}

  @Post()
  create(@Body() dto: CreatePromoCodeDto) {
    return this.marketingService.createPromoCode(dto);
  }

  @Get()
  list(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.marketingService.listPromoCodes(page, limit);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePromoCodeDto) {
    return this.marketingService.updatePromoCode(id, dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.marketingService.deactivatePromoCode(id);
  }
}

// ─── Public: validate promo code ─────────────────────────────────────────────

@Controller('promo-codes')
export class PromoController {
  constructor(private readonly marketingService: MarketingService) {}

  @Public()
  @Post('validate')
  validate(@Body() dto: ValidatePromoDto) {
    return this.marketingService.validatePromoCode(dto);
  }
}

// ─── Admin: review moderation ─────────────────────────────────────────────────

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listAll(
    @Query('isApproved') isApproved?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const approved = isApproved === undefined ? undefined : isApproved === 'true';
    return this.marketingService.adminListReviews(approved, page, limit);
  }

  @Post('approve/:id')
  approve(@Param('id') id: string) {
    return this.marketingService.approveReview(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketingService.deleteReview(id);
  }
}

// ─── Public: product reviews + submit ────────────────────────────────────────

@Controller()
export class ReviewsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Public()
  @Get('products/:slug/reviews')
  getProductReviews(
    @Param('slug') slug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.marketingService.getProductReviews(slug, page, limit);
  }

  @Post('reviews')
  submitReview(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.marketingService.submitReview(user.id, dto);
  }
}
