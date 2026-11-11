/* Tahmin Düellosu — 2-8 kişi. Şık yok: herkes bir sayı yazar, gerçeğe en yakın olan turu alır. */
const Tahmin = (() => {
  const TIME = 30000;
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof TAHMIN !== 'undefined' ? TAHMIN : require('./sorular.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], used: [] } }
  function ask(s) { s.phase = 'q'; s.started = Date.now(); s.ans = {}; s.win = [] }
  function reveal(s) {
    if (s.phase !== 'q') return;
    const ans = bank()[s.qs[s.cur]][2], scale = Math.max(Math.abs(ans), 1);
    const errs = s.players.filter(p => typeof s.ans[p.id] === 'number').map(p => ({ id: p.id, e: Math.abs(s.ans[p.id] - ans) }));
    const best = errs.length ? Math.min(...errs.map(x => x.e)) : null;
    s.win = errs.filter(x => x.e === best).map(x => x.id);
    for (const p of s.players) {
      if (s.win.includes(p.id)) p.score++;
      if (typeof s.ans[p.id] === 'number') { p.err = (p.err || 0) + Math.abs(s.ans[p.id] - ans) / scale; if (s.ans[p.id] === ans) p.exact = (p.exact || 0) + 1 }
      else p.err = (p.err || 0) + 1;
    }
    s.phase = 'reveal';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => { p.score = 0; p.err = 0; p.exact = 0 });
      const n = [8, 12, 16].includes(a.count) ? a.count : 12;
      let pool = bank().map((q, i) => i);
      const fresh = pool.filter(i => !s.used.includes(i)); if (fresh.length >= n) pool = fresh; else s.used = [];
      s.qs = shuffle(pool).slice(0, n); s.used = s.used.concat(s.qs).slice(-80);
      s.cur = 0; ask(s); return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'q' && !(pid in s.ans)) {
      const v = Number(a.v); if (!isFinite(v) || Math.abs(v) > 1e12) return s;
      s.ans[pid] = v;
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
  /* "8.849", "8849", "42,195", "-273", "1,5 milyon" gibi girişleri sayıya çevir */
  function parse(str) {
    let t = String(str || '').trim().toLocaleLowerCase('tr').replace(/\s+/g, '');
    let mul = 1;
    if (/milyar$/.test(t)) { mul = 1e9; t = t.replace(/milyar$/, '') } else if (/milyon$/.test(t)) { mul = 1e6; t = t.replace(/milyon$/, '') } else if (/bin$/.test(t)) { mul = 1e3; t = t.replace(/bin$/, '') }
    if (!/^-?[0-9.,]+$/.test(t)) return null;
    const neg = t.startsWith('-'); t = t.replace('-', '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');          // 42,195 → 42.195 ; 8.849,5 → 8849.5
    else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');        // 8.849 → 8849 ; 783.562 → 783562
    const n = parseFloat(t); if (!isFinite(n)) return null;
    return (neg ? -n : n) * mul;
  }
  return { create, act, view, parse, TIME };
})();
if (typeof module !== 'undefined') module.exports = Tahmin;
