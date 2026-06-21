import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderItemDto } from './dto/reorder-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree() {
    const categories = await this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: { _count: { select: { products: true } } },
              orderBy: { sortOrder: 'asc' },
            },
            _count: { select: { products: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((c) => this.mapCategory(c));
  }

  async getBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          include: { _count: { select: { products: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new HttpException('Kategoriya topilmadi', HttpStatus.NOT_FOUND);
    }

    return this.mapCategory(category);
  }

  async create(dto: CreateCategoryDto) {
    const slug = dto.slug ?? (await this.generateUniqueSlug(dto.nameUz));

    return this.prisma.category.create({
      data: {
        nameUz: dto.nameUz,
        nameRu: dto.nameRu,
        slug,
        image: dto.image,
        parentId: dto.parentId,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOrThrow(id);

    const data: any = { ...dto };
    if (dto.nameUz && !dto.slug) {
      data.slug = await this.generateUniqueSlug(dto.nameUz, id);
    }

    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOrThrow(id);

    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new HttpException(
        `Bu kategoriyada ${productCount} ta mahsulot bor. Avval mahsulotlarni o'tkazing`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }

  async reorder(items: ReorderItemDto[]) {
    await this.prisma.$transaction(
      items.map(({ id, sortOrder }) =>
        this.prisma.category.update({ where: { id }, data: { sortOrder } }),
      ),
    );
    return { success: true, updated: items.length };
  }

  private async findOrThrow(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new HttpException('Kategoriya topilmadi', HttpStatus.NOT_FOUND);
    return cat;
  }

  private mapCategory(cat: any): any {
    const { _count, children, ...rest } = cat;
    return {
      ...rest,
      productCount: _count?.products ?? 0,
      ...(children !== undefined && {
        children: children.map((c: any) => this.mapCategory(c)),
      }),
    };
  }

  private async generateUniqueSlug(nameUz: string, excludeId?: string): Promise<string> {
    const base = nameUz
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.prisma.category.findUnique({ where: { slug: base } });

    if (!existing || existing.id === excludeId) return base;
    return `${base}-${Date.now().toString(36)}`;
  }
}
