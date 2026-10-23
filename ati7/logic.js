/* Ati7 oyun mantığı (Flip 7 kuralları). Sadece ev sahibinde çalışır; saf durum dönüşümü.
   Kartlar: 'n0'..'n12' sayı, 'p2' 'p4' 'p6' 'p8' 'p10' artı, 'x2' çarpan, 'FR' Dondur, 'F3' Üç Çek, 'SC' İkinci Şans */
const Ati7 = (() => {
  const GOAL = 200, BONUS = 15;
  const NAMES = { FR: 'Dondur', F3: 'Üç Çek', SC: 'İkinci Şans', x2: 'x2' };
  function cardName(c) { return c[0] === 'n' ? c.slice(1) : c[0] === 'p' ? '+' + c.slice(1) : NAMES[c] }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
  function makeDeck() {
    const d = ['n0'];
    for (let v = 1; v <= 12; v++) for (let k = 0; k < v; k++) d.push('n' + v);
    d.push('p2', 'p4', 'p6', 'p8', 'p10', 'x2');
    for (let k = 0; k < 3; k++) d.push('FR', 'F3', 'SC');
    return shuffle(d);
  }
  const clone = s => JSON.parse(JSON.stringify(s));
  const P = (s, id) => s.players.find(p => p.id === id);
  const nameOf = (s, id) => (P(s, id) || {}).name || '?';
  const active = (s, id) => s.hands[id] && s.hands[id].status === 'active';
  const activeIds = s => s.order.filter(id => active(s, id));
  function log(s, msg) { s.log.push(msg); if (s.log.length > 40) s.log.shift() }

  function score(h) {
    if (h.status === 'bust') return 0;
    let n = h.nums.reduce((a, c) => a + +c.slice(1), 0);
    if (h.mods.includes('x2')) n *= 2;
    n += h.mods.filter(c => c[0] === 'p').reduce((a, c) => a + +c.slice(1), 0);
    if (h.status === 'flip7') n += BONUS;
    return n;
  }

  function create(hostId, hostName) {
    return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], log: [], round: 0, dealer: -1 };
  }

  function draw(s) {
    if (!s.deck.length) {
      if (!s.discard.length) return null;
      s.deck = shuffle(s.discard); s.discard = [];
      log(s, 'Deste bitti, atılan kartlar karıştırıldı.');
    }
    return s.deck.pop();
  }

  function startRound(s) {
    s.round++;
    s.order = s.players.map(p => p.id);
    s.dealer = (s.dealer + 1) % s.order.length;
    const n = s.order.length;
    s.dealOrder = Array.from({ length: n }, (_, i) => s.order[(s.dealer + 1 + i) % n]);
    s.hands = {};
    for (const id of s.order) s.hands[id] = { nums: [], mods: [], sc: false, status: 'active', last: null };
    s.phase = 'play'; s.pending = null; s.turn = null;
    s.stack = [{ k: 'deal', i: 0 }];
    s.lastRound = null;
    log(s, `${s.round}. el başladı. Kartları ${nameOf(s, s.order[s.dealer])} dağıtıyor.`);
    run(s);
  }

  function endRound(s, why) {
    for (const t of s.stack) { if (t.k === 'choose') s.discard.push(t.card); if (t.k === 'f3') s.discard.push(...t.deferred) }
    if (s.pending) s.discard.push(s.pending.card);
    s.stack = []; s.pending = null;
    const res = {};
    for (const id of s.order) { const h = s.hands[id]; res[id] = score(h); P(s, id).score += res[id] }
    s.lastRound = { res, why };
    for (const id of s.order) { const h = s.hands[id]; s.discard.push(...h.nums, ...h.mods); if (h.sc) s.discard.push('SC') }
    const top = Math.max(...s.players.map(p => p.score));
    if (top >= GOAL) { s.phase = 'over'; s.winners = s.players.filter(p => p.score === top).map(p => p.id); log(s, 'Oyun bitti!') }
    else s.phase = 'roundEnd';
  }

  /* bir kartı oyuncuya ver; f3 = Üç Çek sırasında mı */
  function give(s, id, card, f3frame) {
    const h = s.hands[id]; h.last = card;
    if (card[0] === 'n') {
      if (h.nums.includes(card)) {
        if (h.sc) {
          h.sc = false; s.discard.push(card, 'SC');
          log(s, `${nameOf(s, id)} ${cardName(card)} tekrarını İkinci Şans ile kurtardı.`);
        } else {
          h.nums.push(card); h.status = 'bust';
          log(s, `${nameOf(s, id)} ikinci ${cardName(card)} çekti ve PATLADI.`);
        }
        return;
      }
      h.nums.push(card);
      log(s, `${nameOf(s, id)} ${cardName(card)} çekti.`);
      if (h.nums.length === 7) { h.status = 'flip7'; log(s, `${nameOf(s, id)} 7 farklı sayı topladı: ATI7! (+${BONUS})`); s.ati7 = id }
      return;
    }
    if (card[0] === 'p' || card === 'x2') { h.mods.push(card); log(s, `${nameOf(s, id)} ${cardName(card)} çekti.`); return }
    if (card === 'SC') {
      if (!h.sc) { h.sc = true; log(s, `${nameOf(s, id)} İkinci Şans aldı.`); return }
      const t = activeIds(s).filter(x => x !== id && !s.hands[x].sc);
      if (!t.length) { s.discard.push('SC'); log(s, `${nameOf(s, id)} fazladan İkinci Şans çekti, verecek kimse yok, atıldı.`); return }
      s.stack.push({ k: 'choose', by: id, card });
      return;
    }
    // FR / F3
    log(s, `${nameOf(s, id)} ${cardName(card)} çekti.`);
    if (f3frame && f3frame.p === id) { f3frame.deferred.push(card); return }
    s.stack.push({ k: 'choose', by: id, card });
  }

  function targetsFor(s, by, card) {
    if (card === 'SC') return activeIds(s).filter(x => x !== by && !s.hands[x].sc);
    return activeIds(s);
  }

  function applyAction(s, by, card, target) {
    if (card === 'SC') { s.hands[target].sc = true; log(s, `${nameOf(s, by)} İkinci Şans'ı ${nameOf(s, target)}'a verdi.`); return }
    if (card === 'FR') {
      s.hands[target].status = 'frozen'; s.discard.push('FR');
      log(s, `${nameOf(s, by)} ${by === target ? 'kendini' : nameOf(s, target) + "'ı"} dondurdu. Puanını bankaladı.`);
      return;
    }
    if (card === 'F3') {
      s.discard.push('F3');
      log(s, `${nameOf(s, by)} ${by === target ? 'kendine' : nameOf(s, target) + "'a"} Üç Çek uyguladı.`);
      s.stack.push({ k: 'f3', p: target, left: 3, deferred: [] });
    }
  }

  /* yığını çalıştır; seçim gerekirse durur */
  function run(s) {
    let guard = 0;
    while (guard++ < 500) {
      if (s.ati7) { s.ati7 = null; return endRound(s, 'ati7') }
      if (s.phase !== 'play') return;
      if (!activeIds(s).length) return endRound(s, 'done');
      const t = s.stack.pop();
      if (!t) {
        // sıra bekleniyor
        if (s.turn == null || !active(s, s.turn)) nextTurn(s);
        return;
      }
      if (t.k === 'deal') {
        if (t.i >= s.dealOrder.length) { s.turn = null; s.turnFrom = -1; continue }
        s.stack.push({ k: 'deal', i: t.i + 1 });
        const id = s.dealOrder[t.i];
        if (!active(s, id)) continue;
        const c = draw(s); if (!c) return endRound(s, 'deck');
        give(s, id, c, null);
        continue;
      }
      if (t.k === 'draw') {
        if (!active(s, t.p)) continue;
        const c = draw(s); if (!c) return endRound(s, 'deck');
        const fr = t.f3 ? s.stack[s.stack.length - 1] : null;
        give(s, t.p, c, fr && fr.k === 'f3' ? fr : null);
        continue;
      }
      if (t.k === 'f3') {
        if (!active(s, t.p) || t.left <= 0) {
          if (active(s, t.p)) for (let i = t.deferred.length - 1; i >= 0; i--) s.stack.push({ k: 'choose', by: t.p, card: t.deferred[i] });
          else s.discard.push(...t.deferred);
          continue;
        }
        t.left--; s.stack.push(t); s.stack.push({ k: 'draw', p: t.p, f3: true });
        continue;
      }
      if (t.k === 'choose') {
        if (!active(s, t.by)) { s.discard.push(t.card); continue }
        const ts = targetsFor(s, t.by, t.card);
        if (!ts.length) { s.discard.push(t.card); continue }
        if (ts.length === 1) { applyAction(s, t.by, t.card, ts[0]); continue }
        s.pending = { by: t.by, card: t.card, targets: ts };
        return;
      }
      if (t.k === 'endTurn') { nextTurn(s, true); continue }
    }
  }

  function nextTurn(s, advance) {
    const ids = s.dealOrder;
    let start = s.turn == null ? -1 : ids.indexOf(s.turn);
    if (!advance && s.turn != null && active(s, s.turn)) return;
    for (let k = 1; k <= ids.length; k++) {
      const id = ids[(start + k + ids.length) % ids.length];
      if (active(s, id)) { s.turn = id; return }
    }
    s.turn = null;
  }

  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (s.players.length < 2) return s;
      if (s.phase === 'over') { s.players.forEach(p => p.score = 0); s.round = 0 }
      s.deck = makeDeck(); s.discard = []; s.log = [];
      startRound(s); return s;
    }
    if (a.type === 'next' && isHost && s.phase === 'roundEnd') { startRound(s); return s }
    if (a.type === 'kick' && isHost && s.phase === 'lobby') { s.players = s.players.filter(p => p.id !== a.id || p.id === s.hostId); return s }
    if (s.phase !== 'play') return s;
    /* bağlantısı kopan oyuncu sırayı kilitlemesin: ev sahibi onun yerine geçebilir */
    if (a.type === 'skip' && isHost) {
      if (s.pending && !(P(s, s.pending.by) || {}).online) {
        const { by, card, targets } = s.pending; s.pending = null;
        applyAction(s, by, card, targets[Math.floor(Math.random() * targets.length)]); run(s);
      } else if (!s.pending && !s.stack.length && s.turn && !(P(s, s.turn) || {}).online) {
        s.hands[s.turn].status = 'stayed';
        log(s, `${nameOf(s, s.turn)} bağlantısı koptuğu için durduruldu (${score(s.hands[s.turn])} puan).`);
        s.stack.push({ k: 'endTurn' }); run(s);
      }
      return s;
    }
    if (s.pending) {
      if (a.type === 'target' && pid === s.pending.by && s.pending.targets.includes(a.id)) {
        const { by, card } = s.pending; s.pending = null;
        applyAction(s, by, card, a.id);
        run(s);
      }
      return s;
    }
    if (pid !== s.turn || s.stack.length) return s;
    if (a.type === 'hit') { s.stack.push({ k: 'endTurn' }, { k: 'draw', p: pid }); run(s) }
    else if (a.type === 'stay') {
      s.hands[pid].status = 'stayed';
      log(s, `${nameOf(s, pid)} durdu ve ${score(s.hands[pid])} puanı bankaladı.`);
      s.stack.push({ k: 'endTurn' }); run(s);
    }
    return s;
  }

  function view(s, pid) {
    const v = clone(s);
    v.deckCount = s.deck ? s.deck.length : 0;
    delete v.deck; delete v.stack;
    if (v.hands) for (const id in v.hands) v.hands[id].pts = score(v.hands[id]);
    return v;
  }

  return { create, act, view, score, cardName, makeDeck, GOAL, BONUS, _run: run };
})();
if (typeof module !== 'undefined') module.exports = Ati7;
