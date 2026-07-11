@echo off
REM PoemGraph Pro · 一键部署 accounts.json 到 Render
REM 用法（Windows）：
REM   1. 在 admin 工具点「⬇ 下载 accounts.json」
REM   2. 双击运行此脚本（或在 cmd 拖入此脚本）
REM   3. 把下载的文件拖进窗口 → 回车 → 脚本自动 git push

setlocal EnableDelayedExpansion

REM 定位仓库根
cd /d "%~dp0\.."
set REPO_ROOT=%CD%
echo 📁 仓库根: %REPO_ROOT%
echo.

REM 检查 git 是否可用
where git >nul 2>nul
if errorlevel 1 (
  echo ❌ 未找到 git，请先安装 Git for Windows。
  pause
  exit /b 1
)

REM 接收文件路径
set /p INPUT_FILE="把下载的 accounts.json 拖到此处回车（直接回车默认 %USERPROFILE%\Downloads\accounts-*.json）："
if "%INPUT_FILE%"=="" (
  REM 找 Downloads 下最新的
  if exist "%USERPROFILE%\Downloads" (
    for /f "delims=" %%F in ('dir /b /od /a-d "%USERPROFILE%\Downloads\accounts-*.json" 2^>nul') do set LATEST=%USERPROFILE%\Downloads\%%F
    if defined LATEST (
      set INPUT_FILE=!LATEST!
    )
  )
)

if "%INPUT_FILE%"=="" (
  echo ❌ 找不到文件。
  pause
  exit /b 1
)
if not exist "%INPUT_FILE%" (
  echo ❌ 文件不存在: %INPUT_FILE%
  pause
  exit /b 1
)

echo ✅ 选中文件: %INPUT_FILE%
echo.

REM 校验 JSON（用 PowerShell）
powershell -NoProfile -Command "try { $j = Get-Content -Raw '%INPUT_FILE%' | ConvertFrom-Json; Write-Host ('📊 文件含 ' + $j.accounts.Count + ' 个账号') } catch { Write-Host '❌ 不是有效 JSON' -ForegroundColor Red; exit 1 }"
if errorlevel 1 ( pause & exit /b 1 )

powershell -NoProfile -Command "$j = Get-Content -Raw '%INPUT_FILE%' | ConvertFrom-Json; $bad = ($j.accounts | Where-Object { -not $_.h -or $_.h.Length -ne 64 }).Count; if ($bad -gt 0) { Write-Host ('⚠️ 警告：有 ' + $bad + ' 个账号 hash 不是 64 位') -ForegroundColor Yellow }"

REM 对比当前仓库
if exist "accounts.json" (
  powershell -NoProfile -Command "$cur = (Get-Content -Raw 'accounts.json' | ConvertFrom-Json).accounts.Count; $new = (Get-Content -Raw '%INPUT_FILE%' | ConvertFrom-Json).accounts.Count; if ($cur -eq $new) { Write-Host ('⚠️ 账号数未变（' + $cur + ' → ' + $new + '），仍继续覆盖') -ForegroundColor Yellow } else { Write-Host ('🔄 账号数变化: ' + $cur + ' → ' + $new) }"
)

REM 覆盖
copy /Y "%INPUT_FILE%" "accounts.json" >nul
echo ✅ 已覆盖 accounts.json
echo.

REM git 操作
git add accounts.json
if errorlevel 1 ( echo ❌ git add 失败 & pause & exit /b 1 )

set DEFAULT_MSG=accounts: 部署新账号 (%date:~0,10%)
set /p MSG="commit message [回车用默认: %DEFAULT_MSG%]："
if "%MSG%"=="" set MSG=%DEFAULT_MSG%

git commit -m "%MSG%"
if errorlevel 1 ( echo ❌ git commit 失败 & pause & exit /b 1 )

git push origin main
if errorlevel 1 ( echo ❌ git push 失败 & pause & exit /b 1 )

echo.
echo 🎉 推送完成！Render 自动重 deploy ≈30s，新账号可登入。
echo    测试入口：https://pg-ndxn.onrender.com/poemgraph-pro.html
pause