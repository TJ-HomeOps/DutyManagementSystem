import { Module } from '@nestjs/common';

import { GraphModule } from '../graph/graph.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RosterController } from './roster.controller';
import { RosterService } from './roster.service';

@Module({
  imports: [NotificationsModule, GraphModule],
  controllers: [RosterController],
  providers: [RosterService],
})
export class RosterModule {}
