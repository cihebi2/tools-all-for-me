# HTML转PNG转换器 - 修复版部署指南

## 🔧 修复内容

这个修复版解决了之前部署过程中遇到的所有问题：

### ✅ 已修复的问题

1. **npm镜像源问题**
   - 自动设置为 https://registry.npmmirror.com
   - 清除旧的镜像源配置
   - 处理npm缓存权限问题

2. **中文字体显示问题**
   - 自动安装 Noto Sans CJK SC 字体
   - 自动安装文泉驿字体
   - 在HTML渲染时自动添加中文字体CSS

3. **权限问题**
   - 支持root用户运行（自动处理权限）
   - 修复npm缓存目录权限
   - 正确设置项目文件所有权

4. **HTTP兼容性问题**
   - 移除所有安全头部冲突
   - 确保服务绑定到 0.0.0.0
   - 支持纯HTTP访问

5. **代码语法错误**
   - 修复 browserPool.js 文件语法错误
   - 修复 converter.js 文件结构
   - 简化 config.js 配置

6. **服务启动问题**
   - 使用 server_clean.js 替代原始server.js
   - 移除安全中间件冲突
   - 优化浏览器池管理

## 🚀 一键部署

### 1. 下载部署脚本

```bash
wget https://raw.githubusercontent.com/cihebi2/tools-all-for-me/main/deploy.sh
chmod +x deploy.sh
```

### 2. 运行部署脚本

```bash
./deploy.sh
```

部署脚本会自动：
- ✅ 检测操作系统类型
- ✅ 安装中文字体
- ✅ 安装Node.js 18.x
- ✅ 配置npm镜像源
- ✅ 安装系统依赖
- ✅ 克隆项目代码
- ✅ 修复项目文件
- ✅ 安装项目依赖
- ✅ 启动PM2服务
- ✅ 配置Nginx反向代理
- ✅ 配置防火墙

### 3. 验证部署

部署完成后，你可以通过以下方式验证：

```bash
# 检查服务状态
pm2 status

# 检查健康状态
curl http://localhost:3003/api/health

# 查看服务日志
pm2 logs html-to-png-converter

# 测试中文字体
fc-list :lang=zh
```

## 🌐 访问服务

- **直接访问**: http://your-server-ip:3003
- **Nginx代理**: http://your-domain.com
- **API端点**: http://your-server-ip:3003/api/convert

## 🛠 故障排除

### 如果服务无法启动

```bash
# 查看详细日志
pm2 logs html-to-png-converter --lines 50

# 重启服务
pm2 restart html-to-png-converter

# 检查端口占用
netstat -tlnp | grep 3003
```

### 如果中文显示异常

```bash
# 检查中文字体
fc-list :lang=zh

# 手动安装字体
sudo apt install fonts-noto-cjk fonts-wqy-zenhei
sudo fc-cache -fv
```

### 如果无法外网访问

```bash
# 检查防火墙
sudo ufw status

# 开放端口
sudo ufw allow 3003

# 检查服务绑定
netstat -tlnp | grep 3003
```

## 📝 配置HTTPS（可选）

```bash
# 安装Certbot
sudo apt install snapd
sudo snap install --classic certbot

# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

## 🔄 更新服务

```bash
# 进入项目目录
cd ~/tools-all-for-me/html-to-png-converter

# 拉取最新代码
git pull

# 重启服务
pm2 restart html-to-png-converter
```

## 📋 环境要求

- **操作系统**: Ubuntu 20.04+ / Debian 10+ / CentOS 7+
- **内存**: 至少 2GB RAM
- **磁盘**: 至少 5GB 可用空间
- **网络**: 能够访问npm镜像源和GitHub

## ⚡ 性能优化

### 调整浏览器池大小

编辑 `.env` 文件：

```bash
NODE_ENV=production
PORT=3003
MAX_BROWSERS=5  # 根据服务器性能调整
```

### 监控资源使用

```bash
# 实时监控
pm2 monit

# 查看资源使用
pm2 show html-to-png-converter
```

## 🆘 技术支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 `pm2 logs html-to-png-converter` 的日志输出
3. 确保服务器满足环境要求
4. 提供详细的错误信息和日志

## 📄 许可证

本项目采用 MIT 许可证。
