import type { AuthenticationResult } from '@azure/msal-node';
import { ConfidentialClientApplication } from '@azure/msal-node';
import type { AppSettings } from '@prisma/client';

import { decryptSecret } from './crypto.util';
import type { EntraClaims } from './users.service';

// openid+profile+email is enough to identify who's signing in (oid, email,
// name) for JIT user provisioning — no extra Graph permissions needed.
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

// oid is the stable per-user identifier Microsoft recommends for this exact
// purpose; email/name fall back through the token claims and then the
// account object in case a tenant omits one of them from the ID token.
export function extractEntraClaims(result: AuthenticationResult): EntraClaims {
  const claims = (result.idTokenClaims ?? {}) as Record<string, unknown>;

  const entraObjectId =
    (claims.oid as string | undefined) ??
    result.uniqueId ??
    result.account?.homeAccountId ??
    '';

  const email =
    (claims.email as string | undefined) ??
    (claims.preferred_username as string | undefined) ??
    result.account?.username ??
    '';

  const name =
    (claims.name as string | undefined) ?? result.account?.name ?? email;

  return { entraObjectId, email, name };
}
