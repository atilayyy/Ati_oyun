/* Hangisi Daha Çok? — 2-8 kişi. İki seçenek, doğru olana dokun. Doğru: 100 + hız bonusu (en fazla 50).
   Hız her cihazda yerel olarak ölçülür, internet gecikmesi sonucu etkilemez. */
const Hangisi = (() => {
  const TIME = 8000;
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof HANGISI !== 'undefined' ? HANGISI : require('./veri.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const fair = (cat, a, b) => cat.year ? a[1] !== b[1] : Math.max(a[1], b[1]) / Math.min(a[1], b[1]) >= 1.08;
  function makeRounds(n) {
    const B = bank(), out = [], seen = new Set();
    for (let tries = 0; out.length < n && tries < 5000; tries++) {
      const ci = Math.floor(Math.random() * B.length), cat = B[ci];
      const i = Math.floor(Math.random() * cat.items.length), j = Math.floor(Math.random() * cat.items.length);
      if (i === j) continue;
      const key = ci + ':' + Math.min(i, j) + ':' + Math.max(i, j);
      if (seen.has(key) || !fair(cat, cat.items[i], cat.items[j])) continue;
      // aynı kategori arka arkaya en fazla 2 kez
      if (out.length >= 2 && out[out.length - 1].c === ci && out[out.length - 2].c === ci) continue;
      seen.add(key); out.push({ c: ci, a: i, b: j });
    }
    return out;
  }
  const correctSide = (r) => { const cat = bank()[r.c], va = cat.items[r.a][1], vb = cat.items[r.b][1]; return cat.less ? (va < vb ? 0 : 1) : (va > vb ? 0 : 1) };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }] } }
  function ask(s) { s.phase = 'q'; s.started = Date.now(); s.ans = {}; s.gain = {} }
  function reveal(s) {
    if (s.phase !== 'q') return;
    const right = correctSide(s.qs[s.cur]);
    for (const p of s.players) {
      const a = s.ans[p.id]; let g = 0;
      if (a && a.k === right) { g = 100 + Math.round(50 * Math.max(0, TIME - a.ms) / TIME); p.right = (p.right || 0) + 1; p.streak = (p.streak || 0) + 1; p.best = Math.max(p.best || 0, p.streak) }
      else p.streak = 0;
      s.gain[p.id] = g; p.score += g;
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
      s.players.forEach(p => { p.score = 0; p.right = 0; p.streak = 0; p.best = 0 });
      s.qs = makeRounds([10, 15, 20].includes(a.count) ? a.count : 15); s.cur = 0; ask(s); return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'q' && !s.ans[pid]) {
      const k = a.k === 1 ? 1 : 0, ms = Math.max(0, Math.min(TIME, Number(a.ms) || TIME));
      s.ans[pid] = { k, ms };
      if (s.players.every(p => s.ans[p.id] || !p.online)) reveal(s);
      return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && s.phase === 'q' && a.cur === s.cur && Date.now() - s.started >= TIME + 1200) { reveal(s); return s }
    if (a.type === 'next' && s.phase === 'reveal') { s.cur++; if (s.cur >= s.qs.length) s.phase = 'over'; else ask(s) }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'q') for (const id in v.ans) if (id !== pid) v.ans[id] = { hidden: true };
    return v;
  }
  return { create, act, view, correctSide, makeRounds, TIME };
})();
if (typeof module !== 'undefined') module.exports = Hangisi;
