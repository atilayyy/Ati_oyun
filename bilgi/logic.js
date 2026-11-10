/* Bilgi Yarışması — 2+ kişi aynı soruya aynı anda cevap verir. Doğru: 100 + hız bonusu (en fazla 50). */
const Bilgi = (() => {
  const TIME = 15000;
  const CATS = ['Coğrafya', 'Tarih', 'Bilim', 'Spor', 'Sanat', 'Genel', 'Türkiye'];
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof SORULAR !== 'undefined' ? SORULAR : require('./sorular.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], used: [] } }
  function ask(s) { s.phase = 'q'; s.started = Date.now(); s.ans = {}; s.gain = {} }
  function reveal(s) {
    if (s.phase !== 'q') return;
    const q = s.qs[s.cur];
    for (const p of s.players) {
      const a = s.ans[p.id]; let g = 0;
      if (a && q.order[a.k] === 0) g = 100 + Math.round(50 * Math.max(0, TIME - a.ms) / TIME);
      s.gain[p.id] = g; p.score += g;
      if (g) p.right = (p.right || 0) + 1;
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
      s.players.forEach(p => { p.score = 0; p.right = 0 });
      const cats = Array.isArray(a.cats) && a.cats.length ? a.cats.filter(c => CATS.includes(c)) : CATS;
      const n = [10, 15, 20].includes(a.count) ? a.count : 10;
      let pool = bank().map((q, i) => i).filter(i => cats.includes(bank()[i][0]));
      const fresh = pool.filter(i => !s.used.includes(i)); if (fresh.length >= n) pool = fresh; else s.used = [];
      s.qs = shuffle(pool).slice(0, n).map(i => ({ i, order: shuffle([0, 1, 2, 3]) }));
      s.used = s.used.concat(s.qs.map(q => q.i)).slice(-120);
      s.cats = cats; s.cur = 0; ask(s); return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'q' && !s.ans[pid]) {
      const k = a.k | 0; if (k < 0 || k > 3) return s;
      s.ans[pid] = { k, ms: Math.min(TIME, Date.now() - s.started) };
      if (s.players.every(p => s.ans[p.id] || !p.online)) reveal(s);
      return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && s.phase === 'q' && a.cur === s.cur && Date.now() - s.started >= TIME - 300) { reveal(s); return s }
    if (a.type === 'next' && s.phase === 'reveal') {
      s.cur++; if (s.cur >= s.qs.length) s.phase = 'over'; else ask(s);
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'q') {
      v.left = Math.max(0, TIME - (Date.now() - s.started));
      for (const id in v.ans) if (id !== pid) v.ans[id] = { hidden: true };
    }
    delete v.used;
    return v;
  }
  return { create, act, view, TIME, CATS };
})();
if (typeof module !== 'undefined') module.exports = Bilgi;
