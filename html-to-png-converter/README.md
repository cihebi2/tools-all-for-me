# HTML转PNG高清转换工具

一个基于Node.js和Puppeteer的高性能HTML转PNG转换服务，支持高清输出和自定义配置。

## ✨ 特性

- 🎨 **高清输出**: 支持2x、3x缩放，确保图片清晰度
- ⚡ **高性能**: 浏览器实例池，提升转换效率
- 🛡️ **安全可靠**: 内置安全中间件和速率限制
- 🌐 **Web界面**: 友好的网页操作界面
- 🐳 **Docker支持**: 一键部署到任何环境
- 📱 **响应式**: 支持各种尺寸和设备
- 🎯 **灵活配置**: 支持透明背景、完整页面等选项
- 🖥️ **桌面应用**: 支持Windows桌面版本

## 🚀 快速开始

### Windows一键启动（推荐）

1. **桌面版本**
   ```
   双击：启动桌面版.bat
   ```

2. **Web版本**
   ```
   双击：启动Web版.bat
   ```

3. **打包exe**
   ```
   双击：build.bat
   ```

### 命令行启动

1. **安装依赖**
```bash
npm install
```

2. **启动服务**
```bash
npm start          # Web版本
npm run electron   # 桌面版本
```

3. **访问应用**
- Web版：http://localhost:3003
- 桌面版：自动打开应用窗口

## 📖 API文档

### POST /api/convert

将HTML转换为PNG图片

**请求体:**
```json
{
  "html": "<html>...</html>",
  "width": 1920,
  "height": 1080,
  "scale": 2,
  "fullPage": true,
  "transparent": false
}
```

**参数说明:**
- `html` (必需): HTML内容
- `width` (可选): 视口宽度，默认1920
- `height` (可选): 视口高度，默认1080
- `scale` (可选): 缩放倍数，默认2
- `fullPage` (可选): 是否截取完整页面，默认true
- `transparent` (可选): 是否透明背景，默认false

## 🐳 Docker部署

```bash
# 构建镜像
docker build -t html-to-png .

# 运行容器
docker run -p 3003:3003 html-to-png

# 或使用 Docker Compose
docker-compose up -d
```

## 🔧 服务器部署

### PM2部署（推荐）

```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name html-to-png

# 设置开机自启
pm2 startup && pm2 save
```

### Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📦 Windows应用打包

详细说明请查看：
- `BUILD.md` - 完整构建文档
- `快速打包指南.md` - 中文快速指南
- `使用说明.txt` - 简要使用说明

## 🛠️ 故障排除

运行诊断工具：
```
双击：diagnose.bat
```

常见问题解决：
1. **闪退**: 以管理员身份运行
2. **端口占用**: 检查3003端口是否被占用
3. **依赖问题**: 删除node_modules重新安装

## 📁 项目结构

```
html-to-png-converter/
├── server.js              # 主服务器
├── electron-main.js       # Electron主进程
├── package.json           # 项目配置
├── *.bat                  # Windows启动脚本
├── public/                # Web界面
├── utils/                 # 工具函数
└── assets/                # 应用图标
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## �� 许可证

MIT License 