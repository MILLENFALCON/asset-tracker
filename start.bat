@echo off
chcp 65001 >nul
title 资产看板

if not exist node_modules (
  echo 尚未安装，请先双击运行 install.bat
  pause
  exit /b 1
)

if not exist .env (
  echo 配置文件缺失，请重新运行 install.bat
  pause
  exit /b 1
)

echo ================================
echo   资产看板已启动
echo   浏览器访问: http://localhost:3000
echo   按 Ctrl+C 可关闭服务
echo ================================
echo.

REM 3 秒后自动开浏览器
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"

call npm run dev
pause
