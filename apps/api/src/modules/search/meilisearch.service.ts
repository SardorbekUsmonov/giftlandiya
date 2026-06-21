import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeiliSearch } from 'meilisearch';

interface ProductDocument {
  id: string;
  nameUz: string;
  nameRu: string;
  slug: string;
  price: number;
  comparePrice?: number;
  categoryId: string;
  tags: string[];
  occasions: string[];
  forWhom: string[];
  rating: number;
  stock: number;
  isActive: boolean;
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeiliSearch | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    try {
      this.client = new MeiliSearch({
        host: this.config.get<string>('MEILISEARCH_HOST', 'http://localhost:7700'),
        apiKey: this.config.get<string>('MEILISEARCH_KEY'),
      });
      void this.setupIndex();
    } catch (err: any) {
      this.logger.error(`Meilisearch init failed: ${err.message}`);
    }
  }

  private async setupIndex() {
    if (!this.client) return;

    try {
      await this.client.createIndex('products', { primaryKey: 'id' });
    } catch {
      // index already exists
    }

    try {
      await this.client.index('products').updateSettings({
        searchableAttributes: ['nameUz', 'nameRu', 'tags', 'occasions', 'forWhom'],
        filterableAttributes: [
          'categoryId',
          'price',
          'isActive',
          'occasions',
          'forWhom',
          'rating',
          'stock',
        ],
        sortableAttributes: ['price', 'rating'],
      });
      this.logger.log('Meilisearch "products" index configured');
    } catch (err: any) {
      this.logger.error(`Meilisearch settings error: ${err.message}`);
    }
  }

  async indexProduct(product: ProductDocument): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index('products').addDocuments([product]);
    } catch (err: any) {
      this.logger.error(`indexProduct failed: ${err.message}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.index('products').deleteDocument(id);
    } catch (err: any) {
      this.logger.error(`deleteProduct failed: ${err.message}`);
    }
  }

  async search(q: string, filters?: string, sort?: string[]) {
    if (!this.client) return { hits: [], estimatedTotalHits: 0 };
    try {
      return await this.client.index('products').search(q, {
        filter: filters,
        sort,
        limit: 24,
      });
    } catch (err: any) {
      this.logger.error(`search failed: ${err.message}`);
      return { hits: [], estimatedTotalHits: 0 };
    }
  }
}
