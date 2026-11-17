/* Dalga Boyu — Wavelength'ten esinlenen tahmin oyunu. 2-10 kişi.
   Anlatıcı iki uçlu bir kart ve gizli bir hedef görür, tek bir ipucu yazar. Diğerleri ibreyi ayarlar.
   Hedefe yakınlık: ±2.5 → 4 puan, ±7.5 → 3, ±12.5 → 2. Anlatıcı, tahmincilerin ortalama puanını (yuvarlanmış) alır. */
const Dalga = (() => {
  const KARTLAR = [
    ['Soğuk', 'Sıcak'], ['Ucuz', 'Pahalı'], ['Kötü film', 'Harika film'], ['Sağlıksız yemek', 'Sağlıklı yemek'], ['Kimse bilmez', 'Herkes bilir'],
    ['Sıkıcı', 'Eğlenceli'], ['Kolay', 'Zor'], ['Yumuşak', 'Sert'], ['Küçük', 'Büyük'], ['İşe yaramaz süper güç', 'Harika süper güç'],
    ['Hiç romantik değil', 'Çok romantik'], ['Gereksiz', 'Vazgeçilmez'], ['Eski moda', 'Modern'], ['Abartılmış', 'Hakkı verilmemiş'], ['Berbat hediye', 'Harika hediye'],
    ['Az kalorili', 'Çok kalorili'], ['Tatlı', 'Tuzlu'], ['Sessiz', 'Gürültülü'], ['Hiç ürkütücü değil', 'Çok ürkütücü'], ['Kirli', 'Temiz'],
    ['Yavaş', 'Hızlı'], ['Çirkin', 'Güzel'], ['Hafif', 'Ağır'], ['Kötü alışkanlık', 'İyi alışkanlık'], ['Tehlikesiz', 'Tehlikeli'],
    ['Normal', 'Garip'], ['Basit', 'Karmaşık'], ['Ciddi', 'Komik'], ['Çocuklar için', 'Yetişkinler için'], ['Gerçek', 'Hayali'],
    ['Doğal', 'Yapay'], ['Kötü adam', 'Kahraman'], ['Yaz işi', 'Kış işi'], ['Köy', 'Şehir'], ['Unutulur', 'Akılda kalır'],
    ['İçe dönük', 'Dışa dönük'], ['Evcimen', 'Gezgin'], ['Kahvaltılık', 'Akşam yemeklik'], ['Klişe', 'Orijinal'], ['Teyze onaylamaz', 'Teyze onaylar'],
    ['Pazartesi hissi', 'Cuma hissi'], ['Hüzünlü', 'Neşeli'], ['Hiç acı değil', 'Çok acı'], ['Sade', 'Lüks'], ['Kötü tatil yeri', 'Rüya tatil yeri'],
    ['Yeteneksiz', 'Yetenekli'], ['Kötü ilk buluşma', 'Mükemmel ilk buluşma'], ['Kısa süren', 'Ömür boyu süren'], ['Sevimsiz hayvan', 'Sevimli hayvan'], ['Kötü meslek', 'Rüya meslek'],
    ['Az bağımlılık yapar', 'Çok bağımlılık yapar'], ['Gereksiz icat', 'Hayat kurtaran icat'], ['Kötü şarkı', 'Efsane şarkı'], ['Kolay telaffuz', 'Zor telaffuz'], ['Kötü pizza malzemesi', 'Harika pizza malzemesi'],
    ['Sakin', 'Sinirli'], ['Erken kalkan işi', 'Gece kuşu işi'], ['Aptalca', 'Dahice'], ['Yerli', 'Yabancı'], ['Dağınık', 'Düzenli'],
    ['Durgun', 'Heyecanlı'], ['Kötü düğün hediyesi', 'Harika düğün hediyesi'], ['Tek başına yapılır', 'Kalabalıkla yapılır'], ['Bedava olmalı', 'Pahalı olmalı'], ['Az önemli', 'Çok önemli'],
    ['Ev yemeği', 'Sokak yemeği'], ['Kaybeden', 'Kazanan'], ['Geçmiş', 'Gelecek'], ['Zararsız yalan', 'Affedilmez yalan'], ['Kötü kahve', 'Mükemmel kahve'],
    ['Kokusuz', 'Kokulu'], ['Dürüst', 'Kurnaz'], ['Utandırıcı', 'Gurur verici'], ['Kötü ünlü', 'Sevilen ünlü'], ['Sıradan', 'Efsane'],
    ['Bilim', 'Sanat'], ['Kolay pişer', 'Zor pişer'], ['Kötü oyun', 'Bağımlılık yapan oyun'], ['Ofis işi', 'Saha işi'], ['Kötü koku', 'Güzel koku']
  ];
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const P = (s, id) => s.players.find(p => p.id === id);
  const points = (t, g) => { const d = Math.abs(t - g); return d <= 2.5 ? 4 : d <= 7.5 ? 3 : d <= 12.5 ? 2 : 0 };

  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], laps: 1, used: [] } }
  function drawCards(s) {
    let pool = KARTLAR.map((_, i) => i).filter(i => !s.used.includes(i));
    if (pool.length < 2) { s.used = []; pool = KARTLAR.map((_, i) => i) }
    const two = shuffle(pool).slice(0, 2); s.used = s.used.concat(two).slice(-60); return two;
  }
  function beginRound(s) {
    // bağlantısı kopan anlatıcıyı atla
    while (s.ri < s.order.length && !(P(s, s.order[s.ri]) || {}).online) s.ri++;
    if (s.ri >= s.order.length) { s.phase = 'over'; return }
    s.psy = s.order[s.ri]; s.opts = drawCards(s); s.card = null; s.clue = null;
    s.target = Math.round(5 + Math.random() * 90); s.guesses = {}; s.gain = {}; s.phase = 'pick';
  }
  function reveal(s) {
    s.gain = {}; const gs = Object.keys(s.guesses);
    let sum = 0;
    for (const id of gs) { const g = points(s.target, s.guesses[id]); s.gain[id] = g; sum += g }
    s.gain[s.psy] = gs.length ? Math.round(sum / gs.length) : 0;
    for (const id in s.gain) { const p = P(s, id); if (p) p.score += s.gain[id] }
    s.phase = 'reveal';
  }
  const guessers = s => s.players.filter(p => p.id !== s.psy && p.online && s.order.includes(p.id));
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 10)) return s;
    if (!a || typeof a !== 'object') return s;
    const isHost = pid === s.hostId;
    if (a.type === 'laps' && isHost && (s.phase === 'lobby' || s.phase === 'over') && [1, 2, 3].includes(a.n)) { s.laps = a.n; return s }
    if (a.type === 'start' && isHost && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!P(s, x.id) && s.players.length < 10) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => p.score = 0);
      const base = shuffle(s.players.map(p => p.id)); s.order = [];
      for (let k = 0; k < s.laps; k++) s.order.push(...base);
      s.ri = 0; beginRound(s); return s;
    }
    if (!s.order || !s.order.includes(pid)) return s;
    if (a.type === 'pick' && s.phase === 'pick' && pid === s.psy && s.opts.includes(a.c)) { s.card = a.c; s.phase = 'clue'; return s }
    if (a.type === 'clue' && s.phase === 'clue' && pid === s.psy) {
      const c = String(a.t || '').trim().replace(/\s+/g, ' ').slice(0, 40); if (!c) return s;
      s.clue = c; s.phase = 'guess'; return s;
    }
    if (a.type === 'guess' && s.phase === 'guess' && pid !== s.psy && Number.isFinite(a.v)) {
      s.guesses[pid] = Math.max(0, Math.min(100, Math.round(a.v * 10) / 10));
      if (guessers(s).every(p => p.id in s.guesses)) reveal(s);
      return s;
    }
    if (a.type === 'unguess' && s.phase === 'guess' && pid in s.guesses) { delete s.guesses[pid]; return s }
    if (a.type === 'force' && isHost && s.phase === 'guess' && Object.keys(s.guesses).length) { reveal(s); return s }
    if (a.type === 'next' && s.phase === 'reveal' && (isHost || pid === s.psy)) { s.ri++; beginRound(s); return s }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    delete v.used;
    if (v.phase === 'pick' || v.phase === 'clue' || v.phase === 'guess') {
      if (pid !== s.psy) { delete v.target; delete v.opts }
      if (v.phase === 'guess') for (const id in v.guesses) if (id !== pid) v.guesses[id] = -1;
    }
    if (v.card != null) v.cardText = KARTLAR[v.card];
    if (v.opts) v.optsText = v.opts.map(i => KARTLAR[i]);
    v.round = (v.ri || 0) + 1; v.rounds = v.order ? v.order.length : 0;
    return v;
  }
  return { create, act, view, points, KARTLAR };
})();
if (typeof module !== 'undefined') module.exports = Dalga;
