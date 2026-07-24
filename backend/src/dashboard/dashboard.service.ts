import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();

    const [
      employees,
      teams,
      rules,
      assignments,
      todayDuty,
      upcoming,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.team.count(),
      this.prisma.dutyRule.count(),
      this.prisma.dutyAssignment.count(),

      this.prisma.dutyAssignment.findFirst({
        where: {
          start: {
            lte: now,
          },
          end: {
            gt: now,
          },
        },
        include: {
          employee: true,
          team: true,
        },
      }),

      this.prisma.dutyAssignment.findMany({
        where: {
          start: {
            gt: now,
          },
        },
        include: {
          employee: true,
          team: true,
        },
        orderBy: {
          start: 'asc',
        },
        take: 10,
      }),
    ]);

    return {
      stats: {
        employees,
        teams,
        rules,
        assignments,
      },
      todayDuty,
      upcoming,
    };
  }
}
