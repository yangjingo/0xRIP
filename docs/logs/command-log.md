# 开发日志

## [2025-02-07]

### 实现功能
- 基于 README 中的「赛博墓地」风格，用 **TypeScript + Three.js** 搭建前端项目。
- 使用 Vite 构建，入口为 `index.html`，主逻辑在 `src/main.ts`，样式在 `src/style.css`。
- Three.js 场景：霓虹青/粉灯光、地面网格、墓碑（黑金属盒体 + 线框 + Canvas 铭牌）、幽灵（粒子人形 + 霓虹粉线框核心），含动画与鼠标跟随。
- UI 层：CRT 扫描线、Glitch 标题、赛博边框/输入/按钮、打字机对话、发送与幽灵点击交互。
- 在 **UI 交互规范**（`docs/ui-interaction.md`）中新增 **第七章：视觉风格规范（赛博墓地 CYBER NECROPOLIS）**，统一色彩、字体、CRT/Glitch、Three.js 素材风格及技术栈说明。

### 遇到的问题
- TypeScript 严格空检查：在 `typeWriter` 的闭包内使用 `typewriterEl` 被判为可能为 null。
- 解决：在函数开头用局部变量 `targetEl: HTMLElement` 承接非空判断后的元素，闭包内统一使用 `targetEl`。

### 下一步计划
- 可按需扩展指令（BURY / SUMMON / MOURN 等）与后端或链上对接。
- 可选：增加更多 3D 素材（更多墓碑、数据雨等）并保持同一视觉风格。
