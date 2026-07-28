import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { RosterController } from './roster.controller';
import { RosterService } from './roster.service';

@Module({
  imports: [NotificationsModule],
  controllers: [RosterController],
  providers: [RosterService],
})
export class RosterModule {}
