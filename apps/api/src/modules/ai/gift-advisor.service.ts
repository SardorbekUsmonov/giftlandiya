import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ServerResponse } from 'http';
import { RedisService } from '../../common/services/redis.service';
import { PrismaService } from '../../common/services/prisma.service';

const HISTORY_KEY = (sessionId: string) => `ai:chat:${sessionId}`;
const MAX_HISTORY = 10;
const HISTORY_TTL = 24 * 3600;

@Injectable()
export class GiftAdvisorService {
  private readonly logger = new Logger(GiftAdvisorService.name);
  private readonly client: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY', ''),
    });
  }

  async stream(message: string, sessionId: string, res: ServerResponse): Promise<void> {
    // 1. Load conversation history from Redis
    const rawHistory = await this.redis.lrange(HISTORY_KEY(sessionId), 0, -1);
    const history: Anthropic.MessageParam[] = rawHistory
      .map((h) => {
        try {
          return JSON.parse(h) as Anthropic.MessageParam;
        } catch {
          return null;
        }
      })
      .filter((h): h is Anthropic.MessageParam => h !== null)
      .slice(-MAX_HISTORY);

    history.push({ role: 'user', content: message });

    // 2. Fetch active in-stock products for the system prompt
    const products = await this.prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      select: {
        nameUz: true,
        nameRu: true,
        price: true,
        slug: true,
        occasions: true,
        forWhom: true,
        tags: true,
      },
      take: 50,
    });

    const systemPrompt = `Sen Giftlandiya.uz ning AI sovg'a maslahatchisisisan. O'zbekistonda ishlaysan.
Mavjud mahsulotlar: ${JSON.stringify(products)}
Qoidalar:
1. Birinchi marta: 2 savol ber (kim uchun va byudjet)
2. Yetarli ma'lumot bo'lsa: 3 mahsulot tavsiya qil
3. Har tavsiyada: mahsulot nomi, narxi (so'm formatida), 1 jumla izoh
4. O'zbek tilida yoz. Rus tilida so'ralsa rus tilida javob ber
5. Iliq va qisqa bo'l`;

    let fullResponse = '';

    try {
      const stream = await this.client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages: history,
        stream: true,
      });

      // 5. Stream each text chunk as SSE
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const text = event.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ token: text })}\n\n`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Gift advisor stream error: ${err.message}`);
      res.write(`data: ${JSON.stringify({ error: 'Xatolik yuz berdi' })}\n\n`);
    }

    // 6. Signal done
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    // 7. Persist history to Redis
    try {
      const key = HISTORY_KEY(sessionId);
      await this.redis.rpush(key, JSON.stringify({ role: 'user', content: message }));
      if (fullResponse) {
        await this.redis.rpush(key, JSON.stringify({ role: 'assistant', content: fullResponse }));
      }
      await this.redis.expire(key, HISTORY_TTL);
    } catch (err: any) {
      this.logger.warn(`Failed to persist chat history: ${err.message}`);
    }
  }
}
