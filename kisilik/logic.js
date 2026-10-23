/* Sen Hangi Tipsin? — 2+ kişi. Herkes komik sorulara cevap verir, sonra birbirinin tipini tahmin eder. */
const Kisilik = (() => {
  const TYPES = [
    ['Kanepe Filozofu', 'Hayatın anlamını battaniyenin altından çözer. Yerinden kalkmadan derin düşünceler üretir, en büyük sporu kumandaya uzanmaktır.', '#8fb3ff'],
    ['Kaos Ustası', 'Plan mı? O ne? En iyi kararlarını son 5 dakikada verir ve şaşırtıcı biçimde hep işe yarar. Etrafındakiler yorulur, o eğlenir.', '#ff8a5c'],
    ['Excel İnsanı', 'Tatil planında bile sekme var. Her şeyin bir listesi, her listenin bir rengi var. Hayatı formülle çözer, yanılmaz.', '#5fd38a'],
    ['Atıştırmalık Avcısı', 'Nereye giderse önce mutfağı bulur. Ruh hali açlık seviyesine bağlıdır. Çantasında her an bir çikolata vardır.', '#ffc83d'],
    ['Dram Yıldızı', 'Küçük bir olayı üç sezonluk diziye çevirebilir. Hayatı sinematik, girişleri olaylı. Sıkıcı bir anı yoktur.', '#ff6b9e'],
    ['Gizli Ajan', 'Sessiz, gizemli, her şeyi fark eder ama belli etmez. Grup sohbetini okur, yazmaz. Herkesin sırrını bilir.', '#b49cff']
  ];
  const QS = [
    ['Cuma akşamı planın ne?', [['Kanepe, battaniye, dizi', 0], ['Son dakika bir maceraya atılmak', 1], ['Hafta sonu programını çıkarmak', 2], ['Yeni bir restoran denemek', 3]]],
    ['Grup sohbetinde sen hangisisin?', [['Herkes konuşurken 4 dakikalık sesli mesaj atan', 4], ['Okuyup hiç yazmayan', 5], ['Hemen anket açan', 2], ['Sadece yemek fotoğrafı atan', 3]]],
    ['Alarm çaldığında ne olur?', [['5 kere ertelerim ve hayatı sorgularım', 0], ['Alarm mı kurmuştum?', 1], ['3 yedek alarmım zaten çalıyor', 2], ['İlk iş buzdolabına giderim', 3]]],
    ['Bir tartışmada ne yaparsın?', [['Sessizce izler, her şeyi not alırım', 5], ['Dramatik bir monologla kapatırım', 4], ['Konuyu aniden değiştiririm', 1], ['"Bunu derin düşünmek lazım" der, uzanırım', 0]]],
    ['Tatile varınca ilk ne yaparsın?', [['Otel yatağını test ederim', 0], ['Sokak yemeklerine dalarım', 3], ['Önceden hazırladığım listeyi açarım', 2], ['Burada kimse beni tanımıyor, yeni kimlik', 5]]],
    ['Biri sana sürpriz parti yapsa?', [['Ağlarım, çok güzel bir sahne olur', 4], ['Zaten biliyordum, her şeyi fark etmiştim', 5], ['Önce pastaya koşarım', 3], ['O akşama 2 plan daha yapmış olurum', 1]]],
    ['Bir süper güç seç.', [['Yerimden kalkmadan her şeyi almak', 0], ['Görünmez olmak', 5], ['Zamanı durdurup her şeyi düzenlemek', 2], ['Girdiğim her yerde sahne ışığı', 4]]],
    ['Telefonunda en çok ne var?', [['Yarım kalmış fikirler ve rastgele ekran görüntüleri', 1], ['Yemek fotoğrafları', 3], ['Notlar, listeler, hatırlatıcılar', 2], ['Selfie ve hikâyeler', 4]]],
    ['Bir filmde hangi karakter olurdun?', [['Bilge ama tembel yaşlı usta', 0], ['Her şeyi patlatan çılgın yan karakter', 1], ['Gölgedeki casus', 5], ['Herkesi ağlatan ana karakter', 4]]],
    ['Markette nasılsın?', [['Listeyle girer, listeyle çıkarım', 2], ['Liste yok, ne görürsem', 1], ['Atıştırmalık reyonunda kaybolurum', 3], ['Kimseyle göz teması kurmam', 5]]],
    ['Bir sorunla karşılaşınca ilk ne yaparsın?', [['Önce bir uzanayım, sonra düşünürüm', 0], ['Herkese anlatırım, büyük olay', 4], ['Bir tablo hazırlarım', 2], ['Bir şey yiyince geçer', 3]]],
    ['Arkadaşların seni nasıl tarif eder?', [['"O nerede? Az önce buradaydı"', 5], ['"Yine ne yaptı?!"', 1], ['"Bunu o çözer"', 2], ['"Ortamın yıldızı"', 4]]]
  ];
  const clone = s => JSON.parse(JSON.stringify(s));
  function create(hostId, hostName) { return { phase: 'lobby', hostId, players: [{ id: hostId, name: hostName, online: true, score: 0 }] } }
  function typeOf(ans) {
    const cnt = Array(TYPES.length).fill(0), lastAt = Array(TYPES.length).fill(-1);
    ans.forEach((k, qi) => { const t = QS[qi][1][k][1]; cnt[t]++; lastAt[t] = qi });
    let best = 0; for (let t = 1; t < TYPES.length; t++) if (cnt[t] > cnt[best] || (cnt[t] === cnt[best] && lastAt[t] > lastAt[best])) best = t;
    return { type: best, cnt };
  }
  function act(s0, pid, a) {
    const s = clone(s0);
    if (typeof Ati !== 'undefined' && Ati.handleMeta(s, pid, a, null, 8)) return s;
    if (!a || typeof a !== 'object') return s;
    const me = s.players.find(p => p.id === pid);
    if (a.type === 'start' && pid === s.hostId && s.phase !== 'answer' && s.phase !== 'guess' && s.players.length >= 2) {
      if (s.watchers) { for (const x of s.watchers) if (!s.players.find(p => p.id === x.id) && s.players.length < 8) s.players.push({ id: x.id, name: x.name, online: true, score: 0 }); s.watchers = [] }
      s.phase = 'answer'; s.ans = {}; s.guess = {}; s.result = null;
      s.players.forEach(p => { s.ans[p.id] = []; s.guess[p.id] = null });
      return s;
    }
    if (!me) return s;
    if (a.type === 'answer' && s.phase === 'answer') {
      const arr = s.ans[pid]; if (!arr || arr.length >= QS.length) return s;
      const k = a.k | 0; if (k < 0 || k >= QS[arr.length][1].length) return s;
      arr.push(k);
      if (s.players.every(p => s.ans[p.id].length === QS.length)) s.phase = 'guess';
      return s;
    }
    if (a.type === 'guess' && s.phase === 'guess' && !s.guess[pid] && a.g && typeof a.g === 'object') {
      const g = {};
      for (const p of s.players) if (p.id !== pid) { const t = a.g[p.id] | 0; if (t < 0 || t >= TYPES.length) return s; g[p.id] = t }
      s.guess[pid] = g;
      if (s.players.every(p => s.guess[p.id])) {
        s.result = {};
        for (const p of s.players) s.result[p.id] = typeOf(s.ans[p.id]);
        for (const p of s.players) for (const o in s.guess[p.id]) if (s.guess[p.id][o] === s.result[o].type) p.score++;
        s.phase = 'reveal';
      }
    }
    return s;
  }
  function view(s, pid) {
    const v = clone(s);
    if (v.ans) for (const id in v.ans) if (id !== pid) v.ans[id] = v.phase === 'reveal' ? v.ans[id] : Array(v.ans[id].length).fill(-1);
    if (v.guess && v.phase !== 'reveal') for (const id in v.guess) if (id !== pid) v.guess[id] = v.guess[id] ? true : null;
    return v;
  }
  return { create, act, view, TYPES, QS, typeOf };
})();
if (typeof module !== 'undefined') module.exports = Kisilik;
