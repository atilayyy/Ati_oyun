/* Bayrak & Başkent Yarışı — 2-8 kişi aynı soruya aynı anda cevap verir.
   Soru tipleri: 'f' bayrak → ülke, 'c' ülke → başkent, 'r' başkent → ülke. Doğru: 100 + hız bonusu (en fazla 50). */
const Bayrak = (() => {
  const TIME = 10000, SHOW = 2800;
  const MODES = { karisik: 'Karışık', bayrak: 'Sadece bayrak', baskent: 'Sadece başkent' };
  const clone = s => JSON.parse(JSON.stringify(s));
  const data = () => (typeof ULKE !== 'undefined' ? ULKE : require('./ulkeler.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };

  /* bir soru için 3 çeldirici: önce aynı alt bölge, sonra aynı bölge, sonra herhangi biri */
  function distractors(D, k, pool, field) {
    const me = D[k], seen = new Set([me[field]]), out = [];
    const tiers = [pool.filter(i => D[i][3] === me[3]), pool.filter(i => D[i][4] === me[4]), pool];
    for (const tier of tiers) for (const i of shuffle(tier)) {
      if (out.length >= 3) return out;
      if (i === k || seen.has(D[i][field])) continue;
      seen.add(D[i][field]); out.push(i);
    }
    return out;
  }
  function makeQs(mode, diff, n, used) {
    const D = data(), all = D.map((_, i) => i);
    const base = diff === 'kolay' ? all.filter(i => D[i][5]) : all;
    const types = mode === 'bayrak' ? ['f'] : mode === 'baskent' ? ['c', 'r'] : ['f', 'f', 'c', 'r'];
    let fresh = base.filter(i => !used.includes(i)); if (fresh.length < n * 2) fresh = base;
    const picked = [], qs = [];
    for (const i of shuffle(fresh)) {
      if (qs.length >= n) break;
      const t = types[qs.length % types.length];
      if (t !== 'f' && !D[i][2]) continue;
      // çeldiriciler: kolayda önce kolay ülkelerden
      const capOK = t === 'f' ? all : all.filter(j => D[j][2]);
      let pool = diff === 'kolay' ? capOK.filter(j => D[j][5]) : capOK;
      let ds = distractors(D, i, pool, t === 'c' ? 2 : 1);
      if (ds.length < 3) ds = distractors(D, i, capOK, t === 'c' ? 2 : 1);
      const opts = shuffle([i, ...ds]);
      qs.push({ t, k: i, opts, right: opts.indexOf(i) }); picked.push(i);
    }
    return { qs: shuffle(qs), picked };
  }

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], used: [], mode: 'karisik', diff: 'kolay', count: 10 } }
  function ask(s) { s.phase = 'q'; s.started = Date.now(); s.ans = {}; s.gain = {} }
  function reveal(s) {
    if (s.phase !== 'q') return;
    const q = s.qs[s.cur];
    for (const p of s.players) {
      const a = s.ans[p.id]; let g = 0;
      if (a && a.k === q.right) g = 100 + Math.round(50 * Math.max(0, TIME - a.ms) / TIME);
      s.gain[p.id] = g; p.score += g; if (g) p.right = (p.right || 0) + 1;
    }
    s.phase = 'reveal'; s.revealed = Date.now();
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid), isHost = pid === s.hostId;
    if (a.type === 'opts' && isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (MODES[a.mode]) s.mode = a.mode;
      if (a.diff === 'kolay' || a.diff === 'zor') s.diff = a.diff;
      if ([10, 15, 20].includes(a.count)) s.count = a.count;
      return s;
    }
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => { p.score = 0; p.right = 0 });
      const r = makeQs(s.mode, s.diff, s.count, s.used);
      s.qs = r.qs; s.used = s.used.concat(r.picked).slice(-120);
      s.cur = 0; ask(s); return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'q' && !s.ans[pid]) {
      const k = a.k | 0; if (k < 0 || k > 3) return s;
      // süreyi oyuncunun kendi cihazı ölçer (bağlantı gecikmesi kimseyi cezalandırmasın)
      const ms = Number.isFinite(a.ms) ? Math.max(0, Math.min(TIME, a.ms)) : Math.min(TIME, Date.now() - s.started);
      s.ans[pid] = { k, ms };
      if (s.players.every(p => s.ans[p.id] || !p.online)) reveal(s);
      return s;
    }
    if (a.type === 'timeout' && isHost && s.phase === 'q' && a.cur === s.cur && Date.now() - s.started >= TIME - 300) { reveal(s); return s }
    if (a.type === 'next' && isHost && s.phase === 'reveal' && a.cur === s.cur) {
      s.cur++; if (s.cur >= s.qs.length) s.phase = 'over'; else ask(s);
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    delete v.used;
    if (v.qs) {
      v.total = v.qs.length;
      if (v.phase === 'q' || v.phase === 'reveal') {
        const q = v.qs[v.cur]; v.q = { t: q.t, k: q.k, opts: q.opts };
        if (v.phase === 'reveal') v.q.right = q.right;
        v.nextFlag = v.qs[v.cur + 1] && v.qs[v.cur + 1].t === 'f' ? v.qs[v.cur + 1].k : null;
      }
      delete v.qs;
    }
    if (v.phase === 'q') {
      v.left = Math.max(0, TIME - (Date.now() - s.started));
      for (const id in v.ans) if (id !== pid) v.ans[id] = { hidden: true };
    }
    return v;
  }
  return { create, act, view, makeQs, TIME, SHOW, MODES };
})();
if (typeof module !== 'undefined') module.exports = Bayrak;
