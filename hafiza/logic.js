/* Hafıza Kartları — 2-4 kişi, sırayla iki kart çevir. Eş bulursan puan ve tekrar sıra sende. */
const Hafiza = (() => {
  const FACES = 20;
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], game: 0, starter: 0 } }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 4)) return s;
    if (!a || typeof a !== 'object') return s;
    const idx = s.players.findIndex(p => p.id === pid); if (idx < 0) return s;
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      const pairs = [8, 10, 18].includes(a.pairs) ? a.pairs : 8;
      const faces = shuffle([...Array(FACES).keys()]).slice(0, pairs);
      s.deck = shuffle(faces.concat(faces)); s.matched = s.deck.map(() => null);
      s.open = []; s.shown = []; s.last = null; s.pairs = pairs; s.game++;
      s.players.forEach(p => p.score = 0);
      s.turn = s.starter % s.players.length; s.starter++; s.phase = 'play';
      return s;
    }
    if (a.type === 'flip' && s.phase === 'play' && idx === s.turn) {
      const i = a.i | 0;
      if (i < 0 || i >= s.deck.length || s.matched[i] !== null || s.open.includes(i)) return s;
      s.shown = []; s.last = null;
      s.open.push(i);
      if (s.open.length === 2) {
        const [x, y] = s.open;
        if (s.deck[x] === s.deck[y]) {
          s.matched[x] = s.matched[y] = idx; s.players[idx].score++; s.last = { pair: [x, y], by: idx, ok: true };
          if (s.matched.every(m => m !== null)) s.phase = 'over';
        } else {
          s.shown = [x, y]; s.last = { pair: [x, y], by: idx, ok: false };
          s.turn = (s.turn + 1) % s.players.length;
          let n = 0; while (!s.players[s.turn].online && n++ < s.players.length) s.turn = (s.turn + 1) % s.players.length;
        }
        s.open = [];
      }
    }
    return s;
  }
  function view(s) {
    const v = clone(s);
    if (v.deck) {
      const vis = new Set([...(v.open || []), ...(v.shown || [])]);
      v.deck = v.deck.map((f, i) => v.phase === 'over' || vis.has(i) || v.matched[i] !== null ? f : null);
    }
    return v;
  }
  return { create, act, view, FACES };
})();
if (typeof module !== 'undefined') module.exports = Hafiza;
