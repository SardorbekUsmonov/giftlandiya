import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Roles } from '../../common/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Roles('ADMIN', 'SUPER_ADMIN', 'MODERATOR')
@Controller('admin')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly config: ConfigService,
  ) {}

  @Get('analytics/dashboard')
  getDashboard(@Query('from') from?: string, @Query('to') to?: string) {
    return this.analyticsService.getDashboard(from, to);
  }

  @Post('upload')
  async upload(@Req() req: FastifyRequest) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (req as any).file?.();
    if (!data) throw new BadRequestException('No file provided');

    const ext = (data.filename as string).split('.').pop()?.toLowerCase() ?? 'webp';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const dir = join(process.cwd(), 'uploads');
    mkdirSync(dir, { recursive: true });

    const chunks: Buffer[] = [];
    for await (const chunk of data.file as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    writeFileSync(join(dir, filename), Buffer.concat(chunks));

    const base =
      this.config.get<string>('R2_PUBLIC_URL') ??
      `http://localhost:${this.config.get<number>('PORT', 4000)}`;
    return { data: { url: `${base}/uploads/${filename}` } };
  }
}
