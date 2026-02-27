# 0xRIP UI Components

Copy-paste ready components for the 3D Memorial World interface.

---

## 1. CSS Variables

```css
:root {
  /* Monument Valley Color System */
  --mv-bg: #fafafa;
  --mv-bg-dark: #f0f0f0;
  --mv-white: #ffffff;
  --mv-gray-light: #e8e8e8;
  --mv-gray: #c0c0c0;
  --mv-gray-dark: #808080;
  --mv-charcoal: #404040;
  --mv-text: #1a1a1a;
  --mv-text-dim: #666666;

  /* Sheikah Accent */
  --sheikah-blue: #00d4ff;
  --sheikah-dim: rgba(0, 212, 255, 0.3);
  --sheikah-glow: rgba(0, 212, 255, 0.15);
}
```

---

## 2. Bottom Panel Layout

### HTML Structure

```html
<!-- Bottom Sheikah Slate Panel -->
<div class="sheikah-panel" id="sheikahPanel">
  <!-- Handle -->
  <div class="panel-handle" onclick="togglePanel()">
    <div class="sheikah-eye"></div>
    <div class="panel-title">Sheikah Slate</div>
  </div>

  <!-- Content -->
  <div class="panel-content">
    <!-- Left: List -->
    <div class="panel-section">
      <div class="section-header">Monuments</div>
      <div class="grave-list" id="graveList"></div>
    </div>

    <!-- Center: Details -->
    <div class="panel-section">
      <div class="section-header">Selected</div>
      <div id="detailContainer">
        <!-- Empty State -->
        <div class="empty-state">
          <div class="empty-icon">🪦</div>
          <div class="empty-text">Select a monument</div>
        </div>
      </div>
    </div>

    <!-- Right: Actions -->
    <div class="panel-section">
      <div class="section-header">Actions</div>
      <div class="action-grid">
        <button class="action-btn" onclick="uploadMemory()">Upload</button>
        <button class="action-btn primary" onclick="summonSpirit()">Summon</button>
      </div>
    </div>
  </div>
</div>
```

---

## 3. Complete CSS

```css
/* ===== BASE ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Space Mono', 'Cormorant Garamond', monospace;
  overflow: hidden;
  background: var(--mv-bg);
  color: var(--mv-text);
}

/* ===== BRAND HEADER ===== */
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
  margin-bottom: 4px;
}

.brand-subtitle {
  font-size: 10px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--mv-gray-dark);
}

/* ===== BOTTOM PANEL ===== */
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

/* Panel Handle */
.panel-handle {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid var(--mv-gray-light);
  position: relative;
}

.panel-handle::before {
  content: '';
  width: 40px;
  height: 3px;
  background: var(--mv-gray);
  border-radius: 2px;
  transition: background 0.3s;
}

.panel-handle:hover::before {
  background: var(--sheikah-blue);
}

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

/* Active State */
.sheikah-panel.expanded .sheikah-eye {
  border-color: var(--sheikah-blue);
  box-shadow: 0 0 15px var(--sheikah-glow);
}

.sheikah-panel.expanded .sheikah-eye::after {
  background: var(--sheikah-blue);
}

.panel-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px;
  font-style: italic;
  color: var(--mv-text-dim);
}

/* ===== PANEL CONTENT ===== */
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

/* Section Header */
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

/* ===== GRAVE LIST ===== */
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
  background: var(--mv-bg-dark);
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

.grave-info { flex: 1; }

.grave-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 16px;
  color: var(--mv-charcoal);
  margin-bottom: 2px;
}

.grave-id {
  font-size: 9px;
  color: var(--mv-text-dim);
  font-family: 'Space Mono', monospace;
}

/* ===== DETAIL CARD ===== */
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

/* ===== ACTION BUTTONS ===== */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
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

/* ===== EMPTY STATE ===== */
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--mv-gray);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-text {
  font-size: 12px;
}

/* ===== TOOLTIP ===== */
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

/* ===== LOADING ===== */
.loading {
  text-align: center;
  padding: 40px;
  color: var(--mv-gray);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--mv-gray-light);
  border-top-color: var(--sheikah-blue);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 4. JavaScript Interaction

```javascript
// ===== PANEL TOGGLE =====
function togglePanel() {
  document.getElementById('sheikahPanel').classList.toggle('expanded');
}

function expandPanel() {
  document.getElementById('sheikahPanel').classList.add('expanded');
}

// ===== UPDATE GRAVE LIST =====
function updateGraveList(data) {
  const listEl = document.getElementById('graveList');
  listEl.innerHTML = data.map(grave => `
    <div class="grave-item" data-id="${grave.id}" onclick="focusGrave('${grave.id}')">
      <div class="grave-marker"></div>
      <div class="grave-info">
        <div class="grave-name">${grave.name}</div>
        <div class="grave-id">${grave.id}</div>
      </div>
    </div>
  `).join('');
}

// ===== UPDATE SELECTED DETAIL =====
function updateSelectedGrave(data) {
  const container = document.getElementById('detailContainer');
  container.innerHTML = `
    <div class="detail-card">
      <div class="detail-id">${data.id}</div>
      <div class="detail-name">${data.name}</div>
      <div class="detail-epitaph">"${data.epitaph || 'No epitaph'}"</div>
    </div>
  `;

  // Highlight list item
  document.querySelectorAll('.grave-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === data.id);
  });
}

// ===== CAMERA FOCUS =====
function focusGrave(id) {
  const grave = graves.find(g => g.userData.id === id);
  if (grave) {
    selectGrave(grave);

    // Smooth camera movement
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

## 5. Responsive Behavior

```css
/* Tablet */
@media (max-width: 1024px) {
  .panel-content {
    grid-template-columns: 1fr 1fr;
  }

  .panel-section:nth-child(3) {
    display: none; /* Hide actions on tablet */
  }
}

/* Mobile */
@media (max-width: 768px) {
  .brand-header {
    top: 20px;
    left: 20px;
  }

  .brand-title {
    font-size: 20px;
  }

  .panel-content {
    grid-template-columns: 1fr;
    height: 60vh;
  }

  .panel-section {
    border-right: none;
    border-bottom: 1px solid var(--mv-gray-light);
  }
}
```

---

## 6. Key Design Principles

1. **Typography Hierarchy**
   - Brand: Cormorant Garamond, 28px, weight 300
   - Titles: Cormorant Garamond, 16-22px
   - Body: Space Mono, 9-12px
   - Labels: Space Mono, 10px, uppercase, letter-spacing 0.2em

2. **Color Usage**
   - Background: #fafafa (warm white)
   - Cards: #ffffff (pure white)
   - Text: #1a1a1a (near black)
   - Muted: #666666 (dim)
   - Accent: #00d4ff (Sheikah blue)

3. **Spacing System**
   - Small: 4px, 8px, 10px
   - Medium: 12px, 14px, 16px
   - Large: 20px, 24px, 30px, 40px

4. **Border Radius**
   - Small: 4px (inputs, tags)
   - Medium: 6px (buttons, items)
   - Large: 8px (cards)

5. **Shadows**
   - Subtle: 0 2px 12px rgba(0, 212, 255, 0.1)
   - Glow: 0 0 15px rgba(0, 212, 255, 0.15)

6. **Transitions**
   - Default: 0.3s ease
   - Panel: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
   - Camera: 1.2s cubic-bezier
