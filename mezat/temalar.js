/* Mezat temaları. Ürün: [ad, emoji, gizli puan, etiket]. Jüri kuralları:
   need: etiketten hiç yoksa ceza · max: etiketten k taneden fazlası için her fazla başına · many: etiketten en az k tane varsa
   combo: listedeki ürünlerin hepsi varsa · with: ürün + etiketten başka biri varsa */
const TEMALAR = {
  burger: {
    name: 'Hamburger', emoji: '🍔', desc: 'En lezzetli hamburgeri kim yapacak? 5 malzeme seç.',
    hints: ['Jüri ekmeksiz ya da köftesiz burger kabul etmez.', 'Bazı malzemeler birbirine çok yakışır.', 'Her şey hamburgerin içine girmez.'],
    tags: { ekmek: 'Ekmek', et: 'Et', peynir: 'Peynir', sebze: 'Sebze', sos: 'Sos', ekstra: 'Ekstra' },
    items: [
      ['Brioche ekmek', '🍞', 9, 'ekmek'], ['Susamlı ekmek', '🍔', 8, 'ekmek'], ['Tam buğday ekmek', '🍞', 6, 'ekmek'], ['Lavaş', '🫓', 3, 'ekmek'],
      ['Dana köfte', '🥩', 14, 'et'], ['Çift köfte', '🥩', 16, 'et'], ['Kuzu köfte', '🍖', 12, 'et'], ['Tavuk göğsü', '🍗', 9, 'et'], ['Vegan köfte', '🌱', 7, 'et'],
      ['Cheddar', '🧀', 8, 'peynir'], ['Kaşar', '🧀', 6, 'peynir'], ['Mozzarella', '🧀', 5, 'peynir'], ['Keçi peyniri', '🐐', 5, 'peynir'],
      ['Marul', '🥬', 4, 'sebze'], ['Domates', '🍅', 4, 'sebze'], ['Soğan', '🧅', 4, 'sebze'], ['Karamelize soğan', '🧅', 7, 'sebze'], ['Turşu', '🥒', 5, 'sebze'],
      ['Jalapeño', '🌶️', 5, 'sebze'], ['Mantar', '🍄', 5, 'sebze'], ['Avokado', '🥑', 6, 'sebze'],
      ['Ketçap', '🍅', 4, 'sos'], ['Mayonez', '🥚', 4, 'sos'], ['Hardal', '🌭', 3, 'sos'], ['Barbekü sosu', '🔥', 6, 'sos'], ['Ranch sos', '🥛', 5, 'sos'], ['Acı sos', '🌶️', 4, 'sos'],
      ['Bacon', '🥓', 10, 'ekstra'], ['Kızarmış yumurta', '🍳', 7, 'ekstra'], ['Soğan halkası', '⭕', 6, 'ekstra'], ['Ananas', '🍍', 2, 'ekstra'],
      ['Patates kızartması', '🍟', 5, 'ekstra'], ['Çikolata sosu', '🍫', -6, 'ekstra'], ['Lokum', '🍬', -4, 'ekstra']
    ],
    rules: [
      { t: 'need', tag: 'ekmek', pts: -12, msg: 'Ekmeksiz hamburger mi olur?' },
      { t: 'need', tag: 'et', pts: -10, msg: 'Köftesiz burger salata olmuş.' },
      { t: 'max', tag: 'ekmek', k: 1, pts: -6, msg: 'Bu kadar ekmek fazla, hamur yiyoruz.' },
      { t: 'max', tag: 'sos', k: 2, pts: -3, msg: 'Burger sosun içinde yüzüyor.' },
      { t: 'many', tag: 'sebze', k: 2, pts: 4, msg: 'Taze ve dengeli.' },
      { t: 'combo', items: ['Cheddar', 'Bacon'], pts: 6, msg: 'Cheddar ve bacon, efsane ikili.' },
      { t: 'combo', items: ['Dana köfte', 'Cheddar'], pts: 4, msg: 'Klasik cheeseburger.' },
      { t: 'combo', items: ['Karamelize soğan', 'Keçi peyniri'], pts: 5, msg: 'Gurme dokunuş.' },
      { t: 'combo', items: ['Turşu', 'Hardal'], pts: 3, msg: 'Turşu ve hardal birbirini tamamlıyor.' },
      { t: 'combo', items: ['Ketçap', 'Mayonez'], pts: 3, msg: 'Ketçap-mayonez, herkesin sevdiği.' },
      { t: 'combo', items: ['Ananas', 'Barbekü sosu'], pts: 5, msg: 'Hawaii usulü, jüri şaşırdı ama sevdi.' },
      { t: 'combo', items: ['Jalapeño', 'Acı sos'], pts: 3, msg: 'Ağızda yangın, cesaret ödülü.' },
      { t: 'combo', items: ['Avokado', 'Tavuk göğsü'], pts: 3, msg: 'Fit burger.' },
      { t: 'combo', items: ['Barbekü sosu', 'Soğan halkası'], pts: 4, msg: 'Barbekü ve soğan halkası, tam kıvamında.' }
    ]
  },
  pizza: {
    name: 'Pizza', emoji: '🍕', desc: 'Hayalindeki pizzayı kur. Hamur, sos, peynir, üstü sende.',
    hints: ['Hamursuz ve peynirsiz pizza jüriyi kızdırır.', 'İtalyan klasikleri ekstra puan alır.', 'Tartışmalı malzemeler riskli.'],
    tags: { hamur: 'Hamur', sos: 'Sos', peynir: 'Peynir', et: 'Et', sebze: 'Sebze', garip: 'Sürpriz' },
    items: [
      ['İnce hamur', '🫓', 9, 'hamur'], ['Napoliten hamur', '🍕', 10, 'hamur'], ['Kalın hamur', '🥖', 6, 'hamur'],
      ['Domates sosu', '🍅', 8, 'sos'], ['Pesto', '🌿', 6, 'sos'], ['Krema sosu', '🥛', 5, 'sos'], ['Barbekü sosu', '🔥', 4, 'sos'],
      ['Mozzarella', '🧀', 10, 'peynir'], ['Parmesan', '🧀', 7, 'peynir'], ['Gorgonzola', '🧀', 6, 'peynir'], ['Kaşar', '🧀', 5, 'peynir'],
      ['Sucuk', '🌭', 8, 'et'], ['Pepperoni', '🍕', 9, 'et'], ['Salam', '🥓', 6, 'et'], ['Jambon', '🍖', 6, 'et'], ['Tavuk', '🍗', 6, 'et'],
      ['Kavurma', '🥩', 7, 'et'], ['Ton balığı', '🐟', 4, 'et'], ['Ançüez', '🐟', 3, 'et'],
      ['Mantar', '🍄', 5, 'sebze'], ['Zeytin', '🫒', 5, 'sebze'], ['Fesleğen', '🌿', 6, 'sebze'], ['Roka', '🥬', 5, 'sebze'], ['Cherry domates', '🍅', 5, 'sebze'],
      ['Biber', '🫑', 4, 'sebze'], ['Mısır', '🌽', 3, 'sebze'], ['Soğan', '🧅', 3, 'sebze'], ['Enginar', '🌱', 4, 'sebze'], ['Ananas', '🍍', 1, 'sebze'],
      ['Yumurta', '🥚', 3, 'garip'], ['Patates kızartması', '🍟', 1, 'garip'], ['Ketçap', '🍅', -3, 'garip'], ['Çikolata', '🍫', -6, 'garip']
    ],
    rules: [
      { t: 'need', tag: 'hamur', pts: -12, msg: 'Hamursuz pizza, tabakta malzeme yığını.' },
      { t: 'need', tag: 'peynir', pts: -6, msg: 'Peynirsiz pizza mı?' },
      { t: 'max', tag: 'hamur', k: 1, pts: -6, msg: 'İki hamur üst üste, lazanya oldu.' },
      { t: 'max', tag: 'sos', k: 1, pts: -3, msg: 'Soslar birbirine karıştı.' },
      { t: 'combo', items: ['Domates sosu', 'Mozzarella', 'Fesleğen'], pts: 9, msg: 'Margarita! Jüri ayağa kalktı.' },
      { t: 'combo', items: ['Napoliten hamur', 'Mozzarella'], pts: 3, msg: 'Napoli usulü temel.' },
      { t: 'combo', items: ['Sucuk', 'Kaşar'], pts: 4, msg: 'Türk usulü, sucuklu kaşarlı.' },
      { t: 'combo', items: ['Pepperoni', 'Mozzarella'], pts: 4, msg: 'Pepperoni klasiği.' },
      { t: 'combo', items: ['Roka', 'Parmesan'], pts: 4, msg: 'Roka ve parmesan, şık bir bitiş.' },
      { t: 'combo', items: ['Gorgonzola', 'Parmesan'], pts: 3, msg: 'Peynir sever pizzası.' },
      { t: 'combo', items: ['Ananas', 'Jambon'], pts: 4, msg: 'Hawaii pizza: tartışmalı ama tutuyor.' },
      { t: 'combo', items: ['Ton balığı', 'Ananas'], pts: -4, msg: 'Ton balığı ve ananas... jüri ağladı.' },
      { t: 'combo', items: ['Pesto', 'Tavuk'], pts: 3, msg: 'Pestolu tavuk, hafif ve lezzetli.' }
    ]
  },
  kahvalti: {
    name: 'Türk Kahvaltısı', emoji: '🍳', desc: 'Pazar sabahı efsane bir kahvaltı sofrası kur.',
    hints: ['Çaysız, ekmeksiz, peynirsiz kahvaltı olmaz.', 'Bazı ikililer sofranın yıldızıdır.', 'İki sıcak yumurta yemeği fazla gelebilir.'],
    tags: { peynir: 'Peynir', zeytin: 'Zeytin', sicak: 'Yumurta', hamur: 'Ekmek & hamur işi', tatli: 'Tatlı', sebze: 'Sebze', et: 'Şarküteri', icecek: 'İçecek' },
    items: [
      ['Beyaz peynir', '🧀', 8, 'peynir'], ['Kaşar', '🧀', 7, 'peynir'], ['Tulum peyniri', '🧀', 8, 'peynir'], ['Çökelek', '🧀', 5, 'peynir'], ['Hellim', '🧀', 7, 'peynir'],
      ['Siyah zeytin', '🫒', 7, 'zeytin'], ['Yeşil zeytin', '🫒', 6, 'zeytin'],
      ['Menemen', '🍳', 12, 'sicak'], ['Sucuklu yumurta', '🍳', 12, 'sicak'], ['Haşlanmış yumurta', '🥚', 6, 'sicak'], ['Omlet', '🍳', 7, 'sicak'], ['Kuymak', '🫕', 11, 'sicak'],
      ['Simit', '🥯', 9, 'hamur'], ['Taze ekmek', '🍞', 8, 'hamur'], ['Pişi', '🫓', 9, 'hamur'], ['Su böreği', '🥧', 10, 'hamur'], ['Poğaça', '🥐', 7, 'hamur'], ['Gözleme', '🫓', 9, 'hamur'], ['Sigara böreği', '🥖', 8, 'hamur'],
      ['Bal-kaymak', '🍯', 12, 'tatli'], ['Reçel', '🍓', 6, 'tatli'], ['Tahin-pekmez', '🥄', 8, 'tatli'], ['Fındık kreması', '🍫', 5, 'tatli'],
      ['Domates', '🍅', 5, 'sebze'], ['Salatalık', '🥒', 5, 'sebze'], ['Biber', '🫑', 3, 'sebze'],
      ['Sucuk', '🌭', 9, 'et'], ['Pastırma', '🥩', 8, 'et'], ['Patates kızartması', '🍟', 6, 'et'],
      ['Demlik çay', '🫖', 12, 'icecek'], ['Türk kahvesi', '☕', 6, 'icecek'], ['Portakal suyu', '🍊', 5, 'icecek'], ['Kola', '🥤', 0, 'icecek']
    ],
    rules: [
      { t: 'need', tag: 'icecek', pts: -8, msg: 'Çaysız kahvaltı, boğazda kaldı.' },
      { t: 'need', tag: 'hamur', pts: -6, msg: 'Ekmeksiz kahvaltı olmaz.' },
      { t: 'need', tag: 'peynir', pts: -5, msg: 'Sofrada peynir yok!' },
      { t: 'max', tag: 'sicak', k: 1, pts: -3, msg: 'İki yumurta yemeği, ağır geldi.' },
      { t: 'many', tag: 'peynir', k: 2, pts: 3, msg: 'Zengin peynir tabağı.' },
      { t: 'combo', items: ['Simit', 'Demlik çay'], pts: 5, msg: 'Simit ve çay, klasik.' },
      { t: 'combo', items: ['Bal-kaymak', 'Taze ekmek'], pts: 4, msg: 'Bal-kaymağı ekmeğe sürmek.' },
      { t: 'combo', items: ['Menemen', 'Taze ekmek'], pts: 4, msg: 'Menemene ekmek banmak paha biçilemez.' },
      { t: 'combo', items: ['Beyaz peynir', 'Domates'], pts: 3, msg: 'Peynir-domates, sade ve güzel.' },
      { t: 'combo', items: ['Tahin-pekmez', 'Simit'], pts: 3, msg: 'Tahin-pekmezle simit.' },
      { t: 'combo', items: ['Kola', 'Demlik çay'], pts: -3, msg: 'Kahvaltıda kola? Jüri kaşlarını çattı.' },
      { t: 'combo', items: ['Siyah zeytin', 'Beyaz peynir'], pts: 3, msg: 'Zeytin ve peynir, sofranın temeli.' }
    ]
  },
  kahraman: {
    name: 'Süper Kahraman Kadrosu', emoji: '🦸', desc: 'Dünyayı kurtaracak en güçlü 5 kişilik kadroyu kur.',
    hints: ['Aynı ekipten olanlar birlikte daha güçlü.', 'Bazı kahramanlar birbirini tamamlar.', 'Kötü adam almak riskli olabilir.'],
    tags: { dc: 'DC', marvel: 'Marvel', yerli: 'Bizden', kotu: 'Kötü adam' },
    items: [
      ['Superman', '🦸‍♂️', 16, 'dc'], ['Wonder Woman', '🦸‍♀️', 13, 'dc'], ['Batman', '🦇', 11, 'dc'], ['Flash', '⚡', 12, 'dc'], ['Aquaman', '🔱', 8, 'dc'],
      ['Yeşil Fener', '💚', 11, 'dc'], ['Shazam', '⚡', 10, 'dc'], ['Robin', '🐦', 4, 'dc'],
      ['Thor', '🔨', 14, 'marvel'], ['Hulk', '💪', 13, 'marvel'], ['Demir Adam', '🤖', 11, 'marvel'], ['Kaptan Amerika', '🛡️', 9, 'marvel'], ['Örümcek Adam', '🕷️', 10, 'marvel'],
      ['Doktor Strange', '🌀', 13, 'marvel'], ['Scarlet Witch', '🔮', 14, 'marvel'], ['Kaptan Marvel', '✨', 14, 'marvel'], ['Kara Panter', '🐆', 9, 'marvel'],
      ['Wolverine', '🗡️', 10, 'marvel'], ['Kara Dul', '🕸️', 7, 'marvel'], ['Ant-Man', '🐜', 6, 'marvel'], ['Hawkeye', '🏹', 5, 'marvel'], ['Deadpool', '😈', 8, 'marvel'],
      ['Kara Murat', '⚔️', 9, 'yerli'], ['Temel Reis', '🥫', 8, 'yerli'], ['Terlikli Anne', '🩴', 12, 'yerli'], ['Mahalle Teyzesi', '👵', 6, 'yerli'],
      ['Kanepe Adam', '🛋️', 1, 'yerli'], ['Uykucu Kedi', '🐈', 2, 'yerli'],
      ['Joker', '🃏', -4, 'kotu'], ['Thanos', '🧤', 15, 'kotu']
    ],
    rules: [
      { t: 'many', tag: 'dc', k: 3, pts: 5, msg: 'Adalet Birliği kuruldu.' },
      { t: 'many', tag: 'marvel', k: 3, pts: 5, msg: 'Yenilmezler toplandı.' },
      { t: 'many', tag: 'yerli', k: 2, pts: 3, msg: 'Yerli ve milli güç.' },
      { t: 'with', item: 'Thanos', tag: 'marvel', pts: -12, msg: 'Thanos şıklattı, Marvel kahramanlarının yarısı yok oldu.' },
      { t: 'combo', items: ['Superman', 'Batman'], pts: 6, msg: 'Dünyanın en iyi ikilisi.' },
      { t: 'combo', items: ['Batman', 'Robin'], pts: 4, msg: 'Batman ve Robin, eski dostlar.' },
      { t: 'combo', items: ['Superman', 'Wonder Woman'], pts: 4, msg: 'Göklerin hâkimleri.' },
      { t: 'combo', items: ['Thor', 'Hulk'], pts: 4, msg: 'Güç ikilisi.' },
      { t: 'combo', items: ['Demir Adam', 'Kaptan Amerika'], pts: 3, msg: 'Kavgalı ama birlikte güçlüler.' },
      { t: 'combo', items: ['Hulk', 'Kara Dul'], pts: 3, msg: 'Hulk\'u sakinleştirebilen tek kişi yanında.' },
      { t: 'combo', items: ['Temel Reis', 'Terlikli Anne'], pts: 4, msg: 'Ispanak ve terlik, durdurulamaz ikili.' },
      { t: 'combo', items: ['Joker', 'Batman'], pts: -5, msg: 'Joker kadroda, Batman işini yapamıyor.' },
      { t: 'combo', items: ['Kanepe Adam', 'Uykucu Kedi'], pts: 3, msg: 'Hiçbir şey yapmadılar ama moral verdiler.' }
    ]
  },
  futbol: {
    name: 'Rüya Futbol Takımı', emoji: '⚽', desc: 'Efsanelerden 5 kişilik halı saha kadrosu kur.',
    hints: ['Kalecisiz takım gol yağmuruna tutulur.', 'Defans ve forvet de lazım.', 'Aynı takımda oynamış ikililer bonus getirir.'],
    tags: { kaleci: 'Kaleci', defans: 'Defans', orta: 'Orta saha', forvet: 'Forvet' },
    items: [
      ['Lev Yaşin', '🧤', 11, 'kaleci'], ['Gianluigi Buffon', '🧤', 10, 'kaleci'], ['Manuel Neuer', '🧤', 10, 'kaleci'], ['Rüştü Reçber', '🧤', 8, 'kaleci'], ['Volkan Demirel', '🧤', 6, 'kaleci'],
      ['Paolo Maldini', '🛡️', 12, 'defans'], ['Franz Beckenbauer', '🛡️', 12, 'defans'], ['Sergio Ramos', '🛡️', 10, 'defans'], ['Virgil van Dijk', '🛡️', 10, 'defans'],
      ['Cafu', '🛡️', 10, 'defans'], ['Roberto Carlos', '🛡️', 10, 'defans'], ['Carles Puyol', '🛡️', 9, 'defans'], ['Bülent Korkmaz', '🛡️', 7, 'defans'],
      ['Zinedine Zidane', '🎯', 14, 'orta'], ['Andrés Iniesta', '🎯', 12, 'orta'], ['Xavi', '🎯', 11, 'orta'], ['Luka Modrić', '🎯', 12, 'orta'], ['Andrea Pirlo', '🎯', 11, 'orta'],
      ['Gheorghe Hagi', '🎯', 11, 'orta'], ['Alex de Souza', '🎯', 10, 'orta'], ['Emre Belözoğlu', '🎯', 8, 'orta'], ['Tugay Kerimoğlu', '🎯', 8, 'orta'], ['Arda Turan', '🎯', 8, 'orta'],
      ['Pelé', '⚽', 16, 'forvet'], ['Lionel Messi', '⚽', 16, 'forvet'], ['Diego Maradona', '⚽', 15, 'forvet'], ['Cristiano Ronaldo', '⚽', 15, 'forvet'], ['Ronaldo Nazário', '⚽', 14, 'forvet'],
      ['Zlatan İbrahimović', '⚽', 11, 'forvet'], ['Hakan Şükür', '⚽', 10, 'forvet'], ['Metin Oktay', '⚽', 9, 'forvet']
    ],
    rules: [
      { t: 'need', tag: 'kaleci', pts: -12, msg: 'Kalecisiz takım, kale bomboş.' },
      { t: 'max', tag: 'kaleci', k: 1, pts: -7, msg: 'İki kaleci aynı anda kaleye giremez.' },
      { t: 'need', tag: 'defans', pts: -6, msg: 'Defans yok, her atak gol.' },
      { t: 'need', tag: 'forvet', pts: -6, msg: 'Gol atacak kimse yok.' },
      { t: 'max', tag: 'forvet', k: 2, pts: -3, msg: 'Herkes forvet, kimse geri dönmüyor.' },
      { t: 'combo', items: ['Xavi', 'Andrés Iniesta'], pts: 5, msg: 'Barcelona orta sahası, top hiç kaybedilmez.' },
      { t: 'combo', items: ['Lionel Messi', 'Xavi'], pts: 3, msg: 'Xavi\'den Messi\'ye, ezber pas.' },
      { t: 'combo', items: ['Gheorghe Hagi', 'Bülent Korkmaz'], pts: 4, msg: '2000 UEFA Kupası ruhu.' },
      { t: 'combo', items: ['Rüştü Reçber', 'Hakan Şükür'], pts: 3, msg: '2002 Dünya Kupası üçüncülüğü.' },
      { t: 'combo', items: ['Paolo Maldini', 'Andrea Pirlo'], pts: 3, msg: 'Milan uyumu.' },
      { t: 'combo', items: ['Sergio Ramos', 'Cristiano Ronaldo'], pts: 3, msg: 'Real Madrid yılları.' },
      { t: 'combo', items: ['Lionel Messi', 'Cristiano Ronaldo'], pts: 2, msg: 'Penaltıyı kim atacak, kavga çıktı ama yine de güçlü.' },
      { t: 'combo', items: ['Pelé', 'Diego Maradona'], pts: 2, msg: 'İki efsane aynı sahada.' }
    ]
  },
  zombi: {
    name: 'Zombi Kıyameti Çantası', emoji: '🧟', desc: 'Zombiler geldi! Çantana 5 şey alabilirsin.',
    hints: ['Silahsız ve yiyeceksiz hayatta kalamazsın.', 'Bazı eşyalar ancak ikilisiyle işe yarar.', 'Gürültü zombileri çeker.'],
    tags: { silah: 'Silah', temel: 'Temel ihtiyaç', alet: 'Alet', arac: 'Araç', dost: 'Dost', gereksiz: 'Keyfî' },
    items: [
      ['Beyzbol sopası', '🏏', 7, 'silah'], ['Katana', '🗡️', 10, 'silah'], ['Av tüfeği', '🔫', 11, 'silah'], ['Pala', '🔪', 8, 'silah'], ['Tava', '🍳', 6, 'silah'], ['Çivi tabancası', '🔨', 6, 'silah'],
      ['10 litre su', '💧', 12, 'temel'], ['Konserve kolisi', '🥫', 10, 'temel'], ['İlk yardım çantası', '🩹', 11, 'temel'],
      ['Fener', '🔦', 7, 'alet'], ['Pil', '🔋', 4, 'alet'], ['Telsiz', '📻', 6, 'alet'], ['Harita', '🗺️', 6, 'alet'], ['Çakı', '🔪', 8, 'alet'], ['Kibrit', '🔥', 6, 'alet'],
      ['Koli bandı', '🩶', 7, 'alet'], ['Dürbün', '🔭', 5, 'alet'], ['Çadır', '⛺', 6, 'alet'], ['Uyku tulumu', '🛌', 6, 'alet'],
      ['Bisiklet', '🚲', 8, 'arac'], ['Motosiklet', '🏍️', 9, 'arac'], ['Benzin bidonu', '⛽', 5, 'arac'], ['Kaykay', '🛹', 3, 'arac'],
      ['Sadık köpek', '🐕', 9, 'dost'], ['Kedi', '🐈', 3, 'dost'],
      ['Gitar', '🎸', 2, 'gereksiz'], ['Kolonya', '🧴', 3, 'gereksiz'], ['Selfie çubuğu', '🤳', 0, 'gereksiz'], ['Davul', '🥁', -4, 'gereksiz'], ['Zombi rehber kitabı', '📕', 4, 'gereksiz']
    ],
    rules: [
      { t: 'need', tag: 'silah', pts: -10, msg: 'Silah yok, ilk zombide yakalandın.' },
      { t: 'need', tag: 'temel', pts: -8, msg: 'Su ve yiyecek yok, üçüncü gün bitti.' },
      { t: 'max', tag: 'arac', k: 1, pts: -3, msg: 'İki araç birden kullanılmaz.' },
      { t: 'combo', items: ['Motosiklet', 'Benzin bidonu'], pts: 5, msg: 'Benzinli motor, uzaklara kaçış.' },
      { t: 'combo', items: ['Fener', 'Pil'], pts: 4, msg: 'Fener pilsiz yanmaz, sende ikisi de var.' },
      { t: 'combo', items: ['Telsiz', 'Pil'], pts: 3, msg: 'Telsiz çalışıyor, kurtarma ekibine ulaştın.' },
      { t: 'combo', items: ['Çadır', 'Uyku tulumu'], pts: 3, msg: 'Geceyi rahat geçirdin.' },
      { t: 'combo', items: ['Sadık köpek', 'Konserve kolisi'], pts: 2, msg: 'Köpeğin de karnı doydu, seni koruyor.' },
      { t: 'combo', items: ['Harita', 'Dürbün'], pts: 3, msg: 'Güvenli yolu buldun.' },
      { t: 'combo', items: ['Gitar', 'Kibrit'], pts: 2, msg: 'Kamp ateşi başında moral yükseldi.' },
      { t: 'combo', items: ['Davul', 'Gitar'], pts: -3, msg: 'Konser verdin, bütün zombiler geldi.' }
    ]
  }
};
if (typeof module !== 'undefined') module.exports = TEMALAR;
