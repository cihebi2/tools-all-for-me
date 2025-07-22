# 🌐 云服务器部署指南

## 服务器信息
- **IP地址**: 144.34.227.86
- **端口**: 3003
- **访问地址**: http://144.34.227.86:3003

## 当前状态
✅ PM2服务已启动并运行中  
❌ Nginx配置失败（80端口被占用）  
⚠️ 需要配置防火墙开放3003端口

## 部署步骤

### 1. 检查服务状态
```bash
pm2 list
pm2 logs html-to-png-converter
```

### 2. 配置防火墙（开放3003端口）

#### 对于Ubuntu/Debian系统：
```bash
# 使用ufw防火墙
sudo ufw allow 3003/tcp
sudo ufw reload
sudo ufw status

# 或使用iptables
sudo iptables -A INPUT -p tcp --dport 3003 -j ACCEPT
sudo iptables-save
```

#### 对于CentOS/RHEL系统：
```bash
# 使用firewalld
sudo firewall-cmd --permanent --add-port=3003/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports

# 或使用iptables
sudo iptables -A INPUT -p tcp --dport 3003 -j ACCEPT
sudo service iptables save
```

### 3. 检查端口监听状态
```bash
netstat -tlnp | grep 3003
# 应该显示: tcp 0 0 0.0.0.0:3003 0.0.0.0:* LISTEN
```

### 4. 测试本地访问
```bash
curl -I http://localhost:3003
# 应该返回HTTP 200状态
```

### 5. 云服务商安全组配置

#### 如果使用阿里云/腾讯云/AWS等：
1. 登录云服务商控制台
2. 找到您的服务器实例
3. 配置安全组规则：
   - **协议**: TCP
   - **端口**: 3003
   - **来源**: 0.0.0.0/0（允许所有IP访问）
   - **动作**: 允许

## 验证部署

### 1. 在服务器上测试
```bash
# 测试健康检查
curl http://localhost:3003/api/health

# 测试主页
curl -I http://localhost:3003
```

### 2. 从外部访问测试
```bash
# 在您的本地电脑上执行
curl -I http://144.34.227.86:3003
```

### 3. 浏览器访问
直接在浏览器中访问：http://144.34.227.86:3003

## 故障排除

### 问题1: 无法从外部访问
**可能原因**：
- 防火墙未开放3003端口
- 云服务商安全组未配置
- 服务监听地址错误

**解决方案**：
```bash
# 1. 检查服务监听地址
netstat -tlnp | grep 3003
# 确认是 0.0.0.0:3003 而不是 127.0.0.1:3003

# 2. 检查防火墙
sudo ufw status
sudo iptables -L

# 3. 检查服务日志
pm2 logs html-to-png-converter
```

### 问题2: 服务自动重启
```bash
# 查看PM2日志
pm2 logs html-to-png-converter --lines 50

# 重启服务
pm2 restart html-to-png-converter

# 重新加载配置
pm2 reload html-to-png-converter
```

### 问题3: 内存不足
```bash
# 查看内存使用
free -h
pm2 monit

# 如果内存不足，可以配置swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 性能优化

### 1. PM2集群模式（如果服务器配置允许）
```bash
pm2 delete html-to-png-converter
pm2 start server_clean.js --name html-to-png-converter -i max
```

### 2. 日志管理
```bash
# 设置日志轮转
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

## 监控命令

```bash
# 实时监控
pm2 monit

# 查看资源使用
pm2 status
htop

# 查看网络连接
netstat -an | grep 3003
```

## 备份与恢复

### 备份PM2配置
```bash
pm2 save
pm2 dump
```

### 恢复配置
```bash
pm2 resurrect
```

---

**注意事项**：
1. 确保云服务商的安全组已正确配置
2. 定期检查服务状态和日志
3. 建议配置SSL证书（如需要HTTPS访问）
4. 监控服务器资源使用情况 