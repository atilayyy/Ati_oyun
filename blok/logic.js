/* Blok Patlat odası — herkes kendi cihazında aynı tohumla oynar, puanını ve tahtasını ev sahibine bildirir.
   Herkesin oyunu bitince (ya da süre dolunca) en yüksek puan kazanır. */
const Blok = (() => {
  const DURS = [0, 120000, 180000, 300000], COUNT = 4000;
  const clone = s => JSON.parse(JSON.stringify(s));
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], dur: 0, game: 0 } }
  function finish(s) {
    if (s.phase !== 'play') return;
    s.phase = 'over';
    const ids = Object.keys(s.res), best = Math.max(...ids.map(id => s.res[id].score));
    s.winners = ids.filter(id => s.res[id].score === best);
    for (const p of s.players) if (s.winners.includes(p.id)) p.score += 1;
  }
  function allDone(s) { return s.players.every(p => !s.res[p.id] || s.res[p.id].over || !p.online) }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (a.type === 'opts' && DURS.includes(a.dur)) { s.dur = a.dur; return s }
      if (a.type === 'start') {
        if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
        s.seed = Math.floor(Math.random() * 4294967296); s.game++;
        s.startAt = Date.now() + COUNT; s.res = {}; s.winners = null;
        for (const p of s.players) s.res[p.id] = { score: 0, over: false, b: '', n: 0, combo: 0 };
        s.phase = 'play'; return s;
      }
    }
    if (a.type === 'report' && s.phase === 'play' && s.res[pid] && a.game === s.game) {
      const r = s.res[pid];
      if (Number.isFinite(a.score) && a.score >= r.score) r.score = Math.floor(a.score);
      if (typeof a.b === 'string' && a.b.length === 64) r.b = a.b.replace(/[^0-7]/g, '0');
      if (Number.isFinite(a.n)) r.n = a.n | 0;
      if (Number.isFinite(a.combo)) r.combo = Math.max(r.combo, a.combo | 0);
      if (a.over) r.over = true;
      if (allDone(s)) finish(s);
      return s;
    }
    if (a.type === 'timeup' && isHost && s.phase === 'play' && s.dur && Date.now() >= s.startAt + s.dur + 1500) { finish(s); return s }
    if (a.type === 'end' && isHost && s.phase === 'play') { finish(s); return s }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'play') { v.wait = s.startAt - Date.now(); v.left = s.dur ? s.startAt + s.dur - Date.now() : null }
    delete v.startAt;
    return v;
  }
  return { create, act, view, DURS, COUNT };
})();
if (typeof module !== 'undefined') module.exports = Blok;
