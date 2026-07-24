import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DutyAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    teamId: string;
    employeeId: string;
    start: Date;
    end: Date;
  }) {
    return this.prisma.dutyAssignment.create({
      data,
      include: {
        team: true,
        employee: true,
      },
    });
  }

  findAll() {
    return this.prisma.dutyAssignment.findMany({
      include: {
        team: true,
        employee: true,
      },
      orderBy: {
        start: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.dutyAssignment.findUnique({
      where: { id },
      include: {
        team: true,
        employee: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.dutyAssignment.delete({
      where: { id },
    });
  }
}
