# Field Shift – Presentation (max 7 slides, 3–5 min)

Team BNova · NASA Space Apps Challenge 2026 · Yalova

- Slide text is in English for the judges and the submission. Speaker notes (konuşma notu) are in Turkish.
- Rules: no NASA logo, flag or emblem on the slides.
- Numbers come from the app with its defaults: nitrogen + erosion, limited irrigation, loamy soil, gentle slope, medium organic matter. Say "≈", because scores can move by 1–2 points.

Suggested timing: 1) 30 s · 2) 30 s · 3) 75 s · 4) 40 s · 5) 40 s · 6) 30 s · 7) 35 s ≈ 4.5 min

---

## Slide 1 – The problem

**Bare fields, same crop, changing climate**
- Silage maize every year in Yalova → field bare **≈7 months/yr**
- **≈468 mm of 648 mm** yearly rain falls on bare soil → erosion, nutrient loss
- Same crop every year → negative nitrogen balance, no pest break
- Climate is shifting (Yalova 2004–2023): **+0.53 °C / decade, −7.5 frost days / decade, +38 mm rain / decade**

**Konuşma notu:**
Merhaba, biz BNova. Yalova'da her yıl silajlık mısır eken bir çiftçiyi düşünün. Tarla yılda yaklaşık 7 ay boş kalıyor. NASA verisine göre yıllık 648 milimetre yağışın yaklaşık 468 milimetresi çıplak toprağa düşüyor; bu, erozyon ve besin kaybı demek. Her yıl aynı ürün olduğu için azot dengesi eksiye düşüyor ve hastalık döngüsü kırılmıyor. Bir de iklim değişiyor: son 20 yılda Yalova'da sıcaklık on yılda yarım derece arttı, don günleri on yılda yedi buçuk gün azaldı. Çiftçinin elinde "hangi nöbeti yapayım" sorusuna yerel veriyle cevap veren basit bir araç yok.

---

## Slide 2 – Our solution: Field Shift

**A free crop rotation planner powered by NASA data**
- Pick a location → **NASA climate, terrain and vegetation** data load live
- Enter your rotation, priorities, irrigation and **your field's soil**
- Compare **3 strategies over 3 years**: current · current + cover crops · optimizer's best
- Each plan: **0–100 score**, why, NASA evidence, benefits, gaps, risks
- Any phone browser · English / Turkish · no install, no account

**Konuşma notu:**
Çözümümüz Field Shift: telefondan açılan ücretsiz bir web uygulaması. Konumu seçince NASA'dan iklim, arazi eğimi ve bitki örtüsü verisi canlı geliyor, API anahtarı gerekmiyor. Çiftçi şu anki ekim düzenini, önceliklerini, sulama imkânını ve tarlasının toprağını, yani bünye, eğim ve organik maddeyi giriyor. Uygulama üç stratejiyi üç yıllık karşılaştırıyor: bugünkü düzen, aynı düzene örtü bitkisi eklenmiş hali ve optimizasyonun bulduğu en iyi rotasyon. Her birinin 0–100 puanı ve gerekçesi var.

---

## Slide 3 – Demo flow

**Yalova + silage maize every year**
1. Location **Yalova** (farmland point) → slope auto-filled from SRTM: **5.1%, gentle**
2. Monthly calendar: rain, temperature, frost, soil wetness + **MODIS green line** (least green Feb, Jul–Sep)
3. Rotation comparison: **A ≈29 → B ≈72 → C ≈86**
4. Open strategy C: why · evidence · benefits · gaps · risks
5. Load **Konya** live → flat, dry (≈380 mm) → different answer

**Konuşma notu:**
Canlı gösteriyoruz. Yalova'yı seçiyoruz; SRTM yükseklik verisinden eğim otomatik geliyor: yüzde 5,1, yani hafif eğimli. Aylık takvimde yağış, sıcaklık, don ve kök bölgesi toprak nemi var. Yeşil çizgi MODIS uydusundan bitki örtüsü: Şubat ve Temmuz–Eylül en az yeşil aylar, yani hasattan sonra toprak büyük ihtimalle çıplak. Mevcut düzen, yani her yıl mısır, 29 puan alıyor. Sadece kışa fiğ-yulaf eklemek puanı 72'ye çıkarıyor. Optimizasyonun en iyi önerisi 86 puan. Bu kartı açınca neden önerildiğini, NASA kanıtlarını, faydaları, bilinmeyenleri ve riskleri görüyoruz. Sonra Konya'yı canlı yüklüyoruz: düz ve kurak, yağış 380 milimetre civarı, sonuç da farklı.

---

## Slide 4 – NASA data & method

**Three NASA datasets, fetched live in the browser**
- **NASA POWER** (2004–2023): temperature, max/min, rain, frost days, root-zone soil wetness → climate fit, irrigation need, stored soil water
- **SRTM elevation** (via Open-Elevation): slope from 5 points → steep slope raises erosion weight
- **MODIS Terra NDVI** (MOD13Q1, 250 m, via ORNL DAAC): least-green months = likely bare soil
- Optimizer: keeps year-1 crop, tests **43** distinct 3-year rotations of 7 crops, best of **12 cover crops** in every bare window
- 7 sub-scores: soil cover · nitrogen · organic matter · water · pest break · climate risk · income

**Konuşma notu:**
Üç NASA veri seti kullanıyoruz ve hepsi tarayıcıdan anahtarsız çekiliyor:
- NASA POWER'dan 20 yıllık sıcaklık, yağış, don günü ve kök bölgesi toprak nemini alıyoruz. Toprak neminden ekim anında toprakta depolanan suyu tahmin ediyoruz. Kapasite toprak bünyesine bağlı: kumlu 70, tınlı 150, killi 200 milimetre.
- SRTM yükseklik verisinden eğimi hesaplıyoruz; dik arazide erozyon ağırlığı artıyor.
- MODIS uydusunun NDVI verisi bölgede toprağın ne zaman çıplak kaldığını gösteriyor.

Optimizasyonda endüstri mühendisliği yaklaşımını kullandık: çiftçinin ilk yıl ürünü sabit kalıyor, 43 farklı üç yıllık rotasyon deneniyor ve her boş pencereye 12 örtü bitkisinden en uygunu yerleşiyor. Su puanı, yıllık sulama ihtiyacının çiftçinin sağlayabildiği suya oranından hesaplanıyor.

---

## Slide 5 – Results

**Yalova, silage maize every year**
| Strategy | Score | Evidence |
|---|---|---|
| A. Maize ×3, bare winter | **≈29** | ≈468 mm rain on bare soil · irrigation ≈311 mm/yr · N −3 |
| B. Maize ×3 + vetch/oat cover | **≈72** | rain on bare soil ≈45 mm/yr |
| C. Maize → sunflower → spring chickpea + vetch/oat | **≈86** | N +1.7 · irrigation ≈194 mm/yr · pest break |
- C risks flagged: March frost for spring chickpea, July heat spike (35 °C)
- **Konya**: A ≈26 → B ≈68 → C ≈75
- **Wheat, no irrigation (Yalova)**: best = wheat → chickpea → chickpea (+ vetch/oat) → almost no irrigation needed

**Konuşma notu:**
Sonuçlar:
- Yalova'da her yıl mısır ekildiğinde çıplak toprağa düşen yağış yaklaşık 468 milimetre, sulama ihtiyacı yılda 311 milimetre, azot dengesi eksi 3.
- Kışa fiğ-yulaf eklenince çıplak toprağa düşen yağış 45 milimetreye iniyor. Yani en küçük adım bile büyük fark yaratıyor.
- En iyi rotasyon mısır, ayçiçeği, ilkbahar nohudu: azot dengesi artıya geçiyor, sulama 194 milimetreye iniyor, ürün ailesi her yıl değişiyor. Araç riskleri de yazıyor: nohut için Mart donu ve Temmuz'daki 35 derecelik sıcak dalgası.
- Konya'da puanlar 26'dan 68'e ve 75'e çıkıyor.
- Sulaması olmayan bir buğday çiftçisine araç neredeyse hiç sulama istemeyen buğday–nohut rotasyonunu öneriyor. Yani su kısıtına saygı gösteriyor.

---

## Slide 6 – Honest about limits

**Supports, does not replace, local expertise**
- NASA POWER grid **≈50 km** → regional climate, not one field
- Root-zone soil wetness is **modeled** (MERRA-2), not a direct satellite reading
- MODIS 250 m over 2×2 km **mixes many fields**; one year (2025) only
- SRTM slope from 5 points → approximate, farmer can override
- Crop parameters are **approximate rules of thumb** → expert validation needed
- No soil pH, local pests or real prices · scores compare options, **not yield forecasts**

**Konuşma notu:**
Verinin sınırlarını açıkça söylüyoruz:
- NASA POWER yaklaşık 50 kilometrelik ızgarada, yani tarlayı değil bölgeyi anlatıyor.
- Kök bölgesi toprak nemi doğrudan uydu ölçümü değil, MERRA-2 modelinden geliyor.
- MODIS 250 metre çözünürlükte ve 2 kilometrelik pencerede pek çok tarlayı karıştırıyor; tek bir tarlayı değil bölgedeki genel deseni gösteriyor.
- Eğim yaklaşık bir değer ve çiftçi değiştirebiliyor.
- Ürün parametreleri yaklaşık ve bir ziraat uzmanı tarafından doğrulanmalı.
- Toprak pH'ı, yerel zararlılar ve fiyatlar yok. Puanlar seçenekleri karşılaştırıyor; verim tahmini değil.

Her kartta bilinmeyenler ve uzmana sorulacak riskler yazıyor. Araç uzmanın yerine geçmiyor, ona destek oluyor.

---

## Slide 7 – Impact, next steps & team

**Impact**
- Free, phone-friendly, bilingual, works almost anywhere on Earth
- Less bare soil, more nitrogen from legumes, rotations that fit the farmer's water
- Turkey: ≈642 Mt of soil lost to erosion per year · 79% of water used by agriculture · 2.32 M registered farmers (sources in docs/IMPACT_SOURCES.md)

**Next steps**
- Validate crop data with agronomists and the provincial agriculture directorate · pilot farms in Yalova
- Add **SMAP** soil moisture, **GPM IMERG** extreme rain, **Sentinel-2 / Landsat** field-scale NDVI

**Team BNova:** Berrak · Nisa Nur (Industrial Eng.: data analysis, optimization) · Ömer (Computer Eng.: software, web)
lordomer.github.io/bnova-field-shift
*AI use declared: Claude (Anthropic) assisted with code, data scripts and text drafts; reviewed by the team. No AI images.*

**Konuşma notu:**
Etkiye gelince: Field Shift ücretsiz, telefondan açılıyor, Türkçe ve İngilizce, ve dünyanın neredeyse her yerinde çalışıyor. Amacımız daha az çıplak toprak, baklagillerle daha fazla doğal azot ve çiftçinin suyuna uygun rotasyonlar. (Buraya kaynaklı bir Türkiye istatistiği ekleyin.)

Sonraki adımlar: ürün verilerini ziraat uzmanları ve İl Tarım Müdürlüğü ile doğrulamak, Yalova'da birkaç çiftlikte denemek, ardından SMAP toprak nemi, GPM aşırı yağış ve Sentinel-2 ile tarla ölçeğinde bitki örtüsü eklemek.

Ekibimiz: Endüstri Mühendisliğinden Berrak ve Nisa Nur, veri analizi ve optimizasyon; Bilgisayar Mühendisliğinden Ömer, yazılım ve web.

Yapay zekâ kullanımımızı beyan ediyoruz: Claude kod, veri betikleri ve metin taslaklarında yardımcı oldu, tüm sonuçları ekip kontrol etti; YZ görseli kullanmadık. Teşekkürler, sorularınızı bekliyoruz.
