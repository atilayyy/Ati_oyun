/* Keşif Seferi — Lost Cities kurallarıyla 2 kişilik kart oyunu.
   5 sefer rengi, her renkte 3 yatırım kartı + 2..10 sayılar (60 kart). Elde 8 kart.
   Sıran gelince: bir kartı kendi seferine koy (artan sırayla; yatırımlar sadece sayılardan önce) ya da o rengin atık yığınına at.
   Sonra desteden ya da bir atık yığınının üstünden 1 kart çek (bu tur attığın kartı geri alamazsın). Deste bitince el biter.
   Sefer puanı: (sayıların toplamı - 20) x (1 + yatırım sayısı); seferde 8+ kart varsa +20. Başlanmamış sefer 0. */
const Kesif = (() => {
  const COLS = ['a', 'b', 'c', 'd', 'e'];
  const CN = { a: 'Çöl', b: 'Himalaya', c: 'Okyanus', d: 'Amazon', e: 'Volkan' };
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const col = c => c[0], val = c => parseInt(c.slice(1), 10);
  const P = (s, id) => s.players.find(p => p.id === id);
  const nm = (s, id) => (P(s, id) || {}).name || '?';
  const sortHand = h => h.sort((x, y) => COLS.indexOf(col(x)) - COLS.indexOf(col(y)) || val(x) - val(y) || x.localeCompare(y));
  function deck() { const d = []; for (const c of COLS) { d.push(c + '0x', c + '0y', c + '0z'); for (let v = 2; v <= 10; v++) d.push(c + v) } return shuffle(d) }
  function canPlay(list, card) {
    const v = val(card), nums = list.filter(x => val(x) > 0);
    if (v === 0) return nums.length === 0;
    return !nums.length || v > Math.max(...nums.map(val));
  }
  function expScore(list) {
    if (!list.length) return 0;
    const w = list.filter(x => val(x) === 0).length, sum = list.reduce((a, x) => a + val(x), 0);
    return (sum - 20) * (1 + w) + (list.length >= 8 ? 20 : 0);
  }
  const total = ex => COLS.reduce((a, c) => a + expScore(ex[c]), 0);
  function log(s, m) { s.log.push(m); if (s.log.length > 30) s.log.shift() }

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], rounds: 3, log: [] } }
  function startRound(s) {
    s.round++; s.deck = deck(); s.hands = {}; s.exp = {}; s.disc = {}; COLS.forEach(c => s.disc[c] = []);
    for (const p of s.players) { s.hands[p.id] = sortHand(s.deck.splice(0, 8)); s.exp[p.id] = {}; COLS.forEach(c => s.exp[p.id][c] = []) }
    s.turn = s.players[(s.round - 1) % 2].id; s.step = 'play'; s.lastDisc = null; s.last = null; s.phase = 'play';
    log(s, `${s.round}. el başladı. İlk sıra ${nm(s, s.turn)}.`);
  }
  function endRound(s) {
    s.roundRes = {};
    for (const p of s.players) { const t = total(s.exp[p.id]); s.roundRes[p.id] = t; p.score += t }
    s.history.push(s.roundRes);
    if (s.round >= s.rounds) {
      const best = Math.max(...s.players.map(p => p.score));
      s.winners = s.players.filter(p => p.score === best).map(p => p.id); s.phase = 'over';
      s.players.forEach(p => { if (s.winners.includes(p.id)) p.wins = (p.wins || 0) + 1 });
    } else s.phase = 'roundEnd';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (a.type === 'rounds' && isHost && (s.phase === 'lobby' || s.phase === 'over') && [1, 3].includes(a.n)) { s.rounds = a.n; return s }
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over') && s.players.length === 2) {
      s.players.forEach(p => p.score = 0); s.round = 0; s.history = []; s.winners = null; s.log = [];
      startRound(s); return s;
    }
    if (a.type === 'next' && isHost && s.phase === 'roundEnd') { startRound(s); return s }
    if (s.phase !== 'play' || pid !== s.turn) return s;
    const H = s.hands[pid];
    if (a.type === 'play' && s.step === 'play' && H.includes(a.card)) {
      const c = col(a.card);
      if (a.to === 'exp') {
        if (!canPlay(s.exp[pid][c], a.card)) return s;
        s.exp[pid][c].push(a.card); s.lastDisc = null;
        log(s, `${nm(s, pid)} ${CN[c]} seferine ${val(a.card) ? val(a.card) : 'yatırım'} koydu.`);
      } else if (a.to === 'disc') {
        s.disc[c].push(a.card); s.lastDisc = c;
        log(s, `${nm(s, pid)} ${CN[c]} ${val(a.card) ? val(a.card) : 'yatırım'} kartını attı.`);
      } else return s;
      H.splice(H.indexOf(a.card), 1); s.step = 'draw'; s.last = { by: pid, card: a.card, to: a.to };
      return s;
    }
    if (a.type === 'draw' && s.step === 'draw') {
      let card;
      if (a.from === 'deck') { if (!s.deck.length) return s; card = s.deck.pop() }
      else if (COLS.includes(a.from) && s.disc[a.from].length && a.from !== s.lastDisc) { card = s.disc[a.from].pop(); log(s, `${nm(s, pid)} ${CN[a.from]} yığınından ${val(card) ? val(card) : 'yatırım'} aldı.`) }
      else return s;
      H.push(card); sortHand(H); s.drew = { by: pid, card: a.from === 'deck' ? null : card };
      if (!s.deck.length) { log(s, 'Deste bitti, el sona erdi.'); endRound(s); return s }
      s.turn = s.players.find(p => p.id !== pid).id; s.step = 'play'; s.lastDisc = null;
      return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.hands) { v.handCount = {}; for (const id in s.hands) { v.handCount[id] = s.hands[id].length; if (id !== pid && s.phase === 'play') v.hands[id] = null } }
    if (v.deck) { v.deckCount = s.deck.length; delete v.deck }
    return v;
  }
  return { create, act, view, canPlay, expScore, total, COLS, CN, col, val };
})();
if (typeof module !== 'undefined') module.exports = Kesif;
