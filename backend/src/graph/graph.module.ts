import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { GraphCalendarService } from './graph-calendar.service';

@Module({
  imports: [AuthModule],
  providers: [GraphCalendarService],
  exports: [GraphCalendarService],
})
export class GraphModule {}
