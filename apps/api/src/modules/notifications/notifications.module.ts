import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { EskizService } from './eskiz.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { TelegramService } from './telegram.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    EskizService,
    TelegramService,
    CronService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
