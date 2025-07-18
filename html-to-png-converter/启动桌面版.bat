@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ====================================
echo    HTML转PNG转换器 - 桌面版启动
echo ====================================
echo.

:: 自动切换到脚本所在目录
echo ✅ 工作目录：%CD%
echo.

:: 快速检查
if not exist "package.json" (
    echo ❌ 错误：未找到项目文件！
    pause
    exit /b 1
)

:: 检查依赖，如果没有就自动安装
if not exist "node_modules" (
    echo 📦 正在安装依赖，请稍候...
    npm install --silent
)

echo 🚀 正在启动HTML转PNG转换器桌面版...
echo 💡 应用将自动打开窗口，请等待几秒钟...
echo.

:: 启动桌面应用
npm run electron

echo.
echo 应用已关闭，按任意键退出...
pause >nul 