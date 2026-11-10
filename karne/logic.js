/* Karne — 2 kişi. Sorular sırayla birinizle, sonra diğerinizle ilgili gelir.
   Karşıdaki 1-10 puan verir; soru kimin hakkındaysa o da kaç puan alacağını tahmin eder. */
const Karne = (() => {
  const IYI = ['ne kadar komik?', 'ne kadar güvenilir?', 'ne kadar iyi bir dinleyici?', 'ne kadar cömert?', 'ne kadar sakin?', 'ne kadar yardımsever?',
    'ne kadar dürüst?', 'ne kadar eğlenceli bir yol arkadaşı?', 'ne kadar iyi yemek yapar?', 'ne kadar sabırlı?', 'ne kadar zevkli giyinir?',
    'sözünü ne kadar tutar?', 'moral vermekte ne kadar iyi?', 'ne kadar maceracı?', 'doğum günlerini ne kadar hatırlar?', 'ne kadar çalışkan?',
    'ne kadar iyi tavsiye verir?', 'ne kadar enerjik?', 'sır tutmakta ne kadar iyi?', 'ne kadar iyi bir ev arkadaşı olurdu?', 'ne kadar romantik?',
    'ne kadar iyi dans eder?', 'zor bir günde ne kadar iyi destek olur?', 'ne kadar yaratıcı?'];
  const KOTU = ['ne kadar geç kalır?', 'ne kadar inatçı?', 'telefona ne kadar gömülür?', 'ne kadar dağınık?', 'ne kadar alıngan?', 'her şeye ne kadar itiraz eder?',
    'planları son dakika ne kadar değiştirir?', 'ne kadar kararsız?', 'lafı ne kadar uzatır?', 'ne kadar çabuk sinirlenir?', 'mesajlara ne kadar geç döner?',
    'ne kadar kıskanç?', 'ne kadar ukala olabilir?', 'ne kadar dedikoducu?', 'kendini övmeyi ne kadar sever?', 'acıkınca ne kadar huysuzlaşır?',
    'işleri son ana ne kadar bırakır?', 'ne kadar şikâyet eder?', 'ne kadar spoiler verir?', 'bir şeyleri ne kadar unutur?', 'ne kadar söz keser?',
    'tartışmada haksız olduğunu ne kadar zor kabul eder?', 'ne kadar pinti olabilir?', 'sabahları ne kadar çekilmez?'];
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], games: 0 } }
  function pick(s, kind) {
    const pool = (kind === 'iyi' ? IYI : KOTU).filter(t => !s.usedT.includes(t));
    const t = pool.length ? pool[Math.floor(Math.random() * pool.length)] : (kind === 'iyi' ? IYI : KOTU)[0];
    s.usedT.push(t); return t;
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 2)) return s;
    if (!a || typeof a !== 'object') return s;
    const idx = s.players.findIndex(p => p.id === pid); if (idx < 0) return s;
    if (a.type === 'start' && s.players.length === 2 && (s.phase === 'over' || (s.phase === 'lobby' && pid === s.hostId))) {
      const per = [4, 6, 8, 10].includes(a.per) ? a.per : 6;
      s.usedT = []; s.qs = []; s.per = per; s.cur = 0; s.phase = 'play';
      const first = s.games % 2; s.games++;
      s.players.forEach(p => p.score = 0);
      for (let i = 0; i < per; i++) for (const k of [0, 1]) {
        const kind = (i + k) % 2 === 0 ? 'iyi' : 'kotu';
        s.qs.push({ subj: (first + k) % 2, kind, t: pick(s, kind), custom: false, rate: null, guess: null });
      }
      return s;
    }
    if (s.phase !== 'play') return s;
    const q = s.qs[s.cur], rater = 1 - q.subj;
    if (a.type === 'skip' && idx === rater && q.rate === null && !q.custom) { q.t = pick(s, q.kind); q.guess = null; return s }
    if (a.type === 'custom' && idx === rater && q.rate === null) {
      const t = String(a.t || '').trim().slice(0, 80); if (t.length < 3) return s;
      q.t = t; q.custom = true; q.kind = a.kind === 'kotu' ? 'kotu' : 'iyi'; q.guess = null; return s;
    }
    const v = a.v | 0;
    if (a.type === 'rate' && idx === rater && q.rate === null && v >= 1 && v <= 10) q.rate = v;
    if (a.type === 'guess' && idx === q.subj && q.guess === null && v >= 1 && v <= 10) q.guess = v;
    if ((a.type === 'rate' || a.type === 'guess') && q.rate !== null && q.guess !== null && !q.pts) {
      q.pts = 10 - Math.abs(q.rate - q.guess); s.players[q.subj].score += q.pts;
    }
    if (a.type === 'next' && q.rate !== null && q.guess !== null) { s.cur++; if (s.cur >= s.qs.length) s.phase = 'over' }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    const idx = v.players.findIndex(p => p.id === pid);
    delete v.usedT;
    if (v.phase === 'play') {
      const q = v.qs[v.cur];
      if (q.rate === null || q.guess === null) { if (idx !== 1 - q.subj && q.rate !== null) q.rate = 'x'; if (idx !== q.subj && q.guess !== null) q.guess = 'x' }
      v.qs = v.qs.map((x, i) => i <= v.cur ? x : { subj: x.subj, kind: x.kind });
    }
    return v;
  }
  return { create, act, view, IYI, KOTU };
})();
if (typeof module !== 'undefined') module.exports = Karne;
