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
- 单文件、完全离线、无 CDN、目标 ≤3MB（当前约 717KB，含内嵌真实古琴音频）
- 视觉：宣纸白 `#f7f5f0` 底 / 浓墨 `#1c1c1e` 字 / 墨青 `#2d5a6b` 强调；**禁止红色作主色或大面积色**
- 诗词内容与**统编版**小学语文课本对齐
- 用户进度/偏好存 `localStorage`（键 `pg_v1`），无账号系统

## 当前状态（截至 2026-06-20，v1.0+）
已完成：
- 133 首诗（小学70 + 初中63（含课外诵读与词曲），含课外诵读；小学1-6+初中7-9 课内古诗已基本覆盖，含《木兰诗》《关雎》《蒹葭》《水调歌头》《过零丁洋》等；年级 1-9 全覆盖）；五大入口（年级/卡片墙/知识图谱/地图/时间轴）+ 闯关；三角色（学生/家长/教师）可切换；探索/学习模式
- **批量扩充流水线**（/tmp 临时脚本思路）：用 pypinyin 自动生成逐字拼音（按标点切分对齐），多音字用每首 FIX 列表订正（如 著→zhuó/裳→cháng/参差→cēn cī/燕然→yān rán/冰塞川→sè）；新诗只需 正文+元数据+短译文，**测验由 `autoQuiz(p)` 自动生成**（作者/朝代/情感），详情页对缺省字段已健壮化。grade 7/8/9=初一/二/三。
- 详情页 8 区块（原文拼音ruby/注释/白话双版/情感意象/诗人/局部时间轴/单诗地图/练习/相关）
- 三类互动练习（选择/情感/连线）+ 得星进度；5 维搜索；教师打印学习单
- 知识图谱 2D 力导向 + 伪 3D；时间轴防重叠分层
- **诗词地图**（对标参考"诗词图卷"）：A1 缩放平移 / A2 真实晕渲地形(内嵌栅格染宣纸色)+山脉名 / A3 地形⇄素雅 / A4 古⇄今地名 / B1 名胜分类图标(山水楼关岳) / B2 足迹编号①②③ / 地点 hover 高亮 + 点空白关闭 tip
- **地图按诗人展开 + 清晰度**：顶部「诗人：全部 + 22 位」横滑选择行(`map-poets`)，选中某诗人→左侧列表只看其诗 + 顶部诗人简介头(印章/姓名/朝代生卒/入选数/×关闭)、地图标记只留其诗作地、有足迹则画。**清晰度**：标记/地名/足迹/名胜/山脉名缩放时反向缩放(`.zm` data-br / `.zt` data-bfs，`applyMarkScale` 在 `applyZoom` 调用)保持恒定屏幕尺寸不糊不重叠，描边用 `vector-effect=non-scaling-stroke`；滚轮缩放需 ⌘/Ctrl。
- **氛围·朗读与古琴（F）**：① 朗读——详情页「🔊 朗读」用 Web Speech API（`speechSynthesis`，零字节离线），**统一好听的标准诵读 + 普通话/粤语语种切换**（默认普通话 `语舒`→zh-CN，粤语 `善怡`→zh-HK；`recLang` 存 localStorage `pg_reclang`），统一 rate 0.84/pitch 1.0、逐句诵读 + 句间停顿 + 当前句高亮跟读，离开详情自动停。〔已废弃"诗人音色人设"：混了 zh-CN/HK/TW 不同语种致李白成粤语女声、贺知章颤音、孟浩然女声，用户反馈撤回。〕② 古琴背景音——导航「🎵 古琴」面板：默认零字节程序合成（Karplus-Strong 五声音阶 + 卷积混响），可调音量；「高音质」开关（**默认开**）播放内嵌真实古琴 `GUQIN_CLIP`＝《阳关三叠》(演奏 CharlieHuang，CC BY-SA 3.0，Wikimedia，已裁 24s 单声道循环 mp3，base64≈313KB)，面板内显示署名；留空时回退程序合成。
- **诗作列表联动（E）**：诗词地图左侧列表面板（与地图两栏，≤900px 堆叠）。E1 列表随年份游标过滤"截至 N 年·已问世 M 首"（播放时实时增长）/ E2 tab 全部·只看诗作·只看大事（大事=EVENTS）/ E3 `FAME` 传播度标注 + "仅代表作⇄全部"滑块（fame 阈值过滤）/ E4 点列表项→地图定位（缩放平移到该地+脉冲高亮+必要时推进年份点亮）、"读›"按钮→详情。
- **时间轴驱动·时空联动（D，参考图灵魂功能）**：诗词地图底部年份游标。D1 播放/暂停 + 1×/2×/4× 调速 + 可拖动手柄 / D2 年份推进时地图按 `poemYear` 逐步"点亮"该年前的诗作地（未到则淡出 .07），并实时计数"已问世 N/M 首" / D3 选中足迹诗人时游标上标注生/卒（如李白 生701·卒762） / D4 朝代渐变色带 + 分期标签（初/盛/中/晚唐·宋·元·明·清），随朝代筛选自动重定范围。播放用 setInterval（抗后台节流）、dt 钳制防跳。
- **诗人长廊（C）**：第六入口"✍ 诗人"。C1 诗人选择器(13 位诗人 chip，按朝代+生年排序，横滑、active 自动居中) / C2 诗人面板(印章头像+姓名+朝代生卒+简介+诗作数/足迹地数统计+代表诗作卡片(点击进详情、显示已得星)+足迹/诗作地 mini-map) / C3 足迹路线(李白/杜甫/王维有 ROUTES 者面板内画编号虚线，并"🗺 在大地图看足迹"联动 setMapPoet+showView('map')；无足迹者回退"诗作地点")

## 下一步 TODO（接手者从这里继续）
- [x] **C** 诗人选择器 + 诗人面板（生平/生卒/诗作列表）✅ 已完成并测试（2026-06-20）
- [x] **D** 时间轴驱动点亮（拖动/播放年份，地图随时间逐步点亮该年前的诗与到访地）✅ 已完成并测试（2026-06-20）
- [x] **E** 诗作列表联动 / 多维筛选 ✅ 已完成并测试（2026-06-20）
- [x] **F** 朗读（Web Speech 逐句高亮）+ 古琴背景音（程序合成）✅ 已完成并测试（2026-06-20）
  - [x] 已内嵌真实古琴《阳关三叠》(CharlieHuang, CC BY-SA 3.0, Wikimedia)，裁 24s 单声道循环 mp3，高音质默认开、面板署名 ✅（2026-06-20）
- [进行中] **内容扩充：覆盖小学+初中全部教材古诗（用户目标，分批进行）**
  - [x] 初中核心 30 首（含《木兰诗》）已加，年级扩至 7-9 ✅（2026-06-21）
  - [x] 小学三~六年级课内古诗补全（+36首：望天门山/饮湖上/望洞庭/赠刘景文/惠崇/三衢道中/暮江吟/雪梅/出塞/凉州词/夏日绝句/宿新市/四时田园×2/清平乐/芙蓉楼/塞下曲/墨梅/枫桥夜泊/长相思/示儿/题临安邸/稚子弄冰/村晚/从军行/秋夜将晓/闻官军/宿建德江/望湖楼/西江月/寒食/迢迢牵牛星/十五夜望月/马诗/石灰吟/竹石）；订正《己亥杂诗》→五上 ✅（2026-06-21，共100首）
  - [ ] 初中其余篇目（人教版 7-9 课外诵读，如 峨眉山月歌/江南逢李龟年/卖炭翁/白雪歌/酬乐天/无题/南乡子/破阵子/晚春/泊秦淮 等）
  - [ ] 各诗 related 相关推荐字段多为空（autoQuiz/详情已健壮，related 可后补）
  - 用上方「批量扩充流水线」继续：每批 6-8 首、独立小脚本（避免输出过大触发内容过滤）、注入后 reload 验证(总数/拼音0错位/geo/poet/console)、commit

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
- 知识图谱「聚焦渐进」：gFocus(null总览=朝代+诗人 / {t:poet}=该诗人+其诗作 / {t:dyn}=该代诗人)，gOnNodeTap 点诗人/朝代下钻、点诗作进详情，setGraphFocus/updateFocusBar/#g-focus-bar 返回总览。
- 知识图谱有三种布局 gLayout(force/radial/tree)：force 有 gAlpha 冷却定格(不再永久晃)；radial=类型同心环；tree=朝代>诗人>诗作径向层级(buildGraph 在 tree 时仅建这三类)。setGLayout 切换。
- 知识图谱「诗词」维度为核心 hub，**故意锁定常显**（`togDim` 对 `poem` 提前 return，chip 加 `.locked`+🔒+tooltip）——非 bug，勿放开。
- 知识图谱**诗人节点＝圆形+圆上写全名**（小学生对姓氏单字陌生，故写全名直读；曾试印章单字被用户否决）：`drawNode` 对 `type==='poet'` 写 `n.label` 全名(长名≥4字缩字防溢出)；半径 `poetBaseR(k)`=产出(入选诗数)为主+FAME名气微调(10~28px，李白r28/单首14.9)，buildGraph 末尾设 `n.r/n.top(≥5首→金边圈 #c8a86a)`；朝代/诗作仍圆形。改大小/金边阈值看 `poetBaseR/poetIsTop/poetPoemCount`。
- **诗人剪影头像**（`poetAvatarSVG(key)`，零字节内联 SVG）：按 `POET_FEMALE`(李清照/秋瑾) × `poetEraGroup(dyn)`(han/tang/square宋元明/qing) 出水墨剪影（白色figure+冠服，非真人长相）——男:巾帻/幞头/方巾/瓜皮帽，女:高髻/低髻立领。用于**大头像处**:诗人面板 `.poet-seal`(88)、诗人长廊 `.pav`(44)、地图诗人头 `.ml-poet-seal`(42)（均加 `overflow:hidden` 裁圆角）。知识图谱节点太小未用剪影(保留圆形+全名)。
- 诗词数据结构：`POEMS[]`（含 lines/anno/trans/transT/emo/imagery/place/placeModern/placeXY?/story/storyT/history/related/quiz），`POETS{}`（name/dyn/years/av/intro/born[投影xy]/route?），`EVENTS[]`。
- 氛围（F）：朗读模块 `recLang`(mandarin/cantonese，存 `pg_reclang`)/**通用选音** `_pickByLang`(filterRe,goodNames)：以语言代码(zh-CN/zh-HK)为锚、**离线 localService 优先**、避开 `REC_NOVELTY` 趣味音、再挑各平台标准名(Apple 语舒/婷婷·MS Huihui/Yaoyao·Android Google·zh-HK 善怡/Tracy)，跨 Mac/iPad/Android/Windows 自适应，网络音仅末位兜底/`pickMandarinVoice`/`pickCantoneseVoice`/`recVoicePick`/`setRecLang`(切语种+重读)/`reciteStart→reciteLine`(统一 rate 0.84·pitch 1.0，utterance.lang 按语种 zh-CN/zh-HK，逐句链 + `.ln.reciting` 高亮)/`reciteStop`(showView 非 detail 时调用)；语种切换 UI `#rec-lang`（`openDetail` 调 `recApplyLangAvail` 同步 active）；**跨设备保护** `recApplyLangAvail`：无 zh-HK 语音时置灰"粤语"按钮+提示+把已存粤语偏好回退普通话（`setRecLang`/`voiceschanged` 也调用）——应对 Windows 默认无粤语、安卓需下载粤语包的情况。**状态用 `var` 声明**避免 boot 期 TDZ。〔本机语种实况：zh-CN 标准音=语舒/婷婷；zh-HK 粤语仅善怡；zh-TW=美嘉；Eddy/Grandpa 等为趣味音勿用。〕古琴模块 `ambInit`(AudioContext+卷积混响)/`ksBuffer`(Karplus-Strong 缓存)/`ambPluck`/`ambTick`(随机五声音阶调度)/`ambStart/Stop/Toggle/SetVol/SetHifi`；`GUQIN_CLIP` 空串=回退程序合成；面板 `#amb-pop`。
- 诗作列表（E）：地图视图两栏 `.map-layout`（左 `#map-list` / 右 `.map-main`）。状态 `mapTab`('all'|'poem'|'event')/`mapFame`(0–100滑块)；`FAME{}`+`poemFame()`；`curMapPoems`(按 dyn+fame 过滤)/`renderMapList`(诗+EVENTS 混排，`rebuildMapTime` 调用)/`applyListYear`(按 `tlYear` 显隐+计数，`applyMapYear` 每帧调用)/`setMapTab`/`setMapFame`/`locatePoem`(缩放平移+`pulseAt` SMIL 脉冲)。
- 时间轴驱动（D）：`createdYear` 模糊串经 `poemYear(p)` 解析为数字年（世纪/朝代分期/年号兜底；时间轴 xOf 与地图共用）。地图 `.tl-mark[data-yr]` 标记诗作地，`buildMapSVG` 末尾缓存 `tlNodes` 并 `applyMapYear(tlYear)`；游标状态 `tlYear/tlMin/tlMax/tlPlaying/tlSpeed`，`refreshMapTime`(按 `mapVisiblePoems` 定范围)/`renderTimeScrubber`(色带 `TL_ERAS/TL_ERA_COL` + 生卒 ticks)/`tlPlay`(setInterval)/`tlSetYear`/`tlSetSpeed`。地图所有 setMap* 走 `rebuildMapTime()`；离开视图 `showView` 调 `tlPause()`。
- 诗人长廊：视图 `v-poets`，入口 tab `t-poets`，`showView` 分支 `renderPoets()`。核心函数 `renderPoetPicker/selectPoet(全局 poetSel)/renderPoetPanel/poetMapSVG/gotoMapPoet`；排序 `poetKeysSorted()`(DYN_ORDER+poetBirth)。足迹复用地图层 `PROVPATH/reliefImg('landclipp')/riversSVG/ROUTES`。CSS 类 `.poet-picker/.poet-chip/.poet-seal/.poet-hero/.poet-stats/.poet-sec`。

## 素材授权 / 致谢（含署名义务）
- 古琴背景音《阳关三叠》：演奏 **CharlieHuang**，**CC BY-SA 3.0**，来源 Wikimedia Commons（File:Guqin-Yangguan_Sandie.ogg）。**需署名**——已在「🎵 古琴」面板内标注；如再分发须保留署名与同源协议（share-alike）。
- 中国省界：阿里 DataV geoatlas。河流（长江/黄河）：Natural Earth。晕渲地形底图：Wikimedia "China edcp relief location map"。
- 以上均经投影/简化/裁剪后内联，离线零外链。

## 变更日志

| 日期 | 变更内容 |
|------|---------|
| 2026-06-21 | 诗人显眼度+剪影头像（用户多轮敲定）：①知识图谱诗人节点**圆形+圆上写全名**（曾试印章单字，用户因小学生不识姓氏字而否决，改回全名），大小按产出+名气（`poetBaseR`，李白r28/单首14.9），≥5首金边圈（李白/杜甫/苏轼/辛弃疾）；②新增**诗人剪影头像** `poetAvatarSVG`（性别×朝代冠服水墨剪影，零字节SVG，非真人长相），用于诗人面板/长廊/地图诗人头三处大头像（option1，图谱节点太小不用）；女诗人李清照/秋瑾。测试：68节点圆形+全名+分级、6类原型archetype解析正确(李清照女宋高髻/秋瑾女清立领/曹植汉巾帻等)、面板+68长廊头像渲染、聚焦李白13诗、3D无报错、控制台0报错、无红色 |
| 2026-06-21 | 修正聚焦模式UI不一致(用户指出总览有"诗词🔒"芯片却无诗词)：renderGControls 改为按 gFocus 条件渲染——总览/朝代模式不显示维度芯片(只给提示文字)，仅进入某诗人后才显示8个维度芯片(此时有诗作、维度才生效)。非数据bug，属UI一致性修正。测试:总览0芯片、诗人焦点8芯片、控制台0报错 |
| 2026-06-21 | 知识图谱"聚焦渐进展开"(用户要最清爽方案)：gFocus 三态——默认**总览**仅显示 朝代+诗人(约77点,去掉133首诗)；**点诗人**→只展开TA的诗作(如李白15点)；**点朝代**→看该代诗人；点诗作进详情；顶部"←返回总览"+当前焦点提示(updateFocusBar/gOnNodeTap/setGraphFocus)。layoutTree 支持总览两层(朝代→诗人)。三布局均适用。测试:总览77、李白聚焦13诗、唐代33诗人、控制台0报错 |
| 2026-06-21 | 知识图谱去拥挤(用户反馈太密)：①默认维度精简为 诗词+诗人+朝代(其余默认关)，并对老用户一次性迁移(localStorage pg_gv2)，节点 527→210；②节点大小自适配：force 按总数缩放(sqrt(130/n))、放射/树形按各环周长定大小(4~15px)避免圆圈重叠；③小节点(r<9)隐藏文字、悬停/点击仍显示，密集环变清爽小点；④立体旋转调慢(0.006→0.0034)；⑤图谱画布增高 560→640。测试:三布局清爽、控制台0报错 |
| 2026-06-21 | 知识图谱抗抖动+布局选择(用户反馈节点多一直晃)：①力导向加冷却 gAlpha(每帧*0.985，<0.02 冻结、位移*gAlpha)，稳定后定格不再抖，重新布局/切换时重置；②新增布局切换"引力图/放射星图/朝代树形"(setGLayout)：放射=按节点类型同心环(layoutRadial)、树形=朝代→诗人→诗作径向层级(layoutTree,仅这三类)，均为确定性静态布局零抖动。测试:force 500帧后冻结(位移0)、radial 527节点入环、tree 210节点三类、控制台0报错 |
| 2026-06-21 | 诗境图改为内联(用户反馈)：水墨意象小图直接显示在原文每句诗旁(lineScene()内联进 #d-verse 各 .ln，22px、opacity.78)，移除独立"诗画"标签(D_TABS 去 scene、详情面板回到8个)。ICONS/SCENE_SYN 复用。测试:春晓等逐句配图、标签回到8个、控制台0报错 |
| 2026-06-21 | 地图诗人选择行优化(用户反馈)：①**切朝代时诗人列表同步**——setMapDyn 调 renderMapPoets，新增 mapPoetKeys() 仅列当前朝代+年级有诗作的诗人(已按朝代+生年排序)，选中诗人若不属该朝代则重置；②**诗人搜索框**(#mp-search/filterMapPoets)，按姓名实时筛选(如输"杜"→杜甫/杜牧)。测试:全部68位、切宋代→16位宋人、搜索正常、控制台0报错 |
| 2026-06-21 | 教学增强三连(用户选做1/2/3)：①**配乐诵读**——朗读时自动轻起古琴(ambAutoR,音量降到0.18)、读毕自动停；②**诗境图·一句一画**——新增"诗画"详情标签(D_TABS加scene)，建22个水墨意象图标(ICONS)+同义映射(SCENE_SYN)，按诗句关键词逐句配图(poemSceneSVG)；③**炼字赏析卡**——独立 LIANZI 表(22首名篇)，详情"原文"标签内显示"品一个字"卡片。顺带健壮化:renderMiniGraph/buildGraph/relatedPoemsFor 的 p.imagery/p.history 加 ||[] 守卫(批量诗无imagery字段)。测试:三功能正常、迷你图谱/练习/知识图谱(527节点)无报错、控制台0报错、716KB |
| 2026-06-21 | ①补齐剩余初中词曲(122→133首:定风波/卜算子·咏梅/送鲍浩然/无题/咸阳城东楼/丑奴儿/临江仙/别云间/式微/子衿/梁甫行)；②**历史大事可点击讲故事**：EVENTS 富化(历史故事+对诗人诗作的影响+关联诗人/诗作)，地图列表「只看大事」每条可点→事件弹窗(#event-modal/openEvent)，诗人诗作 chip 可跳转。测试:133首拼音0错位、事件弹窗(安史之乱等)正常、控制台0报错、708KB |
| 2026-06-21 | 内容扩充·初中课外诵读：100→122首，补初中22首(七:峨眉山月歌/江南逢李龟年/行军九日/夜上受降城/逢入京使/晚春；八:野望/龟虽寿/赠从弟/庭中有奇树/卖炭翁/题破山寺后禅院/送友人/望洞庭湖赠张丞相；九:酬乐天扬州初逢/左迁至蓝关/商山早行/破阵子/白雪歌送武判官归京/南乡子·登京口北固亭/十五从军征/满江红)。新增诗人岑参/李益/韩愈/王绩/刘桢/常建/温庭筠/秋瑾。多音字订正(受降shòuxiáng/遗wèi/冷难着zhuó/兴亡xīng/强派qiǎng等)。测试:122首拼音0错位、全有geo/poet、无重复、控制台0报错、697KB |
| 2026-06-21 | 内容扩充·小学三~六年级：64→100首，补齐小学3-6年级课内古诗36首(望天门山/望洞庭/暮江吟/出塞/凉州词/夏日绝句/清平乐·村居/芙蓉楼送辛渐/墨梅/枫桥夜泊/长相思/示儿/题临安邸/从军行/闻官军收河南河北/西江月/寒食/迢迢牵牛星/十五夜望月/马诗/石灰吟/竹石等)，订正《己亥杂诗》→五上、补诗人辛弃疾及多音字(剥bāo/亡赖wú/单于chányú/轻骑jì/脉脉mò/纤纤xiān/降xiáng等)。新增约20位诗人。测试：100首拼音0错位、全有geo/poet、无重复id、控制台0报错、683KB |
| 2026-06-21 | 内容扩充·初中(目标覆盖全部小学+初中)：34→64首，新增初中核心30首(含《木兰诗》《关雎》《蒹葭》《水调歌头》《江城子·密州出猎》《过零丁洋》《山坡羊·潼关怀古》等)。基础改造：年级扩至7-9、详情/打印对缺省字段健壮化、新增 autoQuiz 自动测验、pypinyin 批量拼音流水线+多音字订正(著→zhuó/裳→cháng/参差→cēn cī/燕然→yān rán/冰塞川→sè)。新增16位诗人。测试：64首拼音0错位、全有geo/poet、控制台0报错、661KB。分批进行中(初中其余+小学中高年级待续) |
| 2026-06-21 | 朗读通用选音（用户要求跨 Mac/iPad/Android/Windows）：重写 `pickMandarin/CantoneseVoice` 为 `_pickByLang`——以语言代码为锚、离线 localService 优先、避趣味音、再挑各平台标准名，网络音仅兜底。模拟测试：Windows→Huihui(离线)、Android→Google 中文、iPad→语舒、Windows 默认无粤语→正确置灰、仅网络音→Google 普通话兜底，控制台 0 报错 |
| 2026-06-21 | 朗读跨设备保护：检测本机有无 zh-HK 粤语语音（本机仅善怡，Windows 默认无、安卓需下载包），无则置灰"粤语"+提示+回退普通话（`recApplyLangAvail`，`openDetail`/`setRecLang`/`voiceschanged` 调用）。另确认朗读早已全量统一（`recVoicePick` 不依赖诗人，34 首均同音色）。测试：有粤语→可用、模拟无粤语→置灰+回退、控制台 0 报错 |
| 2026-06-21 | 朗读改版·撤诗人音色+加语种切换（用户反馈：人设把 zh-CN/HK/TW 混用致李白粤语女声、贺知章颤音、孟浩然女声）：删 `POET_VOICE`/人设逻辑，恢复统一标准诵读（rate 0.84/pitch 1.0+句间停顿）；新增普通话/粤语切换（默认普通话语舒 zh-CN、粤语善怡 zh-HK，存 `pg_reclang`），详情页「普通话｜粤语」按钮。Claude Preview 测试：普通话→语舒/zh-CN、粤语→善怡/zh-HK、贺知章不再颤音、默认普通话、切换持久化、控制台 0 报错 |
| 2026-06-21 | 地图按诗人展开 + 清晰度（用户确认需求）：①诗词地图新增「诗人」横滑选择行(全部+22位)，选谁→左侧列表只看其诗+诗人简介头、地图标记只留其诗作地、有足迹则画；`renderMapPoets`/`curMapPoems`+`buildMapSVG` 加 mapPoet 过滤/`renderMapList` 加诗人头。②免费提清晰度：标记/地名/足迹/名胜/山脉名缩放时反向缩放(`.zm/.zt`+`applyMarkScale`)保持恒定屏幕尺寸、不再放大变粗变糊重叠，描边 non-scaling-stroke。Claude Preview 测试：23 chip、李白→6首+简介头、杜甫→足迹+2首、标记 r 5→1.25(@4×)/字 17→5.67(@3×) 全反向缩放、65 元素@5× 校验通过、控制台 0 报错 |
| 2026-06-20 | 朗读升级·诗人音色人设（用户确认需求，承接另一账号的 34 首+古琴版）：唐人无真实录音→改为按性格定制"音色"，`POET_VOICE` 映射音高/语速+语音池(clear/low/elder)，**覆盖全部 22 位诗人一人一声且稳定**（李白明亮豪放/杜甫低沉/王维清雅/贺知章 Grandpa 苍老/骆宾王童稚/北朝民歌苍茫/白居易平易/杨万里活泼…），详情页显示音色标签。Claude Preview 测试：22 诗人均有人设(无落默认)、各 rate·pitch·voice 区分、敕勒歌→苍茫、回乡偶书→苍老男声 speaking+高亮、古琴 base64 完好、控制台 0 报错 |
| 2026-06-20 | 内容扩充(一二年级,据统编版教材PDF核对)：20→34首。新增一上《江南》《画》《古朗月行》《风》、一下《池上》《小池》《寻隐者不遇》《画鸡》、二上《敕勒歌》《夜宿山寺》、二下《村居》《咏柳》《晓出净慈寺送林子方》《梅花》；订正《望庐山瀑布》→二上、二下《绝句》→"迟日江山丽"。新增9位诗人+8个地点经纬度。修复拼音逐字对齐(rubyLine按标点切分)、知识图谱属性/历史事件节点可点列相关诗。测试：34首拼音0错位、全有geo、控制台0报错、632KB |
| 2026-06-20 | F 收尾：内嵌真实古琴《阳关三叠》(CharlieHuang, CC BY-SA 3.0, Wikimedia)——ffmpeg 裁 24s 单声道淡入淡出循环 mp3(≈235KB)、base64 内联，高音质默认开、面板显示署名。Claude Preview 测试：decodeAudioData 成功(23.98s/单声道)、AudioContext running、播放路径无报错、控制台 0 报错、文件 614KB。新增「素材授权/致谢」章节 |
| 2026-06-20 | 完成 **F 氛围**：①朗读（Web Speech API 零字节离线，逐句诵读+高亮跟读，本地标准普通话语音如婷婷）②古琴背景音（Karplus-Strong 五声音阶程序合成+混响，音量可调，高音质开关预留内嵌真实古琴 `GUQIN_CLIP` 空则回退）。修复 boot 期 TDZ（状态改 var）、语音偏好高质量音避开趣味音色。Claude Preview 测试：婷婷离线语音选中、朗读 speaking+逐句高亮、停止清理、AudioContext running、ambPluck 无报错、面板音量/高音质回退提示、文件仅 329KB(零内嵌音频)、控制台 0 报错。待补：真实古琴授权音频 |
| 2026-06-20 | 完成 **E 诗作列表联动**：诗词地图左侧两栏列表。E1 随年份游标过滤+实时计数 / E2 全部·只看诗作·只看大事 tab / E3 传播度数据+仅代表作⇄全部滑块 / E4 点列表→地图定位脉冲+读›进详情。Claude Preview 测试：29 条(20诗+9事)混排、730 年→7首、tab 切换(20诗/9事)、滑块仅代表作→9 首高传播度、locate 缩放 1→2.8× 平移高亮、读›开详情、row⇄column 响应式(900px)、控制台 0 报错 |
| 2026-06-20 | 完成 **D 时间轴驱动·时空联动**（参考图灵魂功能）：地图底部年份游标 D1 播放+调速+拖动 / D2 逐年点亮诗作地+计数 / D3 诗人生卒标注 / D4 朝代渐变色带+分期标签。新增 `poemYear()` 模糊年份解析（时间轴/地图共用）。Claude Preview 测试：20 首年份解析无误(626–1839)、730 年 7/20 点亮、播放推进+暂停、4× 调速、唐代筛选重定范围(626–850)、李白生701/卒762 ticks、离开视图自动暂停、时间轴回归正常、控制台 0 报错 |
| 2026-06-20 | 完成 **C 诗人维度**：新增第六入口"✍ 诗人"（诗人选择器 C1 + 诗人面板 C2 + 足迹路线 C3，与大地图足迹联动）。Claude Preview 测试通过：13 chip、李白 4 作/5 段编号足迹、按钮联动地图、无足迹回退、cold reload 恢复视图、tablet/mobile 响应式、控制台 0 报错 |
| 2026-06-20 | v1.0+ 全面回归测试通过（五入口+详情+三类练习评分+搜索+教师打印+闯关锁；离线0外部请求、控制台0报错、tablet响应式、无红色主色），确认无回归后再开 C/D 新功能。详见 PROJECT_PLAN 变更日志 |
| 2026-06-20 | 初始创建：建立跨 AI 工具接手机制，作为项目单一事实来源 |
