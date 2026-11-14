// Field Shift recommendation engine (no DOM). Works in the browser and in Node for testing.
(function (root) {
  const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const POWER_PARAMS = "T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,GWETROOT,GWETTOP,FROST_DAYS,EVPTRNS";
  const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

  // Monthly precipitation in mm/month from POWER's mm/day.
  function precipMm(climate, monthIdx) {
    return climate.monthly.PRECTOTCORR[monthIdx] * DAYS[monthIdx];
  }

  // Months (1-12) NOT used by the main crop, in calendar order starting right after harvest.
  function fallowWindow(growMonths) {
    const grow = new Set(growMonths);
    const last = growMonths[growMonths.length - 1];
    const win = [];
    for (let i = 1; i <= 12; i++) {
      const m = ((last - 1 + i) % 12) + 1;
      if (!grow.has(m)) win.push(m);
    }
    return win;
  }

  // Evaluate one rotation crop for one consecutive period of months.
  function evaluatePeriod(climate, crop, period) {
    let tempOk = 0, rain = 0, frostDays = 0;
    const tooCold = [], tooHot = [];
    for (const m of period) {
      const t = climate.monthly.T2M[m - 1];
      if (t >= crop.tMin && t <= crop.tMax) tempOk++;
      else if (t < crop.tMin) tooCold.push(m);
      else tooHot.push(m);
      rain += precipMm(climate, m - 1);
      frostDays += climate.monthly.FROST_DAYS[m - 1];
    }
    const tempFrac = tempOk / period.length;
    const waterRatio = rain / crop.water;
    const waterScore = Math.min(1, waterRatio);
    const frostOk = crop.frost === "tolerant" || frostDays < 1;
    const climateScore = 100 * (0.45 * tempFrac + 0.35 * waterScore + 0.2 * (frostOk ? 1 : 0)) * (frostOk ? 1 : 0.4);
    return { period, tempFrac, rain: Math.round(rain), waterRatio: round(waterRatio), frostDays: round(frostDays, 1), frostOk, tooCold, tooHot, climateScore };
  }

  // Best consecutive period of crop.months inside the fallow window.
  function bestFit(climate, crop, window) {
    if (crop.months > window.length) return null;
    let best = null;
    for (let s = 0; s + crop.months <= window.length; s++) {
      const ev = evaluatePeriod(climate, crop, window.slice(s, s + crop.months));
      if (!best || ev.climateScore > best.climateScore) best = ev;
    }
    return best;
  }

  // priorities: { water, nitrogen, erosion, forage, organic, market } booleans
  function priorityScore(crop, priorities) {
    const parts = [];
    if (priorities.water) parts.push(Math.max(0, 1 - crop.water / 500));
    if (priorities.nitrogen) parts.push(crop.nfix / 3);
    if (priorities.erosion) parts.push(crop.erosion / 3);
    if (priorities.forage) parts.push(crop.forage / 3);
    if (priorities.organic) parts.push(crop.organic / 3);
    if (priorities.market) parts.push(crop.market / 3);
    if (!parts.length) return 0.5;
    return parts.reduce((a, b) => a + b, 0) / parts.length;
  }

  function recommend(climate, mainCrop, crops, priorities) {
    const window = fallowWindow(mainCrop.growMonths);
    const results = [];
    for (const crop of crops) {
      const fit = bestFit(climate, crop, window);
      if (!fit) continue;
      const pScore = priorityScore(crop, priorities);
      const total = 0.6 * fit.climateScore + 0.4 * pScore * 100;
      results.push({ crop, fit, priority: round(pScore), total: Math.round(total) });
    }
    results.sort((a, b) => b.total - a.total);
    return { window, results };
  }

  // Least-squares slope per year.
  function slope(xs, ys) {
    const n = xs.length;
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
    return den ? num / den : 0;
  }

  function trends(climate) {
    const yrs = Object.keys(climate.years).map(Number).sort((a, b) => a - b);
    const get = k => yrs.map(y => climate.years[y][k]);
    return {
      years: yrs,
      tempPerDecade: round(slope(yrs, get("t")) * 10),
      precipPerDecade: Math.round(slope(yrs, get("p")) * 10),
      frostDaysPerDecade: round(slope(yrs, get("fd")) * 10, 1),
      summerSoilPerDecade: round(slope(yrs, get("sm")) * 10, 3)
    };
  }

  // Convert a NASA POWER monthly/point JSON response into our climate object.
  function climateFromPower(json, name, lat, lon) {
    const P = json.properties.parameter;
    const monthly = {};
    for (const [k, v] of Object.entries(P)) {
      const buckets = Array.from({ length: 12 }, () => []);
      for (const [ym, val] of Object.entries(v)) {
        const mo = +ym.slice(4);
        if (mo >= 1 && mo <= 12 && val > -900) buckets[mo - 1].push(val);
      }
      monthly[k] = buckets.map(a => round(a.reduce((s, x) => s + x, 0) / a.length));
    }
    const years = {};
    const yearSet = new Set(Object.keys(P.T2M).map(ym => +ym.slice(0, 4)));
    for (const y of yearSet) {
      let t = 0, p = 0, sm = 0, fd = 0, ok = true;
      for (let m = 1; m <= 12; m++) {
        const k = `${y}${String(m).padStart(2, "0")}`;
        if (P.T2M[k] === undefined || P.T2M[k] <= -900) { ok = false; break; }
        t += P.T2M[k]; p += P.PRECTOTCORR[k] * DAYS[m - 1]; fd += P.FROST_DAYS[k];
        if (m >= 6 && m <= 8) sm += P.GWETROOT[k];
      }
      if (ok) years[y] = { t: round(t / 12), p: Math.round(p), sm: round(sm / 3), fd: round(fd) };
    }
    return { name, lat, lon, period: "2004-2023", source: "NASA POWER (live)", monthly, years };
  }

  async function fetchPower(lat, lon, name) {
    const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${POWER_PARAMS}` +
      `&community=AG&longitude=${lon}&latitude=${lat}&start=2004&end=2023&format=JSON`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`NASA POWER returned ${r.status}`);
    return climateFromPower(await r.json(), name, lat, lon);
  }

  const api = { DAYS, precipMm, fallowWindow, evaluatePeriod, bestFit, priorityScore, recommend, trends, climateFromPower, fetchPower };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FieldShift = api;
})(typeof window !== "undefined" ? window : globalThis);
