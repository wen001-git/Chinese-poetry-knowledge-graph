// server/auth.mjs
// PoemGraph auth utilities — ported from WhiteBoard pattern.
//
// Hash scheme: scrypt(password, salt) -> 64-byte base64url string.
// Why scrypt over plain SHA-256: scrypt is memory-hard + per-account salt,
// which is the standard for low-budget services where the salt can be a
// shared constant (we trust Render + Neon, not a hostile database).
// Plain SHA-256 was the old accounts.json scheme; we preserve it ONLY for
// imports from accounts.json (server/store.mjs#importFromJson), not for
// new accounts created via this server.

import { createHmac, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

// Salt used for all NEW accounts created via /api/admin/accounts.
// Kept identical to WhiteBoard's so the logic is interchangeable; rotate
// by changing this constant AND running a one-time re-hash migration.
export const SHARED_PASSWORD_SALT = 'pg-pro-salt-v1';

export function safeEqual(a, b) {
  const aa = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function normalizeUsername(value) {
  return String(value ?? '').trim().toLocaleLowerCase('en-US');
}

export async function makePassword(password) {
  const salt = SHARED_PASSWORD_SALT;
  const derived = await scrypt(String(password), salt, 64);
  return { salt, hash: Buffer.from(derived).toString('base64url') };
}

export async function verifyPassword(password, salt, expectedHash) {
  // Two paths:
  //   1. New accounts: hash = base64url(scrypt(pw, salt))
  //   2. Legacy import: hash = hex(sha256(salt + pw))  — 64 lowercase chars
  const derivedScrypt = await scrypt(String(password), String(salt), 64);
  if (safeEqual(Buffer.from(derivedScrypt).toString('base64url'), expectedHash)) return true;
  if (typeof expectedHash === 'string' && expectedHash.length === 64) {
    const crypto = await import('node:crypto');
    const legacyHash = crypto.createHash('sha256').update(String(salt) + String(password)).digest('hex');
    if (safeEqual(legacyHash, expectedHash.toLowerCase())) return true;
  }
  return false;
}

export function signToken(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token, secret, now = Date.now()) {
  const [encoded, signature, extra] = String(token ?? '').split('.');
  if (!encoded || !signature || extra) return null;
  const expected = createHmac('sha256', secret).update(encoded).digest('base64url');
  if (!safeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp <= now) return null;
    return payload;
  } catch {
    return null;
  }
}
