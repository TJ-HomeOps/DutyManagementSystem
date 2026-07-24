import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { RosterService } from './roster.service';

@Controller('roster')
export class RosterController {
  constructor(private readonly rosterService: RosterService) {}

  @Get('preview')
  async preview(
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

    return this.rosterService.preview(teamId, y, m);
  }

  @Post('generate')
  async generate(
    @Body()
    body: {
      teamId: string;
      year: number;
      month: number;
      overwrite?: boolean;
    },
  ) {
    if (!body.teamId) {
      throw new Error('teamId is required.');
    }

    return this.rosterService.generate(
      body.teamId,
      Number(body.year),
      Number(body.month),
      Boolean(body.overwrite),
    );
  }
}
