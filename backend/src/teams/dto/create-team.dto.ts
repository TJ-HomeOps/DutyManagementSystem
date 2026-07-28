import { Currency } from '@prisma/client';
import {
  IsEnum,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsHexColor()
  color?: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsInt()
  @Min(0)
  weekdayRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  weekendRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  holidayRate?: number;

  // UPN of the shared mailbox/M365 Group calendar this team's duty
  // assignments get pushed to.
  @IsOptional()
  @IsString()
  msCalendarUserId?: string;
}
