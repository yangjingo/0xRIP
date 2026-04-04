# 0xRIP Design System

## Overview

0xRIP is a 3D digital memorial world combining Monument Valley's minimalist aesthetic with Sheikah Slate's sci-fi interface design.

---

## Part 1: Visual Identity

### 1.1 Color System

#### Primary Palette
```css
:root {
  /* Monument Valley Grayscale */
  --mv-bg: #fafafa;           /* Background */
  --mv-bg-dark: #f0f0f0;      /* Dark background */
  --mv-white: #ffffff;        /* Pure white */
  --mv-gray-light: #e8e8e8;   /* Light gray */
  --mv-gray: #c0c0c0;         /* Mid gray */
  --mv-gray-dark: #808080;    /* Dark gray */
  --mv-charcoal: #404040;     /* Charcoal */
  --mv-text: #1a1a1a;         /* Text primary */
  --mv-text-dim: #666666;     /* Text secondary */

  /* Sheikah Blue Accent */
  --sheikah-blue: #00d4ff;
  --sheikah-dim: rgba(0, 212, 255, 0.3);
  --sheikah-glow: rgba(0, 212, 255, 0.15);
}
```

#### Usage Rules
| Element | Color | Notes |
|:---|:---|:---|
| Page Background | `--mv-bg` | Soft off-white |
| 3D World Ground | `--mv-white` / `--mv-lightGray` | Alternating tiles |
| Monuments (Main) | `--mv-white` | Clean white stone |
| Monuments (Top) | `--mv-charcoal` | Dark contrast cap |
| UI Panels | `--mv-white` with blur | Glass morphism |
| Interactive Accent | `--sheikah-blue` | Hover, active states |
| Text Primary | `--mv-charcoal` | High contrast |
| Text Secondary | `--mv-text-dim` | Muted information |

---

### 1.2 Typography

#### Font Stack
```css
font-family: 'Space Mono', 'Cormorant Garamond', monospace;
```

#### Typography Scale
| Level | Font | Size | Weight | Usage |
|:---|:---|:---|:---|:---|
| Brand Title | Cormorant Garamond | 28px | 300 | Logo |
| Brand Subtitle | Space Mono | 10px | 400 | Tagline |
| Section Header | Space Mono | 10px | 400 | Panel sections |
| Monument Name | Cormorant Garamond | 16-22px | 400 | Card titles |
| Monument ID | Space Mono | 9-10px | 400 | IDs, metadata |
| Body Text | System | 12px | 400 | Descriptions |
| Button Label | Space Mono | 10px | 400 | Actions |

#### Typography Patterns
- **Uppercase**: Taglines, section headers, buttons
- **Letter Spacing**: 0.1-0.3em for uppercase text
- **Italic**: Subtitles, epitaphs (quotes)

---

## Part 2: Layout System

### 2.1 Page Structure

```
┌─────────────────────────────────────────────┐
│  0xRIP                    [Coordinate: X,Z] │  ← Top overlay (z: 100)
│  DIGITAL MEMORIAL                           │
│                                             │
│                                             │
│           [  3D WORLD VIEW  ]               │  ← Full screen (z: 1)
│           [   (Three.js)    ]               │
│                                             │
├─────────────────────────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  👁️  Sheikah Slate (handle bar)            │  ← Bottom panel (z: 100)
│  ┌──────────┬──────────┬──────────┐        │
│  │ Monuments│ Selected │ Actions  │        │
│  └──────────┴──────────┴──────────┘        │
└─────────────────────────────────────────────┘
```

### 2.2 Layer Stack (z-index)
| Layer | z-index | Elements |
|:---|:---|:---|
| Background | - | 3D Scene, Fog |
| 3D World | 1 | Three.js canvas |
| Selection Indicator | 50 | Ring around target |
| Tooltip | 200 | Hover info popup |
| Top Overlay | 100 | Brand, Coordinates |
| Bottom Panel | 100 | Sheikah Slate |

### 2.3 Spacing System
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 12px;
--space-lg: 16px;
--space-xl: 20px;
--space-2xl: 24px;
--space-3xl: 30px;
--space-4xl: 40px;
```

---

## Part 3: Components

### 3.1 Brand Header

**Position**: Fixed, top-left (30px, 40px)

**Structure**:
```html
<div class="brand-header">
  <div class="brand-title">0xRIP</div>
  <div class="brand-subtitle">DIGITAL MEMORIAL</div>
</div>
```

**CSS**:
```css
.brand-header {
  position: fixed;
  top: 30px;
  left: 40px;
  z-index: 100;
  pointer-events: none;
}

.brand-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 300;
  letter-spacing: -0.02em;
  color: var(--mv-charcoal);
}

.brand-subtitle {
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--mv-gray-dark);
  margin-top: 4px;
}
```

---

### 3.2 Sheikah Slate Panel

**Position**: Fixed, bottom, full width

**States**:
- Collapsed: Shows only handle bar (70px height)
- Expanded: Full panel (450px total height)

**Structure**:
```html
<div class="sheikah-panel" id="sheikahPanel">
  <div class="panel-handle" onclick="togglePanel()">
    <div class="sheikah-eye"></div>
    <div class="panel-title">Sheikah Slate</div>
  </div>
  <div class="panel-content">
    <div class="panel-section">...</div>
    <div class="panel-section">...</div>
    <div class="panel-section">...</div>
  </div>
</div>
```

**CSS**:
```css
.sheikah-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(255,255,255,0.98),
    rgba(255,255,255,0.95)
  );
  border-top: 1px solid var(--mv-gray-light);
  backdrop-filter: blur(20px);
  z-index: 100;
  transform: translateY(calc(100% - 70px));
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.sheikah-panel.expanded {
  transform: translateY(0);
}

.panel-handle {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid var(--mv-gray-light);
  position: relative;
}

/* Sheikah Eye Icon */
.sheikah-eye {
  position: absolute;
  left: 40px;
  width: 32px;
  height: 32px;
  border: 2px solid var(--mv-gray-dark);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  transition: all 0.3s;
}

.sheikah-eye::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 6px;
  height: 6px;
  background: var(--mv-charcoal);
  border-radius: 50%;
  transition: all 0.3s;
}

.sheikah-panel.expanded .sheikah-eye {
  border-color: var(--sheikah-blue);
  box-shadow: 0 0 15px var(--sheikah-glow);
}

.sheikah-panel.expanded .sheikah-eye::after {
  background: var(--sheikah-blue);
}
```

---

### 3.3 Panel Sections

**Layout**: 3-column grid

**CSS**:
```css
.panel-content {
  height: 380px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}

.panel-section {
  padding: 24px 30px;
  border-right: 1px solid var(--mv-gray-light);
  overflow-y: auto;
}

.panel-section:last-child {
  border-right: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--mv-text-dim);
}

.section-header::before {
  content: '';
  width: 6px;
  height: 6px;
  background: var(--sheikah-blue);
  border-radius: 50%;
}
```

---

### 3.4 Monument List Item

**Structure**:
```html
<div class="grave-item" data-id="ID" onclick="focusGrave('ID')">
  <div class="grave-marker"></div>
  <div class="grave-info">
    <div class="grave-name">Name</div>
    <div class="grave-id">0x...</div>
  </div>
</div>
```

**CSS**:
```css
.grave-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grave-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--mv-bg);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.grave-item:hover,
.grave-item.active {
  background: var(--mv-white);
  border-color: var(--sheikah-blue);
  box-shadow: 0 2px 12px var(--sheikah-glow);
}

.grave-marker {
  width: 10px;
  height: 10px;
  background: var(--mv-gray);
  border-radius: 50%;
  transition: all 0.3s;
}

.grave-item:hover .grave-marker,
.grave-item.active .grave-marker {
  background: var(--sheikah-blue);
  box-shadow: 0 0 8px var(--sheikah-blue);
}

.grave-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  color: var(--mv-charcoal);
}

.grave-id {
  font-size: 9px;
  color: var(--mv-text-dim);
  font-family: 'Space Mono', monospace;
}
```

---

### 3.5 Detail Card

**Structure**:
```html
<div class="detail-card">
  <div class="detail-id">0x...</div>
  <div class="detail-name">Monument Name</div>
  <div class="detail-epitaph">"Epitaph text"</div>
  <div class="detail-stats">...</div>
</div>
```

**CSS**:
```css
.detail-card {
  background: var(--mv-white);
  border: 1px solid var(--mv-gray-light);
  border-radius: 8px;
  padding: 20px;
}

.detail-id {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: var(--mv-text-dim);
  margin-bottom: 6px;
}

.detail-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  color: var(--mv-charcoal);
  margin-bottom: 10px;
}

.detail-epitaph {
  font-size: 12px;
  color: var(--mv-text-dim);
  font-style: italic;
  line-height: 1.5;
  padding: 10px;
  background: var(--mv-bg);
  border-radius: 4px;
}
```

---

### 3.6 Action Buttons

**Structure**:
```html
<div class="action-grid">
  <button class="action-btn" onclick="uploadMemory()">Upload</button>
  <button class="action-btn primary" onclick="summonSpirit()">Summon</button>
</div>
```

**CSS**:
```css
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.action-btn {
  padding: 12px;
  background: var(--mv-white);
  border: 1px solid var(--mv-gray-light);
  border-radius: 6px;
  font-family: inherit;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--mv-text-dim);
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: var(--sheikah-blue);
  color: var(--sheikah-blue);
}

.action-btn.primary {
  background: var(--mv-charcoal);
  border-color: var(--mv-charcoal);
  color: var(--mv-white);
}

.action-btn.primary:hover {
  background: var(--sheikah-blue);
  border-color: var(--sheikah-blue);
}
```

---

### 3.7 Tooltip

**Structure**:
```html
<div class="tooltip" id="tooltip">
  <div class="tooltip-title">Monument Name</div>
  <div class="tooltip-id">0x...</div>
</div>
```

**CSS**:
```css
.tooltip {
  position: fixed;
  padding: 10px 14px;
  background: var(--mv-charcoal);
  border-radius: 6px;
  font-size: 12px;
  color: var(--mv-white);
  pointer-events: none;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.2s;
  z-index: 200;
}

.tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

.tooltip-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
}

.tooltip-id {
  font-size: 9px;
  opacity: 0.6;
  margin-top: 4px;
}
```

---

## Part 4: Interactions & UX

### 4.1 Panel Toggle

**Trigger**: Click on panel handle bar

**Behavior**:
1. Panel slides up/down with `transform: translateY()`
2. Sheikah Eye icon changes state (color + glow)
3. Transition duration: 400ms
4. Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

**Code**:
```javascript
function togglePanel() {
  document.getElementById('sheikahPanel').classList.toggle('expanded');
}

// Auto-expand when monument is selected
function selectGrave(graveGroup) {
  // ... selection logic ...
  expandPanel();
}
```

---

### 4.2 Monument Selection

**Triggers**:
- Click on 3D monument in world
- Click on monument item in panel list

**Visual Feedback**:
1. Blue ring appears around selected monument (opacity 0 → 0.6)
2. List item gets `active` class (border + glow)
3. Ghost entity flies to selected monument
4. Detail card updates with monument info

**Animation - Ghost Movement**:
```javascript
function moveGhostTo(targetPos) {
  const startPos = ghost.position.clone();
  const duration = 1500;
  const startTime = Date.now();

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    ghost.position.lerpVectors(startPos, targetPos, eased);

    if (progress < 1) requestAnimationFrame(update);
  }

  update();
}
```

---

### 4.3 Camera Navigation

**OrbitControls Settings**:
```javascript
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 15;
controls.maxDistance = 100;
controls.maxPolarAngle = Math.PI / 2.1;
```

**Focus Animation** (when clicking monument in panel):
```javascript
function focusGrave(id) {
  const grave = graves.find(g => g.userData.id === id);
  if (grave) {
    selectGrave(grave);

    const targetPos = grave.position.clone();
    const offset = new THREE.Vector3(15, 12, 15);

    const startTarget = controls.target.clone();
    const startPos = camera.position.clone();
    const duration = 1200;
    const startTime = Date.now();

    function animateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      controls.target.lerpVectors(startTarget, targetPos, eased);
      camera.position.lerpVectors(startPos, targetPos.clone().add(offset), eased);

      if (progress < 1) requestAnimationFrame(animateCamera);
    }

    animateCamera();
  }
}
```

---

### 4.4 Hover States

| Element | Hover Effect | Duration |
|:---|:---|:---|
| Panel Handle | Bar turns blue | 300ms |
| Grave Item | Border + glow + marker glow | 300ms |
| Action Button | Border color change | 300ms |
| 3D Monument | Cursor changes to pointer + tooltip | 200ms |

---

### 4.5 Tooltip Behavior

**Show**: On hover over 3D monument
**Position**: Offset from cursor (15px, 15px)
**Transition**: Fade in + slide up (200ms)
**Content**: Monument name + ID

---

## Part 5: 3D World Design

### 5.1 World Structure

The 3D world consists of multiple platforms at different heights:

```
Height Map:
├── North Platform: y = 4
├── West Spiral Top: y = 13
├── East Island Top: y = 7
├── Central Platform: y = -2
└── South Platform: y = -6
```

### 5.2 Monument Placement

Monuments are distributed across platforms:
- Central: 1 monument (beside obelisk)
- North: 2 monuments
- East: 1 monument (on stepped platform top)
- West: 1 monument (on spiral top)
- South: 1 monument

### 5.3 Lighting

**Ambient**: White, intensity 0.65
**Directional (Sun)**: Position (30, 50, 20), intensity 0.5, casts shadows
**Fill**: Position (-20, 15, -20), intensity 0.25

### 5.4 Shadow Settings

```javascript
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
sunLight.shadow.radius = 8;
```

---

## Part 6: Animation Principles

### 6.1 Easing Functions

| Use Case | Easing | CSS/JS |
|:---|:---|:---|
| Panel slide | Cubic out | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Camera focus | Cubic out | `1 - Math.pow(1 - p, 3)` |
| Ghost movement | Cubic out | `1 - Math.pow(1 - p, 3)` |
| Scale entrance | Quart out | `1 - Math.pow(1 - p, 4)` |

### 6.2 Timing

| Animation | Duration |
|:---|:---|
| Panel toggle | 400ms |
| Monument entrance | 800-1000ms + 150ms stagger |
| Ghost movement | 1500ms |
| Camera focus | 1200ms |
| Hover transitions | 200-300ms |

---

## Part 7: Responsive Considerations

### 7.1 Breakpoints

| Size | Width | Adjustments |
|:---|:---|:---|
| Desktop | > 1200px | 3-column panel |
| Tablet | 768-1200px | 2-column or scroll |
| Mobile | < 768px | Full-screen panel overlay |

### 7.2 Mobile Adaptations

- Panel becomes full-screen overlay when expanded
- Single column layout
- Larger touch targets (min 44px)
- Swipe gestures for panel toggle

---

## Part 8: Accessibility

### 8.1 Keyboard Navigation

| Key | Action |
|:---|:---|
| Tab | Navigate between interactive elements |
| Enter/Space | Activate buttons, toggle panel |
| Escape | Close expanded panel |
| Arrow keys | Navigate monument list |

### 8.2 Screen Reader

- All interactive elements have labels
- Monument list announces count
- Selection changes announced
- Panel state (expanded/collapsed) announced

---

## Part 9: File Structure

```
/world
└── index.html          # Complete application

Key sections in HTML:
├── CSS Variables (lines 9-18)
├── Component Styles (lines 34-327)
├── HTML Structure (lines 329-374)
├── Three.js Setup (lines 385-485)
├── World Generation (lines 487-609)
├── Monument System (lines 883-983)
├── Interaction Logic (lines 1049-1271)
```

---

## Part 10: Usage Example

### Creating a New Monument

```javascript
const newMonument = {
  id: generateId(),           // '0x' + random hex
  name: 'Monument Name',
  epitaph: 'Quote or text',
  date: '2026.02.27',
  position_x: 10,
  position_z: -15,
  memoryCount: 0
};

// POST to API
fetch('/api/graves', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(newMonument)
});
```

### Customizing Colors

Change the CSS variables in `:root`:

```css
:root {
  --mv-bg: #f5f5f5;           /* Warmer gray */
  --sheikah-blue: #ff6b6b;    /* Change to coral */
}
```

---

## Summary

This design system combines:
- **Monument Valley**: Minimalist grayscale, geometric forms, impossible architecture
- **Sheikah Slate**: Sci-fi blue accents, glass morphism, eye iconography
- **3D Spatial**: True 3D world with depth, multiple elevation levels
- **Bottom Panel**: Always accessible but unobtrusive control center

Key UX principles:
1. **Progressive Disclosure**: Panel starts collapsed, expands when needed
2. **Spatial Awareness**: Camera smoothly transitions between targets
3. **Immediate Feedback**: Every action has visual confirmation
4. **Consistent Language**: Grayscale + blue accent throughout
