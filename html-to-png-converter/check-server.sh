#!/bin/bash

# HTML转PNG转换器 - 云服务器状态检查脚本
# 服务器IP: 144.34.227.86
# 端口: 3003

echo "🚀 HTML转PNG转换器 - 服务器状态检查"
echo "======================================"
echo "服务器IP: 144.34.227.86"
echo "服务端口: 3003"
echo ""

# 检查PM2服务状态
echo "📊 检查PM2服务状态..."
pm2 list | grep html-to-png
if [ $? -eq 0 ]; then
    echo "✅ PM2服务运行正常"
else
    echo "❌ PM2服务未运行"
    echo "💡 尝试启动服务: pm2 start server_clean.js --name html-to-png-converter"
fi
echo ""

# 检查端口监听状态
echo "🔍 检查端口监听状态..."
netstat -tlnp | grep 3003
if [ $? -eq 0 ]; then
    echo "✅ 端口3003正在监听"
    LISTEN_ADDR=$(netstat -tlnp | grep 3003 | awk '{print $4}')
    if [[ $LISTEN_ADDR == "0.0.0.0:3003" ]]; then
        echo "✅ 监听地址正确 (0.0.0.0:3003)"
    else
        echo "⚠️ 监听地址: $LISTEN_ADDR"
        echo "💡 建议监听地址应为 0.0.0.0:3003"
    fi
else
    echo "❌ 端口3003未在监听"
fi
echo ""

# 测试本地连接
echo "🔗 测试本地连接..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003 > /tmp/http_status
HTTP_STATUS=$(cat /tmp/http_status)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 本地连接成功 (HTTP $HTTP_STATUS)"
else
    echo "❌ 本地连接失败 (HTTP $HTTP_STATUS)"
fi
echo ""

# 测试API健康检查
echo "🏥 测试API健康检查..."
curl -s http://localhost:3003/api/health > /tmp/health_check
if [ $? -eq 0 ]; then
    echo "✅ API健康检查通过"
    cat /tmp/health_check | python3 -m json.tool 2>/dev/null || cat /tmp/health_check
else
    echo "❌ API健康检查失败"
fi
echo ""

# 检查防火墙状态
echo "🔥 检查防火墙状态..."
if command -v ufw >/dev/null 2>&1; then
    echo "UFW防火墙状态:"
    sudo ufw status | grep 3003
    if [ $? -eq 0 ]; then
        echo "✅ UFW已开放3003端口"
    else
        echo "⚠️ UFW未发现3003端口规则"
        echo "💡 运行: sudo ufw allow 3003/tcp"
    fi
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "Firewalld防火墙状态:"
    sudo firewall-cmd --list-ports | grep 3003
    if [ $? -eq 0 ]; then
        echo "✅ Firewalld已开放3003端口"
    else
        echo "⚠️ Firewalld未发现3003端口规则"
        echo "💡 运行: sudo firewall-cmd --permanent --add-port=3003/tcp && sudo firewall-cmd --reload"
    fi
else
    echo "⚠️ 未检测到常见防火墙工具"
    echo "💡 请手动检查iptables规则"
fi
echo ""

# 检查系统资源
echo "💾 系统资源使用情况..."
echo "内存使用:"
free -h | head -2
echo ""
echo "磁盘使用:"
df -h | head -2
echo ""

# 检查服务日志
echo "📋 最近服务日志 (最后10行)..."
pm2 logs html-to-png-converter --lines 10 --nostream
echo ""

# 网络连接测试建议
echo "🌐 外部访问测试建议..."
echo "1. 在本地电脑执行: curl -I http://144.34.227.86:3003"
echo "2. 浏览器访问: http://144.34.227.86:3003"
echo "3. 如果无法访问，请检查云服务商安全组设置"
echo ""

# 快速修复建议
echo "🔧 快速修复建议..."
echo "如果服务无法从外部访问，按顺序执行："
echo "1. sudo ufw allow 3003/tcp"
echo "2. 配置云服务商安全组开放3003端口"
echo "3. pm2 restart html-to-png-converter"
echo "4. 再次运行此检查脚本"
echo ""

echo "✅ 检查完成！"
echo "📝 详细部署指南请查看: cloud-server-setup.md"

# 清理临时文件
rm -f /tmp/http_status /tmp/health_check 