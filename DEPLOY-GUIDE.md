# 🎵 云服务器部署和更新指南

## 📋 服务器信息
- **服务器IP**: 144.34.227.86  
- **域名**: tool.cihebi.vip
- **端口**: 3003
- **项目路径**: `/www/wwwroot/tools-all-for-me-main`

## 🚀 完整更新流程

### 1. SSH连接服务器
```bash
ssh root@144.34.227.86
# 或使用域名
ssh root@tool.cihebi.vip
```

### 2. 上传更新脚本
```bash
# 方法1: 使用wget下载（推荐）
cd /tmp
wget https://raw.githubusercontent.com/cihebi2/tools-all-for-me/main/update-server.sh
chmod +x update-server.sh
sudo ./update-server.sh

# 方法2: 手动上传
# 将update-server.sh上传到服务器任意目录，然后执行
chmod +x update-server.sh
sudo ./update-server.sh
```

### 3. 快速更新（紧急情况）
```bash
cd /tmp
wget https://raw.githubusercontent.com/cihebi2/tools-all-for-me/main/quick-update.sh
chmod +x quick-update.sh
sudo ./quick-update.sh
```

## 🔧 手动更新步骤

如果脚本无法使用，可以手动执行：

```bash
# 1. 进入项目目录
cd /www/wwwroot/tools-all-for-me-main

# 2. 备份当前版本
sudo cp -r /www/wwwroot/tools-all-for-me-main /www/wwwroot/backup-$(date +%Y%m%d-%H%M%S)

# 3. 拉取最新代码
sudo git fetch origin main
sudo git reset --hard origin/main

# 4. 进入项目目录并重启服务
cd html-to-png-converter
pm2 restart html-to-png-converter

# 5. 验证更新
pm2 status
curl http://localhost:3003/api/health
```

## 🎯 验证更新成功

### 1. 检查服务状态
```bash
pm2 status html-to-png-converter
pm2 logs html-to-png-converter --lines 10
```

### 2. 测试功能
```bash
# 健康检查
curl http://localhost:3003/api/health

# 音频页面
curl -I http://localhost:3003/audio

# 浏览器访问
# http://tool.cihebi.vip/audio
```

### 3. 检查关键功能
- ✅ 上传MP3文件测试
- ✅ 音量调整功能
- ✅ 下载.mp3格式文件
- ✅ 200MB文件大小限制

## ⚠️ 故障排除

### 1. 服务无法启动
```bash
# 查看详细日志
pm2 logs html-to-png-converter

# 重新启动
cd /www/wwwroot/tools-all-for-me-main/html-to-png-converter
pm2 delete html-to-png-converter
pm2 start server_enhanced.js --name html-to-png-converter
```

### 2. 代码拉取失败
```bash
# 强制重置到远程版本
cd /www/wwwroot/tools-all-for-me-main
sudo git fetch --all
sudo git reset --hard origin/main
```

### 3. 恢复备份
```bash
# 列出可用备份
ls -la /www/wwwroot/backup-*

# 恢复指定备份
sudo rm -rf /www/wwwroot/tools-all-for-me-main
sudo mv /www/wwwroot/backup-20250726-143000 /www/wwwroot/tools-all-for-me-main
cd /www/wwwroot/tools-all-for-me-main/html-to-png-converter
pm2 restart html-to-png-converter
```

## 📊 监控和维护

### 1. 系统监控
```bash
# PM2监控
pm2 monit

# 系统资源
htop
df -h
```

### 2. 日志管理
```bash
# 查看实时日志
pm2 logs html-to-png-converter --follow

# 清理日志
pm2 flush html-to-png-converter
```

### 3. 定期维护
```bash
# 重启服务（每周建议）
pm2 restart html-to-png-converter

# 清理旧备份
find /www/wwwroot/backup-* -mtime +7 -exec rm -rf {} \;
```

## 🎉 本次更新内容

### 🎵 MP3智能格式保持功能
- **核心功能**: MP3输入→MP3输出
- **编码器**: LAME.js专业MP3编码
- **文件限制**: 提升至200MB
- **兼容性**: 解决Chrome/Edge超时问题

### 🔧 技术改进
- 新增`processMp3ToMp3()`方法
- 优化的WAV编码器作为降级方案
- 改进的错误处理和日志记录
- 实时编码进度显示

## 📞 技术支持

如遇问题，可检查：
1. **GitHub仓库**: https://github.com/cihebi2/tools-all-for-me
2. **服务日志**: `pm2 logs html-to-png-converter`
3. **健康检查**: http://tool.cihebi.vip/api/health

---
📅 更新时间: 2025-07-26  
🚀 版本: MP3智能格式保持功能  
👨‍💻 开发者: Claude Code Assistant