#!/bin/bash

# HTML转PNG转换器自动部署脚本
# 适用于Ubuntu 20.04+ / Debian 10+ / CentOS 7+
# 修复版本 - 解决npm镜像源、中文字体、权限等问题

set -e

echo "======================================"
echo "  HTML转PNG转换器 - 自动部署脚本"
echo "  修复版本 v2.0"
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

# 检查是否为root用户（但允许root运行）
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warning "检测到root用户，将自动处理权限问题"
        USE_SUDO=""
    else
        USE_SUDO="sudo"
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

# 配置npm镜像源
configure_npm() {
    log_info "配置npm镜像源..."
    
    # 删除旧的镜像源配置
    npm config delete registry 2>/dev/null || true
    
    # 设置新的镜像源
    npm config set registry https://registry.npmmirror.com
    
    # 验证配置
    REGISTRY=$(npm config get registry)
    log_success "npm镜像源已设置为: $REGISTRY"
    
    # 清除npm缓存
    npm cache clean --force 2>/dev/null || true
    log_success "npm缓存已清除"
}

# 安装中文字体
install_chinese_fonts() {
    log_info "安装中文字体..."
    
    if [ "$OS" = "debian" ]; then
        $USE_SUDO apt update
        $USE_SUDO apt install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
    else
        $USE_SUDO yum install -y google-noto-sans-cjk-fonts wqy-zenhei-fonts
    fi
    
    # 刷新字体缓存
    $USE_SUDO fc-cache -fv
    
    # 验证字体安装
    CHINESE_FONTS=$(fc-list :lang=zh | wc -l)
    if [ "$CHINESE_FONTS" -gt 0 ]; then
        log_success "中文字体安装完成，共找到 $CHINESE_FONTS 个中文字体"
    else
        log_warning "中文字体安装可能失败，尝试手动安装..."
        
        # 创建字体目录
        $USE_SUDO mkdir -p /usr/share/fonts/truetype/chinese
        
        # 下载并安装思源黑体
        cd /tmp
        wget -q https://github.com/adobe-fonts/source-han-sans/releases/download/2.004R/SourceHanSansSC.zip || log_warning "字体下载失败，请检查网络连接"
        
        if [ -f "SourceHanSansSC.zip" ]; then
            unzip -q SourceHanSansSC.zip
            $USE_SUDO cp SourceHanSansSC/OTF/SimplifiedChinese/*.otf /usr/share/fonts/truetype/chinese/ 2>/dev/null || true
            rm -rf SourceHanSansSC.zip SourceHanSansSC/
            $USE_SUDO fc-cache -fv
            log_success "思源黑体安装完成"
        fi
    fi
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装状态..."
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            log_success "Node.js已安装，版本: $(node --version)"
            configure_npm
            return
        else
            log_warning "Node.js版本过低，需要升级"
        fi
    fi
    
    log_info "安装Node.js 18.x..."
    if [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | $USE_SUDO -E bash -
        $USE_SUDO apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | $USE_SUDO bash -
        $USE_SUDO yum install -y nodejs
    fi
    
    log_success "Node.js安装完成: $(node --version)"
    configure_npm
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    if [ "$OS" = "debian" ]; then
        $USE_SUDO apt update
        $USE_SUDO apt install -y git nginx wget unzip
        
        # Chromium依赖
        $USE_SUDO apt-get install -y \
            ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
            libdrm2 libgtk-3-0 libnspr4 libnss3 lsb-release xdg-utils \
            libxss1 libgconf-2-4
    else
        $USE_SUDO yum update -y
        $USE_SUDO yum install -y git nginx wget unzip
        
        # Chromium依赖
        $USE_SUDO yum install -y \
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
    
    npm install -g pm2
    log_success "PM2安装完成"
}

# 克隆项目
clone_project() {
    log_info "克隆项目..."
    
    PROJECT_DIR="$HOME/tools-all-for-me"
    
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "项目目录已存在，更新代码..."
        cd "$PROJECT_DIR"
        git pull origin main || git pull origin master || log_warning "代码更新失败"
    else
        log_info "克隆新项目..."
        cd "$HOME"
        git clone https://github.com/cihebi2/tools-all-for-me.git || {
            log_error "项目克隆失败，请检查网络连接或仓库地址"
            exit 1
        }
    fi
    
    cd "$PROJECT_DIR/html-to-png-converter"
    
    # 确保当前用户拥有项目文件
    if [[ $EUID -eq 0 ]]; then
        # 如果是root用户，创建一个普通用户来运行服务
        if ! id "htmlconv" &>/dev/null; then
            useradd -m -s /bin/bash htmlconv
        fi
        chown -R htmlconv:htmlconv "$PROJECT_DIR"
        log_info "已创建htmlconv用户来运行服务"
    fi
    
    log_success "项目代码准备完成"
}

# 修复项目文件
fix_project_files() {
    log_info "修复项目文件..."
    
    # 创建修复后的browserPool.js
    cat > utils/browserPool.js << 'EOF'
const puppeteer = require('puppeteer');

class BrowserPool {
    constructor(maxBrowsers = 3) {
        this.maxBrowsers = maxBrowsers;
        this.browsers = [];
        this.inUseBrowsers = new Set();
    }

    async init() {
        console.log('正在初始化浏览器池...');
        
        for (let i = 0; i < this.maxBrowsers; i++) {
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--font-render-hinting=none',
                        '--disable-font-subpixel-positioning',
                        '--disable-lcd-text'
                    ]
                });
                
                this.browsers.push(browser);
                console.log(`浏览器 ${i + 1} 初始化完成`);
            } catch (error) {
                console.error(`浏览器 ${i + 1} 初始化失败:`, error);
            }
        }
        
        if (this.browsers.length === 0) {
            throw new Error('没有可用的浏览器实例');
        }
    }

    async getBrowser() {
        for (const browser of this.browsers) {
            if (!this.inUseBrowsers.has(browser)) {
                this.inUseBrowsers.add(browser);
                return browser;
            }
        }
        
        return new Promise((resolve) => {
            const checkForAvailable = () => {
                for (const browser of this.browsers) {
                    if (!this.inUseBrowsers.has(browser)) {
                        this.inUseBrowsers.add(browser);
                        resolve(browser);
                        return;
                    }
                }
                setTimeout(checkForAvailable, 100);
            };
            checkForAvailable();
        });
    }

    releaseBrowser(browser) {
        this.inUseBrowsers.delete(browser);
    }

    async close() {
        console.log('正在关闭浏览器池...');
        await Promise.all(
            this.browsers.map(browser => 
                browser.close().catch(err => 
                    console.error('关闭浏览器失败:', err)
                )
            )
        );
        this.browsers = [];
        this.inUseBrowsers.clear();
    }

    getStats() {
        return {
            total: this.browsers.length,
            available: this.browsers.length - this.inUseBrowsers.size,
            inUse: this.inUseBrowsers.size
        };
    }
}

module.exports = { BrowserPool };
EOF

    # 创建修复后的converter.js
    cat > utils/converter.js << 'EOF'
const fs = require('fs').promises;
const path = require('path');

async function convertHTMLToPNG(browser, htmlContent, options = {}) {
    const {
        width = 1920,
        height = 1080,
        scale = 2,
        fullPage = true,
        transparent = false
    } = options;

    const page = await browser.newPage();
    
    try {
        await page.setViewport({
            width: Math.floor(width),
            height: Math.floor(height),
            deviceScaleFactor: scale
        });

        // 添加中文字体CSS
        const fontCSS = `
        <style>
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        </style>
        `;

        const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${fontCSS}
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
        `;

        await page.setContent(fullHTML, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });

        await page.evaluateOnNewDocument(() => {
            document.fonts.ready.then(() => {
                console.log('字体加载完成');
            });
        });

        const screenshotOptions = {
            fullPage: fullPage,
            omitBackground: transparent,
            type: 'png'
        };

        if (!fullPage) {
            screenshotOptions.clip = {
                x: 0,
                y: 0,
                width: Math.floor(width),
                height: Math.floor(height)
            };
        }

        await page.waitForTimeout(1000);
        const buffer = await page.screenshot(screenshotOptions);
        
        return buffer;
        
    } finally {
        await page.close();
    }
}

async function splitIntoCards(browser, htmlContent, options = {}) {
    const {
        width = 1920,
        height = 1080,
        scale = 2,
        transparent = false
    } = options;

    const page = await browser.newPage();
    
    try {
        await page.setViewport({
            width: Math.floor(width),
            height: Math.floor(height),
            deviceScaleFactor: scale
        });

        const fontCSS = `
        <style>
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        </style>
        `;

        const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            ${fontCSS}
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
        `;

        await page.setContent(fullHTML, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });

        await page.waitForTimeout(1000);

        const cardElements = await page.$$('div[style*="width"], div[style*="height"], .card, [class*="card"]');
        
        if (cardElements.length === 0) {
            throw new Error('未找到卡片元素');
        }

        const cardBuffers = [];

        for (let i = 0; i < cardElements.length; i++) {
            try {
                const element = cardElements[i];
                const boundingBox = await element.boundingBox();
                
                if (boundingBox && boundingBox.width > 50 && boundingBox.height > 50) {
                    const buffer = await element.screenshot({
                        omitBackground: transparent,
                        type: 'png'
                    });
                    
                    cardBuffers.push(buffer);
                }
            } catch (error) {
                console.warn(`跳过卡片 ${i + 1}:`, error.message);
            }
        }

        return cardBuffers;
        
    } finally {
        await page.close();
    }
}

module.exports = {
    convertHTMLToPNG,
    splitIntoCards
};
EOF

    # 创建简化的config.js
    cat > config.js << 'EOF'
module.exports = {
    maxBrowsers: 3,
    timeout: 30000,
    port: process.env.PORT || 3003
};
EOF

    # 创建修复后的server.js（移除安全头部）
    cat > server_clean.js << 'EOF'
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { BrowserPool } = require('./utils/browserPool');
const { convertHTMLToPNG, splitIntoCards } = require('./utils/converter');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3003;

const browserPool = new BrowserPool(config.maxBrowsers);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/convert', async (req, res) => {
    console.log('收到转换请求:', req.body);
    
    try {
        const { 
            htmlContent, 
            width = 1920, 
            height = 1080, 
            scale = 2, 
            fullPage = true, 
            transparent = false, 
            splitCards = false 
        } = req.body;

        if (!htmlContent) {
            return res.status(400).json({ error: '请提供HTML内容' });
        }

        console.log('开始转换，参数:', { width, height, scale, fullPage, transparent, splitCards });

        const browser = await browserPool.getBrowser();
        
        try {
            if (splitCards) {
                const cards = await splitIntoCards(browser, htmlContent, { width, height, scale, transparent });
                
                if (cards.length === 0) {
                    return res.status(400).json({ error: '未检测到卡片元素' });
                }

                console.log(`生成了 ${cards.length} 张卡片`);

                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', 'attachment; filename="cards.zip"');

                const archive = archiver('zip', { zlib: { level: 9 } });
                archive.pipe(res);

                cards.forEach((cardBuffer, index) => {
                    archive.append(cardBuffer, { name: `card_${index + 1}.png` });
                });

                await archive.finalize();
            } else {
                const imageBuffer = await convertHTMLToPNG(browser, htmlContent, {
                    width, height, scale, fullPage, transparent
                });

                console.log(`生成图片，大小: ${imageBuffer.length} bytes`);

                res.setHeader('Content-Type', 'image/png');
                res.setHeader('Content-Disposition', 'attachment; filename="converted.png"');
                res.send(imageBuffer);
            }
        } finally {
            browserPool.releaseBrowser(browser);
        }
    } catch (error) {
        console.error('转换错误:', error);
        res.status(500).json({ error: '转换失败: ' + error.message });
    }
});

app.listen(PORT, '0.0.0.0', async () => {
    console.log('正在初始化浏览器池...');
    try {
        await browserPool.init();
        console.log('🚀 HTML转PNG服务已启动');
        console.log(`📡 服务地址: http://0.0.0.0:${PORT}`);
        console.log(`🔧 API端点: http://0.0.0.0:${PORT}/api/convert`);
        console.log(`💻 浏览器池大小: ${config.maxBrowsers}`);
    } catch (error) {
        console.error('初始化失败:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    console.log('正在关闭服务...');
    await browserPool.close();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});
EOF

    log_success "项目文件修复完成"
}

# 安装项目依赖
install_project_deps() {
    log_info "安装项目依赖..."
    
    # 设置npm缓存目录权限
    if [[ $EUID -eq 0 ]]; then
        # 如果是root用户，设置npm使用用户缓存
        export npm_config_cache=/tmp/.npm-cache-root
        mkdir -p /tmp/.npm-cache-root
    else
        # 修复npm缓存权限问题
        if [ -d "/www/server/nodejs/cache" ]; then
            $USE_SUDO chown -R $(id -u):$(id -g) "/www/server/nodejs/cache" 2>/dev/null || true
        fi
        
        # 设置用户级npm缓存
        npm config set cache ~/.npm-cache
        mkdir -p ~/.npm-cache
    fi
    
    # 清除缓存
    npm cache clean --force 2>/dev/null || true
    
    # 安装依赖，使用--omit=dev替代--production
    npm install --omit=dev
    
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
    pm2 delete html-to-png-converter 2>/dev/null || true
    
    # 如果是root用户，切换到htmlconv用户运行
    if [[ $EUID -eq 0 ]]; then
        su - htmlconv -c "cd $(pwd) && pm2 start server_clean.js --name html-to-png-converter"
        su - htmlconv -c "pm2 save"
        # 设置开机自启（root权限）
        pm2 startup | tail -n 1 | bash 2>/dev/null || log_warning "PM2开机自启设置失败"
    else
        # 使用修复后的server文件
        pm2 start server_clean.js --name html-to-png-converter
        pm2 save
        # 设置开机自启
        pm2 startup | tail -n 1 | $USE_SUDO bash 2>/dev/null || log_warning "PM2开机自启设置失败"
    fi
    
    # 等待服务启动
    sleep 3
    
    # 检查服务状态
    if pm2 list | grep -q "html-to-png-converter.*online"; then
        log_success "服务启动完成"
    else
        log_error "服务启动失败，请检查日志: pm2 logs html-to-png-converter"
        exit 1
    fi
}

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 询问域名
    echo -n "请输入域名（如：example.com，回车使用localhost）: "
    read DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    # 创建Nginx配置
# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 获取服务器IP地址
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
    
    # 询问域名
    echo -n "请输入域名（如：example.com，回车使用服务器IP $SERVER_IP）: "
    read DOMAIN
    DOMAIN=${DOMAIN:-$SERVER_IP}
    
    # 创建Nginx配置
    $USE_SUDO tee /etc/nginx/sites-available/html-to-png > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 静态文件处理
    location /static/ {
        alias $(pwd)/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API和Web界面代理
    location / {
        proxy_pass http://127.0.0.1:3003;
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
    $USE_SUDO ln -sf /etc/nginx/sites-available/html-to-png /etc/nginx/sites-enabled/
    
    # 测试配置
    $USE_SUDO nginx -t
    
    # 重启Nginx
    $USE_SUDO systemctl restart nginx
    $USE_SUDO systemctl enable nginx
    
    log_success "Nginx配置完成"
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
        log_success "防火墙配置完成"
    else
        log_warning "未找到ufw，请手动配置防火墙开放端口: 22, 80, 443, 3003"
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
    echo "🚀 直接访问: http://$DOMAIN:3003"
    echo "📊 服务状态: pm2 status"
    echo "📝 查看日志: pm2 logs html-to-png-converter"
    echo "🔄 重启服务: pm2 restart html-to-png-converter"
    echo
    echo "🔧 故障排除:"
    echo "   检查服务: curl http://localhost:3003/api/health"
    echo "   查看端口: netstat -tlnp | grep 3003"
    echo "   测试字体: fc-list :lang=zh"
    echo
    echo "💡 配置HTTPS:"
    echo "   $USE_SUDO apt install snapd"
    echo "   $USE_SUDO snap install --classic certbot"
    echo "   $USE_SUDO certbot --nginx -d $DOMAIN"
    echo
    echo "📖 更多信息请查看 DEPLOY.md"
}

# 主函数
main() {
    check_root
    check_os
    
    echo "准备部署HTML转PNG转换器到服务器..."
    echo "修复版本包含以下改进:"
    echo "- ✅ 修复npm镜像源问题"
    echo "- ✅ 自动安装中文字体"
    echo "- ✅ 修复权限问题"
    echo "- ✅ 移除安全头部冲突"
    echo "- ✅ 支持HTTP协议"
    echo "- ✅ 修复浏览器池代码"
    echo
    echo "按Enter继续，Ctrl+C取消..."
    read
    
    install_chinese_fonts
    install_nodejs
    install_dependencies
    install_pm2
    clone_project
    fix_project_files
    install_project_deps
    configure_env
    start_service
    configure_nginx
    configure_firewall
    
    show_result
}

# 执行主函数
main "$@" 