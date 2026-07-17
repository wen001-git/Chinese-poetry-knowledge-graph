// server/index.mjs
// Entry point for the PoemGraph auth service. Listens on PORT (Render sets).
//
// Required env vars (Render Dashboard → Environment):
//   DATABASE_URL        - Neon Postgres pooled connection string
//   AUTH_SECRET         - long random string; HMAC signing key for tokens
//   ADMIN_TOKEN         - long random string; Bearer token for /api/admin/*
//
// Optional env vars:
//   PORT                - default 10000 (Render free default)
//   AUTH_SALT           - default 'pg-pro-salt-v1' (used by legacy import)
//   MAX_DEVICES         - default 3 (per-account max when not set in DB)
//   SESSION_DAYS        - default 7
//   PRO_APP_PATH        - path to poemgraph-pro.html; reserved for future
//                         use (server doesn't serve HTML today)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createApp } from './app.mjs';
import { PgAccountStore } from './store.mjs';

const port = Number(process.env.PORT || 10000);
const accountsJsonPath = resolve(process.env.ACCOUNTS_JSON_PATH || './accounts.json');

const required = ['DATABASE_URL', 'AUTH_SECRET', 'ADMIN_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[fatal] ${key} 未配置 — Render Dashboard → Environment`);
    process.exit(1);
  }
}

async function loadAccountsJson() {
  try {
    const raw = await readFile(accountsJsonPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const store = new PgAccountStore(process.env.DATABASE_URL);
await store.init();
console.log(`[poemgraph-auth] DB schema ready (accounts=${(await store.listAccounts()).length})`);

const handler = createApp({
  store,
  authSecret: process.env.AUTH_SECRET,
  adminToken: process.env.ADMIN_TOKEN,
  sessionDays: process.env.SESSION_DAYS || 7,
  defaultMaxDevices: Math.max(3, Number(process.env.MAX_DEVICES) || 3),
  loadAccountsJson
});

const server = createServer(handler);
server.listen(port, '0.0.0.0', () => {
  console.log(`PoemGraph auth server listening on :${port}`);
});

async function shutdown() {
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
