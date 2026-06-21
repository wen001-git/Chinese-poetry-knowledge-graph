# PoemGraph 诗词知识图谱

<p align="center">
  <strong>🏔 中国古诗词知识图谱 · 面向小学生 · 单文件离线可用</strong>
</p>

<p align="center">
  <a href="#english">English</a> · <a href="#中文">中文</a>
</p>

---

<a id="english"></a>

## English

### What is PoemGraph?

PoemGraph is an interactive **Chinese classical poetry knowledge graph** designed for elementary school students (grades 1–6). It is delivered as a **single HTML file** — fully offline, zero dependencies, just open it in a browser and start exploring.

The visual style follows the traditional **ink wash painting (水墨画)** aesthetic: rice-paper white backgrounds, ink-black text, and subtle ink-cyan accents — no flashy colors, no red.

### Features

- **34 poems** aligned with China's Unified Textbook (统编版, grades 1–6)
- **6 entry points** to explore poetry:
  - 📚 By Grade — browse poems organized by school year
  - 🃏 Card Wall — visual poem cards for quick browsing
  - 🕸 Knowledge Graph — interactive 2D/3D force-directed graph connecting poems, poets, themes, and history
  - 🗺 Poetry Map — real Chinese terrain with poet footprints, landmarks, and animated timeline
  - ⏳ Timeline — chronological exploration with dynasty color bands
  - ✍ Poet Gallery — poet profiles with biography, works, and travel routes
- **3 user roles**: Student, Parent, Teacher (with printable study sheets)
- **Detailed poem pages** with pinyin, annotations, plain-language explanations, emotional imagery, poet stories, historical context, mini-map, and interactive quizzes
- **Read-aloud** with Web Speech API — each poet has a unique voice persona (Li Bai: bright & bold, Du Fu: deep & solemn, Wang Wei: serene & elegant...)
- **Guqin background music** — both synthesized (Karplus-Strong, zero bytes) and real embedded guqin audio (CC BY-SA 3.0)
- **Time-driven map animation** — watch poems "light up" on the map as history unfolds, with play/pause, speed control, and dynasty filters
- **Interactive quizzes** — multiple choice, emotion matching, and line-linking exercises with star-based progress tracking
- **5-dimension search** — search across poem titles, lines, poets, dynasties, and themes
- **Fully responsive** — optimized for iPad (768px+) and desktop (1024px+)

### Quick Start

Simply open `poemgraph.html` in any modern browser. No server needed.

For local development:

```bash
python3 -m http.server 8123
# Open http://localhost:8123/poemgraph.html
```

### Tech Stack

| Aspect | Choice |
|--------|--------|
| Delivery | Single HTML file (~632 KB) |
| Dependencies | **None** — fully self-contained |
| Graph rendering | Native Canvas (force-directed 2D + pseudo-3D) |
| Map data | Alibaba DataV (province boundaries), Natural Earth (rivers), Wikimedia (relief) |
| Audio | Web Speech API (read-aloud), Web Audio API + Karplus-Strong (guqin synthesis), embedded mp3 (real guqin) |
| Storage | `localStorage` (key: `pg_v1`) — no accounts, no server |

### Credits & Licenses

- **Guqin audio** "Erta Yang Guan San Die": performed by **CharlieHuang**, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), via Wikimedia Commons
- **Province boundaries**: Alibaba DataV GeoAtlas
- **Rivers**: Natural Earth
- **Relief map**: Wikimedia "China edcp relief location map"
- **Poetry content**: aligned with China's Unified Textbook (统编版) for elementary schools

---

<a id="中文"></a>

## 中文

### 项目简介

PoemGraph 是一款面向小学生（1–6年级）的**中国古诗词知识图谱**互动应用。它以**单个 HTML 文件**交付——完全离线可用、零外部依赖，用浏览器打开即可使用。

视觉风格采用传统**水墨画**美学：宣纸白底色、浓墨黑字、墨青强调色——不使用花哨色彩，禁用红色主色。

### 功能亮点

- **34 首古诗**，与统编版小学语文课本（1–6年级）对齐
- **六大入口**探索诗词：
  - 📚 年级浏览——按学年分类
  - 🃏 卡片墙——可视化诗词卡片
  - 🕸 知识图谱——交互式 2D/3D 力导向图，连接诗词、诗人、主题与历史
  - 🗺 诗词地图——真实中国地形底图，含诗人足迹、名胜古迹、时间轴动画
  - ⏳ 时间轴——按时间线探索，朝代渐变色带
  - ✍ 诗人长廊——诗人档案：生平、诗作、足迹路线
- **三种角色**：学生、家长、教师（教师可打印学习单）
- **详情页八大区块**：拼音注音（ruby）、注释、白话文双版本、情感意象、诗人故事、局部时间轴、单诗地图、互动练习
- **朗读功能**——Web Speech API 零字节离线朗读，每位诗人有独特音色人设（李白豪放明亮、杜甫沉郁低沉、王维清雅、贺知章苍老……）
- **古琴背景音**——程序合成（Karplus-Strong 五声音阶，零字节）+ 内嵌真实古琴音频（CC BY-SA 3.0 授权）
- **时空联动动画**——年份推进时诗作地点在地图上逐步"点亮"，支持播放/暂停、调速、朝代筛选
- **三类互动练习**——选择题、情感匹配、连线题，得星进度追踪
- **五维搜索**——按诗名、诗句、诗人、朝代、主题检索
- **响应式设计**——适配 iPad（768px+）与桌面端（1024px+）

### 快速开始

直接用浏览器打开 `poemgraph.html` 即可，无需服务器。

本地开发预览：

```bash
python3 -m http.server 8123
# 浏览器打开 http://localhost:8123/poemgraph.html
```

### 技术方案

| 方面 | 选型 |
|------|------|
| 交付形式 | 单个 HTML 文件（约 632 KB） |
| 外部依赖 | **无**——完全自包含 |
| 图谱渲染 | 原生 Canvas 力导向图（2D + 伪 3D） |
| 地图数据 | 阿里 DataV（省界）、Natural Earth（河流）、Wikimedia（晕渲地形） |
| 音频 | Web Speech API（朗读）、Web Audio API + Karplus-Strong（古琴合成）、内嵌 mp3（真实古琴） |
| 数据存储 | `localStorage`（键：`pg_v1`）——无账号系统，无服务端 |

### 素材授权与致谢

- **古琴背景音**《阳关三叠》：演奏 **CharlieHuang**，[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)，来源 Wikimedia Commons
- **省界数据**：阿里 DataV GeoAtlas
- **河流数据**：Natural Earth
- **地形底图**：Wikimedia "China edcp relief location map"
- **诗词内容**：与统编版小学语文课本对齐

---

## License

MIT

## 变更日志

| 日期 | 变更内容 |
|------|---------|
| 2026-06-21 | 初始创建：中英双语 README，涵盖项目介绍、功能、技术方案与致谢 |
