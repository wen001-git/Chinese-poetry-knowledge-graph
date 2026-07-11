# EdgeOne Pages Node Functions · 账号设备限制后端

> 目的：4 个 API + KV 存储实现 PoemGraph Pro 账号登录 + 设备数限制；admin HTML 提供可视化设备管理 UI
> 目标读者：作者本人（部署 + 配置 + 测试）
> 如何阅读：按"前置 → 部署 → 初始化 → 测试 → 故障"顺序走

## 文件清单

```
node-functions/
├── _kv.js              # KV 封装 + CORS + sha256Hex
├── _auth.js            # signToken + verifyAdmin（依赖 KV 的 config:adminToken）
├── login.js            # POST /api/login         — 用户登录入口
├── admin-list.js       # POST /api/admin/list    — 列出所有账号
├── admin-reset.js      # POST /api/admin/reset   — 清空某账号设备
├── admin-add-device.js # POST /api/admin/add-device — 手动加 UUID
└── README.md           # 本文件
```

## 前置（你必须做的 1 步）

EdgeOne Pages 控制台：
1. 左侧菜单 → **存储** → **KV**
2. 点 **新建 Namespace**，名称：`pg-accounts`
3. 创建后点 **绑定到项目** → 选你的 `poemgraph` 项目 → 变量名 `KV`（**这个名很重要**，代码里读 `env.KV`）

## 部署

本目录随 GitHub 仓库自动部署：EdgeOne Pages 监听 `node-functions/` 目录，`git push` 后自动识别并部署为 Node.js API 端点。

| API 端点 | 方法 | 谁用 |
|---|---|---|
| `/api/login` | POST | 用户登录 |
| `/api/admin/list` | POST | 作者管理 |
| `/api/admin/reset` | POST | 作者管理 |
| `/api/admin/add-device` | POST | 作者管理 |

## 初始化（在 KV 里 put 初始数据）

EdgeOne Pages KV 控制台**不支持 web UI 编辑**，必须用 CLI 或 REST API。

**方式 A：用 EdgeOne CLI（推荐）**

```bash
# 安装 CLI（mac）
npm install -g edgeone

# 登录
edgeone login

# put 初始 KV
edgeone kv put --namespace pg-accounts config:adminToken "你的安全密码（≥16 字符）"
edgeone kv put --namespace pg-accounts config:salt      "pg-pro-salt-v1"
edgeone kv put --namespace pg-accounts config:maxDevices "1"
edgeone kv put --namespace pg-accounts config:enabled   "true"

# 加账号（每个账号单独 put）
edgeone kv put --namespace pg-accounts account:demo1 '{"u":"demo1","h":"<sha256哈希>","devices":[]}'
```

**方式 B：浏览器 console 调 fetch**

EdgeOne Pages KV 控制台通常**有"调试"或"数据浏览"标签**，里面能直接 put KV；如果没有，用 Cloudflare KV 类似的 API（如果你 EdgeOne Pages KV 兼容 Cloudflare API，可以调腾讯云 EdgeOne KV API）。

**方式 C：写个一次性 Node.js 脚本**

写个 `init-kv.js` 临时跑一次（不部署），用 EdgeOne 提供的 SDK put 数据后删掉。

## accounts.json 兜底（重要）

`poemgraph-pro.html` 的 doLogin **会先调 `/api/login`**；后端失败（CORS/断网/fallback 标志）→ **自动回退纯前端校验**用 `accounts.json`。

这意味着：
- 你**仍要维护 `accounts.json`** 作为兜底数据源
- KV 里和 accounts.json 的账号数据**必须一致**（第一次迁移时手工同步两份）
- 后端不可用时用户照常登录（你的 KV 配置错了不会影响老用户）

## 测试流程（按你 maxDevices=1 的设定）

### 场景 1：后端 OK

1. 在 EdgeOne KV put：`config:enabled=true` + `config:adminToken=xxx` + `config:maxDevices=1` + `account:demo1={"u":"demo1","h":"<demo1的哈希>","devices":[]}`
2. 打开 `https://poem.leewen.work/poemgraph-pro.html`（或你的 EdgeOne Pages 域名）
3. 顶栏「🔑 登录」→ 输 demo1 + 密码 → 登录成功 ✅
4. F12 → Application → Local Storage → 应看到 `pg_pro_device`（UUID）+ `pg_pro_user`（含 deviceId）
5. EdgeOne 控制台 → KV → `account:demo1` 应看到 `devices: ["<那个UUID>"]`

### 场景 2：maxDevices=1 限制生效

1. 同一浏览器换 incognito 窗口（UUID 重新生成）→ 登录 demo1 → **应被拒**：error message = "此账号已在 1 台设备登录。请联系作者重置设备列表。"

### 场景 3：admin 重置设备

1. 打开 admin HTML → 「📱 设备管理」tab → 输 adminToken → 「🔄 拉取账号列表」 → 看到 demo1 + 设备数 1/1
2. 点「🔄 重置」 → 确认 → 应看到 "已清空 1 台"
3. KV 检查：`account:demo1` 的 `devices` 数组应是 `[]`
4. 回到 incognito 窗口 → 再登录 demo1 → 这次应成功 ✅

### 场景 4：fallback 兜底

1. EdgeOne 控制台把 `config:enabled` 改为 `false`（或删掉账号 KV）
2. 再登录 → console 应该有 `console.warn('[auth] 后端不可用，回退纯前端校验')` 警告
3. 登录仍**走 accounts.json 校验** → 成功 ✅

## 故障排查

| 现象 | 原因 | 修法 |
|---|---|---|
| `[auth] 后端不可用` console warn | Node Function 没部署 / KV 没绑 / KV key 拼错 | 检查 EdgeOne Pages 控制台"Functions"标签看部署日志 |
| 登录报 `参数缺失（需要 u, p, deviceId）` | 前端没生成 UUID | 清 LS 重试；F12 检查 `pg_pro_device` |
| 登录报 `用户名不存在` | KV 里没这个账号 | 先 put 账号；或检查 key 格式（`account:用户名` 不是 `account: 用户名`） |
| 登录报 `密码错误` | KV 里的 hash 不对 | sha256(salt+pass) 重算；salt 默认 `pg-pro-salt-v1` |
| admin 拉取报 `adminToken 未配置` | KV 没 put `config:adminToken` | EdgeOne KV 控制台 put |
| admin 拉取报 `admin token 错误` | admin HTML 输入的 token 跟 KV 不一致 | 复制粘贴别手敲 |

## 不在范围（待续）

- 自动迁移 accounts.json 数据到 KV（一次性脚本，部署完再做）
- JWT 签名升级（HMAC-SHA256，目前 base64 是占位）
- maxDevices > 1 时"踢掉最旧设备"逻辑（现在直接拒）
- admin-config API（远程改 maxDevices / enabled / salt）
- 用户自助踢设备（"我换了电脑"按钮）—— 现在仍要联系作者

## 变更记录

| 日期 | 变更 |
|---|---|
| 2026-07-11 | 初版：4 个 API + admin HTML 设备管理 tab |