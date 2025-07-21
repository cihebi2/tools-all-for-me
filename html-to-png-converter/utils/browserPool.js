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
                        // 字体相关参数
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
        // 查找可用的浏览器
        for (const browser of this.browsers) {
            if (!this.inUseBrowsers.has(browser)) {
                this.inUseBrowsers.add(browser);
                return browser;
            }
        }
        
        // 如果没有可用的浏览器，等待一个变为可用
        return new Promise((resolve) => {
            const checkForAvailable = () => {
                for (const browser of this.browsers) {
                    if (!this.inUseBrowsers.has(browser)) {
                        this.inUseBrowsers.add(browser);
                        resolve(browser);
                        return;
                    }
                }
                // 如果还没有可用的，100ms后再检查
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

m
}  }
.getStats();turn this   
    re }
    }
     eak;
    br
     r.message); erro览器实例失败:',新浏or('创建ger.err
        logror) {catch (er
      } 补充池');o('创建新的浏览器实例logger.inf      ser);
  .push(browhis.browsers
        t;chOptions).laun.launch(this puppeteer = awaitt browser      cons try {
  
     ) {rowsers.maxBisth < thers.leng (this.brows