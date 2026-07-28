import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateNotificationsConfigDto {
  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  smtpHost?: string;

  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @IsOptional()
  @IsString()
  smtpUser?: string;

  // Omitted (rather than empty string) means "keep the currently stored
  // password" — mirrors UpdateEntraConfigDto's clientSecret handling.
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  // Not IsEmail: SMTP "from" is commonly "Display Name <address@host>".
  @IsOptional()
  @IsString()
  smtpFrom?: string;

  @IsOptional()
  @IsEmail()
  adminNotificationEmail?: string;
}
