@echo off
chcp 65001 >nul
title 资产看板 - 安装

echo ================================
echo   资产看板 - 首次安装
echo ================================
echo.

REM 检查 Node.js
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js
  echo 请先访问 https://nodejs.org 下载安装 LTS 版本 ^(v18+^)
  echo 安装后重新运行本脚本
  pause
  exit /b 1
)

echo [1/4] Node.js 已安装
node -v
echo.

REM 创建 .env
if not exist .env (
  echo [2/4] 生成配置文件 .env ...
  copy .env.example .env >nul
  REM 用 Node 生成随机 AUTH_SECRET
  for /f "delims=" %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"') do set SECRET=%%i
  powershell -Command "(Get-Content .env) -replace 'AUTH_SECRET=.*', 'AUTH_SECRET=\"%SECRET%\"' | Set-Content .env"
  echo     .env 已生成
) else (
  echo [2/4] .env 已存在，跳过
)
echo.

echo [3/4] 安装依赖（首次较慢，请耐心等待）...
call npm config set registry https://registry.npmmirror.com
call npm install
if errorlevel 1 (
  echo [错误] 依赖安装失败
  pause
  exit /b 1
)

REM SWC 单独用官方源装，避免镜像坏包
call npm install --cpu=x64 --os=win32 --registry=https://registry.npmjs.org/ @next/swc-win32-x64-msvc@14.2.15
echo.

echo [4/4] 初始化数据库 ...
call npx prisma generate
call npx prisma db push
echo.

echo ================================
echo   安装完成！
echo   双击 start.bat 启动应用
echo ================================
pause
