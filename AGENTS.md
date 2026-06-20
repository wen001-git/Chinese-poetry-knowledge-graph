# AGENTS.md — AI 协作接手须知（任何 AI 编程工具请先读本文件）

> 本文件是本项目的**单一事实来源（SSOT）**，供 Claude Code / Codex / Cursor 等任意工具无缝接手。
>
> **会话开始**：先读 ①本文件 → ②`docs/PROJECT_PLAN.md`（进度+变更日志）→ ③`docs/DESIGN.md`（设计）。**不要重新全量扫描代码库**（最省 token）。
> **完成改动**：更新本文件「当前状态/下一步 TODO」，并在 `docs/PROJECT_PLAN.md` 变更日志追加一行。
> **原则**：状态写进**仓库文件**（可移植，所有工具可读）；不要只依赖某工具的私有记忆（Claude 的 `~/.claude/.../memory`、Codex 等彼此读不到）。

## 一句话
中国诗词知识图谱，面向小学生的**单文件离线 HTML**：`poemgraph.html`。水墨画风、禁红色主色。

## 交付物 & 运行 & 测试
- 唯一交付物：`poemgraph.html`（HTML+CSS+JS+诗词数据**全部内嵌**，无外部依赖，离线打开即用）
- 本地预览：`python3 -m http.server 8123`，浏览器开 `http://localhost:8123/poemgraph.html`
- **里程碑测试规则（强制）**：每完成一项就做一次全面测试——断网可用、五入口与详情页正常、控制台无报错、iPad/桌面响应式、水墨配色无红色主色。通过后才算完成。

## 硬约束（不可违反）
- 单文件、完全离线、无 CDN、目标 ≤3MB（当前约 294KB）
- 视觉：宣纸白 `#f7f5f0` 底 / 浓墨 `#1c1c1e` 字 / 墨青 `#2d5a6b` 强调；**禁止红色作主色或大面积色**
- 诗词内容与**统编版**小学语文课本对齐
- 用户进度/偏好存 `localStorage`（键 `pg_v1`），无账号系统

## 当前状态（截至 2026-06-20，v1.0+）
已完成：
- 20 首诗完整数据；五大入口（年级/卡片墙/知识图谱/地图/时间轴）+ 闯关；三角色（学生/家长/教师）可切换；探索/学习模式
- 详情页 8 区块（原文拼音ruby/注释/白话双版/情感意象/诗人/局部时间轴/单诗地图/练习/相关）
- 三类互动练习（选择/情感/连线）+ 得星进度；5 维搜索；教师打印学习单
- 知识图谱 2D 力导向 + 伪 3D；时间轴防重叠分层
- **诗词地图**（对标参考"诗词图卷"）：A1 缩放平移 / A2 真实晕渲地形(内嵌栅格染宣纸色)+山脉名 / A3 地形⇄素雅 / A4 古⇄今地名 / B1 名胜分类图标(山水楼关岳) / B2 足迹编号①②③ / 地点 hover 高亮 + 点空白关闭 tip

## 下一步 TODO（接手者从这里继续）
- [ ] **C** 诗人选择器 + 诗人面板（生平/生卒/诗作列表）
- [ ] **D** 时间轴驱动点亮（拖动/播放年份，地图随时间逐步点亮该年前的诗与到访地）——参考图灵魂功能
- [ ] **E** 诗作列表联动 / 多维筛选
- [ ] **F** 背景古琴音乐（需权衡文件体积，可选/最后）

## 文件地图
- `poemgraph.html` — 全部代码与数据（改动主要在这里）
- `docs/PROJECT_PLAN.md` — 里程碑进度 + **变更日志（完整历史看这里）**
- `docs/DESIGN.md` — 产品/视觉/数据结构设计（v2.2）
- `CLAUDE.md` — 项目规则（文档维护、视觉约束、里程碑测试）

## 关键实现备忘（改地图前必看）
- 投影函数 `proj(lon,lat)` + 常数 `PROJ`；中国省界 `PROVPATH`（阿里 DataV）、长江黄河 `RIVER_YZ/RIVER_YH`（Natural Earth）、地形底图 `RELIEF`（Wikimedia edcp，等距圆柱投影便于线性对齐），均已投影简化内联。
- 诗词地点按真实经纬度 `GEO[placeModern]`→`GEOXY` 定位；诗人足迹 `ROUTE_GEO`/`ROUTES`；山脉名 `RANGES_GEO`；名胜 `LANDMARKS`。
- 地图主渲染：`buildMapSVG()`；缩放：`mapK/mapTX/mapTY` + `applyZoom/zoomAt/zoomCenter/resetZoom`；地图内容包在 `<g id="mapZoomG">` 内随缩放。
- 诗词数据结构：`POEMS[]`（含 lines/anno/trans/transT/emo/imagery/place/placeModern/placeXY?/story/storyT/history/related/quiz），`POETS{}`，`EVENTS[]`。

## 变更日志

| 日期 | 变更内容 |
|------|---------|
| 2026-06-20 | 初始创建：建立跨 AI 工具接手机制，作为项目单一事实来源 |
