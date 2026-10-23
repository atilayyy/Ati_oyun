# Ati Oyun

Arkadaşlarla, herkesin kendi cihazından oynadığı küçük oyun platformu.

- **Ati7**: Flip 7 kurallarıyla kart oyunu. 2 ve üzeri oyuncu, hedef 200 puan.
- **Ati Kelime**: Türkçe kelime bulmaca, 4'ten 10 harfe kadar. Kelimeyi bilgisayar seçebilir ya da sırayla siz seçersiniz.
- **Beni Ne Kadar Tanıyorsun?**: 2 kişi. Kendi cevabını ver, arkadaşının cevabını tahmin et. 40 soru.
- **En Çok Neye Sinir Olur?**: 2 kişi. Önce 1. oyuncunun, sonra 2. oyuncunun sinir noktaları tahmin edilir.
- **Sen Hangi Tipsin?**: 2-8 kişi. 12 komik soru, 6 tip; herkes birbirinin tipini tahmin eder.
- **Dört Bağla**: 2 kişi. 4 taşı yan yana getiren kazanır.
- **Amiral Battı**: 2 kişi. Rakibin filosunu ilk batıran kazanır, vurursan tekrar atarsın.

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
