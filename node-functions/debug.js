// node-functions/debug.js
// 自检端点：检查 Node Function 是否被识别 + KV binding 是否可用
// GET /api/debug 即可（不需要 POST，因为不涉及 KV 写入）
// ⚠️ 生产环境建议关掉（泄露内部状态），这里默认开以便你首次部署验证

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors() }
  });
}
function cors(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export async function onRequestGet({ request, env }) {
  const out = {
    ok: true,
    method: request.method,
    url: request.url,
    headers_count: [...request.headers.keys()].length,
    runtime: typeof globalThis.crypto !== 'undefined' ? 'has-crypto' : 'no-crypto',
    bindings: {},
    env_keys: env ? Object.keys(env) : []
  };

  // 检查 KV binding（PG_ACCOUNTS 或 KV）
  const kv = env && (env.PG_ACCOUNTS || env.KV);
  if (!kv) {
    out.bindings.kv = {
      available: false,
      err: '未配置 KV binding。请在 EdgeOne Pages → 存储 → KV → 绑定 namespace 时把"运行时环境变量名"填为 PG_ACCOUNTS'
    };
  } else {
    out.bindings.kv = { available: true, type: typeof kv };
    try {
      const enabled = await kv.get('config:enabled');
      const salt = await kv.get('config:salt');
      const maxDevices = await kv.get('config:maxDevices');
      out.bindings.kv.test = { enabled, salt, maxDevices };
    } catch (e) {
      out.bindings.kv.test_err = e.message || String(e);
    }
  }

  return json(out);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: cors() });
}