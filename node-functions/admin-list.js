// node-functions/admin-list.js
// 列出所有账号 + 设备数 + 最后登录时间
// 必填请求头: Authorization: Bearer <adminToken>

import {getKV, json, onRequestOptions} from './_kv.js';
import {verifyAdmin} from './_auth.js';

export async function onRequestPost({request, env}){
  try{
    const auth = await verifyAdmin(env, request);
    if(!auth.ok) return json({err: auth.err}, 401);

    const kv = getKV(env);
    const maxDevices = parseInt(await kv.get('config:maxDevices') || '3');

    // 列出所有 account:* keys
    const accounts = [];
    let cursor = null;
    let guard = 0;
    do{
      const listResult = await kv.list({prefix: 'account:', cursor, limit: 1000});
      for(const key of listResult.keys || []){
        // EdgeOne Pages KV 返回 { key, name?, metadata? }；取 key 或 name
        const keyName = key.name || key.key;
        if(!keyName) continue;
        const raw = await kv.get(keyName);
        if(!raw) continue;
        try{
          const acc = JSON.parse(raw);
          accounts.push({
            u: acc.u,
            devices: Array.isArray(acc.devices) ? acc.devices : [],
            deviceCount: (Array.isArray(acc.devices) ? acc.devices : []).length,
            lastSeen: acc.lastSeen || null
          });
        } catch(_){ /* skip malformed */ }
      }
      cursor = listResult.cursor || listResult.next_cursor || null;
      if(listResult.complete) break;
      if(++guard > 100) break; // 安全护栏
    } while(cursor);

    return json({
      ok: true,
      maxDevices,
      accounts: accounts.sort((a, b) => a.u.localeCompare(b.u))
    });
  } catch(err){
    return json({err: err.message || '内部错误'}, 500);
  }
}

export {onRequestOptions};