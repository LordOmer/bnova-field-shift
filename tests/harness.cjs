// Node harness: loads the browser scripts (data + engine + rotation [+ decision, i18n]) into one vm context,
// exactly as index.html does, and builds the same default inputs the app uses for every preset.
// Usage:
//   node tests/harness.cjs            -> print a short summary of every preset
//   node tests/harness.cjs --save     -> write tests/baseline.json
//   node tests/harness.cjs --check    -> compare with tests/baseline.json (exit 1 on any difference)
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");

function load(files = ["data/yalova.js", "data/crops.js", "data/presets.js", "js/i18n.js", "js/engine.js", "js/rotation.js", "js/decision.js"]) {
  const ctx = { console, URLSearchParams, location: { search: "" } };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  for (const f of files) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) continue; // decision.js may not exist yet (baseline is taken before it)
    vm.runInContext(fs.readFileSync(p, "utf8"), ctx, { filename: f });
  }
  return ctx;
}

// Same defaults as js/app.js: maize ×3, or the last 3 USDA CDL years; slope from SRTM; nitrogen + erosion; limited water.
function scenarios(W, variants = [{}]) {
  const mainById = id => W.MAIN_CROPS.find(c => c.id === id);
  const yal = W.YALOVA_DATA;
  const places = [{ id: "yalova", climate: yal }, ...W.PRESET_DATA.map(p => ({ id: p.id, climate: p.climate }))];
  const out = [];
  for (const pl of places) {
    const ex = pl.climate.extra || {};
    const known = (ex.cdl || []).filter(x => x.crop && mainById(x.crop));
    const seqIds = known.length >= 3 ? known.slice(-3).map(x => x.crop) : ["maize", "maize", "maize"];
    for (const v of variants) {
      const opts = {
        priorities: v.priorities || { nitrogen: true, erosion: true, water: false, organic: false, forage: false, market: false },
        irrigation: v.irrigation || "limited",
        soil: { texture: "loam", slope: ex.slope ? ex.slope.cls : "gentle", om: "medium", ...(v.soil || {}) }
      };
      out.push({ id: pl.id + (v.tag ? ":" + v.tag : ""), place: pl.id, climate: pl.climate, seq: seqIds.map(mainById), opts });
    }
  }
  return out;
}

const VARIANTS = [{}, { tag: "none", irrigation: "none" }, { tag: "full", irrigation: "full" }, { tag: "water", priorities: { water: true, market: true } }];

function run(W, sc) {
  return W.FieldRotation.compareRotations(sc.climate, sc.seq, W.MAIN_CROPS, W.ROTATION_CROPS, sc.opts);
}

// Only the parts of the result that the app shows / that must not change.
function snapshot(cmp) {
  const f = s => {
    // irrigationByYear / nBalanceRaw / riskPerYear are additive fields for js/decision.js: not part of the baseline
    const { heat, frost, irrigationByYear, nBalanceRaw, riskPerYear, ...rest } = s.facts;
    return { ...rest, heat: heat.length, frost: frost.length };
  };
  return {
    evaluated: cmp.evaluated,
    strategies: cmp.strategies.map(s => ({ key: s.key, seq: s.seq.map(c => c.id).join(">"), total: s.total, scores: s.scores, facts: f(s) })),
    ranking: cmp.ranking.map(r => `${r.seq.map(c => c.id).join(">")}=${r.total}`)
  };
}

function all(W) {
  const res = {};
  for (const sc of scenarios(W, VARIANTS)) res[sc.id] = snapshot(run(W, sc));
  return res;
}

if (require.main === module) {
  const W = load();
  const cur = all(W);
  const file = path.join(__dirname, "baseline.json");
  if (process.argv.includes("--save")) {
    fs.writeFileSync(file, JSON.stringify(cur, null, 1));
    console.log(`saved ${Object.keys(cur).length} scenarios -> tests/baseline.json`);
  } else if (process.argv.includes("--check")) {
    const base = JSON.parse(fs.readFileSync(file, "utf8"));
    const diffs = [];
    for (const k of new Set([...Object.keys(base), ...Object.keys(cur)])) {
      if (JSON.stringify(base[k]) !== JSON.stringify(cur[k])) diffs.push(k);
    }
    if (diffs.length) { console.log("DIFFERENT:", diffs.join(", ")); process.exit(1); }
    console.log(`baseline identical: ${Object.keys(cur).length} scenarios (A/B/C/D, scores, facts, top-10 ranking)`);
  } else {
    for (const [k, v] of Object.entries(cur)) if (!k.includes(":")) console.log(k.padEnd(9), v.strategies.map(s => `${s.key[0].toUpperCase()}=${s.total}`).join(" "), "|", v.strategies.map(s => s.facts.irrigationPerYear).join("/"), "mm");
  }
}

module.exports = { load, scenarios, run, snapshot, all, VARIANTS, ROOT };
