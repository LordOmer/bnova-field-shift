// Field Shift – "living field" 3D view.
// Two copies of the real terrain (NASA SRTM elevation grid) side by side: A = today's rotation, C = best different
// rotation. A 36-month slider (with play) shows what covers the field each month and how much of that month's
// NASA POWER rain falls on bare soil (orange drops) or on plants (blue drops).
// Uses three.js r128 (global THREE), loaded on demand from cdnjs only when the section scrolls into view.
(function (root) {
  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const FIELD = 0.62;       // field = central 62 % of the 2 km patch
  const PLANTS = 13;        // plants per side inside the field
  const DROPS = 500;        // rain particles per patch
  const COLORS = {
    around: [0.42, 0.52, 0.36], bare: [0.55, 0.38, 0.22], main: [0.80, 0.70, 0.36], mainYoung: [0.45, 0.66, 0.30],
    cover: [0.20, 0.47, 0.22], rainCover: 0x4a8cc9, rainBare: 0xe0622a
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

  // ---------- state ----------
  const st = { el: null, ui: null, renderer: null, scene: null, camera: null, patches: [], month: 0, playing: false,
    last: 0, acc: 0, data: null, visible: false, ready: false, rotY: -0.5, tilt: 0.85, dist: 4.6, needsBuild: true };

  // Public: create the UI inside `container`, lazily start three.js when visible.
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
    st.scene.add(new T.HemisphereLight(0xeaf3ff, 0x5a4a30, 0.8));
    const sun = new T.DirectionalLight(0xffffff, 0.75); sun.position.set(2, 4, 3); st.scene.add(sun);
    st.ready = true;
    attachDrag(st.renderer.domElement);
    root.addEventListener("resize", resize);
    resize();
    st.ui.status("");
    if (st.data) build();
    requestAnimationFrame(loop);
  }

  // Public: new data → rebuild meshes (terrain or strategies changed)
  function update(data) {
    st.data = data;
    st.month = Math.min(st.month, 35);
    if (st.ready) build();
  }

  function setMonth(m) { st.month = ((m % 36) + 36) % 36; if (st.ready && st.patches.length) paint(); }
  function setPlaying(p) { st.playing = p; st.acc = 0; }

  // ---------- geometry ----------
  function clearPatches() {
    for (const p of st.patches) { st.scene.remove(p.group); p.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    st.patches = [];
  }

  function heightGrid(terrain) {
    if (!terrain || !terrain.z || terrain.z.length !== terrain.n * terrain.n) return { n: 2, z: [0, 0, 0, 0], relief: 0, exag: 1, flat: true };
    const z = terrain.z, lo = Math.min(...z), hi = Math.max(...z), relief = hi - lo;
    // horizontal: 2 units = terrain.span metres → 1 m = 2/span units. Exaggerate so relief is visible but honest.
    const unitsPerM = 2 / terrain.span;
    const exag = relief < 0.5 ? 1 : Math.max(1, Math.min(25, Math.round(0.35 / (relief * unitsPerM))));
    return { n: terrain.n, z: z.map(v => (v - lo) * unitsPerM * exag), relief, exag, lo, hi, flat: relief < 0.5 };
  }

  function sample(h, x, y) { // x,y in [-1,1] (x east, y north) → bilinear height
    const n = h.n, fx = (x + 1) / 2 * (n - 1), fy = (1 - (y + 1) / 2) * (n - 1);
    const i0 = Math.max(0, Math.min(n - 2, Math.floor(fy))), j0 = Math.max(0, Math.min(n - 2, Math.floor(fx)));
    const ty = fy - i0, tx = fx - j0, Z = (i, j) => h.z[i * n + j];
    return (Z(i0, j0) * (1 - tx) + Z(i0, j0 + 1) * tx) * (1 - ty) + (Z(i0 + 1, j0) * (1 - tx) + Z(i0 + 1, j0 + 1) * tx) * ty;
  }

  function makePatch(h, strategy, offsetX) {
    const T = three, group = new T.Group(); group.position.x = offsetX;
    const seg = 48;
    const geo = new T.PlaneGeometry(2, 2, seg, seg);
    geo.rotateX(-Math.PI / 2); // plane in x/z; y up. After rotation: x east, z south
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), inField = new Uint8Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), zS = pos.getZ(i);
      pos.setY(i, sample(h, x, -zS));
      inField[i] = Math.abs(x) <= FIELD && Math.abs(zS) <= FIELD ? 1 : 0;
      colors.set(COLORS.around, i * 3);
    }
    geo.setAttribute("color", new T.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const ground = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true }));
    group.add(ground);

    // soil "slab" sides so the patch reads as a block of land
    const skirt = new T.Mesh(new T.BoxGeometry(2, 0.12, 2), new T.MeshLambertMaterial({ color: 0x6b4a2b }));
    skirt.position.y = -0.065; group.add(skirt);

    // plants (instanced cones)
    const cone = new T.ConeGeometry(0.035, 0.16, 6); cone.translate(0, 0.08, 0);
    const plants = new T.InstancedMesh(cone, new T.MeshLambertMaterial({ color: 0xffffff }), PLANTS * PLANTS);
    const base = [];
    for (let i = 0; i < PLANTS; i++) for (let j = 0; j < PLANTS; j++) {
      const x = -FIELD + (j + 0.5) * (2 * FIELD / PLANTS), z = -FIELD + (i + 0.5) * (2 * FIELD / PLANTS);
      base.push([x, sample(h, x, -z), z]);
    }
    group.add(plants);

    // rain
    const rp = new Float32Array(DROPS * 3), speed = new Float32Array(DROPS);
    for (let k = 0; k < DROPS; k++) { rp[k * 3] = (Math.random() * 2 - 1) * FIELD; rp[k * 3 + 1] = 0.4 + Math.random() * 1.2; rp[k * 3 + 2] = (Math.random() * 2 - 1) * FIELD; speed[k] = 0.6 + Math.random() * 0.6; }
    const rg = new T.BufferGeometry(); rg.setAttribute("position", new T.BufferAttribute(rp, 3));
    const rain = new T.Points(rg, new T.PointsMaterial({ color: COLORS.rainCover, size: 0.03, transparent: true, opacity: 0.85 }));
    group.add(rain);

    st.scene.add(group);
    return { group, ground, inField, plants, base, rain, speed, strategy, h, active: 0 };
  }

  function build() {
    if (!st.data) return;
    clearPatches();
    const h = heightGrid(st.data.terrain);
    st.h = h;
    st.patches = st.data.strategies.map((s, i) => makePatch(h, s, i === 0 ? -1.2 : 1.2));
    paint();
    st.ui.terrain(h);
  }

  // stage of the crop in month k: 0..1 (1 = harvest month)
  function stateAt(s, k) {
    const slot = s.slots[k];
    if (slot.kind === "bare") return { kind: "bare", crop: null, stage: 0 };
    const p = s.plantings.find(pl => pl.slots.includes(k));
    const idx = p ? p.slots.indexOf(k) : 0, len = p ? p.slots.length : 1;
    return { kind: slot.kind, crop: slot.crop, stage: (idx + 1) / len };
  }

  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

  function paint() {
    const T = three, k = st.month, d = st.data;
    const month = d.months[k % 12];
    const rain = d.rainOf(month), maxRain = d.maxRain;
    const infos = [];
    st.patches.forEach(p => {
      const s = stateAt(p.strategy, k);
      // field colour
      let col = COLORS.bare;
      if (s.kind === "main") col = s.stage >= 0.99 ? COLORS.main : mix(COLORS.mainYoung, COLORS.main, s.stage * 0.7);
      else if (s.kind === "cover") col = COLORS.cover;
      const c = p.ground.geometry.attributes.color;
      for (let i = 0; i < p.inField.length; i++) if (p.inField[i]) c.setXYZ(i, col[0], col[1], col[2]);
      c.needsUpdate = true;
      // plants
      const m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3(), pc = new T.Color();
      const grow = s.kind === "bare" ? 0 : s.kind === "cover" ? 0.45 + 0.35 * Math.min(1, s.stage * 1.5) : 0.25 + 0.95 * s.stage;
      const plantCol = s.kind === "cover" ? [0.16, 0.42, 0.18] : mix([0.30, 0.58, 0.22], [0.78, 0.64, 0.25], s.stage >= 0.99 ? 1 : s.stage * 0.5);
      // cereals/grasses tall and thin, broadleaf crops short and bushy
      const tall = s.crop && (s.crop.family === "grass" || s.crop.family === "mix");
      const sx = grow ? (tall ? 0.85 : 1.35) : 0.0001, sy = grow ? grow * (tall ? 1.25 : 0.75) : 0.0001;
      p.base.forEach((b, i) => {
        ps.set(b[0], b[1], b[2]); sc.set(sx, sy, sx);
        m.compose(ps, q, sc); p.plants.setMatrixAt(i, m); pc.setRGB(plantCol[0], plantCol[1], plantCol[2]); p.plants.setColorAt(i, pc);
      });
      p.plants.instanceMatrix.needsUpdate = true; if (p.plants.instanceColor) p.plants.instanceColor.needsUpdate = true;
      // rain
      p.active = Math.round(DROPS * Math.min(1, rain / maxRain));
      p.rain.material.color.setHex(s.kind === "bare" ? COLORS.rainBare : COLORS.rainCover);
      p.rain.geometry.setDrawRange(0, p.active);
      infos.push({ ...s, rain: Math.round(rain) });
    });
    st.ui.month(k, infos);
  }

  // ---------- animation / camera ----------
  function resize() {
    if (!st.renderer) return;
    const w = st.el.clientWidth, hgt = Math.max(220, Math.min(460, Math.round(w * 0.5)));
    st.renderer.setSize(w, hgt, false);
    st.renderer.domElement.style.width = "100%"; st.renderer.domElement.style.height = hgt + "px";
    st.camera.aspect = w / hgt;
    st.dist = w < 520 ? 6.0 : 5.3;
    st.camera.updateProjectionMatrix();
  }

  function placeCamera() {
    const d = st.dist, y = Math.sin(st.tilt) * d, r = Math.cos(st.tilt) * d;
    st.camera.position.set(Math.sin(st.rotY) * r, y, Math.cos(st.rotY) * r);
    st.camera.lookAt(0, -0.05, 0);
  }

  function loop(ts) {
    requestAnimationFrame(loop);
    if (!st.visible || !st.ready) { st.last = ts; return; }
    const dt = Math.min(0.1, (ts - (st.last || ts)) / 1000); st.last = ts;
    if (st.playing) {
      st.acc += dt;
      if (st.acc > 0.9) { st.acc = 0; setMonth(st.month + 1); }
    }
    for (const p of st.patches) {
      const arr = p.rain.geometry.attributes.position.array;
      for (let k = 0; k < p.active; k++) {
        arr[k * 3 + 1] -= p.speed[k] * dt * 1.4;
        const ground = sample(p.h, arr[k * 3], -arr[k * 3 + 2]);
        if (arr[k * 3 + 1] < ground) { arr[k * 3 + 1] = ground + 0.8 + Math.random() * 0.8; arr[k * 3] = (Math.random() * 2 - 1) * FIELD; arr[k * 3 + 2] = (Math.random() * 2 - 1) * FIELD; }
      }
      p.rain.geometry.attributes.position.needsUpdate = true;
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
      st.tilt = Math.max(0.25, Math.min(1.35, down.t + (e.clientY - down.y) * 0.006));
    });
    const up = () => { down = null; cv.style.cursor = "grab"; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  }

  root.Field3D = { mount, update, setMonth, setPlaying, get month() { return st.month; }, get playing() { return st.playing; } };
})(window);
