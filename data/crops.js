// Crop knowledge base for the rotation recommender.
// IMPORTANT: values are APPROXIMATE, general agronomy rules of thumb collected for the hackathon prototype.
// They must be checked by the team (and ideally a local agricultural expert / İl Tarım Müdürlüğü)
// before being presented as advice. Keep this honest in the demo and the submission.
//
// MAIN_CROPS fields
//   growMonths : calendar months the crop occupies the field (sowing → harvest), in order
//   family     : botanical/pest family; the same family in consecutive years means no pest/disease break
//   water      : approximate seasonal water need (mm, rain + irrigation)
//   nDemand    : nitrogen demand 0-3 (negative = legume that leaves nitrogen behind)
//   organic    : residue / organic matter returned 0-3
//   market     : market value 0-3
//   heatMax    : monthly extreme max temperature (POWER T2M_MAX, °C) above which a heat spike may hurt the crop
//   flower     : typical flowering / pollination month — the stage where heat hurts yield most (heat is checked only there)
//   frost      : "tolerant" | "sensitive"
//   Main-crop values checked against FAO Crop Water Information, USDA-NASS Ag Handbook 628, TAGEM and
//   university extension sources: docs/crop_check_main.md. Canola is often sown late September; modelled from October.
//
// ROTATION_CROPS (cover / catch / second crops) fields
//   months       : typical growing length in months
//   tMin, tMax   : comfortable range of MONTHLY MEAN air temperature (°C) during growth
//   frost        : "tolerant" = survives typical winter frost, "sensitive" = needs a frost-free period
//   water        : approximate water need over the season (mm, rain + irrigation)
//   family       : see above
//   nfix, erosion, forage, organic, market : 0-3 scores (benefit for that farmer priority)
//   hardyC       : lowest temperature (°C) the crop survives in winter; compared with NASA POWER T2M_MIN (month's coldest night)
//   Cover-crop values checked against USDA SARE "Managing Cover Crops Profitably" (3rd ed.) and others: docs/crop_check_cover.md

(typeof window !== "undefined" ? window : globalThis).MAIN_CROPS = [
  { id: "wheat", tr: "Buğday (kışlık)", en: "Winter wheat", growMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6, 7], family: "grass", water: 500, nDemand: 2, organic: 2, market: 3, heatMax: 33, flower: 5, frost: "tolerant" },
  { id: "barley", tr: "Arpa (kışlık)", en: "Winter barley", growMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6], family: "grass", water: 400, nDemand: 1, organic: 2, market: 2, heatMax: 33, flower: 5, frost: "tolerant" },
  { id: "canola", tr: "Kanola (kışlık)", en: "Winter canola", growMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6], family: "brassica", water: 450, nDemand: 2, organic: 1, market: 3, heatMax: 30, flower: 4, frost: "tolerant" },
  { id: "maize", group: "maize", tr: "Mısır (silajlık)", en: "Silage maize", growMonths: [5, 6, 7, 8, 9], family: "grass", water: 550, nDemand: 3, organic: 2, market: 3, heatMax: 35, flower: 7, frost: "sensitive" },
  { id: "sunflower", tr: "Ayçiçeği", en: "Sunflower", growMonths: [4, 5, 6, 7, 8, 9], family: "aster", water: 600, nDemand: 2, organic: 1, market: 3, heatMax: 35, flower: 7, frost: "sensitive" },
  { id: "chickpea_main", tr: "Nohut (yazlık)", en: "Chickpea (spring)", growMonths: [3, 4, 5, 6, 7], family: "legume", water: 300, nDemand: -1, organic: 1, market: 3, heatMax: 35, flower: 6, frost: "sensitive" },
  { id: "corn_grain", group: "maize", tr: "Mısır (dane)", en: "Grain corn", growMonths: [5, 6, 7, 8, 9, 10], family: "grass", water: 650, nDemand: 3, organic: 3, market: 3, heatMax: 35, flower: 7, frost: "sensitive" },
  { id: "soybean_main", tr: "Soya fasulyesi", en: "Soybean", growMonths: [5, 6, 7, 8, 9, 10], family: "legume", water: 550, nDemand: -1, organic: 1, market: 3, heatMax: 35, flower: 7, frost: "sensitive" },
  { id: "sorghum", tr: "Sorgum (dane)", en: "Grain sorghum", growMonths: [5, 6, 7, 8, 9, 10], family: "grass", water: 550, nDemand: 2, organic: 2, market: 2, heatMax: 36, flower: 8, frost: "sensitive" },
  { id: "tomato", tr: "Domates (tarla)", en: "Field tomato", growMonths: [5, 6, 7, 8, 9], family: "nightshade", water: 500, nDemand: 3, organic: 0, market: 3, heatMax: 35, flower: 7, frost: "sensitive" },
  // A fallow year: no crop at all (common in dry wheat regions). Never proposed by the optimizer.
  { id: "fallow", tr: "Nadas (boş yıl)", en: "Fallow (no crop)", growMonths: [], family: "fallow", water: 0, nDemand: 0, organic: 0, market: 0, heatMax: 99, frost: "tolerant", noOptimize: true }
];

(typeof window !== "undefined" ? window : globalThis).ROTATION_CROPS = [
  // Cool-season (autumn/winter) options
  { id: "vetch_oat", tr: "Fiğ + yulaf karışımı", en: "Vetch + oat mix", months: 6, tMin: 2, tMax: 22, frost: "tolerant", water: 300, family: "legume", nfix: 3, erosion: 2, forage: 2, organic: 2, market: 2, hardyC: -10 },
  { id: "rye", tr: "Çavdar (örtü bitkisi)", en: "Cereal rye (cover crop)", months: 6, tMin: 0, tMax: 22, frost: "tolerant", water: 250, family: "grass", nfix: 0, erosion: 3, forage: 2, organic: 3, market: 1, hardyC: -34 },
  { id: "rye_vetch", tr: "Çavdar + fiğ karışımı", en: "Cereal rye + hairy vetch mix", months: 6, tMin: 1, tMax: 22, frost: "tolerant", water: 300, family: "mix", nfix: 2, erosion: 3, forage: 2, organic: 3, market: 1, hardyC: -30 },
  { id: "faba", tr: "Bakla", en: "Faba bean", months: 4, tMin: 3, tMax: 22, frost: "tolerant", water: 350, family: "legume", nfix: 3, erosion: 2, forage: 2, organic: 2, market: 2, hardyC: -5 },
  { id: "pea", tr: "Yem bezelyesi", en: "Field pea", months: 4, tMin: 4, tMax: 22, frost: "tolerant", water: 350, family: "legume", nfix: 3, erosion: 2, forage: 3, organic: 1, market: 2, hardyC: -8 },
  { id: "clover", tr: "Kırmızı üçgül", en: "Crimson clover", months: 6, tMin: 3, tMax: 22, frost: "tolerant", water: 350, family: "legume", nfix: 2, erosion: 2, forage: 3, organic: 2, market: 1, hardyC: -15 },
  { id: "lentil", tr: "Mercimek", en: "Lentil", months: 3, tMin: 4, tMax: 24, frost: "tolerant", water: 250, family: "legume", nfix: 2, erosion: 1, forage: 1, organic: 1, market: 3, hardyC: -6 },
  { id: "mustard", tr: "Hardal (örtü bitkisi)", en: "Mustard (cover crop)", months: 3, tMin: 5, tMax: 22, frost: "tolerant", water: 200, family: "brassica", nfix: 0, erosion: 2, forage: 1, organic: 2, market: 1, hardyC: -4 },
  // Warm-season (spring/summer) options
  { id: "chickpea", tr: "Nohut", en: "Chickpea", months: 4, tMin: 8, tMax: 26, frost: "sensitive", water: 300, family: "legume", nfix: 2, erosion: 1, forage: 1, organic: 1, market: 3 },
  { id: "cowpea", tr: "Börülce", en: "Cowpea", months: 3, tMin: 18, tMax: 32, frost: "sensitive", water: 300, family: "legume", nfix: 3, erosion: 3, forage: 2, organic: 2, market: 2 },
  { id: "sudangrass", tr: "Sudan otu", en: "Sorghum-sudangrass", months: 3, tMin: 18, tMax: 35, frost: "sensitive", water: 350, family: "grass", nfix: 0, erosion: 3, forage: 3, organic: 3, market: 2 },
  { id: "buckwheat", tr: "Karabuğday", en: "Buckwheat", months: 2, tMin: 12, tMax: 28, frost: "sensitive", water: 250, family: "other", nfix: 0, erosion: 1, forage: 0, organic: 1, market: 1 },
  { id: "soybean", tr: "Soya fasulyesi", en: "Soybean", months: 4, tMin: 18, tMax: 30, frost: "sensitive", water: 450, family: "legume", nfix: 3, erosion: 1, forage: 1, organic: 1, market: 3 }
];
