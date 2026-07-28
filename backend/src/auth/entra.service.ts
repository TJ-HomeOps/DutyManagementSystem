import { ConfidentialClientApplication } from '@azure/msal-node';
import type { AppSettings } from '@prisma/client';

import { decryptSecret } from './crypto.util';

// The claims we actually need to establish a session; nothing beyond
// identity, since there's no per-user table to enrich.
export const ENTRA_SCOPES = ['openid', 'profile', 'email'];

// Entra is only a valid alternate login path once an admin has both
// configured it AND turned on the local password lock — SSO complements the
// local password, it never stands in for the lockEnabled/passwordHash pair
// that the resulting session token is actually derived from.
export function isEntraUsable(settings: AppSettings): boolean {
  return (
    settings.entraEnabled &&
    settings.lockEnabled &&
    Boolean(settings.passwordHash) &&
    Boolean(settings.entraTenantId) &&
    Boolean(settings.entraClientId) &&
    Boolean(settings.entraClientSecretEnc) &&
    Boolean(settings.entraRedirectUri)
  );
}

export function buildMsalClient(
  settings: AppSettings,
): ConfidentialClientApplication {
  return new ConfidentialClientApplication({
    auth: {
      clientId: settings.entraClientId!,
      authority: `https://login.microsoftonline.com/${settings.entraTenantId}`,
      clientSecret: decryptSecret(
        settings.entraClientSecretEnc!,
        settings.serverSecret,
      ),
    },
  });
}
