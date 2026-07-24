import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ScheduleService } from './schedule.service';

@Controller('schedule')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
  ) {}

  @Get()
  async getAssignments(
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    if (!start || !end) {
      throw new Error(
        'Both start and end query parameters are required.',
      );
    }

    return this.scheduleService.getAssignments(
      new Date(start),
      new Date(end),
    );
  }

  @Get('month')
  async getMonth(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = Number(year);
    const m = Number(month);

    if (
      Number.isNaN(y) ||
      Number.isNaN(m) ||
      m < 1 ||
      m > 12
    ) {
      throw new Error(
        'Invalid year or month supplied.',
      );
    }

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0);

    end.setHours(23, 59, 59, 999);

    return this.scheduleService.getAssignments(
      start,
      end,
    );
  }

  @Post()
  async createAssignment(
    @Body()
    body: {
      teamId: string;
      employeeId: string;
      start: string;
      end: string;
      notes?: string;
    },
  ) {
    return this.scheduleService.createAssignment({
      teamId: body.teamId,
      employeeId: body.employeeId,
      start: new Date(body.start),
      end: new Date(body.end),
      notes: body.notes,
    });
  }

  @Patch(':id')
  async updateAssignment(
    @Param('id') id: string,
    @Body()
    body: {
      teamId?: string;
      employeeId?: string;
      start?: string;
      end?: string;
      notes?: string;
    },
  ) {
    return this.scheduleService.updateAssignment(
      id,
      {
        teamId: body.teamId,
        employeeId: body.employeeId,
        start: body.start
          ? new Date(body.start)
          : undefined,
        end: body.end
          ? new Date(body.end)
          : undefined,
        notes: body.notes,
      },
    );
  }

  @Delete(':id')
  async deleteAssignment(
    @Param('id') id: string,
  ) {
    return this.scheduleService.deleteAssignment(
      id,
    );
  }
}
