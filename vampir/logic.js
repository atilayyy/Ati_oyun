/* Vampir Köylü — 4-12 kişi. Anlatıcı oyunun kendisi; herkes kendi cihazında gizli rolünü görür.
   Roller: Vampir, Köylü, Doktor (her gece birini korur), Gözcü (her gece birinin vampir olup olmadığını öğrenir). */
const Vampir = (() => {
  const NIGHT = 75000;
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], opt: { vamp: 0, doc: true, seer: true, show: true } } }
  const alive = s => s.players.filter(p => s.alive[p.id]);
  const isV = (s, id) => s.roles[id] === 'vampir';
  function autoVamp(n) { return n >= 10 ? 3 : n >= 7 ? 2 : 1 }
  function winner(s) {
    const al = alive(s), v = al.filter(p => isV(s, p.id)).length;
    if (v === 0) return 'koy';
    if (v >= al.length - v) return 'vampir';
    return null;
  }
  function finish(s, w) { s.phase = 'end'; s.win = w }
  function startNight(s) { s.phase = 'night'; s.night = { vamp: {}, doc: null, seer: null }; s.started = Date.now(); s.day++ }
  const needsNight = (s, p) => s.alive[p.id] && (isV(s, p.id) || (s.roles[p.id] === 'doktor') || (s.roles[p.id] === 'gozcu'));
  function nightDone(s) {
    for (const p of alive(s)) {
      if (!p.online) continue;
      if (isV(s, p.id) && !(p.id in s.night.vamp)) return false;
      if (s.roles[p.id] === 'doktor' && s.night.doc === null) return false;
      if (s.roles[p.id] === 'gozcu' && s.night.seer === null) return false;
    }
    return true;
  }
  function resolveNight(s) {
    if (s.phase !== 'night') return;
    const tally = {};
    for (const t of Object.values(s.night.vamp)) if (t) tally[t] = (tally[t] || 0) + 1;
    let target = null;
    const max = Math.max(0, ...Object.values(tally));
    if (max > 0) { const top = Object.keys(tally).filter(k => tally[k] === max); target = top[Math.floor(Math.random() * top.length)] }
    const saved = target && s.night.doc === target;
    if (target && !saved) s.alive[target] = false;
    s.lastNight = { died: saved ? null : target, saved: !!saved, day: s.day };
    const seer = alive(s).concat(s.players.filter(p => p.id === target)).find(p => s.roles[p.id] === 'gozcu');
    if (seer && s.night.seer) (s.seerLog[seer.id] = s.seerLog[seer.id] || []).push({ t: s.night.seer, v: isV(s, s.night.seer), day: s.day });
    const w = winner(s); if (w) return finish(s, w);
    s.phase = 'day'; s.votes = {}; s.lastVote = null;
  }
  function resolveVote(s) {
    if (s.phase !== 'day') return;
    const tally = {};
    for (const t of Object.values(s.votes)) tally[t] = (tally[t] || 0) + 1;
    const max = Math.max(0, ...Object.values(tally)), top = Object.keys(tally).filter(k => tally[k] === max);
    const out = top.length === 1 && top[0] !== 'skip' ? top[0] : null;
    if (out) s.alive[out] = false;
    s.lastVote = { out, tie: top.length > 1, tally, votes: clone(s.votes), day: s.day };
    const w = winner(s); if (w) return finish(s, w);
    startNight(s);
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 12)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid); if (!me && a.type !== 'start') return s;
    if (a.type === 'opt' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'end')) { Object.assign(s.opt, { vamp: Math.max(0, Math.min(4, a.vamp | 0)), doc: !!a.doc, seer: !!a.seer, show: !!a.show }); return s }
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'end') && s.players.length >= 4) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 12) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      const n = s.players.length, nv = Math.min(s.opt.vamp || autoVamp(n), Math.floor((n - 1) / 2));
      const deck = Array(nv).fill('vampir');
      if (s.opt.doc && n >= 5) deck.push('doktor');
      if (s.opt.seer && n >= 5) deck.push('gozcu');
      while (deck.length < n) deck.push('koylu');
      const sh = shuffle(deck); s.roles = {}; s.alive = {}; s.seen = {}; s.seerLog = {};
      s.players.forEach((p, i) => { s.roles[p.id] = sh[i]; s.alive[p.id] = true });
      s.day = 0; s.lastNight = null; s.lastVote = null; s.win = null; s.phase = 'roles';
      return s;
    }
    if (a.type === 'seen' && s.phase === 'roles') { s.seen[pid] = true; if (s.players.every(p => s.seen[p.id] || !p.online)) startNight(s); return s }
    if (s.phase === 'night' && s.alive[pid]) {
      const t = a.t, ok = t && s.alive[t];
      if (a.type === 'kill' && isV(s, pid) && ok && !isV(s, t)) s.night.vamp[pid] = t;
      if (a.type === 'protect' && s.roles[pid] === 'doktor' && ok) s.night.doc = t;
      if (a.type === 'inspect' && s.roles[pid] === 'gozcu' && ok && t !== pid) s.night.seer = t;
      if (nightDone(s)) resolveNight(s);
      return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && s.phase === 'night' && a.day === s.day && Date.now() - s.started >= NIGHT - 300) { resolveNight(s); return s }
    if (a.type === 'vote' && s.phase === 'day' && s.alive[pid] && !(pid in s.votes)) {
      if (a.t !== 'skip' && !(a.t && s.alive[a.t] && a.t !== pid)) return s;
      s.votes[pid] = a.t;
      if (alive(s).every(p => p.id in s.votes || !p.online)) resolveVote(s);
      return s;
    }
    if (a.type === 'endvote' && pid === s.hostId && s.phase === 'day') { resolveVote(s); return s }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (!v.roles) return v;
    const dead = !s.alive[pid], over = s.phase === 'end';
    const myRole = s.roles[pid];
    v.me = { role: myRole, alive: !!s.alive[pid] };
    // rolleri gizle: kendi rolün, vampirler birbirini görür, ölüler ve oyun sonu her şeyi görür
    const roles = {};
    for (const id in s.roles) {
      if (id === pid || over || dead) roles[id] = s.roles[id];
      else if (myRole === 'vampir' && s.roles[id] === 'vampir') roles[id] = 'vampir';
      else if (!s.alive[id] && s.opt.show) roles[id] = s.roles[id];
    }
    v.roles = roles;
    if (v.night) {
      const n = s.night;
      v.night = { mine: isV(s, pid) ? n.vamp[pid] || null : myRole === 'doktor' ? n.doc : myRole === 'gozcu' ? n.seer : null };
      if (isV(s, pid) || dead) v.night.vamp = n.vamp;
      v.night.waiting = s.players.filter(p => needsNight(s, p) && p.online && !((isV(s, p.id) && p.id in n.vamp) || (s.roles[p.id] === 'doktor' && n.doc) || (s.roles[p.id] === 'gozcu' && n.seer))).length;
    }
    if (v.phase === 'night') v.left = Math.max(0, NIGHT - (Date.now() - s.started));
    v.seerLog = myRole === 'gozcu' || dead || over ? (s.seerLog[pid] || Object.values(s.seerLog)[0] || []) : [];
    if (v.phase === 'day') { const mineV = s.votes[pid]; v.votes = {}; for (const id in s.votes) v.votes[id] = id === pid ? mineV : 'x' }
    if (v.lastNight && !over && !dead) delete v.lastNight.savedBy;
    return v;
  }
  return { create, act, view, autoVamp, NIGHT };
})();
if (typeof module !== 'undefined') module.exports = Vampir;
