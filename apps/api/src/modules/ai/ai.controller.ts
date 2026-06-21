import { Body, Controller, Param, Post, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Public, Roles } from '../../common/decorators/roles.decorator';
import { AiService } from './ai.service';
import { EmbeddingsService } from './embeddings.service';
import { GiftAdvisorService } from './gift-advisor.service';
import { GiftAdvisorDto } from './dto/gift-advisor.dto';

// ─── Public: Gift Advisor SSE ─────────────────────────────────────────────────

@Controller('ai')
export class AiController {
  constructor(
    private readonly giftAdvisorService: GiftAdvisorService,
  ) {}

  @Public()
  @Post('gift-advisor')
  async giftAdvisor(
    @Body() dto: GiftAdvisorDto,
    @Res() reply: FastifyReply,
  ) {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    await this.giftAdvisorService.stream(dto.message, dto.sessionId, reply.raw);
  }
}

// ─── Admin: AI product tools ──────────────────────────────────────────────────

@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminAiController {
  constructor(
    private readonly aiService: AiService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  @Post('ai/generate-description')
  generateDescription(@Body('productId') productId: string) {
    return this.aiService.generateDescription(productId);
  }

  // Declared before :id route to prevent "index-all" being treated as an id
  @Post('products/index-all')
  async indexAll() {
    const indexed = await this.embeddingsService.indexAllProducts();
    return { data: { indexed } };
  }

  @Post('products/:id/generate-embedding')
  async generateEmbedding(@Param('id') id: string) {
    await this.embeddingsService.indexProduct(id);
    return { data: { success: true } };
  }
}
