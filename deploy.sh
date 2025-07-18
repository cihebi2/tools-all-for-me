#!/bin/bash

# HTML转PNG转换器自动部署脚本
# 适用于Ubuntu 20.04+ / Debian 10+

set -e

echo "======================================"
echo "  HTML转PNG转换器 - 自动部署脚本"
echo "======================================"
echo

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

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用root用户运行此脚本"
        exit 1
    fi
}

# 检查操作系统
check_os() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        log_error "此脚本仅支持Linux系统"
        exit 1
    fi
    
    if [ -f /etc/debian_version ]; then
        OS="debian"
        log_info "检测到Debian/Ubuntu系统"
    elif [ -f /etc/redhat-release ]; then
        OS="rhel"
        log_info "检测到RHEL/CentOS系统"
    else
        log_error "不支持的操作系统"
        exit 1
    fi
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            log_success "Node.js已安装，版本: $(node --version)"
            return
        else
            log_warning "Node.js版本过低，需要升级"
        fi
    fi
    
    log_info "安装Node.js 18.x..."
    if [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    log_success "Node.js安装完成: $(node --version)"
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    if [ "$OS" = "debian" ]; then
        sudo apt update
        sudo apt install -y git nginx
        
        # Chromium依赖
        sudo apt-get install -y \
            ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
            libdrm2 libgtk-3-0 libnspr4 libnss3 lsb-release xdg-utils \
            libxss1 libgconf-2-4
    else
        sudo yum update -y
        sudo yum install -y git nginx
        
        # Chromium依赖
        sudo yum install -y \
            liberation-fonts libX11 libXcomposite libXcursor libXdamage \
            libXext libXi libXrandr libXScrnSaver libXss libXtst \
            cups-libs libdrm libgtk-3 libXinerama
    fi
    
    log_success "系统依赖安装完成"
}

# 安装PM2
install_pm2() {
    log_info "安装PM2..."
    
    if command -v pm2 >/dev/null 2>&1; then
        log_success "PM2已安装"
        return
    fi
    
    sudo npm install -g pm2
    log_success "PM2安装完成"
}

# 克隆项目
clone_project() {
    log_info "克隆项目..."
    
    PROJECT_DIR="/var/www/tools-all-for-me"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "项目目录已存在，更新代码..."
        cd "$PROJECT_DIR"
        sudo git pull origin main
        sudo chown -R $USER:$USER .
    else
        log_info "克隆新项目..."
        sudo mkdir -p /var/www
        cd /var/www
        sudo git clone https://github.com/cihebi2/tools-all-for-me.git
        sudo chown -R $USER:$USER tools-all-for-me
    fi
    
    cd "$PROJECT_DIR/html-to-png-converter"
    log_success "项目代码准备完成"
}

# 安装项目依赖
install_project_deps() {
    log_info "安装项目依赖..."
    
    npm install --production
    log_success "项目依赖安装完成"
}

# 配置环境
configure_env() {
    log_info "配置环境变量..."
    
    cat > .env << EOF
NODE_ENV=production
PORT=3003
MAX_BROWSERS=3
EOF
    
    log_success "环境配置完成"
}

# 启动服务
start_service() {
    log_info "启动HTML转PNG服务..."
    
    # 停止现有服务
    pm2 delete html-to-png 2>/dev/null || true
    
    # 启动新服务
    pm2 start server.js --name html-to-png
    pm2 save
    
    # 设置开机自启
    pm2 startup | tail -n 1 | sudo bash || true
    
    log_success "服务启动完成"
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 询问域名
    echo -n "请输入域名（如：example.com，回车使用localhost）: "
    read DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    # 创建Nginx配置
    sudo tee /etc/nginx/sites-available/html-to-png > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 静态文件处理
    location /static/ {
        alias /var/www/tools-all-for-me/html-to-png-converter/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API和Web界面代理
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 文件上传大小限制
        client_max_body_size 10M;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 压缩设置
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/html-to-png /etc/nginx/sites-enabled/
    
    # 测试配置
    sudo nginx -t
    
    # 重启Nginx
    sudo systemctl restart nginx
    sudo systemctl enable nginx
    
    log_success "Nginx配置完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙..."
    
    if command -v ufw >/dev/null 2>&1; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw --force enable
        log_success "防火墙配置完成"
    else
        log_warning "未找到ufw，请手动配置防火墙"
    fi
}

# 显示部署结果
show_result() {
    echo
    echo "======================================"
    echo "         部署完成！"
    echo "======================================"
    echo
    echo "🌐 访问地址: http://$DOMAIN"
    echo "📊 服务状态: pm2 status"
    echo "📝 查看日志: pm2 logs html-to-png"
    echo "🔄 重启服务: pm2 restart html-to-png"
    echo
    echo "💡 配置HTTPS:"
    echo "   sudo apt install snapd"
    echo "   sudo snap install --classic certbot"
    echo "   sudo certbot --nginx -d $DOMAIN"
    echo
    echo "📖 更多信息请查看 DEPLOY.md"
}

# 主函数
main() {
    check_root
    check_os
    
    echo "准备部署HTML转PNG转换器到服务器..."
    echo "按Enter继续，Ctrl+C取消..."
    read
    
    install_nodejs
    install_dependencies
    install_pm2
    clone_project
    install_project_deps
    configure_env
    start_service
    configure_nginx
    configure_firewall
    
    show_result
}

# 执行主函数
main "$@" 