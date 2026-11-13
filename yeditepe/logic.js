/* Yedi Tepe — Catan temel kurallarıyla İstanbul temalı yerleşim oyunu. 2-4 oyuncu (resmî kural 3-4).
   Durumlar: lobby → setup (yılan sırası 2 ev + 2 yol) → play (roll → main; 7'de discard → robber → steal) → over */
const YediTepe = (() => {
  const G = typeof YT !== 'undefined' ? YT : require('./board.js');
  const { RES, COST, HEX, VERT, EDGE, HADJ, PORT_EDGES } = G;
  const WIN = 10, LIMIT = { yol: 15, ev: 5, konak: 4 };
  const COLORS = ['#e5484d', '#3b82f6', '#f59e0b', '#f2f3fb'];
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const P = (s, id) => s.players.find(p => p.id === id);
  const nm = (s, id) => (P(s, id) || {}).name || '?';
  const empty = () => ({ kereste: 0, tugla: 0, kumas: 0, bugday: 0, mermer: 0 });
  const total = h => RES.reduce((a, r) => a + h[r], 0);
  const cur = s => s.order[s.turn];
  function log(s, m) { s.log.push(m); if (s.log.length > 60) s.log.shift() }

  /* ---- harita ---- */
  function makeBoard() {
    const terr = shuffle(['kereste', 'kereste', 'kereste', 'kereste', 'kumas', 'kumas', 'kumas', 'kumas', 'bugday', 'bugday', 'bugday', 'bugday', 'tugla', 'tugla', 'tugla', 'mermer', 'mermer', 'mermer', 'col']);
    const nums = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
    let hexes;
    for (let tries = 0; tries < 2000; tries++) {
      const ns = shuffle(nums); let k = 0;
      hexes = terr.map(t => ({ t, n: t === 'col' ? null : ns[k++] }));
      // 6 ve 8'ler yan yana gelmez (resmî kural)
      const red = i => hexes[i].n === 6 || hexes[i].n === 8;
      if (!hexes.some((h, i) => red(i) && HADJ[i].some(red))) break;
    }
    const used = { kereste: 0, tugla: 0, kumas: 0, bugday: 0, mermer: 0 }, names = hexes.map(h => { const pl = G.TERRAIN[h.t].places; const i = used[h.t] = (used[h.t] || 0); used[h.t]++; return pl[i % pl.length] });
    const ptypes = shuffle(['3', '3', '3', '3', ...RES]), pnames = shuffle(G.PORTS);
    const ports = PORT_EDGES.map((e, i) => ({ e, t: ptypes[i], name: pnames[i] }));
    return { hexes, names, ports, robber: hexes.findIndex(h => h.t === 'col') };
  }

  /* ---- yardımcılar ---- */
  const vOwner = (s, v) => s.vb[v] ? s.vb[v].o : null;
  function distanceOK(s, v) { return !s.vb[v] && !VERT[v].adj.some(u => s.vb[u]) }
  function vertTouchesRoad(s, pid, v) { return VERT[v].edges.some(e => s.eb[e] === pid) }
  function roadOK(s, pid, e) {
    if (s.eb[e] != null) return false;
    // kendi yoluna ya da yapına bağlı olmalı; rakip yapının içinden geçilemez
    return EDGE[e].v.some(v => { const o = vOwner(s, v); if (o === pid) return true; if (o != null) return false; return VERT[v].edges.some(x => x !== e && s.eb[x] === pid) });
  }
  function countB(s, pid, kind) { if (kind === 'yol') return Object.values(s.eb).filter(o => o === pid).length; return Object.values(s.vb).filter(b => b.o === pid && (kind === 'konak' ? b.city : !b.city)).length }
  function canPay(h, cost) { return RES.every(r => h[r] >= (cost[r] || 0)) }
  function pay(s, pid, cost) { for (const r in cost) { s.hands[pid][r] -= cost[r]; s.bank[r] += cost[r] } }
  function rates(s, pid) {
    const out = { kereste: 4, tugla: 4, kumas: 4, bugday: 4, mermer: 4 };
    for (const p of s.ports) if (EDGE[p.e].v.some(v => vOwner(s, v) === pid)) {
      if (p.t === '3') RES.forEach(r => out[r] = Math.min(out[r], 3)); else out[p.t] = 2;
    }
    return out;
  }
  function longestFor(s, pid) {
    let best = 0;
    const blocked = v => { const o = vOwner(s, v); return o != null && o !== pid };
    const dfs = (v, used) => {
      let m = 0;
      for (const e of VERT[v].edges) {
        if (s.eb[e] !== pid || used.has(e)) continue;
        const o = EDGE[e].v[0] === v ? EDGE[e].v[1] : EDGE[e].v[0];
        used.add(e); m = Math.max(m, 1 + (blocked(o) ? 0 : dfs(o, used))); used.delete(e);
      }
      return m;
    };
    for (let v = 0; v < VERT.length; v++) if (VERT[v].edges.some(e => s.eb[e] === pid)) best = Math.max(best, dfs(v, new Set()));
    return best;
  }
  function updateLongest(s) {
    const lens = {}; s.order.forEach(id => lens[id] = longestFor(s, id)); s.roadLen = lens;
    const max = Math.max(...Object.values(lens)), old = s.longest;
    if (max < 5) s.longest = null;
    else {
      const tops = s.order.filter(id => lens[id] === max);
      if (old && tops.includes(old)) { /* eşitlikte sahibi korur */ }
      else s.longest = tops.length === 1 ? tops[0] : null;
    }
    if (s.longest !== old) log(s, s.longest ? `🛣️ En Uzun Yol artık ${nm(s, s.longest)}: ${lens[s.longest]} yol.` : '🛣️ En Uzun Yol kimsede değil.');
  }
  function updateArmy(s, pid) {
    const k = s.knights[pid];
    if (k >= 3 && (!s.army || (s.army !== pid && k > s.knights[s.army]))) { s.army = pid; log(s, `⚔️ En Büyük Ordu artık ${nm(s, pid)}: ${k} yeniçeri.`) }
  }
  function vp(s, pid, hidden) {
    let n = 0;
    for (const b of Object.values(s.vb)) if (b.o === pid) n += b.city ? 2 : 1;
    if (s.longest === pid) n += 2; if (s.army === pid) n += 2;
    if (hidden) n += s.dev[pid].filter(c => c.k === 'puan').length;
    return n;
  }
  function checkWin(s) {
    const pid = cur(s);
    if (s.phase === 'play' && vp(s, pid, true) >= WIN) {
      s.phase = 'over'; s.winner = pid; P(s, pid).score += 1;
      log(s, `🏆 ${nm(s, pid)} ${vp(s, pid, true)} puanla kazandı!`);
    }
  }

  /* ---- üretim ---- */
  function produce(s, n) {
    const want = {}; s.order.forEach(id => want[id] = empty());
    s.hexes.forEach((h, i) => {
      if (h.n !== n || i === s.robber) return;
      for (const v of HEX[i].verts) { const b = s.vb[v]; if (b) want[b.o][h.t] += b.city ? 2 : 1 }
    });
    const got = [];
    for (const r of RES) {
      const takers = s.order.filter(id => want[id][r] > 0), need = takers.reduce((a, id) => a + want[id][r], 0);
      if (!need) continue;
      if (need > s.bank[r]) {
        // banka yetmezse kimse almaz; tek kişi alıyorsa kalanı alır
        if (takers.length === 1) { const k = s.bank[r]; if (k) { s.hands[takers[0]][r] += k; s.bank[r] = 0; got.push(`${nm(s, takers[0])} +${k} ${G.RE[r]}`) } }
        else log(s, `Bankada yeterli ${G.RN[r]} yok, kimse alamadı.`);
        continue;
      }
      for (const id of takers) { s.hands[id][r] += want[id][r]; s.bank[r] -= want[id][r]; got.push(`${nm(s, id)} +${want[id][r]} ${G.RE[r]}`) }
    }
    if (got.length) log(s, got.join(', '));
  }

  /* ---- zabıta ---- */
  function afterRobber(s) { s.sub = s.robberBack || 'main'; s.robberBack = null }
  function stealFrom(s, victim) {
    const h = s.hands[victim], pool = [];
    RES.forEach(r => { for (let i = 0; i < h[r]; i++) pool.push(r) });
    if (pool.length) { const r = pool[Math.floor(Math.random() * pool.length)]; h[r]--; s.hands[cur(s)][r]++; s.lastSteal = { by: cur(s), from: victim, r }; log(s, `${nm(s, cur(s))}, ${nm(s, victim)} oyuncusundan 1 kart çaldı.`) }
    afterRobber(s);
  }
  function moveRobber(s, h) {
    s.robber = h; log(s, `🚨 Zabıta ${s.names[h]}'e geldi.`);
    const c = s.order.filter(id => id !== cur(s) && total(s.hands[id]) > 0 && HEX[h].verts.some(v => vOwner(s, v) === id));
    if (!c.length) return afterRobber(s);
    if (c.length === 1) return stealFrom(s, c[0]);
    s.sub = 'steal'; s.stealC = c;
  }

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], log: [] } }
  function startGame(s) {
    const b = makeBoard();
    Object.assign(s, b);
    s.order = shuffle(s.players.map(p => p.id));
    s.colors = {}; s.order.forEach((id, i) => s.colors[id] = COLORS[i]);
    s.vb = {}; s.eb = {}; s.hands = {}; s.dev = {}; s.knights = {}; s.roadLen = {};
    s.order.forEach(id => { s.hands[id] = empty(); s.dev[id] = []; s.knights[id] = 0; s.roadLen[id] = 0 });
    s.bank = { kereste: 19, tugla: 19, kumas: 19, bugday: 19, mermer: 19 };
    s.deck = shuffle([...Array(14).fill('yeniceri'), ...Array(5).fill('puan'), 'yol2', 'yol2', 'bereket', 'bereket', 'tekel', 'tekel']);
    s.longest = null; s.army = null; s.winner = null; s.dice = null; s.trade = null; s.lastSteal = null;
    s.setupList = [...s.order, ...s.order.slice().reverse()]; s.setupStep = 0; s.setupNeed = 'ev'; s.setupV = null;
    s.turn = s.order.indexOf(s.setupList[0]); s.turnNo = 0; s.devPlayed = false; s.sub = null; s.free = 0;
    s.phase = 'setup'; s.log = [];
    log(s, 'Kurulum: herkes sırayla 1 ev ve 1 yol koyar, sonra ters sırayla bir tur daha. İkinci evin yanındaki yerlerden başlangıç kaynağı gelir.');
  }
  function nextTurn(s) {
    s.turn = (s.turn + 1) % s.order.length; s.turnNo++; s.sub = 'roll'; s.devPlayed = false; s.trade = null; s.dice = null; s.free = 0; s.lastSteal = null;
    log(s, `— ${nm(s, cur(s))} sırası.`);
    checkWin(s); // başkasının turunda 10'a ulaşan kendi turu başlayınca kazanır
  }

  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 4)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!P(s, x.id) && s.players.length < 4) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      startGame(s); return s;
    }
    if (!s.order || !s.order.includes(pid)) return s;
    const me = pid, myTurn = cur(s) === me, H = s.hands[me];

    /* kurulum */
    if (s.phase === 'setup') {
      if (!myTurn) return s;
      if (a.type === 'place' && s.setupNeed === 'ev' && Number.isInteger(a.v) && VERT[a.v] && distanceOK(s, a.v)) {
        s.vb[a.v] = { o: me, city: false }; s.setupV = a.v; s.setupNeed = 'yol';
        if (s.setupStep >= s.order.length) {
          const got = [];
          for (const hi of VERT[a.v].hexes) { const t = s.hexes[hi].t; if (t !== 'col') { s.hands[me][t]++; s.bank[t]--; got.push(G.RE[t]) } }
          log(s, `${nm(s, me)} ikinci evini koydu, başlangıç kaynakları: ${got.join(' ') || 'yok'}.`);
        } else log(s, `${nm(s, me)} ilk evini koydu.`);
        return s;
      }
      if (a.type === 'road' && s.setupNeed === 'yol' && Number.isInteger(a.e) && EDGE[a.e] && s.eb[a.e] == null && EDGE[a.e].v.includes(s.setupV)) {
        s.eb[a.e] = me; s.setupStep++;
        if (s.setupStep >= s.setupList.length) {
          s.phase = 'play'; s.turn = 0; s.sub = 'roll'; s.turnNo = 1; s.devPlayed = false; updateLongest(s);
          log(s, `Kurulum bitti! İlk sıra ${nm(s, cur(s))}.`);
        } else { s.turn = s.order.indexOf(s.setupList[s.setupStep]); s.setupNeed = 'ev'; s.setupV = null }
        return s;
      }
      return s;
    }
    if (s.phase !== 'play') return s;

    /* 7: kart atma (sırası gelmeyenler de yapar) */
    if (a.type === 'discard' && s.sub === 'discard' && s.discard[me]) {
      const c = a.cards || {}; let n = 0;
      for (const r of RES) { const k = c[r] | 0; if (k < 0 || k > H[r]) return s; n += k }
      if (n !== s.discard[me]) return s;
      for (const r of RES) { H[r] -= c[r] | 0; s.bank[r] += c[r] | 0 }
      log(s, `${nm(s, me)} ${n} kart attı.`); delete s.discard[me];
      if (!Object.keys(s.discard).length) s.sub = 'robber';
      return s;
    }
    /* takas teklifine cevap */
    if (a.type === 'respond' && s.trade && me !== s.trade.from && s.sub === 'main') {
      if (a.ok && !canPay(H, s.trade.get)) return s;
      s.trade.resp[me] = a.ok ? 'yes' : 'no'; return s;
    }
    if (!myTurn) return s;

    if (a.type === 'roll' && s.sub === 'roll') {
      const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6), n = d1 + d2;
      s.dice = [d1, d2]; log(s, `🎲 ${nm(s, me)} zar attı: ${n}`);
      if (n === 7) {
        s.discard = {}; s.order.forEach(id => { const t = total(s.hands[id]); if (t > 7) s.discard[id] = Math.floor(t / 2) });
        if (Object.keys(s.discard).length) log(s, `7 geldi! ${Object.keys(s.discard).map(id => nm(s, id) + ' ' + s.discard[id]).join(', ')} kart atacak.`);
        s.sub = Object.keys(s.discard).length ? 'discard' : 'robber'; s.robberBack = 'main';
      } else { produce(s, n); s.sub = 'main' }
      return s;
    }
    if (a.type === 'robber' && s.sub === 'robber' && Number.isInteger(a.h) && HEX[a.h] && a.h !== s.robber) { moveRobber(s, a.h); checkWin(s); return s }
    if (a.type === 'steal' && s.sub === 'steal' && s.stealC.includes(a.id)) { stealFrom(s, a.id); return s }

    /* gelişim kartı oynama: zar öncesi ya da sonrası, turda 1 tane, bu tur alınan oynanamaz */
    if (a.type === 'play' && (s.sub === 'roll' || s.sub === 'main') && !s.devPlayed) {
      const i = s.dev[me].findIndex(c => c.k === a.k && c.t < s.turnNo);
      if (i < 0 || a.k === 'puan') return s;
      if (a.k === 'bereket') {
        const r1 = a.r1, r2 = a.r2; if (!RES.includes(r1) || !RES.includes(r2)) return s;
        const need = {}; need[r1] = (need[r1] || 0) + 1; need[r2] = (need[r2] || 0) + 1;
        if (Object.keys(need).some(r => s.bank[r] < need[r])) return s;
        for (const r in need) { s.bank[r] -= need[r]; H[r] += need[r] }
        log(s, `🎁 ${nm(s, me)} Bereket oynadı: ${G.RE[r1]} ${G.RE[r2]}.`);
      } else if (a.k === 'tekel') {
        if (!RES.includes(a.r)) return s; let n = 0;
        s.order.forEach(id => { if (id !== me) { n += s.hands[id][a.r]; s.hands[id][a.r] = 0 } }); H[a.r] += n;
        log(s, `💰 ${nm(s, me)} Tekel oynadı: herkesin ${G.RN[a.r]} kartları ona geçti (${n} kart).`);
      } else if (a.k === 'yol2') {
        if (s.sub !== 'main' && s.sub !== 'roll') return s;
        s.free = Math.min(2, LIMIT.yol - countB(s, me, 'yol')); s.freeBack = s.sub; s.sub = 'roads';
        log(s, `🛣️ ${nm(s, me)} Yol Yapımı oynadı.`);
        if (!s.free || !EDGE.some((e, j) => roadOK(s, me, j))) { s.sub = s.freeBack; s.free = 0 }
      } else if (a.k === 'yeniceri') {
        s.knights[me]++; log(s, `⚔️ ${nm(s, me)} Yeniçeri oynadı (${s.knights[me]}).`);
        updateArmy(s, me); s.robberBack = s.sub; s.sub = 'robber';
      }
      s.dev[me].splice(i, 1); s.devPlayed = true; checkWin(s); return s;
    }
    if (a.type === 'road' && s.sub === 'roads' && Number.isInteger(a.e) && EDGE[a.e] && roadOK(s, me, a.e)) {
      s.eb[a.e] = me; s.free--; updateLongest(s);
      if (s.free <= 0 || countB(s, me, 'yol') >= LIMIT.yol || !EDGE.some((e, j) => roadOK(s, me, j))) { s.sub = s.freeBack; s.free = 0 }
      checkWin(s); return s;
    }
    if (a.type === 'endfree' && s.sub === 'roads') { s.sub = s.freeBack; s.free = 0; return s }

    if (s.sub !== 'main') return s;
    /* inşa */
    if (a.type === 'build') {
      if (a.k === 'yol' && Number.isInteger(a.e) && EDGE[a.e] && canPay(H, COST.yol) && countB(s, me, 'yol') < LIMIT.yol && roadOK(s, me, a.e)) {
        pay(s, me, COST.yol); s.eb[a.e] = me; updateLongest(s);
      } else if (a.k === 'ev' && Number.isInteger(a.v) && VERT[a.v] && canPay(H, COST.ev) && countB(s, me, 'ev') < LIMIT.ev && distanceOK(s, a.v) && vertTouchesRoad(s, me, a.v)) {
        pay(s, me, COST.ev); s.vb[a.v] = { o: me, city: false }; log(s, `🏠 ${nm(s, me)} ev yaptı.`); updateLongest(s);
      } else if (a.k === 'konak' && s.vb[a.v] && s.vb[a.v].o === me && !s.vb[a.v].city && canPay(H, COST.konak) && countB(s, me, 'konak') < LIMIT.konak) {
        pay(s, me, COST.konak); s.vb[a.v].city = true; log(s, `🏰 ${nm(s, me)} evini konağa çevirdi.`);
      } else if (a.k === 'kart' && s.deck.length && canPay(H, COST.kart)) {
        pay(s, me, COST.kart); const k = s.deck.pop(); s.dev[me].push({ k, t: s.turnNo, n: k === 'puan' ? G.VP_NAMES[Math.floor(Math.random() * G.VP_NAMES.length)] : null });
        log(s, `🃏 ${nm(s, me)} fırsat kartı aldı.`);
      } else return s;
      s.trade = null; checkWin(s); return s;
    }
    /* banka/liman takası */
    if (a.type === 'bank' && RES.includes(a.give) && RES.includes(a.get) && a.give !== a.get) {
      const rate = rates(s, me)[a.give];
      if (H[a.give] < rate || s.bank[a.get] < 1) return s;
      H[a.give] -= rate; s.bank[a.give] += rate; H[a.get]++; s.bank[a.get]--;
      log(s, `⚓ ${nm(s, me)} ${rate} ${G.RE[a.give]} verip 1 ${G.RE[a.get]} aldı.`); s.trade = null; return s;
    }
    /* oyuncular arası takas */
    if (a.type === 'offer') {
      const give = {}, get = {}; let ng = 0, nr = 0;
      for (const r of RES) { const g = (a.give || {})[r] | 0, w = (a.get || {})[r] | 0; if (g < 0 || w < 0 || g > H[r]) return s; if (g) give[r] = g; if (w) get[r] = w; ng += g; nr += w; if (g && w) return s }
      if (!ng || !nr) return s;
      s.trade = { from: me, give, get, resp: {} }; log(s, `🤝 ${nm(s, me)} takas teklif etti.`); return s;
    }
    if (a.type === 'cancelTrade' && s.trade) { s.trade = null; return s }
    if (a.type === 'confirm' && s.trade && s.trade.resp[a.id] === 'yes') {
      const T = s.trade, O = s.hands[a.id];
      if (!canPay(H, T.give) || !canPay(O, T.get)) { s.trade.resp[a.id] = 'no'; return s }
      for (const r in T.give) { H[r] -= T.give[r]; O[r] += T.give[r] }
      for (const r in T.get) { O[r] -= T.get[r]; H[r] += T.get[r] }
      log(s, `🤝 ${nm(s, me)} ile ${nm(s, a.id)} takas yaptı: ${Object.entries(T.give).map(([r, n]) => n + G.RE[r]).join(' ')} ↔ ${Object.entries(T.get).map(([r, n]) => n + G.RE[r]).join(' ')}.`);
      s.trade = null; return s;
    }
    if (a.type === 'end') { nextTurn(s); return s }
    return s;
  }

  function view(s, pid) {
    const v = clone(s);
    if (!v.order) return v;
    v.vp = {}; v.cards = {}; v.devCount = {};
    for (const id of v.order) {
      v.vp[id] = vp(s, id, id === pid || s.phase === 'over');
      v.cards[id] = total(s.hands[id]); v.devCount[id] = s.dev[id].length;
      if (id !== pid) { v.hands[id] = null; if (s.phase !== 'over') v.dev[id] = null }
    }
    v.deckCount = s.deck.length; delete v.deck;
    if (v.order.includes(pid)) v.rates = rates(s, pid);
    if (v.lastSteal && v.lastSteal.by !== pid && v.lastSteal.from !== pid) v.lastSteal = null;
    return v;
  }
  return { create, act, view, vp, longestFor, rates, roadOK, distanceOK, vertTouchesRoad, countB, canPay, total, LIMIT, WIN };
})();
if (typeof module !== 'undefined') module.exports = YediTepe;
