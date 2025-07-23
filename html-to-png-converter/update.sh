#!/bin/bash

# HTML转PNG转换器一键更新脚本
# 用于快速更新服务器上的程序到最新版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# 配置变量
PROJECT_DIR="/www/wwwroot/tools-all-for-me-main/html-to-png-converter"
SERVICE_NAME="html-to-png-converter"
BACKUP_DIR="/tmp/html-to-png-backup-$(date +%Y%m%d_%H%M%S)"

# 检查是否需要sudo
check_permissions() {
    if [ "$EUID" -ne 0 ]; then
        if command -v sudo >/dev/null 2>&1; then
            USE_SUDO="sudo"
            log_warning "使用sudo执行特权命令"
        else
            log_error "需要root权限或sudo命令"
            exit 1
        fi
    else
        USE_SUDO=""
    fi
}

# 检查项目目录是否存在
check_project_dir() {
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "项目目录不存在: $PROJECT_DIR"
        log_info "请先运行安装脚本或手动创建项目"
        exit 1
    fi
}

# 检查PM2服务状态
check_service() {
    if ! command -v pm2 >/dev/null 2>&1; then
        log_error "PM2未安装，请先安装PM2"
        exit 1
    fi
    
    if pm2 list | grep -q "$SERVICE_NAME"; then
        log_info "检测到现有服务: $SERVICE_NAME"
        return 0
    else
        log_warning "未检测到现有服务，将创建新服务"
        return 1
    fi
}

# 备份当前版本
backup_current() {
    log_info "备份当前版本到: $BACKUP_DIR"
    $USE_SUDO mkdir -p "$BACKUP_DIR"
    $USE_SUDO cp -r "$PROJECT_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    log_success "备份完成"
}

# 更新代码
update_code() {
    log_info "更新代码..."
    
    cd "$PROJECT_DIR"
    
    # 保存现有的node_modules和uploads目录
    if [ -d "node_modules" ]; then
        $USE_SUDO mv node_modules /tmp/node_modules_backup
        log_info "临时保存node_modules"
    fi
    
    if [ -d "uploads" ]; then
        $USE_SUDO mv uploads /tmp/uploads_backup
        log_info "临时保存uploads目录"
    fi
    
    # 拉取最新代码
    $USE_SUDO git fetch origin
    $USE_SUDO git reset --hard origin/main
    
    # 恢复node_modules和uploads
    if [ -d "/tmp/node_modules_backup" ]; then
        $USE_SUDO mv /tmp/node_modules_backup node_modules
        log_info "恢复node_modules"
    fi
    
    if [ -d "/tmp/uploads_backup" ]; then
        $USE_SUDO mv /tmp/uploads_backup uploads
        log_info "恢复uploads目录"
    fi
    
    # 设置权限
    $USE_SUDO chown -R $(whoami):$(whoami) "$PROJECT_DIR" 2>/dev/null || true
    
    log_success "代码更新完成"
}

# 应用增强版文件
apply_enhanced_files() {
    log_info "应用增强版文件..."
    
    cd "$PROJECT_DIR"
    
    # 使用增强版转换器
    if [ -f "utils/converter_enhanced.js" ]; then
        cp utils/converter_enhanced.js utils/converter.js
        log_success "已应用增强版转换器"
    fi
    
    # 使用增强版浏览器池
    if [ -f "utils/browserPool_enhanced.js" ]; then
        cp utils/browserPool_enhanced.js utils/browserPool.js
        log_success "已应用增强版浏览器池"
    fi
    
    # 检查是否有增强版服务器
    if [ -f "server_enhanced.js" ]; then
        SERVER_FILE="server_enhanced.js"
        log_success "将使用增强版服务器"
    elif [ -f "server_with_ui.js" ]; then
        SERVER_FILE="server_with_ui.js"
        log_info "将使用标准版服务器"
    else
        log_error "未找到服务器文件"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    log_info "检查并安装依赖..."
    
    cd "$PROJECT_DIR"
    
    # 检查package.json是否有变化
    if [ -f "package.json" ]; then
        npm install --production
        log_success "依赖安装完成"
    else
        log_warning "未找到package.json文件"
    fi
}

# 重启服务
restart_service() {
    log_info "重启服务..."
    
    cd "$PROJECT_DIR"
    
    # 停止现有服务
    pm2 stop "$SERVICE_NAME" 2>/dev/null || true
    pm2 delete "$SERVICE_NAME" 2>/dev/null || true
    
    # 启动新服务
    pm2 start "$SERVER_FILE" --name "$SERVICE_NAME" --watch --ignore-watch="node_modules uploads"
    
    # 保存PM2配置
    pm2 save
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if pm2 list | grep -q "$SERVICE_NAME.*online"; then
        log_success "服务重启成功"
    else
        log_error "服务启动失败"
        pm2 logs "$SERVICE_NAME" --lines 20
        return 1
    fi
}

# 测试服务
test_service() {
    log_info "测试服务..."
    
    # 等待服务完全启动
    sleep 3
    
    # 测试健康检查
    if curl -s "http://localhost:3003/api/health" | grep -q "ok"; then
        log_success "✅ 健康检查通过"
    else
        log_error "❌ 健康检查失败"
        return 1
    fi
    
    # 测试浏览器池（如果有增强版端点）
    if curl -s "http://localhost:3003/api/browsers/status" | grep -q "total"; then
        log_success "✅ 浏览器池状态正常"
    else
        log_info "ℹ️ 标准版服务，无浏览器池状态端点"
    fi
    
    # 获取服务器IP
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    echo
    log_success "🎉 更新完成！服务已重启"
    echo "🌐 访问地址: http://$server_ip:3003"
    echo "📊 健康检查: http://$server_ip:3003/api/health"
    echo "🔧 管理命令: pm2 status | pm2 logs $SERVICE_NAME"
}

# 回滚功能
rollback() {
    log_warning "检测到更新失败，正在回滚..."
    
    if [ -d "$BACKUP_DIR" ]; then
        $USE_SUDO rm -rf "$PROJECT_DIR"/*
        $USE_SUDO cp -r "$BACKUP_DIR"/* "$PROJECT_DIR/"
        
        cd "$PROJECT_DIR"
        pm2 restart "$SERVICE_NAME"
        
        log_success "已回滚到备份版本"
    else
        log_error "未找到备份，无法回滚"
    fi
}

# 主函数
main() {
    echo "=============================================="
    echo "   🚀 HTML转PNG转换器一键更新脚本"
    echo "=============================================="
    echo
    
    check_permissions
    check_project_dir
    
    local has_service=false
    if check_service; then
        has_service=true
    fi
    
    echo "准备更新HTML转PNG转换器..."
    echo "📂 项目目录: $PROJECT_DIR"
    echo "🔄 服务名称: $SERVICE_NAME"
    echo
    echo "⚠️  更新将会："
    echo "   1. 备份当前版本"
    echo "   2. 拉取最新代码"
    echo "   3. 应用增强版文件"
    echo "   4. 重启服务"
    echo
    echo "按Enter继续，Ctrl+C取消..."
    read
    
    # 执行更新流程
    if backup_current && update_code && apply_enhanced_files && install_dependencies; then
        if restart_service && test_service; then
            log_success "🎉 更新成功完成！"
            
            # 清理备份（可选）
            echo
            echo "是否删除备份文件？(y/N): "
            read -n 1 delete_backup
            echo
            if [[ $delete_backup =~ ^[Yy]$ ]]; then
                $USE_SUDO rm -rf "$BACKUP_DIR"
                log_info "备份文件已删除"
            else
                log_info "备份文件保留在: $BACKUP_DIR"
            fi
        else
            log_error "服务启动失败"
            rollback
            exit 1
        fi
    else
        log_error "更新过程失败"
        rollback
        exit 1
    fi
}

# 处理中断信号
trap 'log_error "更新被中断"; rollback; exit 1' INT TERM

# 执行主函数
main "$@"