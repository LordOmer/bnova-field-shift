# BNöva – Hackathon Planı (Field Shift)

## Tek cümlelik problem
Türkiye'de birçok tarla ana ürünler arasında aylarca boş kalıyor ve çiftçinin, kendi bölgesinin değişen iklimine göre bu boşluğa hangi ürünü ekeceğini görebileceği basit bir araç yok. Field Shift, 20 yıllık NASA iklim verisiyle bu boşluk için ekim nöbeti önerisi veriyor.

## Önerilen iş bölümü (takımla konuş)
| Kişi | Görev |
|---|---|
| Ömer | Web uygulaması, NASA verisi entegrasyonu, GitHub Pages yayını, demo videosu |
| Berrak | Ürün veritabanını doğrulama (`data/crops.js`), skor ağırlıkları, çok yıllı rotasyon optimizasyonu |
| Nisa Nur | Veri analizi ve trendler (Python), sunum slaytları ve hikâye, gönderim formu (İngilizce) |

## Zaman çizelgesi
| Zaman | Yapılacak |
|---|---|
| Cmt 10:30–11:30 | Takım prototipi incelesin, fikir ve öncelikler netleşsin. NASA'da proje sayfasını aç. |
| Cmt 11:30–13:00 | GitHub repo + Pages yayını. Ürün verisini doğrula. Mentorlara fikri anlat. |
| Cmt 13:00–18:00 | 1–2 güçlü özellik ekle (ör. harita, SMAP/GPM, çok yıllı rotasyon). |
| Cmt 18:00–24:00 | Cilalama, Türkçe/İngilizce, test. Uyku nöbetleşe. |
| Paz 09:30–11:00 | **Özellik ekleme dur.** Demo videosu (≤30 sn) veya ≤7 slayt, sunum provası. |
| Paz 11:00 | Sunum dosyasını organizasyona gönder. |
| Paz 13:00 | Yerel sunum (3–5 dk). |
| Paz öğleden sonra | NASA gönderim formunu doldur, **23:59'dan önce** "Submit for Judging". |

## Sunum akışı (3–5 dk)
1. **Sorun (30 sn):** Boş tarla erozyon ve besin kaybı demek; iklim değişiyor (Yalova'da don günleri 10 yılda yaklaşık 7,5 gün azaldı, sıcaklık +0,5 °C arttı).
2. **Çözüm (30 sn):** Field Shift: konum, ana ürün ve öncelikleri seç, boş pencere için gerekçeli öneriler al.
3. **Demo (2 dk):** Yalova + mısır → kışlık fiğ/yulaf. Sonra buğday → yaz penceresi ve sulama uyarısı. Sonra Konya'yı canlı yükle.
4. **NASA verisi (30 sn):** NASA POWER: sıcaklık, yağış, don, toprak nemi; 2004–2023.
5. **Etki (30 sn):** Türkiye'nin her köşesinde, internet olan her telefonda ücretsiz. Sonraki adım: uzman doğrulaması, SMAP, Tarım İl Müdürlükleri.

## Jürinin muhtemel soruları
- Hangi kısım gerçek, hangisi temsili? → İklim verisi gerçek NASA; ürün parametreleri yaklaşık, doğrulanacak.
- Verinin sınırları? → POWER yaklaşık 50 km çözünürlükte; tarla ölçeği değil, bölge ölçeği.
- YZ'yi nerede kullandınız? → Kod ve metin taslağında Claude; sonuçları ekip kontrol etti.

## Gönderim kontrol listesi
- [ ] Tüm üyeler BNöva'da onaylı ve Yalova'ya kayıtlı
- [ ] Proje adı, özet, ayrıntılı açıklama İngilizce
- [ ] Demo: ≤7 slayt (İngilizce) **veya** ≤30 sn video (İngilizce altyazılı), herkese açık link
- [ ] Final proje linki (GitHub Pages) gizli pencerede açılıyor
- [ ] NASA POWER adı ve linki yazıldı, nasıl kullanıldığı açıklandı
- [ ] YZ kullanımı beyan edildi
- [ ] NASA logosu yok; kaynaklar listelendi
- [ ] "Submit for Judging" Pazar 23:59'dan önce tıklandı
