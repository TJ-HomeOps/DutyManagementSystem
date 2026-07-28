import { Injectable, Logger } from '@nestjs/common';
import type { DutyAssignment, Employee, Team } from '@prisma/client';

import { AuthService } from '../auth/auth.service';
import { buildMsalClient } from '../auth/entra.service';
import { PrismaService } from '../prisma/prisma.service';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

type AssignmentWithRelations = DutyAssignment & {
  team: Team;
  employee: Employee;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
}

// Reuses the same Entra app registration as SSO login (tenantId/clientId/
// clientSecret already stored for that), but via the client-credentials
// (application) grant rather than the auth-code (delegated) one SSO uses —
// this needs the admin to separately consent to the Calendars.ReadWrite
// Graph *application* permission in Azure. Deliberately independent of the
// local-password lock and Entra-login toggle: calendar sync isn't about
// who can open the app.
@Injectable()
export class GraphCalendarService {
  private readonly logger = new Logger(GraphCalendarService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  async syncCreated(assignmentId: string): Promise<void> {
    await this.safely(assignmentId, async () => {
      const assignment = await this.findAssignment(assignmentId);
      const context = await this.buildContext(assignment);

      if (!assignment || !context) {
        return;
      }

      const event = await this.graphFetch(
        context.token,
        `/users/${encodeURIComponent(context.calendarUserId)}/calendar/events`,
        {
          method: 'POST',
          body: JSON.stringify(this.buildEventBody(assignment)),
        },
      );

      await this.prisma.dutyAssignment.update({
        where: { id: assignmentId },
        data: { msGraphEventId: event.id as string },
      });
    });
  }

  async syncUpdated(assignmentId: string): Promise<void> {
    await this.safely(assignmentId, async () => {
      const assignment = await this.findAssignment(assignmentId);
      const context = await this.buildContext(assignment);

      if (!assignment || !context) {
        return;
      }

      if (!assignment.msGraphEventId) {
        // Never synced (e.g. the calendar was configured after this
        // assignment already existed) — create it instead of failing.
        return this.syncCreated(assignmentId);
      }

      await this.graphFetch(
        context.token,
        `/users/${encodeURIComponent(context.calendarUserId)}/calendar/events/${assignment.msGraphEventId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(this.buildEventBody(assignment)),
        },
      );
    });
  }

  // Assignment is already gone by the time this runs, so the caller passes
  // what's needed rather than this method looking it up itself.
  async syncDeleted(
    assignmentId: string,
    teamId: string,
    msGraphEventId: string | null,
  ): Promise<void> {
    if (!msGraphEventId) {
      return;
    }

    await this.safely(assignmentId, async () => {
      const team = await this.prisma.team.findUnique({
        where: { id: teamId },
      });

      if (!team?.msCalendarUserId) {
        return;
      }

      const token = await this.getAccessToken();

      if (!token) {
        return;
      }

      await this.graphFetch(
        token,
        `/users/${encodeURIComponent(team.msCalendarUserId)}/calendar/events/${msGraphEventId}`,
        { method: 'DELETE' },
      );
    });
  }

  private async findAssignment(
    assignmentId: string,
  ): Promise<AssignmentWithRelations | null> {
    return this.prisma.dutyAssignment.findUnique({
      where: { id: assignmentId },
      include: { team: true, employee: true },
    });
  }

  private async buildContext(
    assignment: AssignmentWithRelations | null,
  ): Promise<{ token: string; calendarUserId: string } | null> {
    if (!assignment?.team.msCalendarUserId) {
      return null;
    }

    const token = await this.getAccessToken();

    if (!token) {
      return null;
    }

    return { token, calendarUserId: assignment.team.msCalendarUserId };
  }

  private async getAccessToken(): Promise<string | null> {
    const settings = await this.authService.getSettings();

    if (
      !settings.entraTenantId ||
      !settings.entraClientId ||
      !settings.entraClientSecretEnc
    ) {
      return null;
    }

    const client = buildMsalClient(settings);
    const result = await client.acquireTokenByClientCredential({
      scopes: [GRAPH_SCOPE],
    });

    return result?.accessToken ?? null;
  }

  private buildEventBody(assignment: AssignmentWithRelations) {
    const start = startOfUtcDay(assignment.start);
    const endExclusive = startOfUtcDay(
      new Date(assignment.end.getTime() + 24 * 60 * 60 * 1000),
    );

    return {
      subject: `Duty: ${assignment.employee.name} (${assignment.team.name})`,
      isAllDay: true,
      start: { dateTime: start.toISOString(), timeZone: 'UTC' },
      end: { dateTime: endExclusive.toISOString(), timeZone: 'UTC' },
      body: { contentType: 'text', content: assignment.notes ?? '' },
    };
  }

  private async graphFetch(
    token: string,
    path: string,
    init?: RequestInit,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(`${GRAPH_BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Graph API ${response.status}: ${await response.text()}`);
    }

    if (response.status === 204) {
      return {};
    }

    return (await response.json()) as Record<string, unknown>;
  }

  // Every sync path funnels through here: a Graph outage, a missing
  // permission, or a not-yet-configured calendar must never fail the duty
  // assignment operation that triggered it — just log and move on.
  private async safely(
    assignmentId: string,
    fn: () => Promise<void>,
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.warn(
        `Failed to sync assignment ${assignmentId} to Microsoft calendar: ${(error as Error).message}`,
      );
    }
  }
}
