import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { DutyAssignmentsService } from './duty-assignments.service';

@Controller('duty-assignments')
export class DutyAssignmentsController {
  constructor(
    private readonly dutyAssignmentsService: DutyAssignmentsService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      teamId: string;
      employeeId: string;
      start: Date;
      end: Date;
    },
  ) {
    return this.dutyAssignmentsService.create(body);
  }

  @Get()
  findAll() {
    return this.dutyAssignmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dutyAssignmentsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dutyAssignmentsService.remove(id);
  }
}
