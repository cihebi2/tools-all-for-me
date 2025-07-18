const fs = require('fs');
const path = require('path');

// 测试卡片分割功能
async function testSplitCards() {
    try {
        console.log('🧪 开始测试卡片分割功能...');
        
        // 读取测试HTML文件
        const testHtmlPath = path.join(__dirname, '..', 'test_10.html');
        let testHtml = '';
        
        if (fs.existsSync(testHtmlPath)) {
            testHtml = fs.readFileSync(testHtmlPath, 'utf8');
            console.log('✅ 成功读取test_10.html文件');
        } else {
            console.log('⚠️ 未找到test_10.html，使用内置测试模板');
            // 使用内置的简化测试HTML
            testHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>卡片分割测试</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-4">
    <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-center mb-8">卡片分割测试</h1>

        <div class="mb-12">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden" style="width: 375px; height: 812px; margin: 0 auto;">
                <div class="relative h-full">
                    <div class="relative h-64 bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 flex flex-col justify-between">
                        <div>
                            <div class="text-xs uppercase tracking-wider opacity-80">TEST CARD</div>
                            <div class="text-xs opacity-60">测试卡片 · 2025</div>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold mb-2">测试卡片 1</h1>
                            <p class="text-sm opacity-80">这是第一个测试卡片</p>
                        </div>
                    </div>
                    <div class="p-6 flex-1 flex items-center justify-center">
                        <p class="text-gray-600">内容区域 1</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="mb-12">
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden" style="width: 375px; height: 812px; margin: 0 auto;">
                <div class="relative h-full">
                    <div class="relative h-64 bg-gradient-to-br from-green-600 to-teal-600 text-white p-6 flex flex-col justify-between">
                        <div>
                            <div class="text-xs uppercase tracking-wider opacity-80">TEST CARD</div>
                            <div class="text-xs opacity-60">测试卡片 · 2025</div>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold mb-2">测试卡片 2</h1>
                            <p class="text-sm opacity-80">这是第二个测试卡片</p>
                        </div>
                    </div>
                    <div class="p-6 flex-1 flex items-center justify-center">
                        <p class="text-gray-600">内容区域 2</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
        }

        // 发送请求到卡片分割API
        console.log('📡 发送请求到卡片分割API...');
        const response = await fetch('http://localhost:3003/api/split-cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                html: testHtml,
                width: 1920,
                height: 1080,
                scale: 2,
                outputFormat: 'zip'
            })
        });

        if (response.ok) {
            const cardsCount = response.headers.get('X-Cards-Count');
            const processingTime = response.headers.get('X-Processing-Time');
            
            console.log('✅ 卡片分割成功！');
            console.log(`📊 生成卡片数量: ${cardsCount || '未知'}`);
            console.log(`⏱️ 处理时间: ${processingTime || '未知'}ms`);
            
            // 保存ZIP文件
            const blob = await response.blob();
            const buffer = Buffer.from(await blob.arrayBuffer());
            const outputPath = path.join(__dirname, 'test-cards-output.zip');
            fs.writeFileSync(outputPath, buffer);
            console.log(`💾 结果已保存到: ${outputPath}`);
            console.log(`📁 文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
        } else {
            const errorData = await response.json();
            console.error('❌ 卡片分割失败:', errorData.error);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 提示: 请先运行 "npm start" 启动服务器');
        }
    }
}

// 检查服务器是否运行
async function checkServer() {
    try {
        console.log('🔍 检查服务器状态...');
        const response = await fetch('http://localhost:3003/api/health');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ 服务器正在运行');
            console.log(`🌐 状态: ${data.status}`);
            console.log(`🔄 运行时间: ${Math.round(data.uptime)}秒`);
            console.log(`🧠 浏览器池: ${data.browserPool}个实例`);
            return true;
        }
    } catch (error) {
        console.log('❌ 服务器未运行');
        console.log('💡 请运行以下命令启动服务器:');
        console.log('   npm start');
        return false;
    }
}

// 主函数
async function main() {
    console.log('🚀 HTML转PNG 卡片分割功能测试');
    console.log('=====================================');
    
    const serverRunning = await checkServer();
    if (serverRunning) {
        console.log('');
        await testSplitCards();
        console.log('');
        console.log('🎉 测试完成！');
        console.log('💡 你可以打开浏览器访问 http://localhost:3003 使用Web界面');
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { testSplitCards, checkServer }; 