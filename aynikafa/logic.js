/* Aynı Kafa — 2-8 kişi. Herkes aynı soruya cevap yazar; aynı cevabı yazanlar puan alır.
   Puan: aynı cevabı veren her diğer kişi için +1. Yazımı farklı ama aynı şeyse "Benimki de bu" denebilir. */
const AyniKafa = (() => {
  const TIME = 25000;
  const GENEL = ['Bir meyve söyle', 'Bir sebze söyle', 'Bir renk söyle', 'Bir hayvan söyle', 'Bir futbol takımı söyle', 'Türkiye\'den bir şehir söyle',
    'Bir ülke söyle', 'Bir içecek söyle', 'Bir tatlı söyle', 'Kahvaltıda olmazsa olmaz bir şey', 'Bir meslek söyle', 'Bir araba markası söyle',
    'Bir süper kahraman söyle', 'Bir çizgi film karakteri söyle', 'Bir mutfak eşyası söyle', 'Bir spor dalı söyle', 'Bir müzik aleti söyle',
    'Haftanın en sevdiğin günü', '1 ile 10 arasında bir sayı', 'Bir çiçek söyle', 'Bir ağaç söyle', 'Bir deniz canlısı söyle', 'Bir kuş söyle',
    'Bir masa ya da kart oyunu söyle', 'Bir Türk şarkıcı söyle', 'Bir Türk oyuncu söyle', 'Bir Türk dizisi söyle', 'Telefondaki en vazgeçilmez uygulama',
    'Bir kahve çeşidi söyle', 'Bir pizza malzemesi söyle', 'Bir dondurma çeşidi söyle', 'Bir peynir çeşidi söyle', 'Bir kuruyemiş söyle',
    'Türkiye\'de bir tatil yeri söyle', 'Bir gezegen söyle', 'Bir okul dersi söyle', 'Bir giysi söyle', 'Bir sokak lezzeti söyle', 'Bir çorba söyle',
    'Bir hamur işi söyle', 'Bir kebap çeşidi söyle', 'Bir zeytinyağlı yemek söyle', 'Bir Karadeniz yemeği söyle', 'Bir baharat söyle',
    'Bir telefon markası söyle', 'Bir hobi söyle', 'Gece canın çeken bir atıştırmalık', 'Ofiste en çok duyulan kelime', 'Bir doğum günü hediyesi söyle',
    'Pazar sabahı yapılacak bir şey', 'İnsanların en çok korktuğu şey', 'Bir tatil aktivitesi söyle', 'Bir ünlü futbolcu söyle', 'Bir NBA oyuncusu söyle',
    'Bir Avrupa başkenti söyle', 'Bir mevsim söyle', 'Bir el aleti söyle', 'Bir banyo eşyası söyle', 'Bir ev hayvanı ismi söyle', 'Bir bayram yemeği söyle'];
  // [ek türü veya '', metin]: ek varsa ismin sonuna eklenir ("Deniz'in en sevdiği renk?")
  const KISI = [['in', 'en sevdiği yemek?'], ['', 'tatile nereye gitmek ister?'], ['in', 'en sevdiği renk?'], ['in', 'en sevdiği dizi?'],
    ['in', 'en sevdiği hayvan?'], ['', 'sabah uyanınca ilk ne yapar?'], ['in', 'en sevdiği içecek?'], ['in', 'en sevdiği tatlı?'],
    ['', 'boş bir günde ne yapar?'], ['in', 'en sevdiği mevsim?'], ['in', 'en çok kullandığı uygulama?'], ['in', 'tuttuğu takım?']];
  const clone = s => JSON.parse(JSON.stringify(s));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a };
  const EK = typeof ek !== 'undefined' ? ek : (typeof require !== 'undefined' ? require('../assets/ek.js') : (n => n));
  function norm(t) {
    let x = String(t || '').toLocaleLowerCase('tr').trim();
    x = x.replace(/[çğıöşüâîû]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' }[c]));
    x = x.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^bir /, '');
    return x;
  }
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }], usedG: [] } }
  function effKey(s, pid) {
    let id = pid;
    for (let i = 0; i < 8 && s.merge[id] && s.merge[id] !== pid; i++) id = s.merge[id];
    return s.ans[id] ? norm(s.ans[id]) : null;
  }
  function groups(s) {
    const g = {};
    for (const p of s.players) { if (!s.ans[p.id] || !norm(s.ans[p.id])) continue; const k = effKey(s, p.id); if (!k) continue; (g[k] = g[k] || []).push(p.id) }
    return g;
  }
  function ask(s) { s.phase = 'q'; s.started = Date.now(); s.ans = {}; s.merge = {} }
  function reveal(s) { if (s.phase === 'q') s.phase = 'reveal' }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && pid === s.hostId && (s.phase === 'lobby' || s.phase === 'over') && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.players.forEach(p => { p.score = 0; p.match = 0 });
      const n = [8, 12, 16].includes(a.count) ? a.count : 12;
      let pool = GENEL.filter(t => !s.usedG.includes(t)); if (pool.length < n) { s.usedG = []; pool = GENEL.slice() }
      const gen = shuffle(pool), kisi = shuffle(KISI), qs = [];
      let gi = 0, ki = 0;
      for (let i = 0; i < n; i++) {
        if (i % 3 === 2 && ki < kisi.length) { const p = s.players[(ki) % s.players.length], [e, t] = kisi[ki++]; qs.push((e ? EK(p.name, e) : p.name) + ' ' + t) }
        else { qs.push(gen[gi]); s.usedG.push(gen[gi++]) }
      }
      s.qs = qs; s.cur = 0; ask(s); return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'q' && !(pid in s.ans)) {
      s.ans[pid] = String(a.t || '').trim().slice(0, 40);
      if (s.players.every(p => p.id in s.ans || !p.online)) reveal(s);
      return s;
    }
    if (a.type === 'timeout' && pid === s.hostId && s.phase === 'q' && a.cur === s.cur && Date.now() - s.started >= TIME - 300) { reveal(s); return s }
    if (a.type === 'merge' && s.phase === 'reveal' && s.ans[pid]) {
      if (a.to === null) delete s.merge[pid];
      else if (a.to !== pid && s.ans[a.to] && s.merge[a.to] !== pid) s.merge[pid] = a.to;
      return s;
    }
    if (a.type === 'next' && s.phase === 'reveal') {
      const g = groups(s);
      for (const k in g) if (g[k].length > 1) for (const id of g[k]) { const p = s.players.find(x => x.id === id); p.score += g[k].length - 1; p.match = (p.match || 0) + 1 }
      s.hist = (s.hist || []).concat([{ q: s.qs[s.cur], g: Object.values(g).filter(x => x.length > 1).length }]);
      s.cur++; if (s.cur >= s.qs.length) s.phase = 'over'; else ask(s);
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.phase === 'q') { v.left = Math.max(0, TIME - (Date.now() - s.started)); for (const id in v.ans) if (id !== pid) v.ans[id] = 'x' }
    if (v.phase === 'reveal') v.groups = groups(s);
    delete v.usedG;
    return v;
  }
  return { create, act, view, norm, TIME, GENEL, KISI };
})();
if (typeof module !== 'undefined') module.exports = AyniKafa;
