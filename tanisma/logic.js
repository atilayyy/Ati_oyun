/* Beni Ne Kadar Tanıyorsun? — 2 kişilik. Her soruda ikisi de kendi cevabını verir ve diğerininkini tahmin eder. */
const Tanisma = (() => {
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof BANK !== 'undefined' ? BANK : require('./sorular.js'));
  function shuffleIdx(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }] } }
  function scores(s) {
    const sc = {}; s.players.forEach(p => sc[p.id] = 0);
    if (!s.ans || s.players.length < 2) return sc;
    const [a, b] = s.players.map(p => p.id);
    for (let r = 0; r < s.total; r++) {
      const x = s.ans[a][r], y = s.ans[b][r];
      if (x && y) { if (x.guess === y.self) sc[a]++; if (y.guess === x.self) sc[b]++ }
    }
    return sc;
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId, me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && isHost && s.phase !== 'play' && s.players.length === 2) {
      const n = bank().length, total = Math.min(n, Math.max(4, a.total | 0 || 10));
      s.qs = shuffleIdx(n).slice(0, total); s.total = total; s.round = 0; s.phase = 'play';
      s.ans = {}; s.players.forEach(p => s.ans[p.id] = {});
      return s;
    }
    if (!me || s.phase !== 'play') return s;
    const nOpt = bank()[s.qs[s.round]][1].length;
    if (a.type === 'answer' && !s.ans[pid][s.round]) {
      const self = a.self | 0, guess = a.guess | 0;
      if (self < 0 || self >= nOpt || guess < 0 || guess >= nOpt) return s;
      s.ans[pid][s.round] = { self, guess };
      return s;
    }
    if (a.type === 'next' && s.players.every(p => s.ans[p.id][s.round])) {
      s.round++; if (s.round >= s.total) s.phase = 'over';
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'play') {
      const both = v.players.every(p => v.ans[p.id][v.round]);
      if (!both) for (const id in v.ans) if (id !== pid && v.ans[id][v.round]) v.ans[id][v.round] = { hidden: true };
    }
    v.scores = scores(s);
    return v;
  }
  return { create, act, view, scores };
})();
if (typeof module !== 'undefined') module.exports = Tanisma;
