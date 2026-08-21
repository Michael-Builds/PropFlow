import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const PREFIX = 'enc:v1:';
const SENSITIVE_KEYS = new Set([
  'phone',
  'emergencyContact',
  'password',
  'passwordHash',
  'accessToken',
  'refreshToken',
]);

function keyBytes(): Buffer | null {
  const raw = process.env.PII_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, 'hex');
  return createHash('sha256').update(raw).digest();
}

export function isPiiEncryptionEnabled(): boolean {
  return keyBytes() !== null;
}

export function encryptPii(value: string | null | undefined): string | null {
  if (value == null || value === '') return value ?? null;
  if (value.startsWith(PREFIX)) return value;
  const key = keyBytes();
  if (!key) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptPii(value: string | null | undefined): string | null {
  if (value == null || value === '') return value ?? null;
  if (!value.startsWith(PREFIX)) return value;
  const key = keyBytes();
  if (!key) return value;
  const payload = value.slice(PREFIX.length);
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) return value;
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

export function redactPii<T>(value: T): T {
  return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactValue);
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) {
      out[key] = entry == null || entry === '' ? entry : '[redacted]';
      continue;
    }
    out[key] = redactValue(entry);
  }
  return out;
}
