// node-functions/login.js
// 用户登录：校验账号 + 设备数限制 + 颁 token
// 必填请求体: { u, p, deviceId }

import {getKV, json, onRequestOptions, sha256Hex} from './_kv.js';
import {signToken} from './_auth.js';

export async function onRequestPost({request, env}){
  try{
    const kv = getKV(env);

    // 0. Feature flag：config:enabled === 'false' 时返回 fallback 标记，让前端走纯前端校验
    const enabled = await kv.get('config:enabled');
    if(enabled === 'false'){
      return json({err: '后端已关闭（config:enabled=false）', fallback: true}, 503);
    }

    // 1. 解析请求
    const body = await request.json().catch(() => ({}));
    const {u, p, deviceId} = body;
    if(!u || !p || !deviceId){
      return json({err: '参数缺失（需要 u, p, deviceId）'}, 400);
    }

    // 2. 查账号
    const accountRaw = await kv.get(`account:${u}`);
    if(!accountRaw) return json({err: '用户名不存在'}, 401);
    const account = JSON.parse(accountRaw);

    // 3. 密码校验（SHA-256(salt + p) === account.h）
    const salt = await kv.get('config:salt') || 'pg-pro-salt-v1';
    const hash = await sha256Hex(salt + p);
    if(hash !== account.h) return json({err: '密码错误'}, 401);

    // 4. 设备校验
    const maxDevices = parseInt(await kv.get('config:maxDevices') || '1');
    const devices = Array.isArray(account.devices) ? account.devices : [];

    if(devices.includes(deviceId)){
      // 已绑定 → 更新 lastSeen + 颁 token
      account.lastSeen = Date.now();
      await kv.put(`account:${u}`, JSON.stringify(account));
      return json({ok: true, token: await signToken({u, deviceId}), bound: false});
    }

    if(devices.length >= maxDevices){
      return json({
        err: `此账号已在 ${maxDevices} 台设备登录。请联系作者重置设备列表。`,
        currentDevices: devices.length,
        maxDevices
      }, 403);
    }

    // 5. 自动绑定新设备
    devices.push(deviceId);
    account.devices = devices;
    account.lastSeen = Date.now();
    await kv.put(`account:${u}`, JSON.stringify(account));

    return json({ok: true, token: await signToken({u, deviceId}), bound: true});
  } catch(err){
    return json({err: err.message || '内部错误', fallback: true}, 500);
  }
}

export const onRequestOptions = onRequestOptions;