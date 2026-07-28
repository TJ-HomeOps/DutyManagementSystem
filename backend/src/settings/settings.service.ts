import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import {
  computeSessionToken,
  encryptSecret,
  hashPassword,
  tokensMatch,
  verifyPassword,
} from '../auth/crypto.util';
import { PrismaService } from '../prisma/prisma.service';

export const SETTINGS_SESSION_COOKIE_NAME = 'duty_settings_session';

export interface EntraConfigView {
  enabled: boolean;
  tenantId: string | null;
  clientId: string | null;
  redirectUri: string | null;
  hasClientSecret: boolean;
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async getStatus(): Promise<{ configured: boolean }> {
    const settings = await this.authService.getSettings();

    return { configured: Boolean(settings.settingsPasswordHash) };
  }

  async isSettingsSessionValid(token: string | undefined): Promise<boolean> {
    if (!token) {
      return false;
    }

    const settings = await this.authService.getSettings();

    if (!settings.settingsPasswordHash) {
      return false;
    }

    const expected = computeSessionToken(
      settings.serverSecret,
      settings.settingsPasswordHash,
      'settings',
    );

    return tokensMatch(token, expected);
  }

  async login(password: string): Promise<string> {
    const settings = await this.authService.getSettings();

    if (!settings.settingsPasswordHash) {
      throw new UnauthorizedException('No admin password has been set up yet.');
    }

    const valid = await verifyPassword(password, settings.settingsPasswordHash);

    if (!valid) {
      throw new UnauthorizedException('Incorrect password.');
    }

    return computeSessionToken(
      settings.serverSecret,
      settings.settingsPasswordHash,
      'settings',
    );
  }

  // Bootstraps the admin password on first use (no prior session needed —
  // there's nothing to authenticate against yet), or changes it once already
  // authenticated. The caller (controller) supplies whatever settings
  // session cookie it found, since this method decides whether one is
  // actually required based on current state.
  async setPassword(
    password: string,
    currentToken: string | undefined,
  ): Promise<string> {
    const settings = await this.authService.getSettings();

    if (settings.settingsPasswordHash) {
      const valid = await this.isSettingsSessionValid(currentToken);

      if (!valid) {
        throw new UnauthorizedException('Settings authentication required.');
      }
    }

    const settingsPasswordHash = await hashPassword(password);

    const updated = await this.prisma.appSettings.update({
      where: { id: 1 },
      data: { settingsPasswordHash },
    });

    return computeSessionToken(
      updated.serverSecret,
      updated.settingsPasswordHash!,
      'settings',
    );
  }

  async enableLock(password: string): Promise<string> {
    return this.authService.enable(password);
  }

  async disableLock(): Promise<void> {
    await this.authService.disable();
  }

  async getEntraConfig(): Promise<EntraConfigView> {
    const settings = await this.authService.getSettings();

    return {
      enabled: settings.entraEnabled,
      tenantId: settings.entraTenantId,
      clientId: settings.entraClientId,
      redirectUri: settings.entraRedirectUri,
      hasClientSecret: Boolean(settings.entraClientSecretEnc),
    };
  }

  async updateEntraConfig(dto: {
    enabled: boolean;
    tenantId?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  }): Promise<EntraConfigView> {
    const settings = await this.authService.getSettings();

    const tenantId = dto.tenantId?.trim() || settings.entraTenantId;
    const clientId = dto.clientId?.trim() || settings.entraClientId;
    const redirectUri = dto.redirectUri?.trim() || settings.entraRedirectUri;

    const entraClientSecretEnc = dto.clientSecret?.trim()
      ? encryptSecret(dto.clientSecret.trim(), settings.serverSecret)
      : settings.entraClientSecretEnc;

    if (
      dto.enabled &&
      (!tenantId || !clientId || !entraClientSecretEnc || !redirectUri)
    ) {
      throw new BadRequestException(
        'Tenant ID, Client ID, Client Secret, and Redirect URI are all required to enable Entra sign-in.',
      );
    }

    const updated = await this.prisma.appSettings.update({
      where: { id: 1 },
      data: {
        entraEnabled: dto.enabled,
        entraTenantId: tenantId,
        entraClientId: clientId,
        entraClientSecretEnc,
        entraRedirectUri: redirectUri,
      },
    });

    return {
      enabled: updated.entraEnabled,
      tenantId: updated.entraTenantId,
      clientId: updated.entraClientId,
      redirectUri: updated.entraRedirectUri,
      hasClientSecret: Boolean(updated.entraClientSecretEnc),
    };
  }
}
