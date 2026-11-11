/* Casus — 3-12 kişi. Herkes aynı gizli mekânı görür, biri casustur ve mekânı bilmez.
   Sırayla birbirinize mekânla ilgili sorular sorarsınız. Casus mekânı tahmin ederse ya da masum biri suçlanırsa casus kazanır. */
const Casus = (() => {
  const MEKAN = ['Hastane', 'Uçak', 'Okul', 'Plaj', 'Restoran', 'Banka', 'Sinema', 'Polis karakolu', 'Süpermarket', 'Otel', 'Hapishane',
    'Futbol stadyumu', 'Uzay istasyonu', 'Denizaltı', 'Korsan gemisi', 'Spor salonu', 'Kütüphane', 'Düğün salonu', 'Hamam', 'Tren',
    'Havalimanı', 'Çay bahçesi', 'Kuaför', 'Pazar yeri', 'Kamp alanı', 'Lunapark', 'Müze', 'Plaza ofisi', 'Yat', 'Kayak merkezi',
    'Askeri birlik', 'İtfaiye', 'Eczane', 'Sirk', 'Çiftlik', 'Vapur', 'Benzin istasyonu', 'Diş hekimi muayenehanesi', 'Kafe', 'Gece kulübü'];
  const clone = s => JSON.parse(JSON.stringify(s));
  const pickR = a => a[Math.floor(Math.random() * a.length)];
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], min: 8, lastLoc: [] } }
  function end(s, win, why) {
    s.phase = 'end'; s.win = win; s.why = why;
    if (win === 'casus') s.players.find(p => p.id === s.spy).score += 2;
    else s.players.forEach(p => { if (p.id !== s.spy) p.score += 1 });
    if (win === 'koy' && s.acc && s.acc.by && s.acc.t === s.spy) { const a = s.players.find(p => p.id === s.acc.by); if (a) a.score += 1 }
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 12)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid); if (!me) return s;
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'end') && s.players.length >= 3) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 12) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.min = [5, 8, 10].includes(a.min) ? a.min : 8;
      let li; do { li = Math.floor(Math.random() * MEKAN.length) } while (s.lastLoc.includes(li));
      s.lastLoc = s.lastLoc.concat([li]).slice(-12);
      s.loc = li; s.spy = pickR(s.players).id; s.first = pickR(s.players).id; s.started = Date.now();
      s.phase = 'play'; s.acc = null; s.accused = {}; s.final = null; s.win = null; s.why = null; s.spyGuess = null;
      return s;
    }
    if (a.type === 'accuse' && s.phase === 'play' && !s.accused[pid]) {
      const t = s.players.find(p => p.id === a.t); if (!t || t.id === pid) return s;
      s.accused[pid] = true; s.acc = { by: pid, t: t.id, votes: { [pid]: true } }; s.phase = 'accuse'; return s;
    }
    if (a.type === 'avote' && s.phase === 'accuse' && pid !== s.acc.t && !(pid in s.acc.votes)) {
      s.acc.votes[pid] = !!a.yes;
      const voters = s.players.filter(p => p.id !== s.acc.t && p.online);
      if (voters.every(p => p.id in s.acc.votes)) {
        if (voters.every(p => s.acc.votes[p.id])) end(s, s.acc.t === s.spy ? 'koy' : 'casus', s.acc.t === s.spy ? 'yakalandi' : 'masum');
        else { s.lastFail = { t: s.acc.t, by: s.acc.by }; s.acc = null; s.phase = 'play' }
      }
      return s;
    }
    if (a.type === 'guess' && pid === s.spy && (s.phase === 'play' || s.phase === 'final')) {
      const g = a.loc | 0; if (g < 0 || g >= MEKAN.length) return s;
      s.spyGuess = g; end(s, g === s.loc ? 'casus' : 'koy', g === s.loc ? 'bildi' : 'bilemedi'); return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && s.phase === 'play' && Date.now() - s.started >= s.min * 60000 - 500) { s.phase = 'final'; s.final = {}; return s }
    if (a.type === 'fvote' && s.phase === 'final' && !(pid in s.final)) {
      const t = s.players.find(p => p.id === a.t); if (!t || t.id === pid) return s;
      s.final[pid] = t.id;
      if (s.players.every(p => p.id in s.final || !p.online)) {
        const tally = {}; Object.values(s.final).forEach(t => tally[t] = (tally[t] || 0) + 1);
        const max = Math.max(...Object.values(tally)), top = Object.keys(tally).filter(k => tally[k] === max);
        s.finalTally = tally;
        end(s, top.length === 1 && top[0] === s.spy ? 'koy' : 'casus', top.length === 1 && top[0] === s.spy ? 'yakalandi' : 'kacti');
      }
      return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'lobby') return v;
    v.amSpy = s.spy === pid;
    if (v.phase !== 'end') { delete v.spy; if (v.amSpy) v.loc = null }
    if (v.phase === 'play' || v.phase === 'accuse') v.left = Math.max(0, s.min * 60000 - (Date.now() - s.started));
    if (v.final && v.phase === 'final') { const n = Object.keys(v.final).length; v.final = { mine: s.final[pid] || null, n } }
    delete v.lastLoc;
    return v;
  }
  return { create, act, view, MEKAN };
})();
if (typeof module !== 'undefined') module.exports = Casus;
