const SPREADSHEET_ID = "1l6UKUU7WVX-hfYO7WDLCrjKbUx028rnE";

const KEYS = {
  title: "Meta-Title",
  description: "Meta-Description",
  about: "About",
  project: "Title",
  date: "String",
  location: "Dimension",
  note: "Frame",
  image: "Images",
  shape: "Shape",	
 	material: "Material",
 
};

const CSV_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

const KITE_PALETTES = [
  { body: '#e8503a', stripe: '#f2a65a', outline: '#c13420' },
  { body: '#5b8dd9', stripe: '#a8d0f5', outline: '#2e5fa3' },
  { body: '#e8c93a', stripe: '#f5e87a', outline: '#b89c10' },
  { body: '#5dbb7c', stripe: '#a0e4b8', outline: '#2d8a50' },
  { body: '#c456d4', stripe: '#e8a0f0', outline: '#8a2a9a' },
  { body: '#f08040', stripe: '#ffd090', outline: '#b85010' },
  { body: '#4db8c4', stripe: '#90e0e8', outline: '#228898' },
];

/* ── 월드 크기 ── */
const WORLD_W = 12000;
const WORLD_H = 12000;

/* ── 패닝 상태 ── */
let panX = 0, panY = 0;   // 현재 실제 오프셋
let targetX = 0, targetY = 0; // 관성 목표
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let velX = 0, velY = 0;
let lastMouseX = 0, lastMouseY = 0;
let didDrag = false; // 드래그 여부 판별

const world = document.getElementById('world');
const stringLayer = document.getElementById('string-layer');

/* ── 범위 클램프 ── */
function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

function clampPan(x, y) {
  return {
    x: clamp(x, -(WORLD_W - window.innerWidth), 0),
    y: clamp(y, -(WORLD_H - window.innerHeight), 0),
  };
}

function applyPan() {
  world.scrollLeft = -panX;
  world.scrollTop  = -panY;
 

  // 모든 열린 모달 위치 업데이트
  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.dataset.worldX) {
      modal.style.left = (parseFloat(modal.dataset.worldX) + panX) + 'px';
      modal.style.top  = (parseFloat(modal.dataset.worldY) + panY) + 'px';
    }
  });
}






/* ── 마우스 드래그 ── 
document.addEventListener('mousedown', e => {
  // 모달 위에서는 무시
  if (e.target.closest('.modal-overlay')) return;

  isDragging = true;
  didDrag = false;
  dragStartX = e.clientX - panX;
  dragStartY = e.clientY - panY;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  velX = 0; velY = 0;
  document.body.classList.add('panning');
});

document.addEventListener('mousemove', e => {
  if (kites.some(k => k.strDragging)) return;
  if (!isDragging) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;

  velX = dx;
  velY = dy;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;

  const c = clampPan(e.clientX - dragStartX, e.clientY - dragStartY);
  panX = c.x; panY = c.y;
  targetX = panX; targetY = panY;
  applyPan();
});

document.addEventListener('mouseup', e => {
 kites.forEach(k => { k.strDragging = false; });
});*/




/* ── 휠 / 트랙패드 ── */
world.addEventListener('scroll', () => {
  panX = -world.scrollLeft;
  panY = -world.scrollTop;
  targetX = panX;
  targetY = panY;
  applyPan();
});

/* ── 터치 ── */
let touch0 = null;
let touchMoved = false;

document.addEventListener('touchstart', e => {
  if (e.target.closest('.modal-overlay')) return;
  touch0 = e.touches[0];
  dragStartX = touch0.clientX - panX;
  dragStartY = touch0.clientY - panY;
  lastMouseX = touch0.clientX;
  lastMouseY = touch0.clientY;
  velX = 0; velY = 0;
  touchMoved = false;
}, { passive: true });

document.addEventListener('touchmove', e => {
  if (!touch0) return;
  const t = e.touches[0];
  velX = t.clientX - lastMouseX;
  velY = t.clientY - lastMouseY;
  lastMouseX = t.clientX;
  lastMouseY = t.clientY;
  touchMoved = true;

  const c = clampPan(t.clientX - dragStartX, t.clientY - dragStartY);
  panX = c.x; panY = c.y;
  targetX = panX; targetY = panY;
  applyPan();
}, { passive: true });

document.addEventListener('touchend', () => {
  if (!touch0) return;
  touch0 = null;
  if (touchMoved) {
    const c = clampPan(targetX + velX * 8, targetY + velY * 8);
    targetX = c.x; targetY = c.y;
  }
});

/* ── 관성 업데이트 ── */
const chapter2 = document.getElementById('chapter2');
const CHAPTER2_THRESHOLD = 0.9;

function updateInertia() {
  if (isDragging) return;
  panX += (targetX - panX) * 0.12;
  panY += (targetY - panY) * 0.12;
  applyPan();

  const maxPanY = -(WORLD_H - window.innerHeight);
  const progress = panY / maxPanY;
  if (chapter2) {
    const reveal = Math.max(0, (progress - CHAPTER2_THRESHOLD) / (1 - CHAPTER2_THRESHOLD));
    chapter2.style.opacity = reveal;
    chapter2.style.pointerEvents = 'none';
    chapter2.style.transform = `translateY(${(1 - reveal) * 20}px)`;
  }

}





/* ── CSV ── */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}

function splitCSVLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

/* ── Kite ── */
const kites = [];

function makeDiamondSVG(p, imgUrl, id) {
  if (imgUrl) {
    // 이미지가 있으면 SVG 없이 img 태그로 직접 표시 (클리핑 없음)
    return `<img class="kite-img" src="${imgUrl}" alt="" />`;
  }
  // 이미지 없으면 기존 마름모 SVG 유지
  return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" class="kite-svg">
    <polygon points="30,2 58,30 30,58 2,30" fill="${p.body}"/>
    <polygon points="2,30 58,30 52,36 8,36" fill="${p.stripe}" opacity="0.5"/>
    <polygon points="30,2 36,8 36,52 30,58 24,52 24,8" fill="${p.stripe}" opacity="0.5"/>
    <circle cx="30" cy="30" r="4" fill="${p.outline}" opacity="0.6"/>
  </svg>`;
}

function createKite(row, index) {
  const palette = KITE_PALETTES[index % KITE_PALETTES.length];
  const wrap = document.createElement('div');
  wrap.className = 'kite-wrap';

  const tailLen = 30 + Math.random() * 40;
  
  const imgUrl = (row[KEYS.image] || '').trim();
  wrap.innerHTML = makeDiamondSVG(palette, imgUrl)
  + `<div class="kite-tail" style="height:${tailLen}px"></div>`;

  const label = document.createElement('span');
  label.className = 'kite-label';
  label.textContent = row[KEYS.project] || '';
  wrap.appendChild(label);

  world.appendChild(wrap);

  // 월드 좌표계 초기 위치
  const margin = 120;
  const wx = margin + Math.random() * (WORLD_W - margin * 2);
  

const strLen = 800 + Math.random() * 10000;

const kiteMaxY = WORLD_H * CHAPTER2_THRESHOLD - margin;
const strGroundY = kiteMaxY; // 실 끝이 닿을 Y (월드 기준)
const wy = clamp(strGroundY - strLen, margin, kiteMaxY);

  const speed = 0.3 + Math.random() * 0.4;
  const angle = Math.random() * Math.PI * 2;


const kiteW = imgUrl ? 200 : 60; // 이미지 있으면 120px, 없으면 60px
  const strGroundX = (wx - 30) + kiteW / 2; // 연 하단 중앙 x

  
  
  const state = {
     wrap, wx, wy,
  vx: Math.cos(angle) * speed,
  vy: Math.sin(angle) * speed,
  swayAmp:    0.3 + Math.random() * 0.4,
  swayFreq:   0.0004 + Math.random() * 0.0006,
  swayOffset: Math.random() * Math.PI * 2,
  row,
  // 실 끝 오프셋 (연 하단 기준 상대좌표)
  strLen,
  strOffX: 0,
  strOffY: strLen,
  // 실 드래그 상태

      strGroundX,  
};

  kites.push(state);

  // ── 클릭 판별: mousedown → mouseup 사이 이동 없으면 클릭 ──
  let downX = 0, downY = 0;


wrap.addEventListener('mousedown', e => {
  downX = e.clientX;
  downY = e.clientY;
  e.stopPropagation();
});

wrap.addEventListener('mouseup', e => {
  const moved = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
  if (moved < 6) openModal(row, e.clientX, e.clientY, state);
});
  // 터치 탭
  let tStartX = 0, tStartY = 0;
  wrap.addEventListener('touchstart', e => {
    tStartX = e.touches[0].clientX;
    tStartY = e.touches[0].clientY;
  }, { passive: true });
 wrap.addEventListener('touchend', e => {
  const t = e.changedTouches[0];
  const moved = Math.abs(t.clientX - tStartX) + Math.abs(t.clientY - tStartY);
  if (moved < 10) openModal(row, t.clientX, t.clientY);
});

 

return state;
}




function buildPopupSVG(structure, textContent) {
  const btn = `<button class="popup-close">✕</button>`;
  const s = structure.toLowerCase();
  const uid = Date.now() + Math.random().toString(36).slice(2); // ← 고유 id 생성

  let pathD = '';
  let w = 200, h = 200;

  if (s.includes('flat')) {
    w = 200; h = 240;
    pathD = `M 100,5 L 195,100 L 100,235 L 5,100 Z M 100,5 L 100,235 M 5,100 L 195,100`;
  }
else if (s.includes('bowed')) {
  w = 380; h = 320;
  pathD = `M 20,60 L 80,260
           M 160,10 L 240,310
           M 300,60 L 360,260
           M 50,160 Q 200,280 330,160`;
}
 else if (s.includes('box')) {
  w = 280; h = 280;
  pathD = `M 60,80 L 220,80 L 220,240 L 60,240 Z
           M 20,40 L 180,40 L 180,200 L 20,200 Z
           M 20,40 L 60,80
           M 180,40 L 220,80
           M 180,200 L 220,240
           M 20,200 L 60,240`;}


  else if (s.includes('sled')) {
    w = 220; h = 260;
    pathD = `M 40,20 Q 110,5 180,20 L 210,240 Q 110,260 10,240 Z`;
  }
 else if (s.includes('delta')) {
  w = 300; h = 220;
  pathD = `M 200,10 L 10,310
           M 200,10 L 390,310
           M 200,10 L 200,310
           M 105,160 L 295,160`;
}
 else if (s.includes('compound')) {
  w = 220; h = 240;
    pathD = `M 50,10 L 170,10 L 200,120 L 170,230 L 50,230 L 20,120 Z M 50,10 L 170,230 M 170,10 L 50,230 M 20,120 L 200,120`;
 }
 else if (s.includes('rotor')) {
  w = 340; h = 300;
  pathD = `M 80,70 A 70,70 0 1 1 79.99,70
           M 240,60 A 60,60 0 1 1 239.99,60
           M 80,70 L 240,60
           M 80,210 L 240,180`;
}
  else if (s.includes('soft') || s.includes('flexible')) {
    w = 380; h = 200;
    pathD = `M 0,100 Q 60,5 120,100 Q 190,195 260,100 Q 320,5 380,100`;
  }
  else {
    w = 200; h = 240;
    pathD = `M 100,5 L 195,100 L 100,235 L 5,100 Z`;
  }

  return `${btn}<svg class="popup-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" overflow="visible">
    <defs>
      <path id="kite-path-${uid}" d="${pathD}"/>
    </defs>
    <text class="pt">
      <textPath href="#kite-path-${uid}">${textContent}</textPath>
    </text>
  </svg>`;
}


/* ── Modal ── */
let activeKite = null; // 현재 모달에 연결된 연
const modalContainer = document.getElementById('modal-container');
const openKites = new Set(); // 모달이 열린 연 추적

function openModal(row, clickX, clickY, kiteState) {
  // 이미 열린 연이면 무시
  if (kiteState && openKites.has(kiteState)) return;
  if (kiteState) openKites.add(kiteState);

 
  // 연 숨기기
  kiteState.wrap.style.opacity = '0';
  kiteState.wrap.style.pointerEvents = 'none';

  const popup = document.createElement('div');
  popup.className = 'kite-popup';


// 순서대로 각 열 값 가져오기
const fields = [
  { label: 'Structure', value: row['Structure'] },
  { label: 'String',    value: row['String']    },
  { label: 'Dimension', value: row['Dimension'] },
  { label: 'Frame',     value: row['Frame']     },
  { label: 'Material',  value: row['Material']  },
  { label: 'Title',     value: row['Title']     },
  { label: 'Country',   value: row['Country']   },
].filter(f => (f.value || '').trim());

// "Label: Value · Label: Value · ..." 세트를 반복
const set = fields.map(f => `${f.label}: ${f.value.trim()}`).join(' · ') + ' · ';
const rep = (n = 15) => set.repeat(n);

const t1 = rep();

  console.log('row keys:', Object.keys(row));
  console.log('Structure value:', row['Structure']);

  const structure = (row['Structure'] || '').toLowerCase();
  console.log('structure lowercase:', structure);

  popup.innerHTML = buildPopupSVG(structure, t1);

  // #world 안에 직접 삽입 — 연과 같은 좌표계
  world.appendChild(popup);

  // 연의 월드 좌표 기준으로 팝업 위치 설정
  const kiteW = (row[KEYS.image] || '').trim() ? 200 : 60;
  const kiteH = kiteW;
  popup.style.left = (kiteState.wx - 30) + 'px';
  popup.style.top  = (kiteState.wy - 30) + 'px';
  popup.style.width = kiteW + 'px'; // 연 크기에 맞게 시작

  // 닫기
  popup.querySelector('.popup-close').addEventListener('click', () => {
    popup.remove();
    kiteState.wrap.style.opacity = '1';
    kiteState.wrap.style.pointerEvents = 'all';
    openKites.delete(kiteState);
  });
}


/* ── Animation loop ── */
let lastTime = 0;

function animate(time) {
  updateInertia();
  const paths = [];

  kites.forEach(k => {
    // 모달이 열린 연은 움직임 정지
   if (openKites.has(k)) {
  k.wrap.style.transform = 'rotate(0deg)';
   updateStrHandle(k, paths);
  return;
}

    const sway = Math.sin(time * k.swayFreq + k.swayOffset) * k.swayAmp;
    k.wx += k.vx + sway * 0.5;
    k.wy += k.vy * 0.6;
    // 현재 뷰포트 기준 화면 범위 계산
const margin = 60;
const kiteMaxY = WORLD_H * CHAPTER2_THRESHOLD  - margin; // 챕터2 시작 지점
if (k.wx < margin)     { k.wx = margin;     k.vx =  Math.abs(k.vx); }
if (k.wx > WORLD_W - margin) { k.wx = WORLD_W - margin; k.vx = -Math.abs(k.vx); }
if (k.wy < margin)     { k.wy = margin;     k.vy =  Math.abs(k.vy); }
if (k.wy > kiteMaxY)   { k.wy = kiteMaxY;   k.vy = -Math.abs(k.vy); } // ← kiteMaxY 사용



const rot = sway * 8;
k.wrap.style.left = (k.wx - 30) + 'px';
k.wrap.style.top  = (k.wy - 30) + 'px';
k.wrap.style.transform = `rotate(${rot}deg)`;
 updateStrHandle(k, paths);
  });

   stringLayer.innerHTML = paths.join('');

  lastTime = time;
  requestAnimationFrame(animate);
}




function updateStrHandle(k, paths) {
 const kiteH = (k.row[KEYS.image] || '').trim() ? 200 : 60;
  const kiteW = kiteH;


   // 연 하단 중앙 (뷰포트 좌표)
  const bx = (k.wx - 30) + kiteW / 2 + panX;
  const by = (k.wy - 60) + kiteH + panY;

  // 실 끝은 항상 바닥 고정 (월드 → 뷰포트 좌표)
  const groundY = WORLD_H * CHAPTER2_THRESHOLD - 60; // 실이 닿는 바닥 Y (월드)
  const ex = k.strGroundX + panX;                         // x는 연 하단과 같은 x
  const ey = groundY + panY;             // 바닥 고정

  // 실 방향 벡터 업데이트 (연이 움직여도 실 끝은 바닥에)
  k.strOffX = ex - bx;
  k.strOffY = ey - by;



  const handle = k.wrap.querySelector('.str-handle');
  if (handle) {
    handle.style.left = (kiteW / 2 + k.strOffX) + 'px';
    handle.style.top  = (kiteH   + k.strOffY) + 'px';
  }
 const sag = Math.abs(k.strOffY) * 0.15;
  const mx  = bx + k.strOffX * 0.5;
  const my  = by + k.strOffY * 0.5 + sag;


  paths.push(`
    <path d="M ${bx} ${by} Q ${mx} ${my} ${ex} ${ey}"
      stroke="rgba(255, 255, 255, 0.31)"
      stroke-width="1"
      fill="none"/>
  `);
}







/* ── Fetch ── */
fetch(CSV_URL)
  .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); })
  .then(text => {
    const rows  = parseCSV(text);
    const first = rows[0] || {};
   
// 새 코드
const titleText = first[KEYS.title] || '';
const titleWords = titleText.split(' ').filter(Boolean);

// 기존 site-title 숨기기
document.getElementById('site-title').style.display = 'none';

titleWords.forEach(word => {
  const el = document.createElement('div');
  el.className = 'floating-word';
  el.textContent = word;

  // 뷰포트 범위 안에 배치
  const margin = 100;
  const wx = margin + Math.random() * (window.innerWidth - margin * 2);
  const wy = margin + Math.random() * (window.innerHeight - margin * 2);

  el.style.left = wx + 'px';
  el.style.top  = wy + 'px';

  world.appendChild(el);
});

    document.getElementById('site-desc').textContent  = first[KEYS.description] || '';
    document.getElementById('about-text').textContent = first[KEYS.about]       || '';
    document.title = first[KEYS.title] || 'Kite';

    rows.filter(r => r[KEYS.project]).forEach((row, i) => createKite(row, i));

    requestAnimationFrame(animate);
  })
  .catch(err => {
    console.error('Error:', err);
    document.body.innerHTML += `<p style="color:#fff;padding:2rem;font-family:monospace">
      Failed to load data.<br>
      ① Sharing: "Anyone with the link (Viewer)"<br>
      ② Check Spreadsheet ID<br>
      ③ Use Live Server or GitHub Pages (file:// won't work)
    </p>`;
  });



  // 디버그용 — 브라우저 콘솔에서 실제 키 이름 확인
console.log('row keys:', Object.keys(row));
console.log('Structure value:', row['Structure']);

const structure = (row['Structure'] || '').toLowerCase();
console.log('structure lowercase:', structure);

popup.innerHTML = buildPopupSVG(structure, t1);