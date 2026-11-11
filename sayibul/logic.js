/* Sayı Bulmaca — 2 kişi. Herkes rakamları farklı gizli bir sayı tutar, sırayla karşınınkini tahmin eder.
   İpucu: + doğru rakam doğru yerde, − doğru rakam yanlış yerde. Eşit hak: başlayan bulursa diğerinin de aynı sayıda hakkı olur. */
const SayiBul = (() => {
  const clone = s => JSON.parse(JSON.stringify(s));
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], games: 0 } }
  function valid(v, n) { return typeof v === 'string' && new RegExp('^[1-9][0-9]{' + (n - 1) + '}$').test(v) && new Set(v).size === n }
  function score(g, sec) { let p = 0, m = 0; for (let i = 0; i < g.length; i++) { if (g[i] === sec[i]) p++; else if (sec.includes(g[i])) m++ } return { p, m } }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const idx = s.players.findIndex(p => p.id === pid); if (idx < 0) return s;
    if (a.type === 'start' && s.players.length === 2 && (s.phase === 'over' || (s.phase === 'lobby' && pid === s.hostId))) {
      s.n = [3, 4, 5].includes(a.n) ? a.n : 4; s.secret = {}; s.g = {}; s.players.forEach(p => s.g[p.id] = []);
      s.starter = s.games % 2; s.games++; s.turn = s.starter; s.phase = 'set'; s.winners = null; s.err = {};
      return s;
    }
    if (s.phase === 'set' && a.type === 'secret' && !s.secret[pid]) {
      const v = String(a.v || ''); if (!valid(v, s.n)) { s.err[pid] = `${s.n} haneli olmalı, rakamlar birbirinden farklı ve 0 ile başlamamalı.`; return s }
      s.secret[pid] = v; delete s.err[pid];
      if (s.players.every(p => s.secret[p.id])) s.phase = 'play';
      return s;
    }
    if (s.phase === 'play' && a.type === 'guess' && idx === s.turn) {
      const v = String(a.v || ''); if (!valid(v, s.n)) { s.err[pid] = 'Geçersiz tahmin: rakamlar farklı olmalı ve 0 ile başlamamalı.'; return s }
      delete s.err[pid];
      const opp = s.players[1 - idx].id, r = score(v, s.secret[opp]);
      s.g[pid].push({ v, p: r.p, m: r.m });
      const A = s.g[s.players[0].id], B = s.g[s.players[1].id];
      if (A.length === B.length) {
        const solved = s.players.filter(p => { const L = s.g[p.id]; return L.length && L[L.length - 1].p === s.n });
        if (solved.length) {
          s.winners = solved.map(p => p.id); s.phase = 'over';
          if (solved.length === 1) solved[0].score++;
          return s;
        }
      }
      s.turn = 1 - idx;
      return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase !== 'over' && v.secret) for (const id in v.secret) if (id !== pid) v.secret[id] = 'x';
    if (v.err) v.err = v.err[pid] || null;
    // ilk bulan ve rakibine son hak tanındıysa bilgi
    if (v.phase === 'play') {
      const me = v.players.findIndex(p => p.id === pid), opp = v.players[1 - me];
      const L = v.g[opp.id]; v.oppSolved = !!(L.length && L[L.length - 1].p === v.n);
      const M = v.g[pid]; v.meSolved = !!(M.length && M[M.length - 1].p === v.n);
    }
    return v;
  }
  return { create, act, view, valid, score };
})();
if (typeof module !== 'undefined') module.exports = SayiBul;
