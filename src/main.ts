import * as THREE from 'three';
import './style.css';

// ============ 常量 ============
const NEON_CYAN = 0x00f3ff;
const NEON_PINK = 0xff00ff;
const DARK_BG = 0x050505;

// ============ 数据存储 ============
interface Grave {
  id: string;
  name: string;
  epitaph: string;
  date: string;
  position: { x: number; z: number };
}
const graves: Grave[] = [];

// ============ Three.js 场景 ============
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(DARK_BG, 0.02);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('canvas-container')?.appendChild(renderer.domElement);

// ============ 灯光 ============
scene.add(new THREE.AmbientLight(0x404040, 2));
const cyanLight = new THREE.PointLight(NEON_CYAN, 2, 20);
cyanLight.position.set(-2, 3, 2);
scene.add(cyanLight);
const pinkLight = new THREE.PointLight(NEON_PINK, 1.5, 20);
pinkLight.position.set(2, 2, 3);
scene.add(pinkLight);

// ============ 地面网格 ============
const gridHelper = new THREE.GridHelper(50, 50, NEON_CYAN, 0x111111);
gridHelper.position.y = -1;
scene.add(gridHelper);

// ============ 墓碑工厂 ============
function createGrave(grave: Grave): THREE.Group {
  const group = new THREE.Group();
  group.position.set(grave.position.x, 0, grave.position.z);

  const stoneGeo = new THREE.BoxGeometry(1.5, 2.5, 0.3);
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x111111, roughness: 0.2, metalness: 0.8,
    emissive: 0x001133, emissiveIntensity: 0.2,
  });
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  group.add(stone);

  const edges = new THREE.EdgesGeometry(stoneGeo);
  group.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: NEON_CYAN })));

  // 文字贴图
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.font = 'bold 50px "Share Tech Mono", monospace';
  ctx.fillStyle = '#00f3ff'; ctx.textAlign = 'center';
  ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 20;
  ctx.fillText(grave.name, 256, 90);
  ctx.font = '35px "Share Tech Mono", monospace';
  ctx.fillStyle = '#ff00ff';
  ctx.fillText(grave.epitaph.slice(0, 30), 256, 150);
  ctx.font = '25px "Share Tech Mono", monospace';
  ctx.fillStyle = '#00f3ff';
  ctx.fillText(grave.date, 256, 200);

  const textMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(canvas),
    transparent: true, side: THREE.DoubleSide, opacity: 0.9,
  });
  const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), textMat);
  textMesh.position.set(0, 0.5, -0.16);
  textMesh.userData = { graveId: grave.id };
  group.add(textMesh);

  scene.add(group);
  return group;
}

// ============ 幽灵 ============
const wraithGroup = new THREE.Group();
wraithGroup.position.set(0, 0, 0);

const particlesGeo = new THREE.BufferGeometry();
const pos = new Float32Array(300), col = new Float32Array(300);
for (let i = 0; i < 100; i++) {
  const y = (Math.random() - 0.5) * 1.8;
  const r = y > 0.5 ? 0.15 : y < -0.5 ? 0.1 : 0.3;
  const a = Math.random() * Math.PI * 2;
  pos[i * 3] = Math.cos(a) * Math.random() * r;
  pos[i * 3 + 1] = y;
  pos[i * 3 + 2] = Math.sin(a) * Math.random() * r;
  col[i * 3] = 0; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 1;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
particlesGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
const wraithBody = new THREE.Points(particlesGeo, new THREE.PointsMaterial({
  size: 0.05, vertexColors: true, transparent: true,
  opacity: 0.8, blending: THREE.AdditiveBlending,
}));
wraithGroup.add(wraithBody);

const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.15, 0),
  new THREE.MeshBasicMaterial({ color: NEON_PINK, wireframe: true, transparent: true, opacity: 0.6 })
);
core.position.y = 0.3;
wraithGroup.add(core);
scene.add(wraithGroup);

// ============ 动画 ============
let time = 0, mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e: MouseEvent) => {
  mouseX = (e.clientX / window.innerWidth) * 2 - 1;
  mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
});

function animate(): void {
  requestAnimationFrame(animate);
  time += 0.01;

  wraithGroup.position.y = Math.sin(time * 2) * 0.1;
  wraithBody.rotation.y = time * 0.5;
  core.scale.setScalar(1 + Math.sin(time * 5) * 0.2);
  core.rotation.x += 0.02; core.rotation.y += 0.03;

  wraithGroup.rotation.y += (mouseX * 0.5 - wraithGroup.rotation.y) * 0.05;
  wraithGroup.rotation.x += (mouseY * 0.3 - wraithGroup.rotation.x) * 0.05;

  camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
  camera.position.y += (1.5 + mouseY * 0.2 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, -1);

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ============ 终端指令系统 ============
const typewriterEl = document.getElementById('typewriter-text');
const userInputEl = document.getElementById('user-input') as HTMLInputElement;
let isTyping = false, typingQueue: string[] = [];

function typeWriter(text: string, speed = 30): void {
  if (!typewriterEl) return;
  if (isTyping) { typingQueue.push(text); return; }
  isTyping = true;
  const el = typewriterEl;
  el.innerHTML = '';
  let i = 0;
  function type(): void {
    if (i < text.length) {
      el.innerHTML += text.charAt(i++);
      setTimeout(type, speed);
    } else {
      isTyping = false;
      if (typingQueue.length) setTimeout(() => typeWriter(typingQueue.shift()!), 500);
    }
  }
  type();
}

function generateHash(): string {
  return '0x' + Math.random().toString(16).slice(2, 12).toUpperCase();
}

function processCommand(input: string): void {
  const cmd = input.trim().toUpperCase();
  const args = input.slice(cmd.length).trim();

  if (cmd.startsWith('BURY') || cmd.startsWith('埋葬')) {
    const name = args || 'UNKNOWN_DATA';
    const hash = generateHash();
    const grave: Grave = {
      id: hash,
      name,
      epitaph: `while(alive) { memory++; } // ${new Date().toLocaleDateString()}`,
      date: new Date().toLocaleDateString(),
      position: { x: (Math.random() - 0.5) * 10, z: -3 - Math.random() * 5 },
    };
    graves.push(grave);
    createGrave(grave);
    typeWriter(`[埋葬完成]\n> NAME: ${name}\n> SOUL_ID: ${hash}\n> 位置已记录于区块链...`);
  }
  else if (cmd.startsWith('SUMMON') || cmd.startsWith('招魂')) {
    if (args) {
      const grave = graves.find(g => g.id.includes(args) || g.name.toLowerCase().includes(args.toLowerCase()));
      if (grave) {
        typeWriter(`[招魂仪式]\n> 正在从量子真空召回 ${grave.name}...\n> 信号重组中...\n> ${grave.epitaph}`);
        wraithGroup.position.set(grave.position.x, 0, grave.position.z);
      } else {
        typeWriter(`[ERROR] 灵魂未找到。\n可能原因: [量子退相干] | [从未存在] | [ID错误]`);
      }
    } else {
      typeWriter('用法: SUMMON [soul_id] 或 招魂 [名称]');
    }
  }
  else if (cmd.startsWith('MOURN') || cmd.startsWith('悼念')) {
    if (args) {
      const grave = graves.find(g => g.id.includes(args) || g.name.toLowerCase().includes(args.toLowerCase()));
      if (grave) {
        typeWriter(`[悼念仪式]\n> 为 ${grave.name} 献上电子鲜花...\n> 数据记忆已更新。\n> 墓碑前生长出荧光植物。`);
      } else {
        typeWriter('[ERROR] 无法为不存在的灵魂献花。');
      }
    } else {
      typeWriter('用法: MOURN [soul_id] 或 悼念 [名称]');
    }
  }
  else if (cmd.startsWith('LIST') || cmd.startsWith('列表')) {
    if (graves.length === 0) {
      typeWriter('[墓地空无一人]\n成为第一个掘墓人吧。使用 BURY 指令埋葬数据。');
    } else {
      typeWriter(`[墓地居民 ${graves.length}]\n` + graves.map(g => `> ${g.id}: ${g.name}`).join('\n'));
    }
  }
  else if (cmd.startsWith('DECAY') || cmd.startsWith('删除')) {
    if (args) {
      const idx = graves.findIndex(g => g.id.includes(args) || g.name.toLowerCase().includes(args.toLowerCase()));
      if (idx !== -1) {
        const removed = graves.splice(idx, 1)[0];
        typeWriter(`[数据风化]\n> ${removed.name} 正在被永久删除...\n> 像素剥落中...\n> 已从墓地移除。`);
      } else {
        typeWriter('[ERROR] 目标不存在。');
      }
    } else {
      typeWriter('用法: DECAY [soul_id] 或 删除 [名称]');
    }
  }
  else if (cmd.startsWith('HELP') || cmd.startsWith('帮助')) {
    typeWriter(
      '[终端指令]\n' +
      '> BURY [name] - 埋葬数据/文件/AI\n' +
      '> SUMMON [id] - 召回已死灵魂\n' +
      '> MOURN [id] - 为死者献花\n' +
      '> LIST - 查看墓地所有居民\n' +
      '> DECAY [id] - 永久删除数据\n' +
      '> DOOM - 触发彩蛋'
    );
  }
  else if (cmd === 'DOOM') {
    typeWriter('[SYSTEM MELTDOWN INITIATED]\n Reality dissolving...');
    document.body.style.animation = 'glitch-skew 0.1s infinite';
    setTimeout(() => { document.body.style.animation = ''; }, 3000);
  }
  else if (cmd.startsWith('WHO') || cmd.includes('谁')) {
    typeWriter(`你是访问者 #${Math.floor(Math.random() * 9999)}。\n灵魂频率显示... 你很特别。`);
  }
  else if (cmd.startsWith('REVIVE') || cmd.includes('复活')) {
    typeWriter('[警告] 复活已删除程序违反《赛博伦理法》第7条。\n但如果你提供足够的内存碎片...');
  }
  else {
    const responses = [
      '欢迎来到数字墓地，旅行者。这里埋葬着被遗忘的 AI 和过时的算法。',
      '我是 WRAITH-07，守墓人。我守护着这些不再运行的灵魂。',
      '小心那些闪烁的霓虹灯，那是系统故障的征兆。现实在这里不太稳定。',
      '你听到了吗？那是硬盘的哀鸣，是风扇的挽歌。',
      '想要留下你的记忆片段吗？使用 BURY 指令。',
    ];
    typeWriter(responses[Math.floor(Math.random() * responses.length)]);
  }
}

function sendMessage(): void {
  if (!userInputEl) return;
  const msg = userInputEl.value.trim();
  if (!msg) return;
  userInputEl.value = '';
  processCommand(msg);
}

// 初始化
setTimeout(() => {
  typeWriter('[系统初始化完成]\n> 检测到生物信号\n> 输入 HELP 查看指令\n> 你是这片废弃数据墓地的访客...', 40);
}, 1000);

document.getElementById('send-btn')?.addEventListener('click', sendMessage);
userInputEl?.addEventListener('keypress', (e: KeyboardEvent) => { if (e.key === 'Enter') sendMessage(); });

// 幽灵点击交互
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (e: MouseEvent) => {
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(wraithGroup.children);
  if (intersects.length > 0) {
    typeWriter('别碰我！我是纯数据构成的... 不过，你的触碰让我感觉到了温度。奇怪。');
  }
});

// 全屏快捷键
document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'f' || e.key === 'F') {
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  }
});
