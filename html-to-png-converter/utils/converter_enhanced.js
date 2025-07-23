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
        // 启用拦截器以处理外部资源
        await page.setRequestInterception(true);
        
        page.on('request', (request) => {
            const url = request.url();
            console.log(`加载资源: ${url}`);
            
            // 允许所有请求，包括外部图片和字体
            if (url.includes('font') || url.includes('css') || url.includes('image') || 
                url.includes('.png') || url.includes('.jpg') || url.includes('.svg') ||
                url.includes('aliyuncs.com') || url.includes('cdnjs.cloudflare.com')) {
                request.continue();
            } else {
                request.continue();
            }
        });

        // 设置页面尺寸
        await page.setViewport({
            width: Math.floor(width),
            height: Math.floor(height),
            deviceScaleFactor: scale
        });

        // 增强的字体和图标CSS
        const fontCSS = `
        <style>
        /* 引入多个Font Awesome版本确保兼容性 */
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
        
        /* 引入中文字体 */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100;300;400;500;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@200;300;400;500;600;700;900&display=swap');
        
        /* 字体回退策略 */
        * {
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "WenQuanYi Zen Hei", "WenQuanYi Micro Hei", "SimHei", "黑体", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
        }
        
        body {
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "WenQuanYi Zen Hei", "WenQuanYi Micro Hei", "SimHei", "黑体", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        /* SVG文本元素字体设置 */
        text {
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "WenQuanYi Zen Hei", "WenQuanYi Micro Hei", "SimHei", "黑体", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
        }
        
        /* Font Awesome图标字体设置 */
        .fa, .fas, .far, .fal, .fab, .fad {
            font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 5 Free", "Font Awesome 5 Pro", "FontAwesome" !important;
            font-style: normal !important;
            font-variant: normal !important;
            text-rendering: auto !important;
            line-height: 1 !important;
            display: inline-block !important;
        }
        
        .fas, .fa-solid {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 900 !important;
        }
        
        .far, .fa-regular {
            font-family: "Font Awesome 6 Free" !important;
            font-weight: 400 !important;
        }
        
        .fal, .fa-light {
            font-family: "Font Awesome 6 Pro" !important;
            font-weight: 300 !important;
        }
        
        .fab, .fa-brands {
            font-family: "Font Awesome 6 Brands" !important;
            font-weight: 400 !important;
        }
        
        /* 确保emoji正常显示 */
        .emoji {
            font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", "EmojiOne Mozilla", "Twemoji Mozilla", "Segoe UI Symbol", "Noto Emoji" !important;
        }
        
        /* 外部图片加载失败时的占位符 */
        image {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
        }
        
        /* 确保SVG正确渲染 */
        svg {
            shape-rendering: geometricPrecision;
            text-rendering: geometricPrecision;
        }
        </style>
        `;

        // 组合HTML内容
        const fullHTML = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${fontCSS}
            <script>
                // 预加载字体
                document.fonts.ready.then(() => {
                    console.log('所有字体加载完成');
                    window.fontsReady = true;
                });
                
                // 处理图片加载错误
                document.addEventListener('DOMContentLoaded', function() {
                    const images = document.querySelectorAll('image');
                    images.forEach(img => {
                        img.addEventListener('error', function() {
                            console.log('图片加载失败:', this.getAttribute('href'));
                        });
                    });
                });
            </script>
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
        `;

        // 设置HTML内容，等待所有资源加载
        await page.setContent(fullHTML, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 60000 // 增加超时时间
        });

        // 等待字体加载完成
        await page.waitForFunction(() => {
            return document.fonts.status === 'loaded' || window.fontsReady === true;
        }, { timeout: 10000 }).catch(() => {
            console.log('字体加载超时，继续执行');
        });

        // 等待外部图片加载
        await page.evaluate(() => {
            return new Promise((resolve) => {
                const images = document.querySelectorAll('image');
                let loadedCount = 0;
                let totalImages = images.length;
                
                if (totalImages === 0) {
                    resolve();
                    return;
                }
                
                const checkComplete = () => {
                    loadedCount++;
                    if (loadedCount >= totalImages) {
                        resolve();
                    }
                };
                
                images.forEach(img => {
                    const href = img.getAttribute('href');
                    if (href) {
                        const testImg = new Image();
                        testImg.onload = checkComplete;
                        testImg.onerror = checkComplete; // 即使失败也继续
                        testImg.src = href;
                    } else {
                        checkComplete();
                    }
                });
                
                // 最多等待5秒
                setTimeout(resolve, 5000);
            });
        });

        // 额外等待时间确保所有内容完全渲染
        await page.waitForTimeout(3000);

        // 截图选项
        const screenshotOptions = {
            fullPage: fullPage,
            omitBackground: transparent,
            type: 'png',
            quality: 100 // 最高质量
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
        
    } catch (error) {
        console.error('转换过程中出错:', error);
        throw error;
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
        // 启用拦截器
        await page.setRequestInterception(true);
        
        page.on('request', (request) => {
            request.continue();
        });

        await page.setViewport({
            width: Math.floor(width),
            height: Math.floor(height),
            deviceScaleFactor: scale
        });

        // 使用相同的增强CSS
        const fontCSS = `
        <style>
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100;300;400;500;700;900&display=swap');
        
        * {
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "WenQuanYi Zen Hei", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        body {
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "WenQuanYi Zen Hei", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        text {
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "WenQuanYi Zen Hei", "SimHei", "黑体", Arial, sans-serif !important;
        }
        
        .fa, .fas, .far, .fal, .fab {
            font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", "FontAwesome" !important;
            font-weight: 900;
            font-style: normal;
        }
        </style>
        `;

        const fullHTML = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${fontCSS}
        </head>
        <body>
            ${htmlContent}
        </body>
        </html>
        `;

        await page.setContent(fullHTML, {
            waitUntil: ['load', 'networkidle0'],
            timeout: 60000
        });

        // 等待字体和图标加载
        await page.waitForFunction(() => {
            return document.fonts.status === 'loaded';
        }, { timeout: 10000 }).catch(() => {
            console.log('字体加载超时，继续执行');
        });

        await page.waitForTimeout(3000);

        // 查找卡片元素，使用更灵活的选择器
        const cardElements = await page.$$('div[style*="width"], div[style*="height"], .card, [class*="card"], rect[fill*="url"], g');
        
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
                        type: 'png',
                        quality: 100
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