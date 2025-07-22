#!/bin/bash

# HTML转PNG转换器自动部署脚本 v2.0
# 修复版本 - 包含所有已知问题的解决方案

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

# 全局变量
PROJECT_DIR="/www/wwwroot/tools-all-for-me-main"
DOMAIN="${DOMAIN:-localhost}"
USE_SUDO=""

# 检测是否需要sudo
check_root() {
    if [ "$EUID" -ne 0 ]; then
        if command -v sudo >/dev/null 2>&1; then
            USE_SUDO="sudo"
            log_warning "检测到非root用户，将使用sudo执行特权命令"
        else
            log_error "需要root权限或sudo命令"
            exit 1
        fi
    fi
}

# 检测操作系统
check_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        log_info "检测到操作系统: $OS"
    else
        log_error "无法检测操作系统"
        exit 1
    fi
}

# 配置npm镜像源
configure_npm() {
    log_info "配置npm镜像源..."
    
    # 设置npm镜像源为npmmirror.com
    npm config set registry https://registry.npmmirror.com
    
    # 验证配置
    local current_registry=$(npm config get registry)
    log_success "npm镜像源已设置为: $current_registry"
}

# 安装中文字体
install_chinese_fonts() {
    log_info "安装中文字体..."
    
    case $OS in
        ubuntu|debian)
            $USE_SUDO apt-get update -qq
            $USE_SUDO apt-get install -y fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                $USE_SUDO dnf install -y google-noto-cjk-fonts wqy-zenhei-fonts wqy-microhei-fonts
            else
                $USE_SUDO yum install -y google-noto-cjk-fonts wqy-zenhei-fonts wqy-microhei-fonts
            fi
            ;;
        *)
            log_warning "未知操作系统，请手动安装中文字体"
            ;;
    esac
    
    # 更新字体缓存
    fc-cache -fv >/dev/null 2>&1 || true
    
    log_success "中文字体安装完成"
}

# 安装Node.js
install_nodejs() {
    log_info "检查Node.js安装..."
    
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version)
        log_success "Node.js已安装: $node_version"
        configure_npm
        return
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
        *)
            log_error "不支持的操作系统: $OS"
            exit 1
            ;;
    esac
    
    configure_npm
    log_success "Node.js安装完成"
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    case $OS in
        ubuntu|debian)
            $USE_SUDO apt-get update -qq
            $USE_SUDO apt-get install -y \
                curl wget git unzip \
                nginx \
                libgtk-3-0 libgbm-dev libxss1 libasound2 \
                fonts-liberation libappindicator3-1 \
                xdg-utils
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                $USE_SUDO dnf install -y curl wget git unzip nginx \
                    gtk3 libXScrnSaver alsa-lib \
                    liberation-fonts
            else
                $USE_SUDO yum install -y curl wget git unzip nginx \
                    gtk3 libXScrnSaver alsa-lib \
                    liberation-fonts
            fi
            ;;
    esac
    
    log_success "系统依赖安装完成"
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

# 克隆项目
clone_project() {
    log_info "克隆项目..."
    
    # 创建目录
    $USE_SUDO mkdir -p $(dirname $PROJECT_DIR)
    
    # 如果目录已存在，先备份
    if [ -d "$PROJECT_DIR" ]; then
        log_warning "项目目录已存在，创建备份..."
        $USE_SUDO mv "$PROJECT_DIR" "${PROJECT_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 克隆最新代码
    $USE_SUDO git clone https://github.com/cihebi2/tools-all-for-me.git "$PROJECT_DIR"
    
    # 设置权限
    $USE_SUDO chown -R $(whoami):$(whoami) "$PROJECT_DIR" 2>/dev/null || true
    
    cd "$PROJECT_DIR/html-to-png-converter"
    log_success "项目克隆完成"
}

# 修复项目文件
fix_project_files() {
    log_info "修复项目文件..."
    
    # 创建目录
    mkdir -p utils uploads
    
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
        console.log('初始化浏览器池...');
        
        for (let i = 0; i < this.maxBrowsers; i++) {
            try {
                const browser = await puppeteer.launch({
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-gpu',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-extensions',
                        '--disable-default-apps',
                        '--font-render-hinting=none',
                        '--disable-font-subpixel-positioning'
                    ]
                });
                
                this.browsers.push(browser);
                console.log(`浏览器 ${i + 1} 初始化成功`);
            } catch (error) {
                console.error(`浏览器 ${i + 1} 初始化失败:`, error);
            }
        }
        
        console.log(`浏览器池初始化完成，共 ${this.browsers.length} 个浏览器实例`);
    }

    async getBrowser() {
        for (const browser of this.browsers) {
            if (!this.inUseBrowsers.has(browser)) {
                this.inUseBrowsers.add(browser);
                return browser;
            }
        }
        
        // 如果没有可用浏览器，等待
        return new Promise((resolve) => {
            const checkBrowser = () => {
                for (const browser of this.browsers) {
                    if (!this.inUseBrowsers.has(browser)) {
                        this.inUseBrowsers.add(browser);
                        resolve(browser);
                        return;
                    }
                }
                setTimeout(checkBrowser, 100);
            };
            checkBrowser();
        });
    }

    releaseBrowser(browser) {
        this.inUseBrowsers.delete(browser);
    }

    async close() {
        console.log('关闭浏览器池...');
        for (const browser of this.browsers) {
            try {
                await browser.close();
            } catch (error) {
                console.error('关闭浏览器失败:', error);
            }
        }
        this.browsers = [];
        this.inUseBrowsers.clear();
    }

    getStatus() {
        return {
            total: this.browsers.length,
            available: this.browsers.length - this.inUseBrowsers.size,
            inUse: this.inUseBrowsers.size
        };
    }
}

module.exports = { BrowserPool };
EOF

    # 创建修复后的converter.js（包含Font Awesome支持）
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

        // 添加中文字体CSS和Font Awesome图标支持
        const fontCSS = `
        <style>
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        /* Font Awesome 图标字体声明 */
        .fa, .fas, .far, .fal, .fad, .fab {
            font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 5 Free", "Font Awesome 5 Pro", "FontAwesome" !important;
            font-weight: 900;
            font-style: normal;
            font-variant: normal;
            text-rendering: auto;
            line-height: 1;
        }
        
        .far {
            font-weight: 400;
        }
        
        .fab {
            font-family: "Font Awesome 6 Brands", "Font Awesome 5 Brands" !important;
            font-weight: 400;
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

        // 等待Font Awesome图标字体加载完成
        await page.waitForFunction(() => {
            return document.fonts.status === 'loaded';
        }, { timeout: 10000 }).catch(() => {
            console.log('字体加载超时，继续执行');
        });

        // 额外等待时间确保图标渲染
        await page.waitForTimeout(2000);

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
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        /* Font Awesome 图标字体声明 */
        .fa, .fas, .far, .fal, .fad, .fab {
            font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 5 Free", "Font Awesome 5 Pro", "FontAwesome" !important;
            font-weight: 900;
            font-style: normal;
            font-variant: normal;
            text-rendering: auto;
            line-height: 1;
        }
        
        .far {
            font-weight: 400;
        }
        
        .fab {
            font-family: "Font Awesome 6 Brands", "Font Awesome 5 Brands" !important;
            font-weight: 400;
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

        // 等待Font Awesome图标字体加载完成
        await page.waitForFunction(() => {
            return document.fonts.status === 'loaded';
        }, { timeout: 10000 }).catch(() => {
            console.log('字体加载超时，继续执行');
        });

        // 额外等待时间确保图标渲染
        await page.waitForTimeout(2000);

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
let browserPool;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 上传配置
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    const status = browserPool ? browserPool.getStatus() : { error: 'Browser pool not initialized' };
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        browserPool: status
    });
});

// HTML转PNG接口
app.post('/api/convert', upload.single('html'), async (req, res) => {
    try {
        let htmlContent;
        
        if (req.file) {
            htmlContent = fs.readFileSync(req.file.path, 'utf8');
            fs.unlinkSync(req.file.path);
        } else if (req.body.html) {
            htmlContent = req.body.html;
        } else {
            return res.status(400).json({ error: '请提供HTML内容' });
        }

        const options = {
            width: parseInt(req.body.width) || 1920,
            height: parseInt(req.body.height) || 1080,
            scale: parseFloat(req.body.scale) || 2,
            fullPage: req.body.fullPage !== 'false',
            transparent: req.body.transparent === 'true'
        };

        const browser = await browserPool.getBrowser();
        
        try {
            if (req.body.mode === 'cards') {
                const cardBuffers = await splitIntoCards(browser, htmlContent, options);
                
                if (cardBuffers.length === 0) {
                    return res.status(400).json({ error: '未找到可转换的卡片' });
                }

                if (cardBuffers.length === 1) {
                    res.set({
                        'Content-Type': 'image/png',
                        'Content-Disposition': 'attachment; filename="card.png"'
                    });
                    res.send(cardBuffers[0]);
                } else {
                    const archive = archiver('zip');
                    res.set({
                        'Content-Type': 'application/zip',
                        'Content-Disposition': 'attachment; filename="cards.zip"'
                    });
                    
                    archive.pipe(res);
                    
                    cardBuffers.forEach((buffer, index) => {
                        archive.append(buffer, { name: `card_${index + 1}.png` });
                    });
                    
                    await archive.finalize();
                }
            } else {
                const buffer = await convertHTMLToPNG(browser, htmlContent, options);
                
                res.set({
                    'Content-Type': 'image/png',
                    'Content-Disposition': 'attachment; filename="screenshot.png"'
                });
                res.send(buffer);
            }
        } finally {
            browserPool.releaseBrowser(browser);
        }
        
    } catch (error) {
        console.error('转换错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
async function startServer() {
    try {
        browserPool = new BrowserPool(config.maxBrowsers);
        await browserPool.init();
        
        app.listen(config.port, () => {
            console.log(`服务器运行在端口 ${config.port}`);
            console.log(`健康检查: http://localhost:${config.port}/api/health`);
        });
        
    } catch (error) {
        console.error('启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
process.on('SIGTERM', async () => {
    console.log('收到SIGTERM信号，正在关闭...');
    if (browserPool) {
        await browserPool.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('收到SIGINT信号，正在关闭...');
    if (browserPool) {
        await browserPool.close();
    }
    process.exit(0);
});

startServer();
EOF

    log_success "项目文件修复完成"
}

# 安装项目依赖
install_project_deps() {
    log_info "安装项目依赖..."
    
    # 创建package.json如果不存在
    if [ ! -f "package.json" ]; then
        cat > package.json << 'EOF'
{
  "name": "html-to-png-converter",
  "version": "2.0.0",
  "description": "HTML转PNG转换器",
  "main": "server_clean.js",
  "scripts": {
    "start": "node server_clean.js",
    "dev": "nodemon server_clean.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "puppeteer": "^21.0.0",
    "archiver": "^6.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOF
    fi
    
    npm install
    log_success "项目依赖安装完成"
}

# 配置环境变量
configure_env() {
    log_info "配置环境变量..."
    
    cat > .env << EOF
NODE_ENV=production
PORT=3003
MAX_BROWSERS=3
TIMEOUT=30000
EOF
    
    log_success "环境变量配置完成"
}

# 启动服务
start_service() {
    log_info "启动服务..."
    
    # 停止现有服务
    pm2 delete html-to-png-converter 2>/dev/null || true
    
    # 启动新服务
    pm2 start server_clean.js --name "html-to-png-converter" --watch --ignore-watch="node_modules uploads"
    
    # 保存PM2配置
    pm2 save
    pm2 startup | tail -1 | $USE_SUDO bash 2>/dev/null || true
    
    # 等待服务启动
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

# 配置Nginx
configure_nginx() {
    log_info "配置Nginx..."
    
    # 创建Nginx配置
    cat > /tmp/html-to-png.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
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
    
    # 复制配置文件
    $USE_SUDO mv /tmp/html-to-png.conf /etc/nginx/sites-available/html-to-png
    
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
    echo "======================================"
    echo "  HTML转PNG转换器 - 自动部署脚本"
    echo "  修复版本 v2.0"
    echo "======================================"
    echo
    
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
    echo "- ✅ 添加Font Awesome图标支持"
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