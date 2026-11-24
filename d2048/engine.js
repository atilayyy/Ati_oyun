/* 2048 motoru. Aynı tohumla herkes aynı rastgele sayı dizisini kullanır:
   yeni taşın hangi boş kareye ve 2 mi 4 mü geleceği bu diziden seçilir. */
const E2048 = (() => {
  function rand(g) {
    let t = (g.rs = (g.rs + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const at = (g, r, c) => g.tiles.find(t => t.r === r && t.c === c);
  function spawn(g) {
    const empty = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!at(g, r, c)) empty.push([r, c]);
    if (!empty.length) return null;
    const [r, c] = empty[Math.floor(rand(g) * empty.length)], v = rand(g) < 0.9 ? 2 : 4;
    const t = { id: ++g.nid, v, r, c }; g.tiles.push(t); return t;
  }
  function create(seed) {
    const g = { rs: seed >>> 0, tiles: [], score: 0, moves: 0, over: false, max: 2, nid: 0 };
    spawn(g); spawn(g); g.max = Math.max(...g.tiles.map(t => t.v)); return g;
  }
  function canMove(g) {
    if (g.tiles.length < 16) return true;
    for (const t of g.tiles) { const r = at(g, t.r, t.c + 1), d = at(g, t.r + 1, t.c); if ((r && r.v === t.v) || (d && d.v === t.v)) return true }
    return false;
  }
  // dir: 'L','R','U','D'. Dönüş: hareket bilgisi (animasyon için) ya da null
  function move(g, dir) {
    if (g.over) return null;
    const vert = dir === 'U' || dir === 'D', rev = dir === 'R' || dir === 'D';
    const moves = [], merges = []; let moved = false, gain = 0;
    const next = [];
    for (let k = 0; k < 4; k++) {
      let line = g.tiles.filter(t => (vert ? t.c : t.r) === k).sort((a, b) => (vert ? a.r - b.r : a.c - b.c));
      if (rev) line.reverse();
      let pos = 0, i = 0;
      while (i < line.length) {
        const a = line[i], b = line[i + 1], p = rev ? 3 - pos : pos;
        const nr = vert ? p : k, nc = vert ? k : p;
        if (b && b.v === a.v) {
          const nt = { id: ++g.nid, v: a.v * 2, r: nr, c: nc };
          merges.push({ from: [a.id, b.id], to: nt }); moves.push({ id: a.id, r: nr, c: nc }, { id: b.id, r: nr, c: nc });
          next.push(nt); gain += nt.v; moved = true; i += 2;
        } else {
          if (a.r !== nr || a.c !== nc) moved = true;
          moves.push({ id: a.id, r: nr, c: nc }); next.push({ id: a.id, v: a.v, r: nr, c: nc }); i += 1;
        }
        pos++;
      }
    }
    if (!moved) return null;
    g.tiles = next; g.score += gain; g.moves++;
    g.max = Math.max(g.max, ...g.tiles.map(t => t.v));
    const sp = spawn(g);
    if (!canMove(g)) g.over = true;
    return { moves, merges, spawn: sp, gain };
  }
  const grid = g => { const b = Array(16).fill(0); for (const t of g.tiles) b[t.r * 4 + t.c] = t.v; return b };
  return { create, move, grid, canMove };
})();
if (typeof module !== 'undefined') module.exports = E2048;
