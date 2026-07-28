import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { readCookie } from '../common/cookie.util';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service';
import {
  type AuthenticatedUser,
  USER_SESSION_COOKIE_NAME,
  UsersService,
} from './users.service';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

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
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Resolved unconditionally (not just when otherwise unauthenticated) so
    // request.user is available whenever an Entra-issued session cookie is
    // present, even while the lock is off — purely informational, never
    // part of the access decision below.
    const userToken = readCookie(
      request.headers.cookie,
      USER_SESSION_COOKIE_NAME,
    );
    const user = userToken
      ? await this.usersService.getUserBySessionToken(userToken)
      : null;

    if (user) {
      request.user = user;
    }

    if (PUBLIC_PATHS.has(request.path)) {
      return true;
    }

    const sharedToken = readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    const sharedValid = await this.authService.isSessionValid(sharedToken);

    if (!sharedValid && !user) {
      throw new UnauthorizedException('Authentication required.');
    }

    return true;
  }
}
