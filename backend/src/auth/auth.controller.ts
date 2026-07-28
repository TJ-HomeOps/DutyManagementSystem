import { randomBytes } from 'node:crypto';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import type { AuthenticatedRequest } from './auth.guard';
import { readCookie } from '../common/cookie.util';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';
import {
  buildMsalClient,
  ENTRA_SCOPES,
  extractEntraClaims,
  isEntraUsable,
} from './entra.service';
import { USER_SESSION_COOKIE_NAME, UsersService } from './users.service';

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

// Short-lived, holds only the CSRF state value for the in-flight Entra
// redirect round trip — not a session, cleared as soon as the callback runs.
const ENTRA_STATE_COOKIE_NAME = 'duty_entra_state';
const ENTRA_STATE_MAX_AGE_MS = 1000 * 60 * 5;

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Get('status')
  getStatus() {
    return this.authService.getStatus();
  }

  // Not in the guard's public-path list, so this 401s unless the caller
  // already has a valid session — used purely as an "am I logged in" probe.
  @Get('session')
  getSession() {
    return { ok: true };
  }

  // request.user is only populated when a valid duty_user_session cookie
  // resolved (see AuthGuard) — logging in with the shared local password
  // never sets one, so this stays null for that path by design.
  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    const user = request.user;

    return {
      user: user
        ? {
            name: user.name,
            email: user.email,
            employee: user.employee
              ? { id: user.employee.id, name: user.employee.name }
              : null,
          }
        : null,
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: SetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.login(dto.password);

    this.setSessionCookie(response, token);

    return { ok: true };
  }

  // Redirects to Microsoft's authorize endpoint. Only reachable when an
  // admin has fully configured and enabled Entra from Settings — otherwise
  // this is a dead route, since the whole point is that Entra ships inert.
  @Get('entra/login')
  async entraLogin(@Res() response: Response) {
    const settings = await this.authService.getSettings();

    if (!isEntraUsable(settings)) {
      throw new NotFoundException();
    }

    const client = buildMsalClient(settings);
    const state = randomBytes(16).toString('hex');

    const authorizeUrl = await client.getAuthCodeUrl({
      scopes: ENTRA_SCOPES,
      redirectUri: settings.entraRedirectUri!,
      state,
    });

    response.cookie(ENTRA_STATE_COOKIE_NAME, state, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ENTRA_STATE_MAX_AGE_MS,
      path: '/',
    });

    response.redirect(authorizeUrl);
  }

  // Completes the auth-code exchange and, on success, issues the exact same
  // session cookie /auth/login would — Entra is just another way to prove
  // you're allowed in, not a separate identity system.
  @Get('entra/callback')
  async entraCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    response.clearCookie(ENTRA_STATE_COOKIE_NAME, { path: '/' });

    const settings = await this.authService.getSettings();
    const expectedState = readCookie(
      request.headers.cookie,
      ENTRA_STATE_COOKIE_NAME,
    );

    if (
      !isEntraUsable(settings) ||
      !code ||
      !state ||
      !expectedState ||
      state !== expectedState
    ) {
      return response.redirect('/?entraError=1');
    }

    let userSession: { token: string; expiresAt: Date };

    try {
      const client = buildMsalClient(settings);

      const result = await client.acquireTokenByCode({
        code,
        scopes: ENTRA_SCOPES,
        redirectUri: settings.entraRedirectUri!,
      });

      userSession = await this.usersService.upsertFromEntra(
        extractEntraClaims(result),
      );
    } catch {
      return response.redirect('/?entraError=1');
    }

    // Entra logins get their own per-user session (identifies who signed
    // in) rather than the generic shared one /auth/login issues — either
    // is equally sufficient to unlock the app, see AuthGuard.
    response.cookie(USER_SESSION_COOKIE_NAME, userSession.token, {
      httpOnly: true,
      sameSite: 'lax',
      expires: userSession.expiresAt,
      path: '/',
    });

    response.redirect('/');
  }

  private setSessionCookie(response: Response, token: string): void {
    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });
  }
}
