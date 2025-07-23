#!/bin/bash

# HTML转PNG转换器增强版安装脚本
# 支持图标显示和外部资源加载

set -e

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

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
        log_info "检测到操作系统: $OS $VERSION"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
}

# 检测权限
check_permissions() {
    if [ "$EUID" -ne 0 ]; then
        if command -v sudo >/dev/null 2>&1; then
            USE_SUDO="sudo"
            log_warning "检测到非root用户，将使用sudo执行特权命令"
        else
            log_error "需要root权限或sudo命令"
            exit 1
        fi
    else
        USE_SUDO=""
    fi
}

# 安装系统依赖
install_system_deps() {
    log_info "安装系统依赖包..."
    
    case $OS in
        ubuntu|debian)
            $USE_SUDO apt-get update -qq
            $USE_SUDO apt-get install -y \
                curl wget git unzip \
                build-essential \
                nginx \
                fonts-noto-cjk \
                fonts-noto-color-emoji \
                fonts-wqy-zenhei \
                fonts-wqy-microhei \
                fonts-liberation \
                fonts-dejavu-core \
                fontconfig \
                libgtk-3-0 \
                libgbm-dev \
                libxss1 \
                libasound2 \
                libappindicator3-1 \
                xdg-utils \
                libnss3 \
                libxrandr2 \
                libasound2 \
                libpangocairo-1.0-0 \
                libatk1.0-0 \
                libcairo-gobject2 \
                libgtk-3-0 \
                libgdk-pixbuf2.0-0
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                $USE_SUDO dnf install -y \
                    curl wget git unzip \
                    gcc gcc-c++ make \
                    nginx \
                    google-noto-cjk-fonts \
                    google-noto-emoji-fonts \
                    wqy-zenhei-fonts \
                    wqy-microhei-fonts \
                    liberation-fonts \
                    dejavu-fonts-common \
                    fontconfig \
                    gtk3 \
                    libXScrnSaver \
                    alsa-lib \
                    nss \
                    libXrandr \
                    libdrm \
                    libXcomposite \
                    libXdamage \
                    libXfixes
            else
                $USE_SUDO yum install -y \
                    curl wget git unzip \
                    gcc gcc-c++ make \
                    nginx \
                    google-noto-cjk-fonts \
                    wqy-zenhei-fonts \
                    liberation-fonts \
                    fontconfig \
                    gtk3 \
                    libXScrnSaver \
                    alsa-lib
            fi
            ;;
    esac
    
    # 更新字体缓存
    log_info "更新字体缓存..."
    fc-cache -fv >/dev/null 2>&1 || true
    
    log_success "系统依赖安装完成"
}

# 安装Node.js 18
install_nodejs() {
    log_info "检查Node.js安装..."
    
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        local major_version=$(echo $node_version | cut -d'.' -f1 | cut -d'v' -f2)
        
        if [ $major_version -ge 18 ]; then
            log_success "Node.js已安装: $node_version"
            return
        else
            log_warning "Node.js版本过低: $node_version，需要升级到18+"
        fi
    fi
    
    log_info "安装Node.js 18.x..."
    
    case $OS in
        ubuntu|debian)
            curl -fsSL https://deb.nodesource.com/setup_18.x | $USE_SUDO -E bash -
            $USE_SUDO apt-get install -y nodejs
            ;;
        centos|rhel|fedora)
            curl -fsSL https://rpm.nodesource.com/setup_18.x | $USE_SUDO bash -
            $USE_SUDO yum install -y nodejs npm
            ;;
    esac
    
    # 配置npm镜像源
    npm config set registry https://registry.npmmirror.com
    
    local installed_version=$(node --version)
    log_success "Node.js安装完成: $installed_version"
}

# 安装PM2
install_pm2() {
    log_info "检查PM2安装..."
    
    if command -v pm2 >/dev/null 2>&1; then
        log_success "PM2已安装"
        return
    fi
    
    log_info "安装PM2..."
    npm install -g pm2
    log_success "PM2安装完成"
}

# 下载和配置项目
setup_project() {
    log_info "配置项目..."
    
    local project_dir="/www/wwwroot/html-to-png-converter"
    
    # 创建项目目录
    $USE_SUDO mkdir -p $(dirname $project_dir)
    
    # 如果目录已存在，创建备份
    if [ -d "$project_dir" ]; then
        log_warning "项目目录已存在，创建备份..."
        $USE_SUDO mv "$project_dir" "${project_dir}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 克隆项目
    $USE_SUDO git clone https://github.com/cihebi2/tools-all-for-me.git /tmp/tools-all-for-me
    $USE_SUDO mv /tmp/tools-all-for-me/html-to-png-converter "$project_dir"
    $USE_SUDO rm -rf /tmp/tools-all-for-me
    
    # 设置权限
    $USE_SUDO chown -R $(whoami):$(whoami) "$project_dir" 2>/dev/null || true
    
    cd "$project_dir"
    
    # 使用增强版文件
    if [ -f "utils/converter_enhanced.js" ]; then
        cp utils/converter_enhanced.js utils/converter.js
        log_success "已启用增强版转换器"
    fi
    
    if [ -f "utils/browserPool_enhanced.js" ]; then
        cp utils/browserPool_enhanced.js utils/browserPool.js
        log_success "已启用增强版浏览器池"
    fi
    
    log_success "项目配置完成"
}

# 安装项目依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    cd "/www/wwwroot/html-to-png-converter"
    
    # 安装依赖
    npm install
    
    # 安装额外的字体相关依赖
    npm install --save-dev fontfaceobserver
    
    log_success "项目依赖安装完成"
}

# 配置服务
configure_service() {
    log_info "配置服务..."
    
    cd "/www/wwwroot/html-to-png-converter"
    
    # 停止现有服务
    pm2 delete html-to-png-converter 2>/dev/null || true
    
    # 启动增强版服务
    if [ -f "server_enhanced.js" ]; then
        pm2 start server_enhanced.js --name "html-to-png-converter" --watch --ignore-watch="node_modules uploads"
        log_success "已启动增强版服务"
    else
        pm2 start server_with_ui.js --name "html-to-png-converter" --watch --ignore-watch="node_modules uploads"
        log_success "已启动标准版服务"
    fi
    
    # 保存PM2配置
    pm2 save
    pm2 startup | tail -1 | $USE_SUDO bash 2>/dev/null || true
    
    sleep 5
    
    # 检查服务状态
    if pm2 list | grep -q "html-to-png-converter.*online"; then
        log_success "服务启动成功"
    else
        log_error "服务启动失败"
        pm2 logs html-to-png-converter --lines 20
        exit 1
    fi
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw >/dev/null 2>&1; then
        $USE_SUDO ufw allow 22/tcp
        $USE_SUDO ufw allow 80/tcp
        $USE_SUDO ufw allow 443/tcp
        $USE_SUDO ufw allow 3003/tcp
        echo 'y' | $USE_SUDO ufw enable 2>/dev/null || $USE_SUDO ufw --force enable
        log_success "UFW防火墙配置完成"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        $USE_SUDO firewall-cmd --permanent --add-port=22/tcp
        $USE_SUDO firewall-cmd --permanent --add-port=80/tcp
        $USE_SUDO firewall-cmd --permanent --add-port=443/tcp
        $USE_SUDO firewall-cmd --permanent --add-port=3003/tcp
        $USE_SUDO firewall-cmd --reload
        log_success "firewalld防火墙配置完成"
    else
        log_warning "未检测到防火墙工具，请手动开放端口: 22, 80, 443, 3003"
    fi
}

# 测试服务
test_service() {
    log_info "测试服务..."
    
    sleep 3
    
    # 测试健康检查
    if curl -s "http://localhost:3003/api/health" | grep -q "ok"; then
        log_success "服务健康检查通过"
    else
        log_error "服务健康检查失败"
        return 1
    fi
    
    # 测试浏览器池
    local browser_status=$(curl -s "http://localhost:3003/api/browsers/status" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    if [ "$browser_status" -gt 0 ]; then
        log_success "浏览器池初始化成功，浏览器数量: $browser_status"
    else
        log_warning "浏览器池可能有问题"
    fi
}

# 显示结果
show_results() {
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo
    echo "=============================================="
    echo "    🎉 HTML转PNG转换器增强版安装完成！"
    echo "=============================================="
    echo
    echo "🌐 访问地址:"
    echo "   本地访问: http://localhost:3003"
    echo "   外部访问: http://$server_ip:3003"
    echo
    echo "📊 监控端点:"
    echo "   健康检查: http://$server_ip:3003/api/health"
    echo "   浏览器状态: http://$server_ip:3003/api/browsers/status"
    echo "   系统信息: http://$server_ip:3003/api/system/info"
    echo
    echo "🔧 管理命令:"
    echo "   查看状态: pm2 status"
    echo "   查看日志: pm2 logs html-to-png-converter"
    echo "   重启服务: pm2 restart html-to-png-converter"
    echo "   停止服务: pm2 stop html-to-png-converter"
    echo
    echo "✨ 增强功能:"
    echo "   ✅ 支持外部图片资源加载"
    echo "   ✅ 增强中文字体支持"
    echo "   ✅ Font Awesome图标支持"
    echo "   ✅ SVG图像渲染优化"
    echo "   ✅ 智能浏览器池管理"
    echo "   ✅ 详细的健康检查"
    echo
    echo "📝 注意事项:"
    echo "   - 如需域名访问，请配置Nginx反向代理"
    echo "   - 云服务器需要在安全组开放3003端口"
    echo "   - 大图片转换可能需要较长时间，请耐心等待"
    echo
}

# 主函数
main() {
    echo "=============================================="
    echo "  HTML转PNG转换器 - 增强版安装脚本"
    echo "  支持图标显示和外部资源加载"
    echo "=============================================="
    echo
    
    detect_os
    check_permissions
    
    echo "准备安装HTML转PNG转换器增强版..."
    echo "增强功能包括:"
    echo "- ✅ 外部图片资源加载支持"
    echo "- ✅ 完整的中文字体支持"  
    echo "- ✅ Font Awesome图标字体"
    echo "- ✅ SVG渲染优化"
    echo "- ✅ 智能浏览器池管理"
    echo "- ✅ 增强的错误处理"
    echo
    echo "按Enter继续，Ctrl+C取消..."
    read
    
    install_system_deps
    install_nodejs
    install_pm2
    setup_project
    install_dependencies
    configure_service
    configure_firewall
    
    if test_service; then
        show_results
    else
        log_error "服务测试失败，请检查日志"
        pm2 logs html-to-png-converter --lines 30
    fi
}

# 执行主函数
main "$@"