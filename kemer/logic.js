/* Kemer — 6 nimmt! kurallarından esinlenen kart oyunu. 2-10 oyuncu (eksikleri bilgisayar tamamlayabilir).
   1-104 arası kartlar, her kartta ceza boynuzu var. Herkes aynı anda bir kart seçer; kartlar küçükten büyüğe
   sıralara dizilir. Bir sıraya 6. kart gelirse, koyan kişi önceki 5 kartı cezası olarak alır.
   Kartın sığacağı sıra yoksa oyuncu bir sırayı seçip alır. 66 cezaya ulaşan olunca oyun biter, en az cezalı kazanır. */
const Kemer = (() => {
  const LIMIT = 66, HAND = 10, MAX = 10;
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const heads = c => c === 55 ? 7 : c % 11 === 0 ? 5 : c % 10 === 0 ? 3 : c % 5 === 0 ? 2 : 1;
  const sum = cs => cs.reduce((a, c) => a + heads(c), 0);
  const P = (s, id) => s.players.find(p => p.id === id);
  const auto = (s, id) => { const p = P(s, id); return !p || p.bot || !p.online };

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], round: 0, log: [] } }
  function log(s, m) { s.log.push(m); if (s.log.length > 30) s.log.shift() }

  function targetRow(rows, c) {
    let best = -1;
    rows.forEach((r, i) => { const last = r[r.length - 1]; if (last < c && (best < 0 || last > rows[best][rows[best].length - 1])) best = i });
    return best;
  }
  function cheapestRow(rows) { let b = 0; rows.forEach((r, i) => { if (sum(r) < sum(rows[b]) || (sum(r) === sum(rows[b]) && r.length < rows[b].length)) b = i }); return b }
  function botCard(s, id) {
    const hand = s.hands[id]; let best = null, bs = Infinity;
    for (const c of hand) {
      const t = targetRow(s.rows, c); let sc;
      if (t < 0) sc = 60 + sum(s.rows[cheapestRow(s.rows)]) * 6 - c / 20;
      else { const r = s.rows[t]; sc = r.length >= 5 ? 200 + sum(r) * 10 : (c - r[r.length - 1]) + r.length * 4 }
      sc += Math.random() * 6;
      if (sc < bs) { bs = sc; best = c }
    }
    return best;
  }

  function startRound(s) {
    s.round++;
    const deck = shuffle(Array.from({ length: 104 }, (_, i) => i + 1));
    s.hands = {}; s.taken = {};
    for (const p of s.players) { s.hands[p.id] = deck.splice(0, HAND).sort((a, b) => a - b); s.taken[p.id] = [] }
    s.rows = [0, 1, 2, 3].map(() => [deck.pop()]);
    s.turn = 1; s.ev = null; beginPick(s);
    log(s, `${s.round}. el başladı.`);
  }
  function beginPick(s) { s.phase = 'pick'; s.picks = {}; s.queue = []; s.qi = 0; s.pending = null; maybeReveal(s) }
  function maybeReveal(s) {
    const humans = s.players.filter(p => !auto(s, p.id));
    if (!humans.every(p => s.picks[p.id] != null)) return;
    for (const p of s.players) if (s.picks[p.id] == null) s.picks[p.id] = p.bot ? botCard(s, p.id) : s.hands[p.id][0];
    s.queue = s.players.map(p => ({ id: p.id, c: s.picks[p.id] })).sort((a, b) => a.c - b.c);
    for (const q of s.queue) s.hands[q.id] = s.hands[q.id].filter(c => c !== q.c);
    s.qi = 0; s.phase = 'resolve';
  }
  function place(s, id, c, rowForced) {
    const nm = P(s, id).name;
    if (rowForced != null) {
      const r = s.rows[rowForced]; s.taken[id].push(...r); s.rows[rowForced] = [c];
      s.ev = { id, c, row: rowForced, took: r.length, h: sum(r) };
      log(s, `${nm} ${c} ile sıra ${rowForced + 1}'i aldı: ${sum(r)} ceza.`);
    } else {
      const t = targetRow(s.rows, c), r = s.rows[t];
      if (r.length >= 5) {
        s.taken[id].push(...r); s.rows[t] = [c];
        s.ev = { id, c, row: t, took: r.length, h: sum(r) };
        log(s, `${nm} ${c} ile sıra ${t + 1}'in 6. kartını koydu: ${sum(r)} ceza.`);
      } else { r.push(c); s.ev = { id, c, row: t, took: 0, h: 0 } }
    }
    s.qi++;
    if (s.qi >= s.queue.length) endTurn(s);
  }
  function step(s) {
    const q = s.queue[s.qi]; if (!q) return;
    const t = targetRow(s.rows, q.c);
    if (t < 0) {
      if (auto(s, q.id)) return place(s, q.id, q.c, cheapestRow(s.rows));
      s.phase = 'choose'; s.pending = { id: q.id, c: q.c };
      return;
    }
    place(s, q.id, q.c, null);
  }
  function endTurn(s) {
    if (s.turn < HAND) { s.turn++; beginPick(s); return }
    s.res = {};
    for (const p of s.players) { s.res[p.id] = sum(s.taken[p.id]); p.score += s.res[p.id] }
    const top = Math.max(...s.players.map(p => p.score));
    if (top >= LIMIT) {
      const low = Math.min(...s.players.map(p => p.score));
      s.winners = s.players.filter(p => p.score === low).map(p => p.id); s.phase = 'over';
    } else s.phase = 'roundEnd';
  }

  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, MAX)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (isHost && s.phase === 'lobby') {
      if (a.type === 'addbot' && s.players.length < MAX) {
        let n = 1; while (s.players.some(p => p.id === 'bot' + n)) n++;
        s.players.push({ id: 'bot' + n, name: 'Robot ' + n, online: true, score: 0, bot: true }); return s;
      }
      if (a.type === 'rmbot') { const b = s.players.filter(p => p.bot).pop(); if (b) s.players = s.players.filter(p => p !== b); return s }
    }
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!P(s, x.id) && s.players.length < MAX) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => p.score = 0); s.round = 0; s.log = []; startRound(s); return s;
    }
    if (a.type === 'next' && isHost && s.phase === 'roundEnd') { startRound(s); return s }
    if (!P(s, pid)) return s;
    if (a.type === 'pick' && s.phase === 'pick' && s.picks[pid] == null && s.hands[pid].includes(a.c)) {
      s.picks[pid] = a.c; maybeReveal(s); return s;
    }
    if (a.type === 'unpick' && s.phase === 'pick' && s.picks[pid] != null) { delete s.picks[pid]; return s }
    if (a.type === 'step' && isHost && s.phase === 'resolve' && a.turn === s.turn && a.qi === s.qi) { step(s); return s }
    if (a.type === 'row' && s.phase === 'choose' && s.pending && s.pending.id === pid && a.r >= 0 && a.r < 4) {
      const { id, c } = s.pending; s.pending = null; s.phase = 'resolve'; place(s, id, c, a.r | 0); return s;
    }
    // biri bağlantıyı koparıp seçim bekletiyorsa ev sahibi devam ettirebilir
    if (a.type === 'force' && isHost) {
      if (s.phase === 'pick') { for (const p of s.players) if (s.picks[p.id] == null) s.picks[p.id] = p.bot ? botCard(s, p.id) : s.hands[p.id][0]; maybeReveal(s) }
      else if (s.phase === 'choose') { const { id, c } = s.pending; s.pending = null; s.phase = 'resolve'; place(s, id, c, cheapestRow(s.rows)) }
      return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.hands) {
      v.counts = {}; for (const id in s.hands) v.counts[id] = s.hands[id].length;
      v.hand = s.hands[pid] || []; delete v.hands;
      v.pen = {}; for (const id in s.taken) v.pen[id] = sum(s.taken[id]); delete v.taken;
    }
    if (v.phase === 'pick' && v.picks) { const mine = s.picks[pid]; for (const id in v.picks) v.picks[id] = id === pid ? mine : 0 }
    return v;
  }
  return { create, act, view, heads, sum, targetRow, LIMIT, HAND, MAX };
})();
if (typeof module !== 'undefined') module.exports = Kemer;
