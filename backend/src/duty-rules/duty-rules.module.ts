import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

import { DutyRulesController } from './duty-rules.controller';
import { DutyRulesService } from './duty-rules.service';

@Module({
  imports: [PrismaModule],
  controllers: [DutyRulesController],
  providers: [DutyRulesService],
  exports: [DutyRulesService],
})
export class DutyRulesModule {}
