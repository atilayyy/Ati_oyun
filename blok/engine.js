/* Blok Patlat motoru — 8x8 tahta, 3'lü parça sırası. Aynı tohumla herkese birebir aynı parçalar gelir. */
const BlokEngine = (() => {
  const N = 8;
  // temel şekiller [ağırlık, hücreler]; döndürülmüş/aynalanmış halleri otomatik üretilir
  const BASE = [
    [3, [[0, 0]]],
    [6, [[0, 0], [0, 1]]],
    [6, [[0, 0], [0, 1], [0, 2]]],
    [4, [[0, 0], [0, 1], [0, 2], [0, 3]]],
    [3, [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]],
    [6, [[0, 0], [0, 1], [1, 0], [1, 1]]],
    [2, [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]],
    [4, [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]]],
    [6, [[0, 0], [1, 0], [1, 1]]],
    [6, [[0, 0], [1, 0], [2, 0], [2, 1]], true],
    [4, [[0, 0], [0, 1], [0, 2], [1, 1]]],
    [3, [[0, 0], [0, 1], [1, 1], [1, 2]], true],
    [3, [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]]
  ];
  const norm = cs => { const r0 = Math.min(...cs.map(c => c[0])), c0 = Math.min(...cs.map(c => c[1])); return cs.map(([r, c]) => [r - r0, c - c0]).sort((a, b) => a[0] - b[0] || a[1] - b[1]) };
  const rot = cs => norm(cs.map(([r, c]) => [c, -r]));
  const mir = cs => norm(cs.map(([r, c]) => [r, -c]));
  const SHAPES = [], WEIGHTS = [];
  for (const [w, cells, mirror] of BASE) {
    const seen = new Set(), vars = [];
    const add = cs => { const k = JSON.stringify(cs); if (!seen.has(k)) { seen.add(k); vars.push(cs) } };
    let cs = norm(cells); for (let i = 0; i < 4; i++) { add(cs); if (mirror) add(mir(cs)); cs = rot(cs) }
    for (const v of vars) { SHAPES.push(v); WEIGHTS.push(w / vars.length) }
  }
  const TOTALW = WEIGHTS.reduce((a, b) => a + b, 0);

  // mulberry32 — durum oyun nesnesinde saklanır, herkes aynı sırayı üretir
  function rand(g) {
    let t = (g.rs = (g.rs + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function pick(g) {
    let x = rand(g) * TOTALW, i = 0;
    while (x >= WEIGHTS[i] && i < SHAPES.length - 1) { x -= WEIGHTS[i]; i++ }
    return { s: i, c: 1 + Math.floor(rand(g) * 7) };
  }
  function fill(g) { g.tray = [pick(g), pick(g), pick(g)]; g.wave++ }
  function create(seed) {
    const g = { rs: seed >>> 0, board: Array(N * N).fill(0), tray: [], score: 0, combo: 0, since: 0, moves: 0, over: false, wave: 0, best: 0 };
    fill(g); return g;
  }
  function fits(g, s, r, c) {
    for (const [dr, dc] of SHAPES[s]) { const R = r + dr, C = c + dc; if (R < 0 || C < 0 || R >= N || C >= N || g.board[R * N + C]) return false }
    return true;
  }
  function anyFit(g, s) { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(g, s, r, c)) return true; return false }
  // bu yerleştirme hangi satır/sütunları doldurur (önizleme için)
  function wouldClear(g, s, r, c) {
    const b = g.board.slice(); for (const [dr, dc] of SHAPES[s]) b[(r + dr) * N + c + dc] = 1;
    const rows = [], cols = [];
    for (let i = 0; i < N; i++) { let fr = true, fc = true; for (let j = 0; j < N; j++) { if (!b[i * N + j]) fr = false; if (!b[j * N + i]) fc = false } if (fr) rows.push(i); if (fc) cols.push(i) }
    return { rows, cols };
  }
  function place(g, slot, r, c) {
    const p = g.tray[slot]; if (!p || g.over || !fits(g, p.s, r, c)) return null;
    for (const [dr, dc] of SHAPES[p.s]) g.board[(r + dr) * N + c + dc] = p.c;
    const { rows, cols } = wouldClear(g, p.s, r, c);
    const cleared = [];
    for (const i of rows) for (let j = 0; j < N; j++) cleared.push(i * N + j);
    for (const i of cols) for (let j = 0; j < N; j++) cleared.push(j * N + i);
    const k = rows.length + cols.length;
    let gain = SHAPES[p.s].length, lineGain = 0, perfect = false;
    if (k) {
      g.combo++; g.since = 0;
      lineGain = 10 * k * (k + 1) / 2 * g.combo;
      for (const i of cleared) g.board[i] = 0;
      if (g.board.every(x => !x)) { perfect = true; lineGain += 300 }
    } else { g.since++; if (g.since >= 3) g.combo = 0 }
    gain += lineGain; g.score += gain; g.moves++; g.best = Math.max(g.best, g.combo);
    g.tray[slot] = null;
    if (g.tray.every(x => !x)) fill(g);
    if (!g.tray.some(x => x && anyFit(g, x.s))) g.over = true;
    return { cells: SHAPES[p.s].map(([dr, dc]) => (r + dr) * N + c + dc), cleared: [...new Set(cleared)], k, gain, lineGain, combo: g.combo, perfect };
  }
  return { N, SHAPES, create, fits, anyFit, place, wouldClear };
})();
if (typeof module !== 'undefined') module.exports = BlokEngine;
