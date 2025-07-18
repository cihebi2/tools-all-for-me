// 创建应用图标的脚本
// 这是一个临时脚本，用于生成基本图标
// 实际使用时可以替换为专业设计的图标

const fs = require('fs');
const path = require('path');

// 创建SVG图标
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4285f4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a73e8;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 背景圆形 -->
  <circle cx="128" cy="128" r="120" fill="url(#grad1)" stroke="#1565c0" stroke-width="4"/>
  
  <!-- HTML标签 -->
  <rect x="60" y="80" width="136" height="96" rx="8" fill="white" fill-opacity="0.9"/>
  
  <!-- < 符号 -->
  <text x="80" y="130" font-family="monospace" font-size="24" font-weight="bold" fill="#1565c0">&lt;</text>
  
  <!-- HTML -->
  <text x="95" y="130" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">HTML</text>
  
  <!-- > 符号 -->
  <text x="150" y="130" font-family="monospace" font-size="24" font-weight="bold" fill="#1565c0">&gt;</text>
  
  <!-- 箭头 -->
  <path d="M 170 128 L 190 128 M 185 123 L 190 128 L 185 133" stroke="#ff6b35" stroke-width="3" fill="none"/>
  
  <!-- PNG文本 -->
  <text x="200" y="132" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#ff6b35">PNG</text>
  
  <!-- 装饰性像素点 -->
  <rect x="100" y="150" width="8" height="8" fill="#4caf50"/>
  <rect x="112" y="150" width="8" height="8" fill="#ff9800"/>
  <rect x="124" y="150" width="8" height="8" fill="#e91e63"/>
  <rect x="136" y="150" width="8" height="8" fill="#9c27b0"/>
</svg>`;

// 保存SVG图标
fs.writeFileSync(path.join(__dirname, 'icon.svg'), svgIcon);

console.log('SVG图标已创建：assets/icon.svg');
console.log('请使用在线工具或其他软件将SVG转换为ICO和PNG格式：');
console.log('- icon.ico (用于Windows应用)');
console.log('- icon.png (用于Electron应用)');
console.log('推荐在线工具：https://convertio.co/svg-ico/ 或 https://cloudconvert.com/'); 