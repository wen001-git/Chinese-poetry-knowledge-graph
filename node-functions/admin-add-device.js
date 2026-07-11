// node-functions/admin-add-device.js
// 手动给某账号添加设备 UUID（客户把 UUID 发给作者后用）
// 必填请求头: Authorization: Bearer <adminToken>
// 必填请求体: { u, deviceId }

import {getKV, json, onRequestOptions} from './_kv.js';
import {verifyAdmin} from './_auth.js';

export async function onRequestPost({request, env}){
  try{
    const auth = await verifyAdmin(env, request);
    if(!auth.ok) return json({err: auth.err}, 401);

    const {u, deviceId} = await request.json().catch(() => ({}));
    if(!u || !deviceId) return json({err: '参数缺失（需要 u, deviceId）'}, 400);

    const kv = getKV(env);
    const raw = await kv.get(`account:${u}`);
    if(!raw) return json({err: '账号不存在'}, 404);

    const account = JSON.parse(raw);
    const devices = Array.isArray(account.devices) ? account.devices : [];
    const alreadyExists = devices.includes(deviceId);
    if(!alreadyExists){
      devices.push(deviceId);
      account.devices = devices;
      await kv.put(`account:${u}`, JSON.stringify(account));
    }

    return json({
      ok: true,
      u,
      devices,
      added: !alreadyExists
    });
  } catch(err){
    return json({err: err.message || '内部错误'}, 500);
  }
}

export {onRequestOptions};