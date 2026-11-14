// NASA POWER (Prediction Of Worldwide Energy Resources), community=AG
// Point: Yalova, Turkey (lat 40.65, lon 29.27), monthly data 2004-2023.
// Source: https://power.larc.nasa.gov/api/temporal/monthly/point
// "monthly" = 20-year average for each calendar month (Jan..Dec).
// Units: T2M/T2M_MAX/T2M_MIN in °C (MAX/MIN = monthly extremes), PRECTOTCORR in mm/day,
// GWETROOT/GWETTOP = soil wetness 0-1 (root zone / surface), FROST_DAYS = days per month,
// EVPTRNS = evapotranspiration, ALLSKY_SFC_SW_DWN = solar radiation (MJ/m²/day), RH2M = %.
// "years": annual mean temp (t, °C), annual precipitation (p, mm), summer (JJA) root-zone
// soil wetness (sm), frost days per year (fd).
window.YALOVA_DATA = {
  name: "Yalova, Turkey",
  // Farmland point on the Yalova plain. The NASA POWER grid cell (0.5° x 0.625°) is the same as for
  // the city centre (40.65, 29.27) where the climate series below was downloaded.
  lat: 40.64,
  lon: 29.33,
  period: "2004-2023",
  source: "NASA POWER (fetched 14 Nov 2026)",
  monthly: {
    ALLSKY_SFC_SW_DWN: [5.94, 8.59, 12.56, 17.94, 21.83, 24.7, 26.26, 23.07, 17.36, 11.43, 7.79, 5.61],
    EVPTRNS: [0.19, 0.39, 0.97, 2.75, 4.93, 4.86, 1.91, 0.53, 0.55, 0.98, 0.65, 0.29],
    FROST_DAYS: [12.1, 8.95, 4.95, 0.4, 0, 0, 0, 0, 0, 0, 0.8, 6.45],
    GWETROOT: [0.65, 0.67, 0.68, 0.66, 0.59, 0.53, 0.48, 0.46, 0.47, 0.52, 0.56, 0.62],
    GWETTOP: [0.66, 0.68, 0.68, 0.65, 0.59, 0.53, 0.45, 0.42, 0.45, 0.52, 0.57, 0.62],
    PRECTOTCORR: [2.75, 2.41, 2.03, 1.51, 1.37, 1.73, 0.67, 0.69, 1.47, 2.14, 2.02, 2.55],
    RH2M: [82.05, 79.44, 75.34, 71.26, 70.78, 69.31, 64.82, 65.97, 68.38, 75.54, 77.25, 81.43],
    T2M: [4.3, 5.66, 7.88, 12.21, 17.02, 21.09, 23.78, 24.31, 20.42, 15.37, 10.81, 6.59],
    T2M_MAX: [15.83, 18.23, 21.42, 25.27, 30.01, 32.35, 35.48, 35.78, 33.43, 27.14, 22.78, 18],
    T2M_MIN: [-5.06, -4.29, -2.1, 1.88, 7.09, 12.12, 15.07, 15.6, 11.58, 6.12, 1.1, -2.6]
  },
  // SRTM elevation/slope (via Open-Elevation) and MODIS MOD13Q1 NDVI 2025 (via ORNL DAAC), 2 km x 2 km window.
  // Fetched 14 Nov 2026 with js/nasa-extra.js; embedded so the demo works offline.
  extra: {
    slope: { elevation: 52, slope: 5.1, cls: "gentle" },
    ndvi: { year: 2025, monthly: [0.411, 0.373, 0.503, 0.592, 0.571, 0.443, 0.352, 0.311, 0.308, 0.415, 0.518, 0.443] }
  },
  years: {
    2004: { t: 13.36, p: 570, sm: 0.49, fd: 53 }, 2005: { t: 13.41, p: 754, sm: 0.49, fd: 36 },
    2006: { t: 13.29, p: 506, sm: 0.48, fd: 46 }, 2007: { t: 14.37, p: 538, sm: 0.46, fd: 33 },
    2008: { t: 14.1, p: 526, sm: 0.46, fd: 38 }, 2009: { t: 14.01, p: 664, sm: 0.48, fd: 21 },
    2010: { t: 14.75, p: 976, sm: 0.54, fd: 26 }, 2011: { t: 12.73, p: 494, sm: 0.51, fd: 39 },
    2012: { t: 14.2, p: 641, sm: 0.48, fd: 59 }, 2013: { t: 14.31, p: 451, sm: 0.47, fd: 34 },
    2014: { t: 14.89, p: 771, sm: 0.49, fd: 14 }, 2015: { t: 13.77, p: 732, sm: 0.54, fd: 36 },
    2016: { t: 14.2, p: 724, sm: 0.49, fd: 44 }, 2017: { t: 13.76, p: 652, sm: 0.5, fd: 34 },
    2018: { t: 15.03, p: 782, sm: 0.5, fd: 21 }, 2019: { t: 14.54, p: 588, sm: 0.5, fd: 18 },
    2020: { t: 14.61, p: 544, sm: 0.49, fd: 19 }, 2021: { t: 14.02, p: 746, sm: 0.5, fd: 33 },
    2022: { t: 13.97, p: 547, sm: 0.49, fd: 44 }, 2023: { t: 15.08, p: 760, sm: 0.49, fd: 25 }
  }
};
