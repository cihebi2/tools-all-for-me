# 🚀 服务器部署指南

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