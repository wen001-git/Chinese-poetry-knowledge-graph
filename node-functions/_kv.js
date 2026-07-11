// node-functions/_kv.js
// EdgeOne Pages KV 封装 + CORS + JSON 响应
// 部署前请确保：EdgeOne Pages 控制台 → 存储 → KV → 新建 namespace "pg-accounts" 并绑定到项目

export function getKV(env){
  // 绑定名约定：作者在 EdgeOne Pages 控制台绑定 KV namespace 时
  // 把"运行时环境变量名"填为 PG_ACCOUNTS（注意大小写敏感）。
  // 若实际填了其他名字，可在此改；或部署后跑 [GET /api/login] 看 err 信息。
  const binding = (env && (env.PG_ACCOUNTS || env.KV)) || null;
  if(!binding){
    throw new Error('KV binding not available. 请在 EdgeOne Pages → 存储 → KV 绑定 namespace "pg-accounts" 时把运行时环境变量名填为 PG_ACCOUNTS');
  }
  return binding;
}

export function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export function json(obj, status=200){
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders()
    }
  });
}

export function err(msg, status=400){
  return json({ok: false, err: msg}, status);
}

export async function onRequestOptions(){
  return new Response(null, {status: 204, headers: corsHeaders()});
}

// SHA-256 helper（与前端一致：hex( salt + pass )）
export async function sha256Hex(s){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2,'0')).join('');
}