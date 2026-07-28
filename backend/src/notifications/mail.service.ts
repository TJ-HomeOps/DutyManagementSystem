import { Injectable, Logger } from '@nestjs/common';
import { createTransport } from 'nodemailer';

import { AuthService } from '../auth/auth.service';
import { decryptSecret } from '../auth/crypto.util';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
}

// Every send re-reads AppSettings so a config change takes effect on the
// very next email, without needing to restart anything. Silently no-ops
// when notifications are off or unconfigured — same "ships inert" posture
// as Entra — and never throws, so a bad SMTP config or transient outage
// can't take down whatever triggered the notification.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly authService: AuthService) {}

  async send(message: OutgoingMail): Promise<void> {
    const settings = await this.authService.getSettings();

    if (
      !settings.notificationsEnabled ||
      !settings.smtpHost ||
      !settings.smtpPort ||
      !settings.smtpFrom
    ) {
      return;
    }

    try {
      const transporter = createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpPort === 465,
        auth:
          settings.smtpUser && settings.smtpPasswordEnc
            ? {
                user: settings.smtpUser,
                pass: decryptSecret(
                  settings.smtpPasswordEnc,
                  settings.serverSecret,
                ),
              }
            : undefined,
      });

      await transporter.sendMail({
        from: settings.smtpFrom,
        to: message.to,
        subject: message.subject,
        text: message.text,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send email to ${message.to}: ${(error as Error).message}`,
      );
    }
  }

  async sendRosterConflictAlert(params: {
    teamName: string;
    conflicts: Array<{ date: string; message: string }>;
  }): Promise<void> {
    const settings = await this.authService.getSettings();

    if (!settings.adminNotificationEmail || params.conflicts.length === 0) {
      return;
    }

    const lines = params.conflicts
      .map((conflict) => `- ${conflict.date}: ${conflict.message}`)
      .join('\n');

    await this.send({
      to: settings.adminNotificationEmail,
      subject: `Roster conflicts found for ${params.teamName}`,
      text: `Generating the roster for ${params.teamName} found ${params.conflicts.length} conflict(s) that were skipped:\n\n${lines}\n\nOpen the Roster page to resolve them.`,
    });
  }
}
