import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly adminChatId: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.adminChatId = this.config.get<string>('TELEGRAM_ADMIN_CHAT_ID', '');
  }

  async sendToAdmin(text: string): Promise<void> {
    return this.sendToChat(this.adminChatId, text);
  }

  async sendToChat(chatId: string, text: string): Promise<void> {
    if (!this.botToken || !chatId) {
      this.logger.warn('Telegram not configured — skipping message');
      return;
    }

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        { chat_id: chatId, text, parse_mode: 'HTML' },
      );
    } catch (err: any) {
      this.logger.error(`Telegram send to ${chatId} failed: ${err.message}`);
    }
  }
}
