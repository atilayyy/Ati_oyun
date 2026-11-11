/* Hangisi Daha Çok? veri bankası. Her kategori: soru, birim, büyük mü küçük mü kazanır, ve [isim, değer] listesi.
   Değerleri birbirine çok yakın (kaynağa göre değişebilen) ikililer oyunda hiç sorulmaz. */
const HANGISI = [
  { id: 'yuk', q: 'Hangisi daha yüksek?', unit: 'metre', items: [
    ['Everest', 8849], ['K2', 8611], ['Aconcagua', 6961], ['Denali', 6190], ['Kilimanjaro', 5895], ['Elbruz', 5642], ['Ağrı Dağı', 5137],
    ['Mont Blanc', 4806], ['Matterhorn', 4478], ['Süphan Dağı', 4058], ['Erciyes Dağı', 3917], ['Fuji Dağı', 3776], ['Olimpos Dağı (Yunanistan)', 2918],
    ['Uludağ', 2543], ['Burj Khalifa', 828], ['Shanghai Kulesi', 632], ['One World Trade Center', 541], ['Taipei 101', 508], ['Petronas Kuleleri', 452],
    ['Çamlıca Kulesi', 369], ['Eyfel Kulesi', 330], ['Büyük Piramit (ilk hali)', 146], ['Big Ben (Elizabeth Kulesi)', 96]] },
  { id: 'nehir', q: 'Hangisi daha uzun?', unit: 'km', items: [
    ['Nil', 6650], ['Amazon', 6400], ['Yangtze', 6300], ['Mississippi', 3730], ['Volga', 3530], ['Tuna', 2850], ['Fırat', 2800], ['Dicle', 1850],
    ['Kızılırmak', 1355], ['Ren', 1230], ['Sakarya Nehri', 824], ['Sen (Seine)', 777], ['Yeşilırmak', 519], ['Thames', 346]] },
  { id: 'alan', q: 'Hangisinin yüzölçümü daha büyük?', unit: 'km²', items: [
    ['Rusya', 17098246], ['Kanada', 9984670], ['ABD', 9833520], ['Çin', 9596961], ['Brezilya', 8515767], ['Avustralya', 7692024], ['Hindistan', 3287263],
    ['Arjantin', 2780400], ['Kazakistan', 2724900], ['Cezayir', 2381741], ['İran', 1648195], ['Mısır', 1002450], ['Türkiye', 783562], ['İspanya', 505990],
    ['İsveç', 450295], ['Japonya', 377975], ['Almanya', 357588], ['İtalya', 301340], ['Birleşik Krallık', 243610], ['Yunanistan', 131957], ['Portekiz', 92212], ['İsviçre', 41285]] },
  { id: 'gezegen', q: 'Hangisinin çapı daha büyük?', unit: 'km', items: [
    ['Güneş', 1392700], ['Jüpiter', 139820], ['Satürn', 116460], ['Uranüs', 50724], ['Neptün', 49244], ['Dünya', 12742], ['Venüs', 12104], ['Mars', 6779],
    ['Merkür', 4879], ['Ay', 3474]] },
  { id: 'atom', q: 'Hangisinin atom numarası daha büyük?', unit: '', items: [
    ['Hidrojen', 1], ['Helyum', 2], ['Karbon', 6], ['Azot', 7], ['Oksijen', 8], ['Sodyum', 11], ['Alüminyum', 13], ['Silisyum', 14], ['Klor', 17],
    ['Demir', 26], ['Bakır', 29], ['Çinko', 30], ['Gümüş', 47], ['Kalay', 50], ['Altın', 79], ['Cıva', 80], ['Kurşun', 82], ['Uranyum', 92]] },
  { id: 'olay', q: 'Hangisi daha önce oldu?', unit: '', year: true, less: true, items: [
    ['Malazgirt Savaşı', 1071], ["İstanbul'un fethi", 1453], ["Kolomb'un Amerika'ya ulaşması", 1492], ['Fransız İhtilali', 1789], ['Tanzimat Fermanı', 1839],
    ['Atatürk\'ün doğumu', 1881], ['Eyfel Kulesi\'nin tamamlanması', 1889], ['İlk modern Olimpiyat', 1896], ['Wright kardeşlerin ilk uçuşu', 1903],
    ['Ford Model T', 1908], ['Titanik\'in batışı', 1912], ['Birinci Dünya Savaşı\'nın başlaması', 1914], ['Cumhuriyetin ilanı', 1923], ['İlk FIFA Dünya Kupası', 1930],
    ["Türkiye'nin NATO'ya girişi", 1952], ['TRT\'nin ilk TV yayını', 1968], ["Ay'a ilk ayak basılması", 1969], ['Boğaziçi Köprüsü\'nün açılışı', 1973],
    ['Çernobil kazası', 1986], ['Berlin Duvarı\'nın yıkılışı', 1989], ['Google\'ın kuruluşu', 1998], ['Euro paraların kullanıma girmesi', 2002],
    ["Türkiye'nin Eurovision zaferi", 2003], ["Facebook'un kuruluşu", 2004], ['İlk iPhone', 2007]] },
  { id: 'kulup', q: 'Hangisi daha önce kuruldu?', unit: '', year: true, less: true, items: [
    ['Manchester United', 1878], ['Liverpool', 1892], ['Juventus', 1897], ['Barcelona', 1899], ['Bayern Münih', 1900], ['Real Madrid', 1902],
    ['Beşiktaş', 1903], ['Galatasaray', 1905], ['Fenerbahçe', 1907], ['Trabzonspor', 1967]] }
];
if (typeof module !== 'undefined') module.exports = HANGISI;
