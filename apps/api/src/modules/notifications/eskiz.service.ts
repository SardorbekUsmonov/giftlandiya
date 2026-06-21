import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from '../../common/services/redis.service';

const ESKIZ_TOKEN_KEY = 'eskiz:token';
const ESKIZ_BASE_URL = 'https://notify.eskiz.uz/api';
const ESKIZ_SENDER = '4546';

@Injectable()
export class EskizService {
  private readonly logger = new Logger(EskizService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async getToken(): Promise<string | null> {
    const cached = await this.redis.get(ESKIZ_TOKEN_KEY);
    if (cached) return cached;

    try {
      const { data } = await axios.post(`${ESKIZ_BASE_URL}/auth/login`, {
        email: this.config.get<string>('ESKIZ_EMAIL'),
        password: this.config.get<string>('ESKIZ_PASSWORD'),
      });

      const token: string = data?.data?.token;
      if (!token) throw new Error('Empty token in Eskiz response');

      // Cache for 29 days (token TTL is 30 days)
      await this.redis.set(ESKIZ_TOKEN_KEY, token, 29 * 24 * 3600);
      return token;
    } catch (err: any) {
      this.logger.error(`Eskiz auth failed: ${err.message}`);
      return null;
    }
  }

  async sendSms(phone: string, message: string): Promise<void> {
    const isDev = this.config.get<string>('NODE_ENV') !== 'production';

    if (isDev) {
      console.log(`\n[SMS DEV] To: ${phone}\nMessage: ${message}\n`);
      return;
    }

    const token = await this.getToken();
    if (!token) {
      this.logger.error('Cannot send SMS: Eskiz token unavailable');
      return;
    }

    // Eskiz requires phone without leading +
    const normalizedPhone = phone.replace(/^\+/, '');

    try {
      await axios.post(
        `${ESKIZ_BASE_URL}/message/sms/send`,
        { mobile_phone: normalizedPhone, message, from: ESKIZ_SENDER },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err: any) {
      this.logger.error(`SMS send to ${phone} failed: ${err.message}`);
      // Invalidate cached token on 401 so next attempt re-authenticates
      if (err.response?.status === 401) {
        await this.redis.del(ESKIZ_TOKEN_KEY);
      }
    }
  }
}
