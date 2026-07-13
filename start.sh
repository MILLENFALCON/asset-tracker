#!/usr/bin/env bash
if [ ! -d node_modules ]; then
  echo "尚未安装，请先运行 ./install.sh"
  exit 1
fi
echo "浏览器访问 http://localhost:3000"
npm run dev
