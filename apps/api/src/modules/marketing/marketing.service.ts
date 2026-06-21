import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoDto } from './dto/validate-promo.dto';

@Injectable()
export class MarketingService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Promo Codes ──────────────────────────────────────────────────────────

  async createPromoCode(dto: CreatePromoCodeDto) {
    const code = dto.code.toUpperCase().trim();

    const existing = await this.prisma.promoCode.findUnique({ where: { code } });
    if (existing) throw new HttpException('Bu kod allaqachon mavjud', HttpStatus.CONFLICT);

    const promo = await this.prisma.promoCode.create({
      data: {
        ...dto,
        code,
        minOrderValue: dto.minOrderValue ?? 0,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    return { data: promo };
  }

  async listPromoCodes(page = 1, limit = 20) {
    const [promos, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        orderBy: { id: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.promoCode.count(),
    ]);
    return { data: promos, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async updatePromoCode(id: string, dto: UpdatePromoCodeDto) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new HttpException('Promo kod topilmadi', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: {
        ...dto,
        code: dto.code ? dto.code.toUpperCase().trim() : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    return { data: updated };
  }

  async deactivatePromoCode(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new HttpException('Promo kod topilmadi', HttpStatus.NOT_FOUND);

    await this.prisma.promoCode.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: { success: true } };
  }

  async validatePromoCode(dto: ValidatePromoDto) {
    const code = dto.code.toUpperCase().trim();

    const promo = await this.prisma.promoCode.findFirst({
      where: {
        code,
        isActive: true,
        minOrderValue: { lte: dto.subtotal },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!promo || (promo.maxUses !== null && promo.usedCount >= promo.maxUses)) {
      throw new HttpException(
        'Promo kod topilmadi yoki muddati tugagan',
        HttpStatus.BAD_REQUEST,
      );
    }

    const discount =
      promo.discountType === 'PERCENT'
        ? Math.floor((dto.subtotal * promo.discountValue) / 100)
        : Math.min(promo.discountValue, dto.subtotal);

    return {
      data: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discount,
      },
    };
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────

  async getProductReviews(productSlug: string, page = 1, limit = 10) {
    const product = await this.prisma.product.findUnique({
      where: { slug: productSlug },
      select: { id: true },
    });
    if (!product) throw new HttpException('Mahsulot topilmadi', HttpStatus.NOT_FOUND);

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId: product.id, isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({
        where: { productId: product.id, isApproved: true },
      }),
    ]);

    return { data: reviews, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async submitReview(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, isActive: true },
      select: { id: true },
    });
    if (!product) throw new HttpException('Mahsulot topilmadi', HttpStatus.NOT_FOUND);

    const hasPurchased = await this.prisma.orderItem.findFirst({
      where: {
        productId: dto.productId,
        order: { userId, status: 'DELIVERED' },
      },
    });
    if (!hasPurchased) {
      throw new HttpException(
        "Baholash uchun mahsulotni xarid qilgan bo'lishingiz kerak",
        HttpStatus.FORBIDDEN,
      );
    }

    const alreadyReviewed = await this.prisma.review.findFirst({
      where: { productId: dto.productId, userId },
    });
    if (alreadyReviewed) {
      throw new HttpException('Siz bu mahsulotni allaqachon baholagansiz', HttpStatus.CONFLICT);
    }

    const review = await this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
        images: dto.images ?? [],
        isApproved: false,
      },
    });
    return { data: review };
  }

  async adminListReviews(isApproved?: boolean, page = 1, limit = 20) {
    const where = isApproved !== undefined ? { isApproved } : {};
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { name: true, phone: true } },
          product: { select: { nameUz: true, images: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);
    return { data: reviews, meta: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async approveReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpException('Sharh topilmadi', HttpStatus.NOT_FOUND);

    const updated = await this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });

    await this.recalculateRating(review.productId);
    return { data: updated };
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new HttpException('Sharh topilmadi', HttpStatus.NOT_FOUND);

    await this.prisma.review.delete({ where: { id } });
    await this.recalculateRating(review.productId);

    return { data: { success: true } };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async recalculateRating(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });
  }
}
