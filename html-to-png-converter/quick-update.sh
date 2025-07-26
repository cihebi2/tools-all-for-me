#!/bin/bash

# =================================================================
# 快速更新脚本 - 音频工具MP3功能
# 适用于紧急更新或简单重启
# =================================================================

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

# 项目配置
PROJECT_ROOT="/www/wwwroot/tools-all-for-me-main"
SERVICE_NAME="html-to-png-converter"

log_info "🚀 执行快速更新..."

# 切换到项目目录
cd "$PROJECT_ROOT"

# 拉取最新代码
log_info "📥 拉取最新代码"
sudo git pull origin main

# 切换到服务目录
cd html-to-png-converter

# 重启PM2服务
log_info "🔄 重启服务"
sudo pm2 restart "$SERVICE_NAME"

# 等待启动
sleep 2

# 检查状态
if sudo pm2 list | grep -q "$SERVICE_NAME.*online"; then
    log_success "✅ 服务重启成功"
    log_info "🌐 访问: http://tool.cihebi.vip/audio"
else
    echo "❌ 服务启动失败，查看日志:"
    sudo pm2 logs "$SERVICE_NAME" --lines 10
fi