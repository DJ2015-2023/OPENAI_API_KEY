// Precompute a dot grid of land points for the globe (scene 5).
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const pts = [];
const step = 2.2;
for (let lat = -58; lat <= 78; lat += step) {
  const ring = Math.max(1, Math.round(360 * Math.cos((lat * Math.PI) / 180) / step));
  for (let i = 0; i < ring; i++) {
    const lon = -180 + (360 * i) / ring;
    if (geoContains(land, [lon, lat])) pts.push([+lon.toFixed(2), +lat.toFixed(2)]);
  }
}
writeFileSync(new URL('../src/land.json', import.meta.url), JSON.stringify(pts));
console.log('land points', pts.length);
