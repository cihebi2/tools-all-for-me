# HTML转PNG转换器 - 云服务器部署记录

## 🌟 项目状态
- **部署完成**: ✅ 2025-07-23
- **服务器IP**: 144.34.227.86
- **域名**: tool.cihebi.vip
- **服务端口**: 3003

## 📂 服务器文件结构
```
/www/wwwroot/tools-all-for-me-main/
└── html-to-png-converter/
    ├── server_enhanced.js          # 增强版服务器（正在使用）
    ├── server_with_ui.js           # 标准版服务器
    ├── utils/
    │   ├── converter.js            # 当前转换器（增强版）
    │   ├── converter_enhanced.js   # 增强版转换器源文件
    │   ├── browserPool.js          # 当前浏览器池（增强版）
    │   └── browserPool_enhanced.js # 增强版浏览器池源文件
    ├── public/                     # Web界面文件
    ├── uploads/                    # 上传临时文件
    ├── configs/                    # 配置文件模板
    └── package.json
```

## 🔧 当前配置

### PM2服务配置
```bash
# 服务名称: html-to-png-converter
# 启动文件: server_enhanced.js 或 server_with_ui.js
# 监听端口: 3003
# 状态: online
```

### Nginx反向代理
```nginx
server {
    listen 80;
    server_name tool.cihebi.vip;
    
    location / {
        proxy_pass http://127.0.0.1:3003;
        # ... 其他配置
    }
}
```

### 系统依赖
- **Node.js**: v22.17.1
- **PM2**: 已安装
- **Nginx**: 已配置
- **字体支持**: 
  - fonts-noto-cjk (中文字体)
  - fonts-noto-color-emoji (表情符号)
  - fonts-wqy-zenhei (文泉驿字体)
  - Font Awesome (图标字体，通过CDN)

## 🚀 功能特性

### 增强功能
- ✅ **外部资源加载**: 支持阿里云OSS等外部图片
- ✅ **中文字体渲染**: 完整的中文字体支持
- ✅ **Font Awesome图标**: 支持FA6、FA5、FA4版本
- ✅ **SVG优化渲染**: 针对SVG图像优化
- ✅ **智能浏览器池**: 自动管理Puppeteer实例
- ✅ **请求拦截器**: 处理外部资源加载
- ✅ **错误恢复**: 自动重试和错误处理

### 监控端点
- **健康检查**: `http://tool.cihebi.vip/api/health`
- **浏览器状态**: `http://tool.cihebi.vip/api/browsers/status`
- **系统信息**: `http://tool.cihebi.vip/api/system/info`

## 🔄 更新流程

### 已验证的更新方法
```bash
cd /www/wwwroot/tools-all-for-me-main

# 1. 删除冲突文件（如果存在）
sudo rm -f html-to-png-converter/update.sh

# 2. 拉取最新代码
sudo git pull origin main

# 3. 进入项目目录
cd html-to-png-converter

# 4. 应用增强版文件
sudo cp utils/converter_enhanced.js utils/converter.js
sudo cp utils/browserPool_enhanced.js utils/browserPool.js

# 5. 重启服务
pm2 restart html-to-png-converter

# 6. 验证更新
pm2 status
pm2 logs html-to-png-converter --lines 10
curl http://localhost:3003/api/health
```

## 🛠️ 已解决问题

### 1. PNG Quality参数错误
**问题**: `Error: png screenshots do not support 'quality'`
**解决**: 从converter_enhanced.js中移除了quality参数
**状态**: ✅ 已修复

### 2. 外部资源加载
**问题**: SVG中的外部图片无法显示
**解决**: 添加请求拦截器和资源加载等待
**状态**: ✅ 已修复

### 3. 中文字体显示
**问题**: 中文字符显示异常
**解决**: 安装完整的中文字体包和字体回退策略
**状态**: ✅ 已修复

### 4. Git更新冲突
**问题**: update.sh文件冲突导致拉取失败
**解决**: 先删除本地冲突文件再拉取
**状态**: ✅ 已解决

## 📊 性能参数

### 当前运行状态
```
┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ html-to-png-conve… │ fork     │ X    │ online    │ 0%       │ ~80mb    │
└────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### 优化设置
- **最大浏览器实例**: 3个
- **超时时间**: 60秒
- **内存限制**: 1GB
- **文件上传限制**: 10MB

## 🔍 维护命令

### 日常监控
```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs html-to-png-converter

# 重启服务
pm2 restart html-to-png-converter

# 查看系统资源
pm2 monit
```

### 故障排除
```bash
# 检查端口占用
netstat -tlnp | grep 3003

# 检查Nginx状态
sudo systemctl status nginx

# 检查字体安装
fc-list :lang=zh

# 测试API
curl http://localhost:3003/api/health
```

## 📋 待办事项

### 已完成
- [x] 修复PNG quality参数错误
- [x] 增强外部资源加载支持
- [x] 完善中文字体渲染
- [x] 添加Font Awesome图标支持
- [x] 创建一键更新脚本
- [x] 配置域名反向代理

### 可选优化
- [ ] 配置HTTPS证书
- [ ] 添加日志轮转
- [ ] 设置监控告警
- [ ] 优化缓存策略
- [ ] 添加备份脚本

## 📞 重要信息

### 访问地址
- **Web界面**: http://tool.cihebi.vip
- **直接访问**: http://144.34.227.86:3003
- **API文档**: 内置在Web界面中

### 关键文件位置
- **项目根目录**: `/www/wwwroot/tools-all-for-me-main/html-to-png-converter`
- **Nginx配置**: `/etc/nginx/sites-available/html-to-png`
- **PM2配置**: 通过命令行管理
- **日志文件**: PM2自动管理

### 依赖关系
- **GitHub仓库**: https://github.com/cihebi2/tools-all-for-me
- **核心技术**: Node.js + Express + Puppeteer
- **前端框架**: 原生JavaScript + HTML5
- **反向代理**: Nginx
- **进程管理**: PM2

---

**记录时间**: 2025-07-23  
**更新状态**: 服务正常运行，所有功能测试通过  
**下次检查**: 建议每周检查一次服务状态