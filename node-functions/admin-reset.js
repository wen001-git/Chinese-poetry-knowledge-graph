// node-functions/admin-reset.js
// 清空某账号的设备绑定（让客户能在新设备登录）
// 必填请求头: Authorization: Bearer <adminToken>
// 必填请求体: { u }

import {getKV, json, onRequestOptions} from './_kv.js';
import {verifyAdmin} from './_auth.js';

export async function onRequestPost({request, env}){
  try{
    const auth = await verifyAdmin(env, request);
    if(!auth.ok) return json({err: auth.err}, 401);

    const {u} = await request.json().catch(() => ({}));
    if(!u) return json({err: '参数缺失（需要 u）'}, 400);

    const kv = getKV(env);
    const raw = await kv.get(`account:${u}`);
    if(!raw) return json({err: '账号不存在'}, 404);

    const account = JSON.parse(raw);
    const oldDevices = Array.isArray(account.devices) ? account.devices : [];
    account.devices = [];
    await kv.put(`account:${u}`, JSON.stringify(account));

    return json({
      ok: true,
      u,
      clearedDevices: oldDevices.length,
      devices: []
    });
  } catch(err){
    return json({err: err.message || '内部错误'}, 500);
  }
}

export const onRequestOptions = onRequestOptions;