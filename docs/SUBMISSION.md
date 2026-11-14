# Field Shift – NASA Space Apps 2026 Submission (Team BNova, Yalova)

> Paste-ready text for the project submission form. Results below use the app defaults (priorities: nitrogen + erosion; irrigation: limited; soil: loamy, gentle slope, medium organic matter). Scores can shift by 1–2 points after small model tweaks, so they are given as "≈".

---

## Project name
**Field Shift – NASA-data crop rotation planner**

## Project link
https://lordomer.github.io/bnova-field-shift/ (public, no login)

## Short summary (≈100 words)
Many fields stay bare for months between main crops, and often the same crop is grown every year. Field Shift is a free, phone-friendly web tool that compares a farmer's current 3-year rotation with better options. It combines three NASA datasets, all fetched live: NASA POWER climate and soil wetness (2004–2023), SRTM elevation for slope, and MODIS NDVI to show when local land is bare. For Yalova, "silage maize every year" scores ≈29/100. Adding a winter vetch + oat cover crop raises it to ≈72, and the optimizer's best rotation reaches ≈86. Every plan explains why it was suggested, gives its evidence and lists what a local expert should check.

## What does it do / how does it work?
**For the farmer or extension advisor:**
1. **Choose a location.** Yalova (farmland point 40.64 N, 29.33 E) is preset. Any other coordinate is loaded live in the browser with no API key.
2. **Describe the field.**
   - Current rotation (e.g. silage maize every year, bare in winter).
   - Priorities: add nitrogen, reduce erosion, save water, organic matter, animal feed, market income.
   - Irrigation available: none, limited or plenty.
   - **"My field's soil":** texture (sandy/loamy/clay), slope (filled in automatically from SRTM, can be changed) and organic matter (low/medium/high).
3. **Read the monthly climate calendar.** It shows rainfall, temperature, frost days and root-zone soil wetness (GWETROOT) from NASA POWER, plus a **green MODIS NDVI line**. Bare months are highlighted. Months in the bottom third of the local NDVI range are flagged "least green = likely bare soil after harvest".
4. **Compare three strategies over 3 years:**
   - **A. Current rotation**, as the farmer runs it today.
   - **B. Current rotation + cover crops** in every bare window.
   - **C. Best rotations found by the optimizer.** It keeps the farmer's year-1 crop and tests 43 distinct 3-year rotations of 7 main crops (wheat, barley, silage maize, sunflower, field tomato, chickpea, canola), with cyclic duplicates removed. Every bare window gets the best-fitting of 12 cover crops: vetch + oat, cereal rye, faba bean, field pea, crimson clover, lentil, mustard, chickpea, cowpea, sorghum-sudangrass, buckwheat and soybean.
5. **See climate trends for 2004–2023.** Yalova: +0.53 °C per decade, −7.5 frost days per decade, +38 mm rain per decade.

**Scoring (0–100), from 7 sub-scores:**
| Sub-score | What it measures | Data |
|---|---|---|
| Soil cover | Rain falling on bare soil (erosion and leaching risk) | POWER PRECTOTCORR + crop calendar; weight raised on steep slopes (SRTM) |
| Nitrogen balance | N removed by crops vs. N fixed by legumes | Crop table (approx.) |
| Organic matter | Residue and root biomass returned | Crop table (approx.); weight raised if soil OM is low |
| Water | 1 − (yearly irrigation need ÷ what the farmer can supply: none 150, limited 350, plenty 600 mm) | PRECTOTCORR, GWETROOT-based stored water |
| Pest / disease break | Same crop family in consecutive years is penalised | Crop families |
| Climate risk | Frost days in the months of frost-sensitive crops; heat spikes from T2M_MAX | FROST_DAYS, T2M_MAX, T2M |
| Market / income | Rough relative market value | Crop table (approx., no prices) |

**Soil water at sowing, from NASA soil wetness:**
- Stored water = capacity × clamp((GWETROOT − 0.3) / 0.6).
- Capacity depends on texture: sandy 70, loamy 150, clay 200 mm.
- Stored water is halved if a cover crop grew just before, and cut to 30% if a main crop did. Cover crops use soil water, and the tool shows that trade-off instead of hiding it.
- Irrigation need = crop water need − NASA rainfall in its months − stored water.

**How the weights adapt:**
- The farmer's priorities and irrigation level change the weights.
- Steep slope: soil cover weight +2.5.
- Low organic matter: organic weight +1.5.
- Sandy soil: water weight +0.5.

**Every strategy card explains itself**, as the challenge asks:
- **Why suggested**, in plain language.
- **Evidence:** the NASA numbers behind it.
- **Benefits.**
- **Information gaps.**
- **Risks needing local expert review.**

**Other features:**
- English/Turkish toggle.
- Glossary: evapotranspiration, soil moisture, frost days, cover crop, nitrogen fixation, satellite vs. ground data.
- "Data limits & uncertainty" section.
- A clear disclaimer that the tool supports, and does not replace, local agricultural expertise.

**Technology:**
- Static web app: HTML, CSS and plain JavaScript, with no libraries and no server.
- Charts are hand-drawn SVG.
- The scoring and optimizer engine is a separate module with no DOM dependency, so it can be tested in Node.js.
- A Python script (standard library only) downloads NASA POWER data as JSON/CSV for offline analysis.

## Example results (real app output)
**Yalova, silage maize every year** (defaults: nitrogen + erosion, limited irrigation, loamy soil, gentle slope, medium organic matter):

| Strategy | Score | Evidence |
|---|---|---|
| A. Silage maize every year, bare in winter | **≈29** | Field bare ≈7 months/yr. ≈468 mm of the 648 mm yearly rain falls on bare soil. Irrigation ≈311 mm/yr. Nitrogen balance −3. No pest break. |
| B. Same + vetch/oat winter cover | **≈72** | Rain on bare soil drops to ≈45 mm/yr. Legume adds nitrogen. Main crop unchanged. |
| C. Optimizer's best: silage maize → sunflower → spring chickpea, with vetch/oat covers | **≈86** | Nitrogen +1.7. Irrigation ≈194 mm/yr. Crop-family break every year. Flagged risks: frost in March for spring chickpea; heat spike in July (T2M_MAX ≈35 °C). |

**Context data for Yalova:**
- SRTM: 52 m elevation, slope 5.1% (gentle).
- MODIS 2025: greenest month April (NDVI 0.59). Least green February, July, August and September (≈0.31), which are likely bare or harvested months.

**Konya (37.95 N, 32.70 E), loaded live:**
- Yearly rain ≈380 mm.
- Maize every year: A ≈26 → B ≈68 → C ≈75.
- SRTM: 1003 m, slope 0.4% (flat).
- MODIS: least green July–November (NDVI ≈0.14), meaning bare after harvest.
- The drier climate gives lower and different results than Yalova.

**Water constraint check (Yalova, wheat every year, no irrigation):**
- A ≈67.
- Best found: wheat → chickpea → chickpea (+ vetch/oat). Alternative: wheat → barley → chickpea.
- Both need almost no irrigation, so the optimizer respects the farmer's water limit and does not push thirsty crops.

## Benefits & impact
- **Soil health:** the tool puts a number on erosion risk. In the Yalova example, a winter cover crop cuts rain on bare soil from ≈468 to ≈45 mm/yr. Slope from SRTM raises the priority of soil cover where erosion matters most.
- **Nitrogen:** legume covers and rotations with chickpea turn a negative nitrogen balance positive, which can reduce purchased fertilizer.
- **Water:** irrigation need is shown in millimetres and capped by what the farmer can actually supply. A farmer without irrigation gets rotations that rain and stored soil water can carry.
- **Climate resilience:** frost and heat checks use the location's own 20-year NASA record. The trend view shows a climate that is already shifting.
- **Accessible and scalable:** free, phone-friendly, no account, no install, bilingual. It works anywhere NASA POWER, SRTM and MODIS have data, which is nearly worldwide. Users can be farmers, extension staff (e.g. provincial agriculture directorates) and agriculture students.
- **Scale of the problem in Turkey:** [TEAM: add sourced number, e.g. TÜİK number of farm holdings / erosion figure]
- **Trust:** every recommendation shows its evidence and its unknowns, so an expert can quickly correct it.

## What we hope to achieve
- Make "what should I plant in the gap, and what should I rotate?" a 2-minute, evidence-based conversation between a farmer and an advisor.
- Show that the smallest step, adding a cover crop without changing the main crop, already improves soil health a lot (Yalova: ≈29 → ≈72).
- Validate the crop parameters with local agronomists and the provincial agriculture directorate, then pilot on a few farms around Yalova.
- Add SMAP soil moisture and GPM IMERG extreme-rain data to move further from regional toward field-scale advice.

## Tools, languages, hardware
- **Languages:** HTML5, CSS3, JavaScript (no frameworks or external libraries), Python 3 (standard library only).
- **Data access (all from the browser, no API keys):**
  - NASA POWER REST API.
  - Open-Elevation API (SRTM-based elevation).
  - ORNL DAAC MODIS web service (MOD13Q1 NDVI).
- **Hosting:** GitHub Pages (static).
- **Tools:** Visual Studio Code, Git/GitHub, web browsers, Node.js (engine tests), Claude (Anthropic) as an AI coding and writing assistant (see AI section).
- **Hardware:** team laptops and phones (mobile testing). No special hardware.

## Creativity
- **Rotation as an optimization problem:** the tool searches all distinct 3-year rotations from the farmer's current crop and fills every bare window with the best cover crop for that place. This applies industrial-engineering methods (enumeration plus multi-criteria scoring) to a farm decision.
- **"Today vs. small change vs. best":** the farmer sees what a cover crop alone achieves next to a full redesign, and the small change is often the easiest to adopt.
- **Three NASA views of one field:** POWER for climate and soil water, SRTM for slope (erosion weight), and MODIS for when the land around the field is actually green or bare.
- **Honest trade-offs:** the water model shows that cover crops use stored soil water. The tool does not claim cover crops are free.
- **Built-in explanations:** why, evidence, benefits, gaps and risks are given for every plan.

## How we considered the challenge's factors
| Challenge factor | How Field Shift addresses it |
|---|---|
| Soil health | Soil cover, organic matter and nitrogen sub-scores; cover crops in every bare window; soil OM input |
| Changing weather and water | 20-year NASA climatology and 2004–2023 trends; irrigation need vs. what the farmer can supply |
| Temperature / heat stress | T2M ranges per crop; heat spikes from T2M_MAX |
| Frost risk | FROST_DAYS checked against frost-sensitive crops' months |
| Precipitation | PRECTOTCORR drives the water and soil-cover scores (extremes via GPM: future work) |
| Soil moisture | GWETROOT shown monthly and used to estimate stored soil water at sowing |
| Evapotranspiration | EVPTRNS loaded and explained in the glossary; full ET water balance is future work |
| Erosion / terrain | SRTM slope auto-fills the slope input; steep slope raises the soil-cover weight |
| Bare-field periods | Crop calendar plus MODIS NDVI "least green" months |
| Local soil | Texture, slope and organic matter inputs change stored water, weights and risk texts |
| Crop characteristics | Table of 7 main crops and 12 cover crops: season, temperature range, frost tolerance, water need, N-fixation, residue, family |
| Farmer priorities | Water use, animal feed, nitrogen fixation, erosion, organic matter, market; all change the weights |
| Explain why / evidence / benefits / gaps / risks | Required fields on every strategy card |
| Accessibility | Free, static, phone-friendly, English/Turkish, glossary |

**Data limits we state openly in the app:**
- NASA POWER is on a ≈0.5° × 0.625° grid (≈50 km). It describes the region's climate, not one field. The Yalova farmland point is in the same grid cell as the city.
- GWETROOT in POWER is modeled (MERRA-2 reanalysis with data assimilation), not a direct satellite soil-moisture reading. The stored-water formula built on it is a simple approximation.
- MODIS NDVI at 250 m, averaged over a 2 × 2 km window, mixes many fields. It shows the local land pattern, not one specific field, and covers only one year (2025).
- SRTM slope comes from 5 points about 200 m apart. It is approximate and the farmer can override it.
- Crop parameters (temperature ranges, water needs, nitrogen, residue, market scores) are approximate rules of thumb that local experts must check.
- The tool has no soil pH, salinity, local pest data or real prices.
- Scores compare options with each other. They are not yield forecasts.

## Judging criteria
- **Impact:** a free, phone-friendly tool that turns NASA data into rotation plans that cut bare-soil exposure (Yalova: ≈468 → ≈45 mm/yr of rain on bare soil) and add nitrogen; scale in Turkey: [TEAM: add sourced number, e.g. TÜİK number of farm holdings / erosion figure].
- **Creativity:** an optimizer compares "today vs. small change vs. best" and combines climate, terrain and vegetation from three NASA datasets into one explained score.
- **Validity:** every number traces to a named NASA parameter, the formulas are simple and shown, and the limits (grid size, modeled soil wetness, approximate crop data) are stated in the app.
- **Relevance:** NASA POWER, SRTM and MODIS are the core of every score, and the tool answers the challenge's question of how farmers can pick rotations for soil health and changing weather.
- **Presentation:** a bilingual, mobile-friendly interface with a monthly calendar, side-by-side strategy cards and a glossary for non-experts.

## NASA data used
**1. NASA POWER – Prediction Of Worldwide Energy Resources** – https://power.larc.nasa.gov/
- Monthly point API, Agroclimatology (AG) community: https://power.larc.nasa.gov/docs/services/api/
- Period 2004–2023. Yalova is embedded in the app; other points are fetched live.

| Parameter | Meaning | How we use it |
|---|---|---|
| T2M | Air temperature at 2 m | Crop temperature fit per month; temperature trend |
| T2M_MAX | Max temperature at 2 m | Heat-spike risk |
| T2M_MIN | Min temperature at 2 m | Cold-season context |
| PRECTOTCORR | Bias-corrected precipitation | Irrigation need, rain on bare soil, rainfall trend |
| FROST_DAYS | Frost days | Frost risk for frost-sensitive crops; frost-day trend |
| GWETROOT | Root-zone soil wetness (0–1) | Monthly calendar; stored soil water at sowing |
| GWETTOP | Surface soil wetness | Loaded; future sowing-window checks |
| EVPTRNS | Evapotranspiration | Loaded and explained; future ET water balance |
| RH2M | Relative humidity | Loaded; future disease-risk indicators |
| ALLSKY_SFC_SW_DWN | Surface solar radiation | Loaded; future growth / ET estimates |

POWER combines satellite observations with model/reanalysis products (e.g. MERRA-2). We call these values "NASA satellite- and model-derived data", not field measurements.

**2. NASA SRTM (Shuttle Radar Topography Mission) elevation**
- Accessed through the open Open-Elevation API (https://open-elevation.com/), which serves SRTM-based elevation.
- How we use it: we sample 5 points about 200 m apart and compute slope. Classes are flat (<2%), gentle (2–8%) and steep (>8%). The result auto-fills the slope input and raises the soil-cover weight on steep land.
- Yalova: 52 m, 5.1%. Konya: 1003 m, 0.4%.

**3. NASA MODIS Terra MOD13Q1 NDVI** (250 m, 16-day)
- Accessed through the ORNL DAAC MODIS web service (https://modis.ornl.gov/data/modis_webservice.html).
- How we use it: for the last full year (2025), we take the mean of land pixels in a 2 × 2 km window and draw it as a green line on the monthly calendar. Months in the bottom third of the local NDVI range are flagged as likely bare soil after harvest.
- Yalova: greenest April (0.59), least green February and July–September (≈0.31). Konya: least green July–November (≈0.14).

## Space agency partner & other data
No partner-agency datasets are used yet. Open-Elevation is a third-party access service for NASA SRTM data, not a separate dataset. Planned:
- **NASA SMAP** satellite soil moisture, to compare with modeled GWETROOT.
- **NASA GPM IMERG** daily rainfall, for extreme-rain and erosion-risk days.
- **ESA Sentinel-2 / NASA-USGS Landsat** (10–30 m) NDVI, to detect bare soil on a single field.
- Local data from the provincial agriculture directorate (soil pH, texture maps, crop prices), if available.

## References
- NASA POWER Project, NASA Langley Research Center – https://power.larc.nasa.gov/ (documentation: https://power.larc.nasa.gov/docs/)
- NASA Shuttle Radar Topography Mission (SRTM) – https://www.earthdata.nasa.gov/sensors/srtm ; accessed via Open-Elevation – https://open-elevation.com/
- MODIS/Terra Vegetation Indices 16-Day L3 Global 250 m (MOD13Q1), NASA LP DAAC – https://lpdaac.usgs.gov/products/mod13q1v061/ ; accessed via ORNL DAAC MODIS web service – https://modis.ornl.gov/data/modis_webservice.html
- NASA Space Apps Challenge 2026, "Field Shift: Adapting Farms with NASA Data" – https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- FAO guidance on crop water requirements and evapotranspiration (FAO Irrigation and Drainage Papers). Used only as general background for approximate seasonal water needs.
- General agronomy and extension guidance on crop rotation and cover crops (e.g. USDA SARE "Managing Cover Crops Profitably"; FAO conservation agriculture materials). Used as approximate rules of thumb for frost tolerance, nitrogen fixation, residue, family breaks and soil water capacity by texture.
- All crop and soil parameters in the app are approximate and labelled as such. They are not taken from a single study and must be validated locally.

## Use of Artificial Intelligence
- We used **Claude (Anthropic)** as an AI assistant during the hackathon to help:
  - write and debug code: the web app, the scoring and optimizer engine, and the NASA POWER / SRTM / MODIS data access;
  - summarize data;
  - draft texts: README, this submission and the slide text.
- The team reviewed, tested and edited all AI-assisted output and is responsible for the final result.
- Crop parameters were drafted as approximate rules of thumb and are marked for expert validation.
- **No AI-generated images, video or audio** are used.
- No NASA logo, flag or emblem is used.

## Team BNova
- **Berrak**: 3rd-year Industrial Engineering; data analysis, optimization, crop data review
- **Nisa Nur**: 3rd-year Industrial Engineering; data analysis, optimization, presentation
- **Ömer**: 2nd-year Computer Engineering; software, web app, NASA data integration, publishing
