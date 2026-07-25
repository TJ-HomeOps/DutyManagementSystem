import {
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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

  // Capped at 28 so the period start date is guaranteed to exist in every
  // month, including February, without date rollover.
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  payPeriodStartDay?: number;
}
