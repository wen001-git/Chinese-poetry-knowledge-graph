> 目的：说明如何用 Render Free/Web Service 部署 PoemGraph 设备数量限制后端　目标读者：项目作者和接手 AI　如何阅读：先看推荐部署路径，再按需查看环境变量、测试方法和限制。

# Render 设备限制后端部署

## 推荐路径

当前 `poemgraph` 是 Render Static Site，只能托管 HTML/CSS/JSON，不能运行 `/api/login` 这种后端接口。设备数量限制需要新建一个 Render Web Service 来跑 `render-auth-server.mjs`。

Render Free 推荐保留 Static Site，再额外建一个 Web Service 专门做 API。理由是 Static Site 不休眠，页面打开更稳；Web Service 免费版会休眠，分离后只有登录/设备校验可能遇到冷启动，不会拖慢整页首屏。

不要先停掉现有 Static Site。先让两个服务并存：

1. 保留现有 Static Site 和 `poem.leewen.work`。
2. 新建 Render Web Service，先使用 Render 分配的 `*.onrender.com` 临时域名测试。
3. 测试前端时用 `?api=https://你的-web-service.onrender.com`，或把 HTML 里的 `<meta name="x-auth-api">` 改成 Web Service 地址。
4. 测通后默认继续保留 Static Site，把 `<meta name="x-auth-api">` 指向 Web Service。

同一个自定义域名不能同时绑定到 Static Site 和 Web Service。推荐用两个域名：

- `poem.leewen.work`：Static Site，负责 HTML 和静态资源。
- `api.poem.leewen.work` 或 Render 自带 `*.onrender.com`：Web Service，负责 `/api/*`。

若未来升级为不休眠的付费 Web Service，或想用一个服务简化同源/CORS 配置，可以再把 `poem.leewen.work` 迁到 Web Service；当前 Node 后端也能托管 `poemgraph-pro.html`、`account-admin.html`、`accounts.json` 等静态文件。

## Render Web Service 设置

在 Render 新建 Web Service：

- Source：同一个 GitHub 仓库
- Branch：`main`
- Runtime：Node
- Build Command：`npm install`
- Start Command：`npm start`
- Plan：Free

环境变量：

| 变量 | 示例 | 说明 |
|------|------|------|
| `AUTH_SECRET` | Render 自动生成 | 签发登录 token 的密钥，必须保密 |
| `ADMIN_TOKEN` | 自己设置一串长随机字符串 | 管理页设备管理接口的管理员口令 |
| `MAX_DEVICES` | `1` | 默认每个账号允许绑定的设备数 |
| `SESSION_DAYS` | `7` | 登录 token 有效天数 |
| `AUTH_DATA_DIR` | `data` | 可选，设备数据库目录 |

部署后访问：

- `https://你的-web-service.onrender.com/health`：健康检查
- `https://你的-web-service.onrender.com/poemgraph-pro.html`：Pro 页面
- `https://你的-web-service.onrender.com/account-admin.html`：账号管理页

## UptimeRobot

Render Free Web Service 会休眠。可以用 UptimeRobot 每 5 分钟 ping：

```text
https://你的-web-service.onrender.com/health
```

这样能降低冷启动概率。仍要接受免费服务偶尔有冷启动或平台限制。

## 设备限制逻辑

登录时前端会生成本机设备 ID 并调用：

```text
POST /api/login
```

后端会：

1. 校验用户名和密码哈希。
2. 如果该设备已绑定，直接允许登录。
3. 如果未绑定且设备数未满，自动绑定该设备。
4. 如果设备数已满，拒绝登录并提示联系管理员解绑。

管理页「设备管理」tab 使用 `ADMIN_TOKEN` 调用：

- `/api/admin/list`：查看每个账号绑定设备
- `/api/admin/reset`：清空某个账号设备
- `/api/admin/add-device`：手动添加设备 ID
- `/api/admin/set-max-devices`：单独设置某账号允许设备数

## 重要限制

当前版本为了便宜和快速上线，设备绑定数据默认存在 Web Service 本地文件 `data/auth-db.json`。这适合先试跑，但不是最稳的商业化存储：

- Render 实例重启、重新部署或平台迁移时，本地文件可能丢失。
- 若后续需要强可靠，应升级为 Render Disk、Postgres、Redis，或等待 EdgeOne KV 审批通过后迁到 KV。

本版本的价值是先把设备限制闭环跑通，费用最低，架构也方便以后替换存储层。

## 变更记录

| 日期 | 变更内容 |
|------|---------|
| 2026-07-13 | 调整推荐路径：Render Free 默认采用 Static Site + API Web Service 分离，避免页面首屏被免费 Web Service 冷启动拖慢。 |
| 2026-07-13 | 初始创建：记录 Render Free/Web Service 部署设备限制后端的方法，说明 Static Site 与 Web Service 的域名取舍和当前文件存储限制。 |
