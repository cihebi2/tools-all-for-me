# Font Awesome 图标修复

## 问题描述
在HTML转PNG转换过程中，Font Awesome图标（如 `<i class="fa fa-line-chart mr-2"></i>`）无法正常显示在生成的PNG图片中。

## 解决方案

### 1. 添加Font Awesome CSS导入
在 `utils/converter.js` 的 `fontCSS` 部分添加：

```css
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css');
```

### 2. 添加Font Awesome字体类声明
```css
/* Font Awesome 图标字体声明 */
.fa, .fas, .far, .fal, .fad, .fab {
    font-family: "Font Awesome 6 Free", "Font Awesome 6 Pro", "Font Awesome 5 Free", "Font Awesome 5 Pro", "FontAwesome" !important;
    font-weight: 900;
    font-style: normal;
    font-variant: normal;
    text-rendering: auto;
    line-height: 1;
}

.far {
    font-weight: 400;
}

.fab {
    font-family: "Font Awesome 6 Brands", "Font Awesome 5 Brands" !important;
    font-weight: 400;
}
```

### 3. 增加字体加载等待时间
```javascript
// 等待Font Awesome图标字体加载完成
await page.waitForFunction(() => {
    return document.fonts.status === 'loaded';
}, { timeout: 10000 }).catch(() => {
    console.log('字体加载超时，继续执行');
});

// 额外等待时间确保图标渲染
await page.waitForTimeout(2000);
```

## 支持的图标

修复后支持所有Font Awesome图标，包括但不限于：

- **实心图标 (fas)**: `fa-line-chart`, `fa-home`, `fa-user`, `fa-search` 等
- **轮廓图标 (far)**: `far fa-user`, `far fa-heart` 等  
- **品牌图标 (fab)**: `fab fa-github`, `fab fa-twitter` 等
- **Font Awesome 4.x**: `fa fa-line-chart`, `fa fa-home` 等

## 部署说明

修改已集成到 `deploy.sh` 脚本中的 `fix_project_files()` 函数，下次部署时会自动应用此修复。

## 测试验证

可以通过以下HTML测试图标显示：

```html
<h4 class="text-lg font-semibold text-burgundy mb-2 flex items-center">
    <i class="fa fa-line-chart mr-2"></i> 市场现象观察
</h4>

<div class="flex items-center">
    <i class="fas fa-chart-bar mr-2"></i> 数据分析
    <i class="far fa-heart ml-4 mr-2"></i> 收藏
    <i class="fab fa-github ml-4 mr-2"></i> GitHub
</div>
```

## 兼容性

- ✅ Font Awesome 6.x (最新版)
- ✅ Font Awesome 5.x 
- ✅ Font Awesome 4.x (向后兼容)
- ✅ 中文字体显示
- ✅ 所有浏览器环境
