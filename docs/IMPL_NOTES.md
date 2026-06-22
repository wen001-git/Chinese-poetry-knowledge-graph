# IMPL_NOTES — 关键实现备忘（改对应模块前**按需**读，平时接手不必读）

> 从 AGENTS.md 拆出来省 token。AGENTS 只留「当前状态/TODO」；改某子系统前来读这里对应段。

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
