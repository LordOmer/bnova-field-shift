# Field Shift – NASA Space Apps 2026 Submission (Team BNova, Yalova)

> Paste-ready text for the project submission form. Before submitting, check every number marked **[check in app]** against the live demo.

---

## Project name
**Field Shift – NASA-data crop rotation planner**

## Project link
https://lordomer.github.io/bnova-field-shift/ (public, no login)

## Short summary (≈100 words)
Many fields in Turkey stay bare for months between main crops, and the same crop is often grown year after year. Field Shift is a free, phone-friendly web tool that compares a farmer's current 3-year rotation with better options. Using 20 years (2004–2023) of NASA POWER agro-climate data for any location, it evaluates every 3-year sequence of 7 main crops, fills bare windows with the best-fitting cover crop, and scores each plan (0–100) on soil cover, nitrogen, organic matter, water, pest break, climate risk and income. Every suggestion explains why, shows the NASA evidence, and lists information gaps for local experts.

## What does it do / how does it work?
**For the farmer (or extension advisor):**
1. Choose a location (Yalova is built in; any other coordinate is loaded live from the NASA POWER API, no key needed).
2. Enter the current rotation (example: silage maize every year, field bare in winter), farmer priorities (add nitrogen, reduce erosion, save water, organic matter, animal feed, market income) and whether irrigation is available.
3. See a **monthly climate calendar**: rainfall, temperature, frost days and root-zone soil wetness (GWETROOT), with bare months highlighted.
4. See a **3-year rotation comparison** of three strategies:
   - **A. Current rotation** as the farmer runs it today.
   - **B. Current rotation + cover crops** in the bare windows.
   - **C. Best rotations found by the optimizer.**
5. See **climate trends 2004–2023** for the location (Yalova: +0.53 °C per decade, −7.5 frost days per decade, +38 mm rain per decade).

**Optimizer.** It enumerates every 3-year sequence of 7 main crops (wheat, barley, silage maize, sunflower, field tomato, chickpea, canola): 7³ = 343 sequences. For each bare window it tries 12 cover crops (vetch + oat, cereal rye, faba bean, field pea, crimson clover, lentil, mustard, chickpea, cowpea, sorghum-sudangrass, buckwheat, soybean) and keeps the one whose temperature range, water need and frost tolerance best fit the local NASA climate in those months.

**Scoring (0–100), from 7 sub-scores:**
| Sub-score | What it measures | Data |
|---|---|---|
| Soil cover | Rain that falls on bare soil (erosion and leaching risk) | NASA POWER PRECTOTCORR + crop calendar |
| Nitrogen balance | N removed by crops vs. N fixed by legumes | Crop table (approx.) |
| Organic matter | Residue and root biomass returned | Crop table (approx.) |
| Water | Irrigation gap = crop water need − NASA rainfall in its growing months | PRECTOTCORR |
| Pest / disease break | Same crop family in consecutive years is penalised | Crop families |
| Climate risk | Frost days in the months of frost-sensitive crops; heat spikes from T2M_MAX | FROST_DAYS, T2M_MAX, T2M |
| Market / income | Rough relative market value | Crop table (approx., no prices) |

Farmer priorities and irrigation availability change the weights (e.g. without irrigation, the water sub-score weighs much more).

**Every strategy card explains itself**, as the challenge asks:
- **Why suggested** (plain language),
- **Evidence** (the NASA numbers behind it, e.g. winter rainfall on bare soil, frost days in the crop's months),
- **Benefits**,
- **Information gaps** (what the tool does not know: soil texture, pH, prices, local pests),
- **Risks needing local expert review**.

Other features: English/Turkish toggle, glossary (evapotranspiration, soil moisture, frost days, cover crop, nitrogen fixation, satellite vs. ground data), a "Data limits & uncertainty" section, and a clear disclaimer that the tool supports, not replaces, local agricultural expertise.

**Technology.** A static web app (HTML, CSS, plain JavaScript, no libraries, no server). Charts are hand-drawn SVG. The scoring engine is a separate JavaScript module that has no DOM dependency and can be tested in Node.js. A small Python script (standard library only) downloads NASA POWER data as JSON/CSV for offline analysis.

## Benefits & impact
- **Soil health:** shows how much rain falls on bare soil under the current plan and how much a cover crop would protect it. Erosion and nutrient loss on bare winter fields are common in the Marmara region.
- **Climate resilience:** frost-day and heat checks use the farmer's own 20-year local record, and the trend view shows the climate is already shifting (Yalova: fewer frost days, warmer). This can open windows for new crops and close others.
- **Water:** the irrigation gap is shown in millimetres, so a farmer without irrigation can avoid crops the rain cannot carry.
- **Less fertilizer:** legume cover crops and rotations with chickpea or faba bean add nitrogen and can reduce purchased nitrogen fertilizer.
- **Accessible:** free, works on a phone browser, no account, no install, bilingual. Usable by farmers, agricultural engineering students and extension staff (e.g. provincial agriculture directorates) anywhere NASA POWER has data, which is worldwide.
- **Transparent:** each recommendation shows its evidence and its unknowns, which builds trust and makes it easy for an expert to correct.

## What we hope to achieve
- Make "what should I plant in the gap, and what should I rotate?" a 2-minute, evidence-based conversation between a farmer and an advisor.
- Move farmers away from monoculture and bare winter fields toward rotations with cover crops, with numbers they can check.
- Validate the crop parameters with local agronomists and the provincial agriculture directorate, then pilot with a few farms around Yalova.
- Add higher-resolution NASA data (see Future work) so the tool moves from region scale toward field scale.

## Tools, languages, hardware
- **Languages:** HTML5, CSS3, JavaScript (ES2017+, no frameworks or external libraries), Python 3 (standard library only).
- **Data access:** NASA POWER REST API (monthly point endpoint, Agroclimatology community), called directly from the browser (CORS supported, no API key).
- **Hosting:** GitHub Pages (static).
- **Tools:** Visual Studio Code, Git/GitHub, a web browser, Node.js for testing the engine, Claude (Anthropic) as an AI coding and writing assistant (see AI section).
- **Hardware:** team laptops and phones (for mobile testing). No special hardware.

## Creativity
- **Rotation as an optimization problem:** instead of a single "best crop" list, the tool searches all 343 three-year main-crop sequences and automatically fills every bare window with the best cover crop for that place's climate. This brings an industrial-engineering approach (enumeration + multi-criteria scoring) to a farming decision.
- **Side-by-side "today vs. small change vs. best":** farmers see the effect of only adding a cover crop (no change to their main crop) next to a full redesign. The small change is often the easiest one to adopt.
- **"Rain on bare soil" metric:** a simple, visual soil-cover indicator built straight from NASA rainfall and the crop calendar.
- **Explanations built in:** every plan comes with why, evidence, benefits, gaps and risks, so the tool is honest about what it does not know.

## How we considered the challenge's factors
| Challenge factor | How Field Shift addresses it |
|---|---|
| Soil health | Soil cover, organic matter and nitrogen sub-scores; cover crops in every bare window |
| Changing weather and water | 20-year NASA climatology + 2004–2023 trends; irrigation gap per crop; irrigation availability changes the weights |
| Temperature / heat stress | T2M ranges per crop; heat spikes from T2M_MAX |
| Frost risk | FROST_DAYS checked against frost-sensitive crops' months |
| Precipitation / extreme rain | PRECTOTCORR drives the water and soil cover scores (extremes from GPM: future work) |
| Soil moisture | GWETROOT shown in the calendar (modeled, see limits) |
| Evapotranspiration | EVPTRNS loaded and explained in the glossary; full ET-based water balance is future work |
| Crop characteristics | Table of 7 main crops + 12 cover crops (season, temperature range, frost tolerance, water need, N-fixation, residue, family) |
| Farmer priorities | Water use, animal feed, nitrogen fixation, erosion, organic matter, market: all change the weights |
| Bare-field periods | Detected from the crop calendar and highlighted on the climate calendar |
| Explain why / evidence / benefits / gaps / risks | Required fields on every strategy card |
| Accessibility | Free, static, phone-friendly, English/Turkish, glossary for non-experts |

**Data limits we state openly in the app:**
- NASA POWER is on a ≈0.5° × 0.625° grid (≈50 km). It describes the region's climate, not one field.
- GWETROOT in POWER is modeled (MERRA-2 reanalysis with data assimilation), not a direct satellite soil-moisture reading.
- Crop parameters (temperature ranges, water needs, nitrogen, residue, market scores) are approximate rules of thumb and must be checked by local experts.
- The tool does not yet know soil texture, pH, salinity, slope, local pests or real prices.
- Scores compare options relative to each other. They are not yield forecasts.

## NASA data used
**NASA POWER – Prediction Of Worldwide Energy Resources** – https://power.larc.nasa.gov/
- API: monthly point data, Agroclimatology (AG) community – https://power.larc.nasa.gov/docs/services/api/
- Period: 2004–2023 (20 years). Yalova (40.65 N, 29.27 E) is embedded in the app; any other coordinate is fetched live.

| Parameter | Meaning | How we use it |
|---|---|---|
| T2M | Air temperature at 2 m (monthly mean) | Crop temperature fit per month; temperature trend |
| T2M_MAX | Max temperature at 2 m | Heat-spike risk for crops in summer months |
| T2M_MIN | Min temperature at 2 m | Cold-season context in the calendar |
| PRECTOTCORR | Bias-corrected precipitation | Irrigation gap, rain on bare soil, rainfall trend |
| FROST_DAYS | Days with frost | Frost risk for frost-sensitive crops; frost-day trend |
| GWETROOT | Root-zone soil wetness (0–1) | Shown in the monthly calendar as a soil-moisture indicator |
| GWETTOP | Surface soil wetness | Loaded; for future sowing-window checks |
| EVPTRNS | Evapotranspiration | Loaded and explained; for a future ET-based water balance |
| RH2M | Relative humidity at 2 m | Loaded; for future disease-risk indicators |
| ALLSKY_SFC_SW_DWN | Surface solar radiation | Loaded; for future growth / ET estimates |

**Note on sources inside POWER:** POWER combines satellite observations and model/reanalysis products (e.g. MERRA-2 for meteorology and soil wetness). We describe these values as "NASA satellite- and model-derived data", not as direct field measurements.

## Space agency partner & other data
None used yet beyond NASA POWER. Planned for future versions:
- **NASA SMAP** (Soil Moisture Active Passive) – satellite soil moisture to compare with modeled GWETROOT.
- **NASA GPM IMERG** – daily/half-hourly rainfall for extreme-rain and erosion-risk days.
- **SRTM** elevation – slope, to weight erosion risk on bare sloping fields.
- **Landsat / Sentinel-2 (ESA/Copernicus) NDVI** – detect when a real field is actually bare.
- Local data from the Turkish provincial agriculture directorate (soil texture, pH, crop prices) if available.

## References
- NASA POWER Project, NASA Langley Research Center – https://power.larc.nasa.gov/ (data and API documentation: https://power.larc.nasa.gov/docs/)
- NASA Space Apps Challenge 2026, "Field Shift: Adapting Farms with NASA Data" – https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- FAO, crop water requirements and evapotranspiration guidance (FAO Irrigation and Drainage Papers) – used only as general background for approximate seasonal water needs.
- General agronomy and extension guidance on crop rotation and cover crops (e.g. USDA SARE "Managing Cover Crops Profitably", FAO conservation agriculture materials) – used as approximate rules of thumb for frost tolerance, nitrogen fixation, residue and rotation family breaks.
- All crop parameters in the app are approximate and are labelled as such. They are not taken from a single study and must be validated locally.

## Use of Artificial Intelligence
We used **Claude (Anthropic)** as an AI assistant during the hackathon to help write and debug code (web app, scoring/optimizer engine, NASA POWER data fetching script), to summarize data, and to draft texts (README, this submission, slide text). The team reviewed, tested and edited all AI-assisted output and is responsible for the final result. The crop parameters were drafted as approximate rules of thumb and are marked for expert validation. **No AI-generated images, video or audio** are used in the project. No NASA logo, flag or emblem is used.

## Team BNova
- **Berrak** – 3rd-year Industrial Engineering: data analysis, optimization, crop data review
- **Nisa Nur** – 3rd-year Industrial Engineering: data analysis, optimization, presentation
- **Ömer** – 2nd-year Computer Engineering: software, web app, NASA data integration, publishing
