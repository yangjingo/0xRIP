/**
 * 0xRIP - CYBER NECROPOLIS v2.0
 * 数字墓地 - 赛博朋克风格 3D 场景
 */

import * as THREE from 'three';
import './style.css';

// =============================================
// 常量定义
// =============================================
const NEON_CYAN = 0x00f3ff;
const NEON_PINK = 0xff00ff;
const NEON_PURPLE = 0xb300ff;
const DARK_BG = 0x0a0a0f;

// =============================================
// 全局状态
// =============================================
const graves: any[] = [];
let selectedGrave: any = null;

// 动画状态
let cameraAnimState = {
  active: false,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  endTarget: new THREE.Vector3(),
  progress: 0,
  duration: 1.5,
  ease: 'easeOutCubic'
};

let hoveredGrave: any = null;
let gravePulseTime = 0;

// 埋葬仪式状态
let burialCoffinType = '';
let burialEpitaph = '';
let burialName = '';
let burialMemories: string[] = [];
let burialUrls: string[] = [];
let pendingGraveAfterConfirm: any = null; // 步骤 3 确认后创建的 grave，步骤 4 可为其追加记忆

// 相机控制
let cameraAngle = 0;
let cameraRadius = 8;
let cameraHeight = 2;

// 键盘状态
const keys = { w: false, a: false, s: false, d: false };

// 鼠标状态
let isDragging = false;
let lastMouseX = 0;

// =============================================
// Three.js 场景
// =============================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(DARK_BG);
scene.fog = new THREE.FogExp2(DARK_BG, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container')?.appendChild(renderer.domElement);

// =============================================
// 灯光系统
// =============================================
scene.add(new THREE.AmbientLight(0x111122, 0.5));

const mainLight = new THREE.PointLight(NEON_CYAN, 2, 30);
mainLight.position.set(-5, 8, 5);
scene.add(mainLight);

const pinkLight = new THREE.PointLight(NEON_PINK, 1.5, 20);
pinkLight.position.set(5, 5, -5);
scene.add(pinkLight);

// =============================================
// 地面 - 发光网格
// =============================================
function createTerrain() {
  // 起伏地面
  const groundGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
  const pos = groundGeo.attributes.position.array as Float32Array;
  for (let i = 0; i < pos.length; i += 3) {
    const x = pos[i], y = pos[i + 1];
    pos[i + 2] = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 - 1.5;
  }
  groundGeo.computeVertexNormals();
  
  // 发光网格纹理
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
  for (let i = 0; i <= 256; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  
  const groundMat = new THREE.MeshStandardMaterial({
    map: tex, color: 0x111116, roughness: 0.8, metalness: 0.2,
    emissive: NEON_CYAN, emissiveMap: tex, emissiveIntensity: 0.15
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  
  // 网格线框
  const wire = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.PlaneGeometry(100, 100, 20, 20)),
    new THREE.LineBasicMaterial({ color: NEON_CYAN, transparent: true, opacity: 0.1 })
  );
  wire.rotation.x = -Math.PI / 2;
  wire.position.y = -1.4;
  scene.add(wire);
}
createTerrain();

// =============================================
// 墓碑工厂 - 4种样式
// =============================================
function createGlowText(text: string, color: string) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d')!;
  x.shadowColor = color; x.shadowBlur = 20;
  x.font = 'bold 40px monospace';
  x.fillStyle = color; x.textAlign = 'center';
  x.fillText(text.slice(0, 12), 256, 80);
  return new THREE.CanvasTexture(c);
}

function createGraveMesh(grave: any) {
  const types = ['obelisk', 'floating', 'crystal', 'monolith'];
  const type = types[Math.floor(Math.random() * types.length)];
  const group = new THREE.Group();
  group.position.set(grave.position.x, 0, grave.position.z);

  // 初始缩放为0（用于出现动画）
  group.scale.set(0, 0, 0);

  if (type === 'obelisk') {
    // 方尖碑
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.6, 3.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.3, metalness: 0.9, emissive: NEON_CYAN, emissiveIntensity: 0.1 })
    );
    body.position.y = 1.75; body.castShadow = true; group.add(body);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: NEON_CYAN }));
    edges.position.y = 1.75; group.add(edges);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2), new THREE.MeshBasicMaterial({ color: NEON_PINK }));
    gem.position.y = 3.7; group.add(gem);

  } else if (type === 'floating') {
    // 悬浮石板
    group.position.y = 1;
    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.1, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x15151c, emissive: NEON_PURPLE, emissiveIntensity: 0.2 })
    );
    group.add(slab);

    // 连接线
    const line = new THREE.Line(
      new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, -3, 0]), 3)),
      new THREE.LineBasicMaterial({ color: NEON_PURPLE, transparent: true, opacity: 0.3 })
    );
    group.add(line);
    group.userData.isFloating = true;

  } else if (type === 'crystal') {
    // 水晶
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 2.5, 6),
      new THREE.MeshPhysicalMaterial({ color: NEON_CYAN, transmission: 0.5, transparent: true, opacity: 0.8, emissive: NEON_CYAN, emissiveIntensity: 0.3 })
    );
    crystal.position.y = 1.25; group.add(crystal);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), new THREE.MeshBasicMaterial({ color: NEON_PINK, wireframe: true }));
    core.position.y = 1; group.add(core);

  } else {
    // 巨石碑
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x0c0c10, emissive: NEON_PURPLE, emissiveIntensity: 0.1 })
    );
    body.position.y = 2; group.add(body);

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: NEON_PURPLE, opacity: 0.6, transparent: true }));
    edges.position.y = 2; group.add(edges);
  }

  // 文字标签
  const text = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.4),
    new THREE.MeshBasicMaterial({ map: createGlowText(grave.name, '#ff00ff'), transparent: true, opacity: 0.9, side: THREE.DoubleSide })
  );
  text.position.set(0, 1.5, 0.5);
  text.userData = { graveId: grave.id, isGrave: true };
  group.add(text);
  group.userData.graveId = grave.id;
  group.userData.floatOffset = Math.random() * Math.PI * 2;

  scene.add(group);

  // 出现动画
  let scaleTime = 0;
  const duration = 0.8;

  function animateSpawn() {
    scaleTime += 0.016;
    let t = Math.min(scaleTime / duration, 1);
    // 弹性缓动
    t = easing.easeOutElastic(t);
    group.scale.setScalar(t);

    if (scaleTime < duration) {
      requestAnimationFrame(animateSpawn);
    }
  }
  animateSpawn();

  // 创建粒子爆发效果
  createParticleBurst(grave.position.x, 1.5, grave.position.z);

  return group;
}

// 墓碑创建时的粒子爆发效果
function createParticleBurst(x: number, y: number, z: number) {
  const BURST_COUNT = 50;
  const burstGeo = new THREE.BufferGeometry();
  const burstPos = new Float32Array(BURST_COUNT * 3);
  const burstVel: THREE.Vector3[] = [];

  for (let i = 0; i < BURST_COUNT; i++) {
    burstPos[i * 3] = x;
    burstPos[i * 3 + 1] = y;
    burstPos[i * 3 + 2] = z;

    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.3
    );
    burstVel.push(vel);
  }

  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos, 3));

  const burst = new THREE.Points(
    burstGeo,
    new THREE.PointsMaterial({
      color: NEON_CYAN,
      size: 0.08,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(burst);

  // 粒子动画
  let burstTime = 0;
  const burstDuration = 1;

  function animateBurst() {
    burstTime += 0.016;
    const positions = burst.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < BURST_COUNT; i++) {
      const i3 = i * 3;
      positions[i3] += burstVel[i].x;
      positions[i3 + 1] += burstVel[i].y;
      positions[i3 + 2] += burstVel[i].z;

      // 重力
      burstVel[i].y -= 0.005;
    }

    burst.geometry.attributes.position.needsUpdate = true;
    (burst.material as THREE.PointsMaterial).opacity = 1 - (burstTime / burstDuration);

    if (burstTime < burstDuration) {
      requestAnimationFrame(animateBurst);
    } else {
      scene.remove(burst);
      burstGeo.dispose();
    }
  }
  animateBurst();
}

// =============================================
// 埋葬仪式向导
// =============================================
function openBurialRitual(name: string) {
  burialName = name || 'UNKNOWN';
  burialCoffinType = '';
  burialEpitaph = '';
  burialMemories = [];
  burialUrls = [];
  pendingGraveAfterConfirm = null;

  document.querySelectorAll('.coffin-btn').forEach((btn) => btn.classList.remove('selected'));
  (document.getElementById('ritual-epitaph') as HTMLInputElement).value = '';
  (document.getElementById('ritual-url') as HTMLInputElement).value = '';
  (document.getElementById('ritual-file-txt') as HTMLInputElement).value = '';
  document.getElementById('ritual-step-1-next')?.setAttribute('disabled', 'true');

  goToRitualStep(1);
  document.getElementById('burial-ritual-panel')?.classList.remove('hidden');
}

function closeBurialRitual() {
  document.getElementById('burial-ritual-panel')?.classList.add('hidden');
  pendingGraveAfterConfirm = null;
}

function goToRitualStep(step: number) {
  [1, 2, 3, 4].forEach((i) => {
    const el = document.getElementById(`ritual-step-${i}`);
    if (el) el.classList.toggle('hidden', i !== step);
  });
  const ind = document.getElementById('ritual-step-indicator');
  if (ind) ind.textContent = `Step ${step}/4`;
}

function finishBurialRitual() {
  if (pendingGraveAfterConfirm) {
    pendingGraveAfterConfirm.memories = burialMemories;
    pendingGraveAfterConfirm.urls = burialUrls;
  }
  closeBurialRitual();
}

// =============================================
// 缓动函数
// =============================================
const easing = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeOutExpo: (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

// =============================================
// 幽灵 - 增强粒子系统
// =============================================
const wraithGroup = new THREE.Group();
wraithGroup.position.set(0, 1.5, 0);

// 粒子池 - 更多粒子，更丰富的效果
const WRAITH_PARTICLE_COUNT = 200;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(WRAITH_PARTICLE_COUNT * 3);
const pCol = new Float32Array(WRAITH_PARTICLE_COUNT * 3);
const pSizes = new Float32Array(WRAITH_PARTICLE_COUNT);
const pSpeeds = new Float32Array(WRAITH_PARTICLE_COUNT);
const pOffsets = new Float32Array(WRAITH_PARTICLE_COUNT);

for (let i = 0; i < WRAITH_PARTICLE_COUNT; i++) {
  const y = (Math.random() - 0.5) * 2.5;
  const r = Math.abs(y) > 0.8 ? 0.2 : 0.5;
  const a = Math.random() * Math.PI * 2;
  pPos[i * 3] = Math.cos(a) * r * Math.random();
  pPos[i * 3 + 1] = y;
  pPos[i * 3 + 2] = Math.sin(a) * r * Math.random();

  // 颜色渐变：从青色到粉色
  const mix = Math.random();
  pCol[i * 3] = mix * 1;        // R
  pCol[i * 3 + 1] = 0.95 - mix * 0.3; // G
  pCol[i * 3 + 2] = 1;          // B

  pSizes[i] = 0.03 + Math.random() * 0.05;
  pSpeeds[i] = 0.5 + Math.random() * 1.5;
  pOffsets[i] = Math.random() * Math.PI * 2;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
pGeo.setAttribute('size', new THREE.BufferAttribute(pSizes, 1));

const wraithBody = new THREE.Points(
  pGeo,
  new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
);
wraithGroup.add(wraithBody);

// 内层核心 - 旋转的二十面体
const coreGroup = new THREE.Group();
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.15, 1),
  new THREE.MeshBasicMaterial({
    color: NEON_PINK,
    wireframe: true,
    transparent: true,
    opacity: 0.9
  })
);
coreGroup.add(core);

// 外层壳 - 反向旋转
const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.25, 0),
  new THREE.MeshBasicMaterial({
    color: NEON_CYAN,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  })
);
coreGroup.add(shell);

coreGroup.position.y = 0.3;
wraithGroup.add(coreGroup);

// 幽灵光环
const glowRing = new THREE.Mesh(
  new THREE.RingGeometry(0.4, 0.5, 32),
  new THREE.MeshBasicMaterial({
    color: NEON_CYAN,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide
  })
);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.y = -0.3;
wraithGroup.add(glowRing);

scene.add(wraithGroup);

// =============================================
// 氛围粒子 - 增强版
// =============================================
const ATMOSPHERE_PARTICLE_COUNT = 500;
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(ATMOSPHERE_PARTICLE_COUNT * 3);
const rainVel = new Float32Array(ATMOSPHERE_PARTICLE_COUNT); // 下落速度
const rainSizes = new Float32Array(ATMOSPHERE_PARTICLE_COUNT);

for (let i = 0; i < ATMOSPHERE_PARTICLE_COUNT; i++) {
  rainPos[i * 3] = (Math.random() - 0.5) * 60;
  rainPos[i * 3 + 1] = Math.random() * 35;
  rainPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
  rainVel[i] = 0.03 + Math.random() * 0.08;
  rainSizes[i] = 0.02 + Math.random() * 0.04;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
rainGeo.setAttribute('size', new THREE.BufferAttribute(rainSizes, 1));

const rain = new THREE.Points(
  rainGeo,
  new THREE.PointsMaterial({
    color: NEON_CYAN,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true
  })
);
scene.add(rain);

// 添加浮动光点（类似萤火虫）
const FIREFLY_COUNT = 50;
const fireflyGeo = new THREE.BufferGeometry();
const fireflyPos = new Float32Array(FIREFLY_COUNT * 3);
const fireflyPhase = new Float32Array(FIREFLY_COUNT);

for (let i = 0; i < FIREFLY_COUNT; i++) {
  fireflyPos[i * 3] = (Math.random() - 0.5) * 40;
  fireflyPos[i * 3 + 1] = 0.5 + Math.random() * 5;
  fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
  fireflyPhase[i] = Math.random() * Math.PI * 2;
}
fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));

const fireflies = new THREE.Points(
  fireflyGeo,
  new THREE.PointsMaterial({
    color: NEON_PURPLE,
    size: 0.08,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  })
);
scene.add(fireflies);

// =============================================
// 相机控制
// =============================================
function updateCamera() {
  // WASD 移动
  const speed = 0.15;
  const forward = new THREE.Vector3(Math.sin(cameraAngle), 0, Math.cos(cameraAngle));
  const right = new THREE.Vector3(Math.sin(cameraAngle + Math.PI / 2), 0, Math.cos(cameraAngle + Math.PI / 2));
  
  if (keys.w) cameraTarget.addScaledVector(forward, speed);
  if (keys.s) cameraTarget.addScaledVector(forward, -speed);
  if (keys.a) cameraTarget.addScaledVector(right, -speed);
  if (keys.d) cameraTarget.addScaledVector(right, speed);
  
  // 计算相机位置
  camera.position.x = cameraTarget.x + Math.sin(cameraAngle) * cameraRadius;
  camera.position.z = cameraTarget.z + Math.cos(cameraAngle) * cameraRadius;
  camera.position.y = cameraHeight;
  camera.lookAt(cameraTarget.x, 0, cameraTarget.z);
  
  // 更新坐标显示
  const coords = document.getElementById('footer-coords');
  if (coords) coords.textContent = `X: ${cameraTarget.x.toFixed(2)} | Z: ${cameraTarget.z.toFixed(2)}`;
}

// 目标点
const cameraTarget = new THREE.Vector3(0, 0, 0);

// =============================================
// 输入处理
// =============================================
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w') keys.w = true;
  if (k === 'a') keys.a = true;
  if (k === 's') keys.s = true;
  if (k === 'd') keys.d = true;
  if (k === 'f') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }
});

window.addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === 'w') keys.w = false;
  if (k === 'a') keys.a = false;
  if (k === 's') keys.s = false;
  if (k === 'd') keys.d = false;
});

// 鼠标拖拽
window.addEventListener('mousedown', (e) => { if (e.button === 2 || e.button === 0) { isDragging = true; lastMouseX = e.clientX; } });
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    cameraAngle += (e.clientX - lastMouseX) * 0.005;
    lastMouseX = e.clientX;
  }

  // 墓碑悬停检测
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  let newHoveredGrave: any = null;
  for (const hit of intersects) {
    if (hit.object.userData.isGrave || hit.object.parent?.userData.graveId) {
      const id = hit.object.userData.graveId || hit.object.parent?.userData.graveId;
      const g = graves.find(x => x.id === id);
      if (g) {
        newHoveredGrave = g;
        break;
      }
    }
  }

  // 悬停状态变化
  if (newHoveredGrave !== hoveredGrave) {
    // 恢复之前的墓碑
    if (hoveredGrave && hoveredGrave.mesh) {
      hoveredGrave.mesh.children.forEach((child: any) => {
        if (child.material && child.material.emissiveIntensity !== undefined) {
          child.material.emissiveIntensity = hoveredGrave.mesh.userData.baseEmissiveIntensity || 0.1;
        }
      });
    }

    hoveredGrave = newHoveredGrave;

    // 高亮新墓碑
    if (hoveredGrave && hoveredGrave.mesh) {
      // 保存原始强度
      if (hoveredGrave.mesh.userData.baseEmissiveIntensity === undefined) {
        const firstChild = hoveredGrave.mesh.children[0];
        if (firstChild?.material?.emissiveIntensity !== undefined) {
          hoveredGrave.mesh.userData.baseEmissiveIntensity = firstChild.material.emissiveIntensity;
        }
      }

      // 设置光标
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }
});
window.addEventListener('wheel', (e) => {
  cameraRadius = Math.max(3, Math.min(20, cameraRadius + e.deltaY * 0.01));
});

// 阻止右键菜单
window.addEventListener('contextmenu', e => e.preventDefault());

// =============================================
// 终端系统
// =============================================
const output = document.getElementById('terminal-output');
const input = document.getElementById('terminal-input') as HTMLInputElement;

function print(text: string, type = 'normal') {
  if (!output) return;
  const div = document.createElement('div');
  div.className = `terminal-line ${type}`;
  div.textContent = text;
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

function typeWrite(text: string) {
  if (!output) return;
  const div = document.createElement('div');
  div.className = 'terminal-line';
  output.appendChild(div);
  let i = 0;
  const type = () => {
    if (i < text.length) {
      div.textContent += text.charAt(i++);
      output.scrollTop = output.scrollHeight;
      setTimeout(type, 15);
    }
  };
  type();
}

// 指令处理
function processCommand(cmd: string) {
  const [action, ...args] = cmd.trim().toUpperCase().split(' ');
  const arg = args.join(' ');

  switch (action) {
    case 'BURY':
    case '埋葬': {
      openBurialRitual(arg || 'UNKNOWN');
      break;
    }
    case 'SUMMON':
    case '招魂': {
      const g = graves.find(x => x.id.includes(arg) || x.name.toLowerCase().includes(arg.toLowerCase()));
      if (g) {
        print(`[SUMMON] ${g.name} awakened`, 'success');

        // 启动相机动画
        const targetPos = new THREE.Vector3(g.position.x, 0, g.position.z);
        const cameraEndPos = new THREE.Vector3(
          g.position.x + Math.sin(cameraAngle) * 5,
          2.5,
          g.position.z + Math.cos(cameraAngle) * 5
        );

        cameraAnimState = {
          active: true,
          startPos: camera.position.clone(),
          endPos: cameraEndPos,
          startTarget: cameraTarget.clone(),
          endTarget: targetPos,
          progress: 0,
          duration: 1.5,
          ease: 'easeOutCubic'
        };

        // 幽灵移动（带延迟）
        setTimeout(() => {
          wraithGroup.position.set(g.position.x, 1.5, g.position.z);
        }, 300);
      } else {
        print('[ERROR] Soul not found', 'error');
      }
      break;
    }
    case 'MOURN':
    case '悼念': {
      const g = graves.find(x => x.id.includes(arg) || x.name.toLowerCase().includes(arg.toLowerCase()));
      if (g) print(`[MOURN] Digital flowers offered to ${g.name}`, 'success');
      else print('[ERROR] Target not found', 'error');
      break;
    }
    case 'LIST':
    case '列表': {
      if (graves.length === 0) print('[GRAVEYARD EMPTY] Use BURY to inter data');
      else graves.forEach(g => print(`> ${g.id}: ${g.name}`));
      break;
    }
    case 'DECAY':
    case '删除': {
      const idx = graves.findIndex(x => x.id.includes(arg) || x.name.toLowerCase().includes(arg.toLowerCase()));
      if (idx !== -1) {
        const g = graves.splice(idx, 1)[0];
        if (g.mesh) scene.remove(g.mesh);
        print(`[DECAY] ${g.name} has withered away`, 'warning');
        document.getElementById('soul-count')!.textContent = String(graves.length);
      } else print('[ERROR] Target not found', 'error');
      break;
    }
    case 'HELP':
    case '帮助':
      print('BURY [name] - Bury | SUMMON [id] - Summon | MOURN [id] - Mourn | LIST - List | DECAY [id] - Delete | DOOM - ???');
      break;
    case 'DOOM':
      document.body.classList.add('glitch-active');
      setTimeout(() => document.body.classList.remove('glitch-active'), 2000);
      print('[SYSTEM MELTDOWN]', 'error');
      break;
    default:
      print('Type HELP for commands');
  }
}

input?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && input.value.trim()) {
    print(`> ${input.value}`);
    processCommand(input.value);
    input.value = '';
  }
});

// 快捷按钮
document.querySelectorAll('.shortcut-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = (btn as HTMLElement).dataset.cmd;
    if (cmd) {
      print(`> ${cmd}`);
      processCommand(cmd);
    }
  });
});

// =============================================
// 埋葬仪式面板事件
// =============================================
document.getElementById('ritual-close')?.addEventListener('click', closeBurialRitual);

document.querySelectorAll('.coffin-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.coffin-btn').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    burialCoffinType = (btn as HTMLElement).dataset.type || 'zip';
    document.getElementById('ritual-step-1-next')?.removeAttribute('disabled');
  });
});

document.getElementById('ritual-step-1-next')?.addEventListener('click', () => {
  if (!burialCoffinType) return;
  goToRitualStep(2);
});

document.getElementById('ritual-epitaph-auto')?.addEventListener('click', () => {
  const input = document.getElementById('ritual-epitaph') as HTMLInputElement;
  input.value = `while(alive) { love++; } // Final iteration ${new Date().toLocaleDateString()}`;
});

document.getElementById('ritual-step-2-next')?.addEventListener('click', () => {
  burialEpitaph = (document.getElementById('ritual-epitaph') as HTMLInputElement).value.trim() || 'while(alive) { soul++; }';
  const preview = document.getElementById('ritual-death-preview');
  if (preview) {
    preview.innerHTML = `
      <strong>${burialName}</strong><br/>
      Coffin: ${burialCoffinType}<br/>
      Epitaph: ${burialEpitaph.slice(0, 40)}${burialEpitaph.length > 40 ? '…' : ''}
    `;
  }
  goToRitualStep(3);
});

document.getElementById('ritual-confirm-death')?.addEventListener('click', () => {
  const id = '0x' + Math.random().toString(16).slice(2, 10).toUpperCase();
  const grave = {
    id,
    name: burialName,
    epitaph: burialEpitaph || 'while(alive) { soul++; }',
    date: new Date().toLocaleDateString(),
    position: { x: (Math.random() - 0.5) * 20, z: -3 - Math.random() * 10 },
    coffinType: burialCoffinType || 'zip',
    memories: [] as string[],
    urls: [] as string[]
  };
  graves.push(grave);
  (grave as any).mesh = createGraveMesh(grave);
  pendingGraveAfterConfirm = grave;
  print(`[埋葬完成] ${burialName} | ${id}`, 'success');
  document.getElementById('soul-count')!.textContent = String(graves.length);
  goToRitualStep(4);
});

document.getElementById('ritual-skip-memory')?.addEventListener('click', finishBurialRitual);
document.getElementById('ritual-done')?.addEventListener('click', () => {
  const urlInput = document.getElementById('ritual-url') as HTMLInputElement;
  const url = urlInput?.value?.trim();
  if (url) burialUrls.push(url);
  finishBurialRitual();
});

const ritualFileInput = document.getElementById('ritual-file-txt') as HTMLInputElement;
ritualFileInput?.addEventListener('change', () => {
  const files = ritualFileInput.files;
  if (!files?.length) return;
  Array.from(files).forEach((file) => {
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === 'string') burialMemories.push(r.result);
    };
    r.readAsText(file);
  });
});

// =============================================
// 墓碑点击检测
// =============================================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('.hud')) return;
  
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  for (const hit of intersects) {
    if (hit.object.userData.isGrave || hit.object.parent?.userData.graveId) {
      const id = hit.object.userData.graveId || hit.object.parent?.userData.graveId;
      const g = graves.find(x => x.id === id);
      if (g) showGraveDetail(g);
      break;
    }
  }
});

function showGraveDetail(g: any) {
  selectedGrave = g;

  // 相机动画到墓碑
  const targetPos = new THREE.Vector3(g.position.x, 0, g.position.z);
  const cameraEndPos = new THREE.Vector3(
    g.position.x + Math.sin(cameraAngle) * 6,
    2,
    g.position.z + Math.cos(cameraAngle) * 6
  );

  cameraAnimState = {
    active: true,
    startPos: camera.position.clone(),
    endPos: cameraEndPos,
    startTarget: cameraTarget.clone(),
    endTarget: targetPos,
    progress: 0,
    duration: 1.2,
    ease: 'easeOutCubic'
  };

  document.getElementById('detail-id')!.textContent = g.id;
  document.getElementById('detail-name')!.textContent = g.name;
  document.getElementById('detail-epitaph')!.textContent = g.epitaph;
  document.getElementById('detail-date')!.textContent = g.date;
  document.getElementById('detail-coords')!.textContent = `${g.position.x.toFixed(1)}, ${g.position.z.toFixed(1)}`;

  const timelineEl = document.getElementById('detail-timeline-content');
  if (timelineEl) {
    const memCount = g.memories?.length ?? 0;
    const urlCount = g.urls?.length ?? 0;
    if (memCount > 0 || urlCount > 0) {
      timelineEl.innerHTML = `<p class="timeline-placeholder">Linked ${memCount} memories, ${urlCount} URLs. Timeline processing after backend integration.</p>`;
    } else {
      timelineEl.innerHTML = '<p class="timeline-placeholder">No timeline data. Upload memories during burial or add later.</p>';
    }
  }
  document.getElementById('grave-detail-panel')!.classList.remove('hidden');
}

// 关闭详情
document.getElementById('close-detail')?.addEventListener('click', () => {
  document.getElementById('grave-detail-panel')?.classList.add('hidden');
});

// 详情按钮
document.getElementById('btn-mourn')?.addEventListener('click', () => {
  if (selectedGrave) {
    processCommand(`MOURN ${selectedGrave.id}`);
    // 悼念粒子效果
    createMournParticles(selectedGrave.position.x, 1.5, selectedGrave.position.z);
  }
});
document.getElementById('btn-summon')?.addEventListener('click', () => {
  if (selectedGrave) {
    // 相机动画
    const targetPos = new THREE.Vector3(selectedGrave.position.x, 0, selectedGrave.position.z);
    const cameraEndPos = new THREE.Vector3(
      selectedGrave.position.x + Math.sin(cameraAngle) * 4,
      3,
      selectedGrave.position.z + Math.cos(cameraAngle) * 4
    );

    cameraAnimState = {
      active: true,
      startPos: camera.position.clone(),
      endPos: cameraEndPos,
      startTarget: cameraTarget.clone(),
      endTarget: targetPos,
      progress: 0,
      duration: 1.8,
      ease: 'easeOutCubic'
    };

    // 幽灵移动延迟
    setTimeout(() => {
      wraithGroup.position.set(selectedGrave.position.x, 1.5, selectedGrave.position.z);
    }, 400);

    processCommand(`SUMMON ${selectedGrave.id}`);
  }
});
document.getElementById('btn-decay')?.addEventListener('click', () => {
  if (selectedGrave) {
    // 衰减动画
    createDecayEffect(selectedGrave);
    processCommand(`DECAY ${selectedGrave.id}`);
    document.getElementById('grave-detail-panel')?.classList.add('hidden');
  }
});

// 悼念粒子效果
function createMournParticles(x: number, y: number, z: number) {
  const MOURN_COUNT = 30;
  const heartGeo = new THREE.BufferGeometry();
  const heartPos = new Float32Array(MOURN_COUNT * 3);

  for (let i = 0; i < MOURN_COUNT; i++) {
    heartPos[i * 3] = x + (Math.random() - 0.5) * 0.5;
    heartPos[i * 3 + 1] = y + (Math.random() - 0.5) * 0.5;
    heartPos[i * 3 + 2] = z + (Math.random() - 0.5) * 0.5;
  }

  heartGeo.setAttribute('position', new THREE.BufferAttribute(heartPos, 3));

  const hearts = new THREE.Points(
    heartGeo,
    new THREE.PointsMaterial({
      color: NEON_PINK,
      size: 0.15,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending
    })
  );
  scene.add(hearts);

  let mournTime = 0;
  const mournDuration = 2;

  function animateMourn() {
    mournTime += 0.016;
    const positions = hearts.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < MOURN_COUNT; i++) {
      positions[i * 3 + 1] += 0.02;
      positions[i * 3] += Math.sin(mournTime * 2 + i * 0.5) * 0.005;
    }

    hearts.geometry.attributes.position.needsUpdate = true;
    (hearts.material as THREE.PointsMaterial).opacity = 1 - (mournTime / mournDuration);

    if (mournTime < mournDuration) {
      requestAnimationFrame(animateMourn);
    } else {
      scene.remove(hearts);
      heartGeo.dispose();
    }
  }
  animateMourn();
}

// 衰减效果
function createDecayEffect(grave: any) {
  if (!grave.mesh) return;

  const mesh = grave.mesh;
  let decayTime = 0;
  const decayDuration = 0.8;

  function animateDecay() {
    decayTime += 0.016;
    let t = decayTime / decayDuration;

    if (t >= 1) {
      scene.remove(mesh);
      return;
    }

    const scale = 1 - t;
    mesh.scale.setScalar(scale);
    mesh.rotation.y += 0.1;
    mesh.rotation.z = Math.sin(t * Math.PI) * 0.2;

    mesh.children.forEach((child: any) => {
      if (child.material) {
        child.material.opacity = (child.material.userData?.baseOpacity || 1) * (1 - t);
        child.material.transparent = true;
      }
    });

    requestAnimationFrame(animateDecay);
  }
  animateDecay();
}

// =============================================
// 加载完成
// =============================================
setTimeout(() => {
  document.getElementById('loader')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  typeWrite('[SYSTEM INITIALIZED]\nWelcome to 0xRIP Digital Graveyard\nUse WASD to move, drag to rotate view\nType HELP for commands');
}, 2000);

// =============================================
// 动画循环 - 增强版
// =============================================
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.016;
  gravePulseTime += 0.016;

  // ===================================
  // 幽灵动画 - 大幅增强
  // ===================================
  // 主体上下浮动（更平滑）
  wraithGroup.position.y = 1.5 + Math.sin(time * 1.5) * 0.25;

  // 粒子漩涡效果
  const positions = wraithBody.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < WRAITH_PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const x = positions[i3];
    const z = positions[i3 + 2];
    const speed = pSpeeds[i] * 0.02;
    const offset = pOffsets[i];

    // 漩涡旋转
    const angle = Math.atan2(z, x) + speed;
    const radius = Math.sqrt(x * x + z * z);
    const newRadius = radius + Math.sin(time * 2 + offset) * 0.002;

    positions[i3] = Math.cos(angle) * newRadius;
    positions[i3 + 2] = Math.sin(angle) * newRadius;

    // Y轴波动
    positions[i3 + 1] += Math.sin(time * 3 + offset) * 0.003;
  }
  wraithBody.geometry.attributes.position.needsUpdate = true;

  // 旋转效果
  wraithBody.rotation.y = time * 0.3;

  // 核心动画
  core.rotation.x = time * 1.5;
  core.rotation.y = time * 0.8;
  shell.rotation.x = -time * 1.2;
  shell.rotation.z = time * 0.5;

  // 核心脉冲
  const pulseScale = 1 + Math.sin(time * 5) * 0.2;
  core.scale.setScalar(pulseScale);
  shell.scale.setScalar(1 + Math.sin(time * 3 + 1) * 0.15);

  // 光环旋转和缩放
  glowRing.rotation.z = time * 0.5;
  const ringScale = 1 + Math.sin(time * 2) * 0.3;
  glowRing.scale.setScalar(ringScale);

  // ===================================
  // 墓碑悬浮动画
  // ===================================
  graves.forEach(g => {
    if (g.mesh && g.mesh.userData.floatOffset !== undefined) {
      const offset = g.mesh.userData.floatOffset;

      if (g.mesh.userData.isFloating) {
        // 悬浮石板 - 更明显的浮动
        g.mesh.position.y = 1 + Math.sin(time * 1.2 + offset) * 0.15;
      } else {
        // 其他墓碑 - 轻微浮动
        g.mesh.position.y = Math.sin(time * 0.8 + offset) * 0.08;
      }

      // 悬停时的高亮效果
      if (hoveredGrave === g) {
        // 发光强度增加
        g.mesh.children.forEach((child: any) => {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            const baseIntensity = child.material.emissiveIntensity || 0.1;
            child.material.emissiveIntensity = baseIntensity + Math.sin(time * 8) * 0.15 + 0.2;
          }
        });
      } else if (g.mesh.userData.baseEmissiveIntensity !== undefined) {
        // 恢复原始强度
        g.mesh.children.forEach((child: any) => {
          if (child.material && child.material.emissiveIntensity !== undefined) {
            child.material.emissiveIntensity = THREE.MathUtils.lerp(
              child.material.emissiveIntensity,
              g.mesh.userData.baseEmissiveIntensity,
              0.1
            );
          }
        });
      }
    }
  });

  // ===================================
  // 氛围粒子 - 多层动态效果
  // ===================================
  const rainPositions = rain.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < ATMOSPHERE_PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    rainPositions[i3 + 1] -= rainVel[i];

    // 螺旋下落
    rainPositions[i3] += Math.sin(time + i * 0.1) * 0.01;

    // 重置到顶部
    if (rainPositions[i3 + 1] < -2) {
      rainPositions[i3 + 1] = 35;
      rainPositions[i3] = (Math.random() - 0.5) * 60;
      rainPositions[i3 + 2] = (Math.random() - 0.5) * 60;
    }
  }
  rain.geometry.attributes.position.needsUpdate = true;
  rain.rotation.y = time * 0.01;

  // 萤火虫效果
  const fireflyPositions = fireflies.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const i3 = i * 3;
    fireflyPositions[i3] += Math.sin(time * 0.5 + fireflyPhase[i]) * 0.01;
    fireflyPositions[i3 + 1] += Math.cos(time * 0.3 + fireflyPhase[i]) * 0.005;
    fireflyPositions[i3 + 2] += Math.sin(time * 0.4 + fireflyPhase[i]) * 0.01;

    // 边界检查
    if (Math.abs(fireflyPositions[i3]) > 25) fireflyPositions[i3] *= -0.9;
    if (fireflyPositions[i3 + 1] > 8 || fireflyPositions[i3 + 1] < 0.5) fireflyPositions[i3 + 1] *= -0.9;
    if (Math.abs(fireflyPositions[i3 + 2]) > 25) fireflyPositions[i3 + 2] *= -0.9;
  }
  fireflies.geometry.attributes.position.needsUpdate = true;

  // ===================================
  // 相机动画系统
  // ===================================
  if (cameraAnimState.active) {
    cameraAnimState.progress += 0.016 / cameraAnimState.duration;

    if (cameraAnimState.progress >= 1) {
      cameraAnimState.progress = 1;
      cameraAnimState.active = false;
    }

    const t = cameraAnimState.progress;
    const easedT = easing[cameraAnimState.ease as keyof typeof easing](t);

    // 插值相机位置
    camera.position.lerpVectors(cameraAnimState.startPos, cameraAnimState.endPos, easedT);

    // 插值目标点
    const currentTarget = new THREE.Vector3().lerpVectors(
      cameraAnimState.startTarget,
      cameraAnimState.endTarget,
      easedT
    );
    camera.lookAt(currentTarget);

    // 动画结束时设置最终状态
    if (!cameraAnimState.active) {
      cameraTarget.copy(cameraAnimState.endTarget);
      // 计算新的相机角度和半径
      const dx = camera.position.x - currentTarget.x;
      const dz = camera.position.z - currentTarget.z;
      cameraAngle = Math.atan2(dx, dz);
      cameraRadius = Math.sqrt(dx * dx + dz * dz);
      cameraHeight = camera.position.y;
    }
  } else {
    // 正常相机控制
    updateCamera();
  }

  // ===================================
  // 时间显示
  // ===================================
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const timeEl = document.getElementById('time-display');
  if (timeEl) timeEl.textContent = timeStr;

  renderer.render(scene, camera);
}
animate();

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
