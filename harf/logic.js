/* Harf Avı — Boggle tarzı kelime avı. 1-8 kişi, herkese aynı 4x4 harf tablosu.
   Komşu (çapraz dahil) harfleri birleştirip en az 3 harfli kelimeler bul; bir harf aynı kelimede bir kez kullanılır.
   Puan: 3-4 harf 1, 5 harf 2, 6 harf 3, 7 harf 5, 8+ harf 11. Birden fazla kişinin bulduğu kelime kimseye puan getirmez. */
const Harf = (() => {
  const DURS = [60000, 120000, 180000], COUNT = 3000;
  const ALPHA = 'abcçdefgğhıijklmnoöprsştuüvyz';
  const clone = s => JSON.parse(JSON.stringify(s));
  const pts = n => n <= 4 ? 1 : n === 5 ? 2 : n === 6 ? 3 : n === 7 ? 5 : 11;
  const adj = (a, b) => a !== b && Math.abs((a >> 2) - (b >> 2)) <= 1 && Math.abs((a & 3) - (b & 3)) <= 1;
  function pathOK(board, w, path) {
    if (!Array.isArray(path) || path.length !== Array.from(w).length || path.length < 3) return false;
    const seen = new Set();
    for (let i = 0; i < path.length; i++) {
      const c = path[i]; if (!Number.isInteger(c) || c < 0 || c > 15 || seen.has(c)) return false; seen.add(c);
      if (board[c] !== Array.from(w)[i]) return false;
      if (i && !adj(path[i - 1], c)) return false;
    }
    return true;
  }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], dur: 120000, game: 0 } }
  function finish(s) {
    if (s.phase !== 'play') return;
    const cnt = {}; for (const id in s.found) for (const w of s.found[id]) cnt[w] = (cnt[w] || 0) + 1;
    s.res = {};
    for (const id in s.found) { let t = 0; for (const w of s.found[id]) if (cnt[w] === 1) t += pts(Array.from(w).length); s.res[id] = t }
    s.shared = Object.keys(cnt).filter(w => cnt[w] > 1);
    const best = Math.max(...Object.values(s.res));
    s.winners = Object.keys(s.res).filter(id => s.res[id] === best);
    if (best > 0) s.players.forEach(p => { if (s.winners.includes(p.id)) p.score += 1 });
    s.phase = 'over';
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (isHost && (s.phase === 'lobby' || s.phase === 'over')) {
      if (a.type === 'opts' && DURS.includes(a.dur)) { s.dur = a.dur; return s }
      if (a.type === 'start' && Array.isArray(a.board) && a.board.length === 16 && a.board.every(c => ALPHA.includes(c) && c.length === 1)) {
        if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
        s.board = a.board.slice(); s.game++; s.startAt = Date.now() + COUNT; s.found = {}; s.res = null; s.shared = null; s.winners = null;
        s.players.forEach(p => s.found[p.id] = []);
        s.phase = 'play'; return s;
      }
    }
    if (a.type === 'word' && s.phase === 'play' && s.found[pid] && a.game === s.game) {
      const now = Date.now(); if (now < s.startAt - 500 || now > s.startAt + s.dur + 2500) return s;
      const w = String(a.w || '').toLocaleLowerCase('tr');
      if (s.found[pid].includes(w) || !pathOK(s.board, w, a.path)) return s;
      s.found[pid].push(w); return s;
    }
    if (a.type === 'timeup' && isHost && s.phase === 'play' && Date.now() >= s.startAt + s.dur + 1500) { finish(s); return s }
    if (a.type === 'end' && isHost && s.phase === 'play') { finish(s); return s }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'play') {
      v.wait = s.startAt - Date.now(); v.left = s.startAt + s.dur - Date.now();
      v.counts = {}; for (const id in s.found) { v.counts[id] = s.found[id].length; if (id !== pid) v.found[id] = null }
    }
    delete v.startAt;
    return v;
  }
  return { create, act, view, pts, adj, pathOK, DURS, ALPHA };
})();
if (typeof module !== 'undefined') module.exports = Harf;
