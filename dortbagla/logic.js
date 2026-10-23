/* Dört Bağla — 7 sütun, 6 satır. Taşını bir sütuna bırak, yan yana / üst üste / çapraz 4 yapan kazanır. */
const DortBagla = (() => {
  const W = 7, H = 6;
  const clone = s => JSON.parse(JSON.stringify(s));
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], games: 0 } }
  function newBoard(s) {
    s.board = Array.from({ length: H }, () => Array(W).fill(-1));
    s.first = s.games % 2; s.turn = s.first; s.winner = null; s.line = null; s.last = null; s.phase = 'play';
  }
  function findLine(b, r, c, who) {
    for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]]) {
      const cells = [[r, c]];
      for (const sgn of [1, -1]) {
        let rr = r + dr * sgn, cc = c + dc * sgn;
        while (rr >= 0 && rr < H && cc >= 0 && cc < W && b[rr][cc] === who) { cells.push([rr, cc]); rr += dr * sgn; cc += dc * sgn }
      }
      if (cells.length >= 4) return cells;
    }
    return null;
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const idx = s.players.findIndex(p => p.id === pid);
    if (a.type === 'start' && s.phase !== 'play' && s.players.length === 2 && (pid === s.hostId || s.phase === 'over')) { newBoard(s); return s }
    if (a.type === 'drop' && s.phase === 'play' && idx === s.turn) {
      const c = a.col | 0; if (c < 0 || c >= W) return s;
      let r = H - 1; while (r >= 0 && s.board[r][c] !== -1) r--;
      if (r < 0) return s;
      s.board[r][c] = idx; s.last = [r, c];
      const line = findLine(s.board, r, c, idx);
      if (line) { s.winner = idx; s.line = line; s.players[idx].score++; s.phase = 'over'; s.games++ }
      else if (s.board[0].every(x => x !== -1)) { s.winner = -1; s.phase = 'over'; s.games++ }
      else s.turn = 1 - idx;
    }
    return s;
  }
  return { create, act, view: s => s, W, H, findLine };
})();
if (typeof module !== 'undefined') module.exports = DortBagla;
