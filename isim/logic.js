/* İsim-Şehir-Hayvan — 2-10 kişi. Her tur bir harf çıkar, herkes kategorilere o harfle başlayan cevaplar yazar.
   Hepsini dolduran "Stop" der, diğerlerine 5 saniye kalır (ya da süre biter).
   Sonra herkes cevapları görür, geçersiz bulduğuna itiraz eder; diğer oyuncuların çoğunluğu itiraz ederse cevap geçersiz.
   Puan: o kategoride geçerli cevabı olan tek kişiysen 20, cevabın kimseyle aynı değilse 10, başkasıyla aynıysa 5. */
const Isim = (() => {
  const CATS = ['İsim', 'Şehir', 'Hayvan', 'Bitki', 'Eşya', 'Ülke', 'Meslek', 'Yemek', 'Ünlü', 'Marka', 'Renk', 'Film/Dizi'];
  const DEF = ['İsim', 'Şehir', 'Hayvan', 'Bitki', 'Eşya', 'Ülke'];
  const LETTERS = 'ABCÇDEFGHIİKLMNOÖPRSŞTUÜVYZ'.split('');
  const DURS = [60000, 90000, 120000], GRACE = 5000;
  const clone = s => JSON.parse(JSON.stringify(s));
  const P = (s, id) => s.players.find(p => p.id === id);
  const lower = t => String(t || '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr');
  const fold = t => lower(t).replace(/[çğıöşüâîû]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }[c])).replace(/[^a-z0-9 ]/g, '');
  const startsOK = (t, L) => { const w = lower(t); return w.length >= 2 && w[0] === L.toLocaleLowerCase('tr') };

  // bir turun puanları: ans {pid:{cat:text}}, votes {voter:{'pid|cat':true}}
  function scoreRound(s) {
    const ids = s.players.map(p => p.id), out = {}, why = {};
    ids.forEach(id => { out[id] = 0; why[id] = {} });
    for (const cat of s.cats) {
      const valid = {};
      for (const id of ids) {
        const t = ((s.ans[id] || {})[cat]) || '';
        if (!t.trim()) { why[id][cat] = { p: 0, r: 'boş' }; continue }
        if (!startsOK(t, s.letter)) { why[id][cat] = { p: 0, r: 'harf tutmuyor' }; continue }
        const others = ids.filter(x => x !== id && (P(s, x) || {}).online !== false);
        const no = others.filter(x => s.votes[x] && s.votes[x][id + '|' + cat]).length;
        if (others.length && no * 2 > others.length || (others.length === 1 && no === 1)) { why[id][cat] = { p: 0, r: 'itiraz' }; continue }
        valid[id] = fold(t);
      }
      const vids = Object.keys(valid);
      for (const id of vids) {
        const same = vids.filter(x => x !== id && valid[x] === valid[id]).length;
        const p = vids.length === 1 ? 20 : same ? 5 : 10;
        out[id] += p; why[id][cat] = { p, r: vids.length === 1 ? 'tek' : same ? 'aynı' : 'farklı' };
      }
    }
    return { pts: out, why };
  }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], cats: DEF.slice(), rounds: 5, dur: 90000, used: [] } }
  function beginRound(s) {
    let pool = LETTERS.filter(l => !s.used.includes(l)); if (!pool.length) { s.used = []; pool = LETTERS }
    s.letter = pool[Math.floor(Math.random() * pool.length)]; s.used.push(s.letter);
    s.ri++; s.ans = {}; s.votes = {}; s.stopBy = null; s.stopAt = null; s.res = null;
    s.startAt = Date.now() + 3000; s.endAt = s.startAt + s.dur; s.phase = 'write';
  }
  function toReview(s) { s.phase = 'review'; s.votes = {}; s.res = scoreRound(s) }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 10)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId, me = P(s, pid);
    if (isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (a.type === 'opts') {
        if (Array.isArray(a.cats)) { const c = a.cats.filter(x => CATS.includes(x)); if (c.length >= 3 && c.length <= 8) s.cats = CATS.filter(x => c.includes(x)) }
        if ([3, 5, 8].includes(a.rounds)) s.rounds = a.rounds;
        if (DURS.includes(a.dur)) s.dur = a.dur;
        return s;
      }
      if (a.type === 'start' && s.players.length >= 2) {
        if (s.watchers) { for (const x of s.watchers) if (!P(s, x.id) && s.players.length < 10) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
        s.players.forEach(p => p.score = 0); s.ri = 0; s.history = []; beginRound(s); return s;
      }
    }
    if (!me) return s;
    if (a.type === 'ans' && s.phase === 'write' && a.ri === s.ri && a.v && typeof a.v === 'object') {
      if (Date.now() > (s.stopAt || s.endAt) + 1500) return s;
      const v = {}; for (const c of s.cats) v[c] = String(a.v[c] || '').slice(0, 30); s.ans[pid] = v;
      return s;
    }
    if (a.type === 'stop' && s.phase === 'write' && !s.stopAt && a.ri === s.ri && Date.now() >= s.startAt) {
      const v = s.ans[pid] || {}; if (!s.cats.every(c => startsOK(v[c], s.letter))) return s;
      s.stopBy = pid; s.stopAt = Math.min(s.endAt, Date.now() + GRACE); return s;
    }
    if (a.type === 'close' && isHost && s.phase === 'write' && Date.now() >= (s.stopAt || s.endAt) + 600) { toReview(s); return s }
    if (a.type === 'vote' && s.phase === 'review' && typeof a.key === 'string' && !a.key.startsWith(pid + '|')) {
      s.votes[pid] = s.votes[pid] || {}; if (s.votes[pid][a.key]) delete s.votes[pid][a.key]; else s.votes[pid][a.key] = true;
      s.res = scoreRound(s); return s;
    }
    if (a.type === 'next' && isHost && s.phase === 'review') {
      const r = scoreRound(s); s.players.forEach(p => p.score += r.pts[p.id] || 0);
      s.history.push({ letter: s.letter, pts: r.pts });
      if (s.ri >= s.rounds) { s.phase = 'over'; const best = Math.max(...s.players.map(p => p.score)); s.winners = s.players.filter(p => p.score === best).map(p => p.id) }
      else beginRound(s);
      return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s); delete v.used;
    if (v.phase === 'write') {
      v.wait = s.startAt - Date.now(); v.left = (s.stopAt || s.endAt) - Date.now();
      v.filled = {}; for (const id in s.ans) { v.filled[id] = s.cats.filter(c => (s.ans[id][c] || '').trim()).length; }
      v.mine = s.ans[pid] || null; delete v.ans;
    }
    delete v.startAt; delete v.endAt; delete v.stopAt;
    return v;
  }
  return { create, act, view, scoreRound, startsOK, fold, CATS, DEF, DURS };
})();
if (typeof module !== 'undefined') module.exports = Isim;
