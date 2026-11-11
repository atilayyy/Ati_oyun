/* Ati7 oyun mantığı (Flip 7 kuralları). Sadece ev sahibinde çalışır; saf durum dönüşümü.
   Kartlar: 'n0'..'n12' sayı, 'p2' 'p4' 'p6' 'p8' 'p10' artı, 'x2' çarpan, 'FR' Dondur, 'F3' Üç Çek, 'SC' İkinci Şans */
const Ati7 = (() => {
  const EK = typeof ek !== 'undefined' ? ek : require('../assets/ek.js');
  const GOAL = 200, BONUS = 15;
  const NAMES = { FR: 'Dondur', F3: 'Üç Çek', SC: 'İkinci Şans', x2: 'x2',
    U7: 'Uğursuz 7', L13: 'Şanslı 13', d2: '÷2', J1: 'Bir Daha!', F4: 'Dört Çek!', SW: 'Takas', ST: 'Çal', DC: 'Çöpe At' };
  function cardName(c) { return c[0] === 'n' ? c.slice(1) : c[0] === 'p' ? '+' + c.slice(1) : c[0] === 'm' ? '−' + c.slice(1) : NAMES[c] }
  /* Acımasız mod kartları: 'n0'..'n13', 'U7' Uğursuz 7, 'L13' Şanslı 13, 'm2'..'m10' eksi, 'd2' ikiye böl,
     'J1' Bir Daha!, 'F4' Dört Çek!, 'SW' Takas, 'ST' Çal, 'DC' Çöpe At */
  const isNum = c => c[0] === 'n' || c === 'U7' || c === 'L13';
  const isModV = c => c[0] === 'm' || c === 'd2';
  const val = c => c === 'U7' ? 7 : c === 'L13' ? 13 : +c.slice(1);
  function isBust(nums) {
    const cnt = {}; for (const c of nums) cnt[val(c)] = (cnt[val(c)] || 0) + 1;
    for (const v in cnt) if (cnt[v] > 1 && !(+v === 13 && cnt[v] === 2 && nums.includes('L13'))) return true;
    return false;
  }
  function makeDeckV() {
    const d = ['n0'];
    for (let v = 1; v <= 13; v++) for (let k = 0; k < v; k++) d.push(v === 7 && k === 0 ? 'U7' : v === 13 && k === 0 ? 'L13' : 'n' + v);
    d.push('m2', 'm4', 'm6', 'm8', 'm10', 'd2');
    for (let k = 0; k < 2; k++) d.push('J1', 'F4', 'SW', 'ST', 'DC');
    return shuffle(d);
  }
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

  function scoreV(h) {
    if (h.status === 'bust') return 0;
    let n = h.nums.reduce((a, c) => a + val(c), 0);
    if (h.mods.includes('d2')) n = Math.floor(n / 2);
    n -= h.mods.filter(c => c[0] === 'm').reduce((a, c) => a + +c.slice(1), 0);
    n = Math.max(0, n);
    if (h.status === 'flip7') n += BONUS; else if (h.nums.includes('n0')) n = 0;
    return n;
  }
  function score(h, mode) {
    if (mode === 'v') return scoreV(h);
    if (h.status === 'bust') return 0;
    let n = h.nums.reduce((a, c) => a + +c.slice(1), 0);
    if (h.mods.includes('x2')) n *= 2;
    n += h.mods.filter(c => c[0] === 'p').reduce((a, c) => a + +c.slice(1), 0);
    if (h.status === 'flip7') n += BONUS;
    return n;
  }

  function create(hostId, hostName) {
    return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], log: [], round: 0, dealer: -1, mode: 'k' };
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
    for (const id of s.order) { const h = s.hands[id]; res[id] = score(h, s.mode); P(s, id).score += res[id] }
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

  /* ---- Acımasız mod ---- */
  function checkF7(s, id) {
    const h = s.hands[id];
    if (h.status !== 'bust' && h.nums.length >= 7 && !s.ati7) { h.status = 'flip7'; log(s, `${nameOf(s, id)} 7 sayı topladı: ATI7! (+${BONUS})`); s.ati7 = id }
  }
  function giveV(s, id, card, fr) {
    const h = s.hands[id], nm = nameOf(s, id); h.last = card;
    if (isNum(card)) {
      if (card === 'U7') {
        const lost = [...h.nums, ...h.mods]; s.discard.push(...lost); h.nums = ['U7']; h.mods = [];
        log(s, `${nm} Uğursuz 7 çekti${lost.length ? `, diğer ${lost.length} kartı çöpe gitti` : ''}.`);
        return;
      }
      h.nums.push(card);
      if (isBust(h.nums)) { h.status = 'bust'; log(s, `${nm} ikinci ${val(card)} çekti ve PATLADI.`); return }
      log(s, card === 'n0' ? `${nm} Sıfır çekti: Ati7 yapmazsa bu el 0 puan, durmak da yok.` : `${nm} ${cardName(card)} çekti.`);
      checkF7(s, id); return;
    }
    log(s, `${nm} ${cardName(card)} çekti.`);
    if (fr && fr.p === id) { fr.deferred.push(card); return }
    s.stack.push({ k: 'choose', by: id, card });
  }
  const hasCards = (s, x) => s.hands[x].nums.length + s.hands[x].mods.length > 0;
  function targetsV(s, by, card) {
    const nb = s.order.filter(x => s.hands[x].status !== 'bust');
    if (isModV(card) || card === 'J1' || card === 'F4') return nb.length ? { kind: 'target', targets: nb } : null;
    if (card === 'ST') { const t = nb.filter(x => x !== by && hasCards(s, x)); return t.length ? { kind: 'card', from: t } : null }
    if (card === 'DC') { const t = nb.filter(x => hasCards(s, x)); return t.length ? { kind: 'card', from: t } : null }
    if (card === 'SW') { const t = nb.filter(x => hasCards(s, x)); return t.length >= 2 ? { kind: 'swap', from: t } : null }
    return null;
  }
  function takeCard(s, id, i) { const h = s.hands[id]; return i < h.nums.length ? h.nums.splice(i, 1)[0] : h.mods.splice(i - h.nums.length, 1)[0] }
  function putCard(s, id, c) { (isNum(c) ? s.hands[id].nums : s.hands[id].mods).push(c) }
  function afterMove(s, ids) {
    for (const id of ids) {
      const h = s.hands[id];
      if (h.status !== 'bust' && isBust(h.nums)) { h.status = 'bust'; log(s, `${nameOf(s, id)} aynı sayıdan iki tane oldu ve PATLADI.`) }
      checkF7(s, id);
    }
  }
  function validPicks(s, P, picks) {
    if (!Array.isArray(picks) || picks.length !== (P.kind === 'swap' ? 2 : 1)) return false;
    for (const x of picks) {
      if (!x || !P.from.includes(x.id) || !Number.isInteger(x.i)) return false;
      const h = s.hands[x.id]; if (x.i < 0 || x.i >= h.nums.length + h.mods.length) return false;
    }
    return picks.length === 1 || picks[0].id !== picks[1].id;
  }
  function applyV(s, by, card, sel) {
    const B = nameOf(s, by), who = id => id === by ? 'kendine' : EK(nameOf(s, id), 'e');
    if (isModV(card)) { s.hands[sel.id].mods.push(card); log(s, `${B} ${cardName(card)} kartını ${who(sel.id)} verdi.`); return }
    s.discard.push(card);
    if (card === 'J1') { log(s, `${B} ${who(sel.id)} Bir Daha! uyguladı: bir kart çekip duracak.`); s.stack.push({ k: 'j1end', p: sel.id }, { k: 'draw', p: sel.id }); return }
    if (card === 'F4') { log(s, `${B} ${who(sel.id)} Dört Çek! uyguladı.`); s.stack.push({ k: 'f3', p: sel.id, left: 4, deferred: [] }); return }
    const [x, y] = sel.picks;
    if (card === 'DC') { const c = takeCard(s, x.id, x.i); s.discard.push(c); log(s, `${B}, ${EK(nameOf(s, x.id), 'in')} ${cardName(c)} kartını çöpe attı.`); return }
    if (card === 'ST') { const c = takeCard(s, x.id, x.i); putCard(s, by, c); log(s, `${B}, ${EK(nameOf(s, x.id), 'in')} ${cardName(c)} kartını çaldı.`); afterMove(s, [by]); return }
    if (card === 'SW') {
      const h1 = s.hands[x.id], h2 = s.hands[y.id];
      const c1 = x.i < h1.nums.length ? h1.nums[x.i] : h1.mods[x.i - h1.nums.length];
      const c2 = y.i < h2.nums.length ? h2.nums[y.i] : h2.mods[y.i - h2.nums.length];
      takeCard(s, x.id, x.i); takeCard(s, y.id, y.i); putCard(s, x.id, c2); putCard(s, y.id, c1);
      log(s, `${B} takas yaptı: ${EK(nameOf(s, x.id), 'in')} ${cardName(c1)} ↔ ${EK(nameOf(s, y.id), 'in')} ${cardName(c2)}.`);
      afterMove(s, [x.id, y.id]);
    }
  }

  function targetsFor(s, by, card) {
    if (card === 'SC') return activeIds(s).filter(x => x !== by && !s.hands[x].sc);
    return activeIds(s);
  }

  function applyAction(s, by, card, target) {
    if (card === 'SC') { s.hands[target].sc = true; log(s, `${nameOf(s, by)} İkinci Şans'ı ${EK(nameOf(s, target), 'e')} verdi.`); return }
    if (card === 'FR') {
      s.hands[target].status = 'frozen'; s.discard.push('FR');
      log(s, `${nameOf(s, by)} ${by === target ? 'kendini' : EK(nameOf(s, target), 'i')} dondurdu. Puanını bankaladı.`);
      return;
    }
    if (card === 'F3') {
      s.discard.push('F3');
      log(s, `${nameOf(s, by)} ${by === target ? 'kendine' : EK(nameOf(s, target), 'e')} Üç Çek uyguladı.`);
      s.stack.push({ k: 'f3', p: target, left: 3, deferred: [] });
    }
  }

  /* yığını çalıştır; seçim gerekirse durur */
  function run(s) {
    let guard = 0;
    while (guard++ < 500) {
      if (s.ati7) { s.ati7 = null; return endRound(s, 'ati7') }
      if (s.phase !== 'play') return;
      const V = s.mode === 'v';
      if (!activeIds(s).length && !(V && s.stack.length)) return endRound(s, 'done');
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
        (V ? giveV : give)(s, id, c, null);
        continue;
      }
      if (t.k === 'draw') {
        if (V ? s.hands[t.p].status === 'bust' : !active(s, t.p)) continue;
        const c = draw(s); if (!c) return endRound(s, 'deck');
        const fr = t.f3 ? s.stack[s.stack.length - 1] : null;
        (V ? giveV : give)(s, t.p, c, fr && fr.k === 'f3' ? fr : null);
        continue;
      }
      if (t.k === 'f3') {
        const ok = V ? s.hands[t.p].status !== 'bust' : active(s, t.p);
        if (!ok || t.left <= 0) {
          if (ok) for (let i = t.deferred.length - 1; i >= 0; i--) s.stack.push({ k: 'choose', by: t.p, card: t.deferred[i] });
          else s.discard.push(...t.deferred);
          continue;
        }
        t.left--; s.stack.push(t); s.stack.push({ k: 'draw', p: t.p, f3: true });
        continue;
      }
      if (t.k === 'j1end') {
        const h = s.hands[t.p];
        if (h.status === 'active') { h.status = 'stayed'; log(s, `${nameOf(s, t.p)} durmak zorunda kaldı (${score(h, s.mode)} puan).`) }
        continue;
      }
      if (t.k === 'choose' && V) {
        if (s.hands[t.by].status === 'bust') { s.discard.push(t.card); continue }
        const r = targetsV(s, t.by, t.card);
        if (!r) { s.discard.push(t.card); log(s, `${cardName(t.card)} için uygun hedef yok, kart atıldı.`); continue }
        if (r.kind === 'target' && r.targets.length === 1) { applyV(s, t.by, t.card, { id: r.targets[0] }); continue }
        s.pending = Object.assign({ by: t.by, card: t.card }, r);
        return;
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
    if (a.type === 'mode' && isHost && (s.phase === 'lobby' || s.phase === 'over')) { s.mode = a.m === 'v' ? 'v' : 'k'; return s }
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (s.players.length < 2) return s;
      if (s.phase === 'over') { s.players.forEach(p => p.score = 0); s.round = 0 }
      s.deck = s.mode === 'v' ? makeDeckV() : makeDeck(); s.discard = []; s.log = [];
      startRound(s); return s;
    }
    if (a.type === 'next' && isHost && s.phase === 'roundEnd') { startRound(s); return s }
    if (a.type === 'kick' && isHost && s.phase === 'lobby') { s.players = s.players.filter(p => p.id !== a.id || p.id === s.hostId); return s }
    if (s.phase !== 'play') return s;
    if (s.pending) {
      const Pn = s.pending; if (pid !== Pn.by) return s;
      if (a.type === 'target' && Pn.targets && Pn.targets.includes(a.id)) {
        s.pending = null;
        if (s.mode === 'v') applyV(s, Pn.by, Pn.card, { id: a.id }); else applyAction(s, Pn.by, Pn.card, a.id);
        run(s);
      } else if (a.type === 'pick' && s.mode === 'v' && Pn.from && validPicks(s, Pn, a.picks)) {
        s.pending = null; applyV(s, Pn.by, Pn.card, { picks: a.picks.map(x => ({ id: x.id, i: x.i })) }); run(s);
      }
      return s;
    }
    if (pid !== s.turn || s.stack.length) return s;
    if (a.type === 'hit') { s.stack.push({ k: 'endTurn' }, { k: 'draw', p: pid }); run(s) }
    else if (a.type === 'stay') {
      if (s.mode === 'v' && s.hands[pid].nums.includes('n0')) return s;
      s.hands[pid].status = 'stayed';
      log(s, `${nameOf(s, pid)} durdu ve ${score(s.hands[pid], s.mode)} puanı bankaladı.`);
      s.stack.push({ k: 'endTurn' }); run(s);
    }
    return s;
  }

  function view(s, pid) {
    const v = clone(s);
    v.deckCount = s.deck ? s.deck.length : 0;
    delete v.deck; delete v.stack;
    if (v.hands) for (const id in v.hands) v.hands[id].pts = score(v.hands[id], s.mode);
    return v;
  }

  return { create, act, view, score, cardName, makeDeck, makeDeckV, isBust, GOAL, BONUS, _run: run };
})();
if (typeof module !== 'undefined') module.exports = Ati7;
