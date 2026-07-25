import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService, SESSION_COOKIE_NAME } from './auth.service';

// The only two routes reachable before a session exists: checking whether
// the lock is on, and logging in. Everything else — including /auth/enable
// and /auth/disable — is covered by the lockEnabled check below, since
// enabling requires no prior session only while the lock is currently off.
const PUBLIC_PATHS = new Set(['/auth/status', '/auth/login']);

function readCookie(
  header: string | undefined,
  name: string,
): string | undefined {
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const separatorIndex = part.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = part.slice(0, separatorIndex).trim();

    if (key === name) {
      return decodeURIComponent(
        part.slice(separatorIndex + 1).trim(),
      );
    }
  }

  return undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request>();

    if (PUBLIC_PATHS.has(request.path)) {
      return true;
    }

    const token = readCookie(
      request.headers.cookie,
      SESSION_COOKIE_NAME,
    );
    const valid = await this.authService.isSessionValid(
      token,
    );

    if (!valid) {
      throw new UnauthorizedException(
        'Authentication required.',
      );
    }

    return true;
  }
}
