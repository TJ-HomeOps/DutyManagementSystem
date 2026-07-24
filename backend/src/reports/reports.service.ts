import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { Weekday } from '@prisma/client';

const WEEKDAY_BY_JS_DAY: Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

export const WEEKDAY_RATE = 1250;
export const WEEKEND_RATE = 6000;
export const HOLIDAY_RATE = 2250;

export type PayLineType = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY';

export interface DailyDutyEntry {
  date: string;
  weekday: Weekday;
  employeeId: string;
  employeeName: string;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName: string | null;
}

export interface PayLine {
  type: PayLineType;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  amount: number;
}

export interface EmployeeSummary {
  employeeId: string;
  employeeName: string;
  daysWorked: number;
  totalPay: number;
}

export interface MonthlyReport {
  teamId: string;
  teamName: string;
  year: number;
  month: number;
  daysInMonth: number;
  dailyEntries: DailyDutyEntry[];
  payLines: PayLine[];
  employeeSummaries: EmployeeSummary[];
  totals: {
    daysCovered: number;
    totalPay: number;
  };
}

function isWeekendDay(jsDay: number): boolean {
  return jsDay === 5 || jsDay === 6 || jsDay === 0;
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}-${String(date.getDate()).padStart(
    2,
    '0',
  )}`;
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function isNextCalendarDay(
  fromKey: string,
  toKey: string,
): boolean {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const msPerDay = 24 * 60 * 60 * 1000;

  return Math.round((to.getTime() - from.getTime()) / msPerDay) === 1;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMonthlyReport(
    teamId: string,
    year: number,
    month: number,
  ): Promise<MonthlyReport> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const monthStart = new Date(
      year,
      month - 1,
      1,
      0,
      0,
      0,
      0,
    );
    const monthEnd = new Date(
      year,
      month - 1,
      daysInMonth,
      23,
      59,
      59,
      999,
    );

    const [assignments, holidays] = await Promise.all([
      this.prisma.dutyAssignment.findMany({
        where: {
          teamId,
          start: { lte: monthEnd },
          end: { gte: monthStart },
        },
        include: { employee: true },
        orderBy: { start: 'asc' },
      }),
      this.prisma.holiday.findMany({
        where: {
          employeeId: null,
          startDate: { lte: monthEnd },
          endDate: { gte: monthStart },
        },
      }),
    ]);

    const holidaysByDate = new Map<string, string>();

    for (const holiday of holidays) {
      const rangeStart = new Date(
        Math.max(
          holiday.startDate.getTime(),
          monthStart.getTime(),
        ),
      );
      const rangeEnd = new Date(
        Math.min(
          holiday.endDate.getTime(),
          monthEnd.getTime(),
        ),
      );

      const cursor = new Date(rangeStart);

      while (cursor <= rangeEnd) {
        holidaysByDate.set(dateKey(cursor), holiday.name);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    const dailyEntries: DailyDutyEntry[] = assignments.map(
      (assignment) => {
        const key = dateKey(assignment.start);
        const jsDay = assignment.start.getDay();

        return {
          date: key,
          weekday: WEEKDAY_BY_JS_DAY[jsDay],
          employeeId: assignment.employeeId,
          employeeName: assignment.employee.name,
          isWeekend: isWeekendDay(jsDay),
          isHoliday: holidaysByDate.has(key),
          holidayName: holidaysByDate.get(key) ?? null,
        };
      },
    );

    const byEmployee = new Map<string, DailyDutyEntry[]>();

    for (const entry of dailyEntries) {
      const list = byEmployee.get(entry.employeeId) ?? [];

      list.push(entry);
      byEmployee.set(entry.employeeId, list);
    }

    const payLines: PayLine[] = [];

    for (const entries of byEmployee.values()) {
      const sorted = [...entries].sort((a, b) =>
        a.date.localeCompare(b.date),
      );

      let i = 0;

      while (i < sorted.length) {
        const entry = sorted[i];

        if (entry.isWeekend) {
          let j = i;

          while (
            j + 1 < sorted.length &&
            sorted[j + 1].isWeekend &&
            isNextCalendarDay(
              sorted[j].date,
              sorted[j + 1].date,
            )
          ) {
            j++;
          }

          payLines.push({
            type: 'WEEKEND',
            employeeId: entry.employeeId,
            employeeName: entry.employeeName,
            startDate: sorted[i].date,
            endDate: sorted[j].date,
            amount: WEEKEND_RATE,
          });

          i = j + 1;
        } else {
          payLines.push({
            type: entry.isHoliday ? 'HOLIDAY' : 'WEEKDAY',
            employeeId: entry.employeeId,
            employeeName: entry.employeeName,
            startDate: entry.date,
            endDate: entry.date,
            amount: entry.isHoliday
              ? HOLIDAY_RATE
              : WEEKDAY_RATE,
          });

          i++;
        }
      }
    }

    payLines.sort((a, b) => a.startDate.localeCompare(b.startDate));

    const summaryMap = new Map<string, EmployeeSummary>();

    for (const entry of dailyEntries) {
      const existing = summaryMap.get(entry.employeeId) ?? {
        employeeId: entry.employeeId,
        employeeName: entry.employeeName,
        daysWorked: 0,
        totalPay: 0,
      };

      existing.daysWorked += 1;
      summaryMap.set(entry.employeeId, existing);
    }

    for (const line of payLines) {
      const existing = summaryMap.get(line.employeeId);

      if (existing) {
        existing.totalPay += line.amount;
      }
    }

    const employeeSummaries = [...summaryMap.values()].sort(
      (a, b) => a.employeeName.localeCompare(b.employeeName),
    );

    const totalPay = payLines.reduce(
      (sum, line) => sum + line.amount,
      0,
    );

    return {
      teamId,
      teamName: team.name,
      year,
      month,
      daysInMonth,
      dailyEntries,
      payLines,
      employeeSummaries,
      totals: {
        daysCovered: dailyEntries.length,
        totalPay,
      },
    };
  }
}
