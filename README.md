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

### Features

- **133 poems** aligned with China's Unified Textbook (统编版, grades 1–9 — primary + junior high)
- **6 entry points**:
  - 📚 By Grade — poems organized by school year
  - 🃏 Card Wall — visual poem cards with filters
  - 🕸 Knowledge Graph — native-Canvas force-directed 2D / pseudo-3D graph (poems · poets · dynasties · places · moods · imagery · history); double-tap a node to expand its 1-hop neighbors
  - 🗺 Poetry Map — real Chinese terrain with **2D relief mountains**, ancient/modern place names, scenic landmarks, poet footprints, and a **time-driven animation** that lights up poem locations as history unfolds
  - ⏳ Timeline — all poems + historical events laid out **evenly in chronological order** with dynasty color bands; tap a poem to read it, tap an event to hear it narrated
  - ✍ Poet Gallery — poet profiles: biography, works, travel routes
- **3 roles**: Student / Parent / Teacher (printable study sheets)
- **Detail page**: pinyin ruby, **inline tap-to-reveal annotations** (textbook-style ①②③ vermilion notes at point of need) + a full glossary, plain-language translation (student/teacher), imagery, poet story, mini timeline & mini-map, interactive quizzes
- **Read-aloud that works on every device**:
  - Uses the browser's TTS (Mandarin / Cantonese; voice choice incl. 语舒 / 美嘉 / Li-Mu) with per-line highlighting
  - **Falls back to embedded offline MP3 audio** for devices without a TTS engine (e.g. many Chinese Android / Xiaomi browsers) — so recitation always plays
- **History events** — tap a timeline/map event to open a card with a clear narrated explanation
- **Sleep & ear-training modes** — 🌙 *Drift to Sleep* (continuous recitation + sleep timer) and 🎧 *Ear Training* (play by grade)
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
| Delivery | Single HTML file (~3.2 MB, incl. embedded offline audio) |
| Dependencies | **None** — fully self-contained |
| Graph | Native Canvas force-directed (2D + pseudo-3D), theme-aware colors |
| Map | Alibaba DataV (provinces), Natural Earth (rivers), Wikimedia (relief) |
| Audio | Web Speech API (live TTS) + embedded MP3 fallback (offline); Web Audio + Karplus-Strong (guqin); pre-rendered via macOS AVSpeech |
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

### 功能亮点

- **133 首古诗**，对齐统编版语文课本（1–9 年级，小学 + 初中）
- **六大入口**：
  - 📚 年级浏览
  - 🃏 卡片墙（多维筛选）
  - 🕸 知识图谱——原生 Canvas 力导向 2D / 伪 3D（诗·诗人·朝代·地点·情感·意象·历史）；双击节点展开 1-hop 关联
  - 🗺 诗词地图——真实中国地形 + **2D 浮雕山脉**、古今地名、名胜、诗人足迹、**时空联动动画**（按年份逐步点亮诗作地）
  - ⏳ 时间轴——诗与历史大事**按时序等距铺开** + 朝代色带；点诗读诗、点大事听讲
  - ✍ 诗人长廊——生平 / 诗作 / 足迹
- **三种角色**：学生 / 家长 / 教师（可打印学习单）
- **详情页**：拼音 ruby、**就地点开的注释**（课本式 ①②③ 朱批，点词即现）+ 完整字词清单、白话双版本、情感意象、诗人故事、局部时间轴、单诗地图、互动练习
- **全设备可用的朗读**：
  - 优先用浏览器 TTS（普通话 / 粤语；音色可选 语舒 / 美嘉 / Li-Mu）+ 逐句高亮；
  - **无 TTS 引擎的设备**（如不少国产安卓 / 小米浏览器）**自动回退到内嵌离线 MP3**，保证一定能朗读
- **历史大事**——在时间轴/地图点大事 → 事件卡 + 清晰旁白讲解
- **入眠与磨耳朵**——🌙 听诗入眠（连续诵读 + 定时关闭）、🎧 磨耳朵（按年级连播）
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
| 交付 | 单个 HTML 文件（约 3.2 MB，含内嵌离线音频） |
| 依赖 | **无**——完全自包含 |
| 图谱 | 原生 Canvas 力导向（2D + 伪 3D），配色随主题 |
| 地图 | 阿里 DataV（省界）、Natural Earth（河流）、Wikimedia（晕渲地形） |
| 音频 | Web Speech API（实时 TTS）+ 内嵌 MP3 离线兜底；Web Audio + Karplus-Strong（古琴）；音频用 macOS AVSpeech 预渲染 |
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
| 2026-06-25 | 大幅更新以反映现状：133 首/1–9 年级、朱墨⇄水墨双主题（含图谱节点连线换色）、就地注释、全设备朗读（浏览器 TTS + 内嵌离线音频兜底）、入眠/磨耳朵、历史大事旁白、时间轴重设计、音频生成脚本 |
| 2026-06-21 | 初始创建：中英双语 README，涵盖项目介绍、功能、技术方案与致谢 |
