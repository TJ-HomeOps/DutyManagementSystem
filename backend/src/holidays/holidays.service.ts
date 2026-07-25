import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HolidaysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    startDate: Date;
    endDate: Date;
    name: string;
    employeeId?: string | null;
  }) {
    const employeeId = data.employeeId ?? null;

    if (data.endDate < data.startDate) {
      throw new BadRequestException(
        'End date cannot be before start date.',
      );
    }

    const overlapping = await this.prisma.holiday.findFirst({
      where: {
        employeeId,
        startDate: { lte: data.endDate },
        endDate: { gte: data.startDate },
      },
    });

    if (overlapping) {
      throw new ConflictException(
        employeeId
          ? 'This employee already has an overlapping holiday.'
          : 'An overlapping company-wide holiday already exists.',
      );
    }

    return this.prisma.holiday.create({
      data: {
        startDate: data.startDate,
        endDate: data.endDate,
        name: data.name,
        employeeId,
      },
      include: { employee: { include: { team: true } } },
    });
  }

  findAll(employeeId?: string) {
    return this.prisma.holiday.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: { employee: { include: { team: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  findRange(start: Date, end: Date) {
    return this.prisma.holiday.findMany({
      where: {
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: { employee: { include: { team: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async findOne(id: string) {
    const holiday = await this.prisma.holiday.findUnique({
      where: { id },
      include: { employee: { include: { team: true } } },
    });

    if (!holiday) {
      throw new NotFoundException('Holiday not found.');
    }

    return holiday;
  }

  async update(
    id: string,
    data: {
      startDate?: Date;
      endDate?: Date;
      name?: string;
      employeeId?: string | null;
    },
  ) {
    const existing = await this.findOne(id);

    const startDate = data.startDate ?? existing.startDate;
    const endDate = data.endDate ?? existing.endDate;

    if (endDate < startDate) {
      throw new BadRequestException(
        'End date cannot be before start date.',
      );
    }

    return this.prisma.holiday.update({
      where: { id },
      data: { ...data, startDate, endDate },
      include: { employee: { include: { team: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.holiday.delete({
      where: { id },
    });
  }
}
