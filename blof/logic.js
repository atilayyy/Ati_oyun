/* Blöf Sözlük — 2-8 kişi. Az bilinen bir kelime gelir, herkes uydurma bir anlam yazar.
   Sonra gerçek anlamı bulmak için oy verilir. Gerçeği bulana +2, senin uydurmana kanan her kişi için sana +1. */
const Blof = (() => {
  const WRITE = 75000, VOTE = 35000;
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof KELIMELER !== 'undefined' ? KELIMELER : require('./kelimeler.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const norm = t => String(t || '').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], used: [] } }
  function startWrite(s) { s.phase = 'write'; s.started = Date.now(); s.fake = {}; s.votes = {}; s.opts = null; s.gain = {} }
  function startVote(s) {
    if (s.phase !== 'write') return;
    const real = bank()[s.qs[s.cur]][1];
    const opts = [{ t: real, by: null }];
    for (const p of s.players) { const f = s.fake[p.id]; if (f && norm(f) !== norm(real)) opts.push({ t: f, by: p.id }) }
    s.opts = shuffle(opts); s.phase = 'vote'; s.started = Date.now();
  }
  function reveal(s) {
    if (s.phase !== 'vote') return;
    s.gain = {}; s.players.forEach(p => s.gain[p.id] = 0);
    for (const p of s.players) {
      const v = s.votes[p.id]; if (v === undefined) continue;
      const o = s.opts[v]; if (!o) continue;
      if (o.by === null) s.gain[p.id] += 2; else if (o.by !== p.id) s.gain[o.by] += 1;
    }
    // gerçek anlamı yazan olursa (oylamaya girmez) ona +2
    const real = bank()[s.qs[s.cur]][1];
    for (const p of s.players) if (s.fake[p.id] && norm(s.fake[p.id]) === norm(real)) s.gain[p.id] += 2;
    s.players.forEach(p => p.score += s.gain[p.id]);
    s.phase = 'reveal';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => p.score = 0);
      const n = [5, 8, 10].includes(a.count) ? a.count : 5, all = bank().map((w, i) => i);
      let pool = all.filter(i => !s.used.includes(i)); if (pool.length < n) { s.used = []; pool = all }
      s.qs = shuffle(pool).slice(0, n); s.used = s.used.concat(s.qs); s.cur = 0; startWrite(s); return s;
    }
    if (!me) return s;
    if (a.type === 'fake' && s.phase === 'write' && !(pid in s.fake)) {
      const t = String(a.t || '').trim().replace(/\s+/g, ' ').slice(0, 140); if (t.length < 3) return s;
      s.fake[pid] = t.charAt(0).toLocaleUpperCase('tr') + t.slice(1);
      if (s.players.every(p => p.id in s.fake || !p.online)) startVote(s);
      return s;
    }
    if (a.type === 'vote' && s.phase === 'vote' && !(pid in s.votes)) {
      const k = a.k | 0, o = s.opts[k]; if (!o || o.by === pid) return s;
      s.votes[pid] = k;
      const voters = s.players.filter(p => p.online && s.opts.some(x => x.by !== p.id));
      if (voters.every(p => p.id in s.votes)) reveal(s);
      return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && a.cur === s.cur) {
      if (s.phase === 'write' && a.ph === 'write' && Date.now() - s.started >= WRITE - 300) startVote(s);
      else if (s.phase === 'vote' && a.ph === 'vote' && Date.now() - s.started >= VOTE - 300) reveal(s);
      return s;
    }
    if (a.type === 'next' && s.phase === 'reveal') { s.cur++; if (s.cur >= s.qs.length) s.phase = 'over'; else startWrite(s) }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'write' || v.phase === 'vote') v.left = Math.max(0, (v.phase === 'write' ? WRITE : VOTE) - (Date.now() - s.started));
    if (v.phase === 'write') for (const id in v.fake) if (id !== pid) v.fake[id] = 'x';
    if (v.phase === 'vote') {
      for (const id in v.votes) if (id !== pid) v.votes[id] = 'x';
      v.opts = v.opts.map(o => ({ t: o.t, mine: o.by === pid }));
    }
    if (v.phase !== 'reveal' && v.phase !== 'over') v.real = null; else v.real = bank()[s.qs[s.cur]] ? bank()[s.qs[s.cur]][1] : null;
    delete v.used;
    return v;
  }
  return { create, act, view, WRITE, VOTE };
})();
if (typeof module !== 'undefined') module.exports = Blof;
