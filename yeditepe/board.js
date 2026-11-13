/* Yedi Tepe harita geometrisi: 19 altıgen (sivri tepeli), 54 köşe, 72 kenar. Tema adları da burada. */
const YT = (() => {
  const RES = ['kereste', 'tugla', 'kumas', 'bugday', 'mermer'];
  const RN = { kereste: 'Kereste', tugla: 'Tuğla', kumas: 'Kumaş', bugday: 'Buğday', mermer: 'Mermer' };
  const RE = { kereste: '🪵', tugla: '🧱', kumas: '🧶', bugday: '🌾', mermer: '🪨' };
  // arazi → kaynak ve İstanbul semtleri
  const TERRAIN = {
    kereste: { name: 'Koru', places: ['Belgrad Ormanı', 'Emirgan Korusu', 'Validebağ', 'Yıldız Parkı'], fill: '#3f8f52' },
    tugla: { name: 'Tuğlahane', places: ['Kağıthane', 'Eyüp', 'Zeytinburnu'], fill: '#b5563a' },
    kumas: { name: 'Çarşı', places: ['Kapalıçarşı', 'Mahmutpaşa', 'Nişantaşı', 'Bağdat Caddesi'], fill: '#8e3b74' },
    bugday: { name: 'Tarla', places: ['Silivri', 'Çatalca', 'Şile', 'Mısır Çarşısı'], fill: '#e3b53b' },
    mermer: { name: 'Tepe', places: ['Çamlıca Tepesi', 'Aydos Tepesi', 'Marmara Adası'], fill: '#8a8f9e' },
    col: { name: 'Meydan', places: ['Taksim Meydanı'], fill: '#d9c9a3' }
  };
  const PORTS = ['Karaköy İskelesi', 'Eminönü İskelesi', 'Kadıköy İskelesi', 'Üsküdar İskelesi', 'Beşiktaş İskelesi', 'Ortaköy İskelesi', 'Sarıyer İskelesi', 'Bebek İskelesi', 'Haydarpaşa Limanı'];
  const DEV = {
    yeniceri: { name: 'Yeniçeri', desc: 'Zabıtayı taşı ve oradaki birinden 1 kart çal.', em: '⚔️' },
    yol2: { name: 'Yol Yapımı', desc: 'Bedava 2 yol yap.', em: '🛣️' },
    bereket: { name: 'Bereket', desc: 'Bankadan istediğin 2 kaynağı al.', em: '🎁' },
    tekel: { name: 'Tekel', desc: 'Bir kaynak seç, herkes elindeki o kaynağın hepsini sana verir.', em: '💰' },
    puan: { name: 'Zafer Puanı', desc: '+1 puan. Gizli tutulur, sende kalır.', em: '🏛️' }
  };
  const VP_NAMES = ['Ayasofya', 'Galata Kulesi', 'Kız Kulesi', 'Topkapı Sarayı', 'Boğaz Köprüsü'];
  const COST = { yol: { kereste: 1, tugla: 1 }, ev: { kereste: 1, tugla: 1, kumas: 1, bugday: 1 }, konak: { bugday: 2, mermer: 3 }, kart: { kumas: 1, bugday: 1, mermer: 1 } };

  // geometri
  const S3 = Math.sqrt(3), SIZE = 60;
  const HEX = [];
  for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) HEX.push({ q, r, x: SIZE * S3 * (q + r / 2), y: SIZE * 1.5 * r });
  const VERT = [], EDGE = [], vkey = {}, ekey = {};
  const vid = (x, y) => { const k = Math.round(x) + ',' + Math.round(y); if (!(k in vkey)) { vkey[k] = VERT.length; VERT.push({ x, y, hexes: [], edges: [], adj: [] }) } return vkey[k] };
  HEX.forEach((h, hi) => {
    h.verts = []; h.edges = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 90); h.verts.push(vid(h.x + SIZE * Math.cos(a), h.y + SIZE * Math.sin(a))) }
    h.verts.forEach(v => VERT[v].hexes.push(hi));
    for (let i = 0; i < 6; i++) {
      const a = h.verts[i], b = h.verts[(i + 1) % 6], k = Math.min(a, b) + '-' + Math.max(a, b);
      if (!(k in ekey)) { ekey[k] = EDGE.length; EDGE.push({ v: [a, b], hexes: [] }); VERT[a].edges.push(ekey[k]); VERT[b].edges.push(ekey[k]); VERT[a].adj.push(b); VERT[b].adj.push(a) }
      EDGE[ekey[k]].hexes.push(hi); h.edges.push(ekey[k]);
    }
  });
  const HADJ = HEX.map(a => HEX.map((b, j) => j).filter(j => { const b = HEX[j]; const dq = a.q - b.q, dr = a.r - b.r; return Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr) === 2 }));
  // kıyı kenarları çevre boyunca sıralı; 9 liman 3-4-3 aralıklarla
  const COAST = EDGE.map((e, i) => i).filter(i => EDGE[i].hexes.length === 1)
    .sort((a, b) => { const m = i => { const [p, q] = EDGE[i].v; return Math.atan2((VERT[p].y + VERT[q].y) / 2, (VERT[p].x + VERT[q].x) / 2) }; return m(a) - m(b) });
  const PORT_EDGES = [0, 3, 7, 10, 13, 17, 20, 23, 27].map(i => COAST[i]);
  return { RES, RN, RE, TERRAIN, PORTS, DEV, VP_NAMES, COST, SIZE, HEX, VERT, EDGE, HADJ, COAST, PORT_EDGES };
})();
if (typeof module !== 'undefined') module.exports = YT;
