# Field Shift – by TARSA 🌱

**NASA Space Apps Challenge 2026 · Yalova, Turkey · Challenge: [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/)**

Live app: https://lordomer.github.io/tarsa-field-shift/

Many fields stay bare for months between main crops, and the same crop is often grown year after year. Bare soil loses topsoil and nutrients; monoculture builds up pests and drains nitrogen. Field Shift helps farmers **compare 3-year crop rotations** for their own location with NASA Earth observation data, their soil and their priorities. It is decision support, not a prescription.

## What it does
1. **Location**: pick a preset (Türkiye or US Corn Belt; Nebraska opens by default) or type any coordinates. Loads 20 years (2004–2023) of NASA POWER climate data, SRTM slope and one year of MODIS satellite greenness.
2. **Farmer inputs**: current 3-year rotation, irrigation water (none / limited / plenty), soil texture, slope (auto-filled from SRTM), organic matter, priorities (nitrogen, erosion, water, organic matter, feed, market).
3. **Your field's year**: monthly rain, temperature, frost days, heat spikes, root-zone soil wetness and MODIS NDVI, with the bare window highlighted.
4. **Rotation comparison**: A = your current rotation, B = current + cover crops, C = best rotation found, D = alternative using different crops. The optimizer tests every distinct 3-year sequence of 10 main crops that keeps your year-1 crop (73 rotations) and fills each bare window with the best-fitting of 13 cover crops.
5. **Explanations for every strategy**: why it was suggested, evidence (NASA numbers), benefits, information gaps and risks to check locally.
6. **Your field in 3D**, built from every input: the real SRTM terrain around the point; a soil cut-away with subsoil colour by texture, a dark topsoil layer by organic matter and a blue root-zone water band that follows NASA POWER soil wetness × the texture's water capacity; the slope (SRTM or the farmer's input) tilts the field and soil washes downhill on bare soil; sprinklers in water-deficit months if irrigation water is available, yellowing and shorter plants if not; frost tint in frost months, warm light in heat-spike months; the land around coloured by that month's MODIS NDVI. Today's rotation (A) and the best different rotation (C) side by side with a 36-month slider and play; a running "rain on bare soil so far" counter for each.
7. **Climate trends**, glossary and an honest "Data, limits & honesty" section. English / Turkish.

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

## Decision Lab (hard limits + Pareto)
A separate card after the rotation comparison. It **filters** the 73 rotations the optimizer already scored; it never changes A/B/C/D, their scores, the timelines or the 3D view.

- **Limits** (all optional): max. irrigation per year (mm), crops I will not grow, crops I must grow.
  - The water limit is checked for **each agricultural year (Oct–Sep) of the 3-year cycle separately**: `max(W1, W2, W3) ≤ limit` (tolerance 1e-6, a plan exactly at the limit is feasible). A plan whose average is below the limit but one year is above it is removed. W is the model's irrigation need (crop need − rain in its months − stored soil water), including cover crops; each planting counts in the year it is sown. It is separate from the none / limited / plenty irrigation setting, which only changes the score weights.
  - Forbidden / required crops apply to **main crops** only; a crop grown only as a cover crop does not count.
  - Output: plans evaluated / feasible / removed, the 3 most common reasons, whether your current rotation (A) meets the limits, the best feasible plan by the normal overall score and how it differs from the next one, and a list of all plans with their yearly irrigation and the reason for removal.
  - If nothing is feasible, no plan is recommended; it shows what to relax (the lowest working water limit and how many plans each dropped rule would allow).
- **Pareto explorer** (feasible plans only): a plan is Pareto-optimal if no other feasible plan is at least as good on all four goals and strictly better on one (tolerance 1e-6; equal plans do not remove each other). Goals: irrigation need (avg mm/yr, **min**), rain on bare soil (mm/yr, **min**), raw nitrogen balance per year (**max**), climate risk = frost + heat events per year (**min**; the raw count is used, not the 0–1 climate score where higher is better). The chart shows irrigation × bare-soil rain, colour = nitrogen; A and C are marked. Hover or tap a dot for its values, the plan that dominates it and its water / bare-soil trade-off against the best feasible plan.
- **Limits of this version:** no budget limit, no "keep year 1" or repeat limits, no climate stress test (20-year monthly averages only), scores are relative (not yield or profit), irrigation and bare-soil rain are model estimates.
- **Future work:** NASA POWER year-by-year stress test (dry / hot years, robust choice), sensitivity (tornado) analysis, budget limit, multi-field planning (MILP), water-limit → feasible-plans chart.

## Tests
```
node tests/decision.test.cjs     # Decision Lab: limits, Pareto, immutability, i18n (no dependencies)
node tests/harness.cjs --check   # A/B/C/D, scores and top-10 ranking unchanged vs tests/baseline.json
```

## NASA data
- [NASA POWER](https://power.larc.nasa.gov/), Agroclimatology community, monthly point API: `T2M`, `T2M_MAX`, `T2M_MIN`, `PRECTOTCORR`, `FROST_DAYS`, `GWETROOT`, `GWETTOP`, `EVPTRNS`, `ALLSKY_SFC_SW_DWN`, `RH2M`.
- [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) elevation via the [Open-Elevation](https://open-elevation.com/) API → slope, and SRTM 30 m grids via [OpenTopoData](https://www.opentopodata.org/) → 3D terrain (`data/fetch_terrain.cjs` → `data/terrain.js`).
- [MODIS](https://modis.gsfc.nasa.gov/) Terra MOD13Q1 NDVI (250 m, 16-day) via the [ORNL DAAC MODIS web service](https://modis.ornl.gov/data/modis_webservice.html) → monthly greenness, least-green (likely bare) months.

## Other data (from the challenge resources)
- [USDA NASS Cropland Data Layer](https://www.nass.usda.gov/Research_and_Science/Cropland/SARS1a.php) via the CropScape service: crop grown each year (2019–2025) at the US presets (Iowa, Kansas, Nebraska). It fills the farmer's current rotation automatically. Embedded with `data/fetch_presets.cjs` because the service blocks browser requests.

## Limits
POWER is a ≈50 km grid, not field scale; soil wetness is modelled (MERRA-2); NDVI is a 2 × 2 km mix of fields; crop parameters are FAO / USDA / TAGEM averages (sources in docs/crop_check_*.md) and should be validated locally by agronomists; scores compare options, they do not predict yield or profit.

## Files
- `index.html`, `css/style.css`
- `js/engine.js` – climate helpers, single-window recommender, trends, NASA POWER loader (no DOM, testable in Node)
- `js/rotation.js` – 3-year rotation timeline, cover-crop filling, scoring, optimizer (no DOM)
- `js/decision.js` – Decision Lab: limits (per-year water, forbidden / required crops) and Pareto (no DOM)
- `tests/harness.cjs`, `tests/decision.test.cjs`, `tests/baseline.json` – Node tests
- `js/nasa-extra.js` – SRTM slope, terrain grid and MODIS NDVI loaders
- `js/field3d.js` – 3D living-field view (three.js r128 from cdnjs, loaded only when the section is visible)
- `js/i18n.js` – English / Turkish text; `js/app.js` – UI (SVG charts, no libraries)
- `data/yalova.js` – embedded NASA data for Yalova; `data/crops.js` – crop knowledge base (approximate)
- `data/presets.js` – embedded NASA POWER, SRTM, MODIS (and USDA CDL for US) data for the presets, made by `data/fetch_presets.cjs`
- `data/fetch_power.py` – download NASA POWER data for any point (Python standard library)

## Run locally
Open `index.html` in a browser, or run `node .dev-server.cjs` and open http://localhost:8765. Yalova data is embedded; other locations load live (no API keys).

## Team
Berrak, Nisa Nur (Industrial Engineering), Ömer (Computer Engineering).

## Tools & AI disclosure
Plain HTML/CSS/JavaScript; the only external library is [three.js](https://threejs.org/) r128 (MIT licence, from cdnjs) for the 3D view. Python standard library and Node.js scripts for data downloads. **AI usage:** Website coding and data retrieval were prepared with the help of Claude (Anthropic) and checked by the team. No AI visualization was used. No NASA logos are used; no NASA endorsement implied.
