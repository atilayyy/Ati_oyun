/* Pati Yarışı — parkur ve fizik. Matter.js ile çalışır; tarayıcıda ve test için Node'da aynı kod. */
const PatiCourse = (() => {
  const W = 600, R = 14;
  const SECTIONS = [
    { y: 250, t: 'Çivi Ormanı' }, { y: 960, t: 'Zikzak' }, { y: 1950, t: 'Değirmenler' }, { y: 2600, t: 'Huni' },
    { y: 3020, t: 'Bumper Parkı' }, { y: 3720, t: 'Delik Delik' }, { y: 4540, t: 'Son Düzlük' }
  ];
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 } }

  function create(M, seed, racers) {
    const { Engine, Bodies, Body, Composite, Events } = M;
    const rand = rng(seed);
    const engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
    engine.gravity.y = 1;
    const world = engine.world;
    const shapes = [], spinners = [], holes = [];
    const H = 5560, FINISH = 5150;

    const put = (b, kind) => { b.kind = kind; Composite.add(world, b); shapes.push(b); return b };
    const rect = (x, y, w, h, angle, kind, o) => {
      const b = Bodies.rectangle(x, y, w, h, Object.assign({ isStatic: true, angle: angle || 0, friction: 0.03, restitution: 0.3 }, o));
      b.w = w; b.h = h; return put(b, kind);
    };
    const seg = (x1, y1, x2, y2, th, kind, o) => rect((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1), th, Math.atan2(y2 - y1, x2 - x1), kind, o);
    const circ = (x, y, r, kind, o) => {
      const b = Bodies.circle(x, y, r, Object.assign({ isStatic: true, friction: 0.01, restitution: 0.5 }, o));
      b.r = r; return put(b, kind);
    };
    // delikli rampa: (x1,y1)→(x2,y2), ts = deliklerin merkezleri (0-1 arası), delik 46 birim
    const holed = (x1, y1, x2, y2, ts, kind) => {
      const L = Math.hypot(x2 - x1, y2 - y1), hw = 23 / L, P = t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
      let t0 = 0;
      for (const t of ts.slice().sort((a, b) => a - b)) {
        seg(...P(t0), ...P(t - hw), 16, kind); t0 = t + hw;
        holes.push({ p: P(t), a: Math.atan2(y2 - y1, x2 - x1) });
      }
      seg(...P(t0), ...P(1), 16, kind);
    };
    const spin = (x, y, r, w) => {
      const s = { x, y, r, w, ang: rand() * Math.PI, bars: [rect(x, y, r * 2, 14, 0, 'spin'), rect(x, y, r * 2, 14, Math.PI / 2, 'spin')] };
      spinners.push(s); circ(x, y, 10, 'hub');
    };

    // duvarlar ve başlangıç kapısı
    rect(-40, H / 2, 80, H + 600, 0, 'wall'); rect(W + 40, H / 2, 80, H + 600, 0, 'wall'); rect(W / 2, -40, W + 160, 80, 0, 'wall');
    const gate = rect(W / 2, 220, W, 16, 0, 'gate');

    // Çivi Ormanı
    for (let j = 0; j < 11; j++) { const y = 310 + j * 56, off = j % 2 ? 35 : 0; for (let x = 50 + off; x <= W - 55; x += 70) circ(x, y, 7, 'peg') }
    // Zikzak (her rampada bir delik)
    let y = 1000;
    for (let i = 0; i < 6; i++) {
      const h = [0.25 + rand() * 0.5];
      if (i % 2 === 0) holed(0, y, 470, y + 80, h, 'ramp'); else holed(W, y, 130, y + 80, h, 'ramp');
      y += 160;
    }
    // Değirmenler
    spin(150, 2060, 80, 0.035); spin(450, 2060, 80, -0.035); spin(300, 2260, 90, 0.03); spin(150, 2460, 80, -0.035); spin(450, 2460, 80, 0.035);
    // Huni
    seg(0, 2640, 240, 2820, 20, 'ramp'); seg(W, 2640, 360, 2820, 20, 'ramp');
    spin(300, 2920, 60, 0.04);
    // Bumper Parkı
    for (let j = 0; j < 5; j++) {
      const yy = 3080 + j * 120, xs = j % 2 ? [210, 390] : [100, 300, 500];
      xs.forEach(x => circ(x, yy, 20, 'bumper', { restitution: 1.1 }));
      if (j % 2) { seg(0, yy - 25, 55, yy + 5, 12, 'ramp'); seg(W, yy - 25, W - 55, yy + 5, 12, 'ramp') }
    }
    // Delik Delik (her katta iki delik)
    y = 3780;
    for (let i = 0; i < 4; i++) {
      const h = [0.18 + rand() * 0.25, 0.55 + rand() * 0.3];
      if (i % 2 === 0) holed(0, y, 500, y + 110, h, 'ramp2'); else holed(W, y, 100, y + 110, h, 'ramp2');
      y += 190;
    }
    // Son Düzlük
    for (let j = 0; j < 7; j++) { const yy = 4600 + j * 70, off = j % 2 ? 45 : 0; for (let x = 75 + off; x <= W - 60; x += 90) circ(x, yy, 8, 'peg') }
    // varış havuzu
    rect(W / 2, 5520, W + 160, 40, 0, 'floor');

    // misketler
    const slots = [0, 1, 2, 3, 4, 5, 6, 7].sort(() => rand() - 0.5);
    const marbles = racers.map((r, i) => {
      const body = Bodies.circle(70 + slots[i % 8] * 66, 150 + rand() * 40, R, { restitution: 0.35, friction: 0.005, frictionAir: 0.0015, density: 0.002 });
      body.kind = 'marble'; Composite.add(world, body);
      return Object.assign({}, r, { body, done: false, time: 0, still: 0, nudges: 0, resets: 0, trail: [] });
    });

    const st = { t: 0, started: false, order: [], firstAt: 0, onBump: null, onFinish: null };
    Events.on(engine, 'collisionStart', e => {
      for (const p of e.pairs) {
        const b = p.bodyA.kind === 'bumper' ? p.bodyA : p.bodyB.kind === 'bumper' ? p.bodyB : null;
        if (b) { b.flash = 1; st.onBump && st.onBump() }
      }
    });
    const vel = b => (Body.getVelocity ? Body.getVelocity(b) : b.velocity);

    function open() { if (!st.started) { Composite.remove(world, gate); gate.removed = true; st.started = true } }
    function step(dt) {
      for (const s of spinners) {
        s.ang += s.w * dt / 16.667;
        Body.setAngle(s.bars[0], s.ang, true); Body.setAngle(s.bars[1], s.ang + Math.PI / 2, true);
      }
      Engine.update(engine, dt);
      if (st.started) st.t += dt;
      for (const m of marbles) {
        const b = m.body, v = vel(b), sp = Math.hypot(v.x, v.y);
        if (sp > 15) Body.setVelocity(b, { x: v.x * 15 / sp, y: v.y * 15 / sp });
        const p = b.position;
        if (p.x < R - 6 || p.x > W - R + 6 || p.y < -60 || p.y > H + 100) {
          Body.setPosition(b, { x: W / 2 + (rand() - 0.5) * 60, y: Math.min(Math.max(p.y - 40, 100), H - 100) }); Body.setVelocity(b, { x: 0, y: 0 }); m.resets++;
        }
        if (!st.started || m.done) continue;
        if (sp < 0.3) m.still += dt; else m.still = 0;
        if (m.still > 1200) { Body.setVelocity(b, { x: (rand() - 0.5) * 8, y: -4 }); m.still = 0; m.nudges++ }
        if (p.y > FINISH) {
          m.done = true; m.time = st.t; st.order.push(m);
          if (!st.firstAt) st.firstAt = st.t;
          st.onFinish && st.onFinish(m, st.order.length);
        }
      }
    }
    function ranking() {
      const rest = marbles.filter(m => !m.done).sort((a, b) => b.body.position.y - a.body.position.y);
      return st.order.concat(rest);
    }
    function over() {
      if (!st.started) return false;
      if (st.order.length === marbles.length) return true;
      if (st.firstAt && st.t - st.firstAt > 30000) return true;
      return st.t > 180000;
    }
    return { engine, W, H, R, FINISH, SECTIONS, shapes, spinners, holes, marbles, gate, st, open, step, ranking, over };
  }
  return { create, W, R, SECTIONS };
})();
if (typeof module !== 'undefined') module.exports = PatiCourse;
