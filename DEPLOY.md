# 🎵 音频工具MP3格式保持功能 - 部署指南

## 📋 更新内容

### 🆕 新功能特性
- **MP3格式智能保持**: 上传MP3，输出MP3，真正保持格式
- **LAME.js编码器**: 使用业界标准MP3编码库
- **200MB文件支持**: 文件大小限制从50MB提升至200MB
- **超时问题解决**: 避免MediaRecorder兼容性问题

### 🔧 技术改进
- 专用MP3处理流程 (`processMp3ToMp3()`)
- 优化的音频编码算法 (`audioBufferToMp3()`)
- 完整的错误处理和降级机制
- 实时编码进度显示

## 🚀 云服务器部署

### 方法一：完整更新脚本

```bash
# 上传并执行完整更新脚本
cd /www/wwwroot/tools-all-for-me-main/html-to-png-converter
chmod +x update-server.sh
sudo ./update-server.sh
```

### 方法二：快速更新

```bash
# 使用快速更新脚本
chmod +x quick-update.sh
sudo ./quick-update.sh
```

### 方法三：手动更新流程

```bash
# 1. 进入项目根目录
cd /www/wwwroot/tools-all-for-me-main

# 2. 停止服务
sudo pm2 stop html-to-png-converter

# 3. 拉取最新代码
sudo git pull origin main

# 4. 切换到服务目录
cd html-to-png-converter

# 5. 应用增强版文件（如果存在）
sudo cp utils/converter_enhanced.js utils/converter.js 2>/dev/null || true
sudo cp utils/browserPool_enhanced.js utils/browserPool.js 2>/dev/null || true

# 6. 重启服务
sudo pm2 restart html-to-png-converter

# 7. 验证状态
sudo pm2 status
sudo pm2 logs html-to-png-converter --lines 10
```

## 🔍 部署验证

### 1. 服务状态检查
```bash
sudo pm2 status html-to-png-converter
sudo pm2 logs html-to-png-converter --lines 20
```

### 2. API健康检查
```bash
curl http://localhost:3003/api/health
curl http://localhost:3003/audio
```

### 3. 外部访问测试
- 音频工具: http://tool.cihebi.vip/audio
- 健康检查: http://tool.cihebi.vip/api/health
- 系统信息: http://tool.cihebi.vip/api/system/info

## 🧪 功能测试

### MP3格式保持测试
1. 访问 http://tool.cihebi.vip/audio
2. 上传一个MP3文件（可以测试较大文件，最大200MB）
3. 调整音量到非100%值
4. 点击"开始处理音频"
5. 验证输出文件为MP3格式

### 预期结果
- ✅ 上传：`test.mp3` → 输出：`test_volume_150%.mp3`
- ✅ 处理进度：显示"(MP3→MP3保持格式)"
- ✅ 控制台日志：显示LAME编码器工作状态
- ✅ 文件大小：支持最大200MB上传

## 🛠️ 故障排除

### 常见问题

#### 1. LAME编码器加载失败
**现象**: 控制台显示"LAME编码器未加载"
**解决**: 
- 检查CDN连接: https://cdn.jsdelivr.net/npm/lamejs@1.2.0/lame.min.js
- 会自动降级到WAV格式

#### 2. MP3编码失败
**现象**: 处理后获得WAV文件而非MP3
**原因**: LAME编码过程出错，自动降级
**解决**: 检查浏览器控制台错误日志

#### 3. 服务启动失败
```bash
# 查看详细日志
sudo pm2 logs html-to-png-converter --lines 50

# 重启服务
sudo pm2 restart html-to-png-converter

# 如果仍然失败，删除PM2进程重新启动
sudo pm2 delete html-to-png-converter
cd /www/wwwroot/tools-all-for-me-main/html-to-png-converter
sudo pm2 start server_enhanced.js --name html-to-png-converter
```

#### 4. 文件上传超过200MB
**现象**: 显示"文件大小不能超过200MB"
**解决**: 这是预期行为，如需更大限制可修改代码

## 📊 性能监控

### PM2监控
```bash
sudo pm2 monit
sudo pm2 status
sudo pm2 logs html-to-png-converter --follow
```

### 资源使用
- **内存使用**: 预期80-200MB（处理大文件时会临时增加）
- **CPU使用**: MP3编码时会有短暂高峰
- **磁盘空间**: 确保有足够空间处理大文件

## 🔄 回滚方案

如果更新后出现问题，可以快速回滚：

```bash
cd /www/wwwroot/tools-all-for-me-main
sudo git log --oneline -5  # 查看最近的提交
sudo git reset --hard HEAD~1  # 回滚到上一个版本
sudo pm2 restart html-to-png-converter
```

## 📞 技术支持

### 关键文件位置
- 音频页面: `/www/wwwroot/tools-all-for-me-main/html-to-png-converter/public/audio.html`
- 音频脚本: `/www/wwwroot/tools-all-for-me-main/html-to-png-converter/public/audio.js`
- 服务器脚本: `/www/wwwroot/tools-all-for-me-main/html-to-png-converter/server_enhanced.js`

### 日志位置
- PM2日志: `~/.pm2/logs/`
- 系统日志: `/var/log/nginx/` (如果使用Nginx)

---

**部署状态**: ✅ 准备就绪  
**最后更新**: 2025-07-26  
**版本**: MP3格式保持功能 v1.0  
**GitHub仓库**: https://github.com/cihebi2/tools-all-for-me

---

# 🚀 原部署指南（保留参考）

本文档介绍如何将tools-all-for-me项目部署到Linux服务器上。

## 🛠️ 服务器环境准备

### 系统要求
- Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- Node.js 16+
- PM2 (进程管理器)
- Nginx (反向代理)
- Git

### 安装基础环境

#### Ubuntu/Debian
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装Git
sudo apt install git -y

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install nginx -y
```

#### CentOS/RHEL
```bash
# 更新系统
sudo yum update -y

# 安装Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# 安装Git
sudo yum install git -y

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo yum install nginx -y
```

## 📦 部署HTML转PNG转换器

### 1. 克隆项目
```bash
cd /var/www
sudo git clone https://github.com/cihebi2/tools-all-for-me.git
sudo chown -R $USER:$USER tools-all-for-me
cd tools-all-for-me/html-to-png-converter
```

### 2. 安装依赖
```bash
npm install --production
```

### 3. 配置环境变量
```bash
# 创建环境配置文件
cat > .env << EOF
NODE_ENV=production
PORT=3003
MAX_BROWSERS=3
EOF
```

### 4. 使用PM2启动服务
```bash
# 启动服务
pm2 start server.js --name html-to-png

# 查看状态
pm2 status

# 查看日志
pm2 logs html-to-png

# 设置开机自启
pm2 startup
pm2 save
```

### 5. 配置Nginx反向代理

创建Nginx配置文件：
```bash
sudo nano /etc/nginx/sites-available/html-to-png
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 静态文件处理
    location /static/ {
        alias /var/www/tools-all-for-me/html-to-png-converter/public/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # API和Web界面代理
    location / {
        proxy_pass http://localhost:3003;
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
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/html-to-png /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. 配置HTTPS（推荐）

使用Let's Encrypt免费SSL证书：
```bash
# 安装Certbot
sudo apt install snapd
sudo snap install --classic certbot

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🐳 Docker部署（可选）

### 1. 安装Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### 2. 使用Docker Compose部署
```bash
cd /var/www/tools-all-for-me/html-to-png-converter
sudo docker-compose up -d
```

### 3. Nginx配置
```nginx
upstream html-to-png {
    server localhost:3003;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://html-to-png;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📊 监控和维护

### 1. 系统监控
```bash
# 查看服务状态
pm2 status

# 查看系统资源
pm2 monit

# 查看应用日志
pm2 logs html-to-png --lines 100

# 重启服务
pm2 restart html-to-png

# 更新代码
cd /var/www/tools-all-for-me
git pull origin main
cd html-to-png-converter
npm install --production
pm2 restart html-to-png
```

### 2. 日志管理
```bash
# 配置日志轮转
pm2 install pm2-logrotate

# 设置日志保留
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 3. 安全配置

#### 防火墙设置
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### 限制访问（可选）
在Nginx配置中添加：
```nginx
# 限制请求频率
limit_req_zone $binary_remote_addr zone=htmltopng:10m rate=10r/m;

server {
    # ... 其他配置
    
    location /api/ {
        limit_req zone=htmltopng burst=5 nodelay;
        # ... 代理配置
    }
}
```

## 🚨 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 检查端口占用
   sudo netstat -tlnp | grep 3003
   
   # 检查PM2日志
   pm2 logs html-to-png
   ```

2. **Chromium启动失败**
   ```bash
   # 安装必要依赖
   sudo apt-get install -y \
     ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
     libdrm2 libgtk-3-0 libnspr4 libnss3 lsb-release xdg-utils \
     libxss1 libgconf-2-4
   ```

3. **内存不足**
   ```bash
   # 增加swap空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

### 性能优化

1. **调整PM2配置**
   ```bash
   # 使用cluster模式
   pm2 start server.js --name html-to-png -i max
   ```

2. **优化Nginx缓存**
   ```nginx
   # 添加到server块中
   location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
   }
   ```

## 📞 支持

如果遇到部署问题，请：
1. 检查系统日志：`sudo journalctl -u nginx`
2. 检查应用日志：`pm2 logs html-to-png`
3. 提交Issue到GitHub仓库

---

🔗 **相关链接**：
- [项目仓库](https://github.com/cihebi2/tools-all-for-me)
- [PM2文档](https://pm2.keymetrics.io/)
- [Nginx文档](https://nginx.org/en/docs/) 