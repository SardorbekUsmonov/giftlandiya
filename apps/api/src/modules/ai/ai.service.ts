import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY', ''),
    });
  }

  async generateDescription(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: { select: { nameUz: true, nameRu: true } } },
    });
    if (!product) throw new HttpException('Mahsulot topilmadi', HttpStatus.NOT_FOUND);

    const prompt = `Ushbu mahsulot uchun SEO optimallashtirilgan tavsif yozing:
Mahsulot: ${product.nameUz} / ${product.nameRu}
Kategoriya: ${product.category.nameUz} / ${product.category.nameRu}
Narxi: ${product.price.toLocaleString('uz-UZ')} so'm
Teglar: ${product.tags.join(', ')}
Munosabatlar: ${product.occasions.join(', ')}
Kim uchun: ${product.forWhom.join(', ')}

Faqat JSON qaytaring, boshqa narsa yo'q:
{ "descUz": "100-150 so'z o'zbek tilida tavsif", "descRu": "100-150 so'z rus tilida tavsif" }`;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new HttpException('AI javob xatosi', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    let parsed: { descUz: string; descRu: string };
    try {
      // Strip markdown code fences if Claude wraps the JSON
      const jsonText = content.text.replace(/```(?:json)?\n?/g, '').trim();
      parsed = JSON.parse(jsonText);
    } catch {
      throw new HttpException('AI javob formati noto\'g\'ri', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { descUz: parsed.descUz, descRu: parsed.descRu },
    });

    return { data: { descUz: parsed.descUz, descRu: parsed.descRu } };
  }
}
