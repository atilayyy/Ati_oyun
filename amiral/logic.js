/* Amiral Battı — 10x10. Gemiler rastgele dizilir (birbirine değmez). Vurursan tekrar atarsın. */
const Amiral = (() => {
  const N = 10;
  const FLEET = [['Uçak gemisi', 5], ['Savaş gemisi', 4], ['Kruvazör', 3], ['Denizaltı', 3], ['Muhrip', 2]];
  const clone = s => JSON.parse(JSON.stringify(s));
  const k = (r, c) => r + ',' + c;
  function randomFleet() {
    for (let attempt = 0; attempt < 500; attempt++) {
      const block = new Set(), ships = []; let ok = true;
      for (const [name, len] of FLEET) {
        let placed = false;
        for (let t = 0; t < 200 && !placed; t++) {
          const hz = Math.random() < .5, r = Math.floor(Math.random() * (hz ? N : N - len + 1)), c = Math.floor(Math.random() * (hz ? N - len + 1 : N));
          const cells = Array.from({ length: len }, (_, i) => hz ? [r, c + i] : [r + i, c]);
          if (cells.some(([a, b]) => block.has(k(a, b)))) continue;
          for (const [a, b] of cells) for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) block.add(k(a + dr, b + dc));
          ships.push({ name, cells }); placed = true;
        }
        if (!placed) { ok = false; break }
      }
      if (ok) return ships;
    }
    throw new Error('yerleşim');
  }
  const sunk = (ship, recv) => ship.cells.every(([r, c]) => recv[k(r, c)] === 1);
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], games: 0 } }
  function setup(s) {
    s.phase = 'setup'; s.boards = {}; s.winner = null; s.log = [];
    for (const p of s.players) s.boards[p.id] = { ships: randomFleet(), recv: {}, ready: false };
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const idx = s.players.findIndex(p => p.id === pid); if (idx < 0) return s;
    if (a.type === 'start' && s.players.length === 2 && (s.phase === 'over' || (s.phase === 'lobby' && pid === s.hostId))) { setup(s); return s }
    if (s.phase === 'setup') {
      const b = s.boards[pid];
      if (a.type === 'shuffle' && !b.ready) b.ships = randomFleet();
      if (a.type === 'ready') b.ready = true;
      if (s.players.every(p => s.boards[p.id].ready)) { s.phase = 'play'; s.turn = s.games % 2 }
      return s;
    }
    if (a.type === 'fire' && s.phase === 'play' && idx === s.turn) {
      const r = a.r | 0, c = a.c | 0; if (r < 0 || r >= N || c < 0 || c >= N) return s;
      const opp = s.players[1 - idx].id, ob = s.boards[opp];
      if (ob.recv[k(r, c)] !== undefined) return s;
      const ship = ob.ships.find(sh => sh.cells.some(([a2, b2]) => a2 === r && b2 === c));
      ob.recv[k(r, c)] = ship ? 1 : 0; s.lastShot = { by: idx, r, c, hit: !!ship };
      const who = s.players[idx].name, col = 'ABCDEFGHIJ'[c] + (r + 1);
      if (!ship) { s.log.push(`${who} ${col}: ıska`); s.turn = 1 - idx }
      else if (sunk(ship, ob.recv)) {
        s.log.push(`${who} ${col}: ${ship.name} BATTI!`);
        if (ob.ships.every(sh => sunk(sh, ob.recv))) { s.phase = 'over'; s.winner = idx; s.players[idx].score++; s.games++ }
      } else s.log.push(`${who} ${col}: isabet!`);
      if (s.log.length > 30) s.log.shift();
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.boards) for (const id in v.boards) if (id !== pid && v.phase !== 'over') {
      const b = v.boards[id];
      b.ships = b.ships.filter(sh => sunk(sh, b.recv));
      b.left = s.boards[id].ships.filter(sh => !sunk(sh, b.recv)).length;
    }
    return v;
  }
  return { create, act, view, randomFleet, FLEET, N };
})();
if (typeof module !== 'undefined') module.exports = Amiral;
