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
        await performConversion(false);
    });

    // 普通转换按钮
    convertBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('转换按钮点击');
        await performConversion(false);
    });

    // 卡片分割按钮处理
    splitCardsBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('分割卡片按钮点击');
        await performConversion(true);
    });

    async function performConversion(splitCards = false) {
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

        // 创建FormData对象
        const formData = new FormData();
        formData.append('html', htmlContentValue);
        formData.append('width', document.getElementById('width')?.value || '1920');
        formData.append('height', document.getElementById('height')?.value || '1080');
        formData.append('scale', document.getElementById('scale')?.value || '2');
        formData.append('fullPage', document.getElementById('fullPage')?.checked || true);
        formData.append('transparent', document.getElementById('transparent')?.checked || false);
        
        if (splitCards) {
            formData.append('mode', 'cards');
        }

        console.log('准备发送请求');
        
        try {
            if (splitCards) {
                showCardLoading();
                hideError();
                hideCardResult();
            } else {
                showLoading();
                hideError();
                hideResult();
            }

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            console.log('收到响应，状态:', response.status);

            if (!response.ok) {
                let errorMessage = `请求失败 (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // 如果响应不是JSON，使用状态文本
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            console.log('收到blob，大小:', blob.size);
            
            if (splitCards) {
                // 处理卡片分割结果
                const downloadUrl = URL.createObjectURL(blob);
                downloadCardsBtn.href = downloadUrl;
                downloadCardsBtn.download = 'cards.zip';
                
                cardInfo.innerHTML = '成功分割卡片！<br>📦 ZIP文件已准备就绪';
                showCardResult();
                console.log('卡片分割完成');
            } else {
                // 处理普通转换结果
                const imageUrl = URL.createObjectURL(blob);
                resultImage.src = imageUrl;
                downloadBtn.href = imageUrl;
                downloadBtn.download = 'screenshot.png';
                
                showResult();
                console.log('转换完成');
            }
            
        } catch (err) {
            console.error('转换错误:', err);
            showError(err.message);
        } finally {
            if (splitCards) {
                hideCardLoading();
            } else {
                hideLoading();
            }
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
            card: `<div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; text-align: center; width: 400px; height: 250px; font-family: Arial, sans-serif;">
    <h2>张三</h2>
    <p>高级产品经理</p>
    <div style="margin-top: 20px;">
        <div>📧 zhangsan@company.com</div>
        <div>📱 138-0000-0000</div>
        <div>🏢 北京市朝阳区xxx大厦</div>
    </div>
</div>`,

            chart: `<div style="width: 600px; height: 400px; background: white; padding: 30px; font-family: Arial, sans-serif; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
    <h2 style="text-align: center; margin-bottom: 30px;">📊 2024年销售数据</h2>
    <div style="margin: 20px 0;">
        <div style="background: #4facfe; height: 30px; width: 85%; border-radius: 5px; display: flex; align-items: center; color: white; padding: 0 10px;">Q1 - 85%</div>
    </div>
    <div style="margin: 20px 0;">
        <div style="background: #43e97b; height: 30px; width: 70%; border-radius: 5px; display: flex; align-items: center; color: white; padding: 0 10px;">Q2 - 70%</div>
    </div>
    <div style="margin: 20px 0;">
        <div style="background: #fa709a; height: 30px; width: 90%; border-radius: 5px; display: flex; align-items: center; color: white; padding: 0 10px;">Q3 - 90%</div>
    </div>
    <div style="margin: 20px 0;">
        <div style="background: #feca57; height: 30px; width: 60%; border-radius: 5px; display: flex; align-items: center; color: white; padding: 0 10px;">Q4 - 60%</div>
    </div>
</div>`,

            banner: `<div style="width: 800px; height: 300px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); display: flex; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif; text-align: center; border-radius: 10px;">
    <div>
        <h1 style="font-size: 36px; margin-bottom: 10px;">🎉 新品发布</h1>
        <p style="font-size: 18px;">革命性产品，改变未来</p>
    </div>
</div>`,

            multiCard: `<div style="display: flex; flex-direction: column; gap: 30px; padding: 20px;">
    <div style="width: 375px; height: 200px; background: linear-gradient(135deg, #800020, #1B2951); border-radius: 15px; padding: 20px; color: white; font-family: Arial, sans-serif;">
        <h3>业务卡片 1</h3>
        <p>这是第一张卡片的内容</p>
        <div style="margin-top: 20px; font-size: 12px;">标签: 卡片1</div>
    </div>
    
    <div style="width: 375px; height: 200px; background: linear-gradient(135deg, #355E3B, #1B2951); border-radius: 15px; padding: 20px; color: white; font-family: Arial, sans-serif;">
        <h3>业务卡片 2</h3>
        <p>这是第二张卡片的内容</p>
        <div style="margin-top: 20px; font-size: 12px;">标签: 卡片2</div>
    </div>
    
    <div style="width: 375px; height: 200px; background: linear-gradient(135deg, #1B2951, #4169E1); border-radius: 15px; padding: 20px; color: white; font-family: Arial, sans-serif;">
        <h3>业务卡片 3</h3>
        <p>这是第三张卡片的内容</p>
        <div style="margin-top: 20px; font-size: 12px;">标签: 卡片3</div>
    </div>
</div>`
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
    if (htmlTextarea) {
        htmlTextarea.addEventListener('input', function() {
            localStorage.setItem('htmlContent', this.value);
        });

        // 页面加载时恢复HTML内容
        const savedHtml = localStorage.getItem('htmlContent');
        if (savedHtml) {
            htmlTextarea.value = savedHtml;
        }
    }
});