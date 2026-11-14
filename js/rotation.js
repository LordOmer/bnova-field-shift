// Field Shift – multi-year rotation comparison & optimizer (no DOM).
// Builds a 3-year timeline (agricultural years Oct→Sep), places main crops, fills bare windows with the
// best-fitting cover crop, then scores each rotation on 8 sub-scores using NASA POWER climate data.
// Language-neutral: returns numbers and codes; the UI turns them into English/Turkish text.
(function (root) {
  const E = root.FieldShift || (typeof require !== "undefined" ? require("./engine.js") : null);
  const YEARS = 3, N = YEARS * 12;
  const AG = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // timeline position (0-11) -> calendar month
  const posOf = m => (m + 2) % 12;                     // calendar month -> position (Oct = 0)
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const r1 = x => Math.round(x * 10) / 10;

  const BASE_WEIGHTS = { soil: 1, nitrogen: 1, organic: 1, water: 1, pest: 1, climate: 1, market: 1, forage: 0.3 };
  const PRIORITY_TO_SCORE = { erosion: "soil", nitrogen: "nitrogen", organic: "organic", water: "water", forage: "forage", market: "market" };

  // Local soil information entered by the farmer.
  //   texture: sand | loam | clay  -> how much plant-available water the root zone can store (mm)
  //   slope:   flat | gentle | steep -> erosion matters more on slopes
  //   om:      low | medium | high  -> low organic matter makes soil-building crops more valuable
  const SOIL_STORE = { sand: 70, loam: 150, clay: 200 };
  const DEFAULT_SOIL = { texture: "loam", slope: "gentle", om: "medium" };

  function weights(priorities = {}, irrigation = "limited", soil = DEFAULT_SOIL) {
    const w = { ...BASE_WEIGHTS };
    for (const [p, on] of Object.entries(priorities)) if (on && PRIORITY_TO_SCORE[p]) w[PRIORITY_TO_SCORE[p]] += 1.5;
    if (irrigation === "none") w.water += 2;
    else if (irrigation === "limited") w.water += 0.75;
    else if (irrigation === "full") w.water *= 0.5;
    if (soil.slope === "gentle") w.soil += 0.75;
    else if (soil.slope === "steep") w.soil += 2.5;
    if (soil.om === "low") w.organic += 1.5;
    else if (soil.om === "high") w.organic = Math.max(0.3, w.organic - 0.5);
    if (soil.texture === "sand") w.water += 0.5;
    return w;
  }

  const rain = (climate, month) => E.precipMm(climate, month - 1);

  // Bare runs on the circular 36-month timeline (the rotation repeats).
  function bareGaps(slots) {
    const start = slots.findIndex(s => s.kind !== "bare");
    if (start < 0) return [];
    const gaps = [];
    let cur = [];
    for (let k = 1; k <= N; k++) {
      const s = slots[(start + k) % N];
      if (s.kind === "bare") cur.push(s.i);
      else if (cur.length) { gaps.push(cur); cur = []; }
    }
    if (cur.length) gaps.push(cur);
    return gaps;
  }

  // Pick the best cover crop for one bare gap (array of slot indices). Returns a planting or null.
  function bestCover(climate, slots, gap, rotationCrops, opts) {
    const gapMonths = gap.slice(0, 12).map(i => slots[i].month);
    const next = slots[(gap[gap.length - 1] + 1) % N].crop;
    let best = null;
    for (const crop of rotationCrops) {
      if (crop.months > gapMonths.length) continue;
      for (let s = 0; s + crop.months <= gapMonths.length; s++) {
        const ev = E.evaluatePeriod(climate, crop, gapMonths.slice(s, s + crop.months));
        if (ev.climateScore < 55) continue;
        if (opts.irrigation === "none" && ev.waterRatio < 0.6) continue;
        let score = 0.6 * ev.climateScore + 0.4 * E.priorityScore(crop, opts.priorities || {}) * 100;
        if (opts.irrigation === "limited" && ev.waterRatio < 0.6) score -= 15;
        const bridge = next && next.family === crop.family; // same family right before the main crop
        if (bridge) score -= 12;
        if (!best || score > best.score) {
          best = { score, crop, ev, slotIdx: gap.slice(s, s + crop.months), bridge, tight: crop.months >= gapMonths.length };
        }
      }
    }
    return best;
  }

  function buildTimeline(climate, seq, rotationCrops, opts) {
    const slots = Array.from({ length: N }, (_, i) => ({ i, year: Math.floor(i / 12), month: AG[i % 12], kind: "bare", crop: null }));
    const plantings = [];
    seq.forEach((c, y) => {
      const p = { kind: "main", crop: c, year: y, slots: [] };
      // Place from the sowing month on; a crop that runs past September spills into the next
      // agricultural year (circular). A month already used by another main crop is skipped.
      if (c.growMonths.length) {
        const start = y * 12 + posOf(c.growMonths[0]);
        for (let k = 0; k < c.growMonths.length; k++) {
          const s = slots[(start + k) % N];
          if (s.kind === "main") continue;
          s.kind = "main"; s.crop = c; p.slots.push(s.i);
        }
      }
      plantings.push(p);
    });
    if (opts.covers) {
      for (const gap of bareGaps(slots)) {
        const b = bestCover(climate, slots, gap, rotationCrops, opts);
        if (!b) continue;
        for (const i of b.slotIdx) { slots[i].kind = "cover"; slots[i].crop = b.crop; }
        plantings.push({ kind: "cover", crop: b.crop, year: slots[b.slotIdx[0]].year, slots: b.slotIdx, bridge: b.bridge, tight: b.tight, waterRatio: b.ev.waterRatio });
      }
    }
    return { slots, plantings };
  }

  // Score one rotation (array of 3 main crops).
  function evaluateRotation(climate, seq, rotationCrops, opts = {}) {
    const { slots, plantings } = buildTimeline(climate, seq, rotationCrops, opts);
    const annualRain = AG.reduce((s, m) => s + rain(climate, m), 0);
    const bareSlots = slots.filter(s => s.kind === "bare");
    const bareMonths = bareSlots.length / YEARS;
    const rainOnBare = bareSlots.reduce((s, x) => s + rain(climate, x.month), 0) / YEARS;

    // Water: rain in the crop's months + (main crops only) water stored in the root zone at sowing.
    // Stored water is estimated from NASA POWER root-zone soil wetness (GWETROOT) in the sowing month:
    // ≈ 200 mm × (wetness − 0.3), max 150 mm. A cover crop just before sowing uses half of it;
    // a main crop just before leaves only 30 %. Simplified water balance – see "Data, limits & honesty".
    const gw = climate.monthly.GWETROOT || [];
    let need = 0, irrigation = 0, stored = 0;
    for (const p of plantings) {
      p.rain = Math.round(p.slots.reduce((s, i) => s + rain(climate, slots[i].month), 0));
      p.need = p.crop.water;
      p.stored = 0;
      if (p.kind === "main" && gw.length === 12 && p.slots.length) {
        const sow = slots[p.slots[0]], prev = slots[(p.slots[0] + N - 1) % N];
        const cap = SOIL_STORE[(opts.soil || DEFAULT_SOIL).texture] || 150;
        let st = cap * clamp((gw[sow.month - 1] - 0.3) / 0.6);
        if (prev.kind === "cover") st *= 0.5; else if (prev.kind === "main") st *= 0.3;
        p.stored = Math.round(st);
      }
      p.irrigation = Math.max(0, p.need - p.rain - p.stored);
      need += p.need; irrigation += p.irrigation; stored += p.stored;
    }
    const mains = plantings.filter(p => p.kind === "main");
    const covers = plantings.filter(p => p.kind === "cover");

    const nBalance = (covers.reduce((s, p) => s + p.crop.nfix, 0) - mains.reduce((s, p) => s + p.crop.nDemand, 0)) / YEARS;
    const organic = (mains.reduce((s, p) => s + p.crop.organic, 0) + covers.reduce((s, p) => s + p.crop.organic, 0)) / YEARS;
    const forage = covers.reduce((s, p) => s + p.crop.forage, 0) / YEARS;

    let repeats = 0;
    for (let y = 0; y < YEARS; y++) if (seq[y].family === seq[(y + YEARS - 1) % YEARS].family) repeats++;
    const bridges = covers.filter(p => p.bridge).length;
    const families = new Set(plantings.map(p => p.crop.family)).size;

    const heat = [], frost = [];
    for (const p of mains) {
      for (const m of p.crop.growMonths) {
        // heat hurts most at flowering: check only the crop's flowering month (all months if unknown)
        if ((p.crop.flower === undefined || m === p.crop.flower) && climate.monthly.T2M_MAX[m - 1] > p.crop.heatMax) heat.push({ crop: p.crop, month: m, tmax: climate.monthly.T2M_MAX[m - 1] });
        // frost in the harvest (last) month does not hurt a mature crop
        if (p.crop.frost === "sensitive" && m !== p.crop.growMonths[p.crop.growMonths.length - 1] && climate.monthly.FROST_DAYS[m - 1] >= 1) frost.push({ crop: p.crop, month: m, days: climate.monthly.FROST_DAYS[m - 1] });
      }
    }
    const riskPerYear = (heat.length + frost.length) / YEARS;
    const sideIncome = covers.filter(p => p.crop.market >= 2 || p.crop.forage >= 3).length / YEARS;
    const marketAvg = mains.reduce((s, p) => s + p.crop.market, 0) / mains.length;
    const fallowYears = mains.filter(p => !p.slots.length).length;

    const scores = {
      soil: clamp(1 - rainOnBare / annualRain),
      nitrogen: clamp((nBalance + 3) / 4),
      organic: clamp(organic / 5),
      // 0 when the yearly irrigation need reaches what the farmer can supply (none/limited/full)
      water: clamp(1 - irrigation / YEARS / ({ none: 150, limited: 350, full: 600 }[opts.irrigation] || 350)),
      pest: clamp(1 - repeats / YEARS - 0.1 * bridges),
      climate: clamp(1 - riskPerYear / 2),
      market: clamp(marketAvg / 3 * 0.85 + 0.15 * clamp(sideIncome)),
      forage: clamp(forage / 3)
    };
    const w = weights(opts.priorities, opts.irrigation, opts.soil);
    let tot = 0, wsum = 0;
    for (const k of Object.keys(w)) { tot += w[k] * scores[k]; wsum += w[k]; }

    return {
      seq, slots, plantings,
      total: Math.round(100 * tot / wsum),
      scores,
      facts: {
        bareMonths: r1(bareMonths), rainOnBare: Math.round(rainOnBare), annualRain: Math.round(annualRain),
        needPerYear: Math.round(need / YEARS), irrigationPerYear: Math.round(irrigation / YEARS), storedPerYear: Math.round(stored / YEARS),
        nBalance: r1(nBalance), organic: r1(organic), forage: r1(forage),
        repeats, bridges, families, heat, frost, coverCount: covers.length,
        tightCovers: covers.filter(p => p.tight).length, fallowYears
      }
    };
  }

  const canonical = seq => {
    const ids = seq.map(c => c.id);
    let best = null;
    for (let r = 0; r < ids.length; r++) {
      const k = ids.slice(r).concat(ids.slice(0, r)).join(">");
      if (best === null || k < best) best = k;
    }
    return best;
  };

  // Compare the farmer's current rotation with improved alternatives.
  // current: array of 3 main crops; mains: candidate main crops; opts: { priorities, irrigation }
  function compareRotations(climate, current, mains, rotationCrops, opts = {}) {
    const o = { priorities: opts.priorities || {}, irrigation: opts.irrigation || "limited", soil: { ...DEFAULT_SOIL, ...(opts.soil || {}) } };
    const s1 = { key: "current", ...evaluateRotation(climate, current, rotationCrops, { ...o, covers: false }) };
    const s2 = { key: "current_cover", ...evaluateRotation(climate, current, rotationCrops, { ...o, covers: true }) };

    const anchor = current.find(c => !c.noOptimize) || current[0]; // keep the farmer's main (non-fallow) crop
    const seen = new Set(), all = [];
    // no fallow years; for crops of the same group (silage maize / grain corn) keep only the farmer's version
    const used = new Set(current.map(c => c.id));
    const groupPick = {};
    for (const c of mains) if (c.group && (used.has(c.id) || !groupPick[c.group])) groupPick[c.group] = groupPick[c.group] && used.has(groupPick[c.group].id) ? groupPick[c.group] : c;
    const cand = mains.filter(c => (!c.noOptimize || c === anchor) && (!c.group || groupPick[c.group] === c || used.has(c.id)));
    for (const a of cand) for (const b of cand) for (const c of cand) {
      const seq = [a, b, c];
      if (!seq.includes(anchor)) continue;
      // rotate so the farmer's main crop is year 1 (easier to read)
      while (seq[0] !== anchor) seq.push(seq.shift());
      const k = canonical(seq);
      if (seen.has(k)) continue;
      seen.add(k);
      all.push(evaluateRotation(climate, seq, rotationCrops, { ...o, covers: true }));
    }
    all.sort((x, y) => y.total - x.total);
    const curKey = canonical(current);
    const best = all.find(r => canonical(r.seq) !== curKey);
    const setKey = r => [...new Set(r.seq.map(c => c.id))].sort().join(",");
    const alt = best && all.find(r => canonical(r.seq) !== curKey && r !== best && setKey(r) !== setKey(best));

    const strategies = [s1, s2];
    if (best) strategies.push({ key: "optimized", ...best });
    if (alt) strategies.push({ key: "alternative", ...alt });
    return { anchor, strategies, evaluated: all.length, ranking: all.slice(0, 10), weights: weights(o.priorities, o.irrigation, o.soil) };
  }

  const api = { YEARS, AG, posOf, weights, SOIL_STORE, DEFAULT_SOIL, bareGaps, buildTimeline, evaluateRotation, compareRotations, canonical };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FieldRotation = api;
})(typeof window !== "undefined" ? window : globalThis);
