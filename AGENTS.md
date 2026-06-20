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
- **氛围·朗读与古琴（F）**：① 朗读——详情页「🔊 朗读」用 Web Speech API（`speechSynthesis`，零字节离线），优先本地标准普通话语音（婷婷/美嘉…），逐句诵读 + 当前句高亮跟读，离开详情自动停。② 古琴背景音——导航「🎵 古琴」面板：默认零字节程序合成（Karplus-Strong 五声音阶 + 卷积混响），可调音量；「高音质」开关播放内嵌真实古琴片段 `GUQIN_CLIP`（**当前留空→自动回退程序合成并提示**，待补可商用音频的 base64 data URI）。
- **诗作列表联动（E）**：诗词地图左侧列表面板（与地图两栏，≤900px 堆叠）。E1 列表随年份游标过滤"截至 N 年·已问世 M 首"（播放时实时增长）/ E2 tab 全部·只看诗作·只看大事（大事=EVENTS）/ E3 `FAME` 传播度标注 + "仅代表作⇄全部"滑块（fame 阈值过滤）/ E4 点列表项→地图定位（缩放平移到该地+脉冲高亮+必要时推进年份点亮）、"读›"按钮→详情。
- **时间轴驱动·时空联动（D，参考图灵魂功能）**：诗词地图底部年份游标。D1 播放/暂停 + 1×/2×/4× 调速 + 可拖动手柄 / D2 年份推进时地图按 `poemYear` 逐步"点亮"该年前的诗作地（未到则淡出 .07），并实时计数"已问世 N/M 首" / D3 选中足迹诗人时游标上标注生/卒（如李白 生701·卒762） / D4 朝代渐变色带 + 分期标签（初/盛/中/晚唐·宋·元·明·清），随朝代筛选自动重定范围。播放用 setInterval（抗后台节流）、dt 钳制防跳。
- **诗人长廊（C）**：第六入口"✍ 诗人"。C1 诗人选择器(13 位诗人 chip，按朝代+生年排序，横滑、active 自动居中) / C2 诗人面板(印章头像+姓名+朝代生卒+简介+诗作数/足迹地数统计+代表诗作卡片(点击进详情、显示已得星)+足迹/诗作地 mini-map) / C3 足迹路线(李白/杜甫/王维有 ROUTES 者面板内画编号虚线，并"🗺 在大地图看足迹"联动 setMapPoet+showView('map')；无足迹者回退"诗作地点")

## 下一步 TODO（接手者从这里继续）
- [x] **C** 诗人选择器 + 诗人面板（生平/生卒/诗作列表）✅ 已完成并测试（2026-06-20）
- [x] **D** 时间轴驱动点亮（拖动/播放年份，地图随时间逐步点亮该年前的诗与到访地）✅ 已完成并测试（2026-06-20）
- [x] **E** 诗作列表联动 / 多维筛选 ✅ 已完成并测试（2026-06-20）
- [x] **F** 朗读（Web Speech 逐句高亮）+ 古琴背景音（程序合成）✅ 已完成并测试（2026-06-20）
  - [ ] 待补：`GUQIN_CLIP` 填入可商用授权的真实古琴 base64（高音质开关现回退程序合成）——需用户提供文件或授权下载

## 文件地图
- `poemgraph.html` — 全部代码与数据（改动主要在这里）
- `docs/PROJECT_PLAN.md` — 里程碑进度 + **变更日志（完整历史看这里）**
- `docs/DESIGN.md` — 产品/视觉/数据结构设计（v2.2）
- `CLAUDE.md` — 项目规则（文档维护、视觉约束、里程碑测试）

## 关键实现备忘（改地图前必看）
- 投影函数 `proj(lon,lat)` + 常数 `PROJ`；中国省界 `PROVPATH`（阿里 DataV）、长江黄河 `RIVER_YZ/RIVER_YH`（Natural Earth）、地形底图 `RELIEF`（Wikimedia edcp，等距圆柱投影便于线性对齐），均已投影简化内联。
- 诗词地点按真实经纬度 `GEO[placeModern]`→`GEOXY` 定位；诗人足迹 `ROUTE_GEO`/`ROUTES`；山脉名 `RANGES_GEO`；名胜 `LANDMARKS`。
- 地图主渲染：`buildMapSVG()`；缩放：`mapK/mapTX/mapTY` + `applyZoom/zoomAt/zoomCenter/resetZoom`；地图内容包在 `<g id="mapZoomG">` 内随缩放。
- **滚轮缩放需按 ⌘/Ctrl**（`bindMapZoom` 的 wheel 处理：无修饰键直接 return 让页面正常滚动，避免小屏卡在地图无法下滚；触控板捏合带 ctrlKey 仍可缩放）——勿改回"无条件 preventDefault 缩放"。+/- 按钮与左下角提示 `#map-zoom-hint`。
- 知识图谱「诗词」维度为核心 hub，**故意锁定常显**（`togDim` 对 `poem` 提前 return，chip 加 `.locked`+🔒+tooltip）——非 bug，勿放开。
- 诗词数据结构：`POEMS[]`（含 lines/anno/trans/transT/emo/imagery/place/placeModern/placeXY?/story/storyT/history/related/quiz），`POETS{}`（name/dyn/years/av/intro/born[投影xy]/route?），`EVENTS[]`。
- 氛围（F）：朗读模块 `pickZhVoice`(偏好高质量本地普通话音)/`reciteStart→reciteLine`(逐句 utterance 链 + `.ln.reciting` 高亮)/`reciteStop`(showView 非 detail 时调用)；**状态用 `var` 声明**避免 boot 期 showView→reciteStop 的 TDZ。古琴模块 `ambInit`(AudioContext+卷积混响)/`ksBuffer`(Karplus-Strong 缓存)/`ambPluck`/`ambTick`(随机五声音阶调度)/`ambStart/Stop/Toggle/SetVol/SetHifi`；`GUQIN_CLIP` 空串=回退程序合成；面板 `#amb-pop`。
- 诗作列表（E）：地图视图两栏 `.map-layout`（左 `#map-list` / 右 `.map-main`）。状态 `mapTab`('all'|'poem'|'event')/`mapFame`(0–100滑块)；`FAME{}`+`poemFame()`；`curMapPoems`(按 dyn+fame 过滤)/`renderMapList`(诗+EVENTS 混排，`rebuildMapTime` 调用)/`applyListYear`(按 `tlYear` 显隐+计数，`applyMapYear` 每帧调用)/`setMapTab`/`setMapFame`/`locatePoem`(缩放平移+`pulseAt` SMIL 脉冲)。
- 时间轴驱动（D）：`createdYear` 模糊串经 `poemYear(p)` 解析为数字年（世纪/朝代分期/年号兜底；时间轴 xOf 与地图共用）。地图 `.tl-mark[data-yr]` 标记诗作地，`buildMapSVG` 末尾缓存 `tlNodes` 并 `applyMapYear(tlYear)`；游标状态 `tlYear/tlMin/tlMax/tlPlaying/tlSpeed`，`refreshMapTime`(按 `mapVisiblePoems` 定范围)/`renderTimeScrubber`(色带 `TL_ERAS/TL_ERA_COL` + 生卒 ticks)/`tlPlay`(setInterval)/`tlSetYear`/`tlSetSpeed`。地图所有 setMap* 走 `rebuildMapTime()`；离开视图 `showView` 调 `tlPause()`。
- 诗人长廊：视图 `v-poets`，入口 tab `t-poets`，`showView` 分支 `renderPoets()`。核心函数 `renderPoetPicker/selectPoet(全局 poetSel)/renderPoetPanel/poetMapSVG/gotoMapPoet`；排序 `poetKeysSorted()`(DYN_ORDER+poetBirth)。足迹复用地图层 `PROVPATH/reliefImg('landclipp')/riversSVG/ROUTES`。CSS 类 `.poet-picker/.poet-chip/.poet-seal/.poet-hero/.poet-stats/.poet-sec`。

## 变更日志

| 日期 | 变更内容 |
|------|---------|
| 2026-06-20 | 完成 **F 氛围**：①朗读（Web Speech API 零字节离线，逐句诵读+高亮跟读，本地标准普通话语音如婷婷）②古琴背景音（Karplus-Strong 五声音阶程序合成+混响，音量可调，高音质开关预留内嵌真实古琴 `GUQIN_CLIP` 空则回退）。修复 boot 期 TDZ（状态改 var）、语音偏好高质量音避开趣味音色。Claude Preview 测试：婷婷离线语音选中、朗读 speaking+逐句高亮、停止清理、AudioContext running、ambPluck 无报错、面板音量/高音质回退提示、文件仅 329KB(零内嵌音频)、控制台 0 报错。待补：真实古琴授权音频 |
| 2026-06-20 | 完成 **E 诗作列表联动**：诗词地图左侧两栏列表。E1 随年份游标过滤+实时计数 / E2 全部·只看诗作·只看大事 tab / E3 传播度数据+仅代表作⇄全部滑块 / E4 点列表→地图定位脉冲+读›进详情。Claude Preview 测试：29 条(20诗+9事)混排、730 年→7首、tab 切换(20诗/9事)、滑块仅代表作→9 首高传播度、locate 缩放 1→2.8× 平移高亮、读›开详情、row⇄column 响应式(900px)、控制台 0 报错 |
| 2026-06-20 | 完成 **D 时间轴驱动·时空联动**（参考图灵魂功能）：地图底部年份游标 D1 播放+调速+拖动 / D2 逐年点亮诗作地+计数 / D3 诗人生卒标注 / D4 朝代渐变色带+分期标签。新增 `poemYear()` 模糊年份解析（时间轴/地图共用）。Claude Preview 测试：20 首年份解析无误(626–1839)、730 年 7/20 点亮、播放推进+暂停、4× 调速、唐代筛选重定范围(626–850)、李白生701/卒762 ticks、离开视图自动暂停、时间轴回归正常、控制台 0 报错 |
| 2026-06-20 | 完成 **C 诗人维度**：新增第六入口"✍ 诗人"（诗人选择器 C1 + 诗人面板 C2 + 足迹路线 C3，与大地图足迹联动）。Claude Preview 测试通过：13 chip、李白 4 作/5 段编号足迹、按钮联动地图、无足迹回退、cold reload 恢复视图、tablet/mobile 响应式、控制台 0 报错 |
| 2026-06-20 | v1.0+ 全面回归测试通过（五入口+详情+三类练习评分+搜索+教师打印+闯关锁；离线0外部请求、控制台0报错、tablet响应式、无红色主色），确认无回归后再开 C/D 新功能。详见 PROJECT_PLAN 变更日志 |
| 2026-06-20 | 初始创建：建立跨 AI 工具接手机制，作为项目单一事实来源 |
