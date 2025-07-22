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

// 静态文件服务
app.use(express.static('public'));

// 上传配置
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 根路径重定向到主页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
        
        app.listen(config.port, '0.0.0.0', () => {
            console.log(`服务器运行在端口 ${config.port}`);
            console.log(`访问地址: http://0.0.0.0:${config.port}`);
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