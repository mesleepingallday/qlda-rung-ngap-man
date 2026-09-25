// Generates DEMO vegetation patches for the Rú Chá prototype.
// Output follows the `vegetation_patches` schema (docs/feasibility.md §8.2)
// so it can later be replaced 1:1 by real patches digitized in QGIS.
//
// Usage: node scripts/generate-demo-patches.mjs [--center=lng,lat] [--bearing=deg]
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const CENTER = args.center ? args.center.split(',').map(Number) : [107.5935, 16.5485]; // unverified estimate
const BEARING = Number(args.bearing || 0); // direction water -> land, degrees

// Typical heights (m) are placeholders pending the lecturer's confirmation.
const SPECIES_HEIGHT = { excoecaria: 6, acanthus: 1.5, pandanus: 3.5, derris: 2.5 };

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function offsetMeters([lng, lat], dx, dy) {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  return [+(lng + dx / mPerDegLng).toFixed(7), +(lat + dy / mPerDegLat).toFixed(7)];
}

function pickSpecies(t, rnd) {
  // t in [-1, 1]: -1 = water side, 1 = land side.
  if (rnd() < 0.12) return 'derris';
  const n = t + (rnd() - 0.5) * 0.6;
  if (n < -0.45) return 'acanthus';
  if (n < 0.45) return 'excoecaria';
  return 'pandanus';
}

function blob(center, radius, rnd) {
  const phase = rnd() * Math.PI * 2;
  const lobes = 2 + Math.floor(rnd() * 3);
  const ring = [];
  const steps = 16;
  for (let k = 0; k < steps; k++) {
    const a = (k / steps) * Math.PI * 2;
    const r = radius * (1 + 0.22 * Math.sin(lobes * a + phase) + (rnd() - 0.5) * 0.18);
    ring.push(offsetMeters(center, Math.cos(a) * r, Math.sin(a) * r));
  }
  ring.push(ring[0]);
  return ring;
}

const rnd = mulberry32(20260925);
const features = [];
const spacing = 22;
const rot = (BEARING * Math.PI) / 180;
let fid = 0;
for (let i = -7; i <= 7; i++) {
  for (let j = -4; j <= 4; j++) {
    if (rnd() < 0.18) continue; // channels, clearings
    const ex = i * spacing + (rnd() - 0.5) * spacing * 0.6;
    const ey = j * spacing + (rnd() - 0.5) * spacing * 0.6;
    const x = ex * Math.cos(rot) - ey * Math.sin(rot);
    const y = ex * Math.sin(rot) + ey * Math.cos(rot);
    const t = ey / (4 * spacing);
    const species_id = pickSpecies(t, rnd);
    const height_m = +(SPECIES_HEIGHT[species_id] * (0.75 + rnd() * 0.5)).toFixed(1);
    const radius = 8 + rnd() * 5;
    const confidence = +(0.4 + rnd() * 0.6).toFixed(2);
    fid += 1;
    features.push({
      type: 'Feature',
      properties: {
        fid,
        id: `P${String(fid).padStart(3, '0')}`,
        species_id,
        height_m,
        crown_diameter_m: +(radius * 2).toFixed(1),
        area_m2: Math.round(Math.PI * radius * radius),
        // Ground elevation above mean sea level: lower near the water side.
        ground_m: +(0.7 + t * 0.5 + (rnd() - 0.5) * 0.2).toFixed(2),
        observed_at: null,
        source: 'demo',
        confidence,
        verified_by: null,
        notes: 'Demo data, not surveyed',
      },
      geometry: { type: 'Polygon', coordinates: [blob(offsetMeters(CENTER, x, y), radius, rnd)] },
    });
  }
}

const collection = { type: 'FeatureCollection', center: CENTER, bearing: BEARING, demo: true, features };
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
writeFileSync(join(dataDir, 'patches.demo.geojson'), JSON.stringify(collection));
// A .js wrapper lets the page load data when opened via file:// (fetch() is blocked there).
writeFileSync(join(dataDir, 'patches.demo.js'), `window.RUCHA_PATCHES = ${JSON.stringify(collection)};\n`);
console.log(`Wrote ${features.length} demo patches around ${CENTER.join(',')}`);
