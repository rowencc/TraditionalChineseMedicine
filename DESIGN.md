# 岐黄小识 设计系统

## 设计理念

"岐黄小识"取自岐伯与黄帝，为中医代称。"小识"意为学习笔记，谦逊而有学术气质。

设计风格：**现代极简 + 传统点缀**

核心原则：
1. 实用性优先 - 功能清晰，操作便捷
2. 传统元素点缀 - 云纹、水墨、经卷感，但不喧宾夺主
3. 留白呼吸 - 大量留白，信息层次清晰
4. 温润质感 - 宣纸色背景，如翻阅古籍

## 色彩系统

```css
:root {
  /* 主色 - 朱砂红 */
  --primary: #8B2500;
  --primary-light: #A63A1E;
  --primary-dark: #6B1D00;
  --primary-bg: rgba(139, 37, 0, 0.06);

  /* 辅色 - 青玉绿 */
  --secondary: #2D5F4A;
  --secondary-light: #3D7A62;
  --secondary-bg: rgba(45, 95, 74, 0.06);

  /* 点缀 - 金箔色 */
  --accent: #B8860B;
  --accent-light: #D4A017;

  /* 背景 - 宣纸色 */
  --bg-base: #F5F0E8;
  --bg-card: #FFFFFF;
  --bg-elevated: #FAFAF7;

  /* 文字 - 墨色 */
  --text-primary: #2C2C2C;
  --text-secondary: #666666;
  --text-muted: #999999;

  /* 边框 */
  --border: #E8E0D4;
  --border-light: #F0EBE3;
}
```

## 字体系统

```css
/* 标题字体 - 宋体/明体风格 */
font-family: 'Noto Serif SC', 'Source Han Serif SC', 'SimSun', serif;

/* 正文字体 - 黑体/无衬线 */
font-family: 'Noto Sans SC', 'Source Han Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;

/* 数据字体 - 等宽 */
font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
```

## 布局规范

- 最大宽度：1200px
- 卡片间距：16rpx
- 内边距：24rpx
- 圆角：12rpx（卡片）/ 8rpx（按钮）

## 组件规范

### 卡片
- 背景：白色
- 阴影：0 2rpx 12rpx rgba(0,0,0,0.04)
- 圆角：12rpx
- 悬停：translateY(-2rpx) + 阴影加深

### 按钮
- 主按钮：朱砂红背景，白色文字
- 次按钮：透明背景，朱砂红边框
- 圆角：8rpx

### 标签
- 六经标签：对应颜色背景
- 分类标签：浅色背景 + 深色文字

## 传统元素

1. **云纹背景** - 首页hero区域使用淡雅云纹
2. **水墨分隔线** - 使用渐变代替实线
3. **经卷标题** - 标题区域使用书卷装饰
4. **印章元素** - 重要信息使用印章样式
