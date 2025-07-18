@echo off
chcp 65001 > nul
echo ====================================
echo    HTML转PNG转换器 - Windows打包工具
echo ====================================
echo.

:: 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ 错误：未找到Node.js！
    echo 请先安装Node.js 16+版本
    echo 下载地址：https://nodejs.org/
    pause
    exit /b 1
)

:: 显示Node.js版本
echo ✅ 检测到Node.js版本：
node --version
echo.

:: 检查package.json是否存在
if not exist package.json (
    echo ❌ 错误：未找到package.json文件！
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

echo 📦 正在安装依赖...
npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ 依赖安装失败！
    echo 尝试使用国内镜像：
    echo npm config set registry https://registry.npmmirror.com/
    pause
    exit /b 1
)

echo.
echo ✅ 依赖安装完成！
echo.

:: 检查是否存在图标文件
if not exist "assets\icon.png" (
    echo ⚠️  注意：未找到图标文件 assets\icon.png
    echo 应用将使用默认图标
    echo 可以稍后按照 assets\README.md 说明添加自定义图标
    echo.
)

echo 🔨 开始构建Windows应用...
echo 这可能需要几分钟时间，请耐心等待...
echo.

:: 设置构建选项
set NODE_OPTIONS=--max-old-space-size=4096

:: 执行构建
npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ 构建失败！
    echo 请检查错误信息并重试
    pause
    exit /b 1
)

echo.
echo 🎉 构建完成！
echo.
echo 📁 输出文件位置：
if exist "dist\" (
    echo    %CD%\dist\
    echo.
    echo 📦 生成的文件：
    dir /b dist\*.exe 2>nul
    if %ERRORLEVEL% equ 0 (
        echo.
        echo ✅ Windows应用打包成功！
        echo.
        echo 使用说明：
        echo 1. 安装版：运行 "HTML转PNG转换器 Setup 1.0.0.exe" 进行安装
        echo 2. 便携版：直接运行 "HTML转PNG转换器 1.0.0.exe"
        echo.
        echo 📖 详细说明请查看 BUILD.md 文件
    ) else (
        echo ❌ 未找到生成的exe文件
    )
) else (
    echo ❌ 未找到dist文件夹
)

echo.
echo 按任意键退出...
pause >nul 