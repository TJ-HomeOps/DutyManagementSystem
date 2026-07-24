import { Module } from '@nestjs/common';
import { DutyAssignmentsService } from './duty-assignments.service';
import { DutyAssignmentsController } from './duty-assignments.controller';

@Module({
  controllers: [DutyAssignmentsController],
  providers: [DutyAssignmentsService],
})
export class DutyAssignmentsModule {}
