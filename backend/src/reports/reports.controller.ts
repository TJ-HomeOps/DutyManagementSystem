import { Controller, Get, Query } from '@nestjs/common';

import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  async getMonthlyReport(
    @Query('teamId') teamId: string,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    if (!teamId) {
      throw new Error('teamId query parameter is required.');
    }

    const y = Number(year);
    const m = Number(month);

    if (Number.isNaN(y) || Number.isNaN(m) || m < 1 || m > 12) {
      throw new Error('Invalid year or month supplied.');
    }

    return this.reportsService.getMonthlyReport(teamId, y, m);
  }
}
