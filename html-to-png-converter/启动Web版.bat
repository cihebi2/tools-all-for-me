@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ====================================
echo     HTML转PNG转换器 - Web版启动
echo ====================================
echo.

:: 自动切换到脚本所在目录
echo ✅ 工作目录：%CD%
echo.

:: 检查依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖，请稍候...
    npm install --silent
)

echo 🌐 正在启动Web服务器...
echo.
echo 启动完成后请访问：http://localhost:3003
echo 按 Ctrl+C 停止服务器
echo.

:: 延迟3秒后自动打开浏览器
start "" timeout /t 3 /nobreak && start http://localhost:3003

:: 启动服务器
npm start 