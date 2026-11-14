// Decision Lab tests. No dependencies: node tests/decision.test.cjs
"use strict";
const assert = require("assert");
const fs = require("fs"), path = require("path");
const H = require("./harness.cjs");

const W = H.load();
const D = W.FieldDecision;
const results = [];
function test(name, fn) {
  try { fn(); results.push([true, name]); console.log("  ok   " + name); }
  catch (e) { results.push([false, name]); console.log("  FAIL " + name + "\n       " + (e && e.message)); }
}

const SC = H.scenarios(W, H.VARIANTS);
const byId = id => SC.find(s => s.id === id);
const cmpOf = id => H.run(W, byId(id));
// small artificial plan with only the fields decision.js reads
// objects made inside the vm context have other prototypes: compare plain JSON copies
const plain = x => JSON.parse(JSON.stringify(x));
const same = (a, b, msg) => assert.deepStrictEqual(plain(a), plain(b), msg);
const fake = (ids, by, extra = {}) => ({ seq: ids.map(id => ({ id })), total: extra.total || 50, facts: { irrigationByYear: by, rainOnBare: 10, nBalanceRaw: 0, riskPerYear: 0, ...extra.facts } });

console.log("Decision Lab tests");

test("1. no constraints: every plan feasible, A/B/C/D identical to baseline.json", () => {
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, "baseline.json"), "utf8"));
  for (const sc of SC) {
    const cmp = H.run(W, sc);
    const r = D.evaluate(cmp.all, {});
    assert.strictEqual(r.feasibleCount, cmp.all.length, sc.id);
    assert.strictEqual(r.rejectedCount, 0);
    assert.strictEqual(r.active, false);
    assert.strictEqual(r.best.plan, cmp.all[0], sc.id + ": best feasible = top of the normal ranking");
    same(H.snapshot(cmp), base[sc.id], sc.id + " differs from baseline");
  }
});

test("2. a year exactly at the limit is accepted (real plan, limit = its max year)", () => {
  const cmp = cmpOf("nebraska");
  const C = cmp.strategies.find(s => s.key === "optimized");
  const max = Math.max(...C.facts.irrigationByYear);
  assert.ok(max > 0);
  assert.strictEqual(D.checkPlan(C, { maxIrrigationPerYear: max }).feasible, true);
  assert.strictEqual(D.checkPlan(C, { maxIrrigationPerYear: max - 0.01 }).feasible, false);
  // artificial: exactly 100 and 100 + 1e-9 (inside tolerance) pass, 100.001 fails
  assert.strictEqual(D.checkPlan(fake(["a", "b", "c"], [100, 20, 30]), { maxIrrigationPerYear: 100 }).feasible, true);
  assert.strictEqual(D.checkPlan(fake(["a", "b", "c"], [100 + 1e-9, 20, 30]), { maxIrrigationPerYear: 100 }).feasible, true);
  assert.strictEqual(D.checkPlan(fake(["a", "b", "c"], [100.001, 20, 30]), { maxIrrigationPerYear: 100 }).feasible, false);
});

test("3. one year above the limit removes the plan even if the 3-year average is below it (real data)", () => {
  let found = null;
  for (const sc of SC) {
    for (const p of H.run(W, sc).all) {
      const by = p.facts.irrigationByYear, avg = by.reduce((a, b) => a + b, 0) / 3, mx = Math.max(...by);
      if (mx - avg > 20) { found = { sc: sc.id, p, limit: Math.floor((avg + mx) / 2) }; break; }
    }
    if (found) break;
  }
  assert.ok(found, "no real plan with uneven years");
  const { p, limit } = found;
  const r = D.checkPlan(p, { maxIrrigationPerYear: limit });
  assert.strictEqual(r.feasible, false);
  assert.ok(r.crit.irrigationAvg <= limit, "average is below the limit");
  const v = r.violations.find(x => x.type === "water");
  assert.ok(v && v.value > limit && v.limit === limit && v.year >= 1 && v.year <= 3);
  console.log(`       real case: ${found.sc} ${D.planKey(p)} years ${p.facts.irrigationByYear.map(Math.round).join("/")} mm, avg ${Math.round(r.crit.irrigationAvg)} ≤ limit ${limit}, removed (year ${v.year})`);
});

test("4. nothing feasible: empty result + relaxation advice, no crash", () => {
  const cmp = cmpOf("yalova");
  const r = D.evaluate(cmp.all, { maxIrrigationPerYear: 0 });
  assert.strictEqual(r.feasibleCount, 0);
  assert.strictEqual(r.best, null);
  assert.strictEqual(r.runnerUp, null);
  assert.ok(r.relax && r.relax.water && r.relax.water.minLimit > 0);
  // the suggested minimum really works
  assert.ok(D.evaluate(cmp.all, { maxIrrigationPerYear: r.relax.water.minLimit }).feasibleCount >= 1);
  assert.ok(r.relax.drop.some(d => d.type === "water" && d.count === cmp.all.length));
  // crop rules that leave nothing: anchor crop forbidden
  const r2 = D.evaluate(cmp.all, { forbiddenCrops: [cmp.anchor.id] });
  assert.strictEqual(r2.feasibleCount, 0);
  assert.strictEqual(r2.relax.cropsBlock, true);
  assert.ok(r2.relax.drop.some(d => d.type === "forbidden" && d.crop === cmp.anchor.id));
  // conflict and empty input
  const r3 = D.evaluate(cmp.all, { forbiddenCrops: ["wheat"], requiredCrops: ["wheat"] });
  same(r3.relax.conflict, ["wheat"]);
  const r4 = D.evaluate([], { maxIrrigationPerYear: 50 });
  assert.strictEqual(r4.evaluated, 0); assert.strictEqual(r4.best, null);
});

test("5. forbidden crop removes the plan; a required crop present only as a cover crop does not count", () => {
  const cmp = cmpOf("nebraska");
  const r = D.evaluate(cmp.all, { forbiddenCrops: ["soybean_main"] });
  assert.ok(r.rejectedCount > 0);
  for (const it of r.items) assert.strictEqual(it.feasible, !it.plan.seq.some(c => c.id === "soybean_main"));
  // a crop grown only as a cover crop (ROTATION_CROPS "chickpea"/"soybean") is not the main crop ("chickpea_main"/"soybean_main")
  let real = null;
  for (const s of SC) {
    for (const p of H.run(W, s).all) {
      const cov = p.plantings.find(x => x.kind === "cover" && W.MAIN_CROPS.some(m => m.id === x.crop.id + "_main") && !p.seq.some(c => c.id === x.crop.id + "_main"));
      if (cov) { real = { s: s.id, p, req: cov.crop.id + "_main" }; break; }
    }
    if (real) break;
  }
  const plan = real ? real.p : Object.assign(fake(["wheat", "wheat", "maize"], [0, 0, 0]), { plantings: [{ kind: "cover", crop: { id: "soybean" } }] });
  const req = real ? real.req : "soybean_main";
  console.log(real ? `       real case: ${real.s} ${D.planKey(plan)} has ${req.replace("_main", "")} only as cover crop` : "       (artificial cover-only plan used: no real case found)");
  const v = D.checkPlan(plan, { requiredCrops: [req] });
  assert.strictEqual(v.feasible, false);
  same(v.violations, [{ type: "required", crop: req }]);
  const ok = D.evaluate(cmp.all, { requiredCrops: ["sorghum"] });
  for (const it of ok.items) assert.strictEqual(it.feasible, it.plan.seq.some(c => c.id === "sorghum"));
});

test("6. inputs are not changed (climate, crops, rotations deep-equal after running)", () => {
  const sc = byId("kansas");
  const cmp = H.run(W, sc);
  const strip = x => JSON.parse(JSON.stringify(x));
  const before = { climate: strip(sc.climate), mains: strip(W.MAIN_CROPS), covers: strip(W.ROTATION_CROPS), all: strip(cmp.all), cons: { maxIrrigationPerYear: 80, forbiddenCrops: ["wheat", "canola"], requiredCrops: ["sorghum"] } };
  const cons = strip(before.cons);
  D.evaluate(cmp.all, cons); D.evaluate(cmp.all, { maxIrrigationPerYear: 0 });
  for (const p of cmp.all) D.checkPlan(p, cons);
  assert.deepStrictEqual(strip(sc.climate), before.climate);
  assert.deepStrictEqual(strip(W.MAIN_CROPS), before.mains);
  assert.deepStrictEqual(strip(W.ROTATION_CROPS), before.covers);
  assert.deepStrictEqual(strip(cmp.all), before.all);
  assert.deepStrictEqual(cons, before.cons);
});

test("7. same inputs twice -> same output", () => {
  const cmp = cmpOf("iowa");
  const cons = { maxIrrigationPerYear: 60, forbiddenCrops: ["tomato"], requiredCrops: [] };
  const a = D.evaluate(cmp.all, cons), b = D.evaluate(cmp.all, cons);
  const view = r => JSON.stringify({ c: r.constraints, n: r.feasibleCount, items: r.items.map(i => [i.key, i.feasible, i.violations]), best: r.best && r.best.key, tr: r.topReasons });
  assert.strictEqual(view(a), view(b));
  const c2 = H.run(W, byId("iowa"));
  assert.strictEqual(view(D.evaluate(c2.all, cons)), view(a));
});

// facts for an artificial plan: irrigation avg (3 equal years), rain on bare soil, raw nitrogen, climate risk
const pf = (id, irr, bare, n, risk) => ({ seq: [{ id }, { id: "x" }, { id: "y" }], total: 50, facts: { irrigationByYear: [irr, irr, irr], rainOnBare: bare, nBalanceRaw: n, riskPerYear: risk } });

test("8. Pareto dominance: better-or-equal everywhere and better somewhere removes the other plan", () => {
  const P = D.pareto([pf("good", 50, 20, 1, 0), pf("bad", 60, 30, 0, 1), pf("mixed", 40, 80, -1, 2)]);
  const g = k => P.points.find(p => p.key.startsWith(k));
  assert.strictEqual(g("good").onFront, true);
  assert.strictEqual(g("bad").onFront, false);
  assert.ok(g("bad").dominatedBy.startsWith("good"));
  assert.strictEqual(g("mixed").onFront, true, "less water but worse elsewhere: a trade-off, not dominated");
  assert.strictEqual(P.frontCount, 2);
  // tolerance: a difference inside 1e-6 is not "better"
  assert.strictEqual(D.dominates([1, 1, 1, 1], [1 + 1e-9, 1, 1, 1]), false);
  assert.strictEqual(D.dominates([1, 1, 1, 1], [1.001, 1, 1, 1]), true);
});

test("9. equal goal vectors do not remove each other", () => {
  const P = D.pareto([pf("a", 50, 20, 1, 0), pf("b", 50, 20, 1, 0), pf("c", 70, 40, 0, 1)]);
  assert.strictEqual(P.points[0].onFront, true);
  assert.strictEqual(P.points[1].onFront, true);
  assert.strictEqual(P.points[2].onFront, false);
  // real data: every pair of plans with identical vectors gets the same Pareto status
  const cmp = cmpOf("yalova");
  const R = D.pareto(cmp.all);
  for (const p of R.points) for (const q of R.points) if (p !== q && JSON.stringify(p.vec) === JSON.stringify(q.vec)) assert.strictEqual(p.onFront, q.onFront);
});

test("10. goal directions: nitrogen is maximised, irrigation / bare-soil rain / climate risk minimised", () => {
  same(D.OBJECTIVES.map(o => o.key + ":" + o.sense), ["irrigationAvg:min", "rainOnBare:min", "nBalance:max", "climateRisk:min"]);
  const one = (a, b) => { const P = D.pareto([a, b]); return P.points.filter(p => p.onFront).map(p => p.key.split(">")[0]); };
  same(one(pf("moreN", 50, 20, 2, 1), pf("lessN", 50, 20, 1, 1)), ["moreN"]);
  same(one(pf("lessW", 40, 20, 1, 1), pf("moreW", 50, 20, 1, 1)), ["lessW"]);
  same(one(pf("lessB", 50, 10, 1, 1), pf("moreB", 50, 20, 1, 1)), ["lessB"]);
  same(one(pf("lessR", 50, 20, 1, 0.5), pf("moreR", 50, 20, 1, 1)), ["lessR"]);
  // a goal that could not be computed: kept out of the comparison, not treated as zero
  const na = pf("na", 0, 0, 3, 0); na.facts.nBalanceRaw = null;
  const P = D.pareto([na, pf("ok", 50, 20, 1, 1)]);
  assert.strictEqual(P.points[0].computable, false);
  assert.strictEqual(P.points[0].onFront, false);
  assert.strictEqual(P.points[1].onFront, true);
  assert.strictEqual(P.notComputable, 1);
});

test("11. i18n: every Decision Lab key exists in both English and Turkish", () => {
  const en = W.I18N.en, tr = W.I18N.tr;
  const keys = new Set([...Object.keys(en), ...Object.keys(tr)].filter(k => /^(dl|r_|v_|rule_)/.test(k)));
  assert.ok(keys.size >= 30, "expected the Decision Lab keys");
  for (const k of keys) {
    assert.ok(typeof en[k] === "string" && en[k].length, "EN missing " + k);
    assert.ok(typeof tr[k] === "string" && tr[k].length, "TR missing " + k);
  }
  // keys the UI builds dynamically
  for (const ty of ["water", "water_unknown", "forbidden", "required"]) { assert.ok(en["r_" + ty] && tr["r_" + ty]); assert.ok(en["v_" + ty] && tr["v_" + ty]); }
  for (const ty of ["water", "forbidden", "required"]) assert.ok(en["rule_" + ty] && tr["rule_" + ty]);
  // whole file: no key only in one language
  const only = [...Object.keys(en).filter(k => !(k in tr)), ...Object.keys(tr).filter(k => !(k in en))];
  same(only, []);
});

const failed = results.filter(r => !r[0]).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
