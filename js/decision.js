// Field Shift – Decision Lab engine (no DOM, no side effects).
// Works on the rotations that js/rotation.js already evaluated (compareRotations(...).all); it never re-computes
// water, soil cover, nitrogen or climate risk itself, and it never changes the A/B/C/D strategies or their scores.
//
// Constraints (all optional):
//   maxIrrigationPerYear : mm per year. Checked for EACH agricultural year (Oct–Sep) of the 3-year cycle separately:
//                          max(W1, W2, W3) ≤ limit (+1e-6 tolerance). A plan exactly at the limit is feasible.
//                          W = the model's irrigation need (crop need − rain in its months − stored soil water),
//                          independent of the none/limited/plenty irrigation setting (which only changes weights).
//                          Each planting counts in the year it is sown (a crop running past September stays in its year).
//   forbiddenCrops       : main-crop ids that must not appear as a main crop in any year.
//   requiredCrops        : main-crop ids that must appear as a main crop in at least one year.
//                          Cover crops do not count (they are different ids in ROTATION_CROPS).
// Language-neutral: returns numbers and codes; the UI turns them into English/Turkish text.
(function (root) {
  const TOL = 1e-6;
  const YEARS = 3;
  const num = x => (typeof x === "number" && isFinite(x) ? x : null);
  const mainIds = plan => plan.seq.map(c => c.id);
  const planKey = plan => mainIds(plan).join(">");

  // Criteria of one plan, read from rotation.js facts. Missing values stay null ("could not be computed").
  function criteria(plan) {
    const f = plan.facts || {};
    const by = Array.isArray(f.irrigationByYear) && f.irrigationByYear.length === YEARS && f.irrigationByYear.every(v => num(v) !== null)
      ? f.irrigationByYear.slice() : null;
    return {
      irrigationByYear: by,
      irrigationAvg: by ? by.reduce((a, b) => a + b, 0) / YEARS : null,
      irrigationMax: by ? Math.max(...by) : null,
      rainOnBare: num(f.rainOnBare),     // mm/yr of rain on bare soil (lower = better)
      nBalance: num(f.nBalanceRaw),      // raw nitrogen balance per year (higher = better)
      climateRisk: num(f.riskPerYear)    // frost + heat events per year (lower = better)
    };
  }

  function normalize(constraints) {
    const c = constraints || {};
    const w = c.maxIrrigationPerYear;
    const limit = w === null || w === undefined || w === "" || !isFinite(+w) ? null : Math.max(0, +w);
    const list = a => [...new Set(Array.isArray(a) ? a : [])].sort();
    return { maxIrrigationPerYear: limit, forbiddenCrops: list(c.forbiddenCrops), requiredCrops: list(c.requiredCrops) };
  }
  const isActive = c => c.maxIrrigationPerYear !== null || c.forbiddenCrops.length > 0 || c.requiredCrops.length > 0;

  // List of violations of one plan (empty = feasible). c must be normalized.
  function violations(plan, c) {
    const v = [], ids = mainIds(plan);
    for (const id of c.forbiddenCrops) if (ids.includes(id)) v.push({ type: "forbidden", crop: id });
    for (const id of c.requiredCrops) if (!ids.includes(id)) v.push({ type: "required", crop: id });
    if (c.maxIrrigationPerYear !== null) {
      const cr = criteria(plan);
      if (!cr.irrigationByYear) v.push({ type: "water_unknown" });
      else cr.irrigationByYear.forEach((w, y) => {
        if (w > c.maxIrrigationPerYear + TOL) v.push({ type: "water", year: y + 1, value: w, limit: c.maxIrrigationPerYear, excess: w - c.maxIrrigationPerYear });
      });
    }
    return v;
  }

  function checkPlan(plan, constraints) {
    const c = normalize(constraints), v = violations(plan, c);
    return { key: planKey(plan), feasible: v.length === 0, violations: v, crit: criteria(plan) };
  }

  const feasibleCount = (plans, c) => plans.filter(p => violations(p, c).length === 0).length;

  // When nothing is feasible: what to relax. No fake recommendation is made.
  function relaxation(plans, c) {
    const cropOnly = { ...c, maxIrrigationPerYear: null };
    const cropOk = plans.filter(p => violations(p, cropOnly).length === 0);
    let water = null;
    if (c.maxIrrigationPerYear !== null) {
      for (const p of cropOk) {
        const m = criteria(p).irrigationMax;
        if (m !== null && (!water || m < water.minLimit - TOL)) water = { minLimit: m, key: planKey(p), plan: p };
      }
    }
    const drop = [];
    for (const id of c.forbiddenCrops) {
      const n = feasibleCount(plans, { ...c, forbiddenCrops: c.forbiddenCrops.filter(x => x !== id) });
      if (n) drop.push({ type: "forbidden", crop: id, count: n });
    }
    for (const id of c.requiredCrops) {
      const n = feasibleCount(plans, { ...c, requiredCrops: c.requiredCrops.filter(x => x !== id) });
      if (n) drop.push({ type: "required", crop: id, count: n });
    }
    if (c.maxIrrigationPerYear !== null) {
      const n = cropOk.length;
      if (n) drop.push({ type: "water", crop: null, count: n });
    }
    return {
      cropsBlock: cropOk.length === 0,                                         // crop rules alone leave no plan
      conflict: c.requiredCrops.filter(id => c.forbiddenCrops.includes(id)),   // both required and forbidden
      unreachable: c.requiredCrops.filter(id => !plans.some(p => mainIds(p).includes(id))), // in no tested plan
      water, drop
    };
  }

  // Filter the evaluated plans. plans: array from compareRotations(...).all (any order; the order is kept for ties).
  function evaluate(plans, constraints) {
    const c = normalize(constraints);
    const items = plans.map((plan, index) => {
      const v = violations(plan, c);
      return { index, key: planKey(plan), plan, total: plan.total, crit: criteria(plan), feasible: v.length === 0, violations: v };
    });
    const ok = items.filter(x => x.feasible).sort((a, b) => b.total - a.total || a.index - b.index);
    const counts = new Map();
    for (const it of items) {
      if (it.feasible) continue;
      const seen = new Set();
      for (const v of it.violations) {
        const k = v.type === "forbidden" || v.type === "required" ? `${v.type}:${v.crop}` : v.type;
        if (!seen.has(k)) { seen.add(k); counts.set(k, (counts.get(k) || 0) + 1); }
      }
    }
    const topReasons = [...counts.entries()]
      .map(([k, count]) => { const [type, crop] = k.split(":"); return { type, crop: crop || null, count }; })
      .sort((a, b) => b.count - a.count || `${a.type}${a.crop}`.localeCompare(`${b.type}${b.crop}`))
      .slice(0, 3);
    return {
      constraints: c, active: isActive(c),
      evaluated: items.length, feasibleCount: ok.length, rejectedCount: items.length - ok.length,
      items, best: ok[0] || null, runnerUp: ok[1] || null, topReasons,
      relax: ok.length ? null : relaxation(plans, c)
    };
  }

  // ---------- Pareto (only among feasible plans; it never changes A/B/C/D or the scores) ----------
  // Goals: 1 irrigation need (avg mm/yr) min · 2 rain on bare soil (mm/yr) min · 3 raw nitrogen balance max ·
  // 4 climate risk = frost + heat events per year min (the engine's climate SCORE is "higher = better";
  // here the raw event count is used, so "lower = better" without flipping).
  const OBJECTIVES = [
    { key: "irrigationAvg", sense: "min" },
    { key: "rainOnBare", sense: "min" },
    { key: "nBalance", sense: "max" },
    { key: "climateRisk", sense: "min" }
  ];
  // Vector in "lower is better" form, or null if a value could not be computed.
  function objectiveVector(crit) {
    const v = OBJECTIVES.map(o => (crit[o.key] === null || crit[o.key] === undefined ? null : o.sense === "max" ? -crit[o.key] : crit[o.key]));
    return v.some(x => x === null) ? null : v;
  }
  // a dominates b: at least as good on every goal (with tolerance) AND strictly better (by more than the tolerance) on one.
  function dominates(a, b, tol = TOL) {
    let better = false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] > b[i] + tol) return false;
      if (a[i] < b[i] - tol) better = true;
    }
    return better;
  }
  // plans: feasible plans (e.g. evaluate(...).items.filter(x => x.feasible).map(x => x.plan)).
  // Equal vectors never remove each other (neither strictly better), so both stay on the front.
  function pareto(plans) {
    const pts = plans.map((plan, index) => {
      const crit = criteria(plan);
      return { index, key: planKey(plan), plan, crit, vec: objectiveVector(crit), onFront: false, dominatedBy: null, computable: true };
    });
    for (const p of pts) {
      if (!p.vec) { p.computable = false; continue; }
      const dom = pts.find(q => q !== p && q.vec && dominates(q.vec, p.vec));
      p.onFront = !dom;
      p.dominatedBy = dom ? dom.key : null;
    }
    return { objectives: OBJECTIVES, points: pts, frontCount: pts.filter(p => p.onFront).length, notComputable: pts.filter(p => !p.computable).length };
  }

  const api = { TOL, criteria, normalize, violations, checkPlan, evaluate, planKey, OBJECTIVES, objectiveVector, dominates, pareto };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FieldDecision = api;
})(typeof window !== "undefined" ? window : globalThis);
