# Field Shift – Presentation (max 7 slides, 3–5 min)

Team BNova · NASA Space Apps Challenge 2026 · Yalova
Slide text in English (judges + submission). Speaker notes (konuşma notu) in Turkish.
Rules: no NASA logo, flag or emblem on slides. Numbers marked **[check in app]** must be copied from the live demo before presenting.

Suggested timing: 1) 30 s · 2) 30 s · 3) 75 s · 4) 40 s · 5) 40 s · 6) 30 s · 7) 35 s ≈ 4.5 min

---

## Slide 1 – The problem

**Bare fields, same crop, changing climate**
- Many fields stay **bare for months** between main crops (e.g. after silage maize, all winter)
- Same crop every year → soil loses cover, organic matter and nitrogen; pests build up
- Climate is shifting: Yalova 2004–2023 → **+0.53 °C / decade, −7.5 frost days / decade**
- Farmers lack a simple, local, evidence-based way to choose a better rotation

**Konuşma notu:**
Merhaba, biz BNova. Türkiye'de pek çok tarla iki ana ürün arasında aylarca boş kalıyor. Mesela silajlık mısırdan sonra tarla bütün kış çıplak duruyor; kış yağmuru doğrudan toprağa vuruyor, toprak ve besin kaybı oluyor. Üstüne her yıl aynı ürün ekiliyor, bu da hastalık ve zararlıyı artırıyor. Bir de iklim değişiyor: NASA verisine göre Yalova'da son 20 yılda sıcaklık on yılda yaklaşık yarım derece arttı, don günleri on yılda yedi buçuk gün azaldı. Çiftçinin elinde kendi bölgesine göre "hangi nöbeti yapayım" sorusunu cevaplayan basit bir araç yok.

---

## Slide 2 – Our solution: Field Shift

**A free crop rotation planner powered by NASA data**
- Pick a location → 20 years of **NASA POWER** climate data load automatically
- Enter your current rotation, priorities and irrigation
- Compare **3 strategies over 3 years**: current · current + cover crops · optimizer's best
- Each plan: **0–100 score**, why, NASA evidence, benefits, gaps, risks
- Works on any phone browser · English / Turkish · no install, no account

**Konuşma notu:**
Çözümümüz Field Shift. Telefondan açılan ücretsiz bir web uygulaması. Konumu seçiyorsunuz, NASA POWER'dan 20 yıllık iklim verisi geliyor. Çiftçi şu anki ekim düzenini, önceliklerini, mesela su tasarrufu, azot, yem ya da gelir, ve sulama imkânı olup olmadığını giriyor. Uygulama üç stratejiyi üç yıllık olarak karşılaştırıyor: bugünkü düzen, aynı düzene örtü bitkisi eklenmiş hali ve optimizasyonun bulduğu en iyi rotasyonlar. Her birinin 0–100 puanı ve gerekçesi var. Türkçe ve İngilizce çalışıyor, kurulum gerektirmiyor.

---

## Slide 3 – Demo flow

**Yalova + silage maize every year**
1. Location: **Yalova** → monthly calendar: rain, temperature, frost days, soil wetness; bare winter months highlighted
2. Current rotation: **silage maize → silage maize → silage maize**, bare in winter
3. Rotation comparison:
   - A. Current: score **[check in app]** – lots of winter rain on bare soil, no pest break
   - B. + Cover crop (e.g. vetch + oat in winter): score **[check in app]**
   - C. Optimizer's best (e.g. wheat → chickpea → maize + covers): score **[check in app]**
4. Open a card: why · evidence · benefits · gaps · risks
5. Load another location live (e.g. Konya) → different climate, different answer

**Konuşma notu:**
Şimdi canlı gösterelim. Yalova'yı seçiyoruz; aylık takvimde yağış, sıcaklık, don günü ve kök bölgesi toprak nemi görünüyor, tarlanın boş kaldığı kış ayları işaretli. Çiftçimiz her yıl silajlık mısır ekiyor ve kışın tarla boş. Karşılaştırmada önce mevcut düzenin puanını görüyoruz: kış yağmurunun büyük kısmı çıplak toprağa düşüyor ve aynı ürün art arda geldiği için hastalık kırılması yok. Sadece kışa fiğ-yulaf karışımı eklediğimizde puan yükseliyor; çiftçi ana ürününü değiştirmek zorunda değil. Optimizasyon ise 343 üç yıllık diziyi deneyip en iyilerini öneriyor. Bir karta tıklayınca neden önerildiğini, NASA'dan gelen kanıt sayılarını, faydaları, bilinmeyenleri ve uzmana sorulması gereken riskleri görüyoruz. Son olarak Konya'yı canlı yüklüyoruz; iklim farklı olduğu için öneri de değişiyor. (Puanları sunumdan önce uygulamadan kontrol et.)

---

## Slide 4 – NASA data & method

**NASA POWER (power.larc.nasa.gov) – monthly, 2004–2023, Agroclimatology**
- T2M, T2M_MAX, T2M_MIN · PRECTOTCORR · FROST_DAYS · GWETROOT, GWETTOP · EVPTRNS · RH2M · solar radiation
- Optimizer: all **343** three-year sequences of 7 main crops; each bare window filled with the best of **12 cover crops** for the local climate
- Score from 7 parts: soil cover · nitrogen · organic matter · water (need − NASA rain) · pest break · climate risk (frost, heat) · income
- Farmer priorities and irrigation change the weights

**Konuşma notu:**
Verinin çekirdeği NASA POWER. Agroklimatoloji topluluğundan aylık nokta verisi alıyoruz: sıcaklık, en yüksek ve en düşük sıcaklık, düzeltilmiş yağış, don günü, toprak nemi, buharlaşma-terleme, nem ve güneş ışınımı. Yalova verisi uygulamaya gömülü; diğer konumlar API'den canlı ve anahtarsız çekiliyor. Yöntemde endüstri mühendisliği yaklaşımını kullandık: yedi ana ürünün tüm üç yıllık dizileri, yani 343 dizi deneniyor ve her boş pencereye 12 örtü bitkisinden iklime en uygun olanı yerleştiriliyor. Puan yedi alt puandan oluşuyor; örneğin su puanı, ürünün su ihtiyacından NASA yağışını çıkararak bulunan sulama açığı. Çiftçinin öncelikleri ve sulama imkânı ağırlıkları değiştiriyor.

---

## Slide 5 – Example result (Yalova)

**From "maize every year" to a rotation with cover**
| Strategy | Score | Key evidence (NASA) |
|---|---|---|
| A. Maize ×3, bare winter | **[check]** | ~420 mm winter rain on bare soil **[check]** |
| B. Maize ×3 + vetch/oat in winter | **[check]** | Winter frost days fit a frost-tolerant cover |
| C. Optimizer's best | **[check]** | Pest break + legume N + lower irrigation gap |
- Smallest step (B) already protects the soil and adds nitrogen
- Trend: fewer frost days → wider window for autumn-sown crops

**Konuşma notu:**
Yalova örneğinde sonuç şöyle: Sadece mısır ekilen ve kışın boş kalan düzende, Ekim–Mart arasındaki yaklaşık 420 milimetre yağış çıplak toprağa düşüyor. Kışa fiğ-yulaf eklemek, yani en küçük değişiklik bile toprağı koruyor ve baklagil sayesinde azot katıyor. Optimizasyonun önerdiği rotasyon ise buna ek olarak ürün ailesini değiştirerek hastalık döngüsünü kırıyor ve sulama açığını azaltıyor. Ayrıca don günlerinin azalması, sonbaharda ekilen ürünler için pencerenin genişlediğini gösteriyor. (Tablodaki puanları ve yağış değerini uygulamadan kopyala.)

---

## Slide 6 – Honest about limits

**Supports, does not replace, local expertise**
- NASA POWER grid ≈ 0.5° × 0.625° (**≈ 50 km**) → regional climate, not one field
- GWETROOT is **modeled** (MERRA-2 reanalysis), not a direct satellite reading
- Crop parameters are **approximate rules of thumb** → need expert validation
- Not yet included: soil texture, pH, slope, local pests, real prices
- Scores compare options; they are **not yield forecasts**
- Every card lists its information gaps and risks for expert review

**Konuşma notu:**
Verinin sınırlarını açıkça söylemek istiyoruz. NASA POWER yaklaşık 50 kilometrelik bir ızgarada; yani tek bir tarlayı değil bölgenin iklimini anlatıyor. Toprak nemi değeri olan GWETROOT doğrudan uydu ölçümü değil, MERRA-2 modelinden geliyor. Ürün parametreleri yaklaşık değerler ve bir ziraat uzmanı tarafından doğrulanmalı. Toprak yapısı, pH, eğim, yerel zararlılar ve fiyatlar henüz yok. Puanlar seçenekleri birbirine göre karşılaştırıyor, verim tahmini değil. Bu yüzden her kartta bilinmeyenler ve uzmana sorulacak riskler yazıyor. Araç uzmanın yerine geçmiyor, ona destek oluyor.

---

## Slide 7 – Impact, next steps & team

**Impact**
- Free, phone-friendly, bilingual, works for any coordinate NASA POWER covers
- Less bare soil, more nitrogen from legumes, water-aware crop choice

**Next steps**
- Validate crop data with agronomists and the provincial agriculture directorate · pilot farms in Yalova
- Add NASA **SMAP** soil moisture, **GPM IMERG** extreme rain, **SRTM** slope, **Landsat / Sentinel-2 NDVI** bare-field detection

**Team BNova:** Berrak · Nisa Nur (Industrial Eng.: data analysis, optimization) · Ömer (Computer Eng.: software, web)
lordomer.github.io/bnova-field-shift
*AI use declared: Claude (Anthropic) assisted with code, data scripts and text drafts; reviewed by the team. No AI images.*

**Konuşma notu:**
Etkiye gelince: Field Shift ücretsiz, telefondan açılıyor, Türkçe ve İngilizce, ve NASA POWER'ın veri verdiği dünyadaki her noktada çalışıyor. Amacımız daha az çıplak toprak, baklagillerle daha fazla doğal azot ve suya göre bilinçli ürün seçimi. Sonraki adımlarımız: ürün verilerini ziraat uzmanları ve İl Tarım Müdürlüğü ile doğrulamak, Yalova'da birkaç çiftlikte denemek, ardından SMAP uydu toprak nemi, GPM aşırı yağış, SRTM eğim ve Landsat/Sentinel-2 ile boş tarla tespiti eklemek. Ekibimiz: Endüstri Mühendisliğinden Berrak ve Nisa Nur, veri analizi ve optimizasyon; Bilgisayar Mühendisliğinden Ömer, yazılım ve web. Yapay zekâ kullanımımızı beyan ediyoruz: Claude kod, veri betikleri ve metin taslaklarında yardımcı oldu, tüm sonuçları ekip kontrol etti; YZ görseli kullanmadık. Teşekkürler, sorularınızı bekliyoruz.
