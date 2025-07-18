// HTML转PNG转换工具前端脚本

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('convertForm');
    const convertBtn = document.getElementById('convertBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const result = document.getElementById('result');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');

    // 表单提交处理
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const htmlContent = document.getElementById('htmlContent').value.trim();
        if (!htmlContent) {
            showError('请输入HTML内容');
            return;
        }

        const options = {
            html: htmlContent,
            width: parseInt(document.getElementById('width').value),
            height: parseInt(document.getElementById('height').value),
            scale: parseFloat(document.getElementById('scale').value),
            fullPage: document.getElementById('fullPage').checked,
            transparent: document.getElementById('transparent').checked
        };

        await convertHtmlToPng(options);
    });

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