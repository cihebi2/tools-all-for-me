// 配置文件
module.exports = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3002,
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },

  // Puppeteer配置
  puppeteer: {
    // 浏览器池大小
    maxBrowsers: parseInt(process.env.MAX_BROWSERS) || 3,
    
    // 浏览器启动参数
    launchOptions: {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ]
    },

    // 页面配置
    pageOptions: {
      timeout: 30000,
      waitUntil: ['networkidle0', 'domcontentloaded']
    },

    // 默认截图配置
    defaultScreenshotOptions: {
      type: 'png',
      fullPage: true,
      omitBackground: false
    }
  },

  // 速率限制配置
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15分钟
    max: process.env.RATE_LIMIT_MAX || 100, // 每个IP最大请求数
    message: '请求过于频繁，请稍后再试'
  },

  // 文件上传配置
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['text/html', 'text/plain']
  },

  // 转换限制
  conversion: {
    maxWidth: 4000,
    maxHeight: 4000,
    maxScale: 3,
    maxHtmlSize: 5 * 1024 * 1024 // 5MB
  },

  // 缓存配置
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: 60 * 60 * 1000, // 1小时
    maxSize: 100
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined'
  }
};