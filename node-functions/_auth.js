// node-functions/_auth.js
// 第一版：用 base64 编码 + 时间戳的轻量 token（**不是真签名**，仅用于绕过 fetcher 拿到"我刚登过"标识）
// 第二版会升级 HMAC-SHA256。部署后务必在 KV 设置 config:adminToken（任意长字符串）。

export async function signToken(payload){
  const data = {...payload, ts: Date.now()};
  return btoa(JSON.stringify(data));
}

export async function verifyToken(token){
  try{
    if(!token) return null;
    return JSON.parse(atob(token));
  }catch(_){ return null; }
}

export async function verifyAdmin(env, request){
  const kv = (await import('./_kv.js')).getKV(env);
  const adminToken = await kv.get('config:adminToken');
  if(!adminToken){
    return {ok: false, err: 'adminToken 未配置（先在 KV put config:adminToken=你的密码）'};
  }

  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if(!token) return {ok: false, err: '缺少 Authorization 头'};
  if(token !== adminToken) return {ok: false, err: 'admin token 错误'};
  return {ok: true};
}