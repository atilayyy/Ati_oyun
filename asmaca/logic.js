/* Adam Asmaca — 2 kişi. Her tur biri kelime seçer (ya da rastgele), diğeri harf harf bulmaya çalışır. */
const Asmaca = (() => {
  const ALPHA = 'abcçdefgğhıijklmnoöprsştuüvyz', MAX = 7;
  const clone = s => JSON.parse(JSON.stringify(s));
  const cache = {};
  let loader = async n => { const r = await fetch('../kelime/kelimeler/' + n + '.json'); if (!r.ok) throw new Error('liste'); return r.json() };
  async function list(n) { if (!cache[n]) { const d = await loader(n); cache[n] = { a: d.a, v: new Set(d.v) } } return cache[n] }
  const low = w => String(w || '').trim().toLocaleLowerCase('tr');
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], games: 0 } }
  const setterIdx = s => (s.round + s.games) % 2;
  function begin(s, w, random) {
    s.word = w; s.guessed = []; s.wrong = 0; s.wrongWords = []; s.phase = 'play'; s.random = !!random; s.result = null;
  }
  function finish(s, solved) {
    const si = setterIdx(s), gi = 1 - si;
    const pts = solved ? 2 + (MAX - s.wrong) : 6;
    s.players[solved ? gi : si].score += pts;
    s.result = { solved, pts, to: solved ? gi : si };
    s.phase = 'roundEnd';
  }
  const solvedNow = s => Array.from(s.word).every(ch => s.guessed.includes(ch));
  async function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const idx = s.players.findIndex(p => p.id === pid); if (idx < 0) return s;
    if (a.type === 'start' && s.players.length === 2 && (s.phase === 'over' || (s.phase === 'lobby' && pid === s.hostId))) {
      if (s.phase === 'over') { s.players.forEach(p => p.score = 0); s.games++ }
      s.total = [4, 6, 8, 10].includes(a.total) ? a.total : 6; s.round = 0; s.phase = 'pick'; s.err = null; delete s.word;
      return s;
    }
    const si = setterIdx(s);
    if (s.phase === 'pick' && idx === si) {
      if (a.type === 'random') {
        const n = 5 + Math.floor(Math.random() * 4), L = await list(n);
        begin(s, L.a[Math.floor(Math.random() * Math.min(L.a.length, 600))], true); return s;
      }
      if (a.type === 'setword') {
        const w = low(a.w), n = Array.from(w).length;
        if (n < 4 || n > 10 || Array.from(w).some(c => !ALPHA.includes(c))) { s.err = '4 ile 10 harf arası, sadece Türkçe harfler.'; return s }
        const L = await list(n);
        if (!L.v.has(w)) { s.err = 'Bu kelime listede yok, başka bir tane dene.'; return s }
        s.err = null; begin(s, w, false); return s;
      }
    }
    if (s.phase === 'play' && idx === 1 - si) {
      if (a.type === 'letter') {
        const l = low(a.l); if (l.length !== 1 || !ALPHA.includes(l) || s.guessed.includes(l)) return s;
        s.guessed.push(l);
        if (!s.word.includes(l)) s.wrong++;
        if (solvedNow(s)) finish(s, true); else if (s.wrong >= MAX) finish(s, false);
        return s;
      }
      if (a.type === 'solve') {
        const w = low(a.w); if (!w) return s;
        if (w === s.word) { Array.from(w).forEach(ch => { if (!s.guessed.includes(ch)) s.guessed.push(ch) }); finish(s, true) }
        else { s.wrong++; s.wrongWords.push(w.slice(0, 12)); if (s.wrong >= MAX) finish(s, false) }
        return s;
      }
    }
    if (a.type === 'next' && s.phase === 'roundEnd') {
      s.round++;
      if (s.round >= s.total) s.phase = 'over'; else { s.phase = 'pick'; s.err = null; delete s.word }
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    const idx = v.players.findIndex(p => p.id === pid);
    v.setter = v.round != null ? setterIdx(s) : 0;
    if (v.phase === 'play' && idx !== v.setter) {
      v.mask = Array.from(s.word).map(ch => s.guessed.includes(ch) ? ch : null);
      delete v.word;
    }
    if (v.phase === 'pick' && idx !== v.setter) delete v.err;
    return v;
  }
  return { create, act, view, ALPHA, MAX, setLoader: f => loader = f };
})();
if (typeof module !== 'undefined') module.exports = Asmaca;
