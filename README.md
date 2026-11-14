# Field Shift – by BNöva 🌱

**NASA Space Apps Challenge 2026 · Yalova, Turkey · Challenge: [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/)**

Live app: https://lordomer.github.io/bnova-field-shift/

Many fields stay bare for months between main crops, and the same crop is often grown year after year. Bare soil loses topsoil and nutrients; monoculture builds up pests and drains nitrogen. Field Shift helps farmers **compare 3-year crop rotations** for their own location with NASA Earth observation data, their soil and their priorities. It is decision support, not a prescription.

## What it does
1. **Location**: pick a preset in Turkey or type coordinates. Loads 20 years (2004–2023) of NASA POWER climate data, SRTM slope and one year of MODIS satellite greenness.
2. **Farmer inputs**: current 3-year rotation, irrigation water (none / limited / plenty), soil texture, slope (auto-filled from SRTM), organic matter, priorities (nitrogen, erosion, water, organic matter, feed, market).
3. **Your field's year**: monthly rain, temperature, frost days, heat spikes, root-zone soil wetness and MODIS NDVI, with the bare window highlighted.
4. **Rotation comparison**: A = your current rotation, B = current + cover crops, C = best rotation found, D = alternative using different crops. The optimizer tests every distinct 3-year sequence of 10 main crops that keeps your year-1 crop (73 rotations) and fills each bare window with the best-fitting of 13 cover crops.
5. **Explanations for every strategy**: why it was suggested, evidence (NASA numbers), benefits, information gaps and risks to check locally.
6. **Climate trends**, glossary and an honest "Data, limits & honesty" section. English / Turkish.

## Scoring (0–100, relative)
Eight sub-scores, weighted by the farmer's priorities, water and soil:

| Sub-score | Based on |
|---|---|
| Soil cover (erosion) | share of yearly rain that falls on bare soil (NASA POWER precipitation × bare months) |
| Nitrogen balance | legume cover crops add, hungry crops take |
| Organic matter | residues + cover crops |
| Water | irrigation gap = crop need − rain in its months − soil water stored at sowing (from NASA POWER GWETROOT and soil texture) |
| Pest & disease break | same crop family in consecutive years, same-family cover right before a main crop |
| Climate risk | frost days (FROST_DAYS) in frost-sensitive crop months, heat spikes (T2M_MAX) above crop tolerance |
| Market & income, animal feed | crop attributes |

## NASA data
- [NASA POWER](https://power.larc.nasa.gov/), Agroclimatology community, monthly point API: `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `FROST_DAYS`, `GWETROOT`, `GWETTOP`, `EVPTRNS`, `ALLSKY_SFC_SW_DWN`, `RH2M`.
- [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) elevation via the [Open-Elevation](https://open-elevation.com/) API → slope.
- [MODIS](https://modis.gsfc.nasa.gov/) Terra MOD13Q1 NDVI (250 m, 16-day) via the [ORNL DAAC MODIS web service](https://modis.ornl.gov/data/modis_webservice.html) → monthly greenness, least-green (likely bare) months.

## Other data (from the challenge resources)
- [USDA NASS Cropland Data Layer](https://www.nass.usda.gov/Research_and_Science/Cropland/SARS1a.php) via the CropScape service: crop grown each year (2019–2025) at the US presets (Iowa, Kansas, Nebraska). It fills the farmer's current rotation automatically. Embedded with `data/fetch_presets.cjs` because the service blocks browser requests.

## Limits
POWER is a ≈50 km grid, not field scale; soil wetness is modelled (MERRA-2); NDVI is a 2 × 2 km mix of fields; crop parameters are FAO / USDA / TAGEM averages (sources in docs/crop_check_*.md) and should be validated locally by agronomists; scores compare options, they do not predict yield or profit.

## Files
- `index.html`, `css/style.css`
- `js/engine.js` – climate helpers, single-window recommender, trends, NASA POWER loader (no DOM, testable in Node)
- `js/rotation.js` – 3-year rotation timeline, cover-crop filling, scoring, optimizer (no DOM)
- `js/nasa-extra.js` – SRTM slope and MODIS NDVI loaders
- `js/i18n.js` – English / Turkish text; `js/app.js` – UI (SVG charts, no libraries)
- `data/yalova.js` – embedded NASA data for Yalova; `data/crops.js` – crop knowledge base (approximate)
- `data/presets.js` – embedded NASA POWER, SRTM, MODIS (and USDA CDL for US) data for the presets, made by `data/fetch_presets.cjs`
- `data/fetch_power.py` – download NASA POWER data for any point (Python standard library)

## Run locally
Open `index.html` in a browser, or run `node .dev-server.cjs` and open http://localhost:8765. Yalova data is embedded; other locations load live (no API keys).

## Team
Berrak, Nisa Nur (Industrial Engineering), Ömer (Computer Engineering).

## Tools & AI disclosure
Plain HTML/CSS/JavaScript (no external libraries), Python standard library. An AI assistant (Claude, Anthropic) helped write code, fetch and summarize data, and draft text. All results were reviewed by the team. No AI-generated images. No NASA logos are used; no NASA endorsement implied.
