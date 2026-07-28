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

import { readCookie } from '../common/cookie.util';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service';
import { computeSessionToken } from './crypto.util';
import { SetPasswordDto } from './dto/set-password.dto';
import { buildMsalClient, ENTRA_SCOPES, isEntraUsable } from './entra.service';

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

// Short-lived, holds only the CSRF state value for the in-flight Entra
// redirect round trip — not a session, cleared as soon as the callback runs.
const ENTRA_STATE_COOKIE_NAME = 'duty_entra_state';
const ENTRA_STATE_MAX_AGE_MS = 1000 * 60 * 5;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

    try {
      const client = buildMsalClient(settings);

      await client.acquireTokenByCode({
        code,
        scopes: ENTRA_SCOPES,
        redirectUri: settings.entraRedirectUri!,
      });
    } catch {
      return response.redirect('/?entraError=1');
    }

    const token = computeSessionToken(
      settings.serverSecret,
      settings.passwordHash!,
    );

    this.setSessionCookie(response, token);

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
