# PoemGraph Pro · 脚本目录

> 目的：本地辅助脚本清单 + 一键部署 accounts.json 的详细用法
> 目标读者：作者本人
> 如何阅读：先看「脚本清单」知道有哪些脚本；要看 deploy-accounts 用法直接跳「deploy-accounts 使用手册」

## 脚本清单

| 脚本 | 用途 | 平台 |
|---|---|---|
| `deploy-accounts.sh` | 把 admin 下载的 accounts.json 一键覆盖到仓库根并 git push 到 Render | mac / Linux |
| `deploy-accounts.cmd` | 同上，Windows 版本 | Windows |
| `gen_recite_audio.py` | 离线朗读音频批量生成（语舒/善怡/历史故事三轨） | 跨平台（需 Swift + ffmpeg） |
| `migrate_audio_to_lazy.js` | 把 poemgraph.html 内的音频数据迁到独立 script 块（性能优化） | Node.js |

## deploy-accounts 使用手册

### 它是什么

把"admin 工具下载的 accounts.json" → **自动** 覆盖仓库根 → **自动** git add / commit / push → 触发 Render 自动重 deploy。

不用这个脚本时，你需要：
1. 下载 accounts.json
2. 把它拖到/复制到仓库根覆盖 `accounts.json`
3. 打开终端 `cd` 到仓库根
4. `git add accounts.json`
5. `git commit -m "..."`
6. `git push origin main`
7. 等 Render 重 deploy ≈30s

跑这个脚本后，只需要**步骤 1-2 + 把路径拖进终端回车**。

### 前置条件

- ✅ 仓库根已 `git clone` 过（脚本会用 `git rev-parse --show-toplevel` 自动找仓库根）
- ✅ `git` 命令可用（mac 自带；Windows 装 Git for Windows）
- ✅ mac/Linux：`bash` ≥ 4.0；Windows：cmd.exe + PowerShell
- ✅ `python3` 可用（mac 自带；Linux 自带；Windows 装 Python 3 即可）

### mac / Linux 用法

#### 步骤 1：在 admin 工具下载 JSON

1. 浏览器打开 `https://pg-ndxn.onrender.com/account-admin.html`（或本地 `http://127.0.0.1:8765/account-admin.html`）
2. 切到「🎲 自动生成」标签页
3. 点「🎲 生成账号」（生成 N 个新账号到明文 textarea）
4. 点「🔗 追加到现有 JSON」（合并现有 accounts.json + 新账号，输出框显示完整 JSON）
5. 点「⬇ 下载 accounts.json」（浏览器下载到 `~/Downloads/accounts-2026-07-11.json`）

#### 步骤 2：跑脚本

打开**终端**（mac 应用 `Terminal.app` 或 iTerm2），跑：

```bash
cd /Users/Zhuanz/Claude/PoemGraph
bash scripts/deploy-accounts.sh
```

脚本会交互式提示：

```
📁 仓库根: /Users/Zhuanz/Claude/PoemGraph

把下载的 accounts.json 拖到此处回车（直接回车默认 ~/Downloads/accounts-*.json）：
```

**两选一**：

- **A. 拖拽**：把步骤 1 下载的文件从 Finder 拖到终端窗口，路径会自动填入（注意路径前后的引号会自动去掉）。回车。
- **B. 直接回车**：脚本自动找 `~/Downloads/accounts-*.json` 最新的一份；如果你改了默认下载位置，它会找不到再让你手动输入。

#### 步骤 3：脚本输出 & 你要确认的内容

```
✅ 选中文件: /Users/Zhuanz/Downloads/accounts-2026-07-11.json

📊 文件含 8 个账号

🔄 账号数变化: 2 → 8
```

接着确认：

- ✅ 文件是有效 JSON（脚本会跑 `python3 -c "import json; ..."` 校验）
- ✅ hash 都是 64 位（如果有不是 64 位的会 ⚠️ 警告但仍继续）
- ⚠️ 如果账号数**未变**（譬如上次误覆盖没新增）会问你是否继续

#### 步骤 4：commit message

```
commit message [回车用默认: accounts: 部署 8 个账号 (2026-07-11)]：
```

直接回车用默认；或输入自定义 message。

#### 步骤 5：自动 git push

```
[main 9b6c896] accounts: 部署 8 个账号 (2026-07-11)
 1 file changed, 36 insertions(+), 3 deletions(-)
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
...
To github.com:wen001-git/Chinese-poetry-knowledge-graph.git
   d2578c2..9b6c896  main -> main

🎉 推送完成！Render 自动重 deploy ≈30s，新账号可登入。
   测试入口：https://pg-ndxn.onrender.com/poemgraph-pro.html
```

**搞定**。脚本退出。

### Windows 用法

`scripts/deploy-accounts.cmd` 提供 Windows 版本。

#### 步骤 1：同上（admin 下载 JSON）

#### 步骤 2：跑脚本

两种方式：

**A. 双击运行**：
1. 打开 File Explorer 到 `C:\path\to\PoemGraph\scripts\`
2. 双击 `deploy-accounts.cmd`
3. 弹出 cmd 窗口，提示拖拽文件路径

**B. 命令行运行**：
```cmd
cd C:\path\to\PoemGraph
scripts\deploy-accounts.cmd
```

后续交互与 mac 版本一致（拖拽路径 / 直接回车取最新 / commit message / git push）。

### 完整示例（mac 端到端）

```bash
$ cd /Users/Zhuanz/Claude/PoemGraph
$ bash scripts/deploy-accounts.sh

📁 仓库根: /Users/Zhuanz/Claude/PoemGraph

把下载的 accounts.json 拖到此处回车（直接回车默认 ~/Downloads/accounts-*.json）：/Users/Zhuanz/Downloads/accounts-2026-07-11.json

✅ 选中文件: /Users/Zhuanz/Downloads/accounts-2026-07-11.json

📊 文件含 8 个账号

🔄 账号数变化: 2 → 8

commit message [回车用默认: accounts: 部署 8 个账号 (2026-07-11)]：添加 6 个新客户账号

[main a1b2c3d] 添加 6 个新客户账号
 1 file changed, 33 insertions(+), 3 deletions(-)
...
To github.com:wen001-git/Chinese-poetry-knowledge-graph.git
   d2578c2..a1b2c3d  main -> main

🎉 推送完成！Render 自动重 deploy ≈30s，新账号可登入。
   测试入口：https://pg-ndxn.onrender.com/poemgraph-pro.html
```

### 常见问题

#### Q1：跑脚本时 bash 报 "Permission denied"
**A**：`chmod +x scripts/deploy-accounts.sh` 给执行权限。

#### Q2：直接回车说"找不到文件"
**A**：默认找 `~/Downloads/accounts-*.json`。如果你下载到了别处：
- mac Safari 默认 `~/Downloads`
- Chrome 默认 `~/Downloads`
- Windows 默认 `C:\Users\<你>\Downloads\`

最简办法是手动输入路径，或拖拽文件到终端窗口。

#### Q3：commit message 留空用默认的，但默认格式不喜欢
**A**：编辑脚本 line 90 左右：`DEFAULT_MSG="accounts: 部署 ${ACCOUNTS_LEN} 个账号 ($(date +%Y-%m-%d))"` 改这里。

#### Q4：想跳过"账号数未变"提示
**A**：编辑脚本，在 line 50 附近的"账号数未变"确认块删掉或改成 always-yes。

#### Q5：git push 失败
**A**：常见原因：
- 网络问题 → 重试
- SSH key 没配 → `ssh -T git@github.com` 测试；或换 HTTPS remote
- main 分支受保护 → 去 GitHub repo Settings → Branches 取消保护，或换用 PR 流程

#### Q6：想推到非 main 分支
**A**：编辑脚本最后一行 `git push origin main` 改成你想要的分支名。

### 撤销已部署的 accounts.json

如果发现刚刚部署的账号有问题（譬如密码手抖打错），可以：

```bash
cd /Users/Zhuanz/Claude/PoemGraph
git revert HEAD
git push origin main
```

Render 自动重 deploy，恢复上一版。

或更暴力：
```bash
git reset --hard HEAD~1
git push --force origin main
```

⚠️ `--force` 会重写远端历史，仅限你一个人用的 repo 才安全；如果有别人协作改用 `git revert`。

## 变更记录
| 日期 | 变更内容 |
|------|---------|
| 2026-07-11 | 初始创建 deploy-accounts.sh/.cmd 使用手册 |