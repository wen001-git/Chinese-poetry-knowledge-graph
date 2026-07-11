// node-functions/_kv.js
// EdgeOne Pages KV 封装 + CORS + JSON 响应
// 部署前请确保：EdgeOne Pages 控制台 → 存储 → KV → 新建 namespace "pg-accounts" 并绑定到项目

export function getKV(env){
  if(!env || !env.KV){
    throw new Error('KV binding not available. EdgeOne Pages 控制台 → 存储 → KV → 绑定 namespace: pg-accounts');
  }
  return env.KV;
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