import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { readCookie } from '../common/cookie.util';
import {
  SETTINGS_SESSION_COOKIE_NAME,
  SettingsService,
} from './settings.service';

// Registered as a second global guard (alongside AuthGuard) rather than a
// per-controller one, so every current and future /settings/* route is
// admin-gated by default and has to be deliberately opted out here — the
// opposite of forgetting to protect a new admin endpoint. Non-/settings
// routes are untouched; that's AuthGuard's job.
const SETTINGS_PUBLIC_PATHS = new Set([
  '/settings/status',
  '/settings/login',
  // Serves both bootstrap (no admin password set yet) and change-password;
  // SettingsService.setPassword enforces the session check itself for the
  // "already configured" case, since the guard can't tell them apart.
  '/settings/password',
]);

@Injectable()
export class SettingsGuard implements CanActivate {
  constructor(private readonly settingsService: SettingsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (!request.path.startsWith('/settings')) {
      return true;
    }

    if (SETTINGS_PUBLIC_PATHS.has(request.path)) {
      return true;
    }

    const token = readCookie(
      request.headers.cookie,
      SETTINGS_SESSION_COOKIE_NAME,
    );
    const valid = await this.settingsService.isSettingsSessionValid(token);

    if (!valid) {
      throw new UnauthorizedException('Settings authentication required.');
    }

    return true;
  }
}
