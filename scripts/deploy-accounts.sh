#!/usr/bin/env bash
# PoemGraph Pro · 一键部署 accounts.json 到 Render
# 用法（mac / Linux）：
#   1. 在 admin 工具点「⬇ 下载 accounts.json」
#   2. 把下载的文件拖到终端（或在终端回车用默认路径）
#   3. 脚本自动覆盖根 accounts.json → git add → commit → push
# 触发 Render 自动重 deploy，新账号立即可用。

set -e
# 强制 UTF-8（避免 mac 默认 LANG=en_US 导致中文乱码）
export LANG="${LANG:-en_US.UTF-8}"
export LC_ALL="${LC_ALL:-en_US.UTF-8}"

# 定位仓库根（脚本可放任意子目录）
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$(cd "$(dirname "$0")/.." && pwd)")"
cd "$REPO_ROOT"

echo "📁 仓库根: $REPO_ROOT"
echo ""

# 接收文件路径（支持拖拽到终端，会自动加上单引号包裹）
read -r -p "把下载的 accounts.json 拖到此处回车（直接回车默认 ~/Downloads/accounts-*.json）：" INPUT_FILE
# 去掉拖拽产生的引号
INPUT_FILE=$(echo "$INPUT_FILE" | sed -e "s/^['\"]//" -e "s/['\"]$//" | xargs)

# 默认路径：查找 Downloads 下最新的 accounts-*.json
if [ -z "$INPUT_FILE" ]; then
  # mac 默认 ~/Downloads，Linux 可能 ~/Downloads 或 ~/下载
  for DIR in ~/Downloads ~/下载; do
    if [ -d "$DIR" ]; then
      CAND=$(ls -t "$DIR"/accounts-*.json 2>/dev/null | head -1)
      if [ -n "$CAND" ]; then
        INPUT_FILE="$CAND"
        break
      fi
    fi
  done
fi

if [ -z "$INPUT_FILE" ] || [ ! -f "$INPUT_FILE" ]; then
  echo "❌ 找不到文件。请把下载的 accounts.json 路径粘贴进来。" >&2
  exit 1
fi

echo "✅ 选中文件: $INPUT_FILE"
echo ""

# 校验 JSON
if ! python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$INPUT_FILE" 2>/dev/null; then
  echo "❌ 文件不是有效 JSON，请检查。" >&2
  exit 1
fi

# 验证是 accounts.json 形状：有 accounts 数组
ACCOUNTS_LEN=$(python3 -c "import json,sys; print(len(json.load(open(sys.argv[1])).get('accounts',[])))" "$INPUT_FILE")
echo "📊 文件含 $ACCOUNTS_LEN 个账号"
echo ""

# 校验 hash 长度 64
BAD_HASH=$(python3 -c "
import json,sys
j=json.load(open(sys.argv[1]))
print(sum(1 for a in j.get('accounts',[]) if not a.get('h') or len(a['h'])!=64))" "$INPUT_FILE")
if [ "$BAD_HASH" != "0" ]; then
  echo "⚠️ 警告：有 $BAD_HASH 个账号 hash 不是 64 位（仍会继续）。" >&2
fi

# 对比当前仓库 vs 新文件：账号数变化
if [ -f "accounts.json" ]; then
  CUR_LEN=$(python3 -c "import json; print(len(json.load(open('accounts.json')).get('accounts',[])))")
  if [ "$CUR_LEN" = "$ACCOUNTS_LEN" ]; then
    echo "⚠️ 账号数未变（$CUR_LEN → $ACCOUNTS_LEN），确认是要覆盖吗？" >&2
    read -r -p "继续? [y/N] " yn
    case "$yn" in [yY]*) ;; *) echo "🛑 取消"; exit 0;; esac
  else
    echo "🔄 账号数变化: $CUR_LEN → $ACCOUNTS_LEN"
  fi
fi
echo ""

# 覆盖根 accounts.json
cp "$INPUT_FILE" accounts.json
echo "✅ 已覆盖 $REPO_ROOT/accounts.json"

# git 操作（如果没初始化给提示）
if [ ! -d ".git" ]; then
  echo "❌ 当前目录不是 git 仓库，请先 git init / clone。" >&2
  exit 1
fi

git add accounts.json

# commit message 让作者补
DEFAULT_MSG="accounts: 部署 ${ACCOUNTS_LEN} 个账号 ($(date +%Y-%m-%d))"
read -r -p "commit message [回车用默认: $DEFAULT_MSG]：" MSG
MSG=${MSG:-$DEFAULT_MSG}

git commit -m "$MSG"
echo ""

git push origin main
echo ""
echo "🎉 推送完成！Render 自动重 deploy ≈30s，新账号可登入。"
echo "   测试入口：https://pg-ndxn.onrender.com/poemgraph-pro.html"
