import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('range')
  async getReport(
    @Query('teamId') teamId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    if (!teamId) {
      throw new BadRequestException(
        'teamId query parameter is required.',
      );
    }

    if (!start || !end) {
      throw new BadRequestException(
        'start and end query parameters are required.',
      );
    }

    return this.reportsService.getReport(teamId, start, end);
  }
}
