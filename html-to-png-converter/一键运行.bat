@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ====================================
echo     HTML转PNG转换器 - 一键启动
echo ====================================
echo.

:: 检查是否在正确目录
if not exist "package.json" (
    echo ❌ 错误：未找到package.json文件！
    echo 当前目录：%CD%
    echo 请确保脚本在项目根目录中
    pause
    exit /b 1
)

:: 显示当前目录
echo ✅ 当前目录：%CD%
echo.

:: 检查Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 错误：未安装Node.js！
    echo 请先下载安装：https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js版本：
node --version
echo.

:: 检查依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    echo 这可能需要几分钟时间，请耐心等待...
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ❌ 依赖安装失败！
        echo 尝试使用国内镜像：
        npm config set registry https://registry.npmmirror.com/
        npm install
        if %ERRORLEVEL% neq 0 (
            echo ❌ 安装失败，请检查网络连接
            pause
            exit /b 1
        )
    )
    echo ✅ 依赖安装完成！
    echo.
)

echo 🚀 启动选项：
echo 1. Web版本（浏览器中运行）
echo 2. 桌面版本（Electron应用）
echo 3. 退出
echo.
set /p choice="请选择运行模式 (1/2/3): "

if "%choice%"=="1" goto :web_version
if "%choice%"=="2" goto :desktop_version
if "%choice%"=="3" goto :end
echo ❌ 无效选择，默认启动Web版本
goto :web_version

:web_version
echo.
echo 🌐 启动Web版本...
echo 启动后请在浏览器中访问：http://localhost:3003
echo 按 Ctrl+C 停止服务器
echo.
npm start
goto :end

:desktop_version
echo.
echo 🖥️ 启动桌面版本...
echo 正在启动Electron应用...
echo.
npm run electron
goto :end

:end
echo.
echo 感谢使用HTML转PNG转换器！
pause 