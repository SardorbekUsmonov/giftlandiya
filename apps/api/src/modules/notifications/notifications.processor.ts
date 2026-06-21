import { OnQueueFailed, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EskizService } from './eskiz.service';
import { TelegramService } from './telegram.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly eskizService: EskizService,
    private readonly telegramService: TelegramService,
  ) {}

  @Process('send_sms')
  async handleSms(job: Job<{ phone: string; message: string }>) {
    await this.eskizService.sendSms(job.data.phone, job.data.message);
  }

  @Process('send_telegram')
  async handleTelegram(job: Job<{ chatId?: string; text: string }>) {
    if (job.data.chatId) {
      await this.telegramService.sendToChat(job.data.chatId, job.data.text);
    } else {
      await this.telegramService.sendToAdmin(job.data.text);
    }
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job "${job.name}" #${job.id} failed: ${err.message}`);
  }
}
