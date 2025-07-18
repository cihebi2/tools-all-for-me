# 🛠️ Tools All For Me

我的个人工具集合仓库，包含各种实用的开发和生产力工具。

## 📚 工具列表

### 1. HTML转PNG转换器
- **路径**: `/html-to-png-converter`
- **功能**: 高质量HTML转PNG图片转换工具
- **技术栈**: Node.js + Express + Puppeteer + Electron
- **特性**:
  - 🎨 支持高清输出 (2x, 3x 缩放)
  - ⚡ 浏览器实例池，高性能转换
  - 🖥️ 桌面版和Web版双模式
  - 🐳 支持Docker部署
  - 📦 可打包为Windows独立应用

#### 快速启动
```bash
cd html-to-png-converter
npm install
npm start  # Web版本
# 或
npm run electron  # 桌面版本
```

#### 一键运行（Windows）
- 桌面版：双击 `启动桌面版.bat`
- Web版：双击 `启动Web版.bat`
- 打包exe：双击 `build.bat`

---

## 🚀 使用说明

每个工具都有独立的文件夹和完整的文档。进入对应工具目录查看详细使用说明。

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript
- **后端**: Node.js, Express
- **桌面应用**: Electron
- **容器化**: Docker
- **自动化**: PowerShell脚本

## 📦 部署

### 本地开发
```bash
git clone git@github.com:cihebi2/tools-all-for-me.git
cd tools-all-for-me
# 进入具体工具目录按照说明运行
```

### 服务器部署
每个工具支持多种部署方式：
- Docker容器部署
- PM2进程管理
- Nginx反向代理
- 系统服务

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这些工具。

## 📄 许可证

MIT License - 详见各工具目录下的LICENSE文件

## 📞 联系

如有问题或建议，请提交Issue或联系作者。

---

⭐ 如果这些工具对你有帮助，请给个星标支持！