# Cover-crop parameter check (ROTATION_CROPS in data/crops.js)

Checked 2026-11-14. "OK" means the source supports our value. "unverified" means no reputable number was found, so we keep our value.

How the scores were mapped: the SARE Chart 2 ratings are drawn as symbols, and these were read from the rendered PDF. Excellent = 3, Very Good = 2, Good = 1–2, Fair = 1, Poor = 0.

USDA hardiness zones by lowest winter temperature: zone 3 ≈ −40 °C, zone 4 ≈ −34 °C, zone 6 ≈ −23 °C, zone 7 ≈ −18 °C, zone 8 ≈ −12 °C. Iowa and Nebraska are roughly zones 4b–5b.

Short source names used in the table:

- **SARE-C2**: SARE Managing Cover Crops Profitably (MCCP), Chart 2 "Performance and Roles". https://www.sare.org/wp-content/uploads/chart2-performance-and-roles.pdf
- **SARE-C3A**: MCCP Chart 3A "Cultural Traits" (hardy-through zone and minimum germination temperature). https://www.sare.org/wp-content/uploads/chart3a-cultural-traits.pdf
- **FAO-IWM**: FAO Irrigation Water Management, Training Manual 3 (Brouwer & Heibloem), Tables 4 and 5. https://www.fao.org/4/S2022E/s2022e02.htm

| id | field | our value | recommended value | source name | URL | note |
|---|---|---|---|---|---|---|
| vetch_oat | months | 6 | 6–7 (keep 6) | SARE MCCP Hairy vetch | https://sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/hairy-vetch | OK. Plant 30–45 days before killing frost and terminate at about 50% bloom in spring. |
| vetch_oat | tMin/tMax | 2 / 22 | keep | — | — | unverified as monthly means. SARE says only that hot weather makes vetch "languish". |
| vetch_oat | frost | tolerant | tolerant (hairy vetch only); add hardyC ≈ −15 °C without snow, about −34 °C with snow | SARE-C3A + SARE Hairy vetch | https://sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/hairy-vetch | Hairy vetch is hardy through zone 4 (into zone 3 with snow cover), but "less than 5 °F" (−15 °C) without snow may kill it. The oat component winterkills in zone 7 or colder (SARE Oats), so in Iowa and Nebraska this is effectively hairy vetch plus dead oat mulch. Common vetch is not covered by SARE: unverified, and probably much less hardy. The id should state hairy vetch. |
| vetch_oat | water | 300 | keep | — | — | unverified. SARE: hairy vetch is more drought tolerant than other vetches and needs little water over winter. |
| vetch_oat | nfix | 3 | 3 | SARE-C2 | (C2) | OK. Hairy vetch N source is Excellent, 90–200 lb N/A. |
| vetch_oat | erosion | 3 | 2 | SARE-C2 | (C2) | Hairy vetch is Good and oats Very Good, and the oats die over a Midwest winter. |
| vetch_oat | forage | 3 | 2 | SARE-C2 + Hairy vetch page | https://sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/hairy-vetch | Hairy vetch makes "only fair grazing"; oat grazing is Good. |
| vetch_oat | organic | 3 | 2 | SARE-C2 | (C2) | Soil builder: vetch Very Good, oats Good. Biomass is 2,300–5,000 lb/A for vetch and 2,000–4,000 lb/A for fall oats. |
| vetch_oat | market | 2 | keep | SARE-C2 | (C2) | OK-ish. Harvest value: vetch forage Fair, vetch seed Very Good. |
| rye | months | 6 | 6–7 | SARE MCCP Cereal rye | https://www.sare.org/publications/managing-cover-crops-profitably/nonlegume-cover-crops/cereal-rye/ | OK. Seed from late summer to mid-fall in zones 3–7 and kill in spring (at least 10 days before corn). |
| rye | tMin | 0 | 0 (keep), or 3 if hardyC is added | SARE Cereal rye | (same) | "Vegetative growth requires 38 °F or higher" (3.3 °C, daily), and it germinates at 34 °F. A monthly mean of 0 °C still contains growing days, so 0 is acceptable. |
| rye | tMax | 22 | keep | — | — | unverified. |
| rye | frost | tolerant | tolerant; add hardyC ≈ −34 °C (zone 3) | SARE-C3A | (C3A) | The hardiest species in SARE (hardy through zone 3) and more cold tolerant than wheat. Survives Iowa and Nebraska winters with a wide margin. |
| rye | water | 250 | keep | — | — | unverified number. SARE warns that late killing of rye can deplete soil moisture. |
| rye | nfix/erosion/organic | 0/3/3 | OK | SARE-C2 | (C2) | N scavenger, soil builder and erosion fighter are all Excellent. Biomass is 3,000–10,000 lb/A. |
| rye | forage | 2 | 2 | SARE-C2 + Rye page | (C2) | OK. Grazing is Good, but mature rye is poor forage (it is good at boot stage). |
| rye | market | 1 | 1 | SARE-C2 | (C2) | OK. Harvest value is Fair for forage and Fair for seed. |
| faba | months | 6 | 4 | Purdue Alternative Field Crops Manual: Fababean | https://hort.purdue.edu/newcrop/afcm/fababean.html | Seeding to harvest takes 80–120 days. Keep 6 only for a fall-sown overwintering type in mild climates. |
| faba | tMin/tMax | 3 / 22 | keep | Purdue AFCM | (same) | OK qualitatively: "grows best under cool, moist conditions", and hot, dry weather is injurious. |
| faba | frost | tolerant | tolerant of light frost only; add hardyC ≈ −5 °C (unverified) | USDA-ARS 2016 news; Purdue AFCM | https://www.ars.usda.gov/news-events/news/research-news/2016/new-faba-beans-offer-multiple-benefits/ | ARS (seen in a search snippet): current US varieties tolerate light frosts but lack true winter hardiness, while selected experimental lines reach zone 6b. Should not overwinter in Iowa or Nebraska. The −5 °C figure is an estimate. |
| faba | water | 350 | 350 | FAO-IWM | https://www.fao.org/4/S2022E/s2022e02.htm | OK. "Bean" 300–500 mm. |
| faba | nfix | 3 | keep | — | — | unverified (not in SARE). Purdue confirms it fixes N. |
| faba | forage | 1 | 2 | Purdue AFCM | https://hort.purdue.edu/newcrop/afcm/fababean.html | "Fababean plants make high quality silage." |
| faba | erosion/organic/market | 2/2/2 | keep | — | — | unverified. |
| pea | months | 5 | 3–4 (spring); 6–7 if fall-sown | FAO-IWM; SARE Field peas | https://www.fao.org/4/S2022E/s2022e02.htm | FAO gives pea a growing period of 90–100 days. |
| pea | tMin/tMax | 4 / 22 | keep | SARE Field peas | https://www.sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/field-peas/ | OK. Plant when the topsoil reaches 40 °F (4.4 °C). Above 90 °F (32 °C) flowers blast. |
| pea | frost | tolerant | tolerant of moderate frost; add hardyC ≈ −8 °C (Austrian winter pea, no snow) | SARE-C3A + Field peas page | (same) | Hardy through zone 7. Austrian winter pea takes 10 °F (−12 °C) with minor injury, but "sustained cold below 18 °F (−8 °C) without snow cover usually kills" it, and it doesn't overwinter reliably colder than zone 6. Winterkills in Iowa and Nebraska. Spring forage peas are less hardy (unverified). |
| pea | water | 300 | 350 | FAO-IWM | https://www.fao.org/4/S2022E/s2022e02.htm | Pea 350–500 mm for a full crop. A cover terminated at bloom uses less, so 300–350. |
| pea | nfix/erosion/forage/market | 3/2/3/2 | OK | SARE-C2 | (C2) | N source Excellent (90–150 lb N/A). Erosion fighter Very Good. Grazing Very Good, forage harvest value Excellent. Seed Very Good. |
| pea | organic | 2 | 1 | SARE-C2 | (C2) | Soil builder is Good, and "biomass breaks down quickly". Lasting residue is Fair. |
| clover | months | 6 | keep (6–7) | SARE MCCP Crimson clover | https://www.sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/crimson-clover/ | OK. Seed 6–8 weeks before first frost and kill at bloom in spring. |
| clover | tMin/tMax | 3 / 22 | keep | — | — | unverified. SARE: it "thrives in cool, moist conditions". |
| clover | frost | tolerant | tolerant to about zone 7; add hardyC ≈ −15 to −18 °C | SARE-C3A + Crimson page | (same) | Hardy through zone 7 and sometimes survives lower zone 6. "In Zone 5 and colder" it is grown as a winter-killed annual, which means it winterkills in Iowa and Nebraska. |
| clover | water | 350 | keep | — | — | unverified. |
| clover | nfix | 3 | 2 | SARE-C2 | (C2) | N source is Very Good (70–130 lb N/A), below hairy vetch and peas (Excellent). |
| clover | erosion | 3 | 2 | SARE-C2 | (C2) | Very Good. |
| clover | forage | 3 | 3 | SARE-C2 | (C2) | OK. Grazing Excellent: "excellent for grazing and haying". |
| clover | organic | 2 | 2 | SARE-C2 | (C2) | OK. Soil builder Very Good, 3,500–5,500 lb/A. |
| clover | market | 1 | 2 | SARE-C2 | (C2) | Harvest value: forage Excellent, seed Very Good. Optional change. |
| lentil | months | 5 | 3 | NRCS Plant Guide: Lentil (2016) | https://plants.sc.egov.usda.gov/DocumentLibrary/plantguide/pdf/pg_lecu2.pdf | "A growing season of 80 to 100 days is required." |
| lentil | tMin/tMax | 4 / 24 | keep | NRCS Lentil | (same) | OK. Plant spring types when the soil reaches 40 °F (4.4 °C). It is a drought-tolerant cool-season crop. |
| lentil | frost | tolerant | tolerant of spring frost; add hardyC ≈ −6 °C | NRCS Lentil | (same) | "Seedlings can generally withstand frost and temperatures as low as 21 °F" (−6 °C). Only a few varieties survive extreme cold, so it should not be treated as winter-hardy in Iowa or Nebraska. |
| lentil | water | 250 | 250–300 | NRCS Lentil; ICARDA trial (AGRIS record) | https://agris.fao.org/search/en/records/669fafc04295623862505f4c | NRCS: it needs at least 10 in (254 mm) of annual rainfall. The ICARDA trial measured about 297 mm ET under full irrigation (seen in a search snippet only). OK. |
| lentil | nfix | 2 | 2 | NRCS Lentil | (same) | OK. 30–100 lb N/A, below vetch and pea. |
| lentil | erosion/forage/organic/market | 1/1/1/3 | OK | NRCS Lentil | (same) | Residue decomposes quickly (low C:N), which supports organic 1. Grain market value is high. |
| mustard | months | 3 | 2–3 (keep 3) | SARE MCCP Brassicas & Mustards | https://www.sare.org/publications/managing-cover-crops-profitably/nonlegume-cover-crops/brassicas-and-mustards/ | OK. Michigan fall seedings need about 900 GDD, then are incorporated at first frost. |
| mustard | tMin/tMax | 5 / 22 | keep | SARE Brassicas | (same) | OK-ish. Brassica planting soil temperature is 45–85 °F (7–29 °C). |
| mustard | frost | tolerant | sensitive (winter-killed); add hardyC ≈ −4 °C | SARE Brassicas + SARE-C3A | (same) | "Winterkilling at about 25 °F" (−4 °C). In Michigan it dies "with the first hard frost, usually in October". Light-frost tolerant only, and must not get the dormant-month credit. |
| mustard | water | 200 | keep | — | — | unverified. |
| mustard | nfix/erosion/forage/organic/market | 0/2/1/2/1 | OK | SARE-C2 | (C2) | Erosion fighter Very Good. Grazing Good, but forage harvest value Poor. Soil builder Very Good. Seed Fair. |
| chickpea | months | 4 | keep | — | — | unverified (Purdue gives no day count). |
| chickpea | tMin/tMax | 8 / 26 | keep | Purdue AFCM: Chickpea | https://hort.purdue.edu/newcrop/afcm/chickpea.html | OK. Optimum is 70–80 °F days and 64–70 °F nights (mean about 19–24 °C). It is planted in early to mid-April in the Upper Midwest. |
| chickpea | frost | sensitive | sensitive (seedlings tolerate light frost) | Purdue AFCM | (same) | OK. It is "frost tolerant as seedlings" but not winter-hardy. |
| chickpea | water | 250 | 300 | ICARDA trial (AGRIS record) | https://agris.fao.org/search/en/records/669fafc04295623862505f4c | About 451 mm ET under full irrigation (search snippet). Rainfed is lower. Purdue: it is drought tolerant through its deep taproot, and above 30 in of rain yields drop. The low-confidence part is the 300 mm figure. |
| chickpea | scores | 2/1/1/1/3 | keep | — | — | unverified (not in SARE). |
| cowpea | months | 3 | 2–3 (keep 3) | SARE MCCP Cowpeas | https://www.sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/cowpeas/ | OK. Plowdown 60–90 days after planting; seed matures in 90–140 days. |
| cowpea | tMin/tMax | 18 / 32 | keep | SARE Cowpeas | (same) | OK. Plant at a consistent soil temperature of 65 °F (18 °C). Dry matter peaks at 81 °F day / 72 °F night (about 25 °C mean). |
| cowpea | frost | sensitive | sensitive | SARE-C3A | (C3A) | OK. Not frost tolerant, and less frost tolerant than soybean. |
| cowpea | water | 300 | keep | SARE Cowpeas | (same) | Number unverified. "Excellent drought resistance." |
| cowpea | nfix | 3 | 3 | SARE-C2 | (C2) | OK. Excellent, 100–150 lb N/A. |
| cowpea | erosion | 2 | 3 | SARE-C2 | (C2) | Erosion fighter is Excellent. |
| cowpea | forage/organic/market | 2/2/2 | OK | SARE-C2 | (C2) | Grazing Good, soil builder Good (2,500–4,500 lb/A), forage and seed value Good. |
| sudangrass | months | 3 | 2–3 (keep 3) | SARE MCCP Sorghum-sudangrass | https://www.sare.org/publications/managing-cover-crops-profitably/nonlegume-cover-crops/sorghum-sudangrass/ | OK. Plant at least 6 weeks before first frost. |
| sudangrass | tMin/tMax | 18 / 35 | keep | SARE Sorghum-sudangrass; SARE-C3A | (same) | OK. Needs soil at 65–70 °F (18–21 °C) at least 2 months before frost; minimum germination 65 °F. Heat and drought tolerance Excellent. |
| sudangrass | frost | sensitive | sensitive | SARE | (same) | OK. "They are not frost tolerant." |
| sudangrass | water | 350 | keep | FAO-IWM (sorghum 450–650 mm for a full 120–130 day grain crop) | https://www.fao.org/4/S2022E/s2022e02.htm | OK when scaled to a 2–3 month cover. SARE: survives drought by going nearly dormant. |
| sudangrass | erosion/forage/organic/market | 3/3/3/2 | OK | SARE-C2 | (C2) | N scavenger, builder and erosion fighter Excellent. Grazing Very Good, forage value Excellent. 8,000–10,000 lb/A. Note the prussic acid risk when grazing. |
| buckwheat | months | 3 | 2 | SARE MCCP Buckwheat | https://www.sare.org/publications/managing-cover-crops-profitably/nonlegume-cover-crops/buckwheat/ | 70–90 days to maturity, but as a cover it is turned in about 6–8 weeks after planting, before seed set. |
| buckwheat | tMin/tMax | 12 / 28 | keep | SARE-C3A | (C3A) | Minimum germination 50 °F (10 °C) and frost-sensitive. Blossoms blast in heat, so tMax could be lower (about 25); unverified. |
| buckwheat | frost | sensitive | sensitive | SARE | (same) | OK. "Not frost tolerant." |
| buckwheat | water | 250 | keep | SARE Buckwheat | (same) | Number unverified. "Not particularly drought tolerant"; as a cash crop it uses "half as much soil moisture as soybeans". |
| buckwheat | erosion | 2 | 1 | SARE-C2 | (C2) | Erosion fighter is Fair. |
| buckwheat | organic | 2 | 1 | SARE-C2 | (C2) | Soil builder Good, 2,000–4,000 lb/A, and it breaks down quickly (lasting residue Poor). |
| buckwheat | forage | 0 | 0 | SARE-C2 | (C2) | OK. Grazing Poor. |
| buckwheat | market | 2 | 1 | SARE-C2 | (C2) | Seed harvest value is Fair. Keep 2 if there is a local grain market. |
| soybean | months | 4 | 4 | FAO-IWM | https://www.fao.org/4/S2022E/s2022e02.htm | OK for double-crop. A full season is 135–150 days. |
| soybean | tMin/tMax | 18 / 30 | keep | — | — | unverified. |
| soybean | frost | sensitive | sensitive | SARE Cowpeas (relative statement) | https://www.sare.org/publications/managing-cover-crops-profitably/legume-cover-crops/cowpeas/ | OK. |
| soybean | water | 450 | 450 | FAO-IWM | https://www.fao.org/4/S2022E/s2022e02.htm | OK. 450–700 mm for a full season, and a short double-crop sits at the low end. |
| soybean | scores | 3/1/1/1/3 | keep | — | — | unverified (not in SARE). Fixed N is largely removed with the grain, so nfix 3 is generous; 2 is arguable. |

## Modelling note: winter hardiness

The tool currently treats every crop marked "tolerant" the same way. It gives partial credit down to tMin − 10 °C, using monthly means. That lets clover, pea, mustard, faba and lentil look able to overwinter where Jan mean ≈ −7 °C, and in reality they winterkill there.

Proposed fix:

1. Add `hardyC`, the lowest survivable air temperature:

   | Crop | hardyC |
   |---|---|
   | rye | −34 |
   | hairy vetch | −15 without snow (about −30 with snow) |
   | clover | −15 |
   | pea | −8 |
   | lentil | −6 |
   | faba | −5 |
   | mustard | −4 |

2. Compare `hardyC` against NASA POWER **T2M_MIN** (the monthly extreme minimum) for each winter month.
3. If T2M_MIN < hardyC, mark the crop "winter-killed". It then gets no spring growth and no spring N or biomass credit, and a large score penalty if it was meant to overwinter. Optionally, still allow it as a fall-only, winterkilled cover with a shorter season.
