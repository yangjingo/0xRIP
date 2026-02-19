/**
 * 0xRIP - CYBER NECROPOLIS v2.0
 * 数字墓地 - 赛博朋克风格 3D 场景
 */

import * as THREE from 'three';
import { EffectComposer } from 'three-stdlib';
import { RenderPass } from 'three-stdlib';
import { ShaderPass } from 'three-stdlib';
import { pixelateVertexShader, pixelateFragmentShader } from './shaders/pixelate';
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
let composer: EffectComposer;
const scene = new THREE.Scene();
scene.background = new THREE.Color(DARK_BG);
scene.fog = new THREE.FogExp2(DARK_BG, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById('canvas-container')?.appendChild(renderer.domElement);

// 像素化后处理
composer = new EffectComposer(renderer);
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
  return group;
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
  if (ind) ind.textContent = `步骤 ${step}/4`;
}

function finishBurialRitual() {
  if (pendingGraveAfterConfirm) {
    pendingGraveAfterConfirm.memories = burialMemories;
    pendingGraveAfterConfirm.urls = burialUrls;
  }
  closeBurialRitual();
}

// =============================================
// 幽灵
// =============================================
const wraithGroup = new THREE.Group();
wraithGroup.position.set(0, 1.5, 0);

// 粒子
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(300), pCol = new Float32Array(300);
for (let i = 0; i < 100; i++) {
  const y = (Math.random() - 0.5) * 2;
  const r = Math.abs(y) > 0.5 ? 0.15 : 0.3;
  const a = Math.random() * Math.PI * 2;
  pPos[i * 3] = Math.cos(a) * r * Math.random();
  pPos[i * 3 + 1] = y;
  pPos[i * 3 + 2] = Math.sin(a) * r * Math.random();
  pCol[i * 3] = 0; pCol[i * 3 + 1] = 0.95; pCol[i * 3 + 2] = 1;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const wraithBody = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
wraithGroup.add(wraithBody);

// 核心
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 1), new THREE.MeshBasicMaterial({ color: NEON_PINK, wireframe: true }));
core.position.y = 0.3; wraithGroup.add(core);
scene.add(wraithGroup);

// =============================================
// 氛围粒子
// =============================================
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(600);
for (let i = 0; i < 200; i++) {
  rainPos[i * 3] = (Math.random() - 0.5) * 50;
  rainPos[i * 3 + 1] = Math.random() * 30;
  rainPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: NEON_CYAN, size: 0.05, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending }));
scene.add(rain);

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
        print(`[招魂] ${g.name} 已唤醒`, 'success');
        wraithGroup.position.set(g.position.x, 1.5, g.position.z);
      } else {
        print('[错误] 灵魂未找到', 'error');
      }
      break;
    }
    case 'MOURN':
    case '悼念': {
      const g = graves.find(x => x.id.includes(arg) || x.name.toLowerCase().includes(arg.toLowerCase()));
      if (g) print(`[悼念] 为 ${g.name} 献上电子鲜花`, 'success');
      else print('[错误] 目标不存在', 'error');
      break;
    }
    case 'LIST':
    case '列表': {
      if (graves.length === 0) print('[墓地空空] 使用 BURY 埋葬数据');
      else graves.forEach(g => print(`> ${g.id}: ${g.name}`));
      break;
    }
    case 'DECAY':
    case '删除': {
      const idx = graves.findIndex(x => x.id.includes(arg) || x.name.toLowerCase().includes(arg.toLowerCase()));
      if (idx !== -1) {
        const g = graves.splice(idx, 1)[0];
        if (g.mesh) scene.remove(g.mesh);
        print(`[删除] ${g.name} 已风化`, 'warning');
        document.getElementById('soul-count')!.textContent = String(graves.length);
      } else print('[错误] 目标不存在', 'error');
      break;
    }
    case 'HELP':
    case '帮助':
      print('BURY [name] - 埋葬 | SUMMON [id] - 召唤 | MOURN [id] - 悼念 | LIST - 列表 | DECAY [id] - 删除 | DOOM - ???');
      break;
    case 'DOOM':
      document.body.classList.add('glitch-active');
      setTimeout(() => document.body.classList.remove('glitch-active'), 2000);
      print('[SYSTEM MELTDOWN]', 'error');
      break;
    default:
      print('输入 HELP 查看指令');
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
  input.value = `while(alive) { love++; } // 最终迭代于${new Date().toLocaleDateString()}`;
});

document.getElementById('ritual-step-2-next')?.addEventListener('click', () => {
  burialEpitaph = (document.getElementById('ritual-epitaph') as HTMLInputElement).value.trim() || 'while(alive) { soul++; }';
  const preview = document.getElementById('ritual-death-preview');
  if (preview) {
    preview.innerHTML = `
      <strong>${burialName}</strong><br/>
      棺型: ${burialCoffinType}<br/>
      墓志铭: ${burialEpitaph.slice(0, 40)}${burialEpitaph.length > 40 ? '…' : ''}
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
      timelineEl.innerHTML = `<p class="timeline-placeholder">已关联 ${memCount} 条记忆、${urlCount} 个 URL。时间线加工将在后端接入后展示。</p>`;
    } else {
      timelineEl.innerHTML = '<p class="timeline-placeholder">暂无时间线数据。在埋葬时上传记忆与资料，或稍后为该碑补充上传。</p>';
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
  if (selectedGrave) processCommand(`MOURN ${selectedGrave.id}`);
});
document.getElementById('btn-summon')?.addEventListener('click', () => {
  if (selectedGrave) {
    wraithGroup.position.set(selectedGrave.position.x, 1.5, selectedGrave.position.z);
    processCommand(`SUMMON ${selectedGrave.id}`);
  }
});
document.getElementById('btn-decay')?.addEventListener('click', () => {
  if (selectedGrave) {
    processCommand(`DECAY ${selectedGrave.id}`);
    document.getElementById('grave-detail-panel')?.classList.add('hidden');
  }
});

// =============================================
// 加载完成
// =============================================
setTimeout(() => {
  document.getElementById('loader')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');
  typeWrite('[系统初始化完成]\n欢迎访问 0xRIP 数字墓地\n使用 WASD 移动，鼠标拖拽旋转视角\n输入 HELP 查看指令');
}, 2000);

// =============================================
// 动画循环
// =============================================
let time = 0;
function animate() {
  requestAnimationFrame(animate);
  time += 0.016;
  
  // 幽灵动画
  wraithGroup.position.y = 1.5 + Math.sin(time * 2) * 0.2;
  wraithBody.rotation.y = time * 0.5;
  core.rotation.x = time * 2;
  core.scale.setScalar(1 + Math.sin(time * 4) * 0.15);
  
  // 墓碑悬浮
  graves.forEach(g => {
    if (g.mesh && g.mesh.userData.floatOffset !== undefined) {
      const offset = g.mesh.userData.floatOffset;
      if (g.mesh.userData.isFloating) {
        g.mesh.position.y = 1 + Math.sin(time + offset) * 0.1;
      } else {
        g.mesh.position.y = Math.sin(time * 0.5 + offset) * 0.05;
      }
    }
  });
  
  // 氛围粒子
  const rainPos = rain.geometry.attributes.position.array as Float32Array;
  for (let i = 0; i < 200; i++) {
    rainPos[i * 3 + 1] -= 0.1;
    if (rainPos[i * 3 + 1] < -2) rainPos[i * 3 + 1] = 30;
  }
  rain.geometry.attributes.position.needsUpdate = true;
  rain.rotation.y = time * 0.02;
  
  // 相机
  updateCamera();
  
  // 时间显示
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
  const timeEl = document.getElementById('time-display');
  if (timeEl) timeEl.textContent = timeStr;

  composer.render();
}
animate();

// 窗口大小调整
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
