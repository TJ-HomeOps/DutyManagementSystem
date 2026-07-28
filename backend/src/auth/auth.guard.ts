import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { readCookie } from '../common/cookie.util';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service';

// Routes reachable before a session exists: checking whether the lock is on,
// logging in with the local password, and the Entra SSO redirect/callback
// pair — those two are just another way to obtain the same session cookie
// that /auth/login produces, so they need to be reachable pre-session too.
// Lock/Entra configuration itself lives behind the separate Settings admin
// password (see settings.guard.ts), not here.
const PUBLIC_PATHS = new Set([
  '/auth/status',
  '/auth/login',
  '/auth/entra/login',
  '/auth/entra/callback',
]);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (PUBLIC_PATHS.has(request.path)) {
      return true;
    }

    const token = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    const valid = await this.authService.isSessionValid(token);

    if (!valid) {
      throw new UnauthorizedException('Authentication required.');
    }

    return true;
  }
}
