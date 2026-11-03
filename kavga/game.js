/* Ati vs Meri — ofis kavgası.
   Yerel mod: iki oyuncu aynı klavyede.
   Online mod: odayı açan "ev sahibi" oyunu hesaplar; katılan sadece tuşlarını yollar,
   ev sahibi saniyede 30 kez anlık görüntüyü geri gönderir. Bağlantı PeerJS (WebRTC). */
(() => {
const W = 960, H = 540, FLOOR = 470, GRAV = 1800;
const PFX = 'atioyun-v1-kavga-';
const $ = id => document.getElementById(id);
const cv = $('game');
const ctx = cv.getContext('2d');
let dpr = 1;
function resize(){ dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W*dpr; cv.height = H*dpr; }
resize(); addEventListener('resize', resize);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const PLAT = [
  {x:90,  y:360, w:220, kind:'desk', owner:'ATİ'},
  {x:650, y:360, w:220, kind:'desk', owner:'MERİ'},
  {x:380, y:240, w:200, kind:'shelf'}
];
const COL = {
  ati:  {shirt:'#3f7fd6', dark:'#2a5aa6', pants:'#2a2f3d', skin:'#e8b28a', hair:'#2a1d16', ui:'#4aa3ff'},
  meri: {shirt:'#e5485f', dark:'#a92c45', pants:'#352a3c', skin:'#f0c29c', hair:'#3a1d16', ui:'#ff5d73'}
};
const LIES = [
  {t:'Patron seni odasına çağırıyor!', eff:'stun', d:1.8},
  {t:'Sistem çöktü, raporlar sende!', eff:'rev', d:4},
  {t:'Arkanda fare var!', eff:'turn', d:2.6},
  {t:'Bugün maaşlar erken yatmış!', eff:'stun', d:1.6},
  {t:'Bu Excel\'i sen bozmuşsun!', eff:'rev', d:4},
  {t:'Kahve makinesi bedava dağıtıyor!', eff:'turn', d:2.6},
  {t:'Ben hiç sinirlenmem ki.', eff:'stun', d:1.5},
  {t:'Toplantı iptal olmuş, haberin yok mu?', eff:'rev', d:4}
];
const EFF_TXT = {stun:'İnandı! Donakaldı', rev:'İnandı! Yönler ters', turn:'İnandı! Arkasına baktı'};

/* ---------- tuşlar ---------- */
const BIND = {
  ati:  {l:['KeyA'], r:['KeyD'], u:['KeyW'], d:['KeyS'], p:['KeyF'], s:['KeyG']},
  meri: {l:['ArrowLeft'], r:['ArrowRight'], u:['ArrowUp'], d:['ArrowDown'], p:['Enter','NumpadEnter','Numpad1','KeyL'], s:['ShiftRight','Numpad2','KeyK']}
};
/* Online: iki taraf da yön tuşları + Enter yumruk + Shift (sol ya da sağ) özel güç. WASD de yedek olarak çalışır. */
const ONLINE = [
  {l:['ArrowLeft'], r:['ArrowRight'], u:['ArrowUp'], d:['ArrowDown'], p:['Enter','NumpadEnter'], s:['ShiftLeft','ShiftRight']},
  BIND.ati
];
const ALL = new Set([...Object.values(BIND), ...ONLINE].flatMap(b => Object.values(b).flat()));
const keys = {}; const just = new Set();
const inGame = () => state !== 'menu' && state !== 'over';
addEventListener('keydown', e => {
  if (e.target && e.target.tagName === 'INPUT') return;
  if (e.code === 'Escape') { togglePause(); return; }
  if (!ALL.has(e.code)) return;
  if (inGame() || e.code.startsWith('Arrow')) e.preventDefault();
  if (!e.repeat) just.add(e.code);
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('.pad button').forEach(b => {
  const code = b.dataset.code;
  const on = e => { e.preventDefault(); keys[code] = true; just.add(code); b.classList.add('on'); try{ b.setPointerCapture(e.pointerId); }catch(_){} };
  const off = () => { keys[code] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off);
  b.addEventListener('lostpointercapture', off);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
function readLocal(binds){
  const h = a => binds.some(b => b[a].some(c => keys[c]));
  const t = a => binds.some(b => b[a].some(c => just.has(c)));
  return {l:h('l'), r:h('r'), u:h('u'), d:h('d'), p:h('p'), s:h('s'), pu:t('u'), pp:t('p'), ps:t('s')};
}
const NONE = {l:false,r:false,u:false,d:false,p:false,s:false,pu:false,pp:false,ps:false};
const INP = {ati:NONE, meri:NONE};

/* ---------- ağ ---------- */
const net = {mode:'local', me:null, peer:null, conn:null, code:null,
  remote:{h:{}, c:{u:0,p:0,s:0}}, seen:{u:0,p:0,s:0},
  myCnt:{u:0,p:0,s:0}, lastSent:'', sendT:0, snapT:0, outbox:[]};
const other = id => id === 'ati' ? 'meri' : 'ati';

/* ---------- oyun durumu ---------- */
function mk(id){
  return {id, name: id==='ati'?'ATİ':'MERİ', x: id==='ati'?250:710, y:FLOOR, vx:0, vy:0,
    facing: id==='ati'?1:-1, hp:100, hpShow:100, meter:0, ground:true,
    punchT:0, punchCD:0, hitAt:-1, hurtT:0, block:false, stunT:0, revT:0, turnT:0,
    dropT:0, walk:0, lieT:0, bubble:'', bubbleT:0, flash:0, steamT:0, tx:null, ty:null};
}
let A = mk('ati'), M = mk('meri');
let state = 'menu', stateT = 0, round = 1, timer = 90, paused = false;
let wins = {ati:0, meri:0}, koMain = '', koSub = '';
let shake = 0, coffee = null, coffeeT = 8, projs = [], fx = [], parts = [], T = 0;
const deli = f => f.id === 'meri' && f.hp > 0 && f.hp <= 30;
const F = id => id === 'ati' ? A : M;

function newRound(){
  A = mk('ati'); M = mk('meri');
  projs = []; coffee = null; coffeeT = 8; timer = 90; fx = []; parts = [];
  state = 'intro'; stateT = 1.9;
}
function newMatch(){
  wins = {ati:0, meri:0}; round = 1; paused = false;
  $('menu').hidden = true; $('over').hidden = true;
  newRound();
}
function togglePause(){
  if (net.mode !== 'local') return;
  if (state === 'fight' || state === 'intro') paused = !paused;
}

/* Görsel olaylar: ev sahibi bunları rakibe de yollar, iki ekranda aynı efekt çıkar. */
function emit(e){ applyEv(e); if (net.mode === 'host') net.outbox.push(e); }
function applyEv(e){
  if (e.k === 'fx') fx.push({x:e.x, y:e.y, txt:e.txt, col:e.col, life:1.2, size:e.size});
  else if (e.k === 'sp') sparks(e.x, e.y, e.col, e.n);
  else if (e.k === 'pa') papers(e.x, e.y);
  else if (e.k === 'sh' && !reduceMotion) shake = .18;
}
const addFx = (x, y, txt, col, size) => emit({k:'fx', x:Math.round(x), y:Math.round(y), txt, col: col||'#fff', size: size||20});
function sparks(x, y, col, n){
  for (let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=120+Math.random()*260;
    parts.push({x, y, vx:Math.cos(a)*s, vy:Math.sin(a)*s-80, life:.4+Math.random()*.3, col, r:2+Math.random()*3, g:900}); }
}
function papers(x, y){
  for (let i=0;i<6;i++) parts.push({x, y, vx:(Math.random()-.5)*300, vy:-100-Math.random()*200, life:.8, col:'#f7f4ea', r:5, g:500, paper:true, rot:Math.random()*6});
}

/* ---------- dövüş ---------- */
function hit(a, d, dmg, dir, src){
  if (d.hp <= 0) return;
  if (d.block && d.facing === -dir){
    d.hp = Math.max(0, d.hp - 1); d.vx = dir*130; a.meter = Math.min(100, a.meter+4);
    addFx(d.x, d.y-128, 'BLOK', '#cfd5e2', 18); emit({k:'sp', x:Math.round(d.x - dir*18), y:Math.round(d.y-75), col:'#cfd5e2', n:6});
    return;
  }
  d.hp = Math.max(0, d.hp - dmg);
  d.vx = dir*330; d.vy = -210; d.ground = false; d.hurtT = .28; d.flash = .12;
  a.meter = Math.min(100, a.meter + (src==='punch'?14:6));
  d.meter = Math.min(100, d.meter + 8);
  addFx(d.x, d.y-128, '-'+dmg, src==='punch' ? '#ffd23f' : '#ffffff', 22);
  if (src === 'punch') emit({k:'sp', x:Math.round(d.x - dir*18), y:Math.round(d.y-78), col:'#ffd23f', n:12});
  else emit({k:'pa', x:Math.round(d.x), y:Math.round(d.y-80)});
  emit({k:'sh'});
  if (d.lieT > 0){
    d.lieT = 0; d.bubble = 'Ay! Daha söylemedim bile!'; d.bubbleT = 1.4;
    addFx(d.x, d.y-160, 'YALAN BOZULDU', '#4aa3ff', 18);
  }
}
function resolvePunch(a, d){
  const xa = a.x + a.facing*12, xb = a.x + a.facing*78;
  const x1 = Math.min(xa,xb), x2 = Math.max(xa,xb), y1 = a.y-104, y2 = a.y-48;
  if (x2 < d.x-22 || x1 > d.x+22 || y2 < d.y-112 || y1 > d.y) return;
  hit(a, d, deli(a) ? 12 : 8, a.facing, 'punch');
}
function special(f, o){
  f.meter = 0;
  if (f.id === 'meri'){
    f.lieT = .8; f.bubble = 'Ati… bi şey söyleyeceğim'; f.bubbleT = .85;
    addFx(o.x, o.y-150, '!', '#ff5d73', 34);
  } else {
    f.punchT = .22; f.bubble = 'Faturalar geliyor!'; f.bubbleT = 1.1;
    for (let i=0;i<3;i++) projs.push({x:f.x + f.facing*30, y:f.y-82 + (i-1)*16, vx:f.facing*(500 + i*60), vy:(i-1)*25, owner:f.id, rot:0, life:2.2});
  }
}
function landLie(m, a){
  const L = LIES[Math.floor(Math.random()*LIES.length)];
  m.bubble = L.t; m.bubbleT = 2.4;
  if (a.hp <= 0) return;
  if (a.block){
    m.stunT = 1.8; a.meter = Math.min(100, a.meter + 30);
    a.bubble = 'Hadi ordan Meri!'; a.bubbleT = 1.6;
    addFx(a.x, a.y-165, 'YALAN YAKALANDI!', '#4aa3ff', 22);
    return;
  }
  if (L.eff === 'stun') a.stunT = L.d;
  if (L.eff === 'rev')  a.revT = L.d;
  if (L.eff === 'turn') a.turnT = L.d;
  addFx(a.x, a.y-165, EFF_TXT[L.eff], '#ff5d73', 19);
}
function surfaceBelow(f){
  let best = FLOOR;
  for (const p of PLAT) if (f.x > p.x-6 && f.x < p.x+p.w+6 && p.y >= f.y-1 && p.y < best) best = p.y;
  return best;
}

function stepFighter(f, o, act, dt){
  const I = INP[f.id];
  f.punchCD -= dt; f.hurtT -= dt; f.stunT -= dt; f.revT -= dt; f.turnT -= dt;
  f.flash -= dt; f.bubbleT -= dt; f.dropT -= dt;
  if (f.punchT > 0){
    f.punchT -= dt;
    if (f.hitAt > 0){ f.hitAt -= dt; if (f.hitAt <= 0){ f.hitAt = -1; resolvePunch(f, o); } }
  }
  if (act && f.hp > 0) f.meter = Math.min(100, f.meter + dt*3);
  if (f.lieT > 0){ f.lieT -= dt; if (f.lieT <= 0 && act) landLie(f, o); }

  const free = act && f.stunT <= 0 && f.hp > 0 && f.lieT <= 0;
  let mv = 0; f.block = false;
  if (free){
    let L = I.l, R = I.r;
    if (f.revT > 0) [L, R] = [R, L];
    mv = (R?1:0) - (L?1:0);
    f.block = I.d && f.ground && f.punchT <= 0;
    if (I.pu && f.ground){
      if (I.d && f.y < FLOOR - 1){ f.dropT = .3; f.ground = false; f.y += 3; }
      else { f.vy = -670; f.ground = false; }
    }
    if (I.pp && f.punchCD <= 0 && !f.block){ f.punchT = .22; f.punchCD = .4; f.hitAt = .07; }
    if (I.ps){
      if (f.meter >= 100) special(f, o);
      else addFx(f.x, f.y-140, 'Bar dolmadı', '#a3a9b8', 15);
    }
  }
  if (f.turnT > 0) f.facing = o.x > f.x ? -1 : 1;
  else if (f.punchT <= 0 && f.hp > 0) f.facing = o.x >= f.x ? 1 : -1;

  const spd = f.block ? 0 : (deli(f) ? 310 : 280);
  if (f.hurtT > 0 || f.hp <= 0) f.vx *= Math.pow(.03, dt);
  else f.vx += (mv*spd - f.vx) * Math.min(1, dt*(f.ground ? 14 : 6));
  f.vy += GRAV*dt;
  const prevY = f.y;
  f.x += f.vx*dt; f.y += f.vy*dt;
  f.ground = false;
  if (f.y >= FLOOR){ f.y = FLOOR; f.vy = 0; f.ground = true; }
  else if (f.vy >= 0 && f.dropT <= 0){
    for (const p of PLAT) if (prevY <= p.y + 1 && f.y >= p.y && f.x > p.x-6 && f.x < p.x+p.w+6){ f.y = p.y; f.vy = 0; f.ground = true; }
  }
  f.x = Math.max(24, Math.min(W-24, f.x));
  if (f.ground && Math.abs(f.vx) > 30) f.walk += dt*Math.abs(f.vx)/28;
}

function ko(w, main){
  state = 'ko'; stateT = 2.8;
  if (w) wins[w]++;
  koMain = main;
  koSub = w ? (w === 'ati' ? 'Ati roundu aldı' : 'Meri roundu aldı') : 'Berabere';
}
function showOver(){
  const w = wins.ati >= 2 ? 'ati' : 'meri';
  const t = $('winTitle');
  t.textContent = w === 'ati' ? 'ATİ KAZANDI' : 'MERİ KAZANDI';
  t.style.color = w === 'ati' ? '#4aa3ff' : '#ff5d73';
  $('winSub').textContent = w === 'ati'
    ? 'Meri\'nin yalanları bu sefer tutmadı. Skor ' + wins.ati + '–' + wins.meri + '.'
    : 'Meri: "Yalan değildi, stratejiydi." Skor ' + wins.meri + '–' + wins.ati + '.';
  $('over').hidden = false;
}

/* Oyunun asıl hesabı: yerel modda ve ev sahibinde çalışır. */
function simulate(dt){
  if (state === 'menu' || state === 'over' || paused) return;
  stateT -= dt;
  if (state === 'intro' && stateT <= 0) state = 'fight';
  if (state === 'ko' && stateT <= 0){
    if (wins.ati >= 2 || wins.meri >= 2){ state = 'over'; showOver(); return; }
    round++; newRound();
  }
  const act = state === 'fight';
  if (act) timer -= dt;
  stepFighter(A, M, act, dt);
  stepFighter(M, A, act, dt);

  const dx = M.x - A.x;
  if (Math.abs(dx) < 40 && Math.abs(A.y - M.y) < 100 && A.hp > 0 && M.hp > 0){
    const push = (40 - Math.abs(dx))/2 * (dx >= 0 ? 1 : -1);
    A.x = Math.max(24, Math.min(W-24, A.x - push)); M.x = Math.max(24, Math.min(W-24, M.x + push));
  }
  for (const p of projs){
    p.x += p.vx*dt; p.y += p.vy*dt; p.rot += dt*12; p.life -= dt;
    const t = F(other(p.owner));
    if (p.life > 0 && t.hp > 0 && Math.abs(p.x - t.x) < 24 && p.y > t.y-112 && p.y < t.y){
      hit(F(p.owner), t, 6, Math.sign(p.vx), 'paper'); p.life = 0;
    }
  }
  projs = projs.filter(p => p.life > 0 && p.x > -40 && p.x < W+40);

  if (act){
    coffeeT -= dt;
    if (!coffee && coffeeT <= 0){
      const p = PLAT[Math.floor(Math.random()*PLAT.length)];
      coffee = {x: Math.round(p.x + 30 + Math.random()*(p.w-60)), y: p.y};
    }
    if (coffee){
      for (const f of [A, M]){
        if (f.hp > 0 && Math.abs(f.x - coffee.x) < 30 && Math.abs(f.y - coffee.y) < 12){
          f.hp = Math.min(100, f.hp + 15); addFx(f.x, f.y-140, 'Kahve molası +15', '#ffd23f', 18);
          coffee = null; coffeeT = 10 + Math.random()*6; break;
        }
      }
    }
    if (A.hp <= 0 && M.hp <= 0) ko(null, 'ÇİFTE K.O.');
    else if (A.hp <= 0) ko('meri', 'K.O.!');
    else if (M.hp <= 0) ko('ati', 'K.O.!');
    else if (timer <= 0){ timer = 0; ko(A.hp > M.hp ? 'ati' : M.hp > A.hp ? 'meri' : null, 'SÜRE BİTTİ'); }
  }
}

/* İki tarafta da çalışan süs işleri: parçacıklar, yazılar, buhar, can çubuğu animasyonu. */
function cosmetic(dt){
  T += dt; shake = Math.max(0, shake - dt);
  for (const f of [A, M]){
    f.hpShow += (f.hp - f.hpShow) * Math.min(1, dt*3);
    if (deli(f)){ f.steamT -= dt; if (f.steamT <= 0){ f.steamT = .12;
      parts.push({x:f.x + (Math.random()-.5)*20, y:f.y-112, vx:(Math.random()-.5)*40, vy:-70, life:.7, col:'rgba(230,230,235,.7)', r:5, g:-40, steam:true}); } }
  }
  for (const p of parts){ p.vy += p.g*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.life -= dt; if (p.rot !== undefined) p.rot += dt*8; }
  parts = parts.filter(p => p.life > 0);
  for (const f of fx){ f.y -= 38*dt; f.life -= dt; }
  fx = fx.filter(f => f.life > 0);
}

/* ---------- ağ: anlık görüntü ---------- */
const FK = ['x','y','vx','facing','hp','meter','ground','punchT','block','stunT','revT','turnT','lieT','bubble','bubbleT','flash','hurtT','walk'];
const r1 = v => typeof v === 'number' ? Math.round(v*100)/100 : v;
function pick(f){ const o = {}; for (const k of FK) o[k] = r1(f[k]); return o; }
function snapshot(){
  return {t:'s', st:state, stT:r1(stateT), rd:round, tm:r1(timer), w:wins, km:koMain, ks:koSub, cf:coffee,
    pr:projs.map(p => [Math.round(p.x), Math.round(p.y), r1(p.rot)]), a:pick(A), m:pick(M), ev:net.outbox.splice(0)};
}
function applySnap(s){
  const prev = state;
  state = s.st; stateT = s.stT; round = s.rd; timer = s.tm; wins = s.w; koMain = s.km; koSub = s.ks;
  if (s.cf && !coffee) coffee = {x:s.cf.x, y:s.cf.y};
  else if (!s.cf) coffee = null;
  projs = s.pr.map(([x, y, rot]) => ({x, y, rot}));
  for (const [f, d] of [[A, s.a], [M, s.m]]){
    for (const k of FK){ if (k !== 'x' && k !== 'y') f[k] = d[k]; }
    if (f.tx === null || Math.abs(d.x - f.x) > 140 || Math.abs(d.y - f.y) > 140){ f.x = d.x; f.y = d.y; }
    f.tx = d.x; f.ty = d.y;
  }
  for (const e of s.ev) applyEv(e);
  if (state === 'over' && prev !== 'over') showOver();
  if (state !== 'over' && state !== 'menu'){ $('over').hidden = true; $('menu').hidden = true; }
}
function clientSmooth(dt){
  const k = 1 - Math.exp(-dt*22);
  for (const f of [A, M]) if (f.tx !== null){ f.x += (f.tx - f.x)*k; f.y += (f.ty - f.y)*k; }
  if (coffee) coffee.t = (coffee.t || 0) + dt;
}
function clientSendInput(dt){
  const I = readLocal(ONLINE);
  if (I.pu) net.myCnt.u++; if (I.pp) net.myCnt.p++; if (I.ps) net.myCnt.s++;
  const msg = {t:'in', h:{l:I.l, r:I.r, u:I.u, d:I.d}, c:net.myCnt};
  const key = JSON.stringify(msg);
  net.sendT -= dt;
  if (net.conn && net.conn.open && (key !== net.lastSent || net.sendT <= 0)){
    net.conn.send(msg); net.lastSent = key; net.sendT = .2;
  }
}
function remoteInput(){
  const r = net.remote, s = net.seen;
  const I = {l:!!r.h.l, r:!!r.h.r, u:!!r.h.u, d:!!r.h.d, pu:(r.c.u||0) > s.u, pp:(r.c.p||0) > s.p, ps:(r.c.s||0) > s.s};
  s.u = r.c.u||0; s.p = r.c.p||0; s.s = r.c.s||0;
  return I;
}

/* ---------- ana döngü ---------- */
function frame(dt){
  if (net.mode === 'client'){
    clientSendInput(dt);
    clientSmooth(dt);
  } else {
    if (net.mode === 'local'){ INP.ati = readLocal([BIND.ati]); INP.meri = readLocal([BIND.meri]); }
    else { INP[net.me] = readLocal(ONLINE); INP[other(net.me)] = remoteInput(); }
    if (coffee) coffee.t = (coffee.t || 0) + dt;
    simulate(dt);
    if (net.mode === 'host' && net.conn && net.conn.open){
      net.snapT -= dt;
      if (net.snapT <= 0){ net.snapT = 1/30; try { net.conn.send(snapshot()); } catch(e){} }
    }
  }
  cosmetic(dt);
  just.clear();
}

/* ---------- lobi ---------- */
function newCode(){ const a = 'ABCDEFGHJKLMNPRSTUVYZ23456789'; return Array.from({length:4}, () => a[Math.floor(Math.random()*a.length)]).join(''); }
function lobbyErr(msg){ const e = $('lobbyErr'); e.textContent = msg; e.hidden = !msg; }
function showLobby(){
  $('lobby').hidden = false; $('waitPanel').hidden = true; $('statusBar').hidden = true;
  $('menu').hidden = false; $('over').hidden = true; $('lost').hidden = true;
  document.body.classList.remove('online');
}
function setStatus(txt){ $('statusBar').hidden = false; $('statusTxt').textContent = txt; }
function markPads(){
  document.body.classList.toggle('online', net.mode !== 'local');
  document.querySelectorAll('.pad').forEach(p => p.classList.toggle('notme', net.mode !== 'local' && p.dataset.side !== net.me));
}
function resetNet(){
  try { net.conn && net.conn.close(); } catch(e){}
  try { net.peer && net.peer.destroy(); } catch(e){}
  Object.assign(net, {mode:'local', me:null, peer:null, conn:null, code:null, remote:{h:{}, c:{u:0,p:0,s:0}}, seen:{u:0,p:0,s:0}, myCnt:{u:0,p:0,s:0}, lastSent:'', outbox:[]});
  state = 'menu'; paused = false; A = mk('ati'); M = mk('meri'); projs = []; coffee = null;
  try { history.replaceState(null, '', location.pathname); } catch(e){}
}
function lostConn(msg){
  if (net.mode === 'local') return;
  $('lostMsg').textContent = msg; $('lost').hidden = false; $('over').hidden = true;
  state = 'menu';
}
const needPeer = () => { if (typeof Peer === 'undefined'){ lobbyErr('Bağlantı kütüphanesi yüklenemedi. İnternetini kontrol edip sayfayı yenile.'); return false; } return true; };

function host(side, tries = 0){
  if (!needPeer()) return;
  lobbyErr('');
  net.code = newCode(); net.me = side;
  const peer = new Peer(PFX + net.code, {debug:0});
  net.peer = peer;
  peer.on('open', () => {
    net.mode = 'host';
    $('lobby').hidden = true; $('waitPanel').hidden = false;
    $('codeBig').textContent = net.code;
    $('waitMsg').textContent = 'Sen ' + (side === 'ati' ? 'Ati' : 'Meri') + ' olacaksın. Rakip bekleniyor; kodu ya da linki gönder, katıldığı an kavga başlar.';
    try { location.hash = net.code; } catch(e){}
    setStatus('Oda açık · sen ' + (side === 'ati' ? 'Ati' : 'Meri'));
    markPads();
  });
  peer.on('error', e => {
    if (e.type === 'unavailable-id' && tries < 5){ peer.destroy(); host(side, tries + 1); return; }
    if (net.mode !== 'host') lobbyErr('Oda açılamadı (' + e.type + '). İnternet bağlantını kontrol edip tekrar dene.');
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch(e){} });
  peer.on('connection', conn => {
    if (net.conn && net.conn.open){ conn.on('open', () => { conn.send({t:'full'}); setTimeout(() => conn.close(), 300); }); return; }
    net.conn = conn;
    conn.on('open', () => {
      conn.send({t:'hi', you: other(net.me)});
      net.remote = {h:{}, c:{u:0,p:0,s:0}}; net.seen = {u:0,p:0,s:0};
      $('waitPanel').hidden = true; $('lost').hidden = true;
      setStatus('Bağlandı · sen ' + (net.me === 'ati' ? 'Ati' : 'Meri') + ', rakip ' + (net.me === 'ati' ? 'Meri' : 'Ati'));
      newMatch();
    });
    conn.on('data', m => {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'in' && m.h && m.c){
        net.remote = {h:m.h, c:m.c};
        // Rakip sayfayı yenilediyse sayaçları sıfırla
        if ((m.c.u||0) < net.seen.u || (m.c.p||0) < net.seen.p || (m.c.s||0) < net.seen.s) net.seen = {u:m.c.u||0, p:m.c.p||0, s:m.c.s||0};
      }
      else if (m.t === 'again' && state === 'over') newMatch();
    });
    conn.on('close', () => { if (net.conn === conn){ net.conn = null; lostConn('Rakip oyundan çıktı. Lobiye dönüp yeni oda açabilirsin.'); } });
  });
}

function join(code){
  if (!needPeer()) return;
  code = code.trim().toUpperCase();
  if (code.length !== 4){ $('code').focus(); lobbyErr('Kod 4 haneli olmalı.'); return; }
  lobbyErr('');
  $('joinBtn').disabled = true; $('joinBtn').textContent = 'Bağlanıyor…';
  const peer = new Peer({debug:0});
  net.peer = peer;
  let opened = false;
  const done = () => { $('joinBtn').disabled = false; $('joinBtn').textContent = 'Katıl'; };
  const fail = msg => { if (!opened){ done(); try { peer.destroy(); } catch(e){} net.peer = null; lobbyErr(msg); } };
  const tmr = setTimeout(() => fail('Odaya ulaşılamadı. Kod doğru mu, oda hâlâ açık mı?'), 15000);
  peer.on('open', () => {
    const conn = peer.connect(PFX + code, {reliable:true});
    net.conn = conn;
    conn.on('open', () => { opened = true; clearTimeout(tmr); done(); });
    conn.on('data', m => {
      if (!m || typeof m !== 'object') return;
      if (m.t === 'hi'){
        net.mode = 'client'; net.me = m.you; net.code = code;
        try { location.hash = code; } catch(e){}
        $('lobby').hidden = true; $('menu').hidden = true;
        setStatus('Bağlandı · sen ' + (net.me === 'ati' ? 'Ati' : 'Meri') + ', rakip ' + (net.me === 'ati' ? 'Meri' : 'Ati'));
        markPads();
      } else if (m.t === 'full'){ opened = false; fail('Bu odada zaten iki kişi var.'); }
      else if (m.t === 's' && net.mode === 'client') applySnap(m);
    });
    conn.on('close', () => { if (opened) lostConn('Odayı açanla bağlantı koptu. Lobiye dönüp aynı kodla tekrar katılmayı dene.'); });
  });
  peer.on('error', e => {
    clearTimeout(tmr);
    if (e.type === 'peer-unavailable') fail('Bu kodla açık bir oda yok.');
    else if (!opened) fail('Bağlantı kurulamadı (' + e.type + ').');
  });
}

$('hostAti').onclick = () => host('ati');
$('hostMeri').onclick = () => host('meri');
$('joinBtn').onclick = () => join($('code').value);
$('code').addEventListener('keydown', e => { if (e.key === 'Enter') join($('code').value); });
$('localBtn').onclick = () => {
  resetNet(); $('lobby').hidden = true; setStatus('Aynı bilgisayar · iki kişi'); markPads(); newMatch();
};
$('copyLink').onclick = async () => {
  const link = location.origin + location.pathname + '#' + net.code;
  try { await navigator.clipboard.writeText(link); $('copyLink').textContent = 'Kopyalandı'; setTimeout(() => $('copyLink').textContent = 'Davet linkini kopyala', 1800); }
  catch(e){ window.prompt('Kopyala:', link); }
};
const backToLobby = () => { resetNet(); showLobby(); };
$('leaveBtn').onclick = backToLobby;
$('lostBtn').onclick = backToLobby;
$('againBtn').onclick = () => {
  if (net.mode === 'client'){ if (net.conn && net.conn.open) net.conn.send({t:'again'}); $('againBtn').textContent = 'İstek gönderildi…'; setTimeout(() => $('againBtn').textContent = 'Rövanş', 2000); }
  else newMatch();
};
const hashCode = (location.hash || '').replace('#', '').toUpperCase().slice(0, 4);
if (hashCode.length === 4) $('code').value = hashCode;

/* ---------- çizim ---------- */
function rr(g, x, y, w, h, r){
  g.beginPath(); g.moveTo(x+r, y); g.arcTo(x+w, y, x+w, y+h, r); g.arcTo(x+w, y+h, x, y+h, r);
  g.arcTo(x, y+h, x, y, r); g.arcTo(x, y, x+w, y, r); g.closePath();
}
function limb(x1, y1, x2, y2, w, col){
  ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function wrapLines(t, maxW){
  const words = t.split(' '), out = []; let cur = '';
  for (const w of words){ const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur){ out.push(cur); cur = w; } else cur = test; }
  if (cur) out.push(cur); return out;
}
const DISPLAY = '"Bungee", Impact, "Arial Black", sans-serif';
const BODY = 'Rubik, system-ui, sans-serif';

const bg = document.createElement('canvas');
function drawBg(){
  const s = 2; bg.width = W*s; bg.height = H*s;
  const g = bg.getContext('2d'); g.scale(s, s);
  let gr = g.createLinearGradient(0, 0, 0, FLOOR);
  gr.addColorStop(0, '#d4cbb8'); gr.addColorStop(1, '#bdb39f');
  g.fillStyle = gr; g.fillRect(0, 0, W, FLOOR);
  g.fillStyle = '#e9e5dc'; g.fillRect(0, 0, W, 22);
  g.fillStyle = '#a79d89'; g.fillRect(0, 22, W, 3);
  for (let x = 60; x < W; x += 220){
    g.fillStyle = '#fffdf3'; g.fillRect(x, 6, 120, 10);
    const lg = g.createLinearGradient(0, 16, 0, 120);
    lg.addColorStop(0, 'rgba(255,253,235,.35)'); lg.addColorStop(1, 'rgba(255,253,235,0)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(x, 16); g.lineTo(x+120, 16); g.lineTo(x+160, 120); g.lineTo(x-40, 120); g.fill();
  }
  for (const wx of [70, 690]){
    const wy = 70, ww = 200, wh = 140;
    g.fillStyle = '#7d7462'; g.fillRect(wx-6, wy-6, ww+12, wh+12);
    const sky = g.createLinearGradient(0, wy, 0, wy+wh);
    sky.addColorStop(0, '#30406e'); sky.addColorStop(.65, '#c0698a'); sky.addColorStop(1, '#f2a46b');
    g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = '#26243a';
    let bx = wx, seed = wx;
    while (bx < wx+ww){ seed = (seed*9301+49297)%233280; const bw = 18 + (seed%22), bh = 30 + (seed%70);
      g.fillRect(bx, wy+wh-bh, Math.min(bw, wx+ww-bx), bh);
      g.fillStyle = 'rgba(255,214,120,.8)';
      for (let yy = wy+wh-bh+6; yy < wy+wh-6; yy += 10) for (let xx = bx+4; xx < bx+bw-4 && xx < wx+ww-3; xx += 7) if ((xx*yy+seed)%5===0) g.fillRect(xx, yy, 3, 4);
      g.fillStyle = '#26243a'; bx += bw + 2; }
    g.fillStyle = '#7d7462'; g.fillRect(wx+ww/2-3, wy, 6, wh); g.fillRect(wx, wy+wh/2-3, ww, 6);
    g.fillStyle = '#9b917c'; g.fillRect(wx-10, wy+wh+6, ww+20, 8);
  }
  g.fillStyle = '#8e8a84'; g.fillRect(392, 52, 176, 140);
  g.fillStyle = '#fbfbf8'; g.fillRect(398, 58, 164, 128);
  g.fillStyle = '#d33a4a'; g.font = '22px ' + DISPLAY; g.textAlign = 'center'; g.fillText('AY SONU!', 480, 90);
  g.strokeStyle = '#2f5fb0'; g.lineWidth = 3; g.beginPath(); g.moveTo(414, 110); g.lineTo(414, 172); g.lineTo(548, 172); g.stroke();
  g.strokeStyle = '#1f8a5a'; g.beginPath(); g.moveTo(420, 120); g.lineTo(450, 150); g.lineTo(478, 132); g.lineTo(505, 162); g.lineTo(540, 140); g.stroke();
  g.fillStyle = '#555'; g.font = '600 11px ' + BODY; g.fillText('kavga sayısı ↑', 492, 182);
  g.fillStyle = '#6f6a62'; g.fillRect(398, 186, 164, 5);
  const sh = PLAT[2];
  g.fillStyle = '#6b5643'; g.fillRect(sh.x+20, sh.y+10, 10, 26); g.fillRect(sh.x+sh.w-30, sh.y+10, 10, 26);
  g.fillStyle = '#8c6c4f'; g.fillRect(sh.x, sh.y, sh.w, 12);
  g.fillStyle = '#a5815f'; g.fillRect(sh.x, sh.y, sh.w, 3);
  const bc = ['#3f6fbf','#c94f4f','#e3b23c','#4f9a6d'];
  for (let i=0;i<4;i++){ g.fillStyle = bc[i]; g.fillRect(sh.x+4+i*9, sh.y-34, 8, 34); g.fillStyle='rgba(255,255,255,.7)'; g.fillRect(sh.x+5+i*9, sh.y-26, 6, 8); }
  for (let i=0;i<3;i++){ g.fillStyle = bc[(i+1)%4]; g.fillRect(sh.x+sh.w-32+i*9, sh.y-30, 8, 30); }
  g.fillStyle = '#8f8572'; g.fillRect(0, FLOOR-14, W, 14);
  const cg = g.createLinearGradient(0, FLOOR, 0, H);
  cg.addColorStop(0, '#536176'); cg.addColorStop(1, '#3c475a');
  g.fillStyle = cg; g.fillRect(0, FLOOR, W, H-FLOOR);
  g.fillStyle = 'rgba(255,255,255,.06)';
  for (let y = FLOOR+6; y < H; y += 12) for (let x = (y/12%2)*12; x < W; x += 24) g.fillRect(x, y, 4, 4);
  g.fillStyle = '#b5683e'; g.beginPath(); g.moveTo(335, FLOOR); g.lineTo(329, FLOOR-34); g.lineTo(371, FLOOR-34); g.lineTo(365, FLOOR); g.fill();
  g.fillStyle = '#3f8a52';
  for (let i=0;i<7;i++){ const a = -Math.PI/2 + (i-3)*.38; g.beginPath(); g.ellipse(350+Math.cos(a)*26, FLOOR-52+Math.sin(a)*22, 7, 20, a+Math.PI/2, 0, Math.PI*2); g.fill(); }
  g.fillStyle = '#e8e6e0'; g.fillRect(908, FLOOR-90, 40, 90);
  g.fillStyle = '#9fd0f0'; g.beginPath(); g.ellipse(928, FLOOR-118, 18, 28, 0, 0, Math.PI*2); g.fill();
  g.fillStyle = '#5a5a5a'; g.fillRect(920, FLOOR-62, 16, 6);
  g.fillStyle = '#d9d6cf'; g.fillRect(10, FLOOR-58, 58, 58); g.fillStyle = '#5e5b55'; g.fillRect(16, FLOOR-50, 46, 6);
  g.fillStyle = '#fff'; g.fillRect(22, FLOOR-66, 34, 10); g.fillStyle = '#4caf50'; g.fillRect(56, FLOOR-24, 5, 5);
  for (const p of PLAT.slice(0,2)){
    g.fillStyle = '#5c4632'; g.fillRect(p.x+10, p.y+12, 12, FLOOR-p.y-12); g.fillRect(p.x+p.w-22, p.y+12, 12, FLOOR-p.y-12);
    g.fillStyle = '#6e5540'; g.fillRect(p.x+p.w-90, p.y+12, 68, 70);
    g.fillStyle = '#4a3828'; g.fillRect(p.x+p.w-60, p.y+40, 10, 4);
    const mx = p.x + 60;
    g.fillStyle = '#2b2f38'; g.fillRect(mx+44, p.y-16, 12, 16); g.fillRect(mx+30, p.y-4, 40, 4);
    rr(g, mx, p.y-80, 100, 66, 5); g.fill();
    g.fillStyle = p.owner === 'ATİ' ? '#2f6db5' : '#1e7a4f'; g.fillRect(mx+6, p.y-74, 88, 54);
    g.fillStyle = 'rgba(255,255,255,.55)';
    for (let i=0;i<5;i++) g.fillRect(mx+12, p.y-68+i*10, 30 + ((i*37)%46), 4);
    g.save(); g.translate(mx+78, p.y-82); g.rotate(.12);
    g.fillStyle = '#ffd23f'; g.fillRect(0, 0, 34, 28);
    g.fillStyle = '#161922'; g.font = '10px ' + DISPLAY; g.textAlign = 'center'; g.fillText(p.owner, 17, 18); g.restore();
    g.fillStyle = '#f2efe8'; g.fillRect(p.x+180, p.y-18, 14, 18);
    g.strokeStyle = '#f2efe8'; g.lineWidth = 3; g.beginPath(); g.arc(p.x+196, p.y-9, 5, -1.4, 1.4); g.stroke();
    g.fillStyle = '#9a7652'; g.fillRect(p.x, p.y, p.w, 12);
    g.fillStyle = '#b48c63'; g.fillRect(p.x, p.y, p.w, 3);
  }
}
drawBg();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawBg);

function drawFighter(f){
  const c = f.flash > 0 ? {shirt:'#fff', dark:'#fff', pants:'#fff', skin:'#fff', hair:'#fff'} : COL[f.id];
  const sb = surfaceBelow(f);
  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(f.x, sb, 26 * Math.max(.4, 1 - (sb - f.y)/300), 6, 0, 0, Math.PI*2); ctx.fill();
  if (deli(f)){
    const r = 70 + Math.sin(T*10)*6;
    const gr = ctx.createRadialGradient(f.x, f.y-60, 10, f.x, f.y-60, r);
    gr.addColorStop(0, 'rgba(255,60,70,.35)'); gr.addColorStop(1, 'rgba(255,60,70,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(f.x, f.y-60, r, 0, Math.PI*2); ctx.fill();
  }
  // online: kendi karakterinin üstünde küçük ok
  if (net.mode !== 'local' && net.me === f.id && f.hp > 0){
    ctx.fillStyle = COL[f.id].ui; ctx.beginPath();
    const yy = f.y - 132 + Math.sin(T*4)*2;
    ctx.moveTo(f.x-7, yy-8); ctx.lineTo(f.x+7, yy-8); ctx.lineTo(f.x, yy); ctx.fill();
  }
  ctx.save();
  ctx.translate(f.x, f.y);
  if (f.hp <= 0){ ctx.rotate(-f.facing * Math.PI/2); ctx.translate(-4*f.facing, -14); }
  ctx.scale(f.facing, 1);
  const moving = Math.min(1, Math.abs(f.vx)/200);
  const sw = f.ground ? Math.sin(f.walk)*0.55*moving : 0;
  const air = !f.ground;
  for (const a of [air ? -0.35 : -sw, air ? 0.45 : sw]){
    const fx2 = Math.sin(a)*34, fy = -36 + Math.cos(a)*34;
    limb(0, -36, fx2, fy, 12, c.pants);
    ctx.fillStyle = f.flash > 0 ? '#fff' : '#1c1c22';
    ctx.beginPath(); ctx.ellipse(fx2+4, fy, 9, 5, 0, 0, Math.PI*2); ctx.fill();
  }
  limb(-2, -70, -8 - sw*10, -44, 10, c.dark);
  if (f.id === 'meri'){ ctx.fillStyle = c.hair; ctx.beginPath(); ctx.ellipse(-7, -80, 15, 28, .12, 0, Math.PI*2); ctx.fill(); }
  ctx.fillStyle = c.shirt; rr(ctx, -17, -80, 34, 46, 9); ctx.fill();
  if (f.id === 'ati'){
    ctx.fillStyle = f.flash > 0 ? '#fff' : '#1f2f5a';
    ctx.beginPath(); ctx.moveTo(4,-78); ctx.lineTo(9,-74); ctx.lineTo(7,-52); ctx.lineTo(4,-47); ctx.lineTo(1,-52); ctx.lineTo(-1,-74); ctx.fill();
  } else {
    ctx.strokeStyle = f.flash > 0 ? '#fff' : '#2b2b33'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-4,-79); ctx.lineTo(7,-60); ctx.lineTo(14,-79); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(3, -62, 9, 11);
  }
  ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(3, -95, 16, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = c.hair;
  if (f.id === 'ati'){
    ctx.beginPath(); ctx.arc(1, -99, 16, Math.PI*1.02, Math.PI*1.95); ctx.lineTo(16,-102); ctx.lineTo(-14,-96); ctx.fill();
    ctx.fillRect(-15, -104, 8, 14);
  } else {
    ctx.beginPath(); ctx.arc(2, -99, 17, Math.PI*.95, Math.PI*1.98); ctx.lineTo(18,-100); ctx.quadraticCurveTo(6,-104,-6,-97); ctx.lineTo(-16,-92); ctx.fill();
  }
  const angry = deli(f) || f.punchT > 0 || f.block;
  ctx.fillStyle = '#1c1c22';
  if (f.stunT > 0){ ctx.font = 'bold 10px ' + BODY; ctx.textAlign = 'center'; ctx.fillText('x', 11, -92); }
  else { ctx.beginPath(); ctx.arc(11, -95, 2.2, 0, Math.PI*2); ctx.fill(); }
  if (f.id === 'ati'){ ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 1.6; rr(ctx, 6, -100, 11, 9, 3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(6,-96); ctx.lineTo(-2,-97); ctx.stroke(); }
  else { ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(12,-98); ctx.lineTo(15,-101); ctx.stroke(); }
  if (angry){ ctx.strokeStyle = '#1c1c22'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(6,-104); ctx.lineTo(15,-101); ctx.stroke(); }
  ctx.strokeStyle = '#7a3b2e'; ctx.lineWidth = 2;
  ctx.beginPath();
  if (deli(f) || f.hurtT > 0) ctx.arc(12, -84, 3, 0, Math.PI*2);
  else if (f.lieT > 0 || (f.id === 'meri' && f.bubbleT > 0)){ ctx.moveTo(8,-86); ctx.quadraticCurveTo(12,-82,16,-87); }
  else { ctx.moveTo(9,-85); ctx.lineTo(15,-85); }
  ctx.stroke();
  if (f.punchT > 0){
    const p = 1 - f.punchT/.22, ext = Math.sin(Math.min(1,p*1.4)*Math.PI/2) * (p < .75 ? 1 : 1-(p-.75)*2);
    const fxp = 6 + 44*Math.max(0, ext);
    limb(2, -70, fxp, -71, 11, c.shirt);
    ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(fxp+5, -71, 8, 0, Math.PI*2); ctx.fill();
  } else if (f.block){
    limb(2, -70, 16, -78, 11, c.shirt); limb(16, -78, 18, -96, 10, c.shirt);
    ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(19, -100, 7, 0, Math.PI*2); ctx.fill();
  } else if (f.lieT > 0){
    limb(2, -70, 14, -58, 11, c.shirt); limb(14, -58, 22, -76, 10, c.shirt);
    ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(23, -79, 6, 0, Math.PI*2); ctx.fill();
  } else {
    const hx = 6 + sw*10;
    limb(2, -70, hx, -44, 11, c.shirt);
    ctx.fillStyle = c.skin; ctx.beginPath(); ctx.arc(hx+1, -40, 6, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
  if (f.hp > 0){
    if (f.stunT > 0) for (let i=0;i<3;i++){ const a = T*5 + i*2.09; star(f.x + Math.cos(a)*22, f.y-124 + Math.sin(a)*5, 6); }
    if (f.revT > 0) tag(f.x, f.y-146, 'TERS YÖN', '#ff5d73');
    else if (f.turnT > 0) tag(f.x, f.y-146, 'NEREDE?!', '#ff5d73');
  }
}
function star(x, y, r){
  ctx.fillStyle = '#ffd23f'; ctx.beginPath();
  for (let i=0;i<10;i++){ const a = -Math.PI/2 + i*Math.PI/5, q = i%2 ? r*.45 : r; ctx.lineTo(x+Math.cos(a)*q, y+Math.sin(a)*q); }
  ctx.fill();
}
function tag(x, y, t, col){
  ctx.font = '11px ' + DISPLAY; const w = ctx.measureText(t).width + 12;
  ctx.fillStyle = col; rr(ctx, x-w/2, y-10, w, 18, 4); ctx.fill();
  ctx.fillStyle = '#161922'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y);
  ctx.textBaseline = 'alphabetic';
}
function drawBubble(f){
  if (f.bubbleT <= 0 || !f.bubble) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, f.bubbleT/.25);
  ctx.font = '600 15px ' + BODY;
  const lines = wrapLines(f.bubble, 210);
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24, h = lines.length*19 + 14;
  const bx = Math.max(8, Math.min(W-w-8, f.x - w/2));
  const by = Math.max(80, f.y - 160 - h);
  ctx.fillStyle = '#fffdf6'; ctx.strokeStyle = COL[f.id].ui; ctx.lineWidth = 3;
  rr(ctx, bx, by, w, h, 10); ctx.fill(); ctx.stroke();
  const tx = Math.max(bx+16, Math.min(bx+w-16, f.x));
  ctx.beginPath(); ctx.moveTo(tx-8, by+h-1); ctx.lineTo(tx, by+h+12); ctx.lineTo(tx+8, by+h-1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(tx-8, by+h); ctx.lineTo(tx, by+h+12); ctx.lineTo(tx+8, by+h); ctx.stroke();
  ctx.fillStyle = '#161922'; ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, bx + w/2, by + 23 + i*19));
  ctx.restore();
}
function drawHUD(){
  ctx.fillStyle = 'rgba(22,25,34,.82)'; ctx.fillRect(0, 0, W, 74);
  for (const [f, edge, dir] of [[A, 24, 1], [M, W-24, -1]]){
    const bw = 380, x0 = dir === 1 ? edge : edge - bw;
    ctx.font = '16px ' + DISPLAY; ctx.fillStyle = COL[f.id].ui; ctx.textAlign = dir === 1 ? 'left' : 'right';
    const you = net.mode !== 'local' && net.me === f.id ? ' (SEN)' : '';
    ctx.fillText(f.name + you + (deli(f) ? ' · DELİ MOD' : ''), edge, 22);
    for (let i=0;i<2;i++){
      const cx = dir === 1 ? edge + bw - 8 - i*18 : edge - bw + 8 + i*18;
      ctx.beginPath(); ctx.arc(cx, 16, 6, 0, Math.PI*2);
      ctx.fillStyle = wins[f.id] > i ? '#ffd23f' : 'rgba(255,255,255,.15)'; ctx.fill();
    }
    ctx.fillStyle = '#0f1118'; rr(ctx, x0, 30, bw, 18, 4); ctx.fill();
    const showW = bw * Math.max(0, f.hpShow)/100, hpW = bw * Math.max(0, f.hp)/100;
    ctx.fillStyle = '#f2efe8';
    if (dir === 1) ctx.fillRect(x0+2, 32, Math.max(0, showW-4), 14); else ctx.fillRect(x0+bw-showW+2, 32, Math.max(0, showW-4), 14);
    ctx.fillStyle = f.hp <= 30 ? '#ff8a3d' : COL[f.id].ui;
    if (dir === 1) ctx.fillRect(x0+2, 32, Math.max(0, hpW-4), 14); else ctx.fillRect(x0+bw-hpW+2, 32, Math.max(0, hpW-4), 14);
    const mw = 220, mx = dir === 1 ? edge : edge - mw, full = f.meter >= 100;
    ctx.fillStyle = '#0f1118'; ctx.fillRect(mx, 54, mw, 8);
    ctx.fillStyle = full ? (Math.sin(T*12) > 0 ? '#ffd23f' : '#fff') : '#c9a43a';
    const mW = mw * f.meter/100;
    if (dir === 1) ctx.fillRect(mx, 54, mW, 8); else ctx.fillRect(mx + mw - mW, 54, mW, 8);
    ctx.font = '10px ' + DISPLAY; ctx.fillStyle = full ? '#ffd23f' : '#a3a9b8';
    ctx.textAlign = dir === 1 ? 'left' : 'right';
    const key = net.mode === 'local' && f.id === 'ati' ? ' · G' : ' · SHIFT';
    const label = f.id === 'ati' ? (full ? 'FATURA HAZIR' + key : 'FATURA') : (full ? 'YALAN HAZIR' + key : 'YALAN');
    ctx.fillText(label, dir === 1 ? mx + mw + 8 : mx - 8, 62);
  }
  ctx.fillStyle = '#ffd23f'; rr(ctx, W/2-34, 14, 68, 46, 6); ctx.fill();
  ctx.fillStyle = '#161922'; ctx.font = '28px ' + DISPLAY; ctx.textAlign = 'center';
  ctx.fillText(String(Math.ceil(Math.max(0, timer))), W/2, 48);
}
function banner(main, sub, col){
  ctx.save(); ctx.textAlign = 'center';
  ctx.font = '76px ' + DISPLAY; ctx.lineWidth = 10; ctx.strokeStyle = '#161922'; ctx.lineJoin = 'round';
  ctx.strokeText(main, W/2, 290); ctx.fillStyle = col || '#ffd23f'; ctx.fillText(main, W/2, 290);
  if (sub){ ctx.font = '26px ' + DISPLAY; ctx.lineWidth = 7; ctx.strokeText(sub, W/2, 336); ctx.fillStyle = '#fff'; ctx.fillText(sub, W/2, 336); }
  ctx.restore();
}
function draw(){
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.save();
  if (shake > 0){ const k = shake/.18 * 8; ctx.translate((Math.random()-.5)*k, (Math.random()-.5)*k); }
  ctx.drawImage(bg, 0, 0, W, H);
  if (coffee){
    const bob = Math.sin((coffee.t||0)*4)*3, x = coffee.x, y = coffee.y - 4 + bob;
    ctx.fillStyle = 'rgba(255,210,63,.35)'; ctx.beginPath(); ctx.arc(x, y-12, 20, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(x-9, y-22, 18, 20);
    ctx.fillStyle = '#6b3e22'; ctx.fillRect(x-9, y-22, 18, 4);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x+11, y-12, 5, -1.3, 1.3); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
    for (let i=-1;i<=1;i++){ ctx.beginPath(); ctx.moveTo(x+i*5, y-26); ctx.quadraticCurveTo(x+i*5+4, y-32, x+i*5, y-38 - Math.sin(T*6+i)*2); ctx.stroke(); }
  }
  for (const f of (A.y <= M.y ? [A, M] : [M, A])) drawFighter(f);
  for (const p of projs){
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
    ctx.fillStyle = '#fbf8ef'; ctx.fillRect(-11, -14, 22, 28);
    ctx.fillStyle = '#9aa3b5'; for (let i=0;i<4;i++) ctx.fillRect(-7, -9+i*6, 14 - (i%2)*5, 2);
    ctx.fillStyle = '#d33a4a'; ctx.fillRect(-7, 9, 8, 2);
    ctx.restore();
  }
  for (const p of parts){
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life*2));
    ctx.fillStyle = p.col;
    if (p.paper){ ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-5, -6, 10, 12); ctx.restore(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, p.steam ? p.r + (0.7-p.life)*10 : p.r, 0, Math.PI*2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  drawBubble(A); drawBubble(M);
  for (const f of fx){
    ctx.globalAlpha = Math.min(1, f.life/.4);
    ctx.font = f.size + 'px ' + DISPLAY; ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = '#161922'; ctx.lineJoin = 'round';
    const x = Math.max(90, Math.min(W-90, f.x));
    ctx.strokeText(f.txt, x, f.y); ctx.fillStyle = f.col; ctx.fillText(f.txt, x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  drawHUD();
  if (state === 'intro'){
    const finalR = wins.ati === 1 && wins.meri === 1;
    if (stateT > .6) banner(finalR ? 'SON ROUND' : 'ROUND ' + round, finalR ? 'Kazanan alır' : 'Ofis karıştı');
    else banner('KAVGA!', null, '#ff5d73');
  }
  if (state === 'ko') banner(koMain, koSub);
  if (paused){ ctx.fillStyle = 'rgba(22,25,34,.6)'; ctx.fillRect(0, 74, W, H-74); banner('DURAKLADI', 'Devam için Esc'); }
}

let last = performance.now();
function loop(now){
  const dt = Math.min(1/30, (now - last)/1000); last = now;
  frame(dt); draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
})();
