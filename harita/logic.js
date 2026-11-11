/* Harita Tahmini — 2-8 kişi. Şehrin yerini haritada işaretle, gerçek yere en yakın olan turu alır. */
const Harita = (() => {
  const TIME = 20000;
  const clone = s => JSON.parse(JSON.stringify(s));
  const data = () => (typeof HARITA !== 'undefined' ? HARITA : require('./veri.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function km(a, b) {
    const R = 6371, t = Math.PI / 180, dLa = (b[0] - a[0]) * t, dLo = (b[1] - a[1]) * t;
    const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * t) * Math.cos(b[0] * t) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], mode: 'tr', used: { tr: [], world: [] } } }
  function ask(s) { s.phase = 'q'; s.started = Date.now(); s.ans = {}; s.dist = {}; s.win = [] }
  function reveal(s) {
    if (s.phase !== 'q') return;
    const c = data()[s.mode].cities[s.qs[s.cur]];
    for (const p of s.players) { const a = s.ans[p.id]; if (a) { s.dist[p.id] = Math.round(km([a.lat, a.lon], [c[1], c[2]])); p.km = (p.km || 0) + s.dist[p.id] } else p.km = (p.km || 0) + (s.mode === 'tr' ? 1500 : 20000) }
    const ds = Object.values(s.dist); const best = ds.length ? Math.min(...ds) : null;
    s.win = s.players.filter(p => p.id in s.dist && s.dist[p.id] === best).map(p => p.id);
    s.players.forEach(p => { if (s.win.includes(p.id)) p.score++ });
    s.phase = 'reveal';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.mode = a.mode === 'world' ? 'world' : 'tr';
      s.players.forEach(p => { p.score = 0; p.km = 0 });
      const n = [8, 12, 16].includes(a.count) ? a.count : 10, all = data()[s.mode].cities.map((c, i) => i);
      let pool = all.filter(i => !s.used[s.mode].includes(i)); if (pool.length < n) { s.used[s.mode] = []; pool = all }
      s.qs = shuffle(pool).slice(0, n); s.used[s.mode] = s.used[s.mode].concat(s.qs);
      s.cur = 0; ask(s); return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'q' && !(pid in s.ans)) {
      const lat = Number(a.lat), lon = Number(a.lon); if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return s;
      s.ans[pid] = { lat, lon };
      if (s.players.every(p => p.id in s.ans || !p.online)) reveal(s);
      return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && s.phase === 'q' && a.cur === s.cur && Date.now() - s.started >= TIME - 300) { reveal(s); return s }
    if (a.type === 'next' && s.phase === 'reveal') { s.cur++; if (s.cur >= s.qs.length) s.phase = 'over'; else ask(s) }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'q') { v.left = Math.max(0, TIME - (Date.now() - s.started)); for (const id in v.ans) if (id !== pid) v.ans[id] = 'x' }
    delete v.used;
    return v;
  }
  return { create, act, view, km, TIME };
})();
if (typeof module !== 'undefined') module.exports = Harita;
