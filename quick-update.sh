#!/bin/bash

# 🚀 快速更新脚本 - 用于紧急更新
# 只更新音频相关文件，最小化停机时间

echo "⚡ 快速更新音频MP3功能..."

PROJECT_PATH="/www/wwwroot/tools-all-for-me-main"
cd "$PROJECT_PATH" || exit 1

# 快速拉取并重启
sudo git pull origin main
cd html-to-png-converter
pm2 restart html-to-png-converter

echo "✅ 快速更新完成！"
curl -s http://localhost:3003/api/health | head -2