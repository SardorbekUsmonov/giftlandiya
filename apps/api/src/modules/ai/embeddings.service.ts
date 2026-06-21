import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private client: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  onModuleInit() {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY', ''),
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }

  async indexProduct(productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        nameUz: true,
        nameRu: true,
        tags: true,
        occasions: true,
        forWhom: true,
      },
    });

    if (!product) return;

    const text = [
      product.nameUz,
      product.nameRu,
      product.tags.join(' '),
      product.occasions.join(' '),
      product.forWhom.join(' '),
    ]
      .filter(Boolean)
      .join(' ');

    const vector = await this.generateEmbedding(text);

    await this.prisma.$executeRaw`
      UPDATE "Product"
      SET embedding = ${JSON.stringify(vector)}::vector
      WHERE id = ${productId}
    `;
  }

  async indexAllProducts(): Promise<number> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let indexed = 0;
    for (const product of products) {
      try {
        await this.indexProduct(product.id);
        indexed++;
      } catch (err: any) {
        this.logger.error(`Failed to index product ${product.id}: ${err.message}`);
      }
    }

    this.logger.log(`Indexed ${indexed}/${products.length} products`);
    return indexed;
  }
}
