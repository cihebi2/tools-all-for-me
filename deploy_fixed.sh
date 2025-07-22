#!/bin/bash

# HTML转PNG转换器自动部署脚本
# 修复版本 v2.1 - 包含Font Awesome图标支持
# 作者: GitHub Copilot
# 日期: 2025-07-21

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
NODE_VERSION="18"
PROJECT_DIR="/www/wwwroot/tools-all-for-me"
SERVICE_NAME="html-to-png-converter"
PORT="3003"
DOMAIN="your-domain.com"

echo -e "${BLUE}======================================"
echo "  HTML转PNG转换器 - 自动部署脚本"
echo "  修复版本 v2.1"
echo -e "======================================${NC}"
echo

# 检查root权限
check_root() {
    if [[ $EUID -eq 0 ]]; then
        USE_SUDO=""
        echo -e "${GREEN}✓ 检测到root权限${NC}"
    else
        USE_SUDO="sudo"
        echo -e "${YELLOW}⚠ 使用sudo权限${NC}"
        if ! command -v sudo &> /dev/null; then
            echo -e "${RED}❌ sudo未安装，请先安装sudo或使用root用户运行${NC}"
            exit 1
        fi
    fi
}

# 检测操作系统
check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        echo -e "${GREEN}✓ 检测到操作系统: $PRETTY_NAME${NC}"
        
        case $OS in
            ubuntu|debian)
                PKG_MANAGER="apt"
                PKG_UPDATE="$USE_SUDO apt update"
                PKG_INSTALL="$USE_SUDO apt install -y"
                ;;
            centos|rhel|fedora)
                if command -v dnf &> /dev/null; then
                    PKG_MANAGER="dnf"
                    PKG_UPDATE="$USE_SUDO dnf check-update || true"
                    PKG_INSTALL="$USE_SUDO dnf install -y"
                else
                    PKG_MANAGER="yum"
                    PKG_UPDATE="$USE_SUDO yum check-update || true"
                    PKG_INSTALL="$USE_SUDO yum install -y"
                fi
                ;;
            *)
                echo -e "${YELLOW}⚠ 未知操作系统，假设使用apt包管理器${NC}"
                PKG_MANAGER="apt"
                PKG_UPDATE="$USE_SUDO apt update"
                PKG_INSTALL="$USE_SUDO apt install -y"
                ;;
        esac
    else
        echo -e "${YELLOW}⚠ 无法检测操作系统，假设使用Ubuntu/Debian${NC}"
        PKG_MANAGER="apt"
        PKG_UPDATE="$USE_SUDO apt update"
        PKG_INSTALL="$USE_SUDO apt install -y"
    fi
}

# 配置npm镜像源
configure_npm() {
    echo -e "${BLUE}🔧 配置npm镜像源...${NC}"
    
    # 设置npm镜像为npmmirror（原淘宝镜像）
    npm config set registry https://registry.npmmirror.com/
    
    # 验证配置
    local current_registry=$(npm config get registry)
    echo "当前npm镜像源: $current_registry"
    
    if [[ "$current_registry" == *"npmmirror"* ]]; then
        echo -e "${GREEN}✓ npm镜像源配置成功${NC}"
    else
        echo -e "${YELLOW}⚠ npm镜像源配置可能失败，继续使用默认源${NC}"
    fi
}

# 安装中文字体
install_chinese_fonts() {
    echo -e "${BLUE}📝 安装中文字体...${NC}"
    
    case $PKG_MANAGER in
        apt)
            $PKG_UPDATE
            $PKG_INSTALL fonts-noto-cjk fonts-wqy-zenhei fonts-wqy-microhei
            ;;
        dnf|yum)
            $PKG_UPDATE
            $PKG_INSTALL google-noto-sans-cjk-fonts wqy-zenhei-fonts wqy-microhei-fonts
            ;;
    esac
    
    # 刷新字体缓存
    fc-cache -fv 2>/dev/null || true
    
    echo -e "${GREEN}✓ 中文字体安装完成${NC}"
}

# 安装Node.js
install_nodejs() {
    echo -e "${BLUE}📦 安装Node.js...${NC}"
    
    if command -v node &> /dev/null; then
        local current_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [[ $current_version -ge 16 ]]; then
            echo -e "${GREEN}✓ Node.js已安装 (版本: $(node -v))${NC}"
            configure_npm
            return
        fi
    fi
    
    # 安装NodeSource仓库
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | $USE_SUDO -E bash -
    $PKG_INSTALL nodejs
    
    # 配置npm
    configure_npm
    
    echo -e "${GREEN}✓ Node.js安装完成 (版本: $(node -v))${NC}"
}

# 安装系统依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装系统依赖...${NC}"
    
    case $PKG_MANAGER in
        apt)
            $PKG_UPDATE
            $PKG_INSTALL curl wget git nginx build-essential \
                        libgtk-3-0 libgbm-dev libxss1 libasound2 \
                        fonts-liberation libappindicator3-1 xdg-utils
            ;;
        dnf|yum)
            $PKG_UPDATE
            $PKG_INSTALL curl wget git nginx gcc-c++ make \
                        gtk3 gbm libXScrnSaver alsa-lib \
                        liberation-fonts libappindicator-gtk3 xdg-utils
            ;;
    esac
    
    echo -e "${GREEN}✓ 系统依赖安装完成${NC}"
}

# 安装PM2
install_pm2() {
    echo -e "${BLUE}🚀 安装PM2...${NC}"
    
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}✓ PM2已安装${NC}"
        return
    fi
    
    npm install -g pm2
    
    echo -e "${GREEN}✓ PM2安装完成${NC}"
}

# 克隆项目
clone_project() {
    echo -e "${BLUE}📥 下载项目文件...${NC}"
    
    # 创建项目目录
    $USE_SUDO mkdir -p /www/wwwroot
    cd /www/wwwroot
    
    # 如果项目目录已存在，先备份
    if [[ -d "$PROJECT_DIR" ]]; then
        echo "项目目录已存在，创建备份..."
        $USE_SUDO mv "$PROJECT_DIR" "${PROJECT_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 克隆项目
    $USE_SUDO git clone https://github.com/cihebi2/tools-all-for-me.git
    $USE_SUDO chown -R $(whoami):$(whoami) tools-all-for-me
    
    echo -e "${GREEN}✓ 项目文件下载完成${NC}"
}

# 修复项目文件
fix_project_files() {
    echo -e "${BLUE}🔧 修复项目文件...${NC}"
    
    cd $PROJECT_DIR/html-to-png-converter
    
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
                    '--font-render-hinting=none'
                ]
            });
            this.browsers.push(browser);
        }
        console.log(`浏览器池初始化完成，创建了 ${this.browsers.length} 个浏览器实例`);
    }

    async getBrowser() {
        const availableBrowser = this.browsers.find(browser => !this.inUseBrowsers.has(browser));
        if (availableBrowser) {
            this.inUseBrowsers.add(availableBrowser);
            return availableBrowser;
        }
        
        // 如果没有可用浏览器，等待
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const browser = this.browsers.find(b => !this.inUseBrowsers.has(b));
                if (browser) {
                    this.inUseBrowsers.add(browser);
                    clearInterval(checkInterval);
                    resolve(browser);
                }
            }, 100);
        });
    }

    releaseBrowser(browser) {
        this.inUseBrowsers.delete(browser);
    }

    async destroy() {
        console.log('关闭浏览器池...');
        await Promise.all(this.browsers.map(browser => browser.close()));
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
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }
});

let browserPool;

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// 初始化浏览器池
async function initBrowserPool() {
    try {
        browserPool = new BrowserPool(config.maxBrowsers);
        await browserPool.init();
        console.log('浏览器池初始化成功');
    } catch (error) {
        console.error('浏览器池初始化失败:', error);
        process.exit(1);
    }
}

// 健康检查
app.get('/health', (req, res) => {
    const stats = browserPool ? browserPool.getStats() : { error: '浏览器池未初始化' };
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        browserPool: stats
    });
});

// 主要的转换API
app.post('/api/convert', async (req, res) => {
    let browser;
    
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
            return res.status(400).json({ error: 'HTML内容不能为空' });
        }

        browser = await browserPool.getBrowser();
        
        let result;
        if (splitCards) {
            const cardBuffers = await splitIntoCards(browser, htmlContent, {
                width: parseInt(width),
                height: parseInt(height),
                scale: parseFloat(scale),
                transparent: transparent === true || transparent === 'true'
            });
            
            if (cardBuffers.length === 0) {
                throw new Error('未找到可截取的卡片元素');
            }
            
            result = cardBuffers.map((buffer, index) => ({
                filename: `card_${index + 1}.png`,
                data: buffer.toString('base64')
            }));
        } else {
            const buffer = await convertHTMLToPNG(browser, htmlContent, {
                width: parseInt(width),
                height: parseInt(height),
                scale: parseFloat(scale),
                fullPage: fullPage === true || fullPage === 'true',
                transparent: transparent === true || transparent === 'true'
            });
            
            result = [{
                filename: 'converted.png',
                data: buffer.toString('base64')
            }];
        }

        res.json({
            success: true,
            files: result,
            count: result.length
        });

    } catch (error) {
        console.error('转换错误:', error);
        res.status(500).json({
            error: '转换失败',
            message: error.message
        });
    } finally {
        if (browser) {
            browserPool.releaseBrowser(browser);
        }
    }
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('收到退出信号，正在关闭服务器...');
    if (browserPool) {
        await browserPool.destroy();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('收到终止信号，正在关闭服务器...');
    if (browserPool) {
        await browserPool.destroy();
    }
    process.exit(0);
});

// 启动服务器
const PORT = config.port;
app.listen(PORT, async () => {
    console.log(`HTML转PNG转换器服务器运行在端口 ${PORT}`);
    await initBrowserPool();
});
EOF

    echo -e "${GREEN}✓ 项目文件修复完成${NC}"
}

# 安装项目依赖
install_project_deps() {
    echo -e "${BLUE}📦 安装项目依赖...${NC}"
    
    cd $PROJECT_DIR/html-to-png-converter
    
    # 确保package.json存在
    if [[ ! -f package.json ]]; then
        cat > package.json << 'EOF'
{
  "name": "html-to-png-converter",
  "version": "2.1.0",
  "description": "HTML转PNG转换器 - 支持中文字体和Font Awesome图标",
  "main": "server_clean.js",
  "scripts": {
    "start": "node server_clean.js",
    "dev": "nodemon server_clean.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "puppeteer": "^21.0.0",
    "archiver": "^6.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["html", "png", "converter", "puppeteer", "chinese", "font-awesome"],
  "author": "GitHub Copilot",
  "license": "MIT"
}
EOF
    fi
    
    # 安装依赖
    npm install
    
    # 创建必要目录
    mkdir -p uploads
    
    echo -e "${GREEN}✓ 项目依赖安装完成${NC}"
}

# 配置环境变量
configure_env() {
    echo -e "${BLUE}⚙️ 配置环境变量...${NC}"
    
    cd $PROJECT_DIR/html-to-png-converter
    
    cat > .env << EOF
NODE_ENV=production
PORT=${PORT}
MAX_BROWSERS=3
TIMEOUT=30000
EOF
    
    echo -e "${GREEN}✓ 环境变量配置完成${NC}"
}

# 启动服务
start_service() {
    echo -e "${BLUE}🚀 启动服务...${NC}"
    
    cd $PROJECT_DIR/html-to-png-converter
    
    # 停止现有服务
    pm2 delete html-to-png-converter 2>/dev/null || true
    
    # 启动新服务
    pm2 start server_clean.js --name "html-to-png-converter" \
        --watch --ignore-watch="node_modules uploads" \
        --max-memory-restart 500M \
        --time
    
    # 保存PM2配置
    pm2 save
    pm2 startup | grep "sudo env" | bash || true
    
    echo -e "${GREEN}✓ 服务启动完成${NC}"
}

# 配置Nginx
configure_nginx() {
    echo -e "${BLUE}🌐 配置Nginx...${NC}"
    
    # 创建Nginx配置
    cat > /tmp/html-to-png.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:$PORT;
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
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF
    
    $USE_SUDO mv /tmp/html-to-png.conf /etc/nginx/sites-available/
    $USE_SUDO ln -sf /etc/nginx/sites-available/html-to-png.conf /etc/nginx/sites-enabled/
    
    # 测试并重载Nginx
    $USE_SUDO nginx -t && $USE_SUDO systemctl reload nginx
    
    echo -e "${GREEN}✓ Nginx配置完成${NC}"
}

# 配置防火墙
configure_firewall() {
    echo -e "${BLUE}🔥 配置防火墙...${NC}"
    
    if command -v ufw &> /dev/null; then
        $USE_SUDO ufw allow 80/tcp
        $USE_SUDO ufw allow 443/tcp
        $USE_SUDO ufw allow $PORT/tcp
        echo -e "${GREEN}✓ UFW防火墙规则已添加${NC}"
    elif command -v firewall-cmd &> /dev/null; then
        $USE_SUDO firewall-cmd --permanent --add-service=http
        $USE_SUDO firewall-cmd --permanent --add-service=https
        $USE_SUDO firewall-cmd --permanent --add-port=$PORT/tcp
        $USE_SUDO firewall-cmd --reload
        echo -e "${GREEN}✓ FirewallD规则已添加${NC}"
    else
        echo -e "${YELLOW}⚠ 未检测到防火墙，请手动开放端口 80, 443, $PORT${NC}"
    fi
}

# 显示结果
show_result() {
    echo
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo
    echo -e "${BLUE}服务信息:${NC}"
    echo "  服务名称: $SERVICE_NAME"
    echo "  运行端口: $PORT"
    echo "  项目目录: $PROJECT_DIR/html-to-png-converter"
    echo
    echo -e "${BLUE}访问地址:${NC}"
    echo "  本地访问: http://localhost:$PORT/health"
    echo "  域名访问: http://$DOMAIN/health"
    echo
    echo -e "${BLUE}常用命令:${NC}"
    echo "  查看状态: pm2 status $SERVICE_NAME"
    echo "  查看日志: pm2 logs $SERVICE_NAME"
    echo "  重启服务: pm2 restart $SERVICE_NAME"
    echo "  停止服务: pm2 stop $SERVICE_NAME"
    echo
    echo -e "${BLUE}API使用:${NC}"
    echo "  POST http://$DOMAIN/api/convert"
    echo "  参数: { htmlContent, width, height, scale, fullPage, transparent, splitCards }"
    echo
    echo -e "${BLUE}Font Awesome支持:${NC}"
    echo "  ✅ Font Awesome 6.x"
    echo "  ✅ Font Awesome 5.x"
    echo "  ✅ Font Awesome 4.x"
    echo "  ✅ 中文字体显示"
    echo
    echo -e "${YELLOW}💡 下一步操作:${NC}"
    echo "   测试服务: curl http://localhost:$PORT/health"
    echo "   测试字体: fc-list :lang=zh"
    echo
    echo -e "${YELLOW}💡 配置HTTPS:${NC}"
    echo "   $USE_SUDO apt install snapd"
    echo "   $USE_SUDO snap install --classic certbot"
    echo "   $USE_SUDO certbot --nginx -d $DOMAIN"
    echo
    echo -e "${BLUE}📖 更多信息请查看 FONT_AWESOME_FIX.md${NC}"
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
    echo "- ✅ 支持Font Awesome图标"
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
