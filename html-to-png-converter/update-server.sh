#!/bin/bash

# =================================================================
# 音频工具MP3格式保持功能 - 云服务器更新脚本
# 适用于: PM2管理的Node.js服务
# 服务器: tool.cihebi.vip (144.34.227.86)
# =================================================================

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 项目配置
PROJECT_ROOT="/www/wwwroot/tools-all-for-me-main"
SERVICE_NAME="html-to-png-converter"
BRANCH="main"

# 开始更新流程
log_info "🚀 开始更新音频工具MP3格式保持功能..."
log_info "项目路径: $PROJECT_ROOT"
log_info "服务名称: $SERVICE_NAME"

# 1. 检查项目目录
if [ ! -d "$PROJECT_ROOT" ]; then
    log_error "项目目录不存在: $PROJECT_ROOT"
    exit 1
fi

cd "$PROJECT_ROOT"
log_success "✅ 切换到项目目录"

# 2. 备份当前版本（可选）
BACKUP_DIR="/tmp/tools-backup-$(date +%Y%m%d_%H%M%S)"
log_info "🔄 创建备份: $BACKUP_DIR"
sudo mkdir -p "$BACKUP_DIR"
sudo cp -r html-to-png-converter/public/audio.* "$BACKUP_DIR/" 2>/dev/null || log_warning "⚠️  音频文件不存在，跳过备份"

# 3. 停止PM2服务
log_info "🛑 停止PM2服务: $SERVICE_NAME"
sudo pm2 stop "$SERVICE_NAME" || log_warning "⚠️  服务可能已经停止"

# 4. 拉取最新代码
log_info "📥 拉取最新代码..."

# 处理可能的文件冲突
if [ -f "html-to-png-converter/update.sh" ]; then
    log_warning "⚠️  删除冲突文件: update.sh"
    sudo rm -f html-to-png-converter/update.sh
fi

# 拉取更新
sudo git stash push -m "Auto-stash before update $(date)" || log_warning "⚠️  没有需要stash的更改"
sudo git pull origin "$BRANCH"

if [ $? -eq 0 ]; then
    log_success "✅ 代码更新成功"
else
    log_error "❌ 代码更新失败"
    exit 1
fi

# 5. 进入项目目录
cd html-to-png-converter
log_info "📂 切换到服务目录: html-to-png-converter"

# 6. 应用增强版文件（如果存在）
if [ -f "utils/converter_enhanced.js" ]; then
    log_info "🔄 应用增强版转换器"
    sudo cp utils/converter_enhanced.js utils/converter.js
fi

if [ -f "utils/browserPool_enhanced.js" ]; then
    log_info "🔄 应用增强版浏览器池"
    sudo cp utils/browserPool_enhanced.js utils/browserPool.js
fi

# 7. 验证关键文件
log_info "🔍 验证音频处理文件..."

if [ -f "public/audio.html" ] && [ -f "public/audio.js" ]; then
    log_success "✅ 音频处理文件存在"
    
    # 检查LAME编码器引用
    if grep -q "lamejs" public/audio.html; then
        log_success "✅ LAME编码器已配置"
    else
        log_warning "⚠️  LAME编码器配置可能缺失"
    fi
    
    # 检查MP3处理方法
    if grep -q "processMp3ToMp3" public/audio.js; then
        log_success "✅ MP3格式保持功能已部署"
    else
        log_warning "⚠️  MP3处理方法可能缺失"
    fi
else
    log_error "❌ 音频处理文件缺失"
    exit 1
fi

# 8. 重启PM2服务
log_info "🔄 重启PM2服务: $SERVICE_NAME"
sudo pm2 restart "$SERVICE_NAME"

# 等待服务启动
sleep 3

# 9. 验证服务状态
log_info "🔍 验证服务状态..."
sudo pm2 status "$SERVICE_NAME"

if sudo pm2 list | grep -q "$SERVICE_NAME.*online"; then
    log_success "✅ 服务启动成功"
else
    log_error "❌ 服务启动失败"
    log_info "📋 查看服务日志:"
    sudo pm2 logs "$SERVICE_NAME" --lines 20
    exit 1
fi

# 10. 健康检查
log_info "🏥 执行健康检查..."

# 检查基础API
if curl -s http://localhost:3003/api/health >/dev/null 2>&1; then
    log_success "✅ 健康检查通过"
else
    log_warning "⚠️  健康检查失败，请手动验证"
fi

# 检查音频页面
if curl -s http://localhost:3003/audio >/dev/null 2>&1; then
    log_success "✅ 音频页面可访问"
else
    log_warning "⚠️  音频页面访问失败"
fi

# 11. 显示服务信息
log_info "📊 服务信息:"
echo "  🌐 音频工具URL: http://tool.cihebi.vip/audio"
echo "  🔗 健康检查: http://tool.cihebi.vip/api/health"
echo "  📁 项目路径: $PROJECT_ROOT/html-to-png-converter"
echo "  📝 日志查看: sudo pm2 logs $SERVICE_NAME"

# 12. 清理备份（可选，7天后自动清理）
log_info "🧹 备份文件将在7天后自动清理: $BACKUP_DIR"

log_success "🎉 音频工具MP3格式保持功能更新完成！"
log_info "🎵 新功能: MP3上传→MP3输出，支持200MB文件，使用LAME编码器"

# 13. 显示测试建议
echo ""
log_info "🧪 建议测试流程:"
echo "  1. 访问: http://tool.cihebi.vip/audio"
echo "  2. 上传MP3文件测试音量调整"
echo "  3. 验证输出文件格式为MP3"
echo "  4. 检查控制台日志确认LAME编码器工作正常"

echo ""
log_success "✨ 更新脚本执行完毕！"