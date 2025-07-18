# HTML转PNG转换器 - Windows打包说明

## 📋 系统要求

- Node.js 16+ 
- npm 或 yarn
- Windows 10/11 x64

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式运行

```bash
# 运行Web服务器模式
npm start

# 或运行Electron桌面应用模式
npm run electron

# 或同时运行Web服务器和Electron（开发模式）
npm run electron-dev
```

### 3. 打包为Windows应用

#### 方法一：直接构建（推荐）

```bash
# 构建Windows安装包和便携版
npm run build
```

这将生成：
- `dist/HTML转PNG转换器 Setup 1.0.0.exe` - Windows安装程序（NSIS）
- `dist/HTML转PNG转换器 1.0.0.exe` - 便携版可执行文件

#### 方法二：仅构建Windows版本

```bash
npm run build-win
```

## 📁 输出文件说明

构建完成后，在 `dist/` 文件夹中会生成：

1. **安装程序版本** (`Setup.exe`)：
   - 用户需要运行安装程序来安装应用
   - 会在开始菜单和桌面创建快捷方式
   - 支持自动更新（可选）
   - 会注册到系统的程序列表中

2. **便携版本** (`portable.exe`)：
   - 无需安装，双击即可运行
   - 适合在U盘中携带
   - 不会修改系统注册表

## 🎨 自定义图标

1. 进入 `assets/` 文件夹
2. 将 `icon.svg` 转换为PNG和ICO格式：
   - 访问 https://convertio.co/svg-png/ 转换为PNG（256x256像素）
   - 访问 https://convertio.co/png-ico/ 转换为ICO格式
3. 将文件保存为 `assets/icon.png` 和 `assets/icon.ico`
4. 重新构建应用

## ⚡ 构建优化

### 减小安装包大小

1. **排除Chromium**（不推荐）：
   ```json
   // 在package.json的build配置中修改
   "files": [
     "**/*",
     "!node_modules/puppeteer/.local-chromium/**"
   ]
   ```

2. **仅构建64位版本**：
   ```json
   "win": {
     "target": [
       {
         "target": "nsis",
         "arch": ["x64"]
       }
     ]
   }
   ```

### 构建速度优化

1. 使用本地缓存：
   ```bash
   # 设置electron镜像（中国用户）
   npm config set electron_mirror https://npm.taobao.org/mirrors/electron/
   ```

2. 增加构建内存：
   ```bash
   # Windows PowerShell
   $env:NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

## 🛠️ 故障排除

### 常见问题

1. **构建失败 - 网络错误**：
   ```bash
   # 设置npm镜像
   npm config set registry https://registry.npmmirror.com/
   
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Puppeteer下载失败**：
   ```bash
   # 设置Puppeteer镜像
   npm config set puppeteer_download_host https://npm.taobao.org/mirrors
   npm install
   ```

3. **权限错误**：
   - 以管理员身份运行命令提示符
   - 或者使用便携版本构建：`npm run build-portable`

4. **图标不显示**：
   - 确保 `assets/icon.png` 和 `assets/icon.ico` 文件存在
   - 检查图标文件格式是否正确

### 构建日志

构建过程中如遇到问题，查看详细日志：

```bash
# 启用详细日志
DEBUG=electron-builder npm run build
```

## 📦 分发应用

### 数字签名（可选）

为了避免Windows SmartScreen警告，建议对应用进行数字签名：

1. 获取代码签名证书
2. 在 `package.json` 中配置：
   ```json
   "win": {
     "certificateFile": "path/to/certificate.p12",
     "certificatePassword": "password"
   }
   ```

### 自动更新（可选）

配置应用自动更新功能：

1. 设置更新服务器
2. 在 `package.json` 中配置：
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-username",
     "repo": "your-repo"
   }
   ```

## 🎯 使用说明

构建完成后：

1. **安装版本**：运行 `.exe` 安装程序，按提示完成安装
2. **便携版本**：直接双击 `.exe` 文件运行
3. **首次运行**：应用会自动启动后端服务并打开转换界面
4. **端口占用**：如果3003端口被占用，应用会显示错误提示

## 📞 技术支持

如果在构建过程中遇到问题：

1. 检查Node.js版本是否为16+
2. 确保网络连接正常
3. 查看构建日志中的错误信息
4. 尝试清除缓存后重新构建：
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ``` 