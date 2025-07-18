# 应用图标说明

## 图标文件

这个文件夹包含应用的图标文件：

- `icon.svg` - SVG格式的源图标文件
- `icon.png` - PNG格式图标（需要创建）
- `icon.ico` - ICO格式图标（需要创建）

## 创建图标

1. **使用现有的SVG图标**：
   - 已生成 `icon.svg` 文件
   - 这是一个蓝色渐变背景的圆形图标，包含HTML转PNG的元素

2. **转换为PNG和ICO格式**：
   - 访问 https://convertio.co/svg-png/ 将SVG转换为PNG（建议256x256像素）
   - 访问 https://convertio.co/png-ico/ 将PNG转换为ICO格式
   - 或者使用 https://cloudconvert.com/

3. **文件命名**：
   - 将转换后的文件保存为 `icon.png` 和 `icon.ico`
   - 确保文件放在 `assets/` 文件夹中

## 临时解决方案

如果暂时无法创建图标文件，可以：
1. 下载任意PNG图标文件并重命名为 `icon.png`
2. 使用Windows默认的应用图标
3. 稍后替换为专业设计的图标

## 图标要求

- **PNG格式**：256x256像素，透明背景
- **ICO格式**：包含多种尺寸（16x16, 32x32, 48x48, 256x256）
- **设计建议**：简洁明了，能够清楚表达HTML转PNG的功能 