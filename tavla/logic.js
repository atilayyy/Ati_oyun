/* Tavla — 2 kişi. Klasik kurallar: 15 pul, kırık pul önce girer, çift zar 4 hamle,
   iki zar da oynanabiliyorsa ikisi de oynanmak zorunda, sadece biri oynanabiliyorsa büyüğü.
   Tüm pullar evdeyken toplanır. Kazanan 1 puan, rakip hiç pul toplamadıysa mars: 2 puan.
   Tahta: 0..23. Oyuncu 0 (beyaz) 23→0 yönünde gider, evi 0-5. Oyuncu 1 (siyah) 0→23, evi 18-23.
   board[i] > 0 beyaz pul sayısı, < 0 siyah pul sayısı. */
const Tavla = (() => {
  const clone = s => JSON.parse(JSON.stringify(s));
  const P = (s, id) => s.players.find(p => p.id === id);
  const nm = (s, id) => (P(s, id) || {}).name || '?';
  function initBoard() {
    const b = Array(24).fill(0);
    b[23] = 2; b[12] = 5; b[7] = 3; b[5] = 5;
    b[0] = -2; b[11] = -5; b[16] = -3; b[18] = -5;
    return b;
  }
  const sign = c => c === 0 ? 1 : -1;
  const mine = (b, i, c) => b[i] * sign(c) > 0;
  const blocked = (b, i, c) => b[i] * sign(c) <= -2;
  function allHome(g, c) {
    if (g.bar[c]) return false;
    for (let i = 0; i < 24; i++) if (mine(g.board, i, c) && (c === 0 ? i > 5 : i < 18)) return false;
    return true;
  }
  // tek bir zarla yapılabilecek hamleler
  function stepMoves(g, c, d) {
    const b = g.board, out = [];
    if (g.bar[c]) {
      const to = c === 0 ? 24 - d : d - 1;
      if (!blocked(b, to, c)) out.push({ from: 'bar', to, d });
      return out;
    }
    const home = allHome(g, c);
    for (let i = 0; i < 24; i++) {
      if (!mine(b, i, c)) continue;
      const to = c === 0 ? i - d : i + d;
      if (to >= 0 && to <= 23) { if (!blocked(b, to, c)) out.push({ from: i, to, d }); continue }
      if (!home) continue;
      // toplama: tam zar ya da daha yüksek noktada pul yoksa büyük zarla
      const exact = c === 0 ? to === -1 : to === 24;
      let higher = false;
      if (!exact) { if (c === 0) { for (let k = i + 1; k <= 5; k++) if (mine(b, k, c)) higher = true } else { for (let k = 18; k < i; k++) if (mine(b, k, c)) higher = true } }
      if (exact || !higher) out.push({ from: i, to: 'off', d });
    }
    return out;
  }
  function apply(g, c, m) {
    const b = g.board, sg = sign(c);
    if (m.from === 'bar') g.bar[c]--; else b[m.from] -= sg;
    let hit = false;
    if (m.to === 'off') g.off[c]++;
    else {
      if (b[m.to] * sg === -1) { b[m.to] = 0; g.bar[1 - c]++; hit = true }
      b[m.to] += sg;
    }
    const i = g.dice.indexOf(m.d); g.dice.splice(i, 1);
    return hit;
  }
  // bütün zar sıralarını dene; en çok zar kullanan diziler geçerli. Tek zar oynanabiliyorsa büyüğü.
  function legal(g, c) {
    let best = 0; const seqs = [];
    const uniq = [...new Set(g.dice)];
    const start = { board: g.board.slice(), bar: g.bar.slice(), off: g.off.slice(), dice: g.dice.slice() };
    // büyük zar kuralı için ilk adımın zarını da sakla
    const rec2 = (st, used, first, dUsed) => {
      let any = false;
      for (const d of [...new Set(st.dice)]) for (const m of stepMoves(st, c, d)) {
        any = true;
        const nx = { board: st.board.slice(), bar: st.bar.slice(), off: st.off.slice(), dice: st.dice.slice() };
        apply(nx, c, m); rec2(nx, used + 1, first || m, dUsed.concat(d));
      }
      if (!any) { best = Math.max(best, used); if (first) seqs.push({ first, used, dUsed }) }
    };
    rec2(start, 0, null, []);
    let ok = seqs.filter(q => q.used === best);
    // sadece bir zar oynanabiliyorsa (ve zarlar farklıysa) büyük olan oynanmalı
    if (best === 1 && uniq.length === 2) {
      const mx = Math.max(...ok.map(q => q.dUsed[0]));
      ok = ok.filter(q => q.dUsed[0] === mx);
    }
    const key = m => m.from + '>' + m.to + ':' + m.d, seen = new Set(), res = [];
    for (const q of ok) { const k = key(q.first); if (!seen.has(k)) { seen.add(k); res.push(q.first) } }
    return res;
  }

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], target: 5, log: [] } }
  function log(s, m) { s.log.push(m); if (s.log.length > 30) s.log.shift() }
  function newGame(s) {
    s.g = { board: initBoard(), bar: [0, 0], off: [0, 0], dice: [] };
    // açılış: herkes bir zar atar, büyük atan o iki zarla başlar
    let a, b; do { a = 1 + Math.floor(Math.random() * 6); b = 1 + Math.floor(Math.random() * 6) } while (a === b);
    s.opening = [a, b]; s.cur = a > b ? 0 : 1;
    s.g.dice = [a, b]; s.rolled = [a, b]; s.snap = clone(s.g); s.moves = [];
    s.phase = 'play'; s.gameNo++;
    log(s, `Açılış zarı: ${nm(s, s.seat[0])} ${a}, ${nm(s, s.seat[1])} ${b}. ${nm(s, s.seat[s.cur])} başlıyor.`);
  }
  function endTurn(s) {
    const c = s.cur;
    if (s.g.off[c] === 15) {
      const mars = s.g.off[1 - c] === 0, pts = mars ? 2 : 1, id = s.seat[c];
      P(s, id).score += pts; s.lastWin = { id, pts, mars };
      log(s, `${nm(s, id)} oyunu ${mars ? 'MARS ile ' : ''}kazandı: +${pts}.`);
      if (P(s, id).score >= s.target) { s.phase = 'over'; s.winner = id } else s.phase = 'gameEnd';
      return;
    }
    s.cur = 1 - c; s.g.dice = []; s.rolled = null; s.snap = null; s.moves = [];
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (a.type === 'target' && isHost && (s.phase === 'lobby' || s.phase === 'over') && [1, 3, 5, 7].includes(a.n)) { s.target = a.n; return s }
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over') && s.players.length === 2) {
      s.players.forEach(p => p.score = 0); s.seat = s.players.map(p => p.id); s.gameNo = 0; s.log = []; s.winner = null; s.lastWin = null;
      newGame(s); return s;
    }
    if (a.type === 'next' && s.phase === 'gameEnd' && s.seat.includes(pid)) { s.lastWin = null; newGame(s); return s }
    if (s.phase !== 'play' || s.seat[s.cur] !== pid) return s;
    const c = s.cur;
    if (a.type === 'roll' && !s.rolled) {
      const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
      s.rolled = [d1, d2]; s.g.dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2]; s.snap = clone(s.g); s.moves = [];
      log(s, `${nm(s, pid)} zar attı: ${d1}-${d2}${d1 === d2 ? ' (çift!)' : ''}`);
      return s;
    }
    if (a.type === 'move' && s.rolled) {
      const L = legal(s.g, c), m = L.find(x => String(x.from) === String(a.from) && String(x.to) === String(a.to) && x.d === a.d);
      if (!m) return s;
      const hit = apply(s.g, c, m); s.moves.push({ ...m, hit });
      return s;
    }
    if (a.type === 'undo' && s.rolled && s.moves.length) { s.g = clone(s.snap); s.moves = []; return s }
    if (a.type === 'done' && s.rolled && (!s.g.dice.length || !legal(s.g, c).length)) {
      if (s.moves.some(m => m.hit)) log(s, `${nm(s, pid)} pul kırdı!`);
      endTurn(s); return s;
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s); delete v.snap;
    if (v.phase === 'play' && v.rolled) v.legal = legal(s.g, s.cur);
    return v;
  }
  return { create, act, view, legal, stepMoves, initBoard, allHome };
})();
if (typeof module !== 'undefined') module.exports = Tavla;
