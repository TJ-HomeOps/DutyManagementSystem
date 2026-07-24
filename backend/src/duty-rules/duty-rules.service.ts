import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDutyRuleDto } from './dto/create-duty-rule.dto';
import { UpdateDutyRuleDto } from './dto/update-duty-rule.dto';

@Injectable()
export class DutyRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDutyRuleDto) {
    const existing = await this.prisma.dutyRule.findFirst({
      where: {
        teamId: dto.teamId,
        weekday: dto.weekday,
      },
    });

    if (existing) {
      throw new ConflictException(
        'A rule already exists for this team and weekday.',
      );
    }

    return this.prisma.dutyRule.create({
      data: dto,
      include: {
        team: true,
        employee: true,
      },
    });
  }

  async findAll() {
    return this.prisma.dutyRule.findMany({
      include: {
        team: true,
        employee: true,
      },
      orderBy: [
        {
          team: {
            name: 'asc',
          },
        },
        {
          weekday: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.dutyRule.findUnique({
      where: { id },
      include: {
        team: true,
        employee: true,
      },
    });

    if (!rule) {
      throw new NotFoundException('Duty rule not found.');
    }

    return rule;
  }

  async update(id: string, dto: UpdateDutyRuleDto) {
    await this.findOne(id);

    return this.prisma.dutyRule.update({
      where: { id },
      data: dto,
      include: {
        team: true,
        employee: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.dutyRule.delete({
      where: { id },
    });
  }
}
