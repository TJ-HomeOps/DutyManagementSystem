import { PartialType } from '@nestjs/mapped-types';
import { CreateDutyRuleDto } from './create-duty-rule.dto';

export class UpdateDutyRuleDto extends PartialType(CreateDutyRuleDto) {}
