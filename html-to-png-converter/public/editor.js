// HTML在线编辑器主脚本
console.log('HTML编辑器加载中...');

class HTMLEditor {
    constructor() {
        this.editor = null;
        this.previewFrame = null;
        this.currentZoom = 100;
        this.previewUpdateTimer = null;
        this.templates = {};
        this.init();
    }

    async init() {
        console.log('初始化HTML编辑器...');
        
        // 初始化Monaco Editor
        await this.initMonacoEditor();
        
        // 初始化预览框架
        this.initPreviewFrame();
        
        // 绑定事件
        this.bindEvents();
        
        // 加载模板
        this.loadTemplates();
        
        // 设置默认内容
        this.setDefaultContent();
        
        console.log('HTML编辑器初始化完成');
    }

    async initMonacoEditor() {
        return new Promise((resolve, reject) => {
            require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' } });
            
            require(['vs/editor/editor.main'], () => {
                try {
                    this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                        value: '',
                        language: 'html',
                        theme: 'vs-dark',
                        fontSize: 14,
                        lineNumbers: 'on',
                        minimap: { enabled: true },
                        automaticLayout: true,
                        wordWrap: 'on',
                        tabSize: 2,
                        folding: true,
                        bracketPairColorization: { enabled: true },
                        formatOnPaste: true,
                        formatOnType: true
                    });

                    // 监听内容变化
                    this.editor.onDidChangeModelContent(() => {
                        this.updatePreview();
                        this.updateCharCount();
                        this.updateStatus('编辑中...');
                    });

                    console.log('Monaco Editor初始化成功');
                    resolve();
                } catch (error) {
                    console.error('Monaco Editor初始化失败:', error);
                    reject(error);
                }
            });
        });
    }

    initPreviewFrame() {
        this.previewFrame = document.getElementById('preview-frame');
        console.log('预览框架初始化完成');
    }

    bindEvents() {
        // 模板选择
        document.getElementById('templateSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadTemplate(e.target.value);
            }
        });

        // 工具栏按钮
        document.getElementById('refreshBtn').addEventListener('click', () => this.forceUpdatePreview());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('templatesBtn').addEventListener('click', () => this.toggleTemplatesPanel());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveCode());
        document.getElementById('convertToPngBtn').addEventListener('click', () => this.convertToPng());

        // 编辑器控制
        document.getElementById('formatBtn').addEventListener('click', () => this.formatCode());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearEditor());

        // 预览控制
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());

        // 预览尺寸变化
        document.getElementById('previewWidth').addEventListener('change', () => this.updatePreviewSize());
        document.getElementById('previewHeight').addEventListener('change', () => this.updatePreviewSize());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCode();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.convertToPng();
                        break;
                }
            }
        });

        console.log('事件绑定完成');
    }

    loadTemplates() {
        this.templates = {
            basic: {
                name: '基础HTML',
                description: '简单的HTML模板',
                content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>基础HTML模板</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>欢迎使用HTML编辑器</h1>
        <p>这是一个基础的HTML模板，您可以在此基础上进行修改。</p>
    </div>
</body>
</html>`
            },
            card: {
                name: '商务卡片',
                description: '现代化商务卡片设计',
                content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>商务卡片</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 40px;
            background: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .business-card {
            width: 350px;
            height: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            padding: 30px;
            color: white;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        .business-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200px;
            height: 200px;
            background: rgba(255,255,255,0.1);
            border-radius: 50%;
        }
        .name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .title {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        .contact {
            font-size: 12px;
            line-height: 1.5;
        }
        .contact i {
            width: 15px;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="business-card">
        <div class="name">张三</div>
        <div class="title">高级产品经理</div>
        <div class="contact">
            <div><i class="fas fa-phone"></i>138-0000-0000</div>
            <div><i class="fas fa-envelope"></i>zhangsan@example.com</div>
            <div><i class="fas fa-building"></i>ABC科技有限公司</div>
        </div>
    </div>
</body>
</html>`
            },
            chart: {
                name: '数据图表',
                description: '使用CSS创建的数据可视化',
                content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据图表</title>
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 40px;
            background: #f8f9fa;
        }
        .chart-container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            max-width: 600px;
            margin: 0 auto;
        }
        .chart-title {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            color: #333;
        }
        .bar-chart {
            display: flex;
            align-items: flex-end;
            justify-content: space-around;
            height: 200px;
            margin-bottom: 20px;
        }
        .bar {
            width: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 5px 5px 0 0;
            position: relative;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            color: white;
            font-weight: bold;
        }
        .bar-1 { height: 60%; }
        .bar-2 { height: 85%; }
        .bar-3 { height: 45%; }
        .bar-4 { height: 90%; }
        .bar-5 { height: 70%; }
        .bar-label {
            position: absolute;
            bottom: -25px;
            font-size: 12px;
            color: #666;
        }
        .legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
        }
        .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
    </style>
</head>
<body>
    <div class="chart-container">
        <div class="chart-title">2024年月度销售数据</div>
        <div class="bar-chart">
            <div class="bar bar-1">
                <span class="bar-label">1月</span>
                60%
            </div>
            <div class="bar bar-2">
                <span class="bar-label">2月</span>
                85%
            </div>
            <div class="bar bar-3">
                <span class="bar-label">3月</span>
                45%
            </div>
            <div class="bar bar-4">
                <span class="bar-label">4月</span>
                90%
            </div>
            <div class="bar bar-5">
                <span class="bar-label">5月</span>
                70%
            </div>
        </div>
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color"></div>
                <span>销售完成率</span>
            </div>
        </div>
    </div>
</body>
</html>`
            },
            'fa-icons': {
                name: 'Font Awesome图标',
                description: '展示各种Font Awesome图标的使用',
                content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Font Awesome图标展示</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        .title {
            font-size: 36px;
            margin-bottom: 40px;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        .icon-item {
            background: rgba(255,255,255,0.1);
            padding: 30px;
            border-radius: 15px;
            transition: transform 0.3s;
        }
        .icon-item:hover {
            transform: translateY(-5px);
        }
        .icon-item i {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        .icon-name {
            font-size: 14px;
            opacity: 0.9;
        }
        .social-icons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 40px;
        }
        .social-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            transition: background 0.3s;
        }
        .social-icon:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">
            <i class="fas fa-icons"></i> Font Awesome 图标展示
        </div>
        
        <div class="icon-grid">
            <div class="icon-item">
                <i class="fas fa-home"></i>
                <div class="icon-name">首页</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-user"></i>
                <div class="icon-name">用户</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-heart"></i>
                <div class="icon-name">喜爱</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-star"></i>
                <div class="icon-name">星标</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-envelope"></i>
                <div class="icon-name">邮件</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-phone"></i>
                <div class="icon-name">电话</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-shopping-cart"></i>
                <div class="icon-name">购物车</div>
            </div>
            <div class="icon-item">
                <i class="fas fa-cog"></i>
                <div class="icon-name">设置</div>
            </div>
        </div>
        
        <div class="social-icons">
            <div class="social-icon"><i class="fab fa-weixin"></i></div>
            <div class="social-icon"><i class="fab fa-weibo"></i></div>
            <div class="social-icon"><i class="fab fa-qq"></i></div>
            <div class="social-icon"><i class="fab fa-github"></i></div>
            <div class="social-icon"><i class="fab fa-twitter"></i></div>
        </div>
    </div>
</body>
</html>`
            },
            chinese: {
                name: '中文字体',
                description: '展示中文字体渲染效果',
                content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>中文字体展示</title>
    <style>
        body {
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .title {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            font-size: 42px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .font-demo {
            margin-bottom: 30px;
            padding: 20px;
            border-left: 4px solid #667eea;
            background: #f8f9fa;
        }
        .font-name {
            font-size: 18px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
        }
        .font-sample {
            font-size: 24px;
            line-height: 1.6;
            color: #333;
        }
        .pingfang { font-family: 'PingFang SC', sans-serif; }
        .yahei { font-family: 'Microsoft YaHei', sans-serif; }
        .heiti { font-family: 'SimHei', sans-serif; }
        .kaiti { font-family: 'KaiTi', sans-serif; }
        .fangsong { font-family: 'FangSong', sans-serif; }
        .poem {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            margin-top: 30px;
            text-align: center;
            font-family: 'KaiTi', serif;
        }
        .poem-title {
            font-size: 28px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .poem-content {
            font-size: 20px;
            line-height: 2;
        }
        .poem-author {
            font-size: 16px;
            margin-top: 20px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">中文字体渲染测试</div>
        
        <div class="font-demo">
            <div class="font-name">苹方 (PingFang SC)</div>
            <div class="font-sample pingfang">
                现代简洁的中文字体，适合UI界面和现代设计。苹方字体具有良好的可读性和优雅的外观。
            </div>
        </div>
        
        <div class="font-demo">
            <div class="font-name">微软雅黑 (Microsoft YaHei)</div>
            <div class="font-sample yahei">
                Windows系统默认中文字体，广泛应用于各种场景。字体清晰，适合长文本阅读。
            </div>
        </div>
        
        <div class="font-demo">
            <div class="font-name">黑体 (SimHei)</div>
            <div class="font-sample heiti">
                传统的无衬线中文字体，字形端正，笔画粗细均匀，适合标题和重点文字。
            </div>
        </div>
        
        <div class="font-demo">
            <div class="font-name">楷体 (KaiTi)</div>
            <div class="font-sample kaiti">
                模仿手写楷书的字体，具有传统文化韵味，常用于诗词、文学作品等场景。
            </div>
        </div>
        
        <div class="poem">
            <div class="poem-title">春江花月夜</div>
            <div class="poem-content">
                春江潮水连海平，海上明月共潮生。<br>
                滟滟随波千万里，何处春江无月明！<br>
                江流宛转绕芳甸，月照花林皆似霰。<br>
                空里流霜不觉飞，汀上白沙看不见。
            </div>
            <div class="poem-author">—— 张若虚</div>
        </div>
    </div>
</body>
</html>`
            },
            dashboard: {
                name: '仪表盘',
                description: '现代化仪表盘界面设计',
                content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据仪表盘</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f0f2f5;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .cards-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .card-title {
            font-size: 14px;
            color: #666;
            margin: 0;
        }
        .card-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .card-value {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .card-change {
            font-size: 12px;
            color: #28a745;
        }
        .card-change.negative {
            color: #dc3545;
        }
        .chart-card {
            grid-column: span 2;
            min-height: 300px;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 10px;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
            transition: width 0.3s;
        }
        .activity-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .activity-item {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 10px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        .activity-item:last-child {
            border-bottom: none;
        }
        .activity-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #667eea;
        }
        .activity-content {
            flex: 1;
        }
        .activity-title {
            font-size: 14px;
            color: #333;
            margin: 0 0 5px 0;
        }
        .activity-time {
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>
                <i class="fas fa-chart-line"></i>
                数据仪表盘
            </h1>
        </div>
        
        <div class="cards-row">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">总用户数</h3>
                    <div class="card-icon">
                        <i class="fas fa-users"></i>
                    </div>
                </div>
                <div class="card-value">12,847</div>
                <div class="card-change">
                    <i class="fas fa-arrow-up"></i> +12.5%
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 75%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">月度收入</h3>
                    <div class="card-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                </div>
                <div class="card-value">¥89,240</div>
                <div class="card-change">
                    <i class="fas fa-arrow-up"></i> +8.2%
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 60%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">订单数量</h3>
                    <div class="card-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                </div>
                <div class="card-value">1,632</div>
                <div class="card-change negative">
                    <i class="fas fa-arrow-down"></i> -3.1%
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 45%"></div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">转化率</h3>
                    <div class="card-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                </div>
                <div class="card-value">24.8%</div>
                <div class="card-change">
                    <i class="fas fa-arrow-up"></i> +2.4%
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 85%"></div>
                </div>
            </div>
        </div>
        
        <div class="cards-row">
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">最近活动</h3>
                    <div class="card-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                </div>
                <ul class="activity-list">
                    <li class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">新用户注册</div>
                            <div class="activity-time">2分钟前</div>
                        </div>
                    </li>
                    <li class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-shopping-bag"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">订单完成</div>
                            <div class="activity-time">5分钟前</div>
                        </div>
                    </li>
                    <li class="activity-item">
                        <div class="activity-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="activity-content">
                            <div class="activity-title">收到评价</div>
                            <div class="activity-time">10分钟前</div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`
            }
        };

        // 生成模板列表UI
        this.generateTemplatesList();
        console.log('模板加载完成');
    }

    generateTemplatesList() {
        const templatesList = document.getElementById('templatesList');
        Object.keys(this.templates).forEach(key => {
            const template = this.templates[key];
            const item = document.createElement('div');
            item.className = 'template-item';
            item.innerHTML = `
                <h4>${template.name}</h4>
                <p>${template.description}</p>
            `;
            item.addEventListener('click', () => {
                this.loadTemplate(key);
                this.toggleTemplatesPanel(false);
            });
            templatesList.appendChild(item);
        });
    }

    setDefaultContent() {
        const defaultContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML在线编辑器</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
        }
        .welcome {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 40px;
            backdrop-filter: blur(10px);
            max-width: 500px;
        }
        .welcome h1 {
            font-size: 36px;
            margin-bottom: 20px;
        }
        .welcome p {
            font-size: 18px;
            line-height: 1.6;
            opacity: 0.9;
        }
        .icon {
            font-size: 64px;
            margin-bottom: 20px;
            display: block;
        }
    </style>
</head>
<body>
    <div class="welcome">
        <i class="fas fa-code icon"></i>
        <h1>欢迎使用HTML编辑器</h1>
        <p>在左侧编辑HTML代码，右侧可以实时预览效果。</p>
        <p>支持Font Awesome图标、中文字体渲染等功能。</p>
        <p>编辑完成后可以直接转换为PNG图片！</p>
    </div>
</body>
</html>`;

        this.editor.setValue(defaultContent);
        this.updatePreview();
    }

    loadTemplate(templateKey) {
        if (this.templates[templateKey]) {
            this.editor.setValue(this.templates[templateKey].content);
            this.updateStatus(`已加载模板: ${this.templates[templateKey].name}`);
            
            // 更新下拉框选择
            document.getElementById('templateSelect').value = templateKey;
        }
    }

    updatePreview() {
        // 使用防抖避免频繁更新
        clearTimeout(this.previewUpdateTimer);
        this.previewUpdateTimer = setTimeout(() => {
            this.forceUpdatePreview();
        }, 500);
    }

    forceUpdatePreview() {
        const htmlContent = this.editor.getValue();
        
        // 使用srcdoc属性安全地渲染HTML
        this.previewFrame.srcdoc = htmlContent;
        
        this.updateStatus('预览已更新');
        console.log('预览更新完成');
    }

    updatePreviewSize() {
        const width = document.getElementById('previewWidth').value;
        const height = document.getElementById('previewHeight').value;
        
        // 这里可以调整预览框的显示尺寸，但实际转换时会使用设置的尺寸
        this.updateStatus(`预览尺寸: ${width}×${height}px`);
    }

    formatCode() {
        this.editor.getAction('editor.action.formatDocument').run();
        this.updateStatus('代码已格式化');
    }

    clearEditor() {
        if (confirm('确定要清空编辑器内容吗？')) {
            this.editor.setValue('');
            this.updateStatus('编辑器已清空');
        }
    }

    zoomIn() {
        if (this.currentZoom < 200) {
            this.currentZoom += 10;
            this.applyZoom();
        }
    }

    zoomOut() {
        if (this.currentZoom > 50) {
            this.currentZoom -= 10;
            this.applyZoom();
        }
    }

    applyZoom() {
        const zoomLevel = this.currentZoom / 100;
        this.previewFrame.style.transform = `scale(${zoomLevel})`;
        this.previewFrame.style.transformOrigin = 'top left';
        document.getElementById('zoomLevel').textContent = `${this.currentZoom}%`;
    }

    toggleFullscreen() {
        const previewPane = document.querySelector('.preview-pane');
        const editorPane = document.querySelector('.editor-pane');
        
        if (previewPane.style.width === '100%') {
            // 退出全屏
            previewPane.style.width = '50%';
            editorPane.style.display = 'flex';
            this.updateStatus('退出全屏预览');
        } else {
            // 进入全屏
            previewPane.style.width = '100%';
            editorPane.style.display = 'none';
            this.updateStatus('进入全屏预览');
        }
    }

    toggleTemplatesPanel(show = null) {
        const panel = document.getElementById('templatesPanel');
        if (show === null) {
            panel.classList.toggle('open');
        } else if (show) {
            panel.classList.add('open');
        } else {
            panel.classList.remove('open');
        }
    }

    saveCode() {
        const htmlContent = this.editor.getValue();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'code.html';
        a.click();
        
        URL.revokeObjectURL(url);
        this.updateStatus('代码已保存');
    }

    async convertToPng() {
        const htmlContent = this.editor.getValue();
        if (!htmlContent.trim()) {
            alert('请先输入HTML代码');
            return;
        }

        const width = document.getElementById('previewWidth').value;
        const height = document.getElementById('previewHeight').value;

        const formData = new FormData();
        formData.append('html', htmlContent);
        formData.append('width', width);
        formData.append('height', height);
        formData.append('scale', '2');
        formData.append('fullPage', 'true');
        formData.append('transparent', 'false');

        try {
            this.showLoading();
            this.updateStatus('正在转换PNG...');

            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`转换失败: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // 下载图片
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted.png';
            a.click();
            
            URL.revokeObjectURL(url);
            this.updateStatus('PNG转换完成');
            
        } catch (error) {
            console.error('转换失败:', error);
            alert(`转换失败: ${error.message}`);
            this.updateStatus('转换失败');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    updateStatus(message) {
        document.getElementById('editorStatus').textContent = message;
        
        // 3秒后恢复为"准备就绪"
        setTimeout(() => {
            if (document.getElementById('editorStatus').textContent === message) {
                document.getElementById('editorStatus').textContent = '准备就绪';
            }
        }, 3000);
    }

    updateCharCount() {
        const content = this.editor.getValue();
        const charCount = content.length;
        document.getElementById('charCount').textContent = `${charCount} 字符`;
    }
}

// 初始化编辑器
document.addEventListener('DOMContentLoaded', () => {
    console.log('开始初始化HTML编辑器...');
    window.htmlEditor = new HTMLEditor();
});