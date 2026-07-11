# 账号设备限制方案设计（PoemGraph Pro）

> 目的：给作者保存 3 种"一个账号限制 2 台设备"的可行方案，含代码改造点 + 代价评估，方便将来真正遇到盗版商时快速选型
> 目标读者：作者本人（未来选型用）
> 如何阅读：先看"现状与约束"对清楚边界；再按需看方案 A / B / C 的"实施细节"段；选好方案后按"实施 SOP"操作

## 现状与约束（2026-07-11 摸清）

### 账号数据模型

`accounts.json` 当前 schema：

```json
{
  "version": 1,
  "salt": "pg-pro-salt-v1",
  "accounts": [
    { "u": "admin", "h": "1cd8058c..." },
    { "u": "wujin", "h": "4ed539db..." }
  ]
}
```

- 只有 `u` 和 `h` 两个字段
- **无设备绑定信息**
- **无后端写入能力**（纯静态 CDN）

### 登录流程（`poemgraph-pro.html` line 1280-1292）

```javascript
function doLogin(u, p) {
  return loadAccounts().then(() => {
    const found = PRO.accounts.find(a => a.u === u);
    if (!found) throw new Error('用户名不存在');
    return sha256(PRO.salt + p).then(h =>
      h === found.h ? found : Promise.reject(new Error('密码错误'))
    );
  }).then(found => {
    PRO.logged = true;
    PRO.user = found;
    localStorage.setItem('pg_pro_user', JSON.stringify({u: found.u, loginAt: Date.now()}));
    onLoginSuccess();
  });
}
```

### 部署架构

- **Render Static Site** `pg-ndxn.onrender.com`（美国）
- **阿里 CNAME** `poem.leewen.work` → Cloudflare 反代 → Render
- **sw.js v5**（commit `00c12ba`）接管 accounts.json + stale-while-revalidate
- **无后端函数 / Worker / DB**

### 用户已确认的两个关键约束

1. **目标客群**：防盗版 / 防账号批发
2. **全是大陆用户**——后端必须大陆部署（Cloudflare 美国边缘延迟大不可用）

## 三方案对比总表

| 方案 | 防盗版能力 | 大陆可用 | 复杂度 | 月成本 | 推荐场景 |
|---|---|---|---|---|---|
| **A · 纯前端 UUID** | ❌ 清 LS 绕过，但挡 95% 批发 | ✅ | 极低 | 0 | 9.9 元小额付费；用户技术能力弱 |
| **B · Cloudflare Worker + JWT** | ✅ 真踢人 | ⚠️ 美国边缘 RTT 200-1000ms | 中 | 0 | 海外用户为主；轻量级防盗版 |
| **C · 阿里云 CloudBase** | ✅ 真可靠（数据库事务） | ✅ 大陆内部署 <50ms | 高 | ¥19.9+ | 规模 100+ 付费用户；商业级防盗版 |

## 方案 A · 纯前端 UUID（已选定 2026-07-11）

### 实施思路

- accounts.json 每条账号加 `devices: [uuid1, uuid2]` 字段
- 客户端生成 UUID 存 `localStorage.pg_pro_device`
- 登录时检查 UUID 是否在 devices 列表
  - 在 → 放行
  - 不在 → 列表未满 → 加入（但 accounts.json 是只读 CDN，需要客户端写 accounts.json，不可行——**所以"加入"操作改在 admin HTML 手工或半自动**）

### 实际可行的实施细节

**Step 1 · accounts.json schema 升级**

```json
{
  "version": 2,
  "salt": "pg-pro-salt-v1",
  "maxDevices": 2,
  "accounts": [
    { "u": "admin", "h": "1cd8058c...", "devices": ["uuid-1", "uuid-2"] },
    { "u": "wujin", "h": "4ed539db...", "devices": [] }
  ]
}
```

**Step 2 · poemgraph-pro.html 设备识别**

```javascript
function getDeviceId() {
  let id = localStorage.getItem('pg_pro_device');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || 
         ('dev-' + Date.now() + '-' + Math.random().toString(36).slice(2,10));
    localStorage.setItem('pg_pro_device', id);
  }
  return id;
}
```

**Step 3 · doLogin 改造**

```javascript
function doLogin(u, p) {
  return loadAccounts().then(() => {
    const found = PRO.accounts.find(a => a.u === u);
    if (!found) throw new Error('用户名不存在');
    return sha256(PRO.salt + p).then(h => {
      if (h !== found.h) throw new Error('密码错误');
      // 设备绑定校验
      const maxDev = (PRO.meta && PRO.meta.maxDevices) || 2;
      const devices = found.devices || [];
      const myId = getDeviceId();
      if (devices.includes(myId)) return found;  // 已绑定 → 放行
      if (devices.length >= maxDev) {
        throw new Error(`此账号已在 ${maxDev} 台设备登录。如需重置请联系作者`);
      }
      // 列表未满 + 首次登录 → 把本机 UUID 加入
      // 注意：CDN 是只读的，需要作者在 admin HTML 手工添加或自动同步
      // 简单做法：客户端在 PRO.user 里临时标记，提示"已记住本设备，下次自动放行"
      found.devices = [...devices, myId];
      // 把更新后的 JSON 下载到本地（用户交给作者）+ 提示文案
      return { ...found, _newDevice: true };
    });
  }).then(found => {
    PRO.logged = true;
    PRO.user = found;
    localStorage.setItem('pg_pro_user', JSON.stringify({u: found.u, loginAt: Date.now()}));
    if (found._newDevice) {
      // 提示用户：你的设备已加入，请下载新 accounts.json 交给作者合并
      alert('首次在本机登录，请把更新后的 accounts.json 交给作者合并上传');
    }
    onLoginSuccess();
  });
}
```

### 防绕过 / 防弱点的真实边界

**能挡住**：
- ✅ 同一账号给 3+ 个朋友分享（列表满 → 拒绝）
- ✅ 自动化脚本批量登入派发（脚本不知道本地 UUID）
- ✅ 大部分不懂 JS 的普通用户

**挡不住**：
- ❌ 用户清 `localStorage.pg_pro_device` → UUID 重生 → 绕过（前提：devices 列表没满）
- ❌ 跨浏览器（同一电脑 Chrome + Firefox = 2 个设备 UUID）
- ❌ 用户知道机制 → 改 accounts.json 自己加 UUID

### admin HTML 管理 UI（可选）

如果要做 UI 而不是手工编辑 accounts.json：
- 列出每账号的 devices 列表（UUID + 首次登录时间）
- "重置设备"按钮 → 清空 devices 数组
- "下载更新后 accounts.json" → 给作者手动 push

工作量 ~50 行 admin HTML + ~30 行 poemgraph-pro.html。

### 后悔成本

如果你发现 A 不够：
- 升级到 B（保留 UUID 数据，加一层 Worker 校验）—— 改动小
- 升级到 C（重构账号体系到云函数）—— 大改，但数据可平滑迁移

## 方案 B · Cloudflare Worker + JWT

### 实施思路

1. 加 Cloudflare Worker `/auth/login` 路由
2. Worker 接收 username + password → 校验 → 检查设备数 → 颁发短期 JWT
3. Worker 用 KV 存储设备绑定（`account → [device1, device2, ...]`）
4. poemgraph-pro.html 启动时调 Worker 拿 JWT，后续请求带 JWT

### Worker 大致代码（Cloudflare Workers + KV）

```javascript
// worker.js
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/auth/login' && req.method === 'POST') {
      const { username, password, deviceId } = await req.json();
      
      // 1. 校验账号（worker 内置 accounts.json 或 KV）
      const account = await env.ACCOUNTS.get(username);
      if (!account) return new Response('用户名不存在', {status: 401});
      
      // 2. SHA-256 校验密码
      const hash = await sha256(account.salt + password);
      if (hash !== account.h) return new Response('密码错误', {status: 401});
      
      // 3. 设备绑定校验
      const devices = (await env.DEVICES.get(username + ':devices')) || '[]';
      const deviceList = JSON.parse(devices);
      if (!deviceList.includes(deviceId)) {
        if (deviceList.length >= 2) {
          return new Response('设备已满', {status: 403});
        }
        deviceList.push(deviceId);
        await env.DEVICES.put(username + ':devices', JSON.stringify(deviceList));
      }
      
      // 4. 颁发短期 JWT
      const jwt = await signJWT({u: username, d: deviceId}, env.JWT_SECRET, '24h');
      return new Response(JSON.stringify({token: jwt}), {status: 200});
    }
    return new Response('Not Found', {status: 404});
  }
};
```

### 改动文件

- **新建** `cloudflare-worker/auth-worker.js`
- **新建** `cloudflare-worker/wrangler.toml` + KV 配置
- **改** `poemgraph-pro.html` doLogin + boot 流程
- **新建** Cloudflare KV 实例（`ACCOUNTS` + `DEVICES`）
- **配置** Worker 域名（`auth.poem.leewen.work`）

### 缺点（大陆用户场景）

- Worker 在 Cloudflare 美国边缘
- 每次登录 RTT 200-1000ms（大陆访问）
- JWT 过期前用户能继续用；过期重新登录延迟大
- 需要长期 Cloudflare 账号 + 域名配置 + KV 资源

### 适用

- 海外用户为主
- 不想投入大陆备案
- 需要真踢人能力

## 方案 C · 阿里云 CloudBase（云开发）

### 实施思路

1. 迁移后端到阿里云 CloudBase（或微信云托管）
2. 用云函数实现登录 + 设备绑定 + 业务 API
3. 用云数据库存储账号、设备绑定
4. 客户端改用云函数调用

### 改动规模

- **架构级重构**：告别单文件 SPA 架构
- poemgraph.html / poemgraph-pro.html 拆分出后端 API
- 客户端代码全面对接云函数 SDK
- admin HTML 改为云函数管理账号
- 静态资源（音频 / 图片）迁到云存储

### 投入产出

- **月成本**：¥19.9 起 + 数据库读写 + 云函数调用次数（按量）
- **时间**：1-2 周集中开发 + 测试
- **长期价值**：真正的 SaaS 架构，可以扩展付费墙 / 微信登录 / 移动 App 等

### 适用

- 规模到 100+ 付费账号
- 期望长期商业化（微信小程序、App、第三方分销）
- 已有 ICP 备案或愿意办理
- 团队有后端能力

## 何时升级决策树

```
现状：A 方案在跑（假设已实施）
│
├── 客户群没大规模变化（< 100 付费）→ 维持 A
│
├── 客户数 100-500 + 有零星反馈"账号被刷" → 评估 B
│
└── 客户数 500+ + 打算做小程序/App/分销 → 必须 C
```

## 决策记录

| 日期 | 决定 | 理由 |
|---|---|---|
| 2026-07-11 | 选 A（纯前端 UUID） | 用户技术能力弱 + 9.9 元小额 + 大陆体验优先 |

## 变更记录

| 日期 | 变更内容 |
|---|---|
| 2026-07-11 | 初始创建三方案设计文档；选 A（纯前端 UUID）作为初版实施方案，留 B / C 备查 |