# Ati Oyun

Arkadaşlarla, herkesin kendi cihazından oynadığı küçük oyun platformu.

- **Mezat**: 2-6 kişi (bilgisayar eklenebilir). 20 TL bütçeyle sırayla teklif verip 5 ürünlük kadro kur; jüri gizli puanlar ve ikili bonuslarıyla kazananı seçer. Temalar: hamburger, pizza, Türk kahvaltısı, sokak lezzetleri, süper kahraman, süper güçler, rüya futbol takımı, zombi çantası, rüya tatil, hayalindeki ev, ev arkadaşı, müzik grubu. Sıradaki ürünler gizlidir.
- **Bayrak & Başkent**: 2-8 kişi. Bayraktan ülkeyi, ülkeden başkenti bul; şıklar aynı bölgeden. Veri: mledoze/countries (ODbL), bayraklar: lipis/flag-icons (MIT).
- **Kemer**: 2-10 kişi (bilgisayar eklenebilir). 6 nimmt! kurallarından esinlenen kart oyunu: sıranın 6. kartını koyan cezayı alır.
- **Casus**: 3-12 kişi. Herkes mekânı bilir, casus bilmez.
- **Kim Bu?**: 2-10 kişi. Alnındaki gizli kimliği evet/hayır sorularıyla bul.
- **İki Doğru Bir Yalan**: 3-10 kişi. Yalanı bul, arkadaşlarını kandır.
- **Vampir Köylü**: 4-12 kişi. Gizli roller (vampir, köylü, doktor, gözcü); anlatıcı oyunun kendisi.
- **Blöf Sözlük**: 2-8 kişi. Az bilinen kelimelere uydurma anlam yaz, gerçeği oyla.
- **Harita Tahmini**: 2-8 kişi. Şehrin yerini yazısız haritada işaretle; Türkiye (81 il) ve dünya modu. Harita: Natural Earth, koordinatlar: GeoNames.
- **Hangisi Daha Çok?**: 2-8 kişi. İki seçenekten doğruyu hızlıca seç.
- **Sayı Bulmaca**: 2 kişi. Gizli sayıyı +/− ipuçlarıyla önce bulan kazanır.
- **Aynı Kafa**: 2-8 kişi. Aynı cevabı yazanlar puan alır.
- **Ati7**: Flip 7 kurallarıyla kart oyunu. 2 ve üzeri oyuncu, hedef 200 puan. Lobide "Acımasız" mod seçilirse Flip 7: With a Vengeance kurallarıyla oynanır.
- **Kelime Bulmaca**: Türkçe kelime bulmaca, 4'ten 10 harfe kadar. Kelimeyi bilgisayar seçebilir ya da sırayla siz seçersiniz. Düello modunda aynı kelimeyi aynı tahtada sırayla tahmin edersiniz, bilen turu alır.
- **Pati Yarışı**: 2-8 yarışçı, tek ekranda izlenir. Kedi ve köpek misketler parkurda yarışır, eksik kişiyi bilgisayar tamamlar.
- **Tahmin Düellosu**: 2-8 kişi. Şıksız sayı tahmini; gerçeğe en yakın olan turu alır.
- **Karne**: 2 kişi. Birbirinizin sevilen ve sinir bozan yanlarına 1-10 puan verin, kaç alacağınızı tahmin edin; sonunda karne çıkar.
- **Bilgi Yarışması**: 2-8 kişi, aynı soruya aynı anda cevap, hız bonusu. 7 kategoride 166 soru.
- **Adam Asmaca**: 2 kişi, sırayla kelime seçip bulma.
- **Kim Önce Basar**: 2-4 kişi refleks oyunu; tepki süresi her cihazda ölçülür, normal ve kandırmaca modu.
- **Hafıza Kartları**: 2-4 kişi, kedi ve köpek kartlarıyla eş bulma.
- **Dört Bağla**: 2 kişi. 4 taşı yan yana getiren kazanır.
- **Amiral Battı**: 2 kişi, 3D. Gemilerini kendin diz ya da rastgele bırak. Rakibin filosunu ilk batıran kazanır, vurursan tekrar atarsın.

## Nasıl çalışıyor?

Bir kişi oda açar, 4 haneli bir kod çıkar. Diğerleri bu kodla katılır. Oyunun asıl durumu odayı açan kişinin tarayıcısında tutulur, bu yüzden **odayı açan kişi sayfayı kapatırsa oyun biter**.

Cihazlar birbirine doğrudan bağlanır (WebRTC). Eşleşme için PeerJS'in ücretsiz genel sunucusu kullanılır, ayrıca bir sunucu kurmana gerek yok.

## GitHub Pages'te yayınlama

1. github.com'da ücretsiz hesap aç.
2. Sağ üstteki **+** menüsünden **New repository** de. Adına `ati-oyun` yaz, **Public** seç, **Create repository** de.
3. Açılan sayfada **uploading an existing file** linkine tıkla.
4. Zip'i bilgisayarında aç. İçindeki **dosya ve klasörlerin hepsini** (index.html, assets, ati7, kelime, README.md) sürükleyip bırak. Klasörün kendisini değil, içindekileri sürükle.
5. Aşağıdaki **Commit changes** düğmesine bas.
6. Repo'da **Settings** → soldan **Pages** → **Branch** kısmında `main` ve `/ (root)` seç → **Save**.
7. 1-2 dakika sonra site şu adreste açılır: `https://KULLANICI-ADIN.github.io/ati-oyun/`

## Kaynaklar

- Kelime listeleri: [mertemin/turkish-word-list](https://github.com/mertemin/turkish-word-list) (Vikisözlük) ve [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords) (OpenSubtitles sıklık verisi).
- Bağlantı: [PeerJS](https://peerjs.com).
- Flip 7, The Op Games'in oyunudur. Ati7 kişisel kullanım için yapılmış, kurallarından esinlenen bir hayran uyarlamasıdır.
- 6 nimmt!, Wolfgang Kramer'in tasarladığı, Amigo Spiele'nin oyunudur. Kemer kişisel kullanım için yapılmış, kurallarından esinlenen bir hayran uyarlamasıdır.
