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
        // 设置页面尺寸
        await page.setViewport({
            width: Math.floor(width),
            height: Math.floor(height),
            deviceScaleFactor: scale
        });

        // 添加中文字体CSS
        const fontCSS = `
        <style>
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        </style>
        `;

        // 组合HTML内容
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

        // 设置HTML内容
        await page.setContent(fullHTML, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 30000
        });

        // 等待字体加载
        await page.evaluateOnNewDocument(() => {
            document.fonts.ready.then(() => {
                console.log('字体加载完成');
            });
        });

        // 截图选项
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

        // 等待一下确保渲染完成
        await page.waitForTimeout(1000);

        // 截图
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

        // 添加中文字体CSS
        const fontCSS = `
        <style>
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
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

        // 等待字体加载
        await page.waitForTimeout(1000);

        // 查找卡片元素
        const cardElements = await page.$$('div[style*="width"], div[style*="height"], .card, [class*="card"]');
        
        if (cardElements.length === 0) {
            throw new Error('未找到卡片元素');
        }

        const cardBuffers = [];

        for (let i = 0; i < cardElements.length; i++) {
            try {
                const element = cardElements[i];
                
                // 获取元素的边界框
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