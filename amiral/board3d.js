/* Amiral Battı — 3D deniz tahtası (Three.js r128). Bir tahta = bir canvas.
   update({ ships:[{name,cells,sunk}], recv:{'r,c':0|1}, clickable, ghost:{len,vertical,valid(r,c)}, last:{r,c} }) */
const Board3D = (() => {
  const N = 10;
  const ok = (() => { try { const c = document.createElement('canvas'); return !!(window.THREE && window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))) } catch (e) { return false } })();
  const live = new Set(); let raf = 0;
  function tick(now) { const t = now / 1000; for (const b of live) b._frame(t); raf = live.size ? requestAnimationFrame(tick) : 0 }
  const X = c => c - 4.5, Z = r => r - 4.5;
  const std = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.55, metalness: 0.25 }, o));

  /* ---------- gemi modelleri: +x boyunca, pruva -x tarafında ---------- */
  function hullGeo(len, w, h) {
    const L = len - 0.14, a = -L / 2, b = L / 2, bow = Math.min(0.95, L * 0.4);
    const s = new THREE.Shape();
    s.moveTo(a, 0); s.quadraticCurveTo(a + bow * 0.45, w, a + bow, w); s.lineTo(b - 0.18, w);
    s.quadraticCurveTo(b, w, b, w - 0.14); s.lineTo(b, -w + 0.14); s.quadraticCurveTo(b, -w, b - 0.18, -w);
    s.lineTo(a + bow, -w); s.quadraticCurveTo(a + bow * 0.45, -w, a, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 8 });
    g.rotateX(-Math.PI / 2); return g;
  }
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o };
  const cyl = (rt, rb, h, m, x, y, z, seg) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 14), m); o.position.set(x, y, z); return o };
  function turret(g, m, mDark, x, y, dir) {
    const t = new THREE.Group(); t.position.set(x, y, 0);
    t.add(cyl(0.15, 0.17, 0.1, m, 0, 0.05, 0));
    for (const z of [-0.05, 0.05]) { const bar = cyl(0.022, 0.022, 0.42, mDark, dir * 0.24, 0.07, z, 8); bar.rotation.z = Math.PI / 2; t.add(bar) }
    g.add(t);
  }
  function mast(g, m, x, y, z, h) {
    g.add(cyl(0.02, 0.025, h, m, x, y + h / 2, z, 6));
    const r = box(0.04, 0.03, 0.22, m, x, y + h * 0.82, z); g.add(r);
  }
  function buildShip(name, len) {
    const g = new THREE.Group();
    const hullM = std('#a3adc8'), redM = std('#9b2f3a', { roughness: 0.7 }), deckM = std('#5d6787'), supM = std('#d7dcea'), darkM = std('#343c58'), teakM = std('#b59a72', { metalness: 0.05 });
    if (name === 'Denizaltı') {
      const bodyM = std('#2d3550', { metalness: 0.5, roughness: 0.4 });
      const body = cyl(0.23, 0.23, len - 0.7, bodyM, 0, 0.12, 0, 20); body.rotation.z = Math.PI / 2; g.add(body);
      for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.23, 20, 14), bodyM); e.scale.set(1.5, 1, 1); e.position.set(s * (len - 0.7) / 2, 0.12, 0); g.add(e) }
      g.add(box(0.5, 0.32, 0.16, bodyM, -0.15, 0.42, 0));
      const fin = box(0.08, 0.03, 0.5, bodyM, -0.15, 0.48, 0); g.add(fin);
      g.add(cyl(0.015, 0.015, 0.3, darkM, -0.25, 0.7, 0, 6));
      g.add(box(0.18, 0.03, 0.5, bodyM, (len - 0.7) / 2 + 0.15, 0.12, 0));
      g.userData.base = -0.07; g.traverse(m => { if (m.isMesh) m.castShadow = true }); return g;
    }
    const w = name === 'Uçak gemisi' ? 0.36 : name === 'Muhrip' ? 0.24 : 0.3;
    const hull = new THREE.Mesh(hullGeo(len, w, 0.3), hullM); g.add(hull);
    const keel = new THREE.Mesh(hullGeo(len - 0.04, w - 0.02, 0.1), redM); keel.position.y = -0.06; g.add(keel);
    const deck = new THREE.Mesh(hullGeo(len - 0.2, w - 0.06, 0.03), name === 'Savaş gemisi' ? teakM : deckM); deck.position.y = 0.31; g.add(deck);
    const L = len - 0.14;
    if (name === 'Uçak gemisi') {
      const fd = box(L * 0.98, 0.07, 0.84, std('#3b4257'), 0.05, 0.42, 0); g.add(fd);
      const lineM = new THREE.MeshBasicMaterial({ color: '#f2f3fb' });
      for (let x = -L / 2 + 0.3; x < L / 2 - 0.3; x += 0.32) g.add(box(0.16, 0.005, 0.03, lineM, x, 0.46, 0.08));
      g.add(box(L * 0.9, 0.005, 0.015, std('#ffc83d'), 0, 0.46, -0.12));
      g.add(box(0.7, 0.42, 0.2, supM, 0.7, 0.67, -0.3)); g.add(box(0.4, 0.15, 0.2, darkM, 0.75, 0.95, -0.3));
      mast(g, darkM, 0.8, 1.0, -0.3, 0.35);
      const jetM = std('#8c96b3');
      for (const [x, z, r] of [[-1.3, 0.12, 0.2], [-0.6, 0.18, -0.15], [0.05, 0.15, 0.1], [1.5, 0.2, 0]]) {
        const j = new THREE.Group(); j.position.set(x, 0.47, z); j.rotation.y = r;
        j.add(box(0.36, 0.05, 0.07, jetM, 0, 0.02, 0)); j.add(box(0.12, 0.02, 0.36, jetM, 0.02, 0.02, 0)); j.add(box(0.06, 0.02, 0.16, jetM, 0.15, 0.03, 0)); g.add(j);
      }
    } else if (name === 'Savaş gemisi') {
      g.add(box(0.9, 0.22, 0.4, supM, 0.15, 0.44, 0)); g.add(box(0.55, 0.2, 0.32, supM, 0.05, 0.63, 0)); g.add(box(0.28, 0.16, 0.24, darkM, -0.05, 0.8, 0));
      g.add(cyl(0.09, 0.11, 0.32, darkM, 0.42, 0.66, 0)); mast(g, darkM, -0.1, 0.86, 0, 0.4);
      turret(g, supM, darkM, -1.05, 0.33, -1); turret(g, supM, darkM, -0.6, 0.4, -1); turret(g, supM, darkM, 1.1, 0.33, 1);
    } else if (name === 'Kruvazör') {
      g.add(box(0.6, 0.2, 0.34, supM, 0.05, 0.43, 0)); g.add(box(0.32, 0.18, 0.26, supM, -0.05, 0.6, 0));
      g.add(cyl(0.08, 0.09, 0.28, darkM, 0.32, 0.6, 0)); mast(g, darkM, -0.08, 0.7, 0, 0.35);
      turret(g, supM, darkM, -0.8, 0.33, -1); turret(g, supM, darkM, 0.82, 0.33, 1);
    } else {
      g.add(box(0.42, 0.2, 0.26, supM, 0.1, 0.42, 0)); mast(g, darkM, 0.05, 0.52, 0, 0.32);
      g.add(cyl(0.06, 0.07, 0.2, darkM, 0.4, 0.45, 0)); turret(g, supM, darkM, -0.5, 0.33, -1);
    }
    g.userData.base = -0.12;
    g.traverse(m => { if (m.isMesh) m.castShadow = true });
    return g;
  }

  /* ---------- tahta ---------- */
  function labelTex(vertical) {
    const cv = document.createElement('canvas'); cv.width = vertical ? 64 : 1000; cv.height = vertical ? 1000 : 64;
    const c = cv.getContext('2d'); c.fillStyle = '#c9d3ff'; c.font = 'bold 40px Nunito, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < N; i++) vertical ? c.fillText(String(i + 1), 32, i * 100 + 50) : c.fillText('ABCDEFGHIJ'[i], i * 100 + 50, 32);
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }

  function create(el, opts) {
    opts = opts || {};
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:manipulation;border-radius:12px';
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0f1430'); scene.fog = new THREE.Fog('#0f1430', 18, 30);
    const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight('#c7dbff', '#0b1a33', 0.55));
    const sun = new THREE.DirectionalLight('#fff1d6', 1.0); sun.position.set(-8, 9, -6); scene.add(sun);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.002;
    Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
    const rim = new THREE.DirectionalLight('#7aa2ff', 0.35); rim.position.set(6, 4, -6); scene.add(rim);

    // deniz tabanı + su
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: '#06162c' })); bed.rotation.x = -Math.PI / 2; bed.position.y = -0.7; scene.add(bed);
    const waterG = new THREE.PlaneGeometry(10, 10, 44, 44); waterG.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterG, new THREE.MeshPhongMaterial({ color: '#1765ad', specular: '#1d3d5e', shininess: 60, transparent: true, opacity: 0.94 }));
    water.receiveShadow = true; scene.add(water);
    const wp = waterG.attributes.position, base = Float32Array.from(wp.array);
    // rıhtım çerçevesi
    const frameM = std('#2c3664', { roughness: 0.8, metalness: 0.1 }), edgeM = std('#ffc83d', { roughness: 0.5 });
    for (const [w, d, x, z] of [[11.4, 0.7, 0, -5.35], [11.4, 0.7, 0, 5.35], [0.7, 10, -5.35, 0], [0.7, 10, 5.35, 0]]) { scene.add(box(w, 0.5, d, frameM, x, -0.15, z)) }
    for (const [w, d, x, z] of [[10.04, 0.04, 0, -5.02], [10.04, 0.04, 0, 5.02], [0.04, 10.04, -5.02, 0], [0.04, 10.04, 5.02, 0]]) scene.add(box(w, 0.1, d, edgeM, x, 0.07, z));
    const lt = new THREE.Mesh(new THREE.PlaneGeometry(10, 0.64), new THREE.MeshBasicMaterial({ map: labelTex(false), transparent: true })); lt.rotation.x = -Math.PI / 2; lt.position.set(0, 0.11, -5.36); scene.add(lt);
    const ll = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 10), new THREE.MeshBasicMaterial({ map: labelTex(true), transparent: true })); ll.rotation.x = -Math.PI / 2; ll.position.set(-5.36, 0.11, 0); scene.add(ll);
    // ızgara
    const gp = [];
    for (let i = 1; i < N; i++) { gp.push(-5, 0.06, i - 5, 5, 0.06, i - 5, i - 5, 0.06, -5, i - 5, 0.06, 5) }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3));
    scene.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0.28 })));
    // tıklama düzlemi, hover
    const pick = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ visible: false })); pick.rotation.x = -Math.PI / 2; pick.position.y = 0.06; scene.add(pick);
    const hov = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.94), new THREE.MeshBasicMaterial({ color: '#ffc83d', transparent: true, opacity: 0.45, depthWrite: false })); hov.rotation.x = -Math.PI / 2; hov.position.y = 0.08; hov.visible = false; scene.add(hov);
    const lastRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.47, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })); lastRing.rotation.x = -Math.PI / 2; lastRing.position.y = 0.09; lastRing.visible = false; scene.add(lastRing);

    const shipLayer = new THREE.Group(), markLayer = new THREE.Group(), fxLayer = new THREE.Group(); scene.add(shipLayer, markLayer, fxLayer);
    let ghost = null, ghostKey = '';
    const shipObjs = new Map(), marks = new Map(), fires = [], smokes = [], fx = [];
    let first = true, state = {}, hover = null, sz = [0, 0];

    // kamerayı tahtanın tamamı (çerçeve dahil) ekrana sığacak kadar uzaklaştır
    const corners = [[-5.8, 0, -5.8], [5.8, 0, -5.8], [-5.8, 0, 5.8], [5.8, 0, 5.8], [-5.8, 0.3, -5.8], [5.8, 0.3, -5.8]].map(p => new THREE.Vector3(...p));
    const dir = new THREE.Vector3(0, 1, 0.16).normalize(), look = new THREE.Vector3(0, 0, 0.1);
    function frame() {
      let lo = 6, hi = 60;
      for (let i = 0; i < 22; i++) {
        const d = (lo + hi) / 2; cam.position.copy(look).addScaledVector(dir, d); cam.lookAt(look); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
        const fits = corners.every(p => { const v = p.clone().project(cam); return Math.abs(v.x) < 0.96 && Math.abs(v.y) < 0.94 });
        fits ? hi = d : lo = d;
      }
      cam.position.copy(look).addScaledVector(dir, hi); cam.lookAt(look); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    }
    function resize() {
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h || (w === sz[0] && h === sz[1])) return;
      sz = [w, h]; renderer.setSize(w, h, false); cam.aspect = w / h; cam.fov = 38;
      dir.set(0, 1, 0.16).normalize(); frame();
    }
    const ro = window.ResizeObserver ? new ResizeObserver(resize) : null; ro && ro.observe(el); resize();

    function shipKey(s) { return s.name + JSON.stringify(s.cells) + (s.sunk ? 'x' : '') }
    function placeShip(obj, cells) {
      const vert = cells.length > 1 && cells[0][1] === cells[1][1];
      let r = 0, c = 0; cells.forEach(([a, b]) => { r += a; c += b }); r /= cells.length; c /= cells.length;
      obj.position.set(X(c), obj.userData.base || 0, Z(r)); obj.rotation.y = vert ? -Math.PI / 2 : 0;
    }
    function setShips(ships) {
      const keep = new Set();
      for (const s of ships || []) {
        const key = shipKey(s); keep.add(key);
        if (shipObjs.has(key)) continue;
        const o = buildShip(s.name, s.cells.length); placeShip(o, s.cells);
        o.userData.phase = Math.random() * 6;
        if (s.sunk) {
          o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiplyScalar(0.42) } });
          o.userData.base = (o.userData.base || 0) - 0.26; o.position.y = o.userData.base; o.userData.sunk = true;
          if (!first) for (const [a, b] of s.cells) splash(a, b, '#ff8a3d', 1.3);
        }
        shipLayer.add(o); shipObjs.set(key, o);
      }
      for (const [k, o] of shipObjs) if (!keep.has(k)) { shipLayer.remove(o); shipObjs.delete(k) }
    }
    function addFire(x, z) {
      const g = new THREE.Group(); g.position.set(x, 0.2, z);
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.36, 24), new THREE.MeshBasicMaterial({ color: '#ff6a2a', transparent: true, opacity: 0.55, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = -0.1; g.add(glow);
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 10), new THREE.MeshBasicMaterial({ color: '#ff7a1a' }));
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 10), new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
      f1.position.y = 0.2; f2.position.y = 0.17; g.add(f1, f2);
      fires.push({ f1, f2, glow, ph: Math.random() * 6 });
      for (let i = 0; i < 3; i++) {
        const sm = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#5b6378', transparent: true, opacity: 0.4, depthWrite: false }));
        g.add(sm); smokes.push({ m: sm, ph: i / 3 + Math.random() * 0.2 });
      }
      return g;
    }
    function setShots(recv) {
      for (const k in recv || {}) {
        if (marks.has(k)) continue;
        const [r, c] = k.split(',').map(Number), x = X(c), z = Z(r), hit = recv[k] === 1;
        const g = new THREE.Group();
        if (hit) {
          g.add(cyl(0.07, 0.07, 0.5, new THREE.MeshStandardMaterial({ color: '#ff5a4f', emissive: '#b3221a', emissiveIntensity: 0.6 }), x, 0.25, z));
          g.add(addFire(x, z));
          if (!first) { splash(r, c, '#ff8a3d', 1.6); opts.onBoom && opts.onBoom(true) }
        } else {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 24), new THREE.MeshStandardMaterial({ color: '#f2f3fb' })); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.08, z); g.add(ring);
          g.add(cyl(0.05, 0.05, 0.22, new THREE.MeshStandardMaterial({ color: '#f2f3fb' }), x, 0.13, z));
          if (!first) { splash(r, c, '#cfe3ff', 1); opts.onBoom && opts.onBoom(false) }
        }
        markLayer.add(g); marks.set(k, g);
      }
      for (const [k, g] of marks) if (!(recv && k in recv)) { markLayer.remove(g); marks.delete(k) }
    }
    function splash(r, c, color, size) {
      const x = X(c), z = Z(r), t0 = performance.now() / 1000;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false })); ball.position.set(x, 0.2, z);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, 0.07, z);
      fxLayer.add(ball, ring);
      const drops = [];
      for (let i = 0; i < 10; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshBasicMaterial({ color })); d.position.set(x, 0.2, z); d.userData.v = [(Math.random() - 0.5) * 2.4, 2 + Math.random() * 2, (Math.random() - 0.5) * 2.4]; fxLayer.add(d); drops.push(d) }
      fx.push({ t0, dur: 0.9, step(f, dt) {
        ball.scale.setScalar(0.3 + f * size * 1.6); ball.material.opacity = 0.9 * (1 - f);
        ring.scale.setScalar(1 + f * size * 4); ring.material.opacity = 0.8 * (1 - f);
        for (const d of drops) { const v = d.userData.v; v[1] -= 9 * dt; d.position.x += v[0] * dt; d.position.y = Math.max(0.05, d.position.y + v[1] * dt); d.position.z += v[2] * dt }
      }, end() { fxLayer.remove(ball, ring, ...drops) } });
    }
    function setGhost(gh) {
      const k = gh ? gh.len + (gh.vertical ? 'v' : 'h') : '';
      if (k !== ghostKey) {
        if (ghost) scene.remove(ghost);
        ghost = null; ghostKey = k;
        if (gh) {
          ghost = new THREE.Group();
          const m = new THREE.MeshBasicMaterial({ color: '#5fd38a', transparent: true, opacity: 0.55, depthWrite: false });
          const hull = new THREE.Mesh(hullGeo(gh.len, 0.3, 0.3), m); ghost.add(hull); ghost.userData.mat = m; ghost.visible = false; scene.add(ghost);
        }
      }
      updateHover();
    }
    function updateHover() {
      const gh = state.ghost;
      if (ghost) {
        if (!hover) { ghost.visible = false; return }
        const cells = Array.from({ length: gh.len }, (_, i) => gh.vertical ? [hover[0] + i, hover[1]] : [hover[0], hover[1] + i]);
        ghost.visible = true; ghost.userData.base = -0.1; placeShip(ghost, cells);
        ghost.userData.mat.color.set(gh.valid(hover[0], hover[1]) ? '#5fd38a' : '#ff6b6b');
        hov.visible = false; return;
      }
      if (state.clickable && hover && !(state.recv && (hover[0] + ',' + hover[1]) in state.recv)) { hov.visible = true; hov.position.x = X(hover[1]); hov.position.z = Z(hover[0]) }
      else hov.visible = false;
    }

    // işaretçi
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function cellAt(e) {
      const rc = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
      ray.setFromCamera(ndc, cam); const hit = ray.intersectObject(pick)[0]; if (!hit) return null;
      const c = Math.floor(hit.point.x + 5), r = Math.floor(hit.point.z + 5);
      return r >= 0 && r < N && c >= 0 && c < N ? [r, c] : null;
    }
    let down = null;
    const cv = renderer.domElement;
    cv.addEventListener('pointermove', e => { const h = cellAt(e); if (String(h) !== String(hover)) { hover = h; updateHover(); opts.onHover && opts.onHover(h) } });
    cv.addEventListener('pointerleave', () => { hover = null; updateHover() });
    cv.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; hover = cellAt(e); updateHover() });
    cv.addEventListener('pointerup', e => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return; down = null;
      const h = cellAt(e); if (h && opts.onCell) opts.onCell(h[0], h[1]);
    });

    const self = {
      update(s) {
        state = s || {};
        setShips(state.ships); setShots(state.recv);
        if (state.last) { lastRing.visible = true; lastRing.position.x = X(state.last.c); lastRing.position.z = Z(state.last.r) } else lastRing.visible = false;
        setGhost(state.ghost || null);
        cv.style.cursor = state.clickable || state.ghost ? 'crosshair' : 'default';
        first = false;
      },
      project(r, c) { const v = new THREE.Vector3(X(c), 0.06, Z(r)).project(cam), rc = cv.getBoundingClientRect(); return [rc.left + (v.x + 1) / 2 * rc.width, rc.top + (1 - v.y) / 2 * rc.height] },
      dispose() { live.delete(self); ro && ro.disconnect(); renderer.dispose(); try { renderer.forceContextLoss() } catch (e) {} cv.remove() },
      _frame(t) {
        if (!el.isConnected) { self.dispose(); return }
        if (!el.offsetParent) return;
        resize();
        const a = wp.array;
        for (let i = 0; i < a.length; i += 3) { const x = base[i], z = base[i + 2]; a[i + 1] = Math.sin(x * 1.4 + t * 1.3) * 0.035 + Math.cos(z * 1.2 + t * 1.1) * 0.035 + Math.sin((x + z) * 2.3 + t * 2) * 0.012 }
        wp.needsUpdate = true; waterG.computeVertexNormals();
        for (const o of shipLayer.children) { const p = o.userData.phase; o.position.y = o.userData.base + Math.sin(t * 1.6 + p) * 0.025; o.rotation.x = (o.userData.sunk ? 0.2 : 0) + Math.sin(t * 1.2 + p) * 0.025 }
        if (ghost) ghost.position.y = -0.1 + Math.sin(t * 3) * 0.03;
        for (const f of fires) { const k = 1 + Math.sin(t * 13 + f.ph) * 0.25; f.f1.scale.set(1, k, 1); f.f2.scale.set(1, 2 - k, 1); f.glow.material.opacity = 0.4 + (k - 1) * 0.8 }
        for (const s of smokes) { const q = (t * 0.45 + s.ph) % 1; s.m.position.set(Math.sin(t + s.ph * 6) * 0.08, 0.45 + q * 1.1, -q * 0.3); s.m.scale.setScalar(0.6 + q * 1.6); s.m.material.opacity = 0.45 * (1 - q) }
        lastRing.material.opacity = 0.5 + Math.sin(t * 5) * 0.4;
        hov.material.opacity = 0.35 + Math.sin(t * 6) * 0.12;
        const now = performance.now() / 1000;
        for (let i = fx.length - 1; i >= 0; i--) { const e = fx[i], f = (now - e.t0) / e.dur; if (f >= 1) { e.end(); fx.splice(i, 1) } else e.step(f, 1 / 60) }
        renderer.render(scene, cam);
      }
    };
    live.add(self); if (!raf) raf = requestAnimationFrame(tick);
    return self;
  }
  return { ok, create };
})();
