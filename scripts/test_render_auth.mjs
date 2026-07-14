import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const port = 38765;
const token = 'test-admin-token';
const child = spawn(process.execPath, ['render-auth-server.mjs'], {
  env: {
    ...process.env,
    PORT: String(port),
    ADMIN_TOKEN: token,
    AUTH_SECRET: 'test-secret',
    AUTH_DB_FILE: `/tmp/poemgraph-auth-test-${Date.now()}.json`,
    MAX_DEVICES: '1'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function post(path, body, admin = false) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(admin ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body || {})
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  await wait(500);
  const h = await fetch(`http://127.0.0.1:${port}/health`).then(r => r.json());
  if (!h.ok) throw new Error('health failed');
  const head = await fetch(`http://127.0.0.1:${port}/health`, { method: 'HEAD' });
  if (!head.ok) throw new Error('health HEAD failed');
  if (!head.headers.get('content-type')?.includes('application/json')) throw new Error('health HEAD content-type failed');

  const d1 = randomUUID();
  const d2 = randomUUID();
  const login1 = await post('/api/login', { u: 'admin', p: 'window', deviceId: d1 });
  if (!login1.ok || !login1.json.token || !login1.json.bound) throw new Error('first login should bind');

  const loginSame = await post('/api/login', { u: 'admin', p: 'window', deviceId: d1 });
  if (!loginSame.ok || loginSame.json.bound) throw new Error('same device should be allowed without rebinding');

  const login2 = await post('/api/login', { u: 'admin', p: 'window', deviceId: d2 });
  if (login2.status !== 403) throw new Error('second device should be rejected');

  const list = await post('/api/admin/list', {}, true);
  if (!list.ok) throw new Error('admin list failed');
  const admin = list.json.accounts.find(a => a.u === 'admin');
  if (!admin || admin.deviceCount !== 1) throw new Error('admin deviceCount should be 1');

  const reset = await post('/api/admin/reset', { u: 'admin' }, true);
  if (!reset.ok || reset.json.clearedDevices !== 1) throw new Error('reset failed');

  const loginAfterReset = await post('/api/login', { u: 'admin', p: 'window', deviceId: d2 });
  if (!loginAfterReset.ok) throw new Error('login after reset failed');

  console.log('auth tests ok');
}

main()
  .catch(err => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => child.kill());
