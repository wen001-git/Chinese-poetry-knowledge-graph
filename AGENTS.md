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
- **诗人长廊(C)**：选择器+面板(称号头条/传奇人生章节故事/代表作/足迹)。**「传奇人生」叙事**(`POET_STORY{epithet称号,tagline矛盾,chapters[{h,body,quote,from}],coda升华}`，`renderPoetPanel` 有则显故事+章节竖轴+朱批名句+升华卡、无则回退 `po.intro`)：已写 **28 位**大家(7首批+唐一线/宋名家/唐名家/魏晋明清四组共21位)，其余次要诗人/无名合集(诗经/汉乐府等)保留简介待定。**故事内古地名一律附今地名**(如「碎叶城（今吉尔吉斯斯坦境内）」)，**所嵌名句须用库内真实诗作且出处准确**。样式 `.poet-epithet/.poet-tagline/.story-ch/.story-quote/.story-coda`。
- **家长画报·迁徙金线图**(A4竖版可打印)：5诗人迁徙路线，每人**一色一线型**(`TRACK_STYLE`：色+虚实双重区分，灰度打印也能分清)，`trackStyle(k)` 取样式。**已从装饰海报改造为「亲子陪读任务单」**：尾部加「✏️边走边问」引导问题+留白(`buildMigrationPoster`)，引导问题数据 `POET_JOURNEY_Q{poet:{q,why}}`(5诗人,真实史实,屏幕地图+打印共用单一来源)。
- **打印学习单·三角色版**(`buildPrintSheet(p,role)`，**打印按钮在详情页常驻操作栏 `#d-print`**[朗读那行]，所有标签页可见、标签随角色由 `fillDetail` 设；原藏在测验页已移出)：**学生**=自测单(原文+注释+自测题+留白)；**家长**=完整离屏学习单(让孩子在纸上学,减少看屏；+白话译文+练习+「家长陪读提问」复用 `POET_JOURNEY_Q`)；**教师**=班级作业单(姓名/班级栏)。`printSheet()` 传 `ST.role`。**彩色/省墨双版**(`printColor` 存 `pg_printcolor`，操作栏 `#print-mode` 切换)：彩色=`colorSheet`(莫兰迪调色板 `PRINT_PAL` **按 `p.emo` 选色** `printPalette`、楷体居中诗、**金句淡金高亮**`printGoldLines`(取自 `POET_STORY` 引用句)、标签式注释、页脚远山飞鸟 SVG、`print-color-adjust:exact`)；省墨=`plainSheet`(黑白朴素,整班打印)。
- **交互地图·边走边问**：地图选中诗人(`mapPoet`)时 `renderMapList` 头部显 `POET_JOURNEY_Q[mapPoet].q` 提示框(`.ml-ask`,朱批左边)，所有角色可见(课堂/亲子/自学通用)
- **视频录屏展示页**：根目录 `video-showcase.html` 已创建（7页场景化录屏页：开场/三类用户/学生/图谱探索/家长/教师/镜头清单；中文主讲+少量英文副标题；N 显示/隐藏旁白，←→翻页，按钮切到真实 `poemgraph.html`）。
- **闯关引导修复（⚠️待用户点击验证，浏览器自动化本轮不可用）**：用户反馈闯关模式点开诗后不知道要做练习题才能解锁下一关。修复：`openDetail` 检测 `ST.view==='path'` 时设 `ST.questMode`，在「练习」tab 加脉冲红点(`.quest-target`+`questPulse`动画)+ 详情页顶部显示 `.ml-ask` 风格提示条(`#quest-banner`,"🚩 闯关中·完成「练习」解锁下一关")；`submitQuiz()` 通关后追加「返回闯关」按钮(`showView('path')`)；顺手修复 `backFromDetail()` 原本闯关模式下会退回卡片墙而非闯关页的 bug。**仅做了 JS 语法校验+逐函数调用链人工追踪，未做真实浏览器点击验证**——已提交但标记待确认。
- **闯关按年级修复（✅已由用户点击验证：7年级正确从"峨眉山月歌"起步）**：`renderPath` 原用 `visiblePoems()`(累计`grade<=ST.grade`，卡片墙/图谱等其他视图故意用累计，不能改)。修复：**只改 `renderPath` 内部**，改用 `POEMS.filter(p=>!ST.grade||p.grade===ST.grade)`(精确匹配所选年级)，不影响其他视图。各年级诗词量9~23首，够单独闯关。
- **顶栏年级下拉改为原地切换（⚠️待验证）**：用户反馈点顶栏年级chip会跳去年级选择大蒙层，选完又固定跳到"年级"视图，如果原本在闯关/图谱等页面会被强制带走。修复：`#grade-chip` 由 `<button onclick="openGradePick()">` 改为原生 `<select onchange="quickPickGrade(this.value)">`(9个选项)，新函数 `quickPickGrade(g)` 只更新 `ST.grade`+`updateChips()`+`showView(ST.view)`(重渲染当前视图，不跳走)。**保留** `pickGrade()`/`openGradePick()`/大蒙层不变，仍用于首次未选年级时的引导流程。`updateChips()` 里原来 `grade-chip.textContent=...` 相应改成 `.value=...`(select 用 value 不用 textContent)。
- **诗人长廊·查询体验**：①详情页「诗人」tab 新增「📜 查看XX完整传奇人生 →」跳转按钮（仅 `POET_STORY` 有数据的诗人显示），点击 `poetSel=key;showView('poets')` 跳到诗人长廊对应诗人，避免与传奇人生长文重复维护。②诗人长廊头部新增搜索框(`poetFilterQ`,按姓名子串)+朝代快捷筛选chip(`poetFilterDyn`,复用`.sf`样式,`selectPoetDyn`)，无匹配显示空状态提示；函数 `renderPoetPicker/renderPoetDynFilters`。已用 puppeteer-core+本机 Chrome headless 测试：搜索/朝代过滤/空态/跳转链接均正确，控制台0错误。✅

## 部署/托管选型（2026-07-03：已双平台部署，EdgeOne 被实测证实无 ICP 会硬拦大陆）
- **腾讯云 EdgeOne Pages** 已部署：`https://peomgraph-dpw1a040zswi.edgeone.dev`，加速区域 **Global (MLC excluded)**。**实测结论（重要，纠正此前"可能只是不加速"的猜测）**：该模式对大陆 IP 是**硬拦截**，返回 401 `UNAUTHORIZED`（"Access Restricted...For 'Global (MLC excluded)' projects, check your network environment"），挂 VPN 才能访问，直连大陆网络完全打不开——**不是"慢"，是"打不开"**。EdgeOne 作为腾讯云(大陆公司)产品，对未备案项目似乎主动阻断大陆流量以满足合规。**此结论大概率对腾讯云其他"免备案海外加速"产品同样适用，需要时应先实测而非假设"能连上只是慢"**。
- **Cloudflare Pages 已部署成功**：`https://pg-cyq.pages.dev`（经典 Pages 导入流程，而非 Workers 流程——Cloudflare 新版 Dashboard 默认引导走 Workers+wrangler.jsonc 那条路，会卡在"需要注册 workers.dev 子域名"报错；正确入口是 Workers&Pages 创建页最下方的"Looking to deploy Pages? Get started"链接，走 Pages 专属 import 流程）。Cloudflare 非大陆公司，理论上不会像 EdgeOne 那样主动拦截，但未做大陆网络下的实测确认。
- 仓库根目录 `index.html` 自动跳转到 `poemgraph.html`，两个部署地址访问裸域名都直达应用。
- **ICP备案 是中国大陆监管要求，非腾讯云独有**——阿里云同理：大陆节点未备案会被阿里云自己的监测系统阻断（官方文档明确写着），香港/海外节点不需要备案但也就只是海外节点。换阿里云/腾讯云都绕不开这道坎，备案流程和成本基本一致。阿里云有 **ESA(边缘安全加速)** 产品，其 "Pages" 功能同样支持"导入GitHub仓库自动部署"，体验类似 Cloudflare/EdgeOne Pages。
- **ICP备案完整成本**（供以后参考，本轮未启动）：域名(¥30-60/年，任意注册商) + **备案要求绑定一台大陆区服务器**(购买时长≥3个月，如轻量应用服务器¥30-40+/月) + 个人实名认证(身份证+人脸核身) + 审核周期(腾讯云初审1-2工作日+短信核验+管局审核≤20工作日，现实预期2-4周) + 备案后需在页脚展示备案号(法定要求) + EdgeOne等CDN大陆节点流量需升级付费套餐(大陆流量1:1计费比例，比海外节点划算)。**决定**：现阶段不启动备案，先用 Render/Cloudflare Pages（用户实测/推测均无需VPN）；等真要做付费账号系统(CloudBase)时再一次性备案，静态页+未来账号系统共用同一次投入。
- **未来账号+数据库**（用户路线图：计划做付费账号+权限控制）：对比结论——Render 加数据库约 **¥40+/月**（用户另一项目实测数据）；**腾讯云开发 CloudBase（云开发TCB）** 数据库+认证+云函数+托管打包一体，免费额度 3000点/月，超额后 **¥19.9/月起**（比 Render 数据库单项省一半+，且含内置用户认证，不用自己写登录鉴权）——**如未来要做账号系统，优先评估 CloudBase**。CloudBase 自定义域名需 ICP 备案，默认域名(`*.tcloudbaseapp.com`)不需要。
- **未来若需要后端/Python 服务**（不只是数据库）：按场景分档——标准无状态 REST API → CloudBase 云函数(已支持Python运行时，GA非beta，并入同一¥19.9/月套餐)；想零学习成本 → Render Web Service(~$7+/月，美元计费，成熟);Cloudflare Workers+D1(~$5/月起,~¥35-40,**但 Python Workers 仍是 open beta 非GA**,不如前两者成熟；且Cloudflare无内置认证需自己写)；需要长连接/常驻进程/重计算(serverless扛不住的场景) → 腾讯云轻量应用服务器 Lighthouse 香港节点(2核2G ¥24/月，免ICP，但需自己运维)。
- **风险提示**：GitHub Pages / Vercel / Netlify 因 DNS 污染/跨境路由问题，中国大陆访问历史上不稳定，**不建议**作为面向大陆用户的主入口。
- 详见完整分析：`/Users/Zhuanz/.claude/plans/i-want-to-make-declarative-seal.md`（本机 Claude 计划文件，非仓库内文档）。

## 下一步 TODO（从这里继续）
- [x] UI/UX评审5项适龄修复 + 朗读跨平台稳健（`_ttsKeep`/cancel延时/recVoice重取）已提交 ✅
- [x] 历史大事讲故事"拖音"已修（清晰优先：`pickNarratorVoice` 只认清晰男声 Kangkang/云希，**排除 Apple 角色音 Reed/Eddy**，Apple 无则退清晰语舒）✅
- [x] 演示视频素材：`demo/showcase.html`（5张双语章节卡）+ `demo/VIDEO_SCRIPT.md`（90秒双语讲稿）+ `video-showcase.html`（正式录屏场景页，含旁白提示/镜头清单/真实应用跳转）已创建 ✅
- [x] **部署上线**：EdgeOne Pages(`https://peomgraph-dpw1a040zswi.edgeone.dev`，**大陆直连401被拦**，需VPN) + Cloudflare Pages(`https://pg-cyq.pages.dev`，未做大陆实测) 均已部署成功 ✅
- [ ] 待用户确认 Cloudflare Pages 在大陆直连(不用VPN)下的实际可用性——若也不行，则回退用 Render(用户另一项目实测过大陆无需VPN可访问)
- [ ] ICP备案暂缓：待真要做付费账号系统(CloudBase)时一次性办理，见上方"部署/托管选型"完整成本分析
- [ ] 诗词朗读音色：Apple 设备男声皆带拖音→目前用清晰女声(语舒)；如需男声需内嵌预渲染音频(评估过~1MB/9事件，体积可接受但未做)
- [ ] 双击展开为"封顶12克制版"，用户原想"纯自由展开(无上限)"——可改
- [ ] `related` 相关推荐字段多为空（autoQuiz/详情已健壮，可后补）

## 文件地图
- `poemgraph.html` — 全部代码与数据（改动主要在这）
- `docs/IMPL_NOTES.md` — **关键实现备忘**（改地图/图谱/朗读等前按需读）+ 素材授权署名义务
- `docs/PROJECT_PLAN.md` / `docs/DESIGN.md` — 里程碑进度/设计（按需）
- `CLAUDE.md` — 项目规则（视觉约束、文档维护、接手省 token 协议）
- `video-showcase.html` — 正式录屏展示页（场景化脚本+模拟截图框+真实应用跳转，不改 poemgraph.html 本体）
- `demo/showcase.html` + `demo/VIDEO_SCRIPT.md` — 演示视频章节卡+讲稿（不改 poemgraph.html 本体）
- 完整变更历史 → `git log`
