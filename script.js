/* ===================================================================
   HAPPY 5 MONTHS — Interactive Love Website Engine (Vanilla JS)
   =================================================================== */

'use strict';

/* ============ 1. CONFIGURATION, UTILS & STATE MAPPING ============ */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const rand  = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const STATE = {
  unlocked: localStorage.getItem('h5m_unlocked') === '1',
  progress: JSON.parse(localStorage.getItem('h5m_progress') || '{}'),
  currentLevel: 0,
  logoClicks: 0,
  heartClicks: 0,
  keyBuffer: ''
};

const saveProgress = () => localStorage.setItem('h5m_progress', JSON.stringify(STATE.progress));

// Target dates based on the current year 2026 context
const ANIV_START = new Date(2025, 8, 4); 
const ANIV_1YEAR = new Date(2026, 8, 4); 

function toast(msg, ms = 2500) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), ms);
}

/* ============ 2. RESPONSIVE CURSOR TRAIL ENGINE ============ */
(() => {
  const trail = $('#mouseTrail');
  const cursor = $('#cursorHeart');
  const nodes = [];
  const TOTAL_NODES = 12;

  for (let i = 0; i < TOTAL_NODES; i++) {
    const el = document.createElement('div');
    el.className = 'trail-node';
    trail.appendChild(el);
    nodes.push({ el, x: 0, y: 0 });
  }

  let mx = 0, my = 0;
  let isMoving = false;

  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    isMoving = true;
    if (cursor) {
      cursor.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }
  });

  function animateTrail() {
    let cx = mx, cy = my;
    nodes.forEach((node, idx) => {
      node.x += (cx - node.x) * 0.35;
      node.y += (cy - node.y) * 0.35;
      node.el.style.transform = `translate3d(${node.x}px, ${node.y}px, 0) scale(${1 - idx / TOTAL_NODES})`;
      cx = node.x; cy = node.y;
    });
    requestAnimationFrame(animateTrail);
  }
  requestAnimationFrame(animateTrail);
})();

/* ============ 3. PERSISTENT PARTICLE CANVAS MATRIX ============ */
const AmbientParticles = (() => {
  const canvas = $('#particleCanvas');
  const ctx = canvas.getContext('2d');
  let pts = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  class Particle {
    constructor() { this.reset(); this.y = rand(0, canvas.height); }
    reset() {
      this.x = rand(0, canvas.width);
      this.y = canvas.height + 20;
      this.size = rand(2, 6);
      this.speed = rand(0.4, 1.2);
      this.alpha = rand(0.3, 0.7);
      this.oscSpeed = rand(0.01, 0.03);
      this.oscAmp = rand(0.5, 2);
      this.time = rand(0, 100);
      this.isHeart = Math.random() > 0.6;
    }
    update() {
      this.y -= this.speed;
      this.time += this.oscSpeed;
      this.x += Math.sin(this.time) * this.oscAmp;
      if (this.y < -20) this.reset();
    }
    draw() {
      ctx.fillStyle = `rgba(247, 106, 158, ${this.alpha})`;
      if (this.isHeart) {
        ctx.font = `${this.size * 2}px sans-serif`;
        ctx.fillText('❤', this.x, this.y);
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  for(let i=0; i<45; i++) pts.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();

/* ============ 4. FLOATING BUTTERFLIES LAYER ============ */
(() => {
  const container = $('#butterflies');
  const count = 6;
  for(let i=0; i<count; i++) {
    const b = document.createElement('div');
    b.style.cssText = `
      position: absolute; font-size: 20px; pointer-events: none;
      left: ${rand(5,95)}%; top: ${rand(10,90)}%;
      animation: floatB ${rand(6,12)}s infinite ease-in-out alternate;
      opacity: 0.45; will-change: transform;
    `;
    b.textContent = '🦋';
    container.appendChild(b);
  }
  const sheet = document.createElement('style');
  sheet.innerHTML = `@keyframes floatB { 0% { transform: translate3d(0,0,0) rotate(0deg); } 100% { transform: translate3d(${rand(-40,40)}px, ${rand(-60,60)}px, 0) rotate(${rand(-20,20)}deg); } }`;
  document.head.appendChild(sheet);
})();

/* ============ 5. VISUAL FX ENGINE (CONFETTI / SPARKS / FIREWORKS) ============ */
const FX = (() => {
  const canvas = $('#fxCanvas');
  const ctx = canvas.getContext('2d');
  let items = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  class FXItem {
    constructor(x, y, type, color) {
      this.x = x; this.y = y; this.type = type;
      this.vx = rand(-4, 4); this.vy = rand(-4, 4);
      this.alpha = 1; this.decay = rand(0.015, 0.03);
      this.color = color || `hsl(${irand(330, 360)}, 100%, 70%)`;
      this.size = rand(3, 8);
      if (type === 'confetti') { this.vy = rand(-5, -1); this.vx = rand(-2, 2); this.gravity = 0.12; }
      if (type === 'firework') { const ang = rand(0, Math.PI*2); const mag = rand(2, 7); this.vx = Math.cos(ang)*mag; this.vy = Math.sin(ang)*mag; this.gravity = 0.05; }
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.gravity) this.vy += this.gravity;
      this.alpha -= this.decay;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      if (this.type === 'sparkle') {
        ctx.font = `${this.size * 2}px sans-serif`;
        ctx.fillText('✨', this.x, this.y);
      } else if (this.type === 'heart') {
        ctx.font = `${this.size * 2.5}px sans-serif`;
        ctx.fillText('❤️', this.x, this.y);
      } else {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function spawn(x, y, type, count=15, color=null) {
    for(let i=0; i<count; i++) items.push(new FXItem(x, y, type, color));
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    items = items.filter(item => {
      item.update();
      if (item.alpha > 0) { item.draw(); return true; }
      return false;
    });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return { spawn };
})();

/* ============ 6. ROUTING ENGINE SCREEN DISPATCHER ============ */
function go(screenId) {
  $$('.screen').forEach(s => s.classList.add('hidden'));
  const target = $('#' + screenId);
  target.classList.remove('hidden');
  
  // Dynamic Map Navigation Indicator Mapping Engine sync
  let lvl = 0;
  if (screenId === 'level1Screen') lvl = 1;
  if (screenId === 'level2Screen') lvl = 2;
  if (screenId === 'level3Screen') lvl = 3;
  
  if (lvl > 0) {
    $('#gameProgressHUD').classList.remove('hidden');
    $$('.dot').forEach(d => {
      const dn = +d.getAttribute('data-level');
      d.classList.remove('active');
      if (dn === lvl) d.classList.add('active');
    });
  } else {
    $('#gameProgressHUD').classList.add('hidden');
  }

  // Auto trigger Level initializations
  if (screenId === 'level1Screen') initLevel1();
  if (screenId === 'level2Screen') initLevel2();
  if (screenId === 'level3Screen') initLevel3();
  if (screenId === 'letterScreen') initLetter();
  if (screenId === 'finalScreen') initFinal();
}

/* ============ 7. THE INTERACTIVE PASSWORD ACCESS GATEWAY ============ */
(() => {
  const input = $('#passInput');
  const btn = $('#unlockBtn');
  const card = $('.intro-card');

  function check() {
    // .replace(/\s+/g, '') strips out accidental spaces or mobile auto-correct spaces
    const v = input.value.trim().replace(/\s+/g, '');
    
    if (v === '04022026') {
      FX.spawn(window.innerWidth/2, window.innerHeight/2, 'sparkle', 60);
      FX.spawn(window.innerWidth/2, window.innerHeight/2, 'heart', 40);
      card.style.transform = 'scale(0.8) translate3d(0,-200px,0)';
      card.style.opacity = '0';
      STATE.unlocked = true;
      localStorage.setItem('h5m_unlocked', '1');
      setTimeout(() => { go('homeScreen'); startMusic(); startDaysBadge(); }, 600);
    } else {
      card.classList.add('shake');
      toast('อุ๊ย! รหัสไม่ถูกนะ ลองใหม่อีกครั้ง ❤️');
      setTimeout(() => card.classList.remove('shake'), 500);
    }
  }

  // Ensure both click and touch events trigger smoothly on iPad/iPhone
  btn.addEventListener('click', (e) => { e.preventDefault(); check(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
})();
/* ============ 8. GAME STAGE PROGRESS MAP ENGINE HUD ============ */
function startDaysBadge() {
  const diff = Date.now() - ANIV_START.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  $('.hud-title').textContent = `Day ${days} Together ✨`;
}

/* ============ 9. SCREEN 2: GAME HOME INTERACTIVE LOGIC ============ */
$('#startGameBtn').addEventListener('click', () => { go('level1Screen'); });

/* ============ 10. GAME LEVEL 1 SYSTEM: HEART CATCH GAME ============ */
function initLevel1() {
  const canvas = $('#level1Canvas');
  const ctx = canvas.getContext('2d');
  let score = 0, combo = 0, hearts = [];
  let basketX = window.innerWidth / 2;
  const basketWidth = 90, basketHeight = 20;
  let active = true;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    basketX = canvas.width / 2;
  }
  window.addEventListener('resize', resize); resize();

  // Unified Interaction Tracking Layer for Laptop Mice and Mobile iOS Touch Events
  function moveHandler(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    basketX = clamp(clientX - basketWidth/2, 0, canvas.width - basketWidth);
  }
  canvas.addEventListener('mousemove', moveHandler);
  canvas.addEventListener('touchmove', e => { e.preventDefault(); moveHandler(e); }, { passive: false });

  class FallingObject {
    constructor() {
      this.x = rand(20, canvas.width - 20);
      this.y = -30;
      this.size = rand(20, 30);
      this.speed = rand(3, 6);
      const r = Math.random();
      this.type = r > 0.85 ? 'gold' : (r > 0.70 ? 'broken' : 'normal');
    }
    update() { this.y += this.speed; }
    draw() {
      ctx.save();
      ctx.font = `${this.size}px sans-serif`;
      ctx.textAlign = 'center';
      if (this.type === 'normal') ctx.fillText('❤️', this.x, this.y);
      else if (this.type === 'gold') ctx.fillText('💛', this.x, this.y);
      else ctx.fillText('💔', this.x, this.y);
      ctx.restore();
    }
  }

  function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Basket Catch Platform Mesh
    ctx.fillStyle = 'rgba(247, 106, 158, 0.7)';
    ctx.beginPath();
    ctx.roundRect(basketX, canvas.height - 80, basketWidth, basketHeight, 10);
    ctx.fill();

    if (Math.random() < 0.04 && hearts.length < 12) hearts.push(new FallingObject());

    hearts = hearts.filter(h => {
      h.update(); h.draw();
      
      // Collision bounding coordinates evaluation
      if (h.y >= canvas.height - 90 && h.y <= canvas.height - 60 && h.x >= basketX - 10 && h.x <= basketX + basketWidth + 10) {
        if (h.type === 'broken') {
          score = Math.max(0, score - 2); combo = 0;
          FX.spawn(h.x, h.y, 'sparkle', 10, '#333');
          toast('Oops! หลบหัวใจสลายนะ 💔');
        } else {
          combo++;
          const gain = h.type === 'gold' ? 3 : 1;
          score += gain;
          FX.spawn(h.x, h.y, h.type === 'gold' ? 'sparkle' : 'heart', 12);
          if (h.type === 'gold') toast('Bonus! หัวใจทองคำ ✨');
        }
        $('#l1Score').textContent = score;
        $('#l1Combo').textContent = combo + 'x';
        $('#l1Bar').style.width = `${Math.min(100, (score/20)*100)}%`;
        return false;
      }

      if (h.y > canvas.height + 20) {
        if (h.type !== 'broken') combo = 0; $('#l1Combo').textContent = '0x';
        return false;
      }
      return true;
    });

    if (score >= 20) {
      active = false;
      STATE.progress.l1 = true; saveProgress();
      $('.dot[data-level="1"]').classList.add('done');
      toast('Level 1 Passed! สุดยอดเลยเบบี๋ 🎉');
      setTimeout(() => go('level2Screen'), 1500);
      return;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

/* ============ 11. GAME LEVEL 2 SYSTEM: JIGSAW PUZZLE ============ */
function initLevel2() {
  const canvas = $('#puzzleCanvas');
  const ctx = canvas.getContext('2d');
  let size = Math.min(window.innerWidth - 40, 360);
  canvas.width = size; canvas.height = size;

  const img = new Image();
  img.src = 'puzzle-bg.jpg';
  
  let pieces = [];
  const COLS = 4, ROWS = 4;
  const w = size / COLS, h = size / ROWS;
  let dragged = null, offsetX=0, offsetY=0;
  let winTriggered = false;

  img.onload = () => { createPieces(); render(); };
  // Visual fallback if asset file is missing
  img.onerror = () => { createPieces(); render(); };

  function createPieces() {
    pieces = [];
    for(let r=0; r<ROWS; r++){
      for(let c=0; c<COLS; c++){
        pieces.push({
          id: r*COLS + c, sx: c*w, sy: r*h,
          x: rand(0, size - w), y: rand(0, size - h),
          tx: c*w, ty: r*h, solved: false
        });
      }
    }
  }

  function render() {
    ctx.clearRect(0,0,size,size);
    // Grid reference system backdrop rendering lines
    ctx.strokeStyle = 'rgba(247,106,158,0.15)';
    ctx.lineWidth = 1;
    for(let i=0; i<=COLS; i++) { ctx.beginPath(); ctx.moveTo(i*w,0); ctx.lineTo(i*w,size); ctx.stroke(); }
    for(let j=0; j<=ROWS; j++) { ctx.beginPath(); ctx.moveTo(0,j*h); ctx.lineTo(size,j*h); ctx.stroke(); }

    // Render non-dragged items then overlays current selection on active index pointer stack
    pieces.forEach(p => { if(p !== dragged) drawPiece(p); });
    if(dragged) drawPiece(dragged);
  }

  function drawPiece(p) {
    ctx.save();
    if(img.complete && img.naturalWidth > 0) {
      // Hardware accelerated matrix slice texture clipping maps
      ctx.beginPath(); ctx.rect(p.x, p.y, w, h); ctx.clip();
      ctx.drawImage(img, p.sx * (img.width/size), p.sy * (img.height/size), w * (img.width/size), h * (img.height/size), p.x, p.y, w, h);
    } else {
      ctx.fillStyle = `hsl(${(p.id*25)%360}, 85%, 80%)`;
      ctx.fillRect(p.x, p.y, w, h);
      ctx.fillStyle = 'rgba(107,58,82,0.4)';
      ctx.font = '12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(`🧩`, p.x + w/2, p.y + h/2);
    }
    ctx.strokeStyle = p.solved ? 'rgba(247,106,158,0.4)' : '#fff';
    ctx.lineWidth = p.solved ? 2 : 1.5;
    ctx.strokeRect(p.x, p.y, w, h);
    ctx.restore();
  }

  function getTarget(cx, cy) {
    for(let i=pieces.length-1; i>=0; i--) {
      const p = pieces[i];
      if(!p.solved && cx >= p.x && cx <= p.x+w && cy >= p.y && cy <= p.y+h) return p;
    }
    return null;
  }

  function downHandler(cx, cy) {
    const p = getTarget(cx, cy);
    if(p) { dragged = p; offsetX = cx - p.x; offsetY = cy - p.y; }
  }
  function moveHandler(cx, cy) {
    if(!dragged) return;
    dragged.x = clamp(cx - offsetX, -w/2, size - w/2);
    dragged.y = clamp(cy - offsetY, -h/2, size - h/2);
    render();
  }
  function upHandler() {
    if(!dragged) return;
    const p = dragged; dragged = null;
    if(Math.abs(p.x - p.tx) < 16 && Math.abs(p.y - p.ty) < 16) {
      p.x = p.tx; p.y = p.ty; p.solved = true;
      FX.spawn(p.x + w/2, p.y + h/2, 'sparkle', 8);
    }
    render();
    checkWin();
  }

  // Cross Platform Canvas Pointer Interactions mapping abstraction layer
  canvas.addEventListener('mousedown', e => { const r = canvas.getBoundingClientRect(); downHandler(e.clientX - r.left, e.clientY - r.top); });
  window.addEventListener('mousemove', e => { if(!dragged) return; const r = canvas.getBoundingClientRect(); moveHandler(e.clientX - r.left, e.clientY - r.top); });
  window.addEventListener('mouseup', () => upHandler());

  canvas.addEventListener('touchstart', e => { const r = canvas.getBoundingClientRect(); downHandler(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); }, { passive: true });
  canvas.addEventListener('touchmove', e => { if(!dragged) return; const r = canvas.getBoundingClientRect(); moveHandler(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top); }, { passive: true });
  canvas.addEventListener('touchend', () => upHandler());

  function checkWin() {
    if(pieces.every(p => p.solved) && !winTriggered) {
      winTriggered = true;
      STATE.progress.l2 = true; saveProgress();
      $('.dot[data-level="2"]').classList.add('done');
      toast('ภาพคู่ของเราเสร็จสมบูรณ์แล้วคุณมีนา ฮ่าๆ 💕');
      // Spawn cinematic corner fireworks sequences
      setTimeout(() => FX.spawn(window.innerWidth*0.2, window.innerHeight*0.3, 'firework', 35), 300);
      setTimeout(() => FX.spawn(window.innerWidth*0.8, window.innerHeight*0.4, 'firework', 35), 700);
      setTimeout(() => go('level3Screen'), 2200);
    }
  }
}

/* ============ 12. GAME LEVEL 3 SYSTEM: GIFT BOX BURST ENGINE ============ */
function initLevel3() {
  const box = $('#giftBox');
  const circle = $('#giftProgressCircle');
  let clicks = 0; const TARGET = 15;
  
  // Calculate dynamic circular SVG stroke attributes
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  circle.style.strokeDasharray = `${circumference} ${circumference}`;
  circle.style.strokeDashoffset = circumference;

  function progress(val) {
    circle.style.strokeDashoffset = circumference - (val / TARGET) * circumference;
  }

  box.className = 'gift-box ripple';
  progress(0);

  function tap(e) {
    if(clicks >= TARGET) return;
    clicks++;
    progress(clicks);
    FX.spawn(e.clientX || window.innerWidth/2, e.clientY || window.innerHeight/2, 'sparkle', 6);

    if (clicks === 1) box.classList.add('bursting');

    if(clicks >= TARGET) {
      box.classList.remove('bursting');
      FX.spawn(window.innerWidth/2, window.innerHeight/2, 'firework', 60);
      FX.spawn(window.innerWidth/2, window.innerHeight/2, 'heart', 45);
      box.style.transform = 'scale(0.1)'; box.style.opacity = '0';
      STATE.progress.l3 = true; saveProgress();
      $('.dot[data-level="3"]').classList.add('done');
      setTimeout(() => { go('letterScreen'); }, 700);
    }
  }
  
  box.onclick = tap;
}

/* ============ 13. SCREEN 6: LOVE LETTER UNVEILING MECHANICS ============ */
function initLetter() {
  const env = $('#mainEnvelope');
  const paper = $('#letterPaper');
  env.classList.remove('open');
  env.onclick = () => {
    if(!env.classList.contains('open')) {
      env.classList.add('open');
      $('#envHint').classList.add('hidden');
      setTimeout(typeText, 1400);
    }
  };
}

function typeText() {
  const txt = "ขอบคุณที่รักไอโง่ สตูปิด อาวาว่า อย่างเค้ามา 5 เดือนแล้วนะเบบี้แองเจิ้ลมีนา เค้าอยากมีเธอในทุกวันแบบนี้ตลอดไปเลย รักที่สุดในโลก อย่าเพิ่งหายไปไหนนะ เค้าจะปรับปรุงที่เค้าทำไม่ดีๆเพื่อให้เค้าได้อยู่กับเธอไปนานๆเลย จุ้บๆเบบี้";
  const target = $('#typedLetterText');
  target.textContent = '';
  let idx = 0;
  function step() {
    if(idx < txt.length) {
      target.textContent += txt.charAt(idx);
      idx++;
      setTimeout(step, 65);
    } else {
      // Append click conversion redirect option down the line 
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.className = 'btn-primary ripple';
        btn.style.cssText = 'margin:24px auto 0 display:block;';
        btn.textContent = 'ดูเวลานับถอยหลังของเรา 📆';
        btn.onclick = (e) => { e.stopPropagation(); go('finalScreen'); };
        $('#letterPaper').appendChild(btn);
      }, 1000);
    }
  }
  step();
}

/* ============ 14. SCREEN 7: FINAL COUNTDOWN TICKER ENGINE ============ */
let _cdInterval = null;
function initFinal() {
  if(_cdInterval) clearInterval(_cdInterval);
  function update() {
    const now = Date.now();
    const diff = ANIV_1YEAR.getTime() - now;

    if (diff <= 0) {
      $('#cdDays').textContent = '0'; $('#cdHours').textContent = '0';
      $('#cdMin').textContent = '0'; $('#cdSec').textContent = '0';
      return;
    }

    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    $('#cdDays').textContent = d; $('#cdHours').textContent = h;
    $('#cdMin').textContent = m; $('#cdSec').textContent = s;
  }
  _cdInterval = setInterval(update, 1000);
  update();
}

$('#restartBtn').onclick = () => {
  STATE.progress = {}; saveProgress();
  $$('.dot').forEach(d => d.className = 'dot');
  go('homeScreen');
};

/* ============ 15. CODENAME / CUSTOM EASTER EGG INJECTIONS ============ */
// 1. Click Logo 10 Times Jumpscare Module Trigger
$('#heartLogo').addEventListener('click', () => {
  STATE.logoClicks++;
  if(STATE.logoClicks >= 10) {
    STATE.logoClicks = 0;
    const js = $('#jumpscare');
    js.classList.remove('hidden');
    setTimeout(() => { js.classList.add('hidden'); }, 2500);
  }
});

// 2. Secret Keyword Input Detector Pipeline
window.addEventListener('keydown', e => {
  if($('#passwordScreen').classList.contains('hidden')) return;
  STATE.keyBuffer += e.key.toLowerCase();
  if(STATE.keyBuffer.length > 20) STATE.keyBuffer = STATE.keyBuffer.substring(1);
  if(STATE.keyBuffer.includes('iloveyou')) {
    STATE.keyBuffer = '';
    $('#secretPage').classList.remove('hidden');
  }
});
$('#secretClose').onclick = () => $('#secretPage').classList.add('hidden');

// 3. Heart Click Node Layer Interaction Tracking Mod
$('#clickableHeart').addEventListener('click', e => {
  STATE.heartClicks++;
  if(STATE.heartClicks >= 5) {
    STATE.heartClicks = 0;
    const messages = [
      "เบบี้คือความสุขของเค้านะครับ 🥰",
      "รักมีนาที่สุดในสามโลกเลย 🌎",
      "ขอบคุณที่อยู่ข้างกันนะคนดี 🌸",
      "เค้าสัญญาจะเด็กดีของเธอ จุ๊บๆ 🍼"
    ];
    toast(messages[irand(0, messages.length - 1)]);
    FX.spawn(e.clientX || window.innerWidth/2, e.clientY || window.innerHeight/2, 'heart', 15);
  }
});

/* ============ 16. BACKGROUND AUDIO CONTROLS ENGINE ============ */
function startMusic() {
  const audio = $('#bgMusic');
  // Attempt invocation via WebAudio policies
  audio.play().catch(() => {
    window.addEventListener('click', () => { audio.play().catch(()=>{}); }, { once: true });
    window.addEventListener('touchstart', () => { audio.play().catch(()=>{}); }, { once: true });
  });
  $('#musicPlayer').classList.remove('hidden');
}

(() => {
  const audio = $('#bgMusic');
  $('#musicToggle').addEventListener('click', () => {
    if (audio.paused) audio.play().catch(()=>{}); else audio.pause();
    updateMusicUI();
  });
  $('#muteToggle').addEventListener('click', () => { audio.muted = !audio.muted; updateMusicUI(); });
  $('#volumeSlider').addEventListener('input', e => { 
    audio.volume = +e.target.value; 
    if (audio.muted) { audio.muted = false; }
    updateMusicUI(); 
  });
})();

function updateMusicUI() {
  const audio = $('#bgMusic');
  $('#musicToggle').textContent = audio.paused ? '▶' : '⏸';
  $('#muteToggle').textContent  = audio.muted ? '🔇' : '🔊';
}

/* ============ 17. RE-ENTRY HARDWARE BOOTSTRAPPING ENGINE ============ */
window.addEventListener('load', () => {
  Object.keys(STATE.progress).forEach(k => {
    const n = +k.replace('l','');
    const dot = $(`.dot[data-level="${n}"]`);
    if (dot) dot.classList.add('done');
  });
  if (STATE.unlocked) {
    go('homeScreen');
    startDaysBadge();
    startMusic();
  }
});

// Structural Button Fluid Ripple Material Feedback Injection Implementation
document.addEventListener('click', e => {
  const btn = e.target.closest('.ripple');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left || rect.width/2;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top || rect.height/2;
  
  const ink = document.createElement('span');
  ink.className = 'ripple-ink';
  ink.style.left = `${x}px`;
  ink.style.top = `${y}px`;
  
  // Clean up existing elements if present
  const prev = $('.ripple-ink', btn);
  if(prev) prev.remove();
  
  btn.appendChild(ink);
});
