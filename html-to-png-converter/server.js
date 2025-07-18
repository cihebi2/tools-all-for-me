const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// 安全中间件
app.use(helmet());
app.use(cors());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 解析JSON和表单数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static('public'));

// 浏览器实例池
let browserPool = [];
const MAX_BROWSERS = 3;

// 初始化浏览器池
async function initBrowserPool() {
  console.log('正在初始化浏览器池...');
  for (let i = 0; i < MAX_BROWSERS; i++) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      browserPool.push(browser);
      console.log(`浏览器 ${i + 1} 初始化完成`);
    } catch (error) {
      console.error(`浏览器 ${i + 1} 初始化失败:`, error);
    }
  }
}

// 获取可用浏览器
function getBrowser() {
  return browserPool.shift();
}

// 归还浏览器
function returnBrowser(browser) {
  if (browserPool.length < MAX_BROWSERS) {
    browserPool.push(browser);
  } else {
    browser.close();
  }
}

// HTML转PNG核心函数
async function htmlToPng(htmlContent, options = {}) {
  const browser = getBrowser();
  if (!browser) {
    throw new Error('没有可用的浏览器实例');
  }

  try {
    const page = await browser.newPage();
    
    // 设置视口和缩放
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080,
      deviceScaleFactor: options.scale || 2
    });

    // 设置HTML内容
    await page.setContent(htmlContent, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    // 等待所有图片加载完成
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images, img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = img.onerror = resolve;
          });
        })
      );
    });

    // 截图配置
    const screenshotOptions = {
      type: 'png',
      fullPage: options.fullPage !== false,
      omitBackground: options.transparent || false
    };

    // 如果指定了裁剪区域
    if (options.clip) {
      screenshotOptions.clip = options.clip;
      screenshotOptions.fullPage = false;
    }

    const screenshot = await page.screenshot(screenshotOptions);
    
    await page.close();
    returnBrowser(browser);
    
    return screenshot;
  } catch (error) {
    returnBrowser(browser);
    throw error;
  }
}

// API路由
app.post('/api/convert', async (req, res) => {
  try {
    const { 
      html, 
      width = 1920, 
      height = 1080, 
      scale = 2,
      fullPage = true,
      transparent = false,
      clip
    } = req.body;

    if (!html) {
      return res.status(400).json({ 
        success: false, 
        error: 'HTML内容不能为空' 
      });
    }

    console.log(`开始转换HTML，尺寸: ${width}x${height}, 缩放: ${scale}x`);
    
    const startTime = Date.now();
    const pngBuffer = await htmlToPng(html, {
      width: parseInt(width),
      height: parseInt(height),
      scale: parseFloat(scale),
      fullPage,
      transparent,
      clip
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`转换完成，耗时: ${processingTime}ms, 图片大小: ${pngBuffer.length} bytes`);

    res.set({
      'Content-Type': 'image/png',
      'Content-Length': pngBuffer.length,
      'X-Processing-Time': processingTime
    });

    res.send(pngBuffer);
  } catch (error) {
    console.error('转换失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'running',
    browserPool: browserPool.length,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 根路径重定向到主页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('正在关闭服务器...');
  
  // 关闭所有浏览器实例
  for (const browser of browserPool) {
    await browser.close();
  }
  
  process.exit(0);
});

// 启动服务器
async function startServer() {
  try {
    await initBrowserPool();
    
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 HTML转PNG服务已启动`);
      console.log(`📡 服务地址: http://localhost:${PORT}`);
      console.log(`🔧 API端点: http://localhost:${PORT}/api/convert`);
      console.log(`💻 浏览器池大小: ${browserPool.length}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`❌ 端口 ${PORT} 已被占用，尝试使用其他端口...`);
        // 尝试其他端口
        const newPort = PORT + 1;
        console.log(`🔄 尝试端口 ${newPort}...`);
        app.listen(newPort, '127.0.0.1', () => {
          console.log(`🚀 HTML转PNG服务已启动`);
          console.log(`📡 服务地址: http://localhost:${newPort}`);
          console.log(`🔧 API端点: http://localhost:${newPort}/api/convert`);
          console.log(`💻 浏览器池大小: ${browserPool.length}`);
        });
      } else if (err.code === 'EACCES') {
        console.log(`❌ 权限被拒绝，尝试使用端口 8080...`);
        app.listen(8080, '127.0.0.1', () => {
          console.log(`🚀 HTML转PNG服务已启动`);
          console.log(`📡 服务地址: http://localhost:8080`);
          console.log(`🔧 API端点: http://localhost:8080/api/convert`);
          console.log(`💻 浏览器池大小: ${browserPool.length}`);
        });
      } else {
        console.error('服务器启动失败:', err);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();