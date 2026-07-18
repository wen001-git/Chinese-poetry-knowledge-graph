// server/auth.mjs
// PoemGraph auth utilities.
//
// Hash scheme: SHA-256(salt + password) -> 64-char lowercase hex.
// Why SHA-256 (not scrypt / bcrypt): matches the hash already used in
// accounts.json so the two paths (local browser-side SHA-256 + server-side
// SHA-256) are byte-for-byte identical. Single source of truth for password
// verification. Trade-off: SHA-256 is fast (no memory hardness), so we
// rely on (a) Render + Neon as the trust boundary and (b) the per-account
// username being effectively a salt (no two accounts share a username).

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

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

export function sha256Hex(input) {
  return createHash('sha256').update(String(input)).digest('hex');
}

export function makePassword(password) {
  const salt = SHARED_PASSWORD_SALT;
  return { salt, hash: sha256Hex(salt + password) };
}

export function verifyPassword(password, salt, expectedHash) {
  // Single scheme: hex(sha256(salt + password)). accounts.json uses the
  // exact same recipe in the browser, so what the browser computes
  // is what the server stores and verifies.
  const derived = sha256Hex(String(salt) + String(password));
  return safeEqual(derived, String(expectedHash).toLowerCase());
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
