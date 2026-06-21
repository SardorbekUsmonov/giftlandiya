import { Module } from '@nestjs/common';
import { AdminAiController, AiController } from './ai.controller';
import { AiService } from './ai.service';
import { EmbeddingsService } from './embeddings.service';
import { GiftAdvisorService } from './gift-advisor.service';

@Module({
  controllers: [AiController, AdminAiController],
  providers: [AiService, EmbeddingsService, GiftAdvisorService],
  exports: [AiService, EmbeddingsService],
})
export class AiModule {}
