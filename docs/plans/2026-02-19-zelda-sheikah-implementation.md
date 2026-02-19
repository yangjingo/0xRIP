# 0xRIP × 旷野之息 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 0xRIP 的视觉风格从 CYBER NECROPOLIS 转变为像素场景 + 旷野之息UI

**Architecture:** 使用 Three.js 后处理实现 3D 场景像素化，重写 CSS 实现希卡石板风格 UI，保留现有命令系统和数据模型

**Tech Stack:** Three.js, EffectComposer, 自定义 GLSL 着色器, CSS Variables, Google Fonts

---

## Task 1: 设置希卡配色系统

**Files:**
- Modify: `src/style.css:1-50` (CSS 变量部分)

**Step 1: 替换 CSS 变量为希卡配色**

在 `src/style.css` 顶部找到 `:root` 部分，替换为：

```css
:root {
  /* 希卡科技配色 */
  --color-bg-deep: #0a0e1a;
  --color-bg-panel: #1a2035;
  --color-bg-card: #232b45;
  --color-accent-gold: #c9a227;
  --color-accent-cyan: #4fd1c5;
  --color-accent-orange: #f5a623;
  --color-text-primary: #e8e4d9;
  --color-text-secondary: #6b7280;
  --color-text-muted: #4a5568;

  /* 保留兼容性别名 */
  --neon-cyan: var(--color-accent-cyan);
  --neon-pink: var(--color-accent-gold);
  --neon-purple: var(--color-accent-orange);
  --dark-bg: var(--color-bg-deep);
  --darker-bg: var(--color-bg-panel);
}

* {
  box-sizing: border-box;
}
```

**Step 2: 验证页面加载正常**

Run: `npm run dev`
Expected: 页面正常加载，颜色变为希卡风格

**Step 3: Commit**

```bash
git add src/style.css
git commit -m "style: 替换为希卡科技配色系统"
```

---

## Task 2: 引入旷野之息风格字体

**Files:**
- Modify: `src/style.css:50-80` (字体部分)
- Modify: `index.html` (添加 Google Fonts 链接)

**Step 1: 在 index.html 的 `<head>` 中添加字体链接**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Quicksand:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Step 2: 更新 CSS 字体定义**

在 `src/style.css` 中找到 `body` 样式，替换为：

```css
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  background: var(--color-bg-deep);
  font-family: 'Quicksand', sans-serif;
  color: var(--color-text-primary);
  line-height: 1.6;
}

/* 标题字体 */
.font-display {
  font-family: 'Cinzel Decorative', serif;
}

/* 等宽字体（终端用） */
.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

**Step 3: 验证字体加载**

Run: `npm run dev`
Expected: 页面使用新字体，标题用 Cinzel Decorative，正文用 Quicksand

**Step 4: Commit**

```bash
git add index.html src/style.css
git commit -m "style: 引入旷野之息风格字体 (Cinzel/Quicksand/JetBrains)"
```

---

## Task 3: 创建像素化后处理着色器

**Files:**
- Create: `src/shaders/pixelate.ts`

**Step 1: 创建像素化着色器文件**

```typescript
// src/shaders/pixelate.ts

export const pixelateVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const pixelateFragmentShader = `
uniform sampler2D tDiffuse;
uniform float pixelSize;
uniform vec2 resolution;
uniform float colorDepth;

varying vec2 vUv;

void main() {
  // 像素化
  vec2 pixelUv = floor(vUv * resolution / pixelSize) * pixelSize / resolution;

  // 采样
  vec4 color = texture2D(tDiffuse, pixelUv);

  // 色带减少 (posterization)
  color.rgb = floor(color.rgb * colorDepth) / colorDepth;

  gl_FragColor = color;
}
`;
```

**Step 2: 验证文件创建**

Run: `ls src/shaders/`
Expected: `pixelate.ts` 存在

**Step 3: Commit**

```bash
git add src/shaders/pixelate.ts
git commit -m "feat: 添加像素化后处理着色器"
```

---

## Task 4: 集成像素化后处理到 Three.js

**Files:**
- Modify: `src/main.ts` (场景渲染部分)

**Step 1: 安装后处理依赖**

Run: `npm install three-stdlib`
Expected: 安装成功

**Step 2: 在 main.ts 顶部添加导入**

```typescript
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { ShaderPass } from 'three-stdlib';
import { pixelateVertexShader, pixelateFragmentShader } from './shaders/pixelate';
```

**Step 3: 在场景初始化后添加后处理**

在 `init()` 函数的 `renderer` 创建之后添加：

```typescript
// 像素化后处理
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const pixelatePass = new ShaderPass({
  uniforms: {
    tDiffuse: { value: null },
    pixelSize: { value: 4.0 },
    resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    colorDepth: { value: 32.0 }
  },
  vertexShader: pixelateVertexShader,
  fragmentShader: pixelateFragmentShader
});
composer.addPass(pixelatePass);

// 替换原来的 renderer.render 为 composer.render
```

**Step 4: 修改渲染循环**

将 `animate()` 函数中的 `renderer.render(scene, camera)` 替换为 `composer.render()`

**Step 5: 验证像素化效果**

Run: `npm run dev`
Expected: 3D 场景显示像素化效果

**Step 6: Commit**

```bash
git add package.json package-lock.json src/main.ts
git commit -m "feat: 集成 Three.js 像素化后处理"
```

---

## Task 5: 重写 UI 基础组件样式

**Files:**
- Modify: `src/style.css` (UI 组件部分)

**Step 1: 添加希卡风格基础类**

在 `src/style.css` 末尾添加：

```css
/* ===== 希卡风格基础组件 ===== */

/* 希卡面板 */
.sheikah-panel {
  background: linear-gradient(135deg,
    rgba(26, 32, 53, 0.95) 0%,
    rgba(10, 14, 26, 0.98) 100%);
  border: 1px solid var(--color-accent-gold);
  border-radius: 12px;
  box-shadow:
    0 0 20px rgba(201, 162, 39, 0.1),
    inset 0 1px 0 rgba(201, 162, 39, 0.1);
  backdrop-filter: blur(10px);
}

/* 希卡按钮 */
.sheikah-btn {
  background: transparent;
  border: 1px solid var(--color-accent-gold);
  color: var(--color-accent-gold);
  padding: 10px 20px;
  border-radius: 8px;
  font-family: 'Quicksand', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.sheikah-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: radial-gradient(circle, rgba(201, 162, 39, 0.3) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.sheikah-btn:hover::before {
  width: 200%;
  height: 200%;
}

.sheikah-btn:hover {
  background: rgba(201, 162, 39, 0.1);
  box-shadow: 0 0 15px rgba(201, 162, 39, 0.3);
}

.sheikah-btn:active {
  transform: scale(0.98);
}

/* 希卡输入框 */
.sheikah-input {
  background: rgba(10, 14, 26, 0.8);
  border: 1px solid rgba(201, 162, 39, 0.3);
  color: var(--color-text-primary);
  padding: 12px 16px;
  border-radius: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  width: 100%;
  transition: all 0.3s ease;
}

.sheikah-input:focus {
  outline: none;
  border-color: var(--color-accent-gold);
  box-shadow: 0 0 10px rgba(201, 162, 39, 0.2);
}

.sheikah-input::placeholder {
  color: var(--color-text-muted);
}

/* 希卡装饰边框 */
.sheikah-border {
  position: relative;
}

.sheikah-border::before,
.sheikah-border::after {
  content: '◇';
  position: absolute;
  color: var(--color-accent-gold);
  font-size: 12px;
}

.sheikah-border::before {
  top: -6px;
  left: -6px;
}

.sheikah-border::after {
  bottom: -6px;
  right: -6px;
}
```

**Step 2: 验证样式可用**

Run: `npm run dev`
Expected: 页面加载无报错，新样式类可用

**Step 3: Commit**

```bash
git add src/style.css
git commit -m "style: 添加希卡风格基础 UI 组件"
```

---

## Task 6: 重写终端组件

**Files:**
- Modify: `src/style.css` (终端样式部分)
- Modify: `index.html` (终端 HTML 结构)

**Step 1: 更新终端 CSS**

在 `src/style.css` 中找到 `#terminal` 相关样式，替换为：

```css
/* ===== 希卡终端 ===== */
#terminal {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 400px;
  max-height: 300px;
  z-index: 100;
}

.terminal-container {
  background: linear-gradient(180deg,
    rgba(26, 32, 53, 0.98) 0%,
    rgba(10, 14, 26, 0.99) 100%);
  border: 1px solid var(--color-accent-gold);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 30px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(201, 162, 39, 0.1);
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background: rgba(201, 162, 39, 0.1);
  border-bottom: 1px solid rgba(201, 162, 39, 0.2);
}

.terminal-header .logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Cinzel Decorative', serif;
  color: var(--color-accent-gold);
  font-size: 14px;
}

.terminal-header .logo::before {
  content: '◇';
  font-size: 16px;
}

.terminal-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 15px;
  background: rgba(10, 14, 26, 0.5);
}

.terminal-tab {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terminal-tab.active {
  background: rgba(201, 162, 39, 0.1);
  border-color: var(--color-accent-gold);
  color: var(--color-accent-gold);
}

.terminal-output {
  padding: 15px;
  max-height: 150px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.terminal-output::-webkit-scrollbar {
  width: 6px;
}

.terminal-output::-webkit-scrollbar-track {
  background: rgba(10, 14, 26, 0.5);
}

.terminal-output::-webkit-scrollbar-thumb {
  background: var(--color-accent-gold);
  border-radius: 3px;
}

.terminal-input-container {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: rgba(10, 14, 26, 0.8);
  border-top: 1px solid rgba(201, 162, 39, 0.2);
}

.terminal-prompt {
  color: var(--color-accent-cyan);
  margin-right: 8px;
  font-family: 'JetBrains Mono', monospace;
}

.terminal-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  outline: none;
}
```

**Step 2: 更新 HTML 终端结构**

在 `index.html` 中找到 `#terminal` 部分，替换为：

```html
<!-- 希卡终端 -->
<div id="terminal">
  <div class="terminal-container">
    <div class="terminal-header">
      <span class="logo">0xRIP TERMINAL</span>
      <div class="terminal-controls">
        <span class="control minimize">─</span>
        <span class="control maximize">□</span>
      </div>
    </div>
    <div class="terminal-tabs">
      <button class="terminal-tab active" data-mode="cli">命令行</button>
      <button class="terminal-tab" data-mode="gui">图形界面</button>
    </div>
    <div class="terminal-output" id="terminal-output">
      <div class="output-line">◇ 欢迎来到 0xRIP 数字墓地</div>
      <div class="output-line">◇ 输入 HELP 查看可用命令</div>
    </div>
    <div class="terminal-input-container">
      <span class="terminal-prompt">></span>
      <input type="text" class="terminal-input" id="terminal-input" placeholder="输入命令..." autocomplete="off">
    </div>
  </div>
</div>
```

**Step 3: 验证终端显示**

Run: `npm run dev`
Expected: 终端显示希卡风格，有命令行/图形界面标签

**Step 4: Commit**

```bash
git add src/style.css index.html
git commit -m "style: 重写终端为希卡石板风格，支持双模式切换"
```

---

## Task 7: 重写状态栏 HUD

**Files:**
- Modify: `src/style.css` (状态栏样式)
- Modify: `index.html` (状态栏结构)

**Step 1: 更新状态栏 CSS**

```css
/* ===== 希卡状态栏 ===== */
#status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: linear-gradient(180deg,
    rgba(10, 14, 26, 0.95) 0%,
    rgba(10, 14, 26, 0.8) 100%);
  border-bottom: 1px solid rgba(201, 162, 39, 0.3);
  z-index: 200;
}

.status-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Cinzel Decorative', serif;
  font-size: 18px;
  color: var(--color-accent-gold);
}

.status-brand::before {
  content: '◇';
  font-size: 20px;
}

.status-stats {
  display: flex;
  align-items: center;
  gap: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.stat-label {
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 10px;
}

.stat-value {
  color: var(--color-text-primary);
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}

.stat-icon {
  color: var(--color-accent-gold);
  font-size: 14px;
}
```

**Step 2: 更新状态栏 HTML**

```html
<!-- 状态栏 -->
<div id="status-bar">
  <div class="status-brand">0xRIP</div>
  <div class="status-stats">
    <div class="stat-item">
      <span class="stat-icon">◇</span>
      <span class="stat-label">SOULS</span>
      <span class="stat-value" id="stat-souls">0</span>
    </div>
    <div class="stat-item">
      <span class="stat-icon">◇</span>
      <span class="stat-label">TIME</span>
      <span class="stat-value" id="stat-time">00:00</span>
    </div>
    <div class="stat-item">
      <span class="stat-icon">◇</span>
      <span class="stat-label">FPS</span>
      <span class="stat-value" id="stat-fps">60</span>
    </div>
  </div>
</div>
```

**Step 3: 验证状态栏**

Run: `npm run dev`
Expected: 顶部显示希卡风格状态栏

**Step 4: Commit**

```bash
git add src/style.css index.html
git commit -m "style: 重写状态栏为希卡风格"
```

---

## Task 8: 添加希卡符文装饰动画

**Files:**
- Modify: `src/style.css` (动画部分)

**Step 1: 添加希卡符文动画**

```css
/* ===== 希卡符文动画 ===== */

/* 符文发光脉冲 */
@keyframes sheikah-glow {
  0%, 100% {
    opacity: 0.6;
    filter: drop-shadow(0 0 5px var(--color-accent-gold));
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 15px var(--color-accent-gold));
  }
}

/* 符文旋转 */
@keyframes sheikah-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 激活闪光 */
@keyframes sheikah-activate {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

/* 打字机效果 */
@keyframes typewriter {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* 面板滑入 */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-left {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 应用动画的类 */
.animate-glow {
  animation: sheikah-glow 2s ease-in-out infinite;
}

.animate-rotate {
  animation: sheikah-rotate 10s linear infinite;
}

.animate-activate {
  animation: sheikah-activate 0.5s ease-out;
}

.animate-slide-right {
  animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-left {
  animation: slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

**Step 2: 验证动画**

Run: `npm run dev`
Expected: 页面加载无报错，动画类可用

**Step 3: Commit**

```bash
git add src/style.css
git commit -m "style: 添加希卡符文装饰动画"
```

---

## Task 9: 更新加载屏幕

**Files:**
- Modify: `src/style.css` (加载屏幕样式)
- Modify: `index.html` (加载屏幕结构)

**Step 1: 更新加载屏幕 CSS**

```css
/* ===== 希卡加载屏幕 ===== */
#loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--color-bg-deep);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  transition: opacity 0.5s ease;
}

.loader-content {
  text-align: center;
}

.loader-logo {
  font-family: 'Cinzel Decorative', serif;
  font-size: 48px;
  color: var(--color-accent-gold);
  margin-bottom: 30px;
  position: relative;
}

.loader-logo::before,
.loader-logo::after {
  content: '◇';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  animation: sheikah-glow 2s ease-in-out infinite;
}

.loader-logo::before {
  left: -40px;
}

.loader-logo::after {
  right: -40px;
}

.loader-progress {
  width: 300px;
  height: 4px;
  background: rgba(201, 162, 39, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.loader-progress-bar {
  height: 100%;
  width: 0%;
  background: linear-gradient(90deg,
    var(--color-accent-gold) 0%,
    var(--color-accent-cyan) 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.loader-text {
  margin-top: 20px;
  font-size: 14px;
  color: var(--color-text-secondary);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 加载完成隐藏 */
#loader.hidden {
  opacity: 0;
  pointer-events: none;
}
```

**Step 2: 更新加载屏幕 HTML**

```html
<!-- 加载屏幕 -->
<div id="loader">
  <div class="loader-content">
    <div class="loader-logo">0xRIP</div>
    <div class="loader-progress">
      <div class="loader-progress-bar" id="loader-progress"></div>
    </div>
    <div class="loader-text">正在唤醒数字墓地...</div>
  </div>
</div>
```

**Step 3: 验证加载屏幕**

Run: `npm run dev`
Expected: 显示希卡风格加载屏幕，带金色进度条

**Step 4: Commit**

```bash
git add src/style.css index.html
git commit -m "style: 更新加载屏幕为希卡风格"
```

---

## Task 10: 移除旧 CRT 效果

**Files:**
- Modify: `src/style.css` (移除 scanlines 等)
- Modify: `index.html` (移除 scanlines 元素)

**Step 1: 删除 CRT 相关 CSS**

在 `src/style.css` 中找到并删除：
- `.scanlines` 类
- `@keyframes scanline` 动画
- 任何 `crt-` 前缀的样式

**Step 2: 删除 HTML 中的 scanlines 元素**

在 `index.html` 中删除 `<div class="scanlines"></div>` (如果存在)

**Step 3: 验证无 CRT 效果**

Run: `npm run dev`
Expected: 页面无扫描线效果

**Step 4: Commit**

```bash
git add src/style.css index.html
git commit -m "style: 移除旧 CRT 扫描线效果"
```

---

## Task 11: 最终验证和调整

**Step 1: 完整功能测试**

Run: `npm run dev`

测试清单：
- [ ] 页面正常加载，显示希卡风格
- [ ] 3D 场景显示像素化效果
- [ ] 终端可输入命令
- [ ] 状态栏显示正常
- [ ] 所有命令（BURY, SUMMON, MOURN, LIST, DECAY, DOOM）正常工作
- [ ] WASD 相机控制正常
- [ ] F 键全屏正常

**Step 2: 响应式测试**

调整浏览器窗口大小，验证：
- [ ] 像素化效果自适应
- [ ] 终端不超出屏幕
- [ ] 状态栏正常显示

**Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: 完成 0xRIP × 旷野之息视觉风格重设计

- 希卡科技配色系统（深蓝黑 + 琥珀金/青色）
- Three.js 像素化后处理
- 旷野之息风格 UI 组件
- 双模式终端（命令行/图形界面）
- 希卡符文动画效果

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

## 执行顺序总结

```
Task 1  → 配色系统
Task 2  → 字体
Task 3  → 像素化着色器
Task 4  → Three.js 集成
Task 5  → UI 基础组件
Task 6  → 终端
Task 7  → 状态栏
Task 8  → 动画
Task 9  → 加载屏幕
Task 10 → 清理旧样式
Task 11 → 最终验证
```

---

*计划创建日期: 2026-02-19*
