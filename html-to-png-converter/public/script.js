// HTML转PNG转换工具前端脚本
console.log('Script.js 加载成功');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 加载完成');
    
    const form = document.getElementById('convertForm');
    const convertBtn = document.getElementById('convertBtn');
    const splitCardsBtn = document.getElementById('splitCardsBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const result = document.getElementById('result');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    const cardResult = document.getElementById('cardResult');
    const cardInfo = document.getElementById('cardInfo');
    const downloadCardsBtn = document.getElementById('downloadCardsBtn');

    // 表单提交处理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('表单提交事件触发');
        await convertHtmlToPng(false);
    });

    // 普通转换按钮
    convertBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('转换按钮点击');
        await convertHtmlToPng(false);
    });

    // 卡片分割按钮处理
    splitCardsBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('分割卡片按钮点击');
        await convertHtmlToPng(true);
    });

    async function convertHtmlToPng(splitCards = false) {
        console.log('开始转换, splitCards:', splitCards);
        
        const htmlContentElement = document.getElementById('htmlContent');
        if (!htmlContentElement) {
            console.error('未找到htmlContent元素');
            showError('页面元素错误');
            return;
        }

        const htmlContentValue = htmlContentElement.value.trim();
        console.log('HTML内容长度:', htmlContentValue.length);
        
        if (!htmlContentValue) {
            showError('请输入HTML内容');
            return;
        }

        const formData = {
            htmlContent: htmlContentValue,
            width: parseInt(document.getElementById('width')?.value) || 1920,
            height: parseInt(document.getElementById('height')?.value) || 1080,
            scale: parseFloat(document.getElementById('scale')?.value) || 2,
            fullPage: document.getElementById('fullPage')?.checked || true,
            transparent: document.getElementById('transparent')?.checked || false,
            splitCards
        };

                 console.log('发送数据:', formData);
         
         if (splitCards) {
             await splitCards(formData);
         } else {
             await performNormalConvert(formData);
         }
     }

     // 普通转换函数
     async function performNormalConvert(formData) {
         const options = {
             html: formData.htmlContent,
             width: formData.width,
             height: formData.height,
             scale: formData.scale,
             fullPage: formData.fullPage,
             transparent: formData.transparent
         };

         await convertHtmlToPng(options);
     }

     // 卡片分割转换函数
     async function splitCards(formData) {
         const options = {
             html: formData.htmlContent,
             width: formData.width,
             height: formData.height,
             scale: formData.scale,
             outputFormat: 'zip'
         };

         try {
             showCardLoading();
             hideError();
             hideCardResult();

             const response = await fetch('/api/split-cards', {
                 method: 'POST',
                 headers: {
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify(options)
             });

             if (!response.ok) {
                 const errorData = await response.json();
                 throw new Error(errorData.error || '卡片分割失败');
             }

             const blob = await response.blob();
             const downloadUrl = URL.createObjectURL(blob);
             
             // 设置下载链接
             downloadCardsBtn.href = downloadUrl;
             
             // 获取卡片数量和处理时间
             const cardsCount = response.headers.get('X-Cards-Count');
             const processingTime = response.headers.get('X-Processing-Time');
             
             // 显示分割信息
             let infoText = '成功分割卡片！';
             if (cardsCount) {
                 infoText += `<br>📊 共生成 ${cardsCount} 张卡片图片`;
             }
             if (processingTime) {
                 infoText += `<br>⏱️ 处理时间: ${processingTime}ms`;
             }
             
             cardInfo.innerHTML = infoText;
             showCardResult();
             
             console.log(`卡片分割完成，生成 ${cardsCount} 张图片，耗时: ${processingTime}ms`);
             
         } catch (err) {
             console.error('卡片分割错误:', err);
             showError(err.message);
         } finally {
             hideCardLoading();
         }
           }

    // 转换函数
    async function convertHtmlToPng(options) {
        try {
            showLoading();
            hideError();
            hideResult();

            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '转换失败');
            }

            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // 显示结果
            resultImage.src = imageUrl;
            downloadBtn.href = imageUrl;
            
            // 获取处理时间
            const processingTime = response.headers.get('X-Processing-Time');
            if (processingTime) {
                console.log(`转换耗时: ${processingTime}ms`);
            }

            showResult();
            
        } catch (err) {
            console.error('转换错误:', err);
            showError(err.message);
        } finally {
            hideLoading();
        }
    }

    // 卡片分割函数
    async function splitCards(options) {
        try {
            showCardLoading();
            hideError();
            hideCardResult();

            const response = await fetch('/api/split-cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '卡片分割失败');
            }

            if (options.outputFormat === 'zip') {
                const blob = await response.blob();
                const downloadUrl = URL.createObjectURL(blob);
                
                // 设置下载链接
                downloadCardsBtn.href = downloadUrl;
                
                // 获取卡片数量和处理时间
                const cardsCount = response.headers.get('X-Cards-Count');
                const processingTime = response.headers.get('X-Processing-Time');
                
                // 显示分割信息
                let infoText = '成功分割卡片！';
                if (cardsCount) {
                    infoText += `<br>📊 共生成 ${cardsCount} 张卡片图片`;
                }
                if (processingTime) {
                    infoText += `<br>⏱️ 处理时间: ${processingTime}ms`;
                }
                
                cardInfo.innerHTML = infoText;
                showCardResult();
                
                console.log(`卡片分割完成，生成 ${cardsCount} 张图片，耗时: ${processingTime}ms`);
            }
            
        } catch (err) {
            console.error('卡片分割错误:', err);
            showError(err.message);
        } finally {
            hideCardLoading();
        }
    }

    // 显示/隐藏状态函数
    function showLoading() {
        loading.style.display = 'block';
        convertBtn.disabled = true;
        convertBtn.textContent = '转换中...';
    }

    function hideLoading() {
        loading.style.display = 'none';
        convertBtn.disabled = false;
        convertBtn.textContent = '🚀 开始转换';
    }

    function showError(message) {
        error.textContent = message;
        error.style.display = 'block';
    }

    function hideError() {
        error.style.display = 'none';
    }

    function showResult() {
        result.style.display = 'block';
    }

    function hideResult() {
        result.style.display = 'none';
    }

    // 卡片分割状态函数
    function showCardLoading() {
        loading.style.display = 'block';
        splitCardsBtn.disabled = true;
        splitCardsBtn.textContent = '分割中...';
        convertBtn.disabled = true;
    }

    function hideCardLoading() {
        loading.style.display = 'none';
        splitCardsBtn.disabled = false;
        splitCardsBtn.textContent = '🃏 分割卡片';
        convertBtn.disabled = false;
    }

    function showCardResult() {
        cardResult.style.display = 'block';
    }

    function hideCardResult() {
        cardResult.style.display = 'none';
    }

    // 示例HTML模板
    window.loadExample = function(type) {
        const examples = {
            card: `<!DOCTYPE html>
<html>
<head>
    <style>
        .business-card {
            width: 400px;
            height: 250px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            padding: 30px;
            color: white;
            font-family: 'Arial', sans-serif;
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .title { font-size: 16px; opacity: 0.9; margin-bottom: 20px; }
        .contact { font-size: 14px; line-height: 1.6; }
        .logo { position: absolute; top: 20px; right: 20px; width: 50px; height: 50px; background: rgba(255,255,255,0.2); border-radius: 50%; }
    </style>
</head>
<body>
    <div class="business-card">
        <div class="logo"></div>
        <div class="name">张三</div>
        <div class="title">高级产品经理</div>
        <div class="contact">
            📧 zhangsan@company.com<br>
            📱 138-0000-0000<br>
            🏢 北京市朝阳区xxx大厦
        </div>
    </div>
</body>
</html>`,

            chart: `<!DOCTYPE html>
<html>
<head>
    <style>
        .chart-container {
            width: 600px;
            height: 400px;
            background: white;
            padding: 30px;
            font-family: Arial, sans-serif;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .chart-title { text-align: center; font-size: 20px; margin-bottom: 30px; color: #333; }
        .bar { height: 30px; margin: 10px 0; border-radius: 5px; position: relative; }
        .bar-label { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: white; font-weight: bold; }
        .bar-value { position: absolute; right: -50px; top: 50%; transform: translateY(-50%); color: #666; }
        .bar1 { background: #4facfe; width: 85%; }
        .bar2 { background: #43e97b; width: 70%; }
        .bar3 { background: #fa709a; width: 90%; }
        .bar4 { background: #feca57; width: 60%; }
    </style>
</head>
<body>
    <div class="chart-container">
        <div class="chart-title">📊 2024年销售数据</div>
        <div class="bar bar1">
            <div class="bar-label">Q1</div>
            <div class="bar-value">85%</div>
        </div>
        <div class="bar bar2">
            <div class="bar-label">Q2</div>
            <div class="bar-value">70%</div>
        </div>
        <div class="bar bar3">
            <div class="bar-label">Q3</div>
            <div class="bar-value">90%</div>
        </div>
        <div class="bar bar4">
            <div class="bar-label">Q4</div>
            <div class="bar-value">60%</div>
        </div>
    </div>
</body>
</html>`,

            banner: `<!DOCTYPE html>
<html>
<head>
    <style>
        .banner {
            width: 800px;
            height: 300px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Arial', sans-serif;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .banner::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: rotate 10s linear infinite;
        }
        .content {
            z-index: 1;
            position: relative;
        }
        .title { font-size: 36px; font-weight: bold; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .subtitle { font-size: 18px; opacity: 0.9; }
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="banner">
        <div class="content">
            <div class="title">🎉 新品发布</div>
            <div class="subtitle">革命性产品，改变未来</div>
        </div>
    </div>
</body>
</html>`,

            multiCard: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>多卡片模板</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        navy: '#1B2951',
                        burgundy: '#800020',
                        forest: '#355E3B'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-100 p-4">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8 text-gray-800">卡片分割示例</h1>

        <!-- 卡片1 - Burgundy主题 -->
        <div class="mb-12">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden" style="width: 375px; height: 812px; margin: 0 auto;">
                <div class="relative h-full">
                    <div class="relative h-64 bg-gradient-to-br from-burgundy via-navy to-gray-700 overflow-hidden">
                        <div class="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="text-xs uppercase tracking-wider text-blue-200">BUSINESS CARD</div>
                                    <div class="text-xs text-blue-300">示例卡片 · 2025</div>
                                </div>
                                <div class="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs">标签1</div>
                            </div>
                            <div>
                                <h1 class="text-xl font-serif leading-tight mb-3">业务卡片 1</h1>
                                <p class="text-sm text-blue-200 mb-4">这是第一张卡片的描述</p>
                                <div class="flex items-center space-x-4 text-xs text-blue-300">
                                    <span>示例内容 2025-01-20</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="text-center">
                            <p class="text-gray-600">这里是卡片内容区域</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 卡片2 - Forest主题 -->
        <div class="mb-12">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden" style="width: 375px; height: 812px; margin: 0 auto;">
                <div class="relative h-full">
                    <div class="relative h-64 bg-gradient-to-br from-forest via-navy to-gray-600 overflow-hidden">
                        <div class="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="text-xs uppercase tracking-wider text-blue-200">BUSINESS CARD</div>
                                    <div class="text-xs text-blue-300">示例卡片 · 2025</div>
                                </div>
                                <div class="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs">标签2</div>
                            </div>
                            <div>
                                <h1 class="text-xl font-serif leading-tight mb-3">业务卡片 2</h1>
                                <p class="text-sm text-blue-200 mb-4">这是第二张卡片的描述</p>
                                <div class="flex items-center space-x-4 text-xs text-blue-300">
                                    <span>示例内容 2025-01-20</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="text-center">
                            <p class="text-gray-600">这里是卡片内容区域</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 卡片3 - Navy主题 -->
        <div class="mb-12">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden" style="width: 375px; height: 812px; margin: 0 auto;">
                <div class="relative h-full">
                    <div class="relative h-64 bg-gradient-to-br from-navy via-blue-800 to-gray-700 overflow-hidden">
                        <div class="relative z-10 p-6 h-full flex flex-col justify-between text-white">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="text-xs uppercase tracking-wider text-blue-200">BUSINESS CARD</div>
                                    <div class="text-xs text-blue-300">示例卡片 · 2025</div>
                                </div>
                                <div class="bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs">标签3</div>
                            </div>
                            <div>
                                <h1 class="text-xl font-serif leading-tight mb-3">业务卡片 3</h1>
                                <p class="text-sm text-blue-200 mb-4">这是第三张卡片的描述</p>
                                <div class="flex items-center space-x-4 text-xs text-blue-300">
                                    <span>示例内容 2025-01-20</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 space-y-6">
                        <div class="text-center">
                            <p class="text-gray-600">这里是卡片内容区域</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`
        };

        if (examples[type]) {
            document.getElementById('htmlContent').value = examples[type];
        }
    };

    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            form.dispatchEvent(new Event('submit'));
        }
    });

    // 自动保存HTML内容到localStorage
    const htmlTextarea = document.getElementById('htmlContent');
    htmlTextarea.addEventListener('input', function() {
        localStorage.setItem('htmlContent', this.value);
    });

    // 页面加载时恢复HTML内容
    const savedHtml = localStorage.getItem('htmlContent');
    if (savedHtml) {
        htmlTextarea.value = savedHtml;
    }
});