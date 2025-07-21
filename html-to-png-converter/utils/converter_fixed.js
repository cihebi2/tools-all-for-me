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

        // 添加中文字体和图标字体CSS
        const fontCSS = `
        <style>
        /* 引入Font Awesome图标 */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        
        /* 中文字体设置 */
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        /* 确保图标正常显示 */
        .fa, .fas, .far, .fal, .fab {
            font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", "FontAwesome" !important;
            font-weight: 900;
        }
        .fa-solid, .fas {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 900;
        }
        .fa-regular, .far {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 400;
        }
        .fa-light, .fal {
            font-family: "Font Awesome 6 Pro" !important;
            font-weight: 300;
        }
        .fa-brands, .fab {
            font-family: "Font Awesome 6 Brands" !important;
            font-weight: 400;
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

        // 等待字体和图标加载
        await page.evaluateOnNewDocument(() => {
            document.fonts.ready.then(() => {
                console.log('字体加载完成');
            });
        });

        // 等待更长时间确保图标字体完全加载
        await page.waitForTimeout(3000);

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

        // 添加中文字体和图标字体CSS
        const fontCSS = `
        <style>
        /* 引入Font Awesome图标 */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        
        /* 中文字体设置 */
        * {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        body {
            font-family: "Noto Sans CJK SC", "WenQuanYi Zen Hei", "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        /* 确保图标正常显示 */
        .fa, .fas, .far, .fal, .fab {
            font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", "FontAwesome" !important;
            font-weight: 900;
        }
        .fa-solid, .fas {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 900;
        }
        .fa-regular, .far {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 400;
        }
        .fa-light, .fal {
            font-family: "Font Awesome 6 Pro" !important;
            font-weight: 300;
        }
        .fa-brands, .fab {
            font-family: "Font Awesome 6 Brands" !important;
            font-weight: 400;
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

        // 等待字体和图标加载
        await page.waitForTimeout(3000);

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
