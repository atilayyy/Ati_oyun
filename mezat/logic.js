/* Mezat — 2-6 kişi. Herkesin 20 TL bütçesi var, herkes tam 5 ürün alır.
   Ürünler tek tek gelir, eli dolmayan herkes sırayla teklif verir (zorunlu, en az 1 TL). En yüksek teklif alır, eşitlikte önce veren.
   Sonunda jüri gizli puanlara ve ikili/ceza kurallarına göre kadroları puanlar. */
const Mezat = (() => {
  const BUDGET = 20, SLOTS = 5, SHOW = 2600;
  const clone = s => JSON.parse(JSON.stringify(s));
  const T = () => (typeof TEMALAR !== 'undefined' ? TEMALAR : require('./temalar.js'));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const P = (s, id) => s.players.find(p => p.id === id);
  const maxPlayers = theme => Math.min(6, Math.floor(T()[theme].items.length / SLOTS));

  function judge(theme, idxs) {
    const th = T()[theme], items = idxs.map(i => th.items[i]), names = new Set(items.map(i => i[0]));
    const cnt = tag => items.filter(i => i[3] === tag).length;
    const lines = [];
    for (const r of th.rules) {
      if (r.t === 'need' && cnt(r.tag) === 0) lines.push([r.msg, r.pts]);
      else if (r.t === 'max' && cnt(r.tag) > r.k) lines.push([r.msg, r.pts * (cnt(r.tag) - r.k)]);
      else if (r.t === 'many' && cnt(r.tag) >= r.k) lines.push([r.msg, r.pts]);
      else if (r.t === 'combo' && r.items.every(n => names.has(n))) lines.push([r.msg, r.pts]);
      else if (r.t === 'with' && names.has(r.item) && items.some(i => i[0] !== r.item && i[3] === r.tag)) lines.push([r.msg, r.pts]);
    }
    const base = items.reduce((a, i) => a + i[2], 0);
    return { base, lines, total: base + lines.reduce((a, l) => a + l[1], 0) };
  }

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], theme: 'burger', log: [] } }
  const maxBid = (s, id) => s.money[id] - (SLOTS - s.owned[id].length - 1);
  const auto = (s, id) => { const p = P(s, id); return !p || p.bot || !p.online };

  function botBid(s, id) {
    const th = T()[s.theme], it = th.items[s.deck[s.pos]], mine = s.owned[id].map(i => th.items[i]);
    let val = it[2];
    // botlar da kuralları bilir: eksik zorunlu türü daha çok ister, sınırı aşacaksa istemez
    for (const r of th.rules) {
      if (r.t === 'need' && r.tag === it[3] && !mine.some(m => m[3] === r.tag)) val += -r.pts * 0.8;
      if (r.t === 'max' && r.tag === it[3] && mine.filter(m => m[3] === r.tag).length >= r.k) val += r.pts * 1.5;
      if (r.t === 'combo' && r.items.includes(it[0]) && r.items.filter(n => n !== it[0]).every(n => mine.some(m => m[0] === n))) val += r.pts;
    }
    const left = s.deck.length - s.pos, need = SLOTS - s.owned[id].length;
    const per = s.money[id] / need;
    let b = Math.round(per * Math.max(0, val) / 10 + (Math.random() * 2 - 1));
    if (left <= need) b = 1;
    return Math.max(1, Math.min(maxBid(s, id), b));
  }

  function startItem(s) {
    const needers = s.players.filter(p => s.owned[p.id].length < SLOTS);
    if (s.pos >= s.deck.length || !needers.length) return finish(s);
    const n = s.players.length, order = [];
    for (let k = 0; k < n; k++) { const p = s.players[(s.rot + k) % n]; if (s.owned[p.id].length < SLOTS) order.push(p.id) }
    s.rot = (s.rot + 1) % n;
    s.bids = []; s.order = order; s.bi = 0; s.sold = null;
    if (order.length === 1) { award(s, order[0], 1, true); return }
    s.phase = 'bid'; autoBids(s);
  }
  function autoBids(s) {
    while (s.phase === 'bid' && s.bi < s.order.length && auto(s, s.order[s.bi])) {
      const id = s.order[s.bi]; placeBid(s, id, P(s, id) && P(s, id).bot ? botBid(s, id) : 1);
    }
  }
  function placeBid(s, id, amt) {
    s.bids.push({ id, amt }); s.bi++;
    if (s.bi >= s.order.length) {
      let best = s.bids[0]; for (const b of s.bids) if (b.amt > best.amt) best = b;
      award(s, best.id, best.amt, false);
    }
  }
  function award(s, id, amt, alone) {
    const th = T()[s.theme], item = s.deck[s.pos];
    s.money[id] -= amt; s.owned[id].push(item);
    s.sold = { id, amt, item, alone };
    s.log.push(`${P(s, id).name} ${th.items[item][0]} aldı: ${amt} TL${alone ? ' (teklif veren tek kişi kaldı)' : ''}.`);
    if (s.log.length > 40) s.log.shift();
    s.phase = 'sold';
  }
  function finish(s) {
    s.result = {};
    for (const p of s.players) s.result[p.id] = judge(s.theme, s.owned[p.id]);
    const best = Math.max(...s.players.map(p => s.result[p.id].total));
    let top = s.players.filter(p => s.result[p.id].total === best);
    if (top.length > 1) { const m = Math.max(...top.map(p => s.money[p.id])); top = top.filter(p => s.money[p.id] === m) }
    s.winners = top.map(p => p.id); top.forEach(p => p.score += 1);
    s.phase = 'over';
  }

  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 6)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (a.type === 'theme' && T()[a.theme]) { s.theme = a.theme; return s }
      if (a.type === 'addbot' && s.players.length < maxPlayers(s.theme)) {
        let n = 1; while (s.players.some(p => p.id === 'bot' + n)) n++;
        s.players.push({ id: 'bot' + n, name: 'Robot ' + n, online: true, score: 0, bot: true }); return s;
      }
      if (a.type === 'rmbot') { const b = s.players.filter(p => p.bot).pop(); if (b) s.players = s.players.filter(p => p !== b); return s }
      if (a.type === 'start' && s.players.length >= 2) {
        if (s.watchers) { for (const x of s.watchers) if (!P(s, x.id) && s.players.length < 6) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
        while (s.players.length > maxPlayers(s.theme)) { const b = s.players.filter(p => p.bot).pop(); if (!b) break; s.players = s.players.filter(p => p !== b) }
        if (s.players.length > maxPlayers(s.theme)) return s;
        const th = T()[s.theme];
        s.deck = shuffle(th.items.map((_, i) => i)).slice(0, s.players.length * SLOTS);
        s.pos = 0; s.rot = Math.floor(Math.random() * s.players.length); s.money = {}; s.owned = {}; s.log = []; s.result = null; s.winners = null;
        for (const p of s.players) { s.money[p.id] = BUDGET; s.owned[p.id] = [] }
        startItem(s); return s;
      }
    }
    if (!P(s, pid)) return s;
    if (a.type === 'bid' && s.phase === 'bid' && s.order[s.bi] === pid) {
      const amt = a.amt | 0; if (amt < 1 || amt > maxBid(s, pid) || amt !== a.amt) return s;
      placeBid(s, pid, amt); autoBids(s); return s;
    }
    if (a.type === 'next' && isHost && s.phase === 'sold' && a.pos === s.pos) { s.pos++; startItem(s); return s }
    if (a.type === 'skip' && isHost && s.phase === 'bid') { placeBid(s, s.order[s.bi], 1); autoBids(s); return s }
    return s;
  }
  function view(s, pid) { return clone(s) }
  return { create, act, view, judge, maxBid, maxPlayers, BUDGET, SLOTS, SHOW };
})();
if (typeof module !== 'undefined') module.exports = Mezat;
