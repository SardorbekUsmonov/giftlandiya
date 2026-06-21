import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../common/services/prisma.service';
import { EmbeddingsService } from '../ai/embeddings.service';
import { MeilisearchService } from '../search/meilisearch.service';
import { CreateProductDto } from './dto/create-product.dto';
import { FindAllProductsDto } from './dto/find-all-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly embeddings: EmbeddingsService,
  ) {}

  async findAll(dto: FindAllProductsDto) {
    const {
      search,
      page = 1,
      limit = 24,
      categoryId,
      minPrice,
      maxPrice,
      occasions,
      forWhom,
      sort = 'newest',
    } = dto;

    if (search) {
      return this.searchProducts(search);
    }

    const priceFilter: { gte?: number; lte?: number } = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;

    const where: any = {
      isActive: true,
      ...(categoryId && { categoryId }),
      ...(Object.keys(priceFilter).length && { price: priceFilter }),
      ...(occasions?.length && { occasions: { hasSome: occasions } }),
      ...(forWhom?.length && { forWhom: { hasSome: forWhom } }),
    };

    const orderByMap = {
      newest: { id: 'desc' as const },
      price_asc: { price: 'asc' as const },
      price_desc: { price: 'desc' as const },
      rating: { rating: 'desc' as const },
    };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy: orderByMap[sort],
        skip,
        take: limit,
        include: { category: { select: { id: true, nameUz: true, nameRu: true, slug: true } } },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  private async searchProducts(q: string) {
    const result = await this.meilisearch.search(q);
    return {
      data: result.hits,
      meta: {
        total: result.estimatedTotalHits ?? result.hits.length,
        page: 1,
        limit: 24,
        pages: 1,
      },
    };
  }

  async searchByQuery(q: string) {
    return this.searchProducts(q);
  }

  async semanticSearch(q: string, limit = 12) {
    const vector = await this.embeddings.generateEmbedding(q);
    const vectorStr = JSON.stringify(vector);
    const safeLimit = Math.max(1, Math.min(50, limit));

    const results = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT id, "nameUz", "nameRu", price, slug, images,
               1 - (embedding <=> ${vectorStr}::vector) AS similarity
        FROM "Product"
        WHERE "isActive" = true
          AND stock > 0
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${safeLimit}
      `,
    );

    return { data: results };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!product) {
      throw new HttpException('Mahsulot topilmadi', HttpStatus.NOT_FOUND);
    }

    const relatedProducts = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      orderBy: { rating: 'desc' },
    });

    return { data: { ...product, relatedProducts } };
  }

  async getBoughtTogether(productId: string) {
    const results = await this.prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT oi2."productId",
               COUNT(*) AS freq,
               p."nameUz", p."nameRu", p.price, p.slug, p.images
        FROM "OrderItem" oi1
        JOIN "OrderItem" oi2
          ON oi1."orderId" = oi2."orderId"
         AND oi2."productId" != oi1."productId"
        JOIN "Product" p ON p.id = oi2."productId"
        WHERE oi1."productId" = ${productId}
          AND p."isActive" = true
          AND p.stock > 0
        GROUP BY oi2."productId", p."nameUz", p."nameRu", p.price, p.slug, p.images
        ORDER BY freq DESC
        LIMIT 4
      `,
    );

    return { data: results };
  }

  async create(dto: CreateProductDto) {
    const slug = await this.generateUniqueSlug(dto.nameUz);
    const sku = dto.sku ?? `SKU-${randomBytes(4).toString('hex').toUpperCase()}`;

    const product = await this.prisma.product.create({
      data: {
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        descUz: dto.descUz,
        descRu: dto.descRu,
        price: dto.price,
        comparePrice: dto.comparePrice,
        stock: dto.stock ?? 0,
        images: dto.images,
        videoUrl: dto.videoUrl,
        model3dUrl: dto.model3dUrl,
        tags: dto.tags,
        occasions: dto.occasions,
        forWhom: dto.forWhom,
        categoryId: dto.categoryId,
        weight: dto.weight,
        slug,
        sku,
        barcode: dto.barcode,
      },
    });

    void this.meilisearch.indexProduct(this.toDocument(product));

    return { data: product };
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOrThrow(id);

    const product = await this.prisma.product.update({
      where: { id },
      data: dto as any,
    });

    void this.meilisearch.indexProduct(this.toDocument(product));

    return { data: product };
  }

  async remove(id: string) {
    await this.findOrThrow(id);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    void this.meilisearch.deleteProduct(id);

    return { success: true };
  }

  async bulkCreate(dtos: CreateProductDto[]) {
    const products = await Promise.all(dtos.map((dto) => this.create(dto)));
    return { data: products.map((p) => p.data), meta: { total: products.length } };
  }

  // ── Stock management ──────────────────────────────────────────────────────

  async getAvailableStock(productId: string): Promise<number> {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true, reserved: true },
    });
    return product.stock - product.reserved;
  }

  async incrementReserved(productId: string, qty: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { stock: true, reserved: true },
      });
      if (!product || product.stock - product.reserved < qty) {
        throw new HttpException('Yetarli ombor mavjud emas', HttpStatus.CONFLICT);
      }
      await tx.product.update({
        where: { id: productId },
        data: { reserved: { increment: qty } },
      });
    });
  }

  async decrementReserved(productId: string, qty: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: { reserved: { decrement: qty } },
    });
  }

  async decrementStock(productId: string, qty: number): Promise<void> {
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        stock: { decrement: qty },
        reserved: { decrement: qty },
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async findOrThrow(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new HttpException('Mahsulot topilmadi', HttpStatus.NOT_FOUND);
    return product;
  }

  private async generateUniqueSlug(nameUz: string, suffix = ''): Promise<string> {
    const base = nameUz
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const slug = suffix ? `${base}-${suffix}` : base;
    const existing = await this.prisma.product.findUnique({ where: { slug } });

    if (existing) {
      return this.generateUniqueSlug(nameUz, Date.now().toString(36));
    }
    return slug;
  }

  private toDocument(p: any) {
    return {
      id: p.id,
      nameUz: p.nameUz,
      nameRu: p.nameRu,
      slug: p.slug,
      price: p.price,
      comparePrice: p.comparePrice,
      categoryId: p.categoryId,
      tags: p.tags,
      occasions: p.occasions,
      forWhom: p.forWhom,
      rating: p.rating,
      stock: p.stock,
      isActive: p.isActive,
    };
  }
}
