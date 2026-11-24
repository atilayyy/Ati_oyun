/* 2048 Düellosu odası — herkes kendi cihazında aynı tohumla (aynı rastgele taş dizisiyle) oynar,
   puanını, en büyük taşını ve tahtasını ev sahibine bildirir. Herkes bitince ya da süre dolunca en yüksek puan kazanır. */
const D2048 = (() => {
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
        for (const p of s.players) s.res[p.id] = { score: 0, over: false, b: [], n: 0, max: 2 };
        s.phase = 'play'; return s;
      }
    }
    if (a.type === 'report' && s.phase === 'play' && s.res[pid] && a.game === s.game) {
      const r = s.res[pid];
      if (Number.isFinite(a.score) && a.score >= r.score) r.score = Math.floor(a.score);
      if (Array.isArray(a.b) && a.b.length === 16 && a.b.every(x => Number.isInteger(x) && x >= 0 && x <= 131072)) r.b = a.b;
      if (Number.isFinite(a.n)) r.n = a.n | 0;
      if (Number.isFinite(a.max)) r.max = Math.max(r.max, a.max | 0);
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
if (typeof module !== 'undefined') module.exports = D2048;
