import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateEntraConfigDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  // Omitted (rather than empty string) means "keep the currently stored
  // secret" — the frontend never receives the real value back to resend.
  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsOptional()
  @IsString()
  redirectUri?: string;
}
