import { DutyRuleType, Weekday } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDutyRuleDto {
  @IsString()
  teamId: string;

  @IsEnum(Weekday)
  weekday: Weekday;

  @IsEnum(DutyRuleType)
  ruleType: DutyRuleType;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
