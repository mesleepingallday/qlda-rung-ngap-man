// Downloads OpenStreetMap context (water, sand, wetland, roads, buildings) around
// Rú Chá once, clips it to the prototype bbox and writes data/context.{geojson,js}.
// Data © OpenStreetMap contributors, ODbL.
//
// Usage: npm install && node scripts/fetch-osm-context.mjs [--center=lng,lat] [--half=600]
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import osmtogeojson from 'osmtogeojson';
import bboxClip from '@turf/bbox-clip';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const CENTER = args.center ? args.center.split(',').map(Number) : [107.5935, 16.5485];
const HALF = Number(args.half || 600); // metres from center to bbox edge

const dLat = HALF / 111320;
const dLng = HALF / (111320 * Math.cos((CENTER[1] * Math.PI) / 180));
const bbox = [CENTER[0] - dLng, CENTER[1] - dLat, CENTER[0] + dLng, CENTER[1] + dLat]; // w,s,e,n
const b = `${bbox[1]},${bbox[0]},${bbox[3]},${bbox[2]}`; // Overpass order: s,w,n,e

const query = `[out:json][timeout:60];
(
  nwr["natural"~"^(water|wetland|sand|beach|bay|scrub|wood)$"](${b});
  nwr["water"](${b});
  nwr["waterway"](${b});
  nwr["landuse"~"^(aquaculture|basin|reservoir|farmland|residential|cemetery)$"](${b});
  way["highway"](${b});
  way["building"](${b});
);
out body; >; out skel qt;`;

function classify(p) {
  if (p.building) return 'building';
  if (p.highway) return 'road';
  if (p.waterway && !['riverbank'].includes(p.waterway)) return 'waterway';
  if (p.natural === 'water' || p.water || p.waterway === 'riverbank' || p.natural === 'bay'
    || ['aquaculture', 'basin', 'reservoir'].includes(p.landuse)) return 'water';
  if (p.natural === 'wetland') return 'wetland';
  if (p.natural === 'sand' || p.natural === 'beach') return 'sand';
  if (p.natural === 'scrub' || p.natural === 'wood') return 'vegetation';
  if (p.landuse === 'farmland') return 'farmland';
  if (p.landuse === 'residential' || p.landuse === 'cemetery') return 'residential';
  return null;
}

const endpoint = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
console.log(`Querying ${endpoint} for bbox ${bbox.map((v) => v.toFixed(5)).join(',')} ...`);
const res = await fetch(endpoint, { method: 'POST', body: new URLSearchParams({ data: query }) });
if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
const osm = await res.json();

const features = [];
for (const f of osmtogeojson(osm).features) {
  const kind = classify(f.properties || {});
  if (!kind || f.geometry.type === 'Point') continue;
  const clipped = bboxClip(f, bbox);
  const coords = clipped.geometry.coordinates;
  if (!coords || coords.length === 0 || (Array.isArray(coords[0]) && coords[0].length === 0)) continue;
  features.push({
    type: 'Feature',
    properties: { kind, name: f.properties.name || null, osm_id: f.properties.id || f.id },
    geometry: clipped.geometry,
  });
}

const collection = {
  type: 'FeatureCollection', bbox, center: CENTER, placeholder: false,
  attribution: '© OpenStreetMap contributors (ODbL)', features,
};
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
writeFileSync(join(dataDir, 'context.geojson'), JSON.stringify(collection));
writeFileSync(join(dataDir, 'context.js'), `window.RUCHA_CONTEXT = ${JSON.stringify(collection)};\n`);
const counts = features.reduce((m, f) => ((m[f.properties.kind] = (m[f.properties.kind] || 0) + 1), m), {});
console.log(`Wrote ${features.length} features`, counts);
