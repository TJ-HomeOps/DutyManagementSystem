import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DutyRuleType, Weekday } from '@prisma/client';

const WEEKDAY_BY_JS_DAY: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

const ROTATION_ANCHOR = new Date(2026, 0, 1);
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export interface RosterDayPlan {
  date: string;
  weekday: Weekday;
  ruleType: DutyRuleType | null;
  ruleEmployeeId: string | null;
  ruleEmployeeName: string | null;
  existingAssignmentId: string | null;
  existingEmployeeId: string | null;
  existingEmployeeName: string | null;
  isHoliday: boolean;
  holidayName: string | null;
  holidayEmployeeName: string | null;
  status: 'existing' | 'planned' | 'unassigned' | 'holiday';
}

function dayBounds(year: number, month: number, day: number) {
  return {
    start: new Date(year, month - 1, day, 0, 0, 0, 0),
    end: new Date(year, month - 1, day, 23, 59, 59, 999),
  };
}

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

@Injectable()
export class RosterService {
  constructor(private readonly prisma: PrismaService) {}

  async computeMonthPlan(
    teamId: string,
    year: number,
    month: number,
  ): Promise<RosterDayPlan[]> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = dayBounds(year, month, 1).start;
    const monthEnd = dayBounds(year, month, daysInMonth).end;

    const [rules, members, existingAssignments, holidays] =
      await Promise.all([
        this.prisma.dutyRule.findMany({
          where: { teamId, active: true },
          include: { employee: true },
        }),
        this.prisma.employee.findMany({
          where: { teamId },
          orderBy: { name: 'asc' },
        }),
        this.prisma.dutyAssignment.findMany({
          where: {
            teamId,
            start: { lte: monthEnd },
            end: { gte: monthStart },
          },
          include: { employee: true },
        }),
        this.prisma.holiday.findMany({
          where: {
            startDate: { lte: monthEnd },
            endDate: { gte: monthStart },
          },
          include: { employee: true },
        }),
      ]);

    const rulesByWeekday = new Map(
      rules.map((rule) => [rule.weekday, rule]),
    );

    const existingByDate = new Map(
      existingAssignments.map((assignment) => [
        dateKey(
          assignment.start.getFullYear(),
          assignment.start.getMonth() + 1,
          assignment.start.getDate(),
        ),
        assignment,
      ]),
    );

    const holidaysWithKeys = holidays.map((holiday) => ({
      ...holiday,
      startKey: dateKey(
        holiday.startDate.getFullYear(),
        holiday.startDate.getMonth() + 1,
        holiday.startDate.getDate(),
      ),
      endKey: dateKey(
        holiday.endDate.getFullYear(),
        holiday.endDate.getMonth() + 1,
        holiday.endDate.getDate(),
      ),
    }));

    const globalHolidays = holidaysWithKeys.filter(
      (holiday) => !holiday.employeeId,
    );
    const personalHolidays = holidaysWithKeys.filter(
      (holiday) => holiday.employeeId,
    );

    const plan: RosterDayPlan[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const weekday = WEEKDAY_BY_JS_DAY[date.getDay()];
      const key = dateKey(year, month, day);
      const rule = rulesByWeekday.get(weekday);
      const existing = existingByDate.get(key);

      let ruleEmployeeId: string | null = null;
      let ruleEmployeeName: string | null = null;

      if (rule?.ruleType === DutyRuleType.FIXED) {
        ruleEmployeeId = rule.employeeId;
        ruleEmployeeName = rule.employee?.name ?? null;
      } else if (rule?.ruleType === DutyRuleType.ROTATION) {
        if (members.length > 0) {
          const weekIndex = Math.floor(
            (date.getTime() - ROTATION_ANCHOR.getTime()) /
              MS_PER_WEEK,
          );
          const index =
            ((weekIndex % members.length) + members.length) %
            members.length;

          ruleEmployeeId = members[index].id;
          ruleEmployeeName = members[index].name;
        }
      }

      const globalHoliday = globalHolidays.find(
        (holiday) =>
          key >= holiday.startKey && key <= holiday.endKey,
      );
      const personalHoliday = ruleEmployeeId
        ? personalHolidays.find(
            (holiday) =>
              holiday.employeeId === ruleEmployeeId &&
              key >= holiday.startKey &&
              key <= holiday.endKey,
          )
        : undefined;
      const holiday = globalHoliday ?? personalHoliday;

      if (holiday) {
        ruleEmployeeId = null;
        ruleEmployeeName = null;
      }

      plan.push({
        date: key,
        weekday,
        ruleType: rule?.ruleType ?? null,
        ruleEmployeeId,
        ruleEmployeeName,
        existingAssignmentId: existing?.id ?? null,
        existingEmployeeId: existing?.employeeId ?? null,
        existingEmployeeName: existing?.employee.name ?? null,
        isHoliday: !!holiday,
        holidayName: holiday?.name ?? null,
        holidayEmployeeName:
          !globalHoliday && personalHoliday
            ? (personalHoliday.employee?.name ?? null)
            : null,
        status: existing
          ? 'existing'
          : holiday
            ? 'holiday'
            : ruleEmployeeId
              ? 'planned'
              : 'unassigned',
      });
    }

    return plan;
  }

  async preview(teamId: string, year: number, month: number) {
    return this.computeMonthPlan(teamId, year, month);
  }

  async generate(
    teamId: string,
    year: number,
    month: number,
    overwrite: boolean,
  ) {
    const plan = await this.computeMonthPlan(teamId, year, month);

    const created: RosterDayPlan[] = [];
    const updated: RosterDayPlan[] = [];
    const skipped: RosterDayPlan[] = [];

    for (const day of plan) {
      if (!day.ruleEmployeeId) {
        skipped.push(day);
        continue;
      }

      if (day.existingAssignmentId) {
        if (
          !overwrite ||
          day.existingEmployeeId === day.ruleEmployeeId
        ) {
          skipped.push(day);
          continue;
        }

        await this.prisma.dutyAssignment.update({
          where: { id: day.existingAssignmentId },
          data: { employeeId: day.ruleEmployeeId },
        });

        updated.push(day);
        continue;
      }

      const [yearStr, monthStr, dayStr] = day.date
        .split('-')
        .map(Number);
      const { start, end } = dayBounds(yearStr, monthStr, dayStr);

      await this.prisma.dutyAssignment.create({
        data: {
          teamId,
          employeeId: day.ruleEmployeeId,
          start,
          end,
          notes: `Auto-generated (${day.ruleType})`,
        },
      });

      created.push(day);
    }

    return {
      created,
      updated,
      skipped,
    };
  }
}
