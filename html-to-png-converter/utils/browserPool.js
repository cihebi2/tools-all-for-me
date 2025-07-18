// 浏览器池管理
const puppeteer = require('puppeteer');
const config = require('../config');
const logger = require('./logger');

class BrowserPool {
  constructor() {
    this.browsers = [];
    this.maxBrowsers = config.puppeteer.maxBrowsers;
    this.launchOptions = config.puppeteer.launchOptions;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    logger.info('正在初始化浏览器池...');
    
    for (let i = 0; i < this.maxBrowsers; i++) {
      try {
        const browser = await puppeteer.launch(this.launchOptions);
        this.browsers.push(browser);
        logger.info(`浏览器 ${i + 1}/${this.maxBrowsers} 初始化完成`);
      } catch (error) {
        logger.error(`浏览器 ${i + 1} 初始化失败:`, error.message);
      }
    }
    
    this.initialized = true;
    logger.info(`浏览器池初始化完成，可用浏览器: ${this.browsers.length}`);
  }

  getBrowser() {
    if (this.browsers.length === 0) {
      throw new Error('没有可用的浏览器实例');
    }
    
    return this.browsers.shift();
  }

  returnBrowser(browser) {
    if (!browser) return;
    
    if (this.browsers.length < this.maxBrowsers) {
      this.browsers.push(browser);
    } else {
      browser.close().catch(err => {
        logger.error('关闭多余浏览器实例失败:', err.message);
      });
    }
  }

  async createTemporaryBrowser() {
    logger.warn('创建临时浏览器实例');
    return await puppeteer.launch(this.launchOptions);
  }

  getStats() {
    return {
      available: this.browsers.length,
      max: this.maxBrowsers,
      initialized: this.initialized
    };
  }

  async close() {
    logger.info('正在关闭浏览器池...');
    
    const closePromises = this.browsers.map(browser => 
      browser.close().catch(err => {
        logger.error('关闭浏览器失败:', err.message);
      })
    );
    
    await Promise.all(closePromises);
    this.browsers = [];
    this.initialized = false;
    
    logger.info('浏览器池已关闭');
  }

  async healthCheck() {
    const healthyBrowsers = [];
    
    for (const browser of this.browsers) {
      try {
        const pages = await browser.pages();
        if (pages.length > 0) {
          healthyBrowsers.push(browser);
        }
      } catch (error) {
        logger.warn('发现不健康的浏览器实例:', error.message);
        browser.close().catch(() => {});
      }
    }
    
    this.browsers = healthyBrowsers;
    
    // 如果健康的浏览器数量不足，创建新的
    whileserPool();Broww xports = nee.eodul

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