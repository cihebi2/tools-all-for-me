# HTML转PNG转换器完整部署指南

## 🌟 项目概述
HTML转PNG转换器增强版，支持外部资源加载、中文字体渲染、Font Awesome图标等功能。

## 📋 系统要求
- **操作系统**: Ubuntu/Debian 或 CentOS/RHEL
- **Node.js**: 18.x 或更高版本
- **内存**: 至少 2GB RAM
- **磁盘**: 至少 5GB 可用空间

## 🚀 完整部署流程

### 1. 系统环境准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# 或
sudo yum update -y  # CentOS/RHEL

# 安装基础依赖
sudo apt install -y curl wget git build-essential nginx  # Ubuntu/Debian
# 或 
sudo yum install -y curl wget git gcc gcc-c++ make nginx  # CentOS/RHEL
```

### 2. 安装字体支持

```bash
# Ubuntu/Debian
sudo apt install -y \
    fonts-noto-cjk \
    fonts-noto-color-emoji \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig

# CentOS/RHEL
sudo yum install -y \
    google-noto-cjk-fonts \
    google-noto-emoji-fonts \
    wqy-zenhei-fonts \
    liberation-fonts \
    fontconfig

# 更新字体缓存
sudo fc-cache -fv
```

### 3. 安装浏览器依赖

```bash
# Ubuntu/Debian
sudo apt install -y \
    libgtk-3-0 \
    libgbm-dev \
    libxss1 \
    libasound2 \
    libappindicator3-1 \
    xdg-utils \
    libnss3 \
    libxrandr2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgdk-pixbuf2.0-0

# CentOS/RHEL
sudo yum install -y \
    gtk3 \
    libXScrnSaver \
    alsa-lib \
    nss \
    libXrandr \
    libdrm \
    libXcomposite \
    libXdamage \
    libXfixes
```

### 4. 安装Node.js 18

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs npm

# 验证安装
node --version
npm --version
```

### 5. 安装PM2

```bash
# 配置npm镜像源
npm config set registry https://registry.npmjs.org/

# 安装PM2
npm install -g pm2

# 验证安装
pm2 --version
```

### 6. 部署项目

```bash
# 创建项目目录
sudo mkdir -p /www/wwwroot/tools-all-for-me-main

# 克隆项目
sudo git clone https://github.com/cihebi2/tools-all-for-me.git /www/wwwroot/tools-all-for-me-main

# 进入项目目录
cd /www/wwwroot/tools-all-for-me-main/html-to-png-converter

# 设置权限
sudo chown -R $(whoami):$(whoami) /www/wwwroot/tools-all-for-me-main
```

### 7. 安装项目依赖

```bash
# 安装依赖
npm install

# 创建必要目录
mkdir -p uploads utils public
```

### 8. 应用增强版配置

```bash
# 使用增强版转换器（支持外部资源和图标）
cp utils/converter_enhanced.js utils/converter.js

# 使用增强版浏览器池（智能管理）
cp utils/browserPool_enhanced.js utils/browserPool.js

# 检查是否有增强版服务器文件
ls -la server_enhanced.js
```

### 9. 启动服务

```bash
# 启动增强版服务（如果存在）
pm2 start server_enhanced.js --name "html-to-png-converter" --watch --ignore-watch="node_modules uploads"

# 或启动标准版（如果没有增强版）
# pm2 start server_with_ui.js --name "html-to-png-converter" --watch --ignore-watch="node_modules uploads"

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
# 执行输出的命令（通常需要sudo）

# 检查服务状态
pm2 status
```

### 10. 配置防火墙

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3003/tcp
sudo ufw enable

# 或 firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3003/tcp
sudo firewall-cmd --reload
```

### 11. 配置域名访问（可选）

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/html-to-png
```

添加以下内容：

```nginx
server {
    listen 80;
    server_name tool.cihebi.vip;  # 替换为你的域名
    
    # 安全头部
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # 反向代理到HTML转PNG转换器
    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 文件上传大小限制
        client_max_body_size 10M;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 压缩设置
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/js text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

启用Nginx配置：

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/html-to-png /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🔄 更新流程

### 方法1：使用一键更新脚本

```bash
# 下载更新脚本
curl -O https://raw.githubusercontent.com/cihebi2/tools-all-for-me/main/html-to-png-converter/update.sh

# 执行更新
chmod +x update.sh
sudo bash update.sh
```

### 方法2：手动更新

```bash
cd /www/wwwroot/tools-all-for-me-main

# 备份当前版本
sudo cp -r html-to-png-converter html-to-png-converter-backup-$(date +%Y%m%d_%H%M%S)

# 拉取最新代码
sudo git pull origin main

# 进入项目目录
cd html-to-png-converter

# 应用增强版文件
sudo cp utils/converter_enhanced.js utils/converter.js
sudo cp utils/browserPool_enhanced.js utils/browserPool.js

# 重启服务
pm2 restart html-to-png-converter

# 检查状态
pm2 status
pm2 logs html-to-png-converter --lines 10
```

## 🔍 监控和维护

### 服务监控

```bash
# 查看服务状态
pm2 status

# 查看详细信息
pm2 show html-to-png-converter

# 查看日志
pm2 logs html-to-png-converter

# 查看实时日志
pm2 logs html-to-png-converter --follow
```

### 健康检查端点

- **基础健康检查**: `http://your-domain:3003/api/health`
- **浏览器池状态**: `http://your-domain:3003/api/browsers/status`
- **系统信息**: `http://your-domain:3003/api/system/info`

### 性能优化

```bash
# 查看系统资源使用
pm2 monit

# 重启服务（如果内存使用过高）
pm2 restart html-to-png-converter

# 查看系统字体
fc-list :lang=zh

# 清理临时文件
sudo find /tmp -name "*puppeteer*" -type d -mtime +1 -exec rm -rf {} +
```

## 🛠️ 故障排除

### 常见问题

1. **字体显示问题**
   ```bash
   # 检查中文字体
   fc-list :lang=zh
   
   # 重新安装字体
   sudo apt install --reinstall fonts-noto-cjk
   sudo fc-cache -fv
   ```

2. **外部资源加载失败**
   ```bash
   # 检查网络连接
   curl -I https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
   
   # 检查DNS解析
   nslookup cdnjs.cloudflare.com
   ```

3. **内存不足**
   ```bash
   # 检查内存使用
   free -h
   
   # 减少浏览器实例数量
   # 编辑 config.js，设置 maxBrowsers: 1
   ```

4. **端口占用**
   ```bash
   # 检查端口使用
   netstat -tlnp | grep 3003
   
   # 杀死占用进程
   sudo kill -9 PID
   ```

### 日志分析

```bash
# PM2日志
pm2 logs html-to-png-converter

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
```

## 📊 成功验证

部署完成后，验证以下功能：

1. **基础功能**: 访问 `http://your-domain:3003`
2. **API健康**: `curl http://your-domain:3003/api/health`
3. **HTML转换**: 在Web界面测试HTML转PNG
4. **中文字体**: 测试包含中文的HTML
5. **图标字体**: 测试Font Awesome图标
6. **外部资源**: 测试包含外部图片的HTML

## 🎯 生产环境建议

1. **SSL证书**: 使用Let's Encrypt配置HTTPS
2. **监控告警**: 配置监控系统
3. **备份策略**: 定期备份项目文件
4. **日志轮转**: 配置日志文件轮转
5. **资源限制**: 设置内存和CPU限制

---

**版本**: v2.0-enhanced  
**最后更新**: 2025-07-23  
**支持平台**: Ubuntu 18.04+, Debian 10+, CentOS 7+