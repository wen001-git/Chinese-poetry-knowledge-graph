# PoemGraph 诗词知识图谱

<p align="center">
  <strong>🖌 中国古诗词知识图谱 · 面向中小学生 · 单文件离线可用</strong>
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#中文">中文</a>
</p>

---

<a id="english"></a>

## English

### What is PoemGraph?

PoemGraph is an interactive **Chinese classical poetry knowledge graph** for primary & junior-high students (grades 1–9). It ships as a **single HTML file** — fully offline, zero dependencies, just open it in a browser.

Two switchable visual themes (a 🖌 button in the nav):

- **朱墨册页 (Cinnabar-Ink, default)** — warm rice paper with vermilion seals/annotations, the look of a classical poetry anthology.
- **水墨 (Ink-Wash)** — cool ink tones on rice-paper white.

Both the page chrome **and** the Canvas knowledge-graph (nodes / edges) recolor with the theme.

### Who uses it & how

Real scenarios, ordered by how many people they reach × how much they show off the app:

1. **📖 A student prepping tomorrow's poem.** Open the poem → pinyin ruby + **tap-to-reveal textbook annotations** explain the hard words right where they appear → tap **Read aloud** to hear it (offline Mandarin by default, Cantonese also embedded) → lock it in with quizzes and earn stars. The everyday core, across all 133 poems, grades 1–9.
2. **🌙 Winding down at bedtime — or passive listening for a toddler.** *Drift to Sleep* plays continuous recitation with a sleep timer; *Ear Training* loops poems by grade. Because the core recitation audio is **embedded and offline**, it plays even on phones with no TTS engine — perfect for pre-readers who just listen.
3. **🖨 A parent coaching at home.** Chinese parents often prefer kids learn on paper, off-screen — so switch to the Parent role and **print a study sheet** (a **colorful version** with a Morandi palette chosen by the poem's mood, or an ink-saving B&W one), or the **A4 "Tang-poet migration activity sheet"** (map + guiding questions) to do together.
4. **🕸 A curious kid exploring connections.** Roam the Canvas **knowledge graph** (poems · poets · dynasties · places · moods), double-tap a node to expand it — or open a poet's **🤝 Circle of Friends** to see who knew whom, every tie carrying a playful, memorable note plus its historical basis.
5. **🗺 Reading poems on the map.** Pan a real relief map of China and watch the **timeline animation** light up each poem's location as history unfolds; tap a historical event to hear it narrated.
6. **👩‍🏫 A teacher prepping a lesson.** Search across 5 dimensions, switch to the Teacher role for **printable handouts**, and project the graph / map in class.

### Features

*(Quick reference for everything the scenarios above draw on.)*

- **133 poems** aligned with China's Unified Textbook (统编版, grades 1–9 — primary + junior high)
- **6 entry points**:
  - 📚 By Grade — poems organized by school year
  - 🃏 Card Wall — visual poem cards with filters
  - 🕸 Knowledge Graph — native-Canvas force-directed 2D / pseudo-3D graph (poems · poets · dynasties · places · moods · imagery · history); double-tap a node to expand its 1-hop neighbors; **🤝 Circle of Friends** — an SVG relationship graph of a poet's real-life connections (same-era = solid line, cross-era influence = dashed arrow), each edge with a playful, memorable note + its historical basis
  - 🗺 Poetry Map — real Chinese terrain with **2D relief mountains**, ancient/modern place names, scenic landmarks, poet footprints, a **time-driven animation** that lights up poem locations as history unfolds, and an **"ask as you go" guiding question** when a poet is selected ("why did Li Bai walk all the way from Suyab to Chang'an?")
  - ⏳ Timeline — all poems + historical events laid out **evenly in chronological order** with dynasty color bands; tap a poem to read it, tap an event to hear it narrated
  - ✍ Poet Gallery — every major poet gets a **"Legendary Life" narrative**: a catchy epithet headline + a chaptered life story with famous lines embedded at key moments + a reflective ending (**28 poets so far**; ancient place names annotated with modern ones). Plus works & travel-route map.
- **3 roles**: Student / Parent / Teacher — **role-tailored printable study sheets** (student self-test / parent off-screen learning sheet with reading prompts / teacher classroom worksheet), each in a **colorful version** (Morandi palette auto-chosen by the poem's mood, key line highlighted, ink-wash mountains-and-birds footer) **or an ink-saving B&W version**. Plus a Parent **A4 "Tang-poet migration activity sheet"** (migration map + "ask as you go" guiding questions to fill in).
- **Detail page**: pinyin ruby, **inline tap-to-reveal annotations** (textbook-style ①②③ vermilion notes at point of need; **all 133 poems annotated**) + a full glossary, plain-language translation (student/teacher), imagery, poet story, mini timeline & mini-map, interactive quizzes
- **Read-aloud that works on every device**:
  - **Default 语舒 Mandarin uses embedded offline MP3** (92 poems), with each track announcing "title, dynasty, poet" before the poem
  - **Cantonese recitation is also embedded offline** (92 poems, 善怡 zh-HK), so the Cantonese button stays usable even when the browser has no Cantonese voice
  - 美嘉 / Li-Mu use browser TTS when available, with a watchdog that offers to switch back to embedded 语舒 if the device stays silent
- **History events** — tap a timeline/map event to open a card with a clear narrated explanation (9 embedded event narrations, with browser TTS fallback)
- **Sleep & ear-training modes** — 🌙 *Drift to Sleep* (calming playlist + 30-minute timer by default) and 🎧 *Ear Training* (current-grade playlist + continuous loop by default), with full-poem line highlighting, short pauses between poems, fade-out timer, and lock-screen MediaSession controls
- **Guqin background music** — Karplus-Strong synthesis (zero bytes) + embedded real guqin (CC BY-SA 3.0)
- **Interactive quizzes** (multiple-choice, emotion-match, line-linking) with star progress
- **5-dimension search** (title / line / poet / dynasty / theme)
- **Responsive** — iPad (768px+) and desktop

### Quick Start

Open `poemgraph.html` in any modern browser. No server needed.

```bash
python3 -m http.server 8123   # then open http://localhost:8123/poemgraph.html
```

Regenerate the embedded offline recitation/history audio (macOS only — needs `swift` + `ffmpeg`):

```bash
python3 scripts/gen_recite_audio.py
```

### Tech Stack

| Aspect | Choice |
|--------|--------|
| Delivery | Single HTML file (~12.2 MB, incl. 3 embedded offline audio sets: Mandarin poems 92 + Cantonese poems 92 + history narration 9) |
| Dependencies | **None** — fully self-contained |
| Graph | Native Canvas force-directed (2D + pseudo-3D), theme-aware colors |
| Map | Alibaba DataV (provinces), Natural Earth (rivers), Wikimedia (relief) |
| Audio | Embedded MP3 for default Mandarin / Cantonese / event narration + Web Speech API for optional live voices; Web Audio + Karplus-Strong (guqin); pre-rendered via macOS AVSpeech |
| Storage | `localStorage` (key `pg_v1`) — no accounts, no server |

### Credits & Licenses

- **Guqin** "Yangguan Sandie": **CharlieHuang**, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), via Wikimedia Commons
- **Provinces**: Alibaba DataV GeoAtlas · **Rivers**: Natural Earth · **Relief**: Wikimedia "China edcp relief location map"
- **Poetry content**: aligned with China's Unified Textbook (统编版)

---

<a id="中文"></a>

## 中文

### 项目简介

PoemGraph 是一款面向中小学生（1–9 年级）的**中国古诗词知识图谱**互动应用，以**单个 HTML 文件**交付——完全离线、零依赖，浏览器打开即用。

两套可切换视觉主题（导航栏 🖌 按钮）：

- **朱墨册页（默认）**——暖宣纸 + 朱砂印章/朱批注释，古典诗集质感；
- **水墨**——冷墨色调、宣纸白底。

页面与**知识图谱 Canvas（节点/连线）**都随主题换色。

### 谁在用 · 怎么用（使用场景）

按「覆盖人数 × 系统亮点」从高到低排列：

1. **📖 学生预习/复习明天要学的诗。** 打开诗 → 拼音 ruby +「**就地点开的注释**」在生字处直接讲清 → 点「**朗读**」听一遍（默认普通话离线播，粤语也内嵌）→ 做练习、得星巩固。这是覆盖最广的日常核心，贯穿全部 133 首、1–9 年级。
2. **🌙 睡前听诗入眠，或给低龄宝宝磨耳朵。** 🌙 听诗入眠＝连续诵读 + 定时关闭；🎧 磨耳朵＝按年级连播。因为音频是**内嵌离线**的，连没有 TTS 引擎的手机也照样发声——还不识字、只靠听的小朋友最合适。
3. **🖨 家长在家陪学。** 中国家长多不愿孩子过早多看屏幕——切到家长角色，**打印学习单**让孩子在纸上学（**彩色版**按诗的情感配莫兰迪色，或省墨黑白版），或打印 **A4「唐代诗人迁徙陪读任务单」**（迁徙地图 + 边走边问引导题）一起做。
4. **🕸 好奇的孩子探索人物与关系。** 在 Canvas **知识图谱**里漫游（诗·诗人·朝代·地点·情感），双击节点展开；或打开诗人的 **🤝 朋友圈**，看谁认识谁，每条关系都配「俏皮话 + 历史依据」，好记又能考查。
5. **🗺 在地图上读诗。** 平移真实中国地形图，看**时空联动动画**随历史推进逐一点亮诗作发生地；点历史大事可听旁白讲解。
6. **👩‍🏫 教师备课/课堂。** 五维搜索找诗，切教师角色导出**可打印讲义**，课堂上投屏图谱 / 地图。

### 功能亮点

*（以下是上面各场景所用到功能的速查清单。）*

- **133 首古诗**，对齐统编版语文课本（1–9 年级，小学 + 初中）
- **六大入口**：
  - 📚 年级浏览
  - 🃏 卡片墙（多维筛选）
  - 🕸 知识图谱——原生 Canvas 力导向 2D / 伪 3D（诗·诗人·朝代·地点·情感·意象·历史）；双击节点展开 1-hop 关联；**🤝 朋友圈**——诗人真实人物关系 SVG 图（同代＝实线、跨代影响＝虚线箭头），每条关系配「俏皮话 + 历史依据」，好记又可考查
  - 🗺 诗词地图——真实中国地形 + **2D 浮雕山脉**、古今地名、名胜、诗人足迹、**时空联动动画**（按年份逐步点亮诗作地）、选中诗人时弹「**💡 边走边问**」引导问题（如"李白为什么从碎叶城一路到长安？"）
  - ⏳ 时间轴——诗与历史大事**按时序等距铺开** + 朝代色带；点诗读诗、点大事听讲
  - ✍ 诗人长廊——大诗人都有一段「**传奇人生**」叙事：抓人**称号头条** + **章节故事**（关键节点镶嵌名句）+ **哲理升华**（**已写 28 位**；古地名一律附今地名）+ 代表作 / 足迹地图
- **三种角色**：学生 / 家长 / 教师——**按角色定制的可打印学习单**（学生自测单 / 家长离屏学习单+陪读提问 / 教师班级作业单），每份都有**彩色版**（莫兰迪调色板**按诗的情感自动配色**、金句高亮、页脚远山飞鸟）**或省墨黑白版**可切换；另含家长版 **A4「唐代诗人迁徙陪读任务单」**（迁徙地图 + 边走边问引导题 + 留白）
- **详情页**：拼音 ruby、**就地点开的注释**（课本式 ①②③ 朱批，点词即现；**全部 133 首均已注释**）+ 完整字词清单、白话双版本、情感意象、诗人故事、局部时间轴、单诗地图、互动练习
- **全设备可用的朗读**：
  - **默认语舒普通话走内嵌离线 MP3**（92 首），每首开头先报「标题。朝代·作者。」再读正文；
  - **粤语朗读也走内嵌离线 MP3**（92 首，善怡 zh-HK），浏览器没有粤语音色也能播；
  - 美嘉 / Li-Mu 走浏览器 TTS；若设备无音色或长时间无声，会提示切回内嵌语舒
- **历史大事**——在时间轴/地图点大事 → 事件卡 + 清晰旁白讲解（9 段内嵌历史故事音频，浏览器 TTS 兜底）
- **入眠与磨耳朵**——🌙 听诗入眠（安神诗单 + 默认 30 分钟定时）、🎧 磨耳朵（当前年级诗单 + 默认不限时循环），支持整首逐行高亮、诗间短留白、渐弱停止与锁屏控制
- **古琴背景音**——Karplus-Strong 程序合成（零字节）+ 内嵌真实古琴（CC BY-SA 3.0）
- **三类互动练习**（选择 / 情感匹配 / 连线）+ 得星进度
- **五维搜索**（诗名 / 诗句 / 诗人 / 朝代 / 主题）
- **响应式**——iPad（768px+）与桌面

### 快速开始

浏览器打开 `poemgraph.html` 即可，无需服务器。

```bash
python3 -m http.server 8123   # 打开 http://localhost:8123/poemgraph.html
```

重新生成内嵌离线朗读/历史音频（仅 macOS，需 `swift` + `ffmpeg`）：

```bash
python3 scripts/gen_recite_audio.py
```

### 技术方案

| 方面 | 选型 |
|------|------|
| 交付 | 单个 HTML 文件（约 12.2 MB，含三组内嵌离线音频：普通话诗 92 + 粤语诗 92 + 历史故事 9） |
| 依赖 | **无**——完全自包含 |
| 图谱 | 原生 Canvas 力导向（2D + 伪 3D），配色随主题 |
| 地图 | 阿里 DataV（省界）、Natural Earth（河流）、Wikimedia（晕渲地形） |
| 音频 | 默认普通话 / 粤语 / 历史故事使用内嵌 MP3，选配音色使用 Web Speech API；Web Audio + Karplus-Strong（古琴）；音频用 macOS AVSpeech 预渲染 |
| 存储 | `localStorage`（键 `pg_v1`）——无账号、无服务端 |

### 素材授权与致谢

- **古琴**《阳关三叠》：演奏 **CharlieHuang**，[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)，来源 Wikimedia Commons
- **省界**：阿里 DataV GeoAtlas · **河流**：Natural Earth · **地形**：Wikimedia "China edcp relief location map"
- **诗词内容**：与统编版语文课本对齐

---

## License

MIT

## 变更日志

| 日期 | 变更内容 |
|------|---------|
| 2026-06-28 | 补本轮新功能：诗人长廊「传奇人生」叙事（28 位，称号+章节故事+名句+升华，古地名附今名）、三角色彩色学习单（莫兰迪按情感配色+金句高亮+省墨黑白切换）、迁徙图改「亲子陪读任务单」+ 地图「边走边问」引导题；勘误：注释覆盖全部 133 首（原误为 36 首） |
| 2026-06-28 | 更新 README 到当前状态：文件体积约 12.2 MB；朗读改为默认语舒离线音频、粤语善怡离线音频、历史故事 9 段内嵌；补充夜读电台、锁屏控制与注释进度 |
| 2026-06-27 | 新增「谁在用·怎么用」使用场景开篇（6 个真实场景，按覆盖人数×亮点排序：学生预习→睡前听诗/磨耳朵→家长打印→图谱朋友圈→地图读诗→教师备课），功能表降为速查 |
| 2026-06-27 | 补充新功能与勘误：🤝 朋友圈（人物关系图，含俏皮话+依据）、家长版 A4 迁徙金线图海报（每诗人一色一线型）；文件体积更正为当时版本约 7.3 MB（含三轨内嵌音频：普通话/粤语诗+历史旁白） |
| 2026-06-25 | 大幅更新以反映现状：133 首/1–9 年级、朱墨⇄水墨双主题（含图谱节点连线换色）、就地注释、全设备朗读（浏览器 TTS + 内嵌离线音频兜底）、入眠/磨耳朵、历史大事旁白、时间轴重设计、音频生成脚本 |
| 2026-06-21 | 初始创建：中英双语 README，涵盖项目介绍、功能、技术方案与致谢 |
