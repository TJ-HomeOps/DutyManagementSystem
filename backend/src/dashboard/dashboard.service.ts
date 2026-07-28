import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();

    const [
      employees,
      rules,
      assignments,
      teams,
      todaysAssignments,
      upcoming,
      holidaysToday,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.dutyRule.count(),
      this.prisma.dutyAssignment.count(),

      this.prisma.team.findMany({
        orderBy: { name: 'asc' },
      }),

      // One row per team, not findFirst() across all of them — with
      // multiple teams now real, a single global "who's on duty" record
      // is ambiguous (same class of bug already fixed on the Schedule
      // page).
      this.prisma.dutyAssignment.findMany({
        where: {
          start: { lte: now },
          end: { gt: now },
        },
        include: { employee: true, team: true },
      }),

      this.prisma.dutyAssignment.findMany({
        where: { start: { gt: now } },
        include: { employee: true, team: true },
        orderBy: { start: 'asc' },
        take: 10,
      }),

      this.prisma.holiday.findMany({
        where: {
          startDate: { lte: now },
          endDate: { gte: now },
        },
        include: { employee: true },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    const todayByTeamId = new Map(
      todaysAssignments.map((assignment) => [assignment.teamId, assignment]),
    );

    const todayDutyByTeam = teams.map((team) => {
      const assignment = todayByTeamId.get(team.id);

      return {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        employeeName: assignment?.employee.name ?? null,
      };
    });

    return {
      stats: {
        employees,
        teams: teams.length,
        rules,
        assignments,
      },
      todayDutyByTeam,
      holidaysToday: holidaysToday.map((holiday) => ({
        id: holiday.id,
        name: holiday.name,
        employeeName: holiday.employee?.name ?? null,
      })),
      upcoming: upcoming.map((assignment) => ({
        id: assignment.id,
        teamId: assignment.teamId,
        teamName: assignment.team.name,
        teamColor: assignment.team.color,
        employeeName: assignment.employee.name,
        start: assignment.start,
        end: assignment.end,
      })),
    };
  }
}
