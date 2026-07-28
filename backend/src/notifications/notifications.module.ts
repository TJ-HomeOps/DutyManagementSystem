import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { DutyReminderScheduler } from './duty-reminder.scheduler';
import { MailService } from './mail.service';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [MailService, DutyReminderScheduler],
  exports: [MailService],
})
export class NotificationsModule {}
