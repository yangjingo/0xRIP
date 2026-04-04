# 纪念碑谷模式 (Monument Valley Mode)

0xRIP 的可切换视觉模式之一。与默认的 **CYBER NECROPOLIS** 风格形成对比，提供更宁静、治愈的视觉体验。

---

## 一、模式概述

| 特性 | CYBER NECROPOLIS (默认) | MONUMENT VALLEY (新模式) |
|:---|:---|:---|
| **氛围** | 赛博朋克、神秘、暗黑 | 宁静、治愈、超现实 |
| **相机** | 透视投影 | 正交投影（等距） |
| **色彩** | 霓虹青/粉高对比 | 粉彩马卡龙低饱和 |
| **几何** | 真实比例墓碑 | 不可能几何、低多边形 |
| **交互** | 终端指令 | 点击引导、拖拽旋转 |

---

## 二、色彩系统

### 2.1 主色调

```typescript
const MonumentValleyPalette = {
  // 粉彩主色
  rose: '#FFB6C1',        // 玫瑰粉 - 主强调
  peach: '#FFDAB9',       // 桃色 - 次强调
  mint: '#98FB98',        // 薄荷绿 - 成功/生命
  lavender: '#E6E6FA',    // 薰衣草紫 - 神秘/幽灵
  sky: '#87CEEB',         // 天空蓝 - 背景过渡

  // 中性色
  ivory: '#FFFFF0',       // 象牙白 - 文字/高光
  sand: '#F5DEB3',        // 小麦色 - 地面/基础
  stone: '#D3D3D3',       // 浅灰 - 建筑主体

  // 背景
  bgTop: '#FFE4E1',       // 薄雾玫瑰（顶部天空）
  bgBottom: '#E6E6FA',    // 薰衣草（底部地平线）
} as const;
```

### 2.2 与现有风格的映射

| 元素 | CYBER NECROPOLIS | MONUMENT VALLEY |
|:---|:---|:---|
| 主强调 | `#00f3ff` 霓虹青 | `#FFB6C1` 玫瑰粉 |
| 次强调 | `#ff00ff` 霓虹粉 | `#FFDAB9` 桃色 |
| 背景 | `#050505` 深黑 | `#FFE4E1` → `#E6E6FA` 渐变 |
| 墓碑主体 | 黑金属 | 白色石材 |
| 幽灵 | 青色粒子+粉核心 | 薰衣草光晕 |
| 网格 | 青色霓虹 | 浅灰/不可见 |

---

## 三、视觉风格规范

### 3.1 相机设置（关键）

```typescript
// 正交投影创造等距视角
const aspect = window.innerWidth / window.innerHeight;
const d = 20;
const camera = new THREE.OrthographicCamera(
  -d * aspect, d * aspect,
  d, -d,
  1, 1000
);

// 经典等距角度
camera.position.set(20, 20, 20);
camera.lookAt(0, 0, 0);
```

### 3.2 材质系统

```typescript
// 扁平化 Lambert 光照，禁用 PBR
const material = new THREE.MeshLambertMaterial({
  color: 0xFFB6C1,      // 粉彩色
  flatShading: true,    // 低多边形关键
  emissive: 0x000000,
  emissiveIntensity: 0.1
});

// 柔和阴影
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(10, 20, 10);
light.castShadow = true;
light.shadow.mapSize.width = 2048;
light.shadow.radius = 4; // 柔和阴影边缘
```

### 3.3 几何风格

- **墓碑**：简化为立方体、圆柱体组合，无复杂纹理
- **幽灵**：几何化的光球而非粒子系统
- **地面**：极简平台，可能浮空
- **不可能几何**：利用视错觉创造彭罗斯三角结构

---

## 四、交互设计

### 4.1 模式切换

```typescript
// 切换按钮位于设置菜单或快捷键
type VisualMode = 'cyber' | 'monument';

// 切换时：
// 1. 相机动画过渡（透视 <-> 正交）
// 2. 色彩渐变过渡
// 3. 场景元素变形/替换
// 4. 背景音乐淡入淡出
```

### 4.2 输入方式差异

| 操作 | CYBER NECROPOLIS | MONUMENT VALLEY |
|:---|:---|:---|
| 移动 | WASD / 鼠标拖拽 | 点击地面移动 |
| 旋转视角 | 鼠标拖拽 | 拖拽旋转整个场景 |
| 交互 | 终端输入指令 | 点击对象触发 |
| 召唤灵魂 | `SUMMON [id]` | 点击墓碑 → 幽灵升起 |

### 4.3 微交互

- **悬停墓碑**：轻微上浮 + 阴影扩散
- **点击**：涟漪扩散效果（颜色从点击点扩散）
- **场景旋转**：平滑惯性，松开后续滑
- **过渡动画**：所有变化使用缓动函数，拒绝突兀

---

## 五、极简实现示例

见 `examples/monument-valley-minimal/` 目录：

- `index.html` - 单文件示例
- 包含：正交相机、粉彩材质、简单几何、点击交互

---

## 六、集成计划

### Phase 1: 基础切换（当前）
- [x] 色彩系统设计
- [x] 极简代码示例
- [ ] 模式切换 UI

### Phase 2: 场景适配
- [ ] 墓碑几何简化版本
- [ ] 幽灵几何化版本
- [ ] 等距视角下的导航网格

### Phase 3: 不可能几何
- [ ] 彭罗斯三角结构
- [ ] 视觉错位路径
- [ ] 分层渲染解决遮挡

### Phase 4: 完整体验
- [ ] 纪念碑谷风格关卡设计
- [ ] 引导式交互（无终端）
- [ ] 音效与配乐

---

## 七、设计原则

1. **宁静优先**：减少视觉噪音，留白很重要
2. **直觉交互**：不需要学习，看见就知道怎么操作
3. **一致映射**：同一功能两种风格下位置/逻辑保持一致
4. **无缝切换**：用户可以瞬间切换，不丢失状态
