import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service';
import type { AppSettings } from '@prisma/client';
import {
  computeSessionToken,
  hashPassword,
  tokensMatch,
  verifyPassword,
} from './crypto.util';
import { isEntraUsable } from './entra.service';

export const SESSION_COOKIE_NAME = 'duty_session';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(): Promise<AppSettings> {
    const existing = await this.prisma.appSettings.findUnique({
      where: { id: 1 },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.appSettings.create({
      data: {
        id: 1,
        serverSecret: randomBytes(32).toString('hex'),
      },
    });
  }

  async getStatus(): Promise<{
    enabled: boolean;
    entra: { enabled: boolean };
  }> {
    const settings = await this.getSettings();

    return {
      enabled: settings.lockEnabled,
      entra: { enabled: isEntraUsable(settings) },
    };
  }

  async isSessionValid(token: string | undefined): Promise<boolean> {
    const settings = await this.getSettings();

    if (!settings.lockEnabled) {
      return true;
    }

    if (!token || !settings.passwordHash) {
      return false;
    }

    const expected = computeSessionToken(
      settings.serverSecret,
      settings.passwordHash,
    );

    return tokensMatch(token, expected);
  }

  async login(password: string): Promise<string> {
    const settings = await this.getSettings();

    if (!settings.lockEnabled || !settings.passwordHash) {
      throw new UnauthorizedException('Password protection is not enabled.');
    }

    const valid = await verifyPassword(password, settings.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    return computeSessionToken(settings.serverSecret, settings.passwordHash);
  }

  // Setting a password always (re)enables the lock and logs the caller in.
  // There is no separate "change password" flow — re-flicking the toggle is
  // the change-password flow. Only reachable via the Settings admin area
  // (see settings.controller.ts), which is gated by its own password.
  async enable(password: string): Promise<string> {
    await this.getSettings();

    const passwordHash = await hashPassword(password);

    const updated = await this.prisma.appSettings.update({
      where: { id: 1 },
      data: {
        lockEnabled: true,
        passwordHash,
      },
    });

    return computeSessionToken(updated.serverSecret, updated.passwordHash!);
  }

  async disable(): Promise<void> {
    await this.getSettings();

    await this.prisma.appSettings.update({
      where: { id: 1 },
      data: {
        lockEnabled: false,
        passwordHash: null,
      },
    });
  }
}
