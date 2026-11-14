// UI for Field Shift. Depends on: YALOVA_DATA, MAIN_CROPS, ROTATION_CROPS, i18n, FieldShift (engine.js), FieldRotation (rotation.js)
(function () {
  const E = window.FieldShift, R = window.FieldRotation, t = window.i18n.t;
  // Presets: Yalova (data/yalova.js) + Turkey/USA points with embedded data (data/presets.js) + custom
  const EMB = window.PRESET_DATA || [];
  const PRESETS = [
    { id: "yalova", name: "Yalova", country: "TR", lat: 40.64, lon: 29.33 },
    ...EMB.map(p => ({ id: p.id, name: p.name, country: p.country, lat: p.lat, lon: p.lon })),
    { name: null, country: null, lat: null, lon: null }
  ];
  const SCORE_KEYS = ["soil", "nitrogen", "organic", "water", "pest", "climate", "market", "forage"];
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const cache = {};
  let climate = window.YALOVA_DATA;
  cache["40.64,29.33"] = climate;
  climate.country = "TR"; climate.name = "Yalova";
  for (const p of EMB) { p.climate.country = p.country; cache[`${p.lat},${p.lon}`] = p.climate; }
  let lastStatus = null;

  const MON = () => t("months");
  const countryName = cc => (cc === "TR" ? t("turkey") : cc === "US" ? t("usa") : "");
  const place = c => c.name + (c.country ? ", " + countryName(c.country) : "");
  const cname = c => (window.i18n.lang === "tr" ? c.tr : c.en);
  const mon = m => MON()[m - 1];
  const monthsList = ms => ms.map(mon).join(", ");
  // Months in the bottom third of this point's MODIS NDVI range = likely bare/dormant land
  function lowGreen() {
    const n = climate.extra && climate.extra.ndvi;
    if (!n) return [];
    const v = n.monthly.filter(x => x !== null), lo = Math.min(...v), hi = Math.max(...v);
    return n.monthly.map((x, i) => (x !== null && x < lo + (hi - lo) / 3 ? i + 1 : null)).filter(Boolean);
  }
  const monthsLabel = ms => (ms.length ? `${mon(ms[0])}–${mon(ms[ms.length - 1])}` : "—");
  const mainById = id => window.MAIN_CROPS.find(c => c.id === id);

  // ---------- static text ----------
  function applyStaticText() {
    document.documentElement.lang = window.i18n.lang;
    document.title = t("title");
    document.querySelectorAll("[data-i18n]").forEach(e => (e.textContent = t(e.dataset.i18n)));
    document.querySelectorAll("[data-i18n-html]").forEach(e => (e.innerHTML = t(e.dataset.i18nHtml)));
    document.querySelectorAll(".yr").forEach(e => (e.textContent = t("year", { n: e.dataset.year })));
    document.querySelectorAll(".lang button").forEach(b => b.classList.toggle("on", b.dataset.lang === window.i18n.lang));
    const sel = $("preset"), cur = sel.value;
    const groups = [["TR", t("turkey")], ["US", t("usa")], [null, t("other")]].map(([cc, label]) => {
      const g = document.createElement("optgroup"); g.label = label;
      PRESETS.forEach((p, i) => { if (p.country === cc) g.append(new Option(p.name || t("custom"), i)); });
      return g;
    });
    sel.replaceChildren(...groups.filter(g => g.children.length));
    sel.value = cur || 0;
    for (const id of ["y1", "y2", "y3"]) {
      const s = $(id), v = s.value;
      s.replaceChildren(...window.MAIN_CROPS.map(c => new Option(cname(c), c.id)));
      if (v) s.value = v;
    }
    $("glossary").innerHTML = t("gloss").map(([w, d]) => `<details><summary>${esc(w)}</summary><p>${esc(d)}</p></details>`).join("");
    $("limits").innerHTML = t("limits").map(x => `<li>${x}</li>`).join("");
    $("tlLegend").innerHTML = `<span><i class="sw main"></i>${t("tl_main")}</span><span><i class="sw cover"></i>${t("tl_cover")}</span><span><i class="sw bare"></i>${t("tl_bare")}</span>`;
    if (lastStatus) setStatus(lastStatus.key, lastStatus.vars, lastStatus.err);
  }

  // ---------- controls ----------
  $("lat").value = climate.lat; $("lon").value = climate.lon;
  applyStaticText();
  ["y1", "y2", "y3"].forEach(id => ($(id).value = "maize"));
  $("texture").value = "loam"; $("slope").value = "gentle"; $("om").value = "medium";
  $("irrigation").value = "limited";

  document.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => {
    window.i18n.setLang(b.dataset.lang); applyStaticText(); applySlope(); render();
  }));
  $("preset").addEventListener("change", () => {
    const p = PRESETS[$("preset").value];
    if (p.lat !== null) { $("lat").value = p.lat; $("lon").value = p.lon; loadClimate(); }
  });
  $("load").addEventListener("click", loadClimate);
  ["y1", "y2", "y3", "irrigation", "texture", "slope", "om"].forEach(id => $(id).addEventListener("change", render));
  $("priorities").addEventListener("change", render);

  function setStatus(key, vars, err) {
    lastStatus = { key, vars, err };
    $("status").textContent = t(key, vars);
    $("status").className = "status" + (err ? " err" : "");
  }

  async function loadClimate() {
    const lat = +(+$("lat").value).toFixed(2), lon = +(+$("lon").value).toFixed(2);
    if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) { setStatus("st_badcoord", null, true); return; }
    const key = `${lat},${lon}`;
    const preset = PRESETS.find(p => p.lat === lat && p.lon === lon);
    const name = preset ? preset.name : `${lat}, ${lon}`;
    if (cache[key]) { climate = cache[key]; applyCdl(); applySlope(); render(); setStatus("st_showing", { name: place(climate), src: climate.source }); loadExtra(climate); return; }
    $("load").disabled = true; setStatus("st_loading"); $("slopeNote").textContent = "";
    try {
      climate = await E.fetchPower(lat, lon, name);
      climate.country = preset ? preset.country : null;
      cache[key] = climate; applyCdl(); render();
      setStatus("st_loaded", { name });
      loadExtra(climate);
    } catch (e) {
      setStatus("st_error", { err: e.message }, true);
    } finally { $("load").disabled = false; }
  }

  // SRTM slope + MODIS NDVI for the current point (live; Yalova is embedded)
  async function loadExtra(c) {
    c.extra = c.extra || {};
    if (c.extra.slope && c.extra.ndvi) { if (c === climate) { applySlope(); render(); } return; }
    const year = new Date().getFullYear() - 1;
    const [sl, nd] = await Promise.allSettled([
      c.extra.slope ? Promise.resolve(c.extra.slope) : window.NasaExtra.fetchSlope(c.lat, c.lon),
      c.extra.ndvi ? Promise.resolve(c.extra.ndvi) : window.NasaExtra.fetchNdvi(c.lat, c.lon, year)
    ]);
    if (sl.status === "fulfilled") c.extra.slope = sl.value; else c.extra.slopeErr = true;
    if (nd.status === "fulfilled") c.extra.ndvi = nd.value; else c.extra.ndviErr = true;
    if (c === climate) { applySlope(); render(); }
  }
  // USDA Cropland Data Layer (US presets): crop grown at this point each year -> current rotation = last 3 known years
  function cdlCrops() {
    const h = (climate.extra && climate.extra.cdl) || [];
    return h.filter(x => x.crop && mainById(x.crop));
  }
  function applyCdl() {
    const h = (climate.extra && climate.extra.cdl) || [];
    const known = cdlCrops();
    if (known.length >= 3) {
      const last = known.slice(-3);
      ["y1", "y2", "y3"].forEach((id, i) => ($(id).value = last[i].crop));
    }
    $("cdlNote").textContent = h.length ? t("cdlNote", { hist: h.map(x => `${x.year} ${x.category}`).join(" · ") }) : "";
  }
  function applySlope() {
    const sl = climate.extra && climate.extra.slope;
    if (sl) { $("slope").value = sl.cls; $("slopeNote").textContent = t("srtmNote", { e: sl.elevation, s: sl.slope }); }
    else $("slopeNote").textContent = climate.extra && climate.extra.slopeErr ? t("srtmErr") : t("srtmLoading");
  }

  function priorities() {
    const p = {};
    $("priorities").querySelectorAll("input").forEach(i => (p[i.value] = i.checked));
    return p;
  }

  // ---------- render ----------
  function render() {
    const seq = ["y1", "y2", "y3"].map(id => mainById($(id).value));
    const main = seq[0];
    const prios = priorities(), irrigation = $("irrigation").value;
    const soil = { texture: $("texture").value, slope: $("slope").value, om: $("om").value };
    $("placeName").textContent = `– ${place(climate)} (${climate.lat}, ${climate.lon})`;
    const rec = E.recommend(climate, main, window.ROTATION_CROPS, prios);
    drawCalendar(main, rec.window);
    const cmp = R.compareRotations(climate, seq, window.MAIN_CROPS, window.ROTATION_CROPS, { priorities: prios, irrigation, soil });
    drawComparison(cmp, main, prios, irrigation, soil);
    drawRecs(main, rec);
    drawTrends();
  }

  const svgNS = "http://www.w3.org/2000/svg";
  function el(tag, attrs, text) {
    const e = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function drawCalendar(main, window_) {
    const W = 940, H = 270, L = 44, R_ = 64, T = 20, B = 50;
    const cw = (W - L - R_) / 12;
    const rain = MON().map((_, i) => E.precipMm(climate, i));
    const temp = climate.monthly.T2M;
    const soil = climate.monthly.GWETROOT || [];
    const maxRain = Math.max(120, ...rain);
    const tMin = Math.min(-5, ...temp), tMax = Math.max(30, ...temp);
    const yR = v => T + (H - T - B) * (1 - v / maxRain);
    const yT = v => T + (H - T - B) * (1 - (v - tMin) / (tMax - tMin));
    const yS = v => T + (H - T - B) * (1 - v);
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": t("calTitle") });

    for (let i = 0; i < 12; i++) {
      const x = L + i * cw, m = i + 1;
      if (main.growMonths.includes(m)) svg.append(el("rect", { x, y: T, width: cw, height: H - T - B, fill: "var(--main)" }));
      if (window_.includes(m)) svg.append(el("rect", { x: x + 1, y: T + 1, width: cw - 2, height: H - T - B - 2, fill: "none", stroke: "var(--green)", "stroke-width": 2, rx: 4 }));
      svg.append(el("rect", { x: x + cw * 0.25, y: yR(rain[i]), width: cw * 0.5, height: H - B - yR(rain[i]), fill: "var(--rain)", opacity: 0.8 }));
      svg.append(el("text", { x: x + cw / 2, y: yR(rain[i]) - 4, "text-anchor": "middle", "font-size": 11, fill: "var(--rain)" }, Math.round(rain[i])));
      svg.append(el("text", { x: x + cw / 2, y: H - B + 16, "text-anchor": "middle", "font-size": 12, fill: "var(--ink)" }, MON()[i]));
      const fd = climate.monthly.FROST_DAYS[i], tx = climate.monthly.T2M_MAX[i];
      if (fd >= 0.5) svg.append(el("text", { x: x + cw / 2, y: H - B + 34, "text-anchor": "middle", "font-size": 11, fill: "var(--frost)" }, `❄ ${Math.round(fd)}d`));
      else if (tx >= 32) svg.append(el("text", { x: x + cw / 2, y: H - B + 34, "text-anchor": "middle", "font-size": 11, fill: "var(--temp)" }, `🔥 ${Math.round(tx)}°`));
    }
    const line = (vals, y, color, dash) => svg.append(el("polyline", { points: vals.map((v, i) => `${L + i * cw + cw / 2},${y(v)}`).join(" "), fill: "none", stroke: color, "stroke-width": dash ? 2.5 : 3, "stroke-dasharray": dash || "none" }));
    if (soil.length === 12) line(soil, yS, "var(--soil)", "6 4");
    const ndvi = climate.extra && climate.extra.ndvi;
    if (ndvi) {
      const pts = ndvi.monthly.map((v, i) => (v === null ? null : `${L + i * cw + cw / 2},${yS(v)}`)).filter(Boolean).join(" ");
      svg.append(el("polyline", { points: pts, fill: "none", stroke: "var(--ndvi)", "stroke-width": 3, "stroke-dasharray": "2 3", "stroke-linecap": "round" }));
      ndvi.monthly.forEach((v, i) => { if (v !== null) svg.append(el("circle", { cx: L + i * cw + cw / 2, cy: yS(v), r: 3, fill: "var(--ndvi)" })); });
    }
    line(temp, yT, "var(--temp)");
    temp.forEach((v, i) => {
      svg.append(el("circle", { cx: L + i * cw + cw / 2, cy: yT(v), r: 3.5, fill: "var(--temp)" }));
      svg.append(el("text", { x: L + i * cw + cw / 2 + 6, y: yT(v) - 6, "font-size": 10, fill: "var(--temp)" }, `${Math.round(v)}°`));
    });
    svg.append(el("text", { x: 4, y: T + 8, "font-size": 10, fill: "var(--rain)" }, t("rainAxis")));
    svg.append(el("text", { x: W - R_ + 6, y: T + 8, "font-size": 10, fill: "var(--temp)" }, "°C"));
    if (soil.length === 12) {
      svg.append(el("text", { x: W - R_ + 6, y: yS(soil[11]) - 4, "font-size": 10, fill: "var(--soil)" }, t("soilAxis")));
      svg.append(el("text", { x: W - R_ + 6, y: yS(soil[11]) + 9, "font-size": 10, fill: "var(--soil)" }, soil[11].toFixed(2)));
    }
    $("calendar").replaceChildren(svg);
    const low = lowGreen();
    $("ndviNote").textContent = ndvi
      ? t("ndviNote", { year: ndvi.year, peak: mon(1 + ndvi.monthly.indexOf(Math.max(...ndvi.monthly.filter(v => v !== null)))), low: low.length ? monthsList(low) : "—" })
      : (climate.extra && climate.extra.ndviErr ? t("ndviErr") : t("ndviLoading"));
  }

  // ---------- rotation comparison ----------
  function seqLabel(s) {
    return s.seq.map((c, y) => {
      const cov = uniq(s.plantings.filter(p => p.kind === "cover" && p.year === y).map(p => cname(p.crop)));
      return cname(c) + (cov.length ? ` <span class="cov">+ ${cov.map(esc).join(", ")}</span>` : "");
    }).join(" → ");
  }

  function drawComparison(cmp, main, prios, irrigation, soil) {
    $("cmpHint").textContent = t("cmpHint", { n: cmp.evaluated, main: cname(cmp.anchor) });
    const S = cmp.strategies;
    const bestTotal = Math.max(...S.map(s => s.total));
    const head = `<tr><th>${t("strategy")}</th>${S.map(s => `<th>${t("s_" + s.key).split("·")[0].trim()}</th>`).join("")}</tr>`;
    const totalRow = `<tr class="tot"><td>${t("total")}</td>${S.map(s => `<td class="${s.total === bestTotal ? "best" : ""}"><b>${s.total}</b><small>/100</small></td>`).join("")}</tr>`;
    const rows = SCORE_KEYS.map(k => `<tr><td>${t("sc_" + k)}</td>${S.map(s => {
      const v = Math.round(s.scores[k] * 100);
      return `<td><div class="bar"><i style="width:${v}%"></i></div><span class="bv">${v}</span></td>`;
    }).join("")}</tr>`).join("");
    $("cmpTable").innerHTML = `<table class="cmp"><thead>${head}</thead><tbody>${totalRow}${rows}</tbody></table>`;

    const base = S[0];
    const box = $("strategies");
    box.replaceChildren(...S.map(s => strategyCard(s, base, cmp, prios, irrigation, soil)));
  }

  function strategyCard(s, base, cmp, prios, irrigation, soil) {
    const f = s.facts, d = document.createElement("article");
    d.className = "strategy" + (s.key === "optimized" ? " top" : "");
    const covers = s.plantings.filter(p => p.kind === "cover");
    const coverNames = [...new Set(covers.map(p => cname(p.crop)))].join(", ");
    const prioNames = Object.entries(prios).filter(([, v]) => v).map(([k]) => t("p_" + k)).join(", ") || t("no_prios");

    // Why
    let why;
    if (s.key === "current") why = t("why_current");
    else if (s.key === "current_cover") why = covers.length ? t("why_cover", { covers: coverNames }) : t("why_cover_none");
    else if (s.key === "optimized" && cmp.strategies[1].total >= s.total) why = t("why_opt_b", { n: cmp.evaluated, prios: prioNames });
    else if (s.key === "optimized") why = t("why_opt", { n: cmp.evaluated, prios: prioNames, irr: t("irr_" + irrigation).toLowerCase() });
    else why = t("why_alt");

    // Evidence
    const ev = [t("ev_bare", { m: f.bareMonths, r: f.rainOnBare, a: f.annualRain })];
    ev.push(t(f.irrigationPerYear > 0 ? "ev_water" : "ev_water_ok", { need: f.needPerYear, irr: f.irrigationPerYear, st: f.storedPerYear }));
    ev.push(t("ev_n", { n: (f.nBalance > 0 ? "+" : "") + f.nBalance }));
    const heatL = uniq(f.heat.map(h => `${cname(h.crop)} ${mon(h.month)} (${Math.round(h.tmax)} °C)`));
    const frostL = uniq(f.frost.map(h => `${cname(h.crop)} ${mon(h.month)} (≈${Math.round(h.days)} d)`));
    if (heatL.length) ev.push(t("ev_heat", { list: heatL.join(", ") }));
    if (frostL.length) ev.push(t("ev_frost", { list: frostL.join(", ") }));
    if (!heatL.length && !frostL.length) ev.push(t("ev_climate_ok"));
    if (s.key === "current" && cdlCrops().length >= 3) ev.push(t("ev_cdl", { hist: cdlCrops().slice(-3).map(x => `${x.year} ${x.category}`).join(", ") }));
    if (s.key === "current" && lowGreen().length) ev.push(t("ev_ndvi", { year: climate.extra.ndvi.year, low: monthsList(lowGreen()) }));

    // Benefits
    const ben = [];
    if (s.key === "current") ben.push(t("ben_current"));
    else {
      for (const k of SCORE_KEYS) {
        const a = Math.round(base.scores[k] * 100), b = Math.round(s.scores[k] * 100);
        if (b - a >= 10) ben.push(t("ben_score", { label: t("sc_" + k), from: a, to: b }));
      }
      if (covers.some(p => p.crop.nfix >= 2)) ben.push(t("ben_nfix"));
      if (covers.some(p => p.crop.forage >= 3)) ben.push(t("ben_forage"));
      if (f.repeats < base.facts.repeats) ben.push(t("ben_pest"));
      if (!ben.length) ben.push(t("ben_none"));
    }

    // Information gaps
    const gaps = [t("gap_grid"), t("gap_soil"), t("gap_crop")];
    const baseIds = new Set(base.seq.map(c => c.id));
    const isNew = s.seq.some(c => !baseIds.has(c.id)) || covers.length > 0;
    if (isNew) gaps.push(t("gap_market"));
    if (covers.length) gaps.push(t("gap_timing"));

    // Risks
    const risks = [];
    if (f.irrigationPerYear > 0) risks.push(t(irrigation === "none" ? "risk_irr_none" : "risk_irr", { irr: f.irrigationPerYear }));
    if (f.tightCovers) risks.push(t("risk_tight", { n: f.tightCovers }));
    if (f.bridges) risks.push(t("risk_bridge"));
    if (f.repeats) risks.push(t("risk_repeat", { n: f.repeats }));
    if (heatL.length) risks.push(t("risk_heat", { list: heatL.join(", ") }));
    if (frostL.length) risks.push(t("risk_frost", { list: uniq(f.frost.map(h => cname(h.crop))).join(", ") }));
    if (isNew) risks.push(t("risk_new"));
    if (soil.slope === "steep" && f.bareMonths >= 2) risks.push(t("risk_steep", { m: f.bareMonths }));
    if (soil.texture === "sand") risks.push(t("risk_sand"));
    if (soil.texture === "clay" && f.tightCovers) risks.push(t("risk_clay"));
    if (!risks.length) risks.push(t("risk_none"));

    const list = arr => `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    d.innerHTML = `
      <div class="sh"><div class="score">${s.total}<small>/100</small></div>
        <div><h3>${t("s_" + s.key)}</h3><p class="seq">${seqLabel(s)}</p></div></div>
      <div class="tl"></div>
      <div class="explain">
        <div><h4>${t("h_why")}</h4><p>${esc(why)}</p></div>
        <div><h4>${t("h_evidence")}</h4>${list(ev)}</div>
        <div><h4>${t("h_benefits")}</h4>${list(ben)}</div>
        <div><h4>${t("h_gaps")}</h4>${list(gaps)}</div>
        <div><h4>${t("h_risks")}</h4>${list(risks)}</div>
      </div>`;
    d.querySelector(".tl").append(timeline(s));
    return d;
  }

  const uniq = a => [...new Set(a)];

  // 36-month strip: Oct of year 1 → Sep of year 3
  function timeline(s) {
    const W = 940, H = 74, L = 8, Rr = 8, T = 16, BH = 32;
    const cw = (W - L - Rr) / 36;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": "3-year rotation timeline" });
    const maxRain = Math.max(...MON().map((_, i) => E.precipMm(climate, i)));
    let i = 0;
    while (i < 36) {
      const a = s.slots[i];
      let j = i;
      while (j + 1 < 36 && s.slots[j + 1].kind === a.kind && s.slots[j + 1].crop === a.crop && (a.kind !== "bare")) j++;
      const x = L + i * cw, w = (j - i + 1) * cw;
      if (a.kind === "bare") {
        const r = E.precipMm(climate, a.month - 1) / maxRain;
        svg.append(el("rect", { x: x + 1, y: T, width: w - 2, height: BH, rx: 3, fill: `rgba(74,140,201,${(0.1 + 0.55 * r).toFixed(2)})`, stroke: "var(--rain)", "stroke-dasharray": "3 2" }));
      } else {
        svg.append(el("rect", { x: x + 1, y: T, width: w - 2, height: BH, rx: 5, fill: a.kind === "main" ? "var(--main-d)" : "var(--green)" }));
        const name = cname(a.crop);
        const maxChars = Math.floor(w / 7);
        if (maxChars >= 3) svg.append(el("text", { x: x + w / 2, y: T + BH / 2 + 4, "text-anchor": "middle", "font-size": 11, fill: a.kind === "main" ? "var(--ink)" : "#fff" }, name.length > maxChars ? name.slice(0, maxChars - 1) + "…" : name));
      }
      i = j + 1;
    }
    for (let k = 0; k < 36; k++) {
      svg.append(el("text", { x: L + k * cw + cw / 2, y: T + BH + 14, "text-anchor": "middle", "font-size": 9, fill: "var(--muted)" }, mon(s.slots[k].month).slice(0, 1)));
    }
    for (let y = 0; y < 3; y++) {
      svg.append(el("text", { x: L + y * 12 * cw + 2, y: T - 4, "font-size": 10, fill: "var(--muted)" }, t("year", { n: y + 1 })));
      if (y) svg.append(el("line", { x1: L + y * 12 * cw, x2: L + y * 12 * cw, y1: T - 12, y2: T + BH + 4, stroke: "var(--muted)", "stroke-width": 1 }));
    }
    return svg;
  }

  // ---------- single-season bare-window recommendations ----------
  function drawRecs(main, rec) {
    const w = rec.window;
    const winRain = Math.round(w.reduce((s, m) => s + E.precipMm(climate, m - 1), 0));
    $("windowText").textContent = w.length
      ? t("bareWindow", { crop: cname(main), n: w.length, months: monthsLabel(w), rain: winRain })
      : t("noWindow");
    const box = document.createElement("div"); box.className = "recs";
    const top = rec.results.slice(0, 5);
    if (!top.length) box.textContent = t("noFit");
    for (const r of top) {
      const c = r.crop, f = r.fit, tags = [], why = [];
      tags.push(`<span class="tag">${t("grow", { months: monthsLabel(f.period) })}</span>`);
      if (c.nfix >= 2) tags.push(`<span class="tag">${t("t_nfix")}</span>`);
      if (c.erosion >= 3) tags.push(`<span class="tag">${t("t_erosion")}</span>`);
      if (c.forage >= 3) tags.push(`<span class="tag">${t("t_forage")}</span>`);
      if (c.market >= 3) tags.push(`<span class="tag">${t("t_market")}</span>`);
      if (f.waterRatio < 0.6) tags.push(`<span class="tag warn">${t("t_irrig")}</span>`);
      if (!f.frostOk) tags.push(`<span class="tag warn">${t("t_frost")}</span>`);
      if (f.winterKill) tags.push(`<span class="tag warn">${t("t_wkill")}</span>`);
      why.push(t("w_rain", { rain: f.rain, need: c.water, pct: Math.round(f.waterRatio * 100) }));
      why.push(t("w_temp", { pct: Math.round(f.tempFrac * 100) }));
      if (f.tooCold.length) why.push(t("w_cold", { m: f.tooCold.map(mon).join(", ") }));
      if (f.tooHot.length) why.push(t("w_hot", { m: f.tooHot.map(mon).join(", ") }));
      if (f.frostDays >= 1) why.push(t("w_frost", { d: f.frostDays }) + (c.frost === "tolerant" ? t("w_tol") : "") + ".");
      const card = document.createElement("div"); card.className = "rec";
      card.innerHTML = `<div class="score">${r.total}<small>/100</small></div>
        <div><h3>${esc(cname(c))} <span>· ${esc(window.i18n.lang === "tr" ? c.en : c.tr)}</span></h3><div class="tags">${tags.join("")}</div>
        <p class="why">${esc(why.join(" "))}</p></div>`;
      box.append(card);
    }
    $("recs").replaceChildren(box);
  }

  function drawTrends() {
    const tr = E.trends(climate);
    const sign = v => (v > 0 ? "+" : "") + v;
    $("trendStats").innerHTML = `
      <div class="stat"><b>${sign(tr.tempPerDecade)} °C</b><span>${t("tr_temp")}</span></div>
      <div class="stat"><b>${sign(tr.precipPerDecade)} mm</b><span>${t("tr_rain")}</span></div>
      <div class="stat"><b>${sign(tr.frostDaysPerDecade)}</b><span>${t("tr_frost")}</span></div>
      <div class="stat"><b>${sign(tr.summerSoilPerDecade)}</b><span>${t("tr_soil")}</span></div>`;
    const yrs = tr.years, W = 940, H = 200, L = 44, R_ = 54, T = 16, B = 28;
    const cw = (W - L - R_) / yrs.length;
    const ps = yrs.map(y => climate.years[y].p), ts = yrs.map(y => climate.years[y].t);
    const maxP = Math.max(...ps) * 1.1, tLo = Math.min(...ts) - 0.5, tHi = Math.max(...ts) + 0.5;
    const yP = v => T + (H - T - B) * (1 - v / maxP), yT = v => T + (H - T - B) * (1 - (v - tLo) / (tHi - tLo));
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": t("trendTitle") });
    yrs.forEach((y, i) => {
      const x = L + i * cw;
      svg.append(el("rect", { x: x + cw * 0.2, y: yP(ps[i]), width: cw * 0.6, height: H - B - yP(ps[i]), fill: "var(--rain)", opacity: 0.55 }));
      if (i % 2 === 0) svg.append(el("text", { x: x + cw / 2, y: H - 10, "text-anchor": "middle", "font-size": 10, fill: "var(--ink)" }, y));
    });
    svg.append(el("polyline", { points: ts.map((v, i) => `${L + i * cw + cw / 2},${yT(v)}`).join(" "), fill: "none", stroke: "var(--temp)", "stroke-width": 2.5 }));
    svg.append(el("text", { x: 4, y: T + 8, "font-size": 10, fill: "var(--rain)" }, t("rainYr")));
    svg.append(el("text", { x: W - R_ + 4, y: T + 8, "font-size": 10, fill: "var(--temp)" }, t("meanC")));
    $("trendChart").replaceChildren(svg);
  }

  // Deep link: ?loc=<preset id> (e.g. ?loc=nebraska&lang=tr) opens that preset directly
  let startLoc = null;
  try { startLoc = new URLSearchParams(location.search).get("loc"); } catch (e) { /* ignore */ }
  if (!startLoc) startLoc = "nebraska"; // default: US example with USDA crop history
  const startIdx = startLoc ? PRESETS.findIndex(p => p.id === startLoc) : -1;
  if (startIdx > 0) {
    const p = PRESETS[startIdx];
    $("preset").value = startIdx; $("lat").value = p.lat; $("lon").value = p.lon;
    climate = cache[`${p.lat},${p.lon}`] || climate;
    applyCdl();
  }
  applySlope();
  render();
  if (startIdx > 0) { setStatus("st_showing", { name: place(climate), src: climate.source }); loadExtra(climate); }
  else setStatus("st_embedded", { name: place(climate), period: climate.period });
})();
