/* En Çok Neye Sinir Olur? — 2 kişi. Önce ikiniz 1. oyuncunun sorularını cevaplar, sonra 2. oyuncununkini.
   Konu olan kişi kendi gerçek cevabını verir, diğeri tahmin eder; tutarsa tahmin eden 1 puan alır. */
const Sinir = (() => {
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof SINIR !== 'undefined' ? SINIR : require('./sorular.js'));
  function shuffleIdx(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }] } }
  const subjectIdx = s => s.step < s.per ? 0 : 1;
  const qOf = s => s.qs[s.step % s.per];
  function scores(s) {
    const sc = {}; s.players.forEach(p => sc[p.id] = 0);
    if (!s.ans) return sc;
    for (let st = 0; st < s.ans.length; st++) {
      const subj = s.players[st < s.per ? 0 : 1].id, gu = s.players[st < s.per ? 1 : 0].id, A = s.ans[st];
      if (A && A[subj] !== undefined && A[gu] !== undefined && A[subj] === A[gu]) sc[gu]++;
    }
    return sc;
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && pid === s.hostId && s.phase !== 'play' && s.players.length === 2) {
      const per = Math.min(bank().length, Math.max(3, a.per | 0 || 6));
      s.qs = shuffleIdx(bank().length).slice(0, per); s.per = per; s.step = 0; s.ans = [{}]; s.phase = 'play';
      return s;
    }
    if (!me || s.phase !== 'play') return s;
    const cur = s.ans[s.step];
    if (a.type === 'answer' && cur[pid] === undefined) {
      const k = a.k | 0; if (k < 0 || k >= bank()[qOf(s)][1].length) return s;
      cur[pid] = k; return s;
    }
    if (a.type === 'next' && s.players.every(p => cur[p.id] !== undefined)) {
      s.step++;
      if (s.step >= s.per * 2) s.phase = 'over'; else s.ans.push({});
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'play') {
      const cur = v.ans[v.step];
      if (!v.players.every(p => cur[p.id] !== undefined)) for (const id in cur) if (id !== pid) cur[id] = -1;
      v.subject = subjectIdx(s);
    }
    v.scores = scores(s);
    return v;
  }
  return { create, act, view, scores };
})();
if (typeof module !== 'undefined') module.exports = Sinir;
