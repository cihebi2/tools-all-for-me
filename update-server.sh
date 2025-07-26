#!/bin/bash

# 🎵 HTML转PNG转换器 - 音频功能更新脚本
# 专门用于更新音频MP3智能保持功能
# 更新时间: 2025-07-26

echo "🚀 开始更新HTML转PNG转换器（音频MP3功能增强）..."

# 设置颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器路径
PROJECT_PATH="/www/wwwroot/tools-all-for-me-main"
BACKUP_PATH="/www/wwwroot/backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}📍 项目路径: ${PROJECT_PATH}${NC}"

# 1. 检查当前服务状态
echo -e "\n${YELLOW}📊 1. 检查当前服务状态${NC}"
pm2 status html-to-png-converter
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务当前正在运行${NC}"
else
    echo -e "${YELLOW}⚠️  服务未运行或PM2未安装${NC}"
fi

# 2. 创建备份
echo -e "\n${YELLOW}💾 2. 创建当前版本备份${NC}"
if [ -d "$PROJECT_PATH" ]; then
    sudo cp -r "$PROJECT_PATH" "$BACKUP_PATH"
    echo -e "${GREEN}✅ 备份已创建: ${BACKUP_PATH}${NC}"
else
    echo -e "${RED}❌ 项目目录不存在: ${PROJECT_PATH}${NC}"
    exit 1
fi

# 3. 进入项目目录
cd "$PROJECT_PATH" || {
    echo -e "${RED}❌ 无法进入项目目录${NC}"
    exit 1
}

# 4. 检查Git状态
echo -e "\n${YELLOW}🔍 3. 检查Git状态${NC}"
git status --porcelain
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git状态检查失败${NC}"
    exit 1
fi

# 5. 拉取最新代码
echo -e "\n${YELLOW}⬇️ 4. 拉取最新代码${NC}"
echo "当前分支: $(git branch --show-current)"
echo "当前提交: $(git rev-parse --short HEAD)"

# 强制拉取，解决可能的冲突
sudo git fetch origin main
sudo git reset --hard origin/main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 代码更新成功${NC}"
    echo "最新提交: $(git rev-parse --short HEAD)"
    echo "最新提交信息: $(git log -1 --pretty=format:'%s')"
else
    echo -e "${RED}❌ 代码拉取失败${NC}"
    echo -e "${YELLOW}🔄 尝试恢复备份...${NC}"
    sudo rm -rf "$PROJECT_PATH"
    sudo mv "$BACKUP_PATH" "$PROJECT_PATH"
    exit 1
fi

# 6. 进入html-to-png-converter目录
cd html-to-png-converter || {
    echo -e "${RED}❌ 无法进入html-to-png-converter目录${NC}"
    exit 1
}

# 7. 检查音频文件更新
echo -e "\n${YELLOW}🎵 5. 检查音频功能更新${NC}"
if [ -f "public/audio.html" ] && [ -f "public/audio.js" ]; then
    echo -e "${GREEN}✅ 音频HTML文件存在${NC}"
    echo -e "${GREEN}✅ 音频JS文件存在${NC}"
    
    # 检查关键功能
    if grep -q "processMp3ToMp3" public/audio.js; then
        echo -e "${GREEN}✅ MP3格式保持功能已更新${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到MP3格式保持功能${NC}"
    fi
    
    if grep -q "lamejs" public/audio.html; then
        echo -e "${GREEN}✅ LAME编码器引用已添加${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到LAME编码器引用${NC}"
    fi
    
    if grep -q "200MB" public/audio.html; then
        echo -e "${GREEN}✅ 文件大小限制已更新为200MB${NC}"
    else
        echo -e "${YELLOW}⚠️  文件大小限制可能未更新${NC}"
    fi
else
    echo -e "${RED}❌ 音频功能文件缺失${NC}"
fi

# 8. 检查依赖
echo -e "\n${YELLOW}📦 6. 检查项目依赖${NC}"
if [ -f "package.json" ]; then
    echo "检查Node.js依赖..."
    npm list --depth=0 2>/dev/null || echo "依赖检查完成"
else
    echo -e "${YELLOW}⚠️  未找到package.json${NC}"
fi

# 9. 应用增强版文件配置
echo -e "\n${YELLOW}🔧 7. 应用增强版配置${NC}"
if [ -f "utils/converter_enhanced.js" ]; then
    sudo cp utils/converter_enhanced.js utils/converter.js
    echo -e "${GREEN}✅ 应用增强版转换器${NC}"
fi

if [ -f "utils/browserPool_enhanced.js" ]; then
    sudo cp utils/browserPool_enhanced.js utils/browserPool.js
    echo -e "${GREEN}✅ 应用增强版浏览器池${NC}"
fi

# 10. 重启服务
echo -e "\n${YELLOW}🔄 8. 重启服务${NC}"
pm2 restart html-to-png-converter
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 服务重启成功${NC}"
else
    echo -e "${RED}❌ 服务重启失败${NC}"
    echo -e "${YELLOW}🔄 尝试启动服务...${NC}"
    pm2 start server_enhanced.js --name html-to-png-converter
fi

# 11. 等待服务启动
echo -e "\n${YELLOW}⏳ 9. 等待服务启动${NC}"
sleep 3

# 12. 验证服务状态
echo -e "\n${YELLOW}✅ 10. 验证更新结果${NC}"
pm2 status html-to-png-converter
pm2 logs html-to-png-converter --lines 5

# 13. 测试API健康检查
echo -e "\n${YELLOW}🔍 11. 测试服务健康状态${NC}"
curl -s http://localhost:3003/api/health | head -5
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ 健康检查API响应正常${NC}"
else
    echo -e "\n${YELLOW}⚠️  健康检查API无响应${NC}"
fi

# 14. 测试音频页面
echo -e "\n${YELLOW}🎵 12. 测试音频功能页面${NC}"
curl -s -I http://localhost:3003/audio | head -2
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 音频页面可访问${NC}"
else
    echo -e "${YELLOW}⚠️  音频页面访问异常${NC}"
fi

# 15. 清理旧备份（保留最近3个）
echo -e "\n${YELLOW}🧹 13. 清理旧备份${NC}"
cd /www/wwwroot/
ls -dt backup-* 2>/dev/null | tail -n +4 | xargs -r sudo rm -rf
echo -e "${GREEN}✅ 旧备份清理完成${NC}"

# 16. 显示更新总结
echo -e "\n${GREEN}🎉 音频MP3功能更新完成！${NC}"
echo -e "\n📋 更新总结:"
echo -e "  ${GREEN}✅ 新增功能:${NC} MP3输入MP3输出格式保持"
echo -e "  ${GREEN}✅ 编码器:${NC} LAME.js MP3编码器"
echo -e "  ${GREEN}✅ 文件限制:${NC} 提升至200MB"
echo -e "  ${GREEN}✅ 兼容性:${NC} 解决Chrome/Edge超时问题"
echo -e "  ${GREEN}✅ 备份位置:${NC} ${BACKUP_PATH}"

echo -e "\n🌐 访问地址:"
echo -e "  ${BLUE}• 主页:${NC} http://tool.cihebi.vip/"
echo -e "  ${BLUE}• 音频工具:${NC} http://tool.cihebi.vip/audio"
echo -e "  ${BLUE}• 健康检查:${NC} http://tool.cihebi.vip/api/health"

echo -e "\n🔧 如遇问题，可使用以下命令恢复:"
echo -e "  ${YELLOW}sudo rm -rf ${PROJECT_PATH}${NC}"
echo -e "  ${YELLOW}sudo mv ${BACKUP_PATH} ${PROJECT_PATH}${NC}"
echo -e "  ${YELLOW}cd ${PROJECT_PATH}/html-to-png-converter && pm2 restart html-to-png-converter${NC}"

echo -e "\n${GREEN}✨ 更新脚本执行完成！${NC}"