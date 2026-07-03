/* ===================================================================
   HAPPY 5 MONTHS — Interactive Love Website (Vanilla JS)
   =================================================================== */

'use strict';

/* ============ 1. UTILS & STATE ============ */
const $  = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const rand  = (a, b) => a + Math.random() * (b - a);
const irand = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const STATE = {
  unlocked: localStorage.getItem('h5m_unlocked') === '1',
  progress: JSON.parse(localStorage.getItem('h5m_progress') || '{}'),
};
const saveProgress = () => localStorage.setItem('h5m_progress', JSON.stringify(STATE.progress));

const ANNIVERSARY_START = new Date(2025, 8, 4); 
const ONE_YEAR = new Date(2026, 8, 4);          

function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), ms);
}

/* ============ 2. CUSTOM CURSOR + TRAIL ============ */
(() => {
  const trail = $('#mouseTrail');
  const heart = $('#cursorHeart');
  if (matchMedia('(hover: none)').matches) return;
  let mx = innerWidth/2, my = innerHeight/2, tx = mx, ty = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; heart.style.left = mx+'px'; heart.style.top = my+'px'; });
  addEventListener('mousedown', () => heart.style.transform = 'translate(-50%,-50%) scale(1.4)');
  addEventListener('mouseup',   () => heart.style.transform = 'translate(-50%,-50%) scale(1)');
  function loop() {
    tx += (mx - tx) * 0.18; ty += (my - ty) * 0.18;
    trail.style.left = tx+'px'; trail.style.top = ty+'px';
    requestAnimationFrame(loop);
  }
  loop();
  
  let last = 0;
  addEventListener('mousemove', e => {
    if (performance.now() - last < 45) return;
    last = performance.now();
    const s = document.createElement('div');
    s.textContent = ['✨','💗','·'][irand(0,2)];
    s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;
      pointer-events:none;font-size:${irand(10,18)}px;color:#f76a9e;z-index:9997;
      transform:translate(-50%,-50%);transition:all .8s ease-out;opacity:.9`;
    document.body.appendChild(s);
    requestAnimationFrame(() => {
      s.style.transform = `translate(-50%,-50%) translate(${rand(-30,30)}px,${rand(-30,-60)}px)`;
      s.style.opacity = '0';
    });
    setTimeout(() => s.remove(), 800);
  });
})();

/* ============ 3. BACKGROUND PARTICLES + FLOATERS ============ */
(() => {
  const c = $('#particleCanvas'); const ctx = c.getContext('2d');
  let w, h, parts;
  function resize() { w = c.width = innerWidth; h = c.height = innerHeight; }
  resize(); addEventListener('resize', resize);
  parts = Array.from({length: 40}, () => ({ // ลดจำนวนลงเล็กน้อยเพื่อความลื่นไหลบนมือถือ
    x: rand(0,w), y: rand(0,h), r: rand(1,3.5),
    vx: rand(-0.15,0.15), vy: rand(-0.25,-0.05),
    a: rand(0.3,0.8), hue: rand(320,355)
  }));
  function tick() {
    ctx.clearRect(0,0,w,h);
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.y < -10) { p.y = h+10; p.x = rand(0,w); }
      if (p.x < -10) p.x = w+10; if (p.x > w+10) p.x = -10;
      ctx.beginPath();
      const g = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
      g.addColorStop(0, `hsla(${p.hue},80%,80%,${p.a})`);
      g.addColorStop(1, `hsla(${p.hue},80%,80%,0)`);
      ctx.fillStyle = g;
      ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();

  const heartsLayer = $('#floatingHearts');
  const bfLayer = $('#butterflies');
  const HEARTS = ['💗','💖','💕','💘','🩷'];
  const BFS = ['🦋','🌸','✨','⭐','🌟'];
  function spawn(layer, symbols) {
    const el = document.createElement('div');
    el.className = 'float-item';
    el.textContent = symbols[irand(0, symbols.length-1)];
    el.style.left = rand(0, 100) + 'vw';
    el.style.fontSize = rand(14, 30) + 'px';
    el.style.animationDuration = rand(9, 18) + 's';
    el.style.animationDelay = rand(0, 6) + 's';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 22000);
  }
  setInterval(() => spawn(heartsLayer, HEARTS), 900);
  setInterval(() => spawn(bfLayer, BFS), 1800);
})();

/* ============ 4. SCREEN ROUTER ============ */
const SCREENS = ['passwordScreen','homeScreen','level1Screen','level2Screen','finalScreen','letterScreen','countdownScreen'];
function go(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) { el.classList.add('active'); }
    else if (el.classList.contains('active')) {
      el.classList.add('leaving');
      setTimeout(() => { el.classList.remove('active','leaving'); }, 480);
    }
  });
}

/* ============ 5. PASSWORD SCREEN ============ */
(() => {
  const CORRECT = '04022026';
  const pins = $$('#pinInputs .pin');
  const btn = $('#unlockBtn');
  const msg = $('#pwMessage');
  const card = $('.password-card');

  pins.forEach((p, i) => {
    p.addEventListener('input', e => {
      p.value = p.value.replace(/\D/g,'').slice(0,1);
      if (p.value && i < pins.length-1) pins[i+1].focus();
    });
    p.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !p.value && i > 0) pins[i-1].focus();
      if (e.key === 'Enter') tryUnlock();
    });
    p.addEventListener('paste', e => {
      const t = (e.clipboardData.getData('text')||'').replace(/\D/g,'').slice(0,8);
      if (!t) return;
      e.preventDefault();
      [...t].forEach((ch, k) => { if (pins[k]) pins[k].value = ch; });
      pins[Math.min(t.length, pins.length)-1].focus();
    });
  });

  function tryUnlock() {
    const val = pins.map(p => p.value).join('');
    if (val === CORRECT) {
      msg.textContent = '✨ ยินดีต้อนรับเบบี๋ ✨';
      STATE.unlocked = true; localStorage.setItem('h5m_unlocked','1');
      const dl = $('.door-left'), dr = $('.door-right');
      dl.classList.add('show'); dr.classList.add('show');
      burstSparkles(innerWidth/2, innerHeight/2, 80);
      setTimeout(() => { dl.classList.add('open'); dr.classList.add('open'); }, 500);
      setTimeout(() => { go('homeScreen'); dl.classList.remove('show','open'); dr.classList.remove('show','open'); startDaysBadge(); }, 1900);
    } else {
      msg.textContent = 'อุ๊ย! รหัสไม่ถูกนะ ลองใหม่อีกครั้ง ❤️';
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 500);
      pins.forEach(p => p.value = ''); pins[0].focus();
    }
  }
  btn.addEventListener('click', tryUnlock);
})();

/* ============ 6. HOME SCREEN ============ */
function startDaysBadge() {
  const badge = $('#daysBadge');
  const days = Math.floor((Date.now() - ANNIVERSARY_START.getTime()) / 86400000);
  badge.textContent = `Day ${Math.max(days,0)} of us 💗`;
}

$('#startGameBtn').addEventListener('click', () => {
  startMusic();
  markDot(1);
  go('level1Screen');
});

function markDot(n) {
  STATE.progress['l'+n] = true; saveProgress();
  $$('.level-dots .dot').forEach(d => {
    if (STATE.progress['l'+d.dataset.level]) d.classList.add('done');
  });
}

(() => {
  const heart = $('#cornerHeart');
  const MSGS = [
    'ยิ้มหน่อยสิเบบี๋ 🥰', 'รักที่สุดในโลก 💗', 'You + Me = ♾',
    'คิดถึงเธอทุกวินาที 💌', 'เธอคือของขวัญที่ดีที่สุด 🎁', 'อยากกอดเธอตอนนี้เลย 🤍'
  ];
  let n = 0;
  heart.addEventListener('click', e => {
    n++;
    burstSparkles(e.clientX || (e.touches && e.touches[0].clientX), e.clientY || (e.touches && e.touches[0].clientY), 14);
    heart.animate([{transform:'scale(1.5)'},{transform:'scale(1)'}],{duration:300});
    if (n >= 5) { toast(MSGS[irand(0, MSGS.length-1)]); n = 0; }
  });
})();

(() => {
  const logo = $('#secretLogo');
  let n = 0, timer;
  logo.addEventListener('click', () => {
    n++; clearTimeout(timer); timer = setTimeout(() => n = 0, 3000);
    if (n >= 10) { n = 0; triggerJumpscare(); }
  });
})();

function triggerJumpscare() {
  const js = $('#jumpscare');
  js.classList.remove('hidden');
  try {
    const ac = new (window.AudioContext||window.webkitAudioContext)();
    const o = ac.createOscillator(); const g = ac.createGain();
    o.type = 'sawtooth'; o.frequency.value = 700;
    o.connect(g); g.connect(ac.destination);
    g.gain.setValueAtTime(0.25, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.7);
    o.start(); o.stop(ac.currentTime + 0.7);
  } catch(e){}
  setTimeout(() => js.classList.add('hidden'), 1400);
}

/* ============ 7. LEVEL 1: HEART CATCH (FIXED FOR IPAD/IPHONE TOUCH) ============ */
(() => {
  const area   = $('#l1Area');
  const scoreE = $('#l1Score');
  const comboE = $('#l1Combo');
  const livesE = $('#l1Lives');
  const progE  = $('#l1Progress');
  const overlay= $('#l1Overlay');
  const startBtn = $('#l1Start');
  const TARGET = 20;
  let score, combo, lives, running, catcher, catcherX, items, spawnTimer, lastT;

  function reset() {
    score = 0; combo = 0; lives = 3; running = false;
    scoreE.textContent = 0; comboE.textContent = 0; livesE.textContent = 3;
    progE.style.width = '0%';
    items = []; area.innerHTML = '';
    catcher = document.createElement('div');
    catcher.className = 'catcher'; catcher.textContent = '🧺';
    catcher.style.left = '50%';
    catcherX = innerWidth/2;
    area.appendChild(catcher);
  }

  function start() {
    overlay.classList.add('hidden');
    reset(); running = true; lastT = performance.now();
    scheduleSpawn(); requestAnimationFrame(loop);
  }

  function scheduleSpawn() {
    if (!running) return;
    spawnItem();
    const delay = Math.max(320, 900 - score*20);
    spawnTimer = setTimeout(scheduleSpawn, delay);
  }

  function spawnItem() {
    const r = Math.random();
    let type = 'pink';
    if (r < 0.12) type = 'gold';
    else if (r < 0.32) type = 'broken';
    const el = document.createElement('div');
    el.className = 'falling';
    el.textContent = type === 'gold' ? '💛' : type === 'broken' ? '💔' : '💗';
    const x = rand(20, innerWidth - 40);
    el.style.left = x + 'px';
    area.appendChild(el);
    items.push({ el, x, y: -30, vy: rand(2.4, 4.2) + score*0.05, type });
  }

  function loop(t) {
    if (!running) return;
    const dt = Math.min(32, t - lastT) / 16.67;
    lastT = t;
    catcher.style.left = catcherX + 'px';
    for (let i = items.length-1; i >= 0; i--) {
      const it = items[i];
      it.y += it.vy * dt;
      it.el.style.transform = `translateY(${it.y}px)`;
      const bottom = innerHeight - 90;
      if (it.y >= bottom && Math.abs(it.x - catcherX) < 60) {
        onCatch(it);
        it.el.remove();
        items.splice(i,1);
        continue;
      }
      if (it.y > innerHeight) {
        if (it.type === 'pink') { combo = 0; comboE.textContent = 0; }
        it.el.remove();
        items.splice(i,1);
      }
    }
    requestAnimationFrame(loop);
  }

  function onCatch(it) {
    const cx = catcherX, cy = innerHeight - 90;
    if (it.type === 'broken') {
      lives--; livesE.textContent = lives; combo = 0; comboE.textContent = 0;
      popup(cx, cy, '-1 ❤', '#e35d7c');
      if (lives <= 0) return end(false);
    } else {
      const add = it.type === 'gold' ? 3 : 1;
      score += add; combo++;
      scoreE.textContent = Math.min(score, TARGET);
      comboE.textContent = combo;
      progE.style.width = Math.min(100, score/TARGET*100) + '%';
      popup(cx, cy, '+' + add + (it.type==='gold'?' ✨':''), '#f76a9e');
      burstSparkles(cx, cy, 12);
      if (score >= TARGET) return end(true);
    }
  }

  function popup(x, y, text, color) {
    const p = document.createElement('div');
    p.className = 'pop'; p.textContent = text; p.style.left = x+'px'; p.style.top = y+'px'; p.style.color = color;
    area.appendChild(p); setTimeout(() => p.remove(), 800);
  }

  function end(win) {
    running = false; clearTimeout(spawnTimer);
    if (win) {
      toast('ผ่านด่านแรกแล้วเก่งมากเบบี๋! 🧺✨');
      markDot(2); setTimeout(() => go('level2Screen'), 1600);
    } else {
      overlay.classList.remove('hidden');
      $('#l1Title').textContent = 'Game Over 🥺';
      $('#l1Text').textContent = 'ไม่เป็นไรนะเบบี๋ ลองใหม่อีกครั้งเพื่อไปต่อกันนะ!';
      startBtn.textContent = 'Play Again 🔁';
    }
  }

  // แทร็กพิกัดทั้งแบบ เมาส์ และ ทัชสกรีนของ iPad/iPhone
  function moveCatcher(clientX) {
    catcherX = clamp(clientX, 45, innerWidth - 45);
  }
  addEventListener('mousemove', e => { if (running) moveCatcher(e.clientX); });
  area.addEventListener('touchmove', e => {
    if (running && e.touches.length > 0) {
      moveCatcher(e.touches[0].clientX);
    }
  }, { passive: true });
  area.addEventListener('touchstart', e => {
    if (running && e.touches.length > 0) {
      moveCatcher(e.touches[0].clientX);
    }
  }, { passive: true });

  startBtn.addEventListener('click', start);
  reset();
})();

/* ============ 8. LEVEL 2: QUIZ ============ */
(() => {
  const QUESTIONS = [
    { q: 'เราเจอกันครั้งแรกที่ไหนเอ่ย? 📍', a: ['คาเฟ่สุดน่ารัก', 'ห้างสรรพสินค้า', 'สวนสาธารณะ', 'โลกออนไลน์'], c: 3, h: 'ใบ้ให้ว่าตอนนั้นเหงาๆ เลยปัดมาเจอเธอไง' },
    { q: 'เมนูโปรดที่ชอบสั่งมาทานด้วยกันบ่อยที่สุดคืออะไร? 🍲', a: ['ชาบูหม่าล่า', 'ส้มตำไก่ย่าง', 'พิซซ่าหน้าชีส', 'ซูชิสายพาน'], c: 0, h: 'กลิ่นซุปเดือดๆ ชาๆ ลิ้นหน่อยๆ ชวนฟิน' },
    { q: 'สัตว์เลี้ยงตัวโปรดที่เราชอบส่งมีมให้กันคือตัวอะไร? 🐱', a: ['คุณหมาคอร์กี้', 'คุณแมวอ้วนส้ม', 'คุณนากทะเล', 'คุณหนูแฮมสเตอร์'], c: 1, h: 'ต้าวเหมียวจอมกวนที่ชอบร้องเหมียวๆ' }
  ];
  let currentIdx = 0;
  const qBody = $('#quizBody');
  const qHint = $('#quizHint');

  function render() {
    if (currentIdx >= QUESTIONS.length) {
      toast('ตอบถูกหมดเลย เก่งที่สุด! 💮');
      markDot(3);
      setTimeout(() => { go('finalScreen'); initPuzzle(); }, 1500);
      return;
    }
    const data = QUESTIONS[currentIdx];
    qBody.innerHTML = `
      <div class="question">${data.q}</div>
      <div class="answers">
        ${data.a.map((ans, i) => `<button class="answer ripple" data-idx="${i}">${ans}</button>`).join('')}
      </div>
    `;
    qHint.textContent = `Hint: ${data.h}`;
    
    $$('.answers .answer').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = +btn.dataset.idx;
        if (idx === data.c) {
          btn.classList.add('correct');
          burstSparkles(innerWidth/2, innerHeight/2, 25);
          currentIdx++;
          setTimeout(render, 1000);
        } else {
          btn.classList.add('wrong');
          setTimeout(() => btn.classList.remove('wrong'), 600);
        }
      });
    });
  }
  
  $('#startGameBtn').addEventListener('click', () => { if(currentIdx===0) render(); });
  // Fallback if skipped
  setTimeout(() => { if ($('#level2Screen').classList.contains('active') && qBody.children.length === 0) render(); }, 1000);
})();

/* ============ 9. LEVEL 3: JIGSAW PUZZLE (COMPATIBLE WITH IPAD/IPHONE) ============ */
let puzzleInitialized = false;
function initPuzzle() {
  if (puzzleInitialized) return;
  puzzleInitialized = true;
  const board = $('#puzzleBoard');
  const tray  = $('#puzzleTray');
  const ROWS = 3, COLS = 3; 
  const totalPieces = ROWS * COLS;
  let boardSize = Math.min(320, innerWidth * 0.85);
  
  function resizeBoards() {
    boardSize = Math.min(320, innerWidth * 0.85);
    board.style.width = boardSize + 'px'; board.style.height = boardSize + 'px';
    tray.style.width = boardSize + 'px'; tray.style.height = boardSize + 'px';
  }
  resizeBoards();

  const pW = boardSize / COLS;
  const pH = boardSize / ROWS;
  let pieces = [];

  for (let r=0; r<ROWS; r++) {
    for (let c=0; c<COLS; c++) {
      const idx = r * COLS + c;
      const slot = document.createElement('div');
      slot.className = 'puzzle-slot';
      slot.style.cssText = `width:${pW}px;height:${pH}px;left:${c*pW}px;top:${r*pH}px;`;
      board.appendChild(slot);

      const piece = document.createElement('div');
      piece.className = 'puzzle-piece';
      piece.dataset.idx = idx;
      piece.style.cssText = `width:${pW}px;height:${pH}px;
        background-image: url('assets/images/puzzle-bg.jpg');
        background-size: ${boardSize}px ${boardSize}px;
        background-position: -${c*pW}px -${r*pH}px;`;
      pieces.push({ el: piece, currentSlot: null, correctIdx: idx });
    }
  }

  // Shuffle & place items inside the tray area nicely
  pieces.sort(() => Math.random() - 0.5);
  pieces.forEach((p, i) => {
    const tr = Math.floor(i / COLS);
    const tc = i % COLS;
    p.el.style.left = (tc * pW) + 'px';
    p.el.style.top = (tr * pH) + 'px';
    tray.appendChild(p.el);
    setupDrag(p);
  });

  function setupDrag(p) {
    let active = false, startX, startY, initialX, initialY;
    const el = p.el;

    function dragStart(clientX, clientY) {
      active = true;
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement.getBoundingClientRect();
      initialX = rect.left - parentRect.left;
      initialY = rect.top - parentRect.top;
      startX = clientX;
      startY = clientY;
      el.style.zIndex = '1000';
    }

    function dragMove(clientX, clientY) {
      if (!active) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      el.style.left = (initialX + dx) + 'px';
      el.style.top = (initialY + dy) + 'px';
    }

    function dragEnd() {
      if (!active) return;
      active = false;
      el.style.zIndex = '';
      
      const elRect = el.getBoundingClientRect();
      const boardRect = board.getBoundingClientRect();
      const cx = elRect.left + pW/2;
      const cy = elRect.top + pH/2;

      if (cx >= boardRect.left && cx <= boardRect.right && cy >= boardRect.top && cy <= boardRect.bottom) {
        const bC = Math.floor((cx - boardRect.left) / pW);
        const bR = Math.floor((cy - boardRect.top) / pH);
        const slotIdx = bR * COLS + bC;

        const occupied = pieces.find(item => item.currentSlot === slotIdx);
        if (!occupied) {
          if (el.parentElement !== board) board.appendChild(el);
          el.style.left = (bC * pW) + 'px';
          el.style.top = (bR * pH) + 'px';
          p.currentSlot = slotIdx;
          checkWin();
          return;
        }
      }
      
      if (el.parentElement !== tray) tray.appendChild(el);
      p.currentSlot = null;
      // Snap back into tray sequence spacing
      const originalTrayIdx = pieces.indexOf(p);
      const tr = Math.floor(originalTrayIdx / COLS);
      const tc = originalTrayIdx % COLS;
      el.style.left = (tc * pW) + 'px';
      el.style.top = (tr * pH) + 'px';
    }

    el.addEventListener('mousedown', e => { e.preventDefault(); dragStart(e.clientX, e.clientY); });
    addEventListener('mousemove', e => dragMove(e.clientX, e.clientY));
    addEventListener('mouseup', dragEnd);

    el.addEventListener('touchstart', e => { dragStart(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    addEventListener('touchmove', e => { if(active) dragMove(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    addEventListener('touchend', dragEnd);
  }

  function checkWin() {
    const isWin = pieces.every(p => p.currentSlot === p.correctIdx);
    if (isWin) {
      toast('ต่อครบประทับใจที่สุด! 🎉');
      burstSparkles(innerWidth/2, innerHeight/2, 60);
      setTimeout(() => $('#giftBoxSection').classList.remove('hidden'), 1000);
    }
  }
}

/* ============ 10. FINAL: GIFT BOX & ENVELOPE ============ */
$('#giftContainer').addEventListener('click', function() {
  this.classList.add('open');
  burstSparkles(innerWidth/2, innerHeight/2, 45);
  setTimeout(() => { go('letterScreen'); }, 1200);
});

$('#openEnvelopeBtn').addEventListener('click', () => {
  $('.envelope').classList.add('open');
  burstSparkles(innerWidth/2, innerHeight/2, 30);
  setTimeout(() => {
    $('#letterAction').classList.remove('hidden');
  }, 1500);
});

$('#readLetterBtn').addEventListener('click', () => {
  go('countdownScreen');
  initCountdown();
});

/* ============ 11. COUNTDOWN CLOCK ============ */
function initCountdown() {
  const cdDays  = $('#cdDays');
  const cdHours = $('#cdHours');
  const cdMin   = $('#cdMin');
  const cdSec   = $('#cdSec');

  function update() {
    const diff = ONE_YEAR.getTime() - Date.now();
    if (diff <= 0) {
      $('.countdown').innerHTML = "<h3 class='cursive'>Happy Anniversary! 💖</h3>";
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    cdDays.textContent  = d;
    cdHours.textContent = h;
    cdMin.textContent   = m;
    cdSec.textContent   = s;
  }
  update();
  setInterval(update, 1000);
}

$('#restartBtn').addEventListener('click', () => {
  localStorage.removeItem('h5m_progress');
  STATE.progress = {};
  location.reload();
});

/* ============ 12. FX ENGINE: CONFETTI & SPARKLES ============ */
function burstSparkles(x, y, count=30) {
  const c = $('#fxCanvas'); const ctx = c.getContext('2d');
  if(!c) return;
  let w = c.width = innerWidth; let h = c.height = innerHeight;
  let arr = Array.from({length: count}, () => ({
    x, y, r: rand(1.5, 4),
    vx: rand(-4, 4), vy: rand(-5, 2),
    alpha: 1, color: `hsl(${rand(330,360)}, 90%, ${rand(65,85)}%)`
  }));
  function f() {
    let alive = false;
    ctx.clearRect(0, 0, w, h);
    arr.forEach(p => {
      if (p.alpha <= 0) return;
      p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.alpha -= 0.015;
      if (p.alpha > 0) alive = true;
      ctx.beginPath(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(f);
  }
  f();
}

/* ============ 13. MUSIC PLAYER CONTROLS ============ */
function startMusic() {
  const audio = $('#bgMusic');
  audio.play().catch(() => {
    // Autoplay block fallback
    document.addEventListener('click', () => { audio.play().catch(()=>{}); }, { once: true });
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

/* ============ 14. BOOTSTRAP ============ */
addEventListener('load', () => {
  Object.keys(STATE.progress).forEach(k => {
    const n = +k.replace('l','');
    const dot = $(`.dot[data-level="${n}\"]`);
    if (dot) dot.classList.add('done');
  });
  if (STATE.unlocked) {
    go('homeScreen');
    startDaysBadge();
    startMusic();
  }
});

document.addEventListener('click', e => {
  const btn = e.target.closest('.ripple');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  btn.style.setProperty('--rx', (e.clientX - rect.left) + 'px');
  btn.style.setProperty('--ry', (e.clientY - rect.top) + 'px');
  btn.classList.remove('rippling');
  void btn.offsetWidth;
  btn.classList.add('rippling');
});