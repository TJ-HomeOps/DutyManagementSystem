import { IsHexColor, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
