import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { SESSION_COOKIE_NAME } from '../auth/auth.service';
import { SetPasswordDto } from '../auth/dto/set-password.dto';
import { readCookie } from '../common/cookie.util';
import { UpdateEntraConfigDto } from './dto/update-entra-config.dto';
import { UpdateNotificationsConfigDto } from './dto/update-notifications-config.dto';
import {
  SETTINGS_SESSION_COOKIE_NAME,
  SettingsService,
} from './settings.service';

const SETTINGS_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 8;
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('status')
  getStatus() {
    return this.settingsService.getStatus();
  }

  // Behind SettingsGuard (not in its public-path list), so this 401s unless
  // the caller already holds a valid settings session — an "am I logged
  // into Settings" probe, same shape as /auth/session.
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
    const token = await this.settingsService.login(dto.password);

    this.setSettingsCookie(response, token);

    return { ok: true };
  }

  @Post('password')
  @HttpCode(200)
  async setPassword(
    @Body() dto: SetPasswordDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const currentToken = readCookie(
      request.headers.cookie,
      SETTINGS_SESSION_COOKIE_NAME,
    );

    const token = await this.settingsService.setPassword(
      dto.password,
      currentToken,
    );

    this.setSettingsCookie(response, token);

    return { ok: true };
  }

  @Post('lock/enable')
  @HttpCode(200)
  async enableLock(
    @Body() dto: SetPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.settingsService.enableLock(dto.password);

    response.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_MS,
      path: '/',
    });

    return { ok: true };
  }

  @Post('lock/disable')
  @HttpCode(200)
  async disableLock(@Res({ passthrough: true }) response: Response) {
    await this.settingsService.disableLock();

    response.clearCookie(SESSION_COOKIE_NAME, { path: '/' });

    return { ok: true };
  }

  @Get('entra')
  getEntraConfig() {
    return this.settingsService.getEntraConfig();
  }

  @Put('entra')
  updateEntraConfig(@Body() dto: UpdateEntraConfigDto) {
    return this.settingsService.updateEntraConfig(dto);
  }

  @Get('notifications')
  getNotificationsConfig() {
    return this.settingsService.getNotificationsConfig();
  }

  @Put('notifications')
  updateNotificationsConfig(@Body() dto: UpdateNotificationsConfigDto) {
    return this.settingsService.updateNotificationsConfig(dto);
  }

  private setSettingsCookie(response: Response, token: string): void {
    response.cookie(SETTINGS_SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: SETTINGS_SESSION_MAX_AGE_MS,
      path: '/',
    });
  }
}
