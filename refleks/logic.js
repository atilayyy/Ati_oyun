/* Kim Önce Basar — 2-4 kişi. Ekran yeşile dönünce ilk basan kazanır.
   Adil olsun diye her cihaz kendi tepki süresini ölçer; ev sahibi sadece milisaniyeleri karşılaştırır. */
const Refleks = (() => {
  const clone = s => JSON.parse(JSON.stringify(s));
  const TIMEOUT = 2500;
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], mode: 'normal', target: 5 } }
  function newRound(s) {
    s.round++; s.phase = 'round'; s.res = {}; s.winner = null;
    const wait = 1800 + Math.floor(Math.random() * 3200);
    let decoy = null;
    if (s.mode === 'kandir' && Math.random() < 0.6 && wait > 2200) decoy = 700 + Math.floor(Math.random() * (wait - 1600));
    s.script = { wait, decoy };
  }
  function resolve(s) {
    const valid = s.players.filter(p => typeof s.res[p.id] === 'number' && s.res[p.id] >= 0).sort((a, b) => s.res[a.id] - s.res[b.id]);
    s.winner = valid.length ? valid[0].id : null;
    if (s.winner) s.players.find(p => p.id === s.winner).score++;
    s.phase = s.players.some(p => p.score >= s.target) ? 'over' : 'result';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 4)) {
      if (s.phase === 'round' && a.__leave && s.players.every(p => p.id in s.res || !p.online)) resolve(s);
      return s;
    }
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid); if (!me) return s;
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      s.mode = a.mode === 'kandir' ? 'kandir' : 'normal'; s.target = [3, 5, 7].includes(a.target) ? a.target : 5;
      s.players.forEach(p => { p.score = 0; p.best = null }); s.round = 0; s.history = [];
      newRound(s); return s;
    }
    if (a.type === 'press' && s.phase === 'round' && a.round === s.round && !(pid in s.res)) {
      // sayı: tepki süresi (ms); -1: erken bastı; null: basmadı
      let rt = a.rt === null ? null : Number(a.rt);
      if (rt !== null && !(rt === -1 || (rt >= 60 && rt <= TIMEOUT + 500))) rt = rt < 60 && rt >= 0 ? -1 : null;
      s.res[pid] = rt;
      if (typeof rt === 'number' && rt > 0 && (me.best == null || rt < me.best)) me.best = Math.round(rt);
      if (s.players.every(p => p.id in s.res || !p.online)) resolve(s);
      return s;
    }
    if (a.type === 'next' && s.phase === 'result' && a.round === s.round) { newRound(s); return s }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'round') for (const id in v.res) if (id !== pid) v.res[id] = 'x';
    return v;
  }
  return { create, act, view, TIMEOUT };
})();
if (typeof module !== 'undefined') module.exports = Refleks;
