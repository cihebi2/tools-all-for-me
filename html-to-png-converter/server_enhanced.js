const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { BrowserPool } = require('./utils/browserPool_enhanced');
const { convertHTMLToPNG, splitIntoCards } = require('./utils/converter_enhanced');
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

// 增强的健康检查端点
app.get('/api/health', async (req, res) => {
    try {
        const status = browserPool ? browserPool.getStatus() : { error: 'Browser pool not initialized' };
        const healthCheck = browserPool ? await browserPool.healthCheck() : [];
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            browserPool: status,
            healthDetails: healthCheck,
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// 增强的HTML转PNG接口
app.post('/api/convert', upload.single('html'), async (req, res) => {
    const startTime = Date.now();
    let browser;
    
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

        console.log(`开始转换 - 模式: ${req.body.mode || 'normal'}, 尺寸: ${options.width}x${options.height}, 缩放: ${options.scale}`);

        browser = await browserPool.getBrowser();
        
        try {
            if (req.body.mode === 'cards') {
                console.log('执行卡片分割转换');
                const cardBuffers = await splitIntoCards(browser, htmlContent, options);
                
                if (cardBuffers.length === 0) {
                    return res.status(400).json({ error: '未找到可转换的卡片' });
                }

                if (cardBuffers.length === 1) {
                    const processingTime = Date.now() - startTime;
                    res.set({
                        'Content-Type': 'image/png',
                        'Content-Disposition': 'attachment; filename="card.png"',
                        'X-Processing-Time': processingTime.toString(),
                        'X-Cards-Count': '1'
                    });
                    res.send(cardBuffers[0]);
                    console.log(`单卡片转换完成，耗时: ${processingTime}ms`);
                } else {
                    const archive = archiver('zip', {
                        zlib: { level: 9 } // 最大压缩
                    });
                    
                    const processingTime = Date.now() - startTime;
                    res.set({
                        'Content-Type': 'application/zip',
                        'Content-Disposition': 'attachment; filename="cards.zip"',
                        'X-Processing-Time': processingTime.toString(),
                        'X-Cards-Count': cardBuffers.length.toString()
                    });
                    
                    archive.pipe(res);
                    
                    cardBuffers.forEach((buffer, index) => {
                        archive.append(buffer, { name: `card_${index + 1}.png` });
                    });
                    
                    await archive.finalize();
                    console.log(`多卡片转换完成，生成 ${cardBuffers.length} 张图片，耗时: ${processingTime}ms`);
                }
            } else {
                console.log('执行普通转换');
                const buffer = await convertHTMLToPNG(browser, htmlContent, options);
                
                const processingTime = Date.now() - startTime;
                res.set({
                    'Content-Type': 'image/png',
                    'Content-Disposition': 'attachment; filename="screenshot.png"',
                    'X-Processing-Time': processingTime.toString(),
                    'X-Image-Size': buffer.length.toString()
                });
                res.send(buffer);
                console.log(`普通转换完成，图片大小: ${(buffer.length / 1024).toFixed(2)}KB，耗时: ${processingTime}ms`);
            }
        } finally {
            if (browser) {
                browserPool.releaseBrowser(browser);
            }
        }
        
    } catch (error) {
        console.error('转换错误:', error);
        
        if (browser) {
            browserPool.releaseBrowser(browser);
        }
        
        // 根据错误类型返回不同的状态码
        let statusCode = 500;
        let errorMessage = error.message;
        
        if (error.message.includes('timeout') || error.message.includes('超时')) {
            statusCode = 408;
            errorMessage = '转换超时，请尝试简化HTML内容或增加等待时间';
        } else if (error.message.includes('navigation') || error.message.includes('网络')) {
            statusCode = 502;
            errorMessage = '网络错误，请检查外部资源是否可访问';
        } else if (error.message.includes('memory') || error.message.includes('内存')) {
            statusCode = 507;
            errorMessage = '内存不足，请尝试降低图片尺寸或缩放比例';
        }
        
        res.status(statusCode).json({
            error: errorMessage,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime
        });
    }
});

// 浏览器池状态端点
app.get('/api/browsers/status', async (req, res) => {
    try {
        const status = browserPool.getStatus();
        const healthCheck = await browserPool.healthCheck();
        
        res.json({
            status: 'ok',
            browserPool: status,
            healthDetails: healthCheck,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 系统信息端点
app.get('/api/system/info', (req, res) => {
    res.json({
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        timestamp: new Date().toISOString()
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('未处理的错误:', error);
    res.status(500).json({
        error: '服务器内部错误',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
async function startServer() {
    try {
        console.log('正在启动增强版HTML转PNG转换器...');
        
        browserPool = new BrowserPool(config.maxBrowsers || 3);
        await browserPool.init();
        
        const port = config.port || 3003;
        const server = app.listen(port, '0.0.0.0', () => {
            console.log(`✅ 服务器运行在端口 ${port}`);
            console.log(`🌐 本地访问: http://localhost:${port}`);
            console.log(`🔍 健康检查: http://localhost:${port}/api/health`);
            console.log(`📊 浏览器状态: http://localhost:${port}/api/browsers/status`);
            console.log(`💻 系统信息: http://localhost:${port}/api/system/info`);
        });

        // 设置服务器超时
        server.timeout = 120000; // 2分钟
        server.keepAliveTimeout = 65000; // 65秒
        server.headersTimeout = 66000; // 66秒
        
        // 定期清理临时文件
        setInterval(() => {
            const uploadsDir = path.join(__dirname, 'uploads');
            if (fs.existsSync(uploadsDir)) {
                fs.readdir(uploadsDir, (err, files) => {
                    if (err) return;
                    
                    files.forEach(file => {
                        const filePath = path.join(uploadsDir, file);
                        fs.stat(filePath, (err, stats) => {
                            if (err) return;
                            
                            // 删除1小时前的临时文件
                            if (Date.now() - stats.mtime.getTime() > 3600000) {
                                fs.unlink(filePath, (err) => {
                                    if (!err) console.log(`清理临时文件: ${file}`);
                                });
                            }
                        });
                    });
                });
            }
        }, 600000); // 每10分钟清理一次
        
    } catch (error) {
        console.error('❌ 启动失败:', error);
        process.exit(1);
    }
}

// 优雅关闭
const gracefulShutdown = async (signal) => {
    console.log(`\n📥 收到${signal}信号，正在优雅关闭...`);
    
    if (browserPool) {
        console.log('🔄 关闭浏览器池...');
        await browserPool.close();
    }
    
    console.log('✅ 服务器已安全关闭');
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();