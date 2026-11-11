/* Kim Bu? kimlikleri: [ad, kategori, ek kabul edilen yazılışlar] */
const KIMLIK = [
  ['Kemal Sunal', 'tr'], ['Barış Manço', 'tr'], ['Tarkan', 'tr'], ['Sezen Aksu', 'tr'], ['Cem Yılmaz', 'tr'], ['Şener Şen', 'tr'], ['Türkan Şoray', 'tr'],
  ['Fatih Terim', 'tr'], ['Hidayet Türkoğlu', 'tr', ['Hedo']], ['Naim Süleymanoğlu', 'tr', ['Cep Herkülü']], ['Arda Güler', 'tr'], ['Hakan Şükür', 'tr'],
  ['Ajda Pekkan', 'tr'], ['Müslüm Gürses', 'tr', ['Müslüm Baba']], ['Zeki Müren', 'tr'], ['Haluk Bilginer', 'tr'], ['Kıvanç Tatlıtuğ', 'tr'],
  ['Acun Ilıcalı', 'tr'], ['Nasreddin Hoca', 'tr'], ['Mimar Sinan', 'tr'], ['Fatih Sultan Mehmet', 'tr', ['Fatih', 'II. Mehmet']], ['Kanuni Sultan Süleyman', 'tr', ['Kanuni']],
  ['Aziz Sancar', 'tr'], ['Orhan Pamuk', 'tr'], ['Nazım Hikmet', 'tr'], ['Neşet Ertaş', 'tr'], ['Ferdi Tayfur', 'tr'],
  ['Lionel Messi', 'dunya'], ['Cristiano Ronaldo', 'dunya'], ['Michael Jordan', 'dunya'], ['LeBron James', 'dunya'], ['Albert Einstein', 'dunya'],
  ['William Shakespeare', 'dunya'], ['Leonardo da Vinci', 'dunya', ['Da Vinci']], ['Napolyon', 'dunya', ['Napolyon Bonapart', 'Napoleon']], ['Kleopatra', 'dunya'],
  ['Elvis Presley', 'dunya'], ['Michael Jackson', 'dunya'], ['Charlie Chaplin', 'dunya', ['Şarlo']], ['Mozart', 'dunya'], ['Pablo Picasso', 'dunya'],
  ['Usain Bolt', 'dunya'], ['Isaac Newton', 'dunya'], ['Marie Curie', 'dunya'], ['Steve Jobs', 'dunya'], ['Bill Gates', 'dunya'], ['Taylor Swift', 'dunya'],
  ['Kristof Kolomb', 'dunya', ['Kolomb', 'Kolombus']], ['Neil Armstrong', 'dunya'], ['Muhammed Ali', 'dunya', ['Muhammad Ali']], ['Roger Federer', 'dunya'],
  ['Kobe Bryant', 'dunya'], ['Diego Maradona', 'dunya'], ['Mona Lisa', 'dunya'],
  ['Harry Potter', 'karakter'], ['Sherlock Holmes', 'karakter'], ['Süpermen', 'karakter', ['Superman']], ['Batman', 'karakter'], ['Örümcek Adam', 'karakter', ['Spiderman', 'Spider-Man']],
  ['Temel Reis', 'karakter', ['Popeye']], ['Pembe Panter', 'karakter'], ['Mickey Mouse', 'karakter', ['Miki Fare']], ['Keloğlan', 'karakter'], ['İnek Şaban', 'karakter'],
  ['Pinokyo', 'karakter'], ['Kırmızı Başlıklı Kız', 'karakter'], ['Noel Baba', 'karakter'], ['Drakula', 'karakter', ['Dracula', 'Kont Drakula']], ['Shrek', 'karakter'],
  ['Şirine', 'karakter'], ['Sünger Bob', 'karakter', ['SpongeBob']], ['Garfield', 'karakter'], ['Tarzan', 'karakter'], ['Pikachu', 'karakter'], ['Süper Mario', 'karakter', ['Mario']],
  ['Hulk', 'karakter'], ['Simba', 'karakter'], ['Pamuk Prenses', 'karakter'], ['Karagöz', 'karakter'], ['Hacivat', 'karakter'], ['Şirinbaba', 'karakter', ['Şirin Baba']],
  ['Tom (Tom ve Jerry)', 'karakter', ['Tom']], ['Jerry (Tom ve Jerry)', 'karakter', ['Jerry']], ['Heidi', 'karakter'], ['Pokemon Ash', 'karakter', ['Ash']],
  ['Zürafa', 'hayvan'], ['Penguen', 'hayvan'], ['Kanguru', 'hayvan'], ['Ahtapot', 'hayvan'], ['Fil', 'hayvan'], ['Panda', 'hayvan'], ['Yunus', 'hayvan'], ['Deve', 'hayvan'],
  ['Kirpi', 'hayvan'], ['Baykuş', 'hayvan'], ['Timsah', 'hayvan'], ['Papağan', 'hayvan'], ['Koala', 'hayvan'], ['Tavus kuşu', 'hayvan'], ['Kaplumbağa', 'hayvan'],
  ['Zebra', 'hayvan'], ['Kutup ayısı', 'hayvan'], ['Köpekbalığı', 'hayvan'], ['Arı', 'hayvan'], ['Sincap', 'hayvan']
];
if (typeof module !== 'undefined') module.exports = KIMLIK;
