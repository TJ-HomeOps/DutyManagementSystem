import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DutyRulesService } from './duty-rules.service';
import { CreateDutyRuleDto } from './dto/create-duty-rule.dto';
import { UpdateDutyRuleDto } from './dto/update-duty-rule.dto';

@Controller('duty-rules')
export class DutyRulesController {
  constructor(private readonly dutyRulesService: DutyRulesService) {}

  @Post()
  create(@Body() dto: CreateDutyRuleDto) {
    return this.dutyRulesService.create(dto);
  }

  @Get()
  findAll() {
    return this.dutyRulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dutyRulesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDutyRuleDto,
  ) {
    return this.dutyRulesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dutyRulesService.remove(id);
  }
}
