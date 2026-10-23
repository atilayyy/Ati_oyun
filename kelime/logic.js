/* Ati Kelime oyun mantığı. Herkes aynı gizli kelimeyi bulmaya çalışır; ev sahibinde çalışır. */
const Kelime = (() => {
  const ALPHA = 'abcçdefgğhıijklmnoöprsştuüvyz';
  const maxFor = n => n <= 6 ? 6 : n <= 8 ? 7 : 8;
  const clone = s => JSON.parse(JSON.stringify(s));
  const cache = {};
  let loader = async n => { const r = await fetch('kelimeler/' + n + '.json'); if (!r.ok) throw new Error('liste'); return r.json() };
  async function list(n) {
    if (!cache[n]) { const d = await loader(n); cache[n] = { a: d.a, v: new Set(d.v) } }
    return cache[n];
  }
  function evaluate(g, sec) {
    g = Array.from(g); sec = Array.from(sec);
    const r = Array(sec.length).fill(0), cnt = {};
    sec.forEach((c, i) => { if (g[i] === c) r[i] = 2; else cnt[c] = (cnt[c] || 0) + 1 });
    g.forEach((c, i) => { if (r[i] !== 2 && cnt[c] > 0) { r[i] = 1; cnt[c]-- } });
    return r.join('');
  }
  function create(hostId, hostName) {
    return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], round: 0, len: 5, log: [] };
  }
  function pointsFor(k, max) { return max + 1 - k }
  function checkEnd(s) {
    const on = s.players.filter(p => s.boards[p.id]);
    if (on.every(p => s.boards[p.id].done)) finish(s);
  }
  function finish(s) {
    s.phase = 'roundEnd';
    s.history = (s.history || []).concat([{ round: s.round, word: s.secret }]).slice(-20);
  }
  async function startRound(s, n) {
    const L = await list(n);
    const used = new Set((s.history || []).map(h => h.word));
    let w; for (let k = 0; k < 50; k++) { w = L.a[Math.floor(Math.random() * L.a.length)]; if (!used.has(w)) break }
    if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id)) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
    s.round++; s.len = n; s.max = maxFor(n); s.secret = w; s.phase = 'play'; s.first = null;
    s.boards = {}; for (const p of s.players) s.boards[p.id] = { rows: [], done: null, pts: 0 };
  }
  async function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (a.type === 'start' && isHost && s.phase !== 'play') {
      const n = Math.min(10, Math.max(4, a.len | 0 || 5));
      if (a.reset) s.players.forEach(p => p.score = 0);
      await startRound(s, n); return s;
    }
    if (a.type === 'end' && isHost && s.phase === 'play') { finish(s); return s }
    if (a.type === 'guess' && s.phase === 'play') {
      const b = s.boards[pid]; if (!b || b.done) return s;
      const w = String(a.w || '').toLocaleLowerCase('tr');
      const ch = Array.from(w);
      if (ch.length !== s.len || ch.some(c => !ALPHA.includes(c))) return s;
      const L = await list(s.len);
      if (!L.v.has(w)) return s;
      const r = evaluate(w, s.secret);
      b.rows.push({ w, r });
      if (w === s.secret) {
        b.done = 'solved'; b.pts = pointsFor(b.rows.length, s.max);
        if (!s.first) { s.first = pid; b.pts += 2 }
        s.players.find(p => p.id === pid).score += b.pts;
      } else if (b.rows.length >= s.max) b.done = 'out';
      checkEnd(s);
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'play') {
      delete v.secret;
      for (const id in v.boards) if (id !== pid) v.boards[id].rows = v.boards[id].rows.map(r => ({ r: r.r }));
    }
    return v;
  }
  return { create, act, view, evaluate, maxFor, list, ALPHA, setLoader: f => loader = f };
})();
if (typeof module !== 'undefined') module.exports = Kelime;
