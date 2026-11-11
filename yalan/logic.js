/* İki Doğru Bir Yalan — 3-10 kişi. Herkes kendisi hakkında 3 cümle yazar, birini yalan olarak işaretler.
   Sonra sırayla herkesin cümleleri gelir, diğerleri yalanı bulmaya çalışır. Bulana +1, kandırdığın her kişi için sana +1. */
const Yalan = (() => {
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }] } }
  function beginVote(s) {
    s.order = shuffle(s.players.filter(p => s.ent[p.id]).map(p => p.id));
    if (!s.order.length) { s.phase = 'write'; return }
    s.cur = 0; s.phase = 'vote'; setup(s);
  }
  function setup(s) { s.perm = shuffle([0, 1, 2]); s.votes = {}; s.gain = {} }
  function voters(s) { const subj = s.order[s.cur]; return s.players.filter(p => p.id !== subj && p.online) }
  function reveal(s) {
    const subj = s.order[s.cur], lie = s.ent[subj].lie, lieK = s.perm.indexOf(lie);
    s.gain = {}; s.players.forEach(p => s.gain[p.id] = 0);
    for (const [pid, k] of Object.entries(s.votes)) { if (k === lieK) s.gain[pid] += 1; else s.gain[subj] += 1 }
    s.players.forEach(p => p.score += s.gain[p.id]); s.phase = 'reveal';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 10)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid); if (!me) return s;
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 3) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 10) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => p.score = 0); s.ent = {}; s.phase = 'write'; return s;
    }
    if (a.type === 'write' && s.phase === 'write' && !s.ent[pid]) {
      const st = Array.isArray(a.s) ? a.s.map(x => String(x || '').trim().replace(/\s+/g, ' ').slice(0, 140)) : [];
      const lie = a.lie | 0; if (st.length !== 3 || st.some(x => x.length < 3) || lie < 0 || lie > 2) return s;
      s.ent[pid] = { s: st, lie };
      if (s.players.every(p => s.ent[p.id] || !p.online)) beginVote(s);
      return s;
    }
    if (a.type === 'go' && pid === s.hostId && s.phase === 'write' && Object.keys(s.ent).length >= 2) { beginVote(s); return s }
    if (a.type === 'vote' && s.phase === 'vote' && pid !== s.order[s.cur] && !(pid in s.votes)) {
      const k = a.k | 0; if (k < 0 || k > 2) return s;
      s.votes[pid] = k;
      if (voters(s).every(p => p.id in s.votes)) reveal(s);
      return s;
    }
    if (a.type === 'force' && pid === s.hostId && s.phase === 'vote') { reveal(s); return s }
    if (a.type === 'next' && s.phase === 'reveal') { s.cur++; if (s.cur >= s.order.length) s.phase = 'over'; else { s.phase = 'vote'; setup(s) } }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (!v.ent) return v;
    const subj = v.order ? v.order[v.cur] : null;
    v.wrote = {}; for (const id in s.ent) v.wrote[id] = true;
    v.mine = s.ent[pid] || null;
    if (v.phase === 'vote' || v.phase === 'reveal') {
      const e = s.ent[subj];
      v.show = { subj, s: v.perm.map(i => e.s[i]), lieK: v.phase === 'reveal' || pid === subj ? v.perm.indexOf(e.lie) : null };
      if (v.phase === 'vote') { const my = s.votes[pid]; v.votes = {}; for (const id in s.votes) v.votes[id] = id === pid ? my : 'x' }
    }
    delete v.ent; delete v.perm;
    return v;
  }
  return { create, act, view };
})();
if (typeof module !== 'undefined') module.exports = Yalan;
