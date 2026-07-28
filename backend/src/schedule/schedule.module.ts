import { Module } from '@nestjs/common';

import { GraphModule } from '../graph/graph.module';
import { PrismaModule } from '../prisma/prisma.module';

import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [PrismaModule, GraphModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
