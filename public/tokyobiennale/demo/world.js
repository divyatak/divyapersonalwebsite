// The station, as data, plus the lighting model. Shared by the demo (index.html) and the
// offline lightmap baker (bake-lightmap.mjs), so both compute light the same way.
// No three.js here: plain numbers only.
//
// World units are metres, authored in the Blender frame of Study 25's hall: x east, y north,
// z up. three.js space is (x, z, -y); the lighting functions below work in three.js space.

export const HZ = 3.4;            // B1 ceiling height
export const B2 = -4, B2C = -0.8; // B2 floor and ceiling
export const boxes = [];          // every box, for building, lighting and the z-fighting check
export const solids = [];         // AABBs that block walking
export const floors = [];         // walkable tops
function box(x0, y0, z0, x1, y1, z1, kind = 'wall', o = {}) {
  const b = { x0, y0, z0, x1, y1, z1, kind, occludes: o.occludes ?? !['glow', 'day'].includes(kind) };
  boxes.push(b);
  if (o.solid !== false && !['glow', 'day'].includes(kind)) solids.push(b);
  if (o.floor) floors.push({ x0, y0, x1, y1, top: z1, name: o.floor });
  return b;
}
const floor = (x0, y0, x1, y1, top, name) => box(x0, y0, top - 0.3, x1, y1, top, 'floor', { solid: false, floor: name });
const ceil = (x0, y0, x1, y1, z) => box(x0, y0, z, x1, y1, z + 0.3, 'ceil', { solid: false });
const deco = (x0, y0, z0, x1, y1, z1, kind = 'dark') => box(x0, y0, z0, x1, y1, z1, kind, { solid: false });
// Walls meet end to end: east-west walls own the corners, north-south walls stop at them,
// so no two faces share a plane (that is what flickered as z-fighting in the first build).

// B1: the concourse hall (32 x 22 m), with the stair opening cut out of its floor
floor(0, 0, 23, 22, 0, 'B1 concourse'); floor(30, 0, 32, 22, 0, 'B1 concourse');
floor(23, 0, 30, 8, 0, 'B1 concourse'); floor(23, 14, 30, 22, 0, 'B1 concourse');
ceil(0, 0, 32, 22, HZ);
const W = 0.3;
box(-W, 0, 0, 0, 8, HZ); box(-W, 13.3, 0, 0, 22, HZ);                 // west wall, passage A opening y 8..13
box(-W, 22, 0, 12, 22 + W, HZ); box(17, 22, 0, 32 + W, 22 + W, HZ);   // north wall, passage B opening x 12..17 (the east piece started at 17.3: a 30 cm hole)
box(6.3, -W, 0, 32 + W, 0, HZ); box(-W, -W, 0, 1.7, 0, HZ);           // south wall, exit stair opening x 2..6
box(32, 0, 0, 32 + W, 22, HZ);                                        // east wall
for (const x of [5, 10.5, 16, 24, 29]) for (const y of [6.5, 15.5]) { box(x - 0.4, y - 0.4, 0, x + 0.4, y + 0.4, HZ); deco(x - 0.46, y - 0.46, 0.001, x + 0.46, y + 0.46, 0.12); }
// gate line across the hall (paid area to the east)
for (let i = 0; i < 8; i++) { const y = 3.5 + i * 1.9; box(19.7, y, 0, 20.3, y + 0.28, 1.0); deco(19.75, y + 0.02, 1.0, 20.25, y + 0.26, 1.05); }
box(19.8, 0, 0, 20.2, 3.4, 1.1); box(19.8, 18.8, 0, 20.2, 22, 1.1);
for (let i = 0; i < 5; i++) box(8 + i * 1.1, 0.05, 0, 8.9 + i * 1.1, 0.7, 1.8);   // ticket machines
box(4, 20.8, 0, 10, 21.9, 1.1); deco(4, 21.9, 0, 10, 22, 2.4);                     // lost-property counter and window
box(23, 15, 0, 25, 17.5, 1.0, 'dark');                                               // escalator head
// the stair down to the platform: open at its south end, railed on the other three sides
box(22.7, 8, 0, 23, 14, 1.0); box(30, 8, 0, 30.3, 14, 1.0); box(22.7, 14, 0, 30.3, 14.2, 1.0);
for (let i = 0; i < 20; i++) floor(23, 8 + i * 0.3, 30, 8.3 + i * 0.3, -0.2 * (i + 1), 'stair to the platform');
box(22.7, 8, B2, 23, 14, -0.3); box(30, 8, B2, 30.3, 14, -0.3);                        // stair walls below the hall, stopping under the floor slab
box(23, 13.7, B2C, 30, 14, -0.3);                                                        // closes the slit between the platform ceiling and the hall floor above
// exit stair up to daylight (south-west): where you arrive
floor(2, -0.3, 6, 0, 0, 'exit stair');   // threshold: Study 25's stair started 0.3 m past the doorway, leaving no floor
for (let i = 0; i < 12; i++) floor(2, -0.62 - i * 0.32, 6, -0.3 - i * 0.32, 0.17 * (i + 1), 'exit stair');
box(1.7, -4.6, 0, 2, 0, HZ + 1.5); box(6, -4.6, 0, 6.3, 0, HZ + 1.5);   // out to the hall wall (they stopped 0.3 short: two 30 cm holes) ceil(1.7, -4.3, 6.3, -W, HZ + 1.5);
floor(2, -4.3, 6, -4.14, 0.17 * 12, 'exit stair');   // landing up to the doorway (the top step stopped 16 cm short)
box(2, -4.6, 0.17 * 12, 6, -4.3, HZ + 1.5, 'day');   // the lit doorway, down to the landing (it started 2.3 m up, over a dark gap)
// hanging signs, each on two rods up to the ceiling
export const SIGNS = [[3.5, 9.5, 2.2], [14.5, 19.5, 2.2], [26.5, 5.5, 2.4], [4, 2.5, 2.0], [-2, 10.5, 1.8]];
for (const [x, y, w] of SIGNS) {
  deco(x - w / 2, y - 0.04, HZ - 0.95, x + w / 2, y + 0.04, HZ - 0.6);
  for (const dx of [-w / 2 + 0.12, w / 2 - 0.12]) deco(x + dx - 0.015, y - 0.015, HZ - 0.6, x + dx + 0.015, y + 0.015, HZ, 'rod');
}

// passage A: west out of the hall, turns north, gates, then a stair down to B2
floor(-10, 8, 0, 13, 0, 'passage A'); floor(-10, 13, -5, 30, 0, 'passage A');
ceil(-10, 8, 0, 13, HZ); ceil(-10, 13, -5, 36, HZ);
box(-10.3, 7.7, 0, -W, 8, HZ);                 // south wall, stops at the hall's west wall
box(-5, 13, 0, 0, 13.3, HZ);                   // north wall of the east-west leg, out to the corner (it stopped at -4.7 and left a 30 cm hole)
box(-10.3, 8, B2, -10, 40, HZ);                // west wall, all the way down
box(-5, 13.3, B2, -4.7, 35.7, HZ);             // east wall of the north leg and its stair
box(-9.7, 20, 0, -9.2, 22.4, 0.45, 'dark');    // bench
// the second gate line: the only other way down to the platforms goes through it
export const GATE_A_Y = 25.7;
for (const cx of [-8.8, -7.5, -6.2]) { box(cx - 0.14, GATE_A_Y, 0, cx + 0.14, GATE_A_Y + 0.6, 1.0); deco(cx - 0.12, GATE_A_Y + 0.02, 1.0, cx + 0.12, GATE_A_Y + 0.58, 1.05); }
for (let i = 0; i < 20; i++) floor(-10, 30 + i * 0.3, -5, 30.3 + i * 0.3, -0.2 * (i + 1), 'stair to B2');
// the wall above the corridor opening, from the corridor's ceiling up to the passage roof (without it you
// looked over the corridor ceiling into nothing from the top of this stair)
box(-10, 35.7, B2C, -4.7, 36, HZ);

// passage B: north out of the hall, ends at a closed shutter
floor(12, 22, 17, 32, 0, 'passage B'); ceil(12, 22.3, 17, 32, HZ);
box(11.7, 22.3, 0, 12, 32, HZ); box(17, 22.3, 0, 17.3, 32, HZ); box(11.7, 32, 0, 17.3, 32.3, HZ, 'dark');

// B2: the long corridor east (Hibiya silver), into the platform (Ginza orange)
floor(-10, 36, 21, 40, B2, 'B2 corridor'); ceil(-10, 36, 20.7, 40, B2C);
box(-5, 35.7, B2, 21, 36, B2C); box(-10.3, 40, B2, 21, 40.3, B2C);   // corridor walls meet the stair wall and the platform wall (three 30 cm corner holes before)
floor(21, 14, 32, 44, B2, 'B2 platform'); ceil(20.7, 14, 36, 44, B2C);
box(20.7, 14, B2, 21, 35.7, B2C); box(20.7, 40.3, B2, 21, 44, B2C);    // platform west wall, corridor opening y 36..40
box(20.7, 44, B2, 36.3, 44.3, B2C);                                    // north end
box(20.7, 13.7, B2, 22.7, 14, B2C); box(30.3, 13.7, B2, 36.3, 14, B2C);// south end, stair between
for (let y = 14; y < 44; y += 2.5) { box(32, y + 0.05, B2, 32.15, y + 2.45, B2 + 1.22); deco(31.99, y + 0.05, B2 + 1.22, 32.16, y + 2.45, B2 + 1.3); }
deco(32.15, 14, B2 - 1.2, 36, 44, B2 - 0.9);                            // track bed
deco(32.5, 16, B2 - 0.9, 35.6, 42, B2C - 0.4, 'train');                 // a train at the platform
box(36, 14, B2 - 1.2, 36.3, 44, B2C);
for (const y of [20, 26, 32, 38]) box(26.15, y - 0.35, B2, 26.85, y + 0.35, B2C);
box(21.1, 29, B2, 21.55, 31, B2 + 0.45, 'dark');                        // platform bench

// ceiling light panels: these are the light sources for the whole station
for (let x = 3; x < 31; x += 4) for (const y of [3, 11, 19]) box(x - 1.2, y - 0.2, HZ - 0.06, x + 1.2, y + 0.2, HZ - 0.03, 'glow');
for (const [x, y] of [[-3, 10.5], [-7.5, 10.5], [-7.5, 16], [-7.5, 22], [-7.5, 28], [14.5, 25], [14.5, 29.5], [4, -2.2]]) box(x - 0.7, y - 0.7, (x === 4 ? HZ + 1.5 : HZ) - 0.06, x + 0.7, y + 0.7, (x === 4 ? HZ + 1.5 : HZ) - 0.03, 'glow');
for (let x = -7; x < 21; x += 4) box(x - 1, 37.8, B2C - 0.06, x + 1, 38.2, B2C - 0.03, 'glow');
for (let y = 16; y < 44; y += 4) { box(23.3, y - 1, B2C - 0.06, 23.7, y + 1, B2C - 0.03, 'glow'); box(29.3, y - 1, B2C - 0.06, 29.7, y + 1, B2C - 0.03, 'glow'); }

// closed areas in the demo: the word DEMO on the wall
export const DEMO_SIGNS = [
  { at: [14.5, 31.99, 1.6], w: 3.4, h: 1.5, facing: 'south' },   // passage B shutter
  { at: [26.5, 43.99, -2.4], w: 4.0, h: 1.6, facing: 'south' },  // platform north end
];

// ---------------------------------------------------------------- the lost objects
export const OBJECTS = [
  { id: 'umbrella', name: 'Umbrella, folded', at: [11.06, 6.5, 0], voice: 'passenger', approach: [11.9, 7.4] },
  { id: 'glove', name: 'One glove', at: [25.2, 9.35, -1.0], voice: 'staff', approach: [25.2, 7.6] },   // on the fourth step down to the platform
  { id: 'card', name: 'IC card holder', at: [10.4, 1.15, 0], voice: 'passenger', approach: [10.4, 2.3] },
  { id: 'handkerchief', name: 'Handkerchief', at: [14.4, 31.2, 0], voice: 'staff', approach: [14.5, 29.8] },
  { id: 'scarf', name: 'Scarf', at: [-9.45, 21.2, 0.45], voice: 'passenger', approach: [-8.2, 21.2] },
  { id: 'earbud', name: 'Earbud case', at: [4.2, 37.2, B2], voice: 'staff', approach: [4.2, 38.4] },
  { id: 'bottle', name: 'Water bottle', at: [21.33, 30.2, B2 + 0.45], voice: 'passenger', approach: [22.6, 30.2] },
];
export const floorOf = o => o.id === 'scarf' ? 0 : o.id === 'bottle' ? B2 : o.at[2];

// ---------------------------------------------------------------- lighting model (three.js space)
export const tB = b => ({ minX: b.x0, maxX: b.x1, minY: b.z0, maxY: b.z1, minZ: -b.y1, maxZ: -b.y0 });
const v3 = (x, y, z) => ({ x, y, z });
export const LIGHTS = boxes.filter(b => b.kind === 'glow' || b.kind === 'day').map(b => {
  const t = tB(b), day = b.kind === 'day';
  const area = day ? (b.x1 - b.x0) * (b.z1 - b.z0) : (b.x1 - b.x0) * (b.y1 - b.y0);
  const cx = (t.minX + t.maxX) / 2, cy = (t.minY + t.maxY) / 2, cz = (t.minZ + t.maxZ) / 2;
  return {
    p: day ? v3(cx, cy, t.minZ - 0.05) : v3(cx, t.minY - 0.04, cz),
    m: day ? v3(0, 0, -1) : v3(0, -1, 0),
    // daylight was 26 per m2 over 10 m2 in the first pass and flooded the hall floor at the stair foot
    I: (day ? 4 : 11) * area,
    c: day ? [0.92, 0.97, 1.05] : [1.0, 0.95, 0.86],
    day,
    // the panel's two edges, for jittering sample points inside their cells
    ua: v3((t.maxX - t.minX) * 0.9, 0, 0), va: day ? v3(0, (t.maxY - t.minY) * 0.9, 0) : v3(0, 0, (t.maxZ - t.minZ) * 0.9),
    // points across the panel: shadows get a soft edge from how many of them a surface can see
    pts: (n => {
      const out = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const u = (i + 0.5) / n - 0.5, v = (j + 0.5) / n - 0.5;
        out.push(day ? v3(cx + u * (t.maxX - t.minX) * 0.9, cy + v * (t.maxY - t.minY) * 0.9, t.minZ - 0.05)
                     : v3(cx + u * (t.maxX - t.minX) * 0.9, t.minY - 0.04, cz + v * (t.maxZ - t.minZ) * 0.9));
      }
      return out;
    }),
  };
});
// occluders are shrunk by 1 mm: a surface point lying on a box's boundary (a floor meeting a wall)
// must not count as inside it, or every edge of every room comes out black
const OCC = boxes.filter(b => b.occludes && b.kind !== 'rod').map(tB).map(o => ({ minX: o.minX + 1e-3, maxX: o.maxX - 1e-3, minY: o.minY + 1e-3, maxY: o.maxY - 1e-3, minZ: o.minZ + 1e-3, maxZ: o.maxZ - 1e-3 }));
export const RANGE = 11;
LIGHTS.forEach((L, i) => { L.id = i; });
for (const L of LIGHTS) L.occ = OCC.filter(o => Math.max(o.minX - L.p.x, 0, L.p.x - o.maxX) ** 2 + Math.max(o.minY - L.p.y, 0, L.p.y - o.maxY) ** 2 + Math.max(o.minZ - L.p.z, 0, L.p.z - o.maxZ) ** 2 < RANGE * RANGE);
function segHits(ax, ay, az, bx, by, bz, list) {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  for (const o of list) {
    let t0 = 0.002, t1 = 0.998;
    if (Math.abs(dx) < 1e-9) { if (ax < o.minX || ax > o.maxX) continue; } else { let a = (o.minX - ax) / dx, b = (o.maxX - ax) / dx; if (a > b) [a, b] = [b, a]; if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
    if (Math.abs(dy) < 1e-9) { if (ay < o.minY || ay > o.maxY) continue; } else { let a = (o.minY - ay) / dy, b = (o.maxY - ay) / dy; if (a > b) [a, b] = [b, a]; if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
    if (Math.abs(dz) < 1e-9) { if (az < o.minZ || az > o.maxZ) continue; } else { let a = (o.minZ - az) / dz, b = (o.maxZ - az) / dz; if (a > b) [a, b] = [b, a]; if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) continue; }
    return true;
  }
  return false;
}
export const AMBIENT = 0.3;   // was 0.07: shadows went near black
// a small deterministic hash, so a bake is repeatable but every texel gets its own jitter
export const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
// light arriving at a surface point with normal n, in linear units before exposure.
// samples: points per side of each panel (1 = hard shadows, 3 = 9 points = soft).
// seed: when given, each sample point moves randomly inside its own cell of the panel for this
// point. A fixed grid of 25 points made soft shadows step in 25ths, which showed as banding; jitter
// turns the steps into fine noise that the bake's blur then removes.
export function gather(px, py, pz, nx, ny, nz, samples = 3, stats, seed) {
  // ambient: stands in for light bounced off the pale floor and walls. It was 0.07, which left every
  // shadow near black (deep crescents at column and gate bases); a white-tiled station fills its shadows.
  const A = globalThis.__ambient ?? AMBIENT;
  let r = A, g = A, b = A * 1.07;
  if (ny < -0.5) { r += 0.06; g += 0.06; b += 0.055; }     // floor bounce onto ceilings
  const ox = px + nx * 0.03, oy = py + ny * 0.03, oz = pz + nz * 0.03;
  for (const L of LIGHTS) {
    const vx = L.p.x - ox, vy = L.p.y - oy, vz = L.p.z - oz, d2 = vx * vx + vy * vy + vz * vz;
    if (d2 > RANGE * RANGE) continue;
    const d = Math.sqrt(d2), wx = vx / d, wy = vy / d, wz = vz / d;
    const cs = nx * wx + ny * wy + nz * wz; if (cs <= 0) continue;
    const ce = -(L.m.x * wx + L.m.y * wy + L.m.z * wz); if (ce <= 0) continue;
    const pts = L._pts?.[samples] || ((L._pts ||= {})[samples] = L.pts(samples));
    let seen = 0;
    if (seed === undefined) { for (const q of pts) if (!segHits(ox, oy, oz, q.x, q.y, q.z, L.occ)) seen++; }
    else for (let k = 0; k < pts.length; k++) {
      const q = pts[k], ju = (hash(seed, k * 131 + L.id * 7) - 0.5) / samples, jv = (hash(seed, k * 131 + L.id * 7 + 1) - 0.5) / samples;
      if (!segHits(ox, oy, oz, q.x + L.ua.x * ju + L.va.x * jv, q.y + L.ua.y * ju + L.va.y * jv, q.z + L.ua.z * ju + L.va.z * jv, L.occ)) seen++;
    }
    if (stats) stats.rays += pts.length;
    if (!seen) continue;
    const e = L.I * cs * (0.3 + 0.7 * ce) / (d2 + 0.9) * seen / pts.length;
    r += e * L.c[0]; g += e * L.c[1]; b += e * L.c[2];
  }
  return [r, g, b];
}
// ambient occlusion: how open the space just above a surface point is. Rays go out over the
// hemisphere (cosine-weighted, a fixed Fibonacci pattern so every bake is identical); the share that
// hits something within AO_DIST darkens the point. This is what grounds walls, gates and machines:
// without it the floor next to them was exactly as bright as open floor, so they looked like they floated.
export const AO_DIST = 0.9, AO_SHORT = 0.25, AO_RAYS = 32;
const HEMI = (() => { const out = [], g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < AO_RAYS; i++) { const r = Math.sqrt((i + 0.5) / AO_RAYS), t = i * g; out.push([r * Math.cos(t), r * Math.sin(t), Math.sqrt(1 - r * r)]); } return out; })();
export const nearOcc = (minX, minY, minZ, maxX, maxY, maxZ, pad = AO_DIST) => OCC.filter(o => o.maxX > minX - pad && o.minX < maxX + pad && o.maxY > minY - pad && o.minY < maxY + pad && o.maxZ > minZ - pad && o.minZ < maxZ + pad);
export function openness(px, py, pz, nx, ny, nz, occ, dist = AO_DIST, seed) {
  // tangent frame around the normal
  const ax = Math.abs(nx) < 0.9 ? 1 : 0, ay = ax ? 0 : 1;
  let tx = ay * nz - 0 * ny, ty = 0 * nx - ax * nz, tz = ax * ny - ay * nx; const tl = Math.hypot(tx, ty, tz); tx /= tl; ty /= tl; tz /= tl;
  let bx = ny * tz - nz * ty, by = nz * tx - nx * tz, bz = nx * ty - ny * tx;
  if (seed !== undefined) {   // spin the pattern about the normal by a random angle
    const a = hash(seed, 99991) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
    const t2x = tx * c + bx * sn, t2y = ty * c + by * sn, t2z = tz * c + bz * sn;
    bx = bx * c - tx * sn; by = by * c - ty * sn; bz = bz * c - tz * sn; tx = t2x; ty = t2y; tz = t2z;
  }
  const ox = px + nx * 0.02, oy = py + ny * 0.02, oz = pz + nz * 0.02;
  let free = 0;
  for (const [u, v, w] of HEMI) {
    const dx = (tx * u + bx * v + nx * w) * dist, dy = (ty * u + by * v + ny * w) * dist, dz = (tz * u + bz * v + nz * w) * dist;
    if (!segHits(ox, oy, oz, ox + dx, oy + dy, oz + dz, occ)) free++;
  }
  return free / HEMI.length;
}
// how openness is applied: the 0.9 m term is the broad darkening near walls and fixtures; the 25 cm
// term is the tight contact line right where two surfaces meet, on every side and on the object's own
// lower face. Without the short term the join could stay as bright as open floor on the lit side,
// which is what read as floating.
// (was (0.3 + 0.7 long) x (0.4 + 0.6 short): the join went near black and read as a gap)
export const aoFactor = (aoLong, aoShort = 1) => globalThis.__aoOld ? (0.3 + 0.7 * aoLong) * (0.4 + 0.6 * aoShort) : (0.68 + 0.32 * aoLong) * (0.84 + 0.16 * aoShort);
export const withAO = (rgb, aoLong, aoShort = 1) => { const k = aoFactor(aoLong, aoShort); return [rgb[0] * k, rgb[1] * k, rgb[2] * k]; };

// floor under a fixture (counter, column, machine, gate) is never seen
export const covered = (x, y) => boxes.some(b => b.z0 <= 0.13 && b.z1 > 0.3 && b.kind !== 'floor' && x > b.x0 + 1e-3 && x < b.x1 - 1e-3 && y > b.y0 + 1e-3 && y < b.y1 - 1e-3);
// exposure, shared by every lighting approach: the typical visible hall floor sits at 0.56
export const TARGET = 0.56;
export function exposure() {
  const vals = [];
  for (let x = 0.25; x < 32; x += 0.5) for (let y = 0.25; y < 22; y += 0.5) {
    if (x > 23 && x < 30 && y > 8 && y < 14) continue;   // the stair opening
    if (covered(x, y)) continue;
    vals.push(gather(x, 0, -y, 0, 1, 0, 3)[1]);
  }
  vals.sort((a, b) => a - b);
  return TARGET / vals[vals.length >> 1];
}

// ---------------------------------------------------------------- faces, for the lightmap
// Each box's visible faces as rectangles in three.js space: origin corner, u and v edges, normal.
// Hidden faces are skipped: the underside of floor slabs, the top of ceilings.
export function facesOf(b, index) {
  const t = tB(b), out = [];
  const X0 = t.minX, X1 = t.maxX, Y0 = t.minY, Y1 = t.maxY, Z0 = t.minZ, Z1 = t.maxZ;
  const f = (id, o, u, v, n) => out.push({ box: index, id, o, u, v, n, w: Math.hypot(u.x, u.y, u.z), h: Math.hypot(v.x, v.y, v.z) });
  f('px', v3(X1, Y0, Z1), v3(0, 0, Z0 - Z1), v3(0, Y1 - Y0, 0), v3(1, 0, 0));
  f('nx', v3(X0, Y0, Z0), v3(0, 0, Z1 - Z0), v3(0, Y1 - Y0, 0), v3(-1, 0, 0));
  if (b.kind !== 'ceil') f('py', v3(X0, Y1, Z1), v3(X1 - X0, 0, 0), v3(0, 0, Z0 - Z1), v3(0, 1, 0));
  if (b.kind !== 'floor') f('ny', v3(X0, Y0, Z0), v3(X1 - X0, 0, 0), v3(0, 0, Z1 - Z0), v3(0, -1, 0));
  f('pz', v3(X0, Y0, Z1), v3(X1 - X0, 0, 0), v3(0, Y1 - Y0, 0), v3(0, 0, 1));
  f('nz', v3(X1, Y0, Z0), v3(X0 - X1, 0, 0), v3(0, Y1 - Y0, 0), v3(0, 0, -1));
  return out;
}
export const litBoxes = () => boxes.map((b, i) => [b, i]).filter(([b]) => b.kind !== 'glow' && b.kind !== 'day');
