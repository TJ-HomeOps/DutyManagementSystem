import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsString()
  @IsNotEmpty()
  teamId!: string;

  // Matched against a Microsoft Entra login to auto-link that account to
  // this employee. IsOptional treats both null and undefined as "skip
  // validation", so an explicit null (clearing the field) is allowed too.
  @IsOptional()
  @IsEmail()
  email?: string | null;
}
