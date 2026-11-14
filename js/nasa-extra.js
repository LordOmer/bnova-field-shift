// Extra NASA data sources, fetched live in the browser (no key needed):
//  - SRTM elevation (NASA/NGA Shuttle Radar Topography Mission) via the Open-Elevation API -> slope
//  - MODIS MOD13Q1 NDVI (NASA Terra, 250 m, 16-day) via the ORNL DAAC MODIS web service -> monthly greenness
(function (root) {
  const withTimeout = (url, ms) => {
    const c = new AbortController();
    const id = setTimeout(() => c.abort(), ms);
    return fetch(url, { signal: c.signal }).finally(() => clearTimeout(id));
  };

  // Slope (%) from the elevation of the point and 4 neighbours ≈ 200 m away.
  async function fetchSlope(lat, lon) {
    const d = 0.002;
    const pts = [[lat, lon], [lat + d, lon], [lat - d, lon], [lat, lon + d], [lat, lon - d]];
    const url = "https://api.open-elevation.com/api/v1/lookup?locations=" + pts.map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join("|");
    const r = await withTimeout(url, 12000);
    if (!r.ok) throw new Error(`elevation ${r.status}`);
    const z = (await r.json()).results.map(x => x.elevation);
    const dy = (d * 111320) * 2, dx = (d * 111320 * Math.cos(lat * Math.PI / 180)) * 2;
    const gy = (z[1] - z[2]) / dy, gx = (z[3] - z[4]) / dx;
    const slope = Math.sqrt(gx * gx + gy * gy) * 100;
    return { elevation: Math.round(z[0]), slope: Math.round(slope * 10) / 10, cls: slope < 2 ? "flat" : slope < 8 ? "gentle" : "steep" };
  }

  // Monthly mean NDVI (Jan..Dec) for one year, averaged over a 2 km x 2 km window (land pixels only).
  async function fetchNdvi(lat, lon, year) {
    const base = `https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset?latitude=${lat}&longitude=${lon}&band=250m_16_days_NDVI&kmAboveBelow=1&kmLeftRight=1`;
    // the service returns at most 10 composites per request -> 3 requests for one year
    const ranges = [[1, 145], [161, 305], [321, 366]];
    const parts = await Promise.all(ranges.map(([a, b]) =>
      withTimeout(`${base}&startDate=A${year}${String(a).padStart(3, "0")}&endDate=A${year}${String(b).padStart(3, "0")}`, 30000)
        .then(r => { if (!r.ok) throw new Error(`MODIS ${r.status}`); return r.json(); })));
    const buckets = Array.from({ length: 12 }, () => []);
    for (const p of parts) {
      const scale = +p.scale || 0.0001;
      for (const s of p.subset || []) {
        const vals = s.data.map(v => v * scale).filter(v => v > 0 && v <= 1); // drop water (≤0) and fill values
        if (vals.length < 5) continue;
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const mo = +s.calendar_date.slice(5, 7);
        buckets[mo - 1].push(mean);
      }
    }
    const monthly = buckets.map(a => (a.length ? Math.round(1000 * a.reduce((x, y) => x + y, 0) / a.length) / 1000 : null));
    if (monthly.filter(v => v !== null).length < 8) throw new Error("not enough MODIS data");
    return { year, monthly };
  }

  // 15 x 15 elevation grid (~2 km x 2 km, row 0 = north) for the 3D view of a custom location.
  async function fetchTerrain(lat, lon, n = 15, span = 2000) {
    const dLat = span / 111320 / (n - 1), dLon = span / (111320 * Math.cos(lat * Math.PI / 180)) / (n - 1);
    const locations = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++)
      locations.push({ latitude: +(lat + ((n - 1) / 2 - i) * dLat).toFixed(5), longitude: +(lon + (j - (n - 1) / 2) * dLon).toFixed(5) });
    const c = new AbortController(), id = setTimeout(() => c.abort(), 20000);
    try {
      const r = await fetch("https://api.open-elevation.com/api/v1/lookup", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ locations }), signal: c.signal
      });
      if (!r.ok) throw new Error(`elevation ${r.status}`);
      const z = (await r.json()).results.map(x => x.elevation);
      if (z.length !== n * n) throw new Error("bad grid");
      return { n, span, z };
    } finally { clearTimeout(id); }
  }

  // Months with low satellite greenness (likely bare or dormant land around the point).
  function lowGreenMonths(ndvi, threshold = 0.3) {
    if (!ndvi) return [];
    return ndvi.monthly.map((v, i) => (v !== null && v < threshold ? i + 1 : null)).filter(Boolean);
  }

  const api = { fetchSlope, fetchNdvi, fetchTerrain, lowGreenMonths };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.NasaExtra = api;
})(typeof window !== "undefined" ? window : globalThis);
