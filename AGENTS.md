# AGENTS.md — 接手须知（任何 AI 工具先读本文件 · SSOT）

> **接手只读本文件**的「当前状态 + 下一步 TODO」即可继续。
> - **要改代码？先看 `docs/IMPL_NOTES.md` 顶部「锚点地图」**(函数/数据→行号)，据此 `Read offset/limit` 跳读那 20~40 行——**严禁宽读/宽 grep 那个 818KB 单文件**(整读≈42万 token，是接手耗 token 的唯一大头；grep 务必 `… | cut -c1-100`)。
> - 实现细节按需读 `docs/IMPL_NOTES.md` 对应段；完整变更历史看 `git log --oneline`；产品/设计 `docs/PROJECT_PLAN.md`/`docs/DESIGN.md`（仅里程碑/确需时读）。
> - **省 token（详见 `CLAUDE.md`「接手省 token 协议」）**：不预读 PROJECT_PLAN/DESIGN、不全量扫码、不 dump 大 diff（用 `--stat`/窄 grep）、只读需要的行段。
> - 完成改动：**日常只更新本文件**「当前状态/TODO」；里程碑才更 PROJECT_PLAN/DESIGN。状态写仓库文件（跨账号可读），不依赖工具私有记忆。

## 一句话
中国诗词知识图谱，面向小学生的**单文件离线 HTML** `poemgraph.html`。水墨基调（**禁红规则已取消**，配色可用朱砂红等暖色；视觉用 `/frontend-design` 迭代中）。

## 运行 & 测试
- 预览：`python3 -m http.server 8123` → `http://localhost:8123/poemgraph.html`
- **里程碑测试（强制）**：断网可用、五入口+详情正常、控制台 0 报错、iPad/桌面响应式。

## 硬约束（不可违反）
- 单文件 / 完全离线 / 无 CDN（当前 ~12.2MB，含内嵌音频三轨：普通话诗92+粤语诗92+历史故事9，每首诗开头先报「标题。朝代·作者。」）。**体积目标 ≤ ~15MB**，但真红线＝**目标 iPad 上秒开 + 滚动点击不卡**（体积≠流畅度：卡顿来自运行时动画/DOM，非字节数；十几 MB 主要是音频/文字时现代 iPad 浏览顺滑，仅开页多 ~1s）。**文字/SVG/数据几乎免费、随便用**；**内嵌音频/栅格图才是体积大头，需压缩克制**。若将来要"每首真人朗诵"(几十 MB)再改为"文件夹：HTML+音频"，仍离线。
- 宣纸白 `#f7f5f0` / 浓墨 `#1c1c1e` / 墨青 `#2d5a6b` + **朱砂红 `#c1352b` 可作强调/印章/朱批**（禁红规则已取消，配色可演进；视觉用 `/frontend-design` 迭代中）
- 内容对齐**统编版**课本；进度/偏好存 `localStorage`（键 `pg_v1`），无账号系统

## 当前状态（2026-06-28）
- **人物关系·朋友圈**（图谱新功能）：图谱工具栏「🤝 朋友圈」入口 `openCircle('libai')`。SVG 自环图(`#circle-modal`)：中心人物+一圈关系人，**同代＝实线**(墨青`#2d5a6b`)、**跨代影响＝虚线+箭头**(赭`#a0603a`，前人→后人，`inf:1` 时 `a`=源头)、**非诗人＝赭色节点+「非诗人」标注**。**每条边 hover/点 → tip 显「戴建业式俏皮话(`fun`)大字 + 依据(`desc`)小字」**(`showCircleTip(i)`，给小学生好记又可考查；`.ct-fun`/`.ct-basis` 样式；标签带 ⓘ 提示可点)，点头像换看 TA 的朋友圈，点中心看本人简介。数据：`FIGURES{}`(5 非诗人:汪伦/唐玄宗/严武/房琯/赵明诚)+`RELATIONS[]`(33 条经核对的真实关系，每条 `{a,b,type,desc,inf?}`)；另补 8 位无诗诗人(高适/元稹/孟郊/苏辙/黄庭坚/欧阳修/谢朓/柳宗元)入 `POETS` 仅供朋友圈引用。**新诗人/FIGURES 无 `POEMS` 条目 → 不出现在图谱/卡片墙/地图**(那些由 POEMS 构建)。函数：`openCircle/closeCircle/renderCircle/showCircleTip/personOf/personRelations/_ce`(紧接 `setGLayout` 后)。〔已测：33 关系端点全解析、边tip依据、人物跳转、箭头方向、控制台0错误。〕
- **朗读·三音色分工**：音色＝语舒/美嘉/Li-Mu(`recVoiceChoice` 存 `pg_recvoice`，**默认语舒**)。**语舒＝离线内嵌音频** `RECITE_AUDIO`(92首语舒 mp3 base64，**单字符串/首** `RECITE_AUDIO[id]`，**每首开头先报「标题。朝代·作者。」再读正文**，整首播，全设备可用——解决小米等国产安卓无 TTS 引擎不发声)；**美嘉/Li-Mu＝浏览器系统 TTS**(零字节，逐句高亮，浏览器不支持会 confirm 提示)。`reciteStart`：语舒有内嵌即播 `recitePlayAudio`，否则及美嘉/Li-Mu走 TTS；浏览器无音色/看门狗1.6s无声→confirm 切语舒内嵌。**粤语朗读**(`recLang=cantonese`)：内嵌 `RECITE_AUDIO_YUE`(92首善怡 zh-HK，同样先报题)，手机也能播，故粤语按钮始终可用(`recApplyLangAvail` 不再因无浏览器粤语音色置灰)；`recitePlayAudio(p,track)` track='yue'选粤语轨。**历史故事朗读**(`openEvent`→`eventNarrate`)：优先内嵌 `EVENT_AUDIO`(9事件语舒，`eventPlayAudio`+`evtAudioEl`)，否则浏览器男声 TTS。生成 `scripts/gen_recite_audio.py`(**三轨**：语舒普通话诗+善怡粤语诗+语舒历史故事，AVSpeech `/tmp/synth_batch.swift`→ffmpeg 22k 单声道→base64，复用 `/tmp/rec3` 已有片段免重合成——**改报题/正文文本须先删对应 `.caf`/`.mp3` 缓存再跑**，否则按文件名命中旧缓存不重录；扩覆盖改 `MID_PICK` 再跑)。文件 ~12.2MB(在 ~15MB 软目标内——音频按需解码不伤流畅度,真红线是秒开+不卡;**勿降音质**)。
- **诗词听读·夜读电台**(共用一套播放引擎 `#sleep-player`，两个导航入口)：🌙**听诗入眠** `openSleep('sleep')`(默认安神诗单+30分定时，睡前场景)；🎧**磨耳朵** `openSleep('eartrain')`(默认按当前年级+不限时循环，给宝宝磨耳朵)。播放器内**诗单选择器** `#sleep-picker`(安神入眠`SLEEP_CALM`/全部/各年级，`sleepBuildList`/`sleepGradesAvail`/`sleepSetPlaylist`)。连播内嵌音频(`sleepTrack` 按 `recLang` 选普/粤轨)、**整首逐行高亮**(`sleepUpdateUI` 渲染全诗为 `.sl-ln`,`ontimeupdate` 按字数估时逐句点亮;**报题段 `sleepPreW` 不点亮诗句**)、**诗间留白 0.8s**(原2.5s,改为与句间节奏一致)、古琴垫底、**睡眠定时**(墙钟 `sleepStopAt`+~6s 渐弱 `sleepFadeStop` 抗后台限流)、**锁屏 MediaSession**、`onended` 链式连播(息屏续播)。〔测试勿真播：会在用户机器出声，验逻辑即可。〕
- **字词注释（进行中）**：详情页原文「就地注释」——有注释的词带朱批虚线下划线+①②③上标圈码，悬停(桌面)/点击(触屏)弹释义气泡，底部清单同号。数据复用 `anno:[{w,m,k?}]`(k=匹配键，用于非连续/消歧)。已注释 36 首(木兰诗+蒹葭+送杜少府+13+5+7+10)；渲染器对任何有 `anno` 的诗自动生效。剩余初中约 27 首待补(A 我录/B 用户贴课本)。
- **133 首**（小学70+初中63，含《木兰诗》《关雎》等，年级1-9全覆盖）；批量扩充流水线（pypinyin+多音字FIX，新诗只需正文+元数据+短译文，`autoQuiz` 自动测验）
- 六入口（年级/卡片墙/知识图谱/地图/时间轴/诗人长廊）+闯关；三角色（学生/家长/教师）+探索/学习模式；详情页8区块；三类练习+得星；5维搜索；教师打印
- **知识图谱**：力导向+伪3D；单击信息卡 / **双击展开1-hop（累积式·再双击折叠·封顶12+重置）**；聚焦总览(朝代+诗人)；诗人节点圆形+全名、按产出名气定大小+多产金边；三布局(force/radial/tree)
- **诗词地图**：缩放平移、2D浮雕山脉、标注4选1(古/今/名胜/无)、名胜图标、诗人足迹、按诗人展开、墨珠地标+悬停浮标、历史大事点「讲」→事件卡+男声朗读
- **时空联动(D)**：底部年份游标播放→逐年点亮地图+诗作列表(E 两栏/筛选/定位)
- **氛围(F)**：详情逐句朗读+普通话/粤语切换(语舒/善怡)；古琴背景(程序合成/内嵌《阳关三叠》CC BY-SA 署名)；诗人剪影头像(性别×朝代冠服)
- **诗人长廊(C)**：选择器+面板(称号头条/传奇人生章节故事/代表作/足迹)。**「传奇人生」叙事**(`POET_STORY{epithet称号,tagline矛盾,chapters[{h,body,quote,from}],coda升华}`，`renderPoetPanel` 有则显故事+章节竖轴+朱批名句+升华卡、无则回退 `po.intro`)：已写 7 位大家(libai/dufu/sushi/baijuyi/wangwei/xinqiji/wanganshi)，其余待增量扩(史实+名句出处须准确)。**故事内古地名一律附今地名**(如「碎叶城（今吉尔吉斯斯坦境内）」)。样式 `.poet-epithet/.poet-tagline/.story-ch/.story-quote/.story-coda`。
- **家长画报·迁徙金线图**(A4竖版可打印)：5诗人迁徙路线，每人**一色一线型**(`TRACK_STYLE`：色+虚实双重区分，灰度打印也能分清)，`trackStyle(k)` 取样式。**已从装饰海报改造为「亲子陪读任务单」**：尾部加「✏️边走边问」引导问题+留白(`buildMigrationPoster`)，引导问题数据 `POET_JOURNEY_Q{poet:{q,why}}`(5诗人,真实史实,屏幕地图+打印共用单一来源)。
- **打印学习单·三角色版**(`buildPrintSheet(p,role)`，**打印按钮在详情页常驻操作栏 `#d-print`**[朗读那行]，所有标签页可见、标签随角色由 `fillDetail` 设；原藏在测验页已移出)：**学生**=自测单(原文+注释+自测题+留白)；**家长**=完整离屏学习单(让孩子在纸上学,减少看屏；+白话译文+练习+「家长陪读提问」复用 `POET_JOURNEY_Q`)；**教师**=班级作业单(姓名/班级栏)。`printSheet()` 传 `ST.role`。
- **交互地图·边走边问**：地图选中诗人(`mapPoet`)时 `renderMapList` 头部显 `POET_JOURNEY_Q[mapPoet].q` 提示框(`.ml-ask`,朱批左边)，所有角色可见(课堂/亲子/自学通用)

## 下一步 TODO（从这里继续）
- [x] UI/UX评审5项适龄修复 + 朗读跨平台稳健（`_ttsKeep`/cancel延时/recVoice重取）已提交 ✅
- [x] 历史大事讲故事"拖音"已修（清晰优先：`pickNarratorVoice` 只认清晰男声 Kangkang/云希，**排除 Apple 角色音 Reed/Eddy**，Apple 无则退清晰语舒）✅
- [ ] 诗词朗读音色：Apple 设备男声皆带拖音→目前用清晰女声(语舒)；如需男声需内嵌预渲染音频(评估过~1MB/9事件，体积可接受但未做)
- [ ] 双击展开为"封顶12克制版"，用户原想"纯自由展开(无上限)"——可改
- [ ] `related` 相关推荐字段多为空（autoQuiz/详情已健壮，可后补）

## 文件地图
- `poemgraph.html` — 全部代码与数据（改动主要在这）
- `docs/IMPL_NOTES.md` — **关键实现备忘**（改地图/图谱/朗读等前按需读）+ 素材授权署名义务
- `docs/PROJECT_PLAN.md` / `docs/DESIGN.md` — 里程碑进度/设计（按需）
- `CLAUDE.md` — 项目规则（视觉约束、文档维护、接手省 token 协议）
- 完整变更历史 → `git log`
