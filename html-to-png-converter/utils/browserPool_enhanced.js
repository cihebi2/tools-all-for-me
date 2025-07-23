const puppeteer = require('puppeteer');

class BrowserPool {
    constructor(maxBrowsers = 3) {
        this.maxBrowsers = maxBrowsers;
        this.browsers = [];
        this.inUseBrowsers = new Set();
    }

    async init() {
        console.log('初始化增强浏览器池...');
        
        for (let i = 0; i < this.maxBrowsers; i++) {
            try {
                const browser = await puppeteer.launch({
                    headless: 'new', // 使用新的无头模式
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
                        '--disable-extensions',
                        '--disable-default-apps',
                        '--disable-translate',
                        '--disable-sync',
                        '--disable-background-timer-throttling',
                        '--disable-renderer-backgrounding',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-client-side-phishing-detection',
                        '--disable-popup-blocking',
                        '--disable-hang-monitor',
                        '--disable-prompt-on-repost',
                        '--disable-domain-reliability',
                        '--no-default-browser-check',
                        '--no-first-run',
                        '--disable-infobars',
                        '--disable-notifications',
                        
                        // 字体和图像渲染增强
                        '--font-render-hinting=none',
                        '--disable-font-subpixel-positioning',
                        '--disable-lcd-text',
                        '--enable-font-antialiasing',
                        '--force-color-profile=srgb',
                        '--disable-accelerated-video-decode',
                        '--disable-background-media-suspend',
                        
                        // 网络和安全设置
                        '--allow-running-insecure-content',
                        '--disable-component-extensions-with-background-pages',
                        '--disable-ipc-flooding-protection',
                        '--enable-features=NetworkService,NetworkServiceLogging',
                        '--disable-features=TranslateUI',
                        
                        // 内存优化
                        '--memory-pressure-off',
                        '--max_old_space_size=4096',
                        
                        // 时区和语言设置
                        '--lang=zh-CN',
                        '--accept-lang=zh-CN,zh,en',
                        
                        // 设置用户代理
                        '--user-agent=Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    ],
                    ignoreDefaultArgs: ['--disable-extensions'],
                    timeout: 30000
                });
                
                // 设置默认超时
                browser.setDefaultTimeout = (timeout) => {
                    browser._defaultTimeout = timeout;
                };
                browser.setDefaultTimeout(60000);
                
                this.browsers.push(browser);
                console.log(`浏览器 ${i + 1} 初始化成功`);
            } catch (error) {
                console.error(`浏览器 ${i + 1} 初始化失败:`, error);
            }
        }
        
        if (this.browsers.length === 0) {
            throw new Error('没有可用的浏览器实例');
        }
        
        console.log(`浏览器池初始化完成，共 ${this.browsers.length} 个浏览器实例`);
    }

    async getBrowser() {
        // 查找可用的浏览器
        for (const browser of this.browsers) {
            if (!this.inUseBrowsers.has(browser)) {
                // 检查浏览器是否仍然有效
                try {
                    await browser.version();
                    this.inUseBrowsers.add(browser);
                    return browser;
                } catch (error) {
                    console.warn('浏览器实例无效，将其移除:', error.message);
                    await this.removeBrowser(browser);
                    continue;
                }
            }
        }
        
        // 如果没有可用的浏览器，等待一个变为可用或创建新的
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timeout = 30000; // 30秒超时
            
            const checkForAvailable = async () => {
                // 检查是否超时
                if (Date.now() - startTime > timeout) {
                    reject(new Error('获取浏览器实例超时'));
                    return;
                }
                
                // 查找可用的浏览器
                for (const browser of this.browsers) {
                    if (!this.inUseBrowsers.has(browser)) {
                        try {
                            await browser.version();
                            this.inUseBrowsers.add(browser);
                            resolve(browser);
                            return;
                        } catch (error) {
                            await this.removeBrowser(browser);
                            continue;
                        }
                    }
                }
                
                // 如果还没有可用的，尝试创建新的浏览器实例
                if (this.browsers.length < this.maxBrowsers) {
                    try {
                        await this.createNewBrowser();
                        // 递归调用检查
                        setTimeout(checkForAvailable, 100);
                        return;
                    } catch (error) {
                        console.error('创建新浏览器实例失败:', error);
                    }
                }
                
                // 100ms后再检查
                setTimeout(checkForAvailable, 100);
            };
            
            checkForAvailable();
        });
    }

    async createNewBrowser() {
        console.log('创建新的浏览器实例...');
        try {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--font-render-hinting=none',
                    '--disable-font-subpixel-positioning',
                    '--lang=zh-CN',
                    '--accept-lang=zh-CN,zh,en'
                ],
                timeout: 30000
            });
            
            browser.setDefaultTimeout = (timeout) => {
                browser._defaultTimeout = timeout;
            };
            browser.setDefaultTimeout(60000);
            
            this.browsers.push(browser);
            console.log('新浏览器实例创建成功');
        } catch (error) {
            console.error('创建浏览器实例失败:', error.message);
            throw error;
        }
    }

    async removeBrowser(browser) {
        try {
            await browser.close();
        } catch (error) {
            console.error('关闭浏览器失败:', error);
        }
        
        const index = this.browsers.indexOf(browser);
        if (index > -1) {
            this.browsers.splice(index, 1);
        }
        this.inUseBrowsers.delete(browser);
    }

    releaseBrowser(browser) {
        this.inUseBrowsers.delete(browser);
    }

    async close() {
        console.log('关闭浏览器池...');
        const closePromises = this.browsers.map(browser => 
            browser.close().catch(err => 
                console.error('关闭浏览器失败:', err)
            )
        );
        
        await Promise.all(closePromises);
        this.browsers = [];
        this.inUseBrowsers.clear();
        console.log('浏览器池已关闭');
    }

    getStatus() {
        return {
            total: this.browsers.length,
            available: this.browsers.length - this.inUseBrowsers.size,
            inUse: this.inUseBrowsers.size,
            maxBrowsers: this.maxBrowsers
        };
    }

    // 健康检查
    async healthCheck() {
        const results = [];
        for (let i = 0; i < this.browsers.length; i++) {
            const browser = this.browsers[i];
            try {
                const version = await browser.version();
                results.push({
                    index: i,
                    status: 'healthy',
                    version: version,
                    inUse: this.inUseBrowsers.has(browser)
                });
            } catch (error) {
                results.push({
                    index: i,
                    status: 'unhealthy',
                    error: error.message,
                    inUse: this.inUseBrowsers.has(browser)
                });
            }
        }
        return results;
    }
}

module.exports = { BrowserPool };