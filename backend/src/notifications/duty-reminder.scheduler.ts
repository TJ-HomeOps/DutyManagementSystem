import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';

function todayBounds(): { start: Date; end: Date } {
  const now = new Date();

  return {
    start: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    ),
    end: new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    ),
  };
}

@Injectable()
export class DutyReminderScheduler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // 07:00 server time — MailService itself no-ops quietly if notifications
  // aren't configured, so this is a harmless no-op until an admin sets them up.
  @Cron('0 7 * * *')
  async sendTodaysDutyReminders(): Promise<void> {
    const { start, end } = todayBounds();

    const assignments = await this.prisma.dutyAssignment.findMany({
      where: {
        start: { lte: end },
        end: { gte: start },
        employee: { email: { not: null } },
      },
      include: { employee: true, team: true },
    });

    for (const assignment of assignments) {
      if (!assignment.employee.email) {
        continue;
      }

      await this.mailService.send({
        to: assignment.employee.email,
        subject: `Duty reminder: you're on for ${assignment.team.name} today`,
        text: [
          `Hi ${assignment.employee.name},`,
          '',
          `Just a reminder that you're on duty today for ${assignment.team.name}.`,
          assignment.notes ? `\nNotes: ${assignment.notes}` : '',
        ].join('\n'),
      });
    }
  }
}
