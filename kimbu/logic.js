/* Kim Bu? — 2-10 kişi. Herkese gizli bir kimlik verilir; kendi kimliğini göremezsin, diğerleri görür.
   Sıran gelince evet/hayır sorusu sorarsın; bildiğini düşününce tahmin edersin. İlk bulan en çok puanı alır. */
const KimBu = (() => {
  const CATS = { karisik: 'Karışık', tr: 'Ünlü Türkler', dunya: 'Dünya ünlüleri', karakter: 'Karakterler', hayvan: 'Hayvanlar' };
  const clone = s => JSON.parse(JSON.stringify(s));
  const bank = () => (typeof KIMLIK !== 'undefined' ? KIMLIK : require('./kimlikler.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function norm(t) {
    return String(t || '').toLocaleLowerCase('tr').replace(/\(.*?\)/g, ' ')
      .replace(/[çğıöşüâîû]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }[c])).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function matches(guess, item) {
    const g = norm(guess); if (!g) return false;
    const names = [item[0]].concat(item[2] || []).map(norm);
    if (names.includes(g)) return true;
    // soyadı ya da ayırt edici kelime tek başına da kabul (en az 4 harf): "messi", "einstein"
    const toks = norm(item[0]).split(' ').filter(t => t.length >= 4);
    return toks.length > 1 && toks.includes(g) && toks.indexOf(g) === toks.length - 1;
  }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], cat: 'karisik', usedK: [] } }
  function nextTurn(s) {
    const n = s.order.length;
    for (let k = 1; k <= n; k++) { const id = s.order[(s.turnIdx + k) % n], p = s.players.find(x => x.id === id); if (!(id in s.done) && p && p.online) { s.turnIdx = (s.turnIdx + k) % n; return } }
    s.phase = 'end';
  }
  function solve(s, pid, how) {
    s.done[pid] = { rank: Object.values(s.done).filter(d => d.how !== 'pes').length + 1, how };
    const left = s.order.filter(id => !(id in s.done));
    if (how !== 'pes') s.players.find(p => p.id === pid).score += Math.max(1, s.order.length - s.done[pid].rank + 1);
    if (!left.length) s.phase = 'end';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 10)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid); if (!me) return s;
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'end') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 10) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.cat = CATS[a.cat] ? a.cat : 'karisik';
      let pool = bank().map((k, i) => i).filter(i => s.cat === 'karisik' || bank()[i][1] === s.cat);
      const fresh = pool.filter(i => !s.usedK.includes(i)); if (fresh.length >= s.players.length) pool = fresh; else s.usedK = [];
      const pick = shuffle(pool).slice(0, s.players.length);
      s.ids = {}; s.players.forEach((p, i) => s.ids[p.id] = pick[i]); s.usedK = s.usedK.concat(pick).slice(-150);
      s.order = shuffle(s.players.map(p => p.id)); s.turnIdx = 0; s.done = {}; s.pending = null; s.log = []; s.phase = 'play';
      return s;
    }
    if (s.phase !== 'play') return s;
    const turnId = s.order[s.turnIdx];
    if (a.type === 'pass' && pid === turnId && !s.pending) { nextTurn(s); return s }
    if (a.type === 'guess' && pid === turnId && !s.pending && !(pid in s.done)) {
      const t = String(a.t || '').trim().slice(0, 40); if (!t) return s;
      const item = bank()[s.ids[pid]];
      if (matches(t, item)) { s.log.push({ by: pid, t, ok: true }); solve(s, pid, 'bildi'); if (s.phase === 'play') nextTurn(s) }
      else s.pending = { by: pid, t, no: {} };
      return s;
    }
    if (a.type === 'judge' && s.pending && pid !== s.pending.by) {
      const P = s.pending;
      if (a.ok) { s.log.push({ by: P.by, t: P.t, ok: true }); s.pending = null; solve(s, P.by, 'bildi'); if (s.phase === 'play') nextTurn(s) }
      else {
        P.no[pid] = true;
        const others = s.players.filter(p => p.id !== P.by && p.online);
        if (others.every(p => P.no[p.id]) || others.length <= 1 || Object.keys(P.no).length >= Math.ceil(others.length / 2)) {
          s.log.push({ by: P.by, t: P.t, ok: false }); s.pending = null; nextTurn(s);
        }
      }
      return s;
    }
    if (a.type === 'giveup' && !(pid in s.done) && !(s.pending && s.pending.by === pid)) {
      s.log.push({ by: pid, t: null, ok: false, pes: true }); const wasTurn = pid === turnId; solve(s, pid, 'pes'); if (s.phase === 'play' && wasTurn) nextTurn(s); return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.ids && v.phase === 'play' && !(pid in s.done)) v.ids[pid] = null;
    delete v.usedK;
    return v;
  }
  return { create, act, view, matches, norm, CATS };
})();
if (typeof module !== 'undefined') module.exports = KimBu;
