import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

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

  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
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
//
// `purpose` domain-separates the main app-lock session from the Settings
// admin-lock session, which share the same serverSecret, so a token minted
// for one can never be replayed as the other even if both hashes matched.
export function computeSessionToken(
  serverSecret: string,
  passwordHash: string,
  purpose: 'app' | 'settings' = 'app',
): string {
  return createHmac('sha256', serverSecret)
    .update(`${purpose}:${passwordHash}`)
    .digest('hex');
}

export function tokensMatch(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return timingSafeEqual(bufferA, bufferB);
}

const SECRET_CIPHER_ALGORITHM = 'aes-256-gcm';

// Encrypts values (currently just the Entra client secret) at rest, keyed by
// the per-install serverSecret so the ciphertext is useless without the same
// database + AppSettings row it was written from.
export function encryptSecret(plainText: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(12);
  const cipher = createCipheriv(SECRET_CIPHER_ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final(),
  ]);

  return [
    iv.toString('hex'),
    cipher.getAuthTag().toString('hex'),
    ciphertext.toString('hex'),
  ].join(':');
}

export function decryptSecret(stored: string, keyHex: string): string {
  const [ivHex, tagHex, dataHex] = stored.split(':');

  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Malformed encrypted secret.');
  }

  const key = Buffer.from(keyHex, 'hex');
  const decipher = createDecipheriv(
    SECRET_CIPHER_ALGORITHM,
    key,
    Buffer.from(ivHex, 'hex'),
  );

  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);

  return plaintext.toString('utf8');
}
