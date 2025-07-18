@echo off
chcp 65001 > nul
echo ==========================================
echo        HTML转PNG转换器 - 问题诊断工具
echo ==========================================
echo.

:: 检查Node.js
echo 🔍 检查Node.js环境...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js未找到！
    goto :nodejs_error
) else (
    echo ✅ Node.js已安装
    echo 版本信息：
    node --version 2>nul || echo ⚠️  无法获取Node.js版本
)
echo.

:: 检查npm
echo 🔍 检查npm...
npm --version >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm不可用！
) else (
    echo ✅ npm版本：
    npm --version
)
echo.

:: 检查项目文件
echo 🔍 检查项目文件...
set "missing_files="
if not exist "package.json" set "missing_files=%missing_files% package.json"
if not exist "server.js" set "missing_files=%missing_files% server.js"
if not exist "electron-main.js" set "missing_files=%missing_files% electron-main.js"

if not "%missing_files%"=="" (
    echo ❌ 缺少重要文件：%missing_files%
    goto :file_error
) else (
    echo ✅ 项目文件完整
)
echo.

:: 检查依赖安装
echo 🔍 检查依赖安装...
if not exist "node_modules" (
    echo ❌ node_modules文件夹不存在，需要运行 npm install
    goto :deps_error
) else (
    echo ✅ node_modules存在
)

:: 检查关键依赖
set "missing_deps="
if not exist "node_modules\express" set "missing_deps=%missing_deps% express"
if not exist "node_modules\puppeteer" set "missing_deps=%missing_deps% puppeteer"
if not exist "node_modules\electron" set "missing_deps=%missing_deps% electron"

if not "%missing_deps%"=="" (
    echo ⚠️  缺少关键依赖：%missing_deps%
    echo 建议重新安装依赖
) else (
    echo ✅ 关键依赖已安装
)
echo.

:: 测试基础服务器
echo 🔍 测试基础Web服务器...
echo 启动测试服务器（5秒）...
timeout /t 2 /nobreak >nul
start /b node server.js >server_test.log 2>&1
timeout /t 3 /nobreak >nul

:: 检查端口是否被占用
netstat -ano | findstr :3003 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ 服务器启动成功（端口3003已打开）
    taskkill /f /im node.exe >nul 2>nul
) else (
    echo ❌ 服务器启动失败
    echo 检查错误日志：
    if exist "server_test.log" (
        type server_test.log
    ) else (
        echo 无错误日志文件
    )
)
echo.

:: 清理测试文件
if exist "server_test.log" del "server_test.log" >nul 2>nul

:: 测试Electron
echo 🔍 测试Electron环境...
if exist "node_modules\electron\dist\electron.exe" (
    echo ✅ Electron二进制文件存在
) else (
    echo ❌ Electron二进制文件缺失
    echo 尝试重新安装：npm install electron
)
echo.

:: 检查系统环境
echo 🔍 检查系统环境...
echo 操作系统：
ver
echo.
echo PowerShell版本：
powershell -command "$PSVersionTable.PSVersion" 2>nul || echo 无法获取PowerShell版本
echo.

:: 提供解决方案
echo ==========================================
echo                解决方案建议
echo ==========================================
echo.
echo 💡 如果遇到问题，请按以下步骤操作：
echo.
echo 1. 重新安装依赖：
echo    npm cache clean --force
echo    rmdir /s /q node_modules
echo    del package-lock.json
echo    npm install
echo.
echo 2. 如果网络问题，使用国内镜像：
echo    npm config set registry https://registry.npmmirror.com/
echo    npm config set electron_mirror https://npm.taobao.org/mirrors/electron/
echo.
echo 3. 尝试不同的启动方式：
echo    npm start          # Web服务器模式
echo    npm run electron   # 桌面应用模式
echo.
echo 4. 如果Electron闪退，检查：
echo    - 是否有杀毒软件阻止
echo    - 是否缺少VC++ Redistributable
echo    - 尝试以管理员身份运行
echo.
echo 5. 详细错误信息，请运行：
echo    DEBUG=* npm run electron
echo.
goto :end

:nodejs_error
echo.
echo 🚨 Node.js问题解决方案：
echo 1. 下载安装Node.js 16+：https://nodejs.org/
echo 2. 重启命令行窗口
echo 3. 确认添加到系统PATH
goto :end

:file_error
echo.
echo 🚨 项目文件问题：
echo 请确保在正确的项目目录中运行此脚本
echo 缺少的文件需要重新创建
goto :end

:deps_error
echo.
echo 🚨 依赖问题解决方案：
echo 1. 运行：npm install
echo 2. 如果失败，清理后重试：
echo    npm cache clean --force
echo    npm install
goto :end

:end
echo.
echo 按任意键退出...
pause >nul 