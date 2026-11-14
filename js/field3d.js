// Field Shift – "living field" 3D view, driven by every input on the page.
// Two blocks of land side by side: A = today's rotation, C = best different rotation, on the real terrain around
// the point (NASA SRTM grid). A 36-month slider (with play) shows, month by month:
//  - what covers the field (crop stage / cover crop / bare soil)                  ← rotation, priorities
//  - NASA POWER rain as drops: blue on plants, orange on bare soil                 ← NASA POWER PRECTOTCORR
//  - soil washing downhill on bare soil, faster on steeper slopes                  ← slope (SRTM or user input)
//  - a soil cut-away: subsoil colour by texture, dark topsoil by organic matter,
//    a blue band for root-zone water that rises and falls with NASA soil wetness   ← texture, OM, GWETROOT
//  - sprinklers in water-deficit months if irrigation water is available,
//    yellowing, shorter plants if it is not                                       ← irrigation input, crop water need
//  - frost on the land in frost months, warm light in heat-spike months            ← FROST_DAYS, T2M_MAX
//  - the land around the field coloured by the month's MODIS greenness            ← MODIS NDVI
// three.js r128 (global THREE) is loaded from cdnjs only when the section scrolls into view.
(function (root) {
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const FIELD = 0.62, PLANTS = 13, DROPS = 500, SOILP = 260, SPRAY = 240;
  const DEPTH = 0.36;                                   // soil block depth (display units)
  const SLOPE_PCT = { flat: 1, gentle: 5, steep: 12 };  // representative slope of each class (%)
  const TEXTURE = { sand: [0.86, 0.73, 0.48], loam: [0.56, 0.39, 0.23], clay: [0.52, 0.29, 0.21] };
  const WATER_CAP = { sand: 0.55, loam: 0.8, clay: 1 }; // relative water-holding capacity → water band height
  const TOP = { low: 0.03, medium: 0.055, high: 0.085 };// topsoil (organic matter) thickness
  const OM_DARK = { low: 0.25, medium: 0.45, high: 0.65 };
  const HUMUS = [0.16, 0.10, 0.06];
  const C3 = {
    mainYoung: [0.40, 0.64, 0.27], main: [0.82, 0.70, 0.34], cover: [0.18, 0.45, 0.20],
    ndviLow: [0.58, 0.50, 0.33], ndviHigh: [0.24, 0.50, 0.22], frost: [0.93, 0.95, 0.98], stress: [0.80, 0.74, 0.30]
  };

  let three = null, loading = null;
  function loadThree() {
    if (root.THREE) return Promise.resolve(root.THREE);
    if (loading) return loading;
    loading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = THREE_URL; s.async = true;
      s.onload = () => (root.THREE ? res(root.THREE) : rej(new Error("three.js missing")));
      s.onerror = () => rej(new Error("three.js could not be loaded"));
      document.head.append(s);
    });
    return loading;
  }
  function webglOk() {
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl") || c.getContext("experimental-webgl")); }
    catch (e) { return false; }
  }
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  // ---------- state ----------
  const st = { el: null, ui: null, renderer: null, scene: null, camera: null, hemi: null, sun: null, patches: [], month: 0,
    playing: false, last: 0, acc: 0, data: null, visible: false, ready: false, rotY: -0.55, tilt: 0.78, dist: 5.3, env: null };

  function mount(container, ui) {
    st.el = container; st.ui = ui;
    if (!webglOk()) { ui.status(ui.t("f3dNoWebgl")); return; }
    const io = "IntersectionObserver" in root ? new IntersectionObserver(es => {
      st.visible = es.some(e => e.isIntersecting);
      if (st.visible && !st.ready && !loading) start();
    }, { rootMargin: "200px" }) : null;
    if (io) io.observe(container); else start();
  }

  async function start() {
    st.ui.status(st.ui.t("f3dLoading"));
    try { three = await loadThree(); } catch (e) { st.ui.status(st.ui.t("f3dNoLib")); return; }
    const T = three;
    st.renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    st.renderer.setPixelRatio(Math.min(2, root.devicePixelRatio || 1));
    st.el.append(st.renderer.domElement);
    st.scene = new T.Scene();
    st.camera = new T.PerspectiveCamera(38, 2, 0.05, 50);
    st.hemi = new T.HemisphereLight(0xeaf3ff, 0x5a4a30, 0.8); st.scene.add(st.hemi);
    st.sun = new T.DirectionalLight(0xffffff, 0.75); st.sun.position.set(2, 4, 3); st.scene.add(st.sun);
    st.ready = true;
    attachDrag(st.renderer.domElement);
    root.addEventListener("resize", resize);
    resize();
    st.ui.status("");
    if (st.data) build();
    requestAnimationFrame(loop);
  }

  function update(data) { st.data = data; if (st.ready) build(); }
  function setMonth(m) { st.month = ((m % 36) + 36) % 36; if (st.ready && st.patches.length) paint(); }
  function setPlaying(p) { st.playing = p; st.acc = 0; }

  // ---------- terrain ----------
  function heightGrid(terrain, extraSlopePct) {
    let h;
    if (!terrain || !terrain.z || terrain.z.length !== terrain.n * terrain.n) h = { n: 2, z: [0, 0, 0, 0], relief: 0, exag: 1, flat: true, lo: 0, hi: 0 };
    else {
      const z = terrain.z, lo = Math.min(...z), hi = Math.max(...z), relief = hi - lo, unitsPerM = 2 / terrain.span;
      const exag = relief < 0.5 ? 1 : Math.max(1, Math.min(25, Math.round(0.35 / (relief * unitsPerM))));
      h = { n: terrain.n, z: z.map(v => (v - lo) * unitsPerM * exag), relief, exag, lo, hi, flat: relief < 0.5 };
    }
    // extra slope from the farmer's input (tilt down toward east, true scale: 1 unit = 1000 m)
    h.tilt = (extraSlopePct || 0) / 100;
    return h;
  }
  function sample(h, x, y) { // x east, y north, both in [-1,1]
    const n = h.n, fx = (x + 1) / 2 * (n - 1), fy = (1 - (y + 1) / 2) * (n - 1);
    const i0 = Math.max(0, Math.min(n - 2, Math.floor(fy))), j0 = Math.max(0, Math.min(n - 2, Math.floor(fx)));
    const ty = fy - i0, tx = fx - j0, Z = (i, j) => h.z[i * n + j];
    const base = (Z(i0, j0) * (1 - tx) + Z(i0, j0 + 1) * tx) * (1 - ty) + (Z(i0 + 1, j0) * (1 - tx) + Z(i0 + 1, j0 + 1) * tx) * ty;
    return base + (1 - x) * h.tilt; // west edge higher → water and soil run east
  }

  // ---------- environment (soil, slope, water) derived from inputs ----------
  function environment(d) {
    const soil = d.soil || { texture: "loam", slope: "gentle", om: "medium" };
    const target = SLOPE_PCT[soil.slope] || 5;
    const srtm = typeof d.srtmSlope === "number" ? d.srtmSlope : null;
    const srtmCls = srtm === null ? null : srtm < 2 ? "flat" : srtm < 8 ? "gentle" : "steep";
    const userOverride = srtmCls !== null && srtmCls !== soil.slope;
    const effective = srtm === null ? target : userOverride ? target : srtm;
    const extra = srtm === null ? target : userOverride ? Math.max(0, target - srtm) : 0;
    const sub = TEXTURE[soil.texture] || TEXTURE.loam;
    const top = mix(sub, HUMUS, OM_DARK[soil.om] || 0.45);
    return { soil, effective, extra, userOverride, srtm, sub, top, topH: TOP[soil.om] || 0.055, cap: WATER_CAP[soil.texture] || 0.8 };
  }

  // ---------- meshes ----------
  function clearPatches() {
    for (const p of st.patches) { st.scene.remove(p.group); p.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    st.patches = [];
  }

  function points(n, size, color, opacity) {
    const T = three, g = new T.BufferGeometry();
    g.setAttribute("position", new T.BufferAttribute(new Float32Array(n * 3), 3));
    g.setDrawRange(0, 0);
    return new T.Points(g, new T.PointsMaterial({ color, size, transparent: true, opacity }));
  }

  function makePatch(h, env, strategy, offsetX) {
    const T = three, group = new T.Group(); group.position.x = offsetX;
    // ground surface
    const seg = 48, geo = new T.PlaneGeometry(2, 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), inField = new Uint8Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), zS = pos.getZ(i);
      pos.setY(i, sample(h, x, -zS));
      inField[i] = Math.abs(x) <= FIELD && Math.abs(zS) <= FIELD ? 1 : 0;
    }
    geo.setAttribute("color", new T.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true }));
    group.add(ground);

    // soil cut-away: walls that follow the terrain edge down to a flat bottom, coloured in layers
    const walls = new T.Group();
    const minY = -DEPTH;
    const wallGeo = (pts) => { // pts: array of [x, z, ySurface]
      const g = new T.BufferGeometry(), v = [], c = [];
      const layer = y => (y > -env.topH ? env.top : env.sub);
      for (let i = 0; i < pts.length - 1; i++) {
        const [x1, z1, y1] = pts[i], [x2, z2, y2] = pts[i + 1];
        // three bands per column: topsoil, subsoil
        const bands = [[y1, y2, -env.topH, -env.topH], [-env.topH, -env.topH, minY, minY]];
        for (const [a1, a2, b1, b2] of bands) {
          const ca = layer(a1 - 0.0001), cb = layer(b1 + 0.0001);
          v.push(x1, a1, z1, x2, a2, z2, x1, b1, z1, x2, a2, z2, x2, b2, z2, x1, b1, z1);
          c.push(...ca, ...ca, ...cb, ...ca, ...cb, ...cb);
        }
      }
      g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
      g.setAttribute("color", new T.Float32BufferAttribute(c, 3));
      g.computeVertexNormals();
      return new T.Mesh(g, new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide }));
    };
    const edge = fx => { const a = []; for (let k = 0; k <= 40; k++) { const [x, z] = fx(-1 + k / 20); a.push([x, z, sample(h, x, -z)]); } return a; };
    walls.add(wallGeo(edge(t => [t, 1])));   // south face (towards camera)
    walls.add(wallGeo(edge(t => [1, -t])));  // east face
    walls.add(wallGeo(edge(t => [-1, t])));
    walls.add(wallGeo(edge(t => [-t, -1])));
    group.add(walls);

    // root-zone water band (translucent blue), height set each month
    const water = new T.Mesh(new T.BoxGeometry(2.012, 1, 2.012), new T.MeshBasicMaterial({ color: 0x2f8fff, transparent: true, opacity: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }));
    water.position.y = minY + 0.5; group.add(water);

    // plants
    const cone = new T.ConeGeometry(0.035, 0.16, 6); cone.translate(0, 0.08, 0);
    const plants = new T.InstancedMesh(cone, new T.MeshLambertMaterial({ color: 0xffffff }), PLANTS * PLANTS);
    const base = [];
    for (let i = 0; i < PLANTS; i++) for (let j = 0; j < PLANTS; j++) {
      const x = -FIELD + (j + 0.5) * (2 * FIELD / PLANTS), z = -FIELD + (i + 0.5) * (2 * FIELD / PLANTS);
      base.push([x, sample(h, x, -z), z]);
    }
    group.add(plants);

    // rain, soil wash, sprinklers
    const rain = points(DROPS, 0.03, 0x4a8cc9, 0.85);
    const speed = new Float32Array(DROPS).map(() => 0.6 + Math.random() * 0.6);
    const rp = rain.geometry.attributes.position.array;
    for (let k = 0; k < DROPS; k++) { rp[k * 3] = (Math.random() * 2 - 1) * FIELD; rp[k * 3 + 1] = 0.4 + Math.random() * 1.2; rp[k * 3 + 2] = (Math.random() * 2 - 1) * FIELD; }
    const wash = points(SOILP, 0.036, 0xd08a45, 1);
    const wp = wash.geometry.attributes.position.array;
    for (let k = 0; k < SOILP; k++) { wp[k * 3] = (Math.random() * 2 - 1) * FIELD; wp[k * 3 + 2] = (Math.random() * 2 - 1) * FIELD; wp[k * 3 + 1] = sample(h, wp[k * 3], -wp[k * 3 + 2]) + 0.012; }
    const spray = points(SPRAY, 0.032, 0xbfe4ff, 0.95);
    const sprayAge = new Float32Array(SPRAY).map(() => Math.random());
    const heads = [[-FIELD / 2, -FIELD / 2], [FIELD / 2, -FIELD / 2], [-FIELD / 2, FIELD / 2], [FIELD / 2, FIELD / 2]];
    const sprayDir = new Float32Array(SPRAY * 2).map(() => Math.random() * 2 - 1);
    group.add(rain, wash, spray);

    st.scene.add(group);
    return { group, ground, inField, plants, base, rain, speed, wash, spray, sprayAge, sprayDir, heads, water, strategy, h,
      active: 0, washActive: 0, sprayActive: 0 };
  }

  function build() {
    if (!st.data) return;
    clearPatches();
    st.env = environment(st.data);
    const h = heightGrid(st.data.terrain, st.env.extra);
    st.h = h;
    st.patches = st.data.strategies.map((s, i) => makePatch(h, st.env, s, i === 0 ? -1.2 : 1.2));
    paint();
    st.ui.terrain(h, st.env);
  }

  function stateAt(s, k) {
    const slot = s.slots[k];
    if (slot.kind === "bare") return { kind: "bare", crop: null, stage: 0, len: 0 };
    const p = s.plantings.find(pl => pl.slots.includes(k));
    const idx = p ? p.slots.indexOf(k) : 0, len = p ? p.slots.length : 1;
    return { kind: slot.kind, crop: slot.crop, stage: (idx + 1) / len, len };
  }

  // ---------- monthly painting ----------
  function paint() {
    const T = three, k = st.month, d = st.data, env = st.env, cm = d.climate.monthly;
    const month = d.months[k % 12], mi = month - 1;
    const rain = d.rainOf(month), maxRain = d.maxRain;
    const frostDays = (cm.FROST_DAYS || [])[mi] || 0, tmax = (cm.T2M_MAX || [])[mi], wet = (cm.GWETROOT || [])[mi];
    const ndvi = d.ndvi ? d.ndvi[mi] : null;
    const frostT = clamp(frostDays / 30, 0, 0.3); // light hoar-frost tint, not snow
    // light: warm in heat-spike months, cool and dim in frost months
    const hot = typeof tmax === "number" && tmax >= 32;
    st.sun.color.setHex(hot ? 0xffc985 : frostDays >= 1 ? 0xdfe9ff : 0xffffff);
    st.sun.intensity = hot ? 0.95 : 0.75;
    st.hemi.color.setHex(hot ? 0xfff0dc : 0xeaf3ff);
    // land around the field: MODIS greenness of this month (if available)
    let around = ndvi !== null && ndvi !== undefined ? mix(C3.ndviLow, C3.ndviHigh, clamp((ndvi - 0.12) / 0.55)) : [0.42, 0.52, 0.36];
    around = mix(around, C3.frost, frostT);
    // soil water band: NASA root-zone wetness × texture capacity
    const waterFrac = typeof wet === "number" ? clamp((wet - 0.2) / 0.55) * env.cap : 0.4 * env.cap;
    const subH = DEPTH - env.topH, waterH = Math.max(0.004, subH * 0.6 * waterFrac); // keep the subsoil colour visible
    const slopeFactor = clamp(env.effective / 12, 0.08, 1.2);
    const infos = [];

    st.patches.forEach(p => {
      const s = stateAt(p.strategy, k);
      // water deficit this month (crop need spread evenly over its months – approximate)
      let deficit = 0, stress = 0, irrigate = 0;
      if (s.kind === "main" && s.crop.water) {
        const need = s.crop.water / Math.max(1, s.len);
        deficit = Math.max(0, need - rain);
        if (deficit > 15) {
          if (d.irrigation === "none") stress = 1;
          else if (d.irrigation === "limited") { irrigate = 0.6; stress = deficit > 60 ? 0.45 : 0; }
          else irrigate = 1;
        }
      }
      // surface colour
      let col = env.top; // bare soil shows the topsoil colour (texture + organic matter)
      if (s.kind === "main") col = s.stage >= 0.99 ? C3.main : mix(C3.mainYoung, C3.main, s.stage * 0.7);
      else if (s.kind === "cover") col = C3.cover;
      if (stress) col = mix(col, C3.stress, 0.55 * stress);
      col = mix(col, C3.frost, frostT * (s.kind === "bare" ? 0.35 : 0.6));
      const c = p.ground.geometry.attributes.color;
      for (let i = 0; i < p.inField.length; i++) { const v = p.inField[i] ? col : around; c.setXYZ(i, v[0], v[1], v[2]); }
      c.needsUpdate = true;
      // plants
      const m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(), pc = new T.Color();
      let grow = s.kind === "bare" ? 0 : s.kind === "cover" ? 0.45 + 0.35 * Math.min(1, s.stage * 1.5) : 0.25 + 0.95 * s.stage;
      grow *= 1 - 0.35 * stress;
      let plantCol = s.kind === "cover" ? [0.16, 0.42, 0.18] : mix([0.30, 0.58, 0.22], [0.78, 0.64, 0.25], s.stage >= 0.99 ? 1 : s.stage * 0.5);
      if (stress) plantCol = mix(plantCol, C3.stress, 0.6 * stress);
      plantCol = mix(plantCol, C3.frost, frostT * 0.6);
      const tall = s.crop && (s.crop.family === "grass" || s.crop.family === "mix");
      const sx = grow ? (tall ? 0.85 : 1.35) : 0.0001, sy = grow ? grow * (tall ? 1.25 : 0.75) : 0.0001;
      p.base.forEach((b, i) => { ps.set(b[0], b[1], b[2]); sc.set(sx, sy, sx); m.compose(ps, q, sc); p.plants.setMatrixAt(i, m); pc.setRGB(plantCol[0], plantCol[1], plantCol[2]); p.plants.setColorAt(i, pc); });
      p.plants.instanceMatrix.needsUpdate = true; if (p.plants.instanceColor) p.plants.instanceColor.needsUpdate = true;
      // rain, soil wash, sprinklers
      const exposed = s.kind === "bare" ? 1 : s.kind === "main" && s.stage < 0.34 ? 0.4 : 0;
      p.active = Math.round(DROPS * Math.min(1, rain / maxRain));
      p.rain.material.color.setHex(exposed >= 1 ? 0xe0622a : 0x4a8cc9);
      p.rain.geometry.setDrawRange(0, p.active);
      p.washActive = Math.round(SOILP * exposed * Math.min(1, rain / maxRain) * slopeFactor);
      p.wash.geometry.setDrawRange(0, p.washActive);
      p.washSpeed = 0.05 + 0.25 * slopeFactor;
      p.sprayActive = Math.round(SPRAY * irrigate * Math.min(1, deficit / 80 + 0.3));
      p.spray.geometry.setDrawRange(0, p.sprayActive);
      // water band
      p.water.scale.y = waterH; p.water.position.y = -DEPTH + waterH / 2;
      // cumulative rain on bare soil so far in the 3-year cycle
      let cum = 0; for (let j = 0; j <= k; j++) if (p.strategy.slots[j].kind === "bare") cum += d.rainOf(p.strategy.slots[j].month);
      infos.push({ ...s, rain: Math.round(rain), cumBare: Math.round(cum), deficit: Math.round(deficit), irrigate, stress });
    });
    st.ui.month(k, infos, { frostDays, tmax, wet, ndvi, rain: Math.round(rain), hot });
  }

  // ---------- animation / camera ----------
  function resize() {
    if (!st.renderer) return;
    const w = st.el.clientWidth, hgt = Math.max(240, Math.min(480, Math.round(w * 0.52)));
    st.renderer.setSize(w, hgt, false);
    st.renderer.domElement.style.width = "100%"; st.renderer.domElement.style.height = hgt + "px";
    st.camera.aspect = w / hgt; st.dist = w < 520 ? 6.2 : 5.4;
    st.camera.updateProjectionMatrix();
  }
  function placeCamera() {
    const d = st.dist, y = Math.sin(st.tilt) * d, r = Math.cos(st.tilt) * d;
    st.camera.position.set(Math.sin(st.rotY) * r, y, Math.cos(st.rotY) * r);
    st.camera.lookAt(0, -0.12, 0);
  }
  function loop(ts) {
    requestAnimationFrame(loop);
    if (!st.visible || !st.ready) { st.last = ts; return; }
    const dt = Math.min(0.1, (ts - (st.last || ts)) / 1000); st.last = ts;
    if (st.playing) { st.acc += dt; if (st.acc > 0.9) { st.acc = 0; setMonth(st.month + 1); } }
    for (const p of st.patches) {
      const h = p.h;
      const arr = p.rain.geometry.attributes.position.array;
      for (let k = 0; k < p.active; k++) {
        arr[k * 3 + 1] -= p.speed[k] * dt * 1.4;
        if (arr[k * 3 + 1] < sample(h, arr[k * 3], -arr[k * 3 + 2])) { arr[k * 3 + 1] = sample(h, arr[k * 3], -arr[k * 3 + 2]) + 0.8 + Math.random() * 0.8; arr[k * 3] = (Math.random() * 2 - 1) * FIELD; arr[k * 3 + 2] = (Math.random() * 2 - 1) * FIELD; }
      }
      p.rain.geometry.attributes.position.needsUpdate = true;
      const w = p.wash.geometry.attributes.position.array;
      for (let k = 0; k < p.washActive; k++) {
        w[k * 3] += p.washSpeed * dt * (0.6 + (k % 5) * 0.15);
        if (w[k * 3] > FIELD) { w[k * 3] = -FIELD + Math.random() * 0.2; w[k * 3 + 2] = (Math.random() * 2 - 1) * FIELD; }
        w[k * 3 + 1] = sample(h, w[k * 3], -w[k * 3 + 2]) + 0.012;
      }
      p.wash.geometry.attributes.position.needsUpdate = true;
      const sp = p.spray.geometry.attributes.position.array;
      for (let k = 0; k < p.sprayActive; k++) {
        p.sprayAge[k] += dt * 0.9; if (p.sprayAge[k] > 1) p.sprayAge[k] -= 1;
        const a = p.sprayAge[k], [hx, hz] = p.heads[k % 4], r = 0.32 * a;
        const x = hx + p.sprayDir[k * 2] * r, z = hz + p.sprayDir[k * 2 + 1] * r;
        sp[k * 3] = x; sp[k * 3 + 2] = z; sp[k * 3 + 1] = sample(h, x, -z) + 0.05 + 0.22 * Math.sin(Math.PI * a);
      }
      p.spray.geometry.attributes.position.needsUpdate = true;
    }
    placeCamera();
    st.renderer.render(st.scene, st.camera);
  }
  function attachDrag(cv) {
    let down = null;
    cv.style.touchAction = "pan-y"; cv.style.cursor = "grab";
    cv.addEventListener("pointerdown", e => { down = { x: e.clientX, y: e.clientY, r: st.rotY, t: st.tilt }; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
    cv.addEventListener("pointermove", e => {
      if (!down) return;
      st.rotY = down.r - (e.clientX - down.x) * 0.008;
      st.tilt = Math.max(0.2, Math.min(1.35, down.t + (e.clientY - down.y) * 0.006));
    });
    const up = () => { down = null; cv.style.cursor = "grab"; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  }

  root.Field3D = { mount, update, setMonth, setPlaying, get month() { return st.month; }, get playing() { return st.playing; } };
})(window);
