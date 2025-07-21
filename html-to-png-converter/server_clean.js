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

// 初始化浏览器池
const browserPool = new BrowserPool(config.maxBrowsers);

// 基础中间件，不设置任何安全头部
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 转换API
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

                // 创建ZIP文件
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

// 启动服务器
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

// 优雅关闭
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
