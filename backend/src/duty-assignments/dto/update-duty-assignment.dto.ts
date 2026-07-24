import { PartialType } from '@nestjs/mapped-types';
import { CreateDutyAssignmentDto } from './create-duty-assignment.dto';

export class UpdateDutyAssignmentDto extends PartialType(CreateDutyAssignmentDto) {}
