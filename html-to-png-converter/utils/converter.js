// HTML转PNG转换器
const browserPool = require('./browserPool');
const logger = require('./logger');
const config = require('../config');

class HtmlToPngConverter {
  constructor() {
    this.defaultOptions = config.puppeteer.defaultScreenshotOptions;
    this.pageOptions = config.puppeteer.pageOptions;
  }

  async convert(htmlContent, options = {}) {
    const startTime = Date.now();
    let browser = null;
    let page = null;

    try {
      // 验证输入
      this.validateInput(htmlContent, options);

      // 获取浏览器实例
      browser = browserPool.getBrowser();
      if (!browser) {
        logger.warn('浏览器池为空，创建临时实例');
        browser = await browserPool.createTemporaryBrowser();
      }

      // 创建页面
      page = await browser.newPage();

      // 设置视口
      await page.setViewport({
        width: options.width || 1920,
        height: options.height || 1080,
        deviceScaleFactor: options.scale || 2
      });

      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // 设置HTML内容
      await page.setContent(htmlContent, this.pageOptions);

      // 等待图片加载
      await this.waitForImages(page);

      // 等待自定义延迟
      if (options.delay) {
        await page.waitForTimeout(options.delay);
      }

      // 截图配置
      const screenshotOptions = {
        ...this.defaultOptions,
        type: 'png',
        fullPage: options.fullPage !== false,
        omitBackground: options.transparent || false
      };

      // 如果指定了裁剪区域
      if (options.clip) {
        screenshotOptions.clip = options.clip;
        screenshotOptions.fullPage = false;
      }

      // 执行截图
      const screenshot = await page.screenshot(screenshotOptions);

      const processingTime = Date.now() - startTime;
      logger.info(`转换完成，耗时: ${processingTime}ms, 图片大小: ${screenshot.length} bytes`);

      return {
        buffer: screenshot,
        processingTime,
        size: screenshot.length
      };

    } catch (error) {
      logger.error('转换失败:', error.message);
      throw error;
    } finally {
      // 清理资源
      if (page) {
        await page.close().catch(err => {
          logger.error('关闭页面失败:', err.message);
        });
      }

      if (browser) {
        browserPool.returnBrowser(browser);
      }
    }
  }

  validateInput(htmlContent, options) {
    if (!htmlContent || typeof htmlContent !== 'string') {
      throw new Error('HTML内容不能为空');
    }

    if (htmlContent.length > config.conversion.maxHtmlSize) {
      throw new Error(`HTML内容过大，最大支持 ${config.conversion.maxHtmlSize / 1024 / 1024}MB`);
    }

    if (options.width && (options.width < 100 || options.width > config.conversion.maxWidth)) {
      throw new Error(`宽度必须在 100-${config.conversion.maxWidth} 之间`);
    }

    if (options.height && (options.height < 100 || options.height > config.conversion.maxHeight)) {
      throw new Error(`高度必须在 100-${config.conversion.maxHeight} 之间`);
    }

    if (options.scale && (options.scale < 0.1 || options.scale > config.conversion.maxScale)) {
      throw new Error(`缩放倍数必须在 0.1-${config.conversion.maxScale} 之间`);
    }
  }

  async waitForImages(page) {
    try {
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images, img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = resolve; // 即使图片加载失败也继续
              setTimeout(resolve, 5000); // 5秒超时
            });
          })
        );
      });
    } catch (error) {
      logger.warn('等待图片加verter();tmlToPngConw Hxports = ne
module.e
}

    }
  }
      });serBrowser(browol.returnerPo   brows    ser) {
  (brow   if      }
   ) => {});
tch((ca.close().wait page    a   (page) {
      if inally {
    } fw error;
 thro
      age);ess.mrorer换失败:', ('URL转er.error    logg
  error) {catch (}     };

  ength
    nshot.lsize: scree        ,
singTime    proceshot,
    r: screensbuffe{
        turn     re}ms`);

  Timesing${procesURL转换完成，耗时: info(`     logger.e;
 artTim.now() - stTime = Dateocessingconst pr

      tOptions);creenshoenshot(sage.screait p= awhot ensst scre  con          };

t || false
ansparen: options.trackground  omitB
      = false,ge !=ns.fullPatioPage: op    fullg',
    : 'pnype    t   
 s = {hotOptionnst screens

      co
      });: 30000outtime        d'],
tloade'domcontendle0', orki['netwil:  waitUnt, {
       ge.goto(urlwait pa   a);

   
      }le || 2ptions.scaFactor: oScalece       devi80,
 ght || 10eions.hheight: opti
        || 1920,th .widdth: options
        wiViewport({ait page.set      aw();

genewPaait browser.e = aw  pag

    
      }Browser();ryempora.createTserPoolait browrowser = aw     b
   rowser) { (!b   if;
   r()wsePool.getBroer = browserbrows {
          try
ll;
nulet page = ull;
    wser = n
    let broow();e = Date.ntTimstarst {
    conons = {}) l, optitFromUrl(urconver

  async 
  }}
    .message);ror载时出错:', er