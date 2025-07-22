# 🎨 HTML转PNG高清转换工具

一个强大的HTML转PNG转换工具，支持高清输出、自定义尺寸和**卡片自动分割**功能。

## ✨ 主要功能

- 🖼️ **高清HTML转PNG**: 支持1x-3x缩放，输出高质量PNG图片
- 🃏 **卡片自动分割**: 智能识别HTML中的多个卡片，批量生成独立图片
- 📦 **ZIP批量下载**: 一键下载所有分割后的卡片图片
- 🎯 **多种输出选项**: 支持自定义尺寸、透明背景、完整页面截图
- 🌐 **Web界面**: 直观易用的网页操作界面
- 🚀 **高性能**: 基于Puppeteer，支持浏览器池并发处理
- 🔧 **API接口**: 提供RESTful API，支持程序化调用

## 🎯 卡片分割功能特色

**新增功能**：自动识别HTML中的卡片布局，一次性生成多张独立的PNG图片！

- ✅ **智能识别**: 自动检测`.mb-12`、固定尺寸、特定CSS类等卡片结构
- ✅ **批量处理**: 一次处理多个卡片，大幅提升效率
- ✅ **精确裁剪**: 基于元素边界精确裁剪每个卡片
- ✅ **ZIP打包**: 自动将所有卡片打包成ZIP文件下载

## 🚀 快速开始

### 本地运行

```bash
# 克隆项目
git clone https://github.com/cihebi2/tools-all-for-me.git
cd tools-all-for-me/html-to-png-converter

# 安装依赖
npm install

# 启动服务
npm start

# 浏览器访问
open http://localhost:3003
```

### 云服务器部署

项目支持一键部署到云服务器，详见 [云服务器部署指南](./cloud-server-setup.md)

```bash
# 运行一键配置脚本
sudo bash setup-external-access.sh

# 检查服务状态
bash check-server.sh
```

## 📊 使用示例

### Web界面使用

1. 访问 http://localhost:3003
2. 在HTML内容框中输入代码
3. 选择转换方式：
   - **🚀 开始转换**: 生成单张完整PNG图片
   - **🃏 分割卡片**: 自动分割生成多张卡片图片
4. 下载结果

### API调用示例

#### 普通转换
```javascript
const response = await fetch('/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    html: '<div>你的HTML内容</div>',
    width: 1920,
    height: 1080,
    scale: 2
  })
});

const blob = await response.blob();
```

#### 卡片分割转换
```javascript
const response = await fetch('/api/split-cards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    html: '包含多个卡片的HTML',
    width: 1920,
    height: 1080,
    scale: 2,
    outputFormat: 'zip'
  })
});

const zipBlob = await response.blob();
```

## 🛠️ 技术栈

- **后端**: Node.js + Express + Puppeteer
- **前端**: HTML5 + JavaScript + Tailwind CSS
- **图片处理**: Puppeteer (Chrome引擎)
- **压缩**: Archiver (ZIP压缩)
- **部署**: PM2 + Docker支持

## 📋 API文档

### POST /api/convert
普通HTML转PNG转换

**请求参数**:
```json
{
  "html": "HTML内容",
  "width": 1920,
  "height": 1080,
  "scale": 2,
  "fullPage": true,
  "transparent": false
}
```

### POST /api/split-cards
卡片分割转换

**请求参数**:
```json
{
  "html": "包含多个卡片的HTML",
  "width": 1920,
  "height": 1080,
  "scale": 2,
  "outputFormat": "zip"
}
```

**响应头**:
- `X-Cards-Count`: 生成的卡片数量
- `X-Processing-Time`: 处理时间(ms)

### GET /api/health
服务健康检查

## 🎨 支持的卡片结构

系统能自动识别以下卡片结构：

```html
<!-- 标准卡片结构 -->
<div class="mb-12">
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden" 
         style="width: 375px; height: 812px; margin: 0 auto;">
        <!-- 卡片内容 -->
    </div>
</div>

<!-- 或任何具有固定尺寸的div -->
<div style="width: 375px; height: 812px;">
    <!-- 卡片内容 -->
</div>
```

## 🔧 配置选项

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `width` | 1920 | 视口宽度 |
| `height` | 1080 | 视口高度 |
| `scale` | 2 | 缩放倍数 (1-3) |
| `fullPage` | true | 是否截取完整页面 |
| `transparent` | false | 是否透明背景 |

## 📊 性能特性

- **并发处理**: 最多3个浏览器实例并行
- **内存优化**: 自动回收浏览器实例
- **速度**: 每个卡片约1-3秒处理时间
- **文件大小**: 平均100KB-2MB每张图片

## 🌐 云服务器支持

项目已针对云服务器环境优化：

- ✅ 支持0.0.0.0监听所有网络接口
- ✅ 自动化防火墙配置脚本
- ✅ PM2进程管理
- ✅ 详细的部署和故障排除指南

## 📝 更新日志

### v1.1.0 (2025-01-20)
- ✨ 新增卡片自动分割功能
- ✨ 添加ZIP批量下载
- 🔧 完善云服务器部署支持
- 📝 增加详细文档和部署脚本

### v1.0.0
- 🎉 初始版本发布
- 🖼️ HTML转PNG基础功能
- 🌐 Web界面和API

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [云服务器部署指南](./cloud-server-setup.md)
- [卡片分割功能说明](./卡片分割功能说明.md)
- [GitHub仓库](https://github.com/cihebi2/tools-all-for-me)

---

**开发者**: [cihebi2](https://github.com/cihebi2)  
**项目状态**: 🚀 活跃开发中  
**最后更新**: 2025-01-20 