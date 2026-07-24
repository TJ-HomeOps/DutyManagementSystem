import { IsNotEmpty, IsString } from 'class-validator';

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
}
