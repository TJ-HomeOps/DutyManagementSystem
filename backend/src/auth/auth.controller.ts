import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

import { AuthService, SESSION_COOKIE_NAME } from './auth.service';
import { SetPasswordDto } from './dto/set-password.dto';

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

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
    const token = await this.authService.login(
      dto.password,
    );

    this.setSessionCookie(response, token);

    return { ok: true };
  }

  @Post('enable')
  @HttpCode(200)
  async enable(
    @Body() dto: SetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.enable(
      dto.password,
    );

    this.setSessionCookie(response, token);

    return { ok: true };
  }

  @Post('disable')
  @HttpCode(200)
  async disable(
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.disable();

    response.clearCookie(SESSION_COOKIE_NAME, {
      path: '/',
    });

    return { ok: true };
  }

  private setSessionCookie(
    response: Response,
    token: string,
  ): void {
    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });
  }
}
