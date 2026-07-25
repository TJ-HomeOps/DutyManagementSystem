import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(
  password: string,
): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
  )) as Buffer;

  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');

  if (!salt || !hashHex) {
    return false;
  }

  const derived = (await scryptAsync(
    password,
    salt,
    KEY_LENGTH,
  )) as Buffer;
  const storedBuffer = Buffer.from(hashHex, 'hex');

  if (derived.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derived, storedBuffer);
}

// Deterministic per (serverSecret, passwordHash) pair, so every login while
// the same password is set produces the same session token, and setting a
// new password (which changes passwordHash) invalidates every session
// issued under the old one without needing to track them individually.
export function computeSessionToken(
  serverSecret: string,
  passwordHash: string,
): string {
  return createHmac('sha256', serverSecret)
    .update(passwordHash)
    .digest('hex');
}

export function tokensMatch(
  a: string,
  b: string,
): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}
