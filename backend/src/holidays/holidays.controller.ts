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

import { HolidaysService } from './holidays.service';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  create(
    @Body()
    body: {
      startDate: string;
      endDate: string;
      name: string;
      employeeId?: string | null;
    },
  ) {
    return this.holidaysService.create({
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      name: body.name,
      employeeId: body.employeeId ?? null,
    });
  }

  @Get()
  findAll(
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    if (start && end) {
      return this.holidaysService.findRange(
        new Date(start),
        new Date(end),
      );
    }

    return this.holidaysService.findAll(employeeId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      startDate?: string;
      endDate?: string;
      name?: string;
      employeeId?: string | null;
    },
  ) {
    return this.holidaysService.update(id, {
      startDate: body.startDate
        ? new Date(body.startDate)
        : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      name: body.name,
      employeeId:
        body.employeeId === undefined
          ? undefined
          : body.employeeId,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
