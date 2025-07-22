#!/bin/bash

# HTML转PNG转换器 - 一键配置外部访问脚本
# 目标: 通过 144.34.227.86:3003 访问服务

echo "🔧 HTML转PNG转换器 - 配置外部访问"
echo "================================="
echo "目标: 开放 144.34.227.86:3003 端口访问"
echo ""

# 检查是否以root权限运行
if [ "$EUID" -ne 0 ]; then
    echo "⚠️ 此脚本需要root权限，请使用 sudo 运行"
    echo "💡 运行: sudo bash setup-external-access.sh"
    exit 1
fi

echo "🔍 检测系统环境..."

# 检测操作系统
if [ -f /etc/debian_version ]; then
    OS="debian"
    echo "✅ 检测到 Debian/Ubuntu 系统"
elif [ -f /etc/redhat-release ]; then
    OS="redhat"
    echo "✅ 检测到 RedHat/CentOS 系统"
else
    OS="unknown"
    echo "⚠️ 未知操作系统，将使用通用方法"
fi

echo ""

# 配置防火墙
echo "🔥 配置防火墙开放3003端口..."

if [ "$OS" = "debian" ]; then
    # Ubuntu/Debian 系统
    if command -v ufw >/dev/null 2>&1; then
        echo "📋 使用UFW配置防火墙..."
        ufw --force enable
        ufw allow 3003/tcp
        ufw reload
        echo "✅ UFW防火墙配置完成"
        
        echo "📊 当前UFW状态:"
        ufw status numbered
    else
        echo "⚠️ UFW未安装，使用iptables..."
        iptables -A INPUT -p tcp --dport 3003 -j ACCEPT
        iptables-save > /etc/iptables/rules.v4 2>/dev/null || iptables-save > /etc/iptables.rules 2>/dev/null
        echo "✅ iptables规则已添加"
    fi
    
elif [ "$OS" = "redhat" ]; then
    # RedHat/CentOS 系统
    if command -v firewall-cmd >/dev/null 2>&1; then
        echo "📋 使用firewalld配置防火墙..."
        systemctl start firewalld
        systemctl enable firewalld
        firewall-cmd --permanent --add-port=3003/tcp
        firewall-cmd --reload
        echo "✅ firewalld配置完成"
        
        echo "📊 当前firewalld状态:"
        firewall-cmd --list-ports
    else
        echo "⚠️ firewalld未安装，使用iptables..."
        iptables -A INPUT -p tcp --dport 3003 -j ACCEPT
        service iptables save 2>/dev/null || iptables-save > /etc/sysconfig/iptables 2>/dev/null
        echo "✅ iptables规则已添加"
    fi
else
    # 通用方法
    echo "📋 使用iptables配置防火墙..."
    iptables -A INPUT -p tcp --dport 3003 -j ACCEPT
    echo "✅ iptables规则已添加"
    echo "⚠️ 请手动保存iptables规则以确保重启后生效"
fi

echo ""

# 检查端口状态
echo "🔍 检查端口监听状态..."
netstat -tlnp | grep 3003
if [ $? -eq 0 ]; then
    echo "✅ 端口3003正在监听"
else
    echo "❌ 端口3003未在监听，尝试启动服务..."
    
    # 切换到项目目录
    cd /www/wwwroot/tools-all-for-me-main/html-to-png-converter 2>/dev/null || cd $(dirname "$0")
    
    # 启动PM2服务
    pm2 start server_clean.js --name html-to-png-converter
    sleep 3
    
    netstat -tlnp | grep 3003
    if [ $? -eq 0 ]; then
        echo "✅ 服务启动成功"
    else
        echo "❌ 服务启动失败，请检查日志"
    fi
fi

echo ""

# 测试本地连接
echo "🔗 测试本地连接..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003 > /tmp/local_test
LOCAL_STATUS=$(cat /tmp/local_test)
if [ "$LOCAL_STATUS" = "200" ]; then
    echo "✅ 本地连接成功 (HTTP $LOCAL_STATUS)"
else
    echo "❌ 本地连接失败 (HTTP $LOCAL_STATUS)"
fi

# 测试外部IP连接
echo "🌐 测试外部IP连接..."
curl -s -o /dev/null -w "%{http_code}" http://144.34.227.86:3003 > /tmp/external_test 2>/dev/null
EXTERNAL_STATUS=$(cat /tmp/external_test)
if [ "$EXTERNAL_STATUS" = "200" ]; then
    echo "✅ 外部连接成功 (HTTP $EXTERNAL_STATUS)"
else
    echo "⚠️ 外部连接失败 (HTTP $EXTERNAL_STATUS)"
    echo "💡 这可能是正常的，因为需要从外部网络测试"
fi

echo ""

# 云服务商安全组提醒
echo "☁️ 云服务商安全组配置提醒"
echo "================================"
echo "⚠️ 重要：仅配置服务器防火墙是不够的！"
echo ""
echo "🔧 您还需要在云服务商控制台配置安全组："
echo "   1. 登录您的云服务商控制台（阿里云/腾讯云/AWS等）"
echo "   2. 找到服务器实例的安全组设置"
echo "   3. 添加入站规则："
echo "      - 协议: TCP"
echo "      - 端口: 3003"
echo "      - 来源: 0.0.0.0/0"
echo "      - 动作: 允许"
echo ""

# 验证结果
echo "🎯 配置完成检查"
echo "==============="
echo "✅ 防火墙配置: 完成"
echo "✅ 服务状态检查: 完成"

if [ "$LOCAL_STATUS" = "200" ]; then
    echo "✅ 本地访问: 正常"
else
    echo "❌ 本地访问: 异常"
fi

echo ""
echo "📋 下一步操作："
echo "1. 配置云服务商安全组（重要！）"
echo "2. 在浏览器访问: http://144.34.227.86:3003"
echo "3. 如果无法访问，运行检查脚本: bash check-server.sh"
echo ""

echo "📝 详细文档: cloud-server-setup.md"
echo "🏥 健康检查: http://144.34.227.86:3003/api/health"
echo ""

echo "✅ 配置脚本执行完成！"

# 清理临时文件
rm -f /tmp/local_test /tmp/external_test 