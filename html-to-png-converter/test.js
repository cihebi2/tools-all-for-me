// 测试脚本
const http = require('http');

const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        .test-card {
            width: 400px;
            height: 200px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <div class="test-card">
        🎨 测试转换成功！
    </div>
</body>
</html>
`;

const postData = JSON.stringify({
    html: testHtml,
    width: 800,
    height: 600,
    scale: 2
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/convert',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🧪 开始测试HTML转PNG服务...');

const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头:`, res.headers);

    if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', (chunk) => {
            chunks.push(chunk);
        });

        res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log(`✅ 转换成功！图片大小: ${buffer.length} bytes`);
            
            // 保存测试图片
            const fs = require('fs');
            fs.writeFileSync('test-output.png', buffer);
            console.log('📁 测试图片已保存为 test-output.png');
        });
    } else {
        let errorData = '';
        res.on('data', (chunk) => {
            errorData += chunk;
        });
        res.on('end', () => {
            console.error('❌ 转换失败:', errorData);
        });
    }
});

req.on('error', (e) => {
    console.error(`❌ 请求错误: ${e.message}`);
    console.log('请确保服务器正在运行: npm start');
});

req.write(postData);
req.end();