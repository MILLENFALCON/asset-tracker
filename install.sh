#!/usr/bin/env bash
set -e

echo "================================"
echo "  资产看板 - 首次安装"
echo "================================"

if ! command -v node &> /dev/null; then
  echo "[错误] 未检测到 Node.js"
  echo "请访问 https://nodejs.org 下载安装 LTS 版本 (v18+)"
  exit 1
fi

echo "[1/4] Node.js 已安装: $(node -v)"

if [ ! -f .env ]; then
  echo "[2/4] 生成配置文件 .env ..."
  cp .env.example .env
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  # 兼容 macOS 的 sed
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env
  else
    sed -i "s|AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env
  fi
else
  echo "[2/4] .env 已存在，跳过"
fi

echo "[3/4] 安装依赖 ..."
npm config set registry https://registry.npmmirror.com
npm install

echo "[4/4] 初始化数据库 ..."
npx prisma generate
npx prisma db push

echo ""
echo "================================"
echo "  安装完成，运行 ./start.sh 启动"
echo "================================"
