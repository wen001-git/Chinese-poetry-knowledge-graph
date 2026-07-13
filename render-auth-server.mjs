import { createHmac, randomUUID, timingSafeEqual, webcrypto } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = resolve(process.env.AUTH_DATA_DIR || join(ROOT, 'data'));
const DB_FILE = resolve(process.env.AUTH_DB_FILE || join(DATA_DIR, 'auth-db.json'));
const ACCOUNTS_FILE = resolve(process.env.ACCOUNTS_FILE || join(ROOT, 'accounts.json'));
const SALT = process.env.AUTH_SALT || 'pg-pro-salt-v1';
const DEFAULT_MAX_DEVICES = Math.max(1, Number(process.env.MAX_DEVICES || 1));
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_DAYS || 7));
const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-only-change-me';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type, Authorization',
    'cache-control': 'no-store'
  });
  res.end(body);
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

async function sha256Hex(text) {
  const buf = await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
}

function readJsonFile(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function loadSeedAccounts() {
  const seed = readJsonFile(ACCOUNTS_FILE, { accounts: [] });
  return Array.isArray(seed.accounts) ? seed.accounts : [];
}

function loadDb() {
  const db = readJsonFile(DB_FILE, null);
  if (db && db.accounts && typeof db.accounts === 'object') return db;

  const accounts = {};
  for (const acc of loadSeedAccounts()) {
    if (!acc || !acc.u || !acc.h) continue;
    accounts[acc.u] = {
      u: acc.u,
      h: acc.h,
      maxDevices: DEFAULT_MAX_DEVICES,
      devices: [],
      createdAt: Date.now(),
      lastSeen: null
    };
  }
  return { version: 1, salt: SALT, accounts };
}

function saveDb(db) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function normalizeDb(db) {
  const seedAccounts = loadSeedAccounts();
  for (const acc of seedAccounts) {
    if (!acc || !acc.u || !acc.h) continue;
    if (!db.accounts[acc.u]) {
      db.accounts[acc.u] = {
        u: acc.u,
        h: acc.h,
        maxDevices: DEFAULT_MAX_DEVICES,
        devices: [],
        createdAt: Date.now(),
        lastSeen: null
      };
    } else {
      db.accounts[acc.u].h = acc.h;
      db.accounts[acc.u].maxDevices = Math.max(1, Number(db.accounts[acc.u].maxDevices || DEFAULT_MAX_DEVICES));
      db.accounts[acc.u].devices = Array.isArray(db.accounts[acc.u].devices) ? db.accounts[acc.u].devices : [];
    }
  }
  db.salt = db.salt || SALT;
  return db;
}

function signToken(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  const expected = createHmac('sha256', AUTH_SECRET).update(parts[0]).digest('base64url');
  if (!safeEqual(parts[1], expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseBody(req) {
  return new Promise(resolveBody => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try { resolveBody(raw ? JSON.parse(raw) : {}); }
      catch { resolveBody({}); }
    });
    req.on('error', () => resolveBody({}));
  });
}

function requireAdmin(req, res) {
  if (!ADMIN_TOKEN) {
    json(res, 500, { ok: false, err: 'ADMIN_TOKEN 未配置' });
    return false;
  }
  const auth = req.headers.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!safeEqual(token, ADMIN_TOKEN)) {
    json(res, 401, { ok: false, err: 'admin token 错误' });
    return false;
  }
  return true;
}

async function handleLogin(req, res) {
  const body = await parseBody(req);
  const u = String(body.u || '').trim();
  const p = String(body.p || '');
  const deviceId = String(body.deviceId || '').trim();
  const deviceName = String(body.deviceName || '').trim();
  if (!u || !p || !deviceId) return json(res, 400, { ok: false, err: '参数缺失（需要 u, p, deviceId）' });

  const db = normalizeDb(loadDb());
  const account = db.accounts[u];
  if (!account) return json(res, 401, { ok: false, err: '用户名不存在' });

  const h = await sha256Hex((db.salt || SALT) + p);
  if (!safeEqual(h, account.h)) return json(res, 401, { ok: false, err: '密码错误' });

  const devices = Array.isArray(account.devices) ? account.devices : [];
  const now = Date.now();
  let rec = devices.find(d => d.id === deviceId || d === deviceId);
  if (!rec && devices.some(d => d === deviceId)) {
    rec = { id: deviceId };
  }
  const maxDevices = Math.max(1, Number(account.maxDevices || DEFAULT_MAX_DEVICES));

  if (!rec && devices.length >= maxDevices) {
    saveDb(db);
    return json(res, 403, {
      ok: false,
      err: `此账号已在 ${maxDevices} 台设备登录。请联系作者重置设备列表。`,
      currentDevices: devices.length,
      maxDevices
    });
  }

  let bound = false;
  if (!rec) {
    rec = {
      id: deviceId,
      name: deviceName || '',
      firstSeen: now,
      lastSeen: now,
      userAgent: req.headers['user-agent'] || ''
    };
    devices.push(rec);
    bound = true;
  } else {
    rec.lastSeen = now;
    if (deviceName) rec.name = deviceName;
    rec.userAgent = req.headers['user-agent'] || rec.userAgent || '';
  }

  account.devices = devices.map(d => typeof d === 'string' ? { id: d, firstSeen: now, lastSeen: now } : d);
  account.lastSeen = now;
  saveDb(db);

  const exp = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = signToken({ u, deviceId, iat: now, exp });
  json(res, 200, { ok: true, token, bound, maxDevices, expiresAt: exp });
}

async function handleSession(req, res) {
  const body = await parseBody(req);
  const token = body.token || (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const payload = verifyToken(token);
  if (!payload) return json(res, 401, { ok: false, err: '登录已过期，请重新登录' });

  const db = normalizeDb(loadDb());
  const account = db.accounts[payload.u];
  const devices = account && Array.isArray(account.devices) ? account.devices : [];
  const exists = devices.some(d => (typeof d === 'string' ? d : d.id) === payload.deviceId);
  if (!account || !exists) return json(res, 401, { ok: false, err: '账号或设备已被解绑，请重新登录' });
  json(res, 200, { ok: true, u: payload.u, deviceId: payload.deviceId, expiresAt: payload.exp });
}

function publicAccount(acc) {
  const devices = (Array.isArray(acc.devices) ? acc.devices : []).map(d => {
    const rec = typeof d === 'string' ? { id: d } : d;
    return {
      id: rec.id,
      name: rec.name || '',
      firstSeen: rec.firstSeen || null,
      lastSeen: rec.lastSeen || null,
      userAgent: rec.userAgent || ''
    };
  });
  return {
    u: acc.u,
    maxDevices: Math.max(1, Number(acc.maxDevices || DEFAULT_MAX_DEVICES)),
    devices,
    deviceCount: devices.length,
    lastSeen: acc.lastSeen || null
  };
}

async function handleAdminList(req, res) {
  if (!requireAdmin(req, res)) return;
  const db = normalizeDb(loadDb());
  saveDb(db);
  const accounts = Object.values(db.accounts).map(publicAccount).sort((a, b) => a.u.localeCompare(b.u));
  json(res, 200, { ok: true, maxDevices: DEFAULT_MAX_DEVICES, accounts });
}

async function handleAdminReset(req, res) {
  if (!requireAdmin(req, res)) return;
  const { u } = await parseBody(req);
  const db = normalizeDb(loadDb());
  const acc = db.accounts[String(u || '').trim()];
  if (!acc) return json(res, 404, { ok: false, err: '账号不存在' });
  const oldDevices = Array.isArray(acc.devices) ? acc.devices : [];
  acc.devices = [];
  saveDb(db);
  json(res, 200, { ok: true, u: acc.u, clearedDevices: oldDevices.length, devices: [] });
}

async function handleAdminAddDevice(req, res) {
  if (!requireAdmin(req, res)) return;
  const body = await parseBody(req);
  const u = String(body.u || '').trim();
  const deviceId = String(body.deviceId || '').trim();
  if (!u || !deviceId) return json(res, 400, { ok: false, err: '参数缺失（需要 u, deviceId）' });
  const db = normalizeDb(loadDb());
  const acc = db.accounts[u];
  if (!acc) return json(res, 404, { ok: false, err: '账号不存在' });
  acc.devices = Array.isArray(acc.devices) ? acc.devices : [];
  const already = acc.devices.some(d => (typeof d === 'string' ? d : d.id) === deviceId);
  if (!already) acc.devices.push({ id: deviceId, firstSeen: Date.now(), lastSeen: Date.now(), name: 'manual' });
  saveDb(db);
  json(res, 200, { ok: true, u, devices: acc.devices.map(d => typeof d === 'string' ? d : d.id), added: !already });
}

async function handleAdminSetMax(req, res) {
  if (!requireAdmin(req, res)) return;
  const body = await parseBody(req);
  const u = String(body.u || '').trim();
  const maxDevices = Math.max(1, Number(body.maxDevices || 1));
  const db = normalizeDb(loadDb());
  const acc = db.accounts[u];
  if (!acc) return json(res, 404, { ok: false, err: '账号不存在' });
  acc.maxDevices = maxDevices;
  saveDb(db);
  json(res, 200, { ok: true, u, maxDevices });
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/poemgraph-pro.html';
  const file = normalize(join(ROOT, rel));
  if (!file.startsWith(ROOT + sep) && file !== ROOT) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (!existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }
  res.writeHead(200, {
    'content-type': MIME[extname(file)] || 'application/octet-stream',
    'cache-control': file.endsWith('.html') || file.endsWith('.json') ? 'no-store' : 'public, max-age=3600'
  });
  createReadStream(file).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return json(res, 204, {});
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (req.method === 'GET' && url.pathname === '/health') return json(res, 200, { ok: true, service: 'poemgraph-auth' });
    if (req.method === 'POST' && url.pathname === '/api/login') return handleLogin(req, res);
    if (req.method === 'POST' && url.pathname === '/api/session') return handleSession(req, res);
    if (req.method === 'POST' && url.pathname === '/api/admin/list') return handleAdminList(req, res);
    if (req.method === 'POST' && url.pathname === '/api/admin/reset') return handleAdminReset(req, res);
    if (req.method === 'POST' && url.pathname === '/api/admin/add-device') return handleAdminAddDevice(req, res);
    if (req.method === 'POST' && url.pathname === '/api/admin/set-max-devices') return handleAdminSetMax(req, res);
    if (req.method === 'GET') return serveStatic(req, res, url.pathname);
    json(res, 405, { ok: false, err: 'Method not allowed' });
  } catch (err) {
    json(res, 500, { ok: false, err: err.message || '内部错误' });
  }
});

server.listen(PORT, () => {
  console.log(`PoemGraph auth server listening on :${PORT}`);
});
