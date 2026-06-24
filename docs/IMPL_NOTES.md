# IMPL_NOTES — 关键实现备忘（改对应模块前**按需**读，平时接手不必读）

> 从 AGENTS.md 拆出来省 token。AGENTS 只留「当前状态/TODO」；改某子系统前来读这里对应段。

## 锚点地图 · 函数/数据→行号（接手定位用，**别宽读/宽 grep 那个 818KB 单文件**）

> 用法：要改哪个函数 → 直接 `Read poemgraph.html offset=该行 limit=20~40`，跳读那一段，**不整文件读、不碰数据区**。
> 行号会随改动漂移，偏了就用这条**廉价刷新命令**重抓(截断长行防爆 token)：
> `grep -nE '^function [a-zA-Z]|^const [A-Z]' poemgraph.html | cut -c1-46`
> 看改动用 `git diff --stat`；grep 内容务必 `… | cut -c1-100`(单条诗数据行长达 231 字符)。

**启动/路由/角色** boot 1908 · pickRole 1923 · applyRole 1927 · pickGrade 1932 · updateChips 1935 · setMode 1942 · showView 1953 · visiblePoems 1969
**年级/卡片墙** renderGradeList 1977 · renderFilters 1999 · renderCards 2010
**详情页(8区块)** openDetail 2037 · rubyLine 2053 · dTab 2063 · fillDetail 2069 · backFromDetail 2116
**练习** autoQuiz 2124 · buildQuiz 2134 · pickChoice 2165 · pickMatch 2171 · submitQuiz 2201
**知识图谱** renderGControls 2233 · togDim 2247 · poetBaseR 2250 · buildGraph 2258 · layoutRadial/Tree 2295/2305 · gOnNodeTap 2336 · nodeNeighbors 2345 · expandNode 2361 · collapseNode 2384 · setGraphFocus 2403 · updateFocusBar 2404 · renderGraph 2411 · tick 2434 · draw2D/3D 2452/2460 · drawNode 2478 · graphHit 2499 · bindGraphEvents 2505 · showGPop 2548 · toggle3D 2571 · renderMiniGraph 2578
**地图·投影/绘图** proj 2608 · reliefImg 2616 · ridgePath 2630 · ridgeCrest 2639 · ridgesSVG 2648(2D浮雕山脉) · rangeLabelsSVG 2667 · placeName 2708 · riversSVG 2717 · miniMapSVG 2720 · landmarksSVG 2753 · buildMapSVG 2960(主渲染) · applyMarkScale 3047
**地图·控件/交互** renderMap 2759 · mapPoetKeys 2761(拼音排序) · renderMapPoets 2769 · filterMapPoets 2784 · renderMapControls 2936(标注4选1+学生折叠) · toggleMapMore 2955 · setMapDyn/Poet/Terrain/Label 2956-2959 · 缩放 clampZoom/applyZoom/zoomAt 3055-3058 · bindMapZoom 3066 · ensureZoomCtrl 3079 · showMapPop 3095
**时间轴/时空联动** rebuildMapTime 2792 · refreshMapTime 2800 · applyMapYear 2806 · renderTimeScrubber 2816 · tlPlay 2849 · renderMapList 2868 · openEvent 2895(事件卡+男声朗读) · closeEvent 2911 · locatePoem 2920 · poemYear 3113 · renderTimeline 3121
**诗人长廊** poetKeysSorted 3159 · poetAvatarSVG 3171 · renderPoets 3195 · renderPoetPicker 3201 · selectPoet 3210 · renderPoetPanel 3215 · gotoMapPoet 3241 · poetMapSVG 3242
**学习路径/搜索/打印** renderPath 3277 · initSearch 3300 · doSearch 3318 · buildPrintSheet 3341 · printSheet 3354
**朗读/古琴(F)** pickMandarinVoice/pickCantoneseVoice/recVoicePick/pickNarratorVoice · eventNarrate/evtNarrLine · setRecLang · _ttsKeep(跨平台保活) · **reciteStart**(TTS优先,无音色→内嵌音频) · reciteLine(逐句TTS+高亮) · **recitePlayAudio**(整首内嵌mp3兜底+整体高亮) · reciteStop · `RECITE_AUDIO`(57首预渲染朗读base64,在recite函数前) · ambStart/Stop/Toggle/ambPlayClip · `GUQIN_CLIP`(古琴音频)
> 注:朗读区行号因内嵌音频/注释改动漂移较大,用 `grep -n 'function reciteStart\|const RECITE_AUDIO' poemgraph.html` 现取。
**注释就地渲染** annoEsc · circledNum(①②③圈码) · rubyLine(l,annos)(拼音ruby+注释词包裹+圈码) · ridge?無 · showAnnoPop/hideAnnoPop/bindAnnoPop(悬停+点击双轨气泡) — 均在 openDetail/rubyLine 附近,`grep -n 'function rubyLine\|function bindAnnoPop'` 定位

**数据区(只在改"内容"时读，改代码勿碰)**：POETS 730 · EVENTS 802 · POEMS 814 · LIANZI 1809 · ICONS 1833 · ROLE_INFO 1885 · PROVPATH/RIVER/RELIEF 2609-2615 · RIDGES 2618 · RANGES_GEO 2666 · GEO 2668 · ROUTE_GEO 2696 · FAME 2737 · LANDMARKS 2742 · TL_ERAS 2797 · DYN_ORDER 3156 · GUQIN_CLIP 3511(内嵌音频,极大,勿读)

**CSS 区块(行号见横幅 `/* ═══ X ═══ */`)**：设计系统 8 · 蒙层 37 · 顶栏 60 · 卡片墙 102 · 图谱/地图/时间轴通用 122 · 地图 261 · 时间轴 287 · 详情页 312 · 练习 399 · 学习路径 440 · 搜索 457 · 响应式 496 · 打印 509

## 地图（改地图前必看）
- 投影 `proj(lon,lat)`+`PROJ`；省界 `PROVPATH`(阿里DataV)、长江黄河 `RIVER_YZ/RIVER_YH`(Natural Earth)、地形底图 `RELIEF`(Wikimedia edcp 等距圆柱)，均投影简化内联。
- 诗词地点按真实经纬度 `GEO[placeModern]`→`GEOXY`；诗人足迹 `ROUTE_GEO`/`ROUTES`；山脉名 `RANGES_GEO`；名胜 `LANDMARKS`。
- 主渲染 `buildMapSVG()`；缩放 `mapK/mapTX/mapTY`+`applyZoom/zoomAt/zoomCenter/resetZoom`，内容包在 `<g id="mapZoomG">`。
- **滚轮缩放需按 ⌘/Ctrl**（`bindMapZoom` 无修饰键直接 return 让页面滚动；触控板捏合带 ctrlKey 仍缩放）——勿改回"无条件 preventDefault"。+/- 按钮+`#map-zoom-hint`。
- **2D 浮雕山脉**(已删 3D 立体沙盘)：`RIDGES`(10条)经 `ridgesSVG` 画落地投影+`mtnG`体积渐变+`ridgeCrest`受光顶线；始终平面、可缩放可点、文字不变形。勿恢复 CSS3D 倾斜(`toggleMapTilt` 已删，文字变形/交互暂停)。
- 标注**4选1单选** `mapLabel`∈{ancient,modern,landmark,none}（古地名｜现代名｜⛰名胜｜无）：任一时刻只渲一层文字防小屏重叠；`setMapLabel`。墨珠地标(`beadG`+`.zme`影)恒显可点+透明命中圈 `zm-hit`(r16,3倍热区)。
- 缩放反向缩放保持恒定屏幕尺寸：`.zm` data-br / `.zt` data-bfs，`applyMarkScale` 在 `applyZoom` 调用；描边 `vector-effect=non-scaling-stroke`。
- 地图按诗人展开：`map-poets` 横滑行，`mapPoetKeys`(按姓名拼音排序，去印章单字 `po.av`)、`curMapPoems`+`buildMapSVG` 加 mapPoet 过滤、`renderMapList` 加诗人头。

## 知识图谱
- 「聚焦渐进」：`gFocus`(null总览=朝代+诗人 / {t:poet}=该诗人+其诗作 / {t:dyn}=该代诗人)，`gOnNodeTap` 单击诗人/朝代下钻、诗作进详情；`setGraphFocus/updateFocusBar/#g-focus-bar` 返回。
- **双击展开 1-hop**：累积式图数据库交互，再双击折叠，封顶12+重置+种子保护（用户原想"纯自由展开无上限"，当前是克制版）。
- 三布局 `gLayout`(force/radial/tree)：force 有 `gAlpha` 冷却定格；radial=类型同心环；tree=朝代>诗人>诗作。`setGLayout`。
- 「诗词」维度为核心 hub **故意锁定常显**（`togDim` 对 `poem` 提前 return + `.locked`🔒）——非 bug 勿放开。
- **诗人节点=圆形+圆上写全名**（小学生不识姓氏单字，曾试印章单字被否决）：`drawNode` 写 `n.label` 全名；半径 `poetBaseR(k)`=产出+FAME微调(10~28px)，`n.top`(≥5首→金边圈 #c8a86a)。改阈值看 `poetBaseR/poetIsTop/poetPoemCount`。
- **诗人剪影头像** `poetAvatarSVG(key)`(零字节SVG)：`POET_FEMALE`(李清照/秋瑾)×`poetEraGroup(dyn)`(han/tang/square/qing)出冠服剪影；用于诗人面板 `.poet-seal`(88)/长廊 `.pav`(44)/地图诗人头 `.ml-poet-seal`(42)，均 `overflow:hidden`。图谱节点太小未用剪影。

## 数据结构
- `POEMS[]`(lines/anno/trans/transT/emo/imagery/place/placeModern/placeXY?/story/storyT/history/related/quiz)，`POETS{}`(name/dyn/years/av/intro/born[投影xy]/route?)，`EVENTS[]`。

## 朗读 & 古琴（F）
- **通用选音** `_pickByLang(filterRe,goodNames)`：以语言代码(zh-CN/zh-HK)为锚、**离线 localService 优先**、避 `REC_NOVELTY` 趣味音、再挑各平台标准名(Apple语舒/婷婷·MS Huihui/Yaoyao·zh-HK善怡)，网络音仅末位兜底。`pickMandarinVoice/pickCantoneseVoice/recVoicePick/setRecLang`。
- 诗词诵读：`recLang`(mandarin/cantonese 存 `pg_reclang`)，`reciteStart→reciteLine`(rate 0.84·pitch 1.0，逐句 `.ln.reciting` 高亮)，`reciteStop`(离开 detail 调用)；`#rec-lang` 切换 + `recApplyLangAvail` 跨设备保护(无 zh-HK 置灰粤语)。**状态用 `var`** 避免 boot 期 TDZ。
- 历史大事朗读 `eventNarrate/evtNarrLine/pickNarratorVoice/NARRATOR_MALE`；`_splitForTTS` 按句末标点切短句(≤43字，避 Chrome/Android/Win >15s 截断 bug)；speak 须在点击手势内(iOS)。**清晰优先选音**：`NARRATOR_MALE` 只列清晰男声(Win Kangkang/云希等)、**排除 Apple 角色音 Reed/Rocko/Eddy/Li-Mu(有拖音)**；`pickNarratorVoice` 离线清晰男声→网络男声→`pickMandarinVoice()`(Apple 无男声退语舒，清晰)。pitch/rate=1.0 原生零处理。〔Apple/iPad 系统无清晰男普通话音，故 Apple 上讲故事用清晰女声语舒；Windows 用清晰男声 Kangkang。〕
- 古琴：`ambInit`(AudioContext+卷积混响)/`ksBuffer`(Karplus-Strong)/`ambStart/Stop/Toggle/SetVol/SetHifi`；`GUQIN_CLIP` 空串=回退程序合成；面板 `#amb-pop`。

## 时空联动 / 列表 / 诗人长廊
- 时间轴(D)：`poemYear(p)` 解析模糊年；`.tl-mark[data-yr]` + `applyMapYear(tlYear)`；`tlPlay`(setInterval)/`tlSetYear`/`refreshMapTime`/`renderTimeScrubber`；地图 setMap* 走 `rebuildMapTime()`，离开视图 `showView` 调 `tlPause()`。
- 诗作列表(E)：两栏 `.map-layout`；`mapTab`/`mapFame`/`FAME{}`/`curMapPoems`/`renderMapList`/`applyListYear`/`locatePoem`(脉冲)。
- 诗人长廊(C)：视图 `v-poets`，`renderPoetPicker/selectPoet(poetSel)/renderPoetPanel/poetMapSVG/gotoMapPoet`；排序 `poetKeysSorted()`。

## 素材授权 / 致谢（含署名义务）
- 古琴《阳关三叠》：演奏 **CharlieHuang**，**CC BY-SA 3.0**，Wikimedia（File:Guqin-Yangguan_Sandie.ogg）。**需署名**（已在🎵面板标注）；再分发须保留署名+同源协议。
- 省界：阿里 DataV geoatlas。河流：Natural Earth。晕渲地形：Wikimedia "China edcp relief location map"。均投影/简化/裁剪后内联，离线零外链。
