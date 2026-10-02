
// ================= GARDEN DIGGING (the lawn is a heightfield you can dig into) =================
const GY = -0.2, MAX_DEPTH = 1e6; let STEP = 0.25;
function layerAt(depth){ let lo = 0; for (const L of LAYERS){ const to = L.to || (LAYERS.indexOf(L) + 1) * 0.5; if (depth < to) return L; } return LAYERS[LAYERS.length - 1]; }
const LAYERS = [
  { name: 'topsoil', loot: [['trash', 0.55], ['stone', 0.1]] },
  { name: 'clay', loot: [['waste', 0.45], ['trash', 0.15], ['stone', 0.2]] },
  { name: 'gravel', loot: [['stone', 0.5], ['waste', 0.15], ['gold', 0.1]] },
  { name: 'bedrock', loot: [['gold', 0.4], ['stone', 0.35]] },
  { name: 'deep rock', loot: [['gem', 0.22], ['gold', 0.38], ['stone', 0.25]] },
  { name: 'slate', to: 5, loot: [['fossil', 0.38], ['stone', 0.3], ['gold', 0.15]] },
  { name: 'ancient layer', to: 8, loot: [['relic', 0.3], ['fossil', 0.25], ['gem', 0.12], ['gold', 0.15]] },
  { name: 'granite', to: 12, loot: [['gem', 0.38], ['gold', 0.25], ['stone', 0.2]] },
  { name: 'crystal cavern rock', to: 20, loot: [['gem', 0.5], ['relic', 0.1], ['gold', 0.2]] },
  { name: 'warm deep rock', to: 1e9, loot: [['gem', 0.4], ['relic', 0.25], ['gold', 0.3]] }
];
const TGEO = groundMesh.geometry, TPOS = TGEO.attributes.position, TDIG = TGEO.attributes.dig, TNOR = TGEO.attributes.normal, TROW = TNX + 1;
groundMesh.raycast = () => {};   // the heightfield is ray-marched instead (much faster than 100k triangles)
const soilMat = new THREE.MeshStandardMaterial({ map: canvasTex(128, 128, (g, W) => { g.fillStyle = '#5a3f2b'; g.fillRect(0, 0, W, W); noisePass(g, W, W, 40, 503); }), roughness: 1 });
function tH(i, j){ i = i < 0 ? 0 : i > TNX ? TNX : i; j = j < 0 ? 0 : j > TNZ ? TNZ : j; return TPOS.array[(j * TROW + i) * 3 + 1]; }
function terrainH(x, z){
  const fx = (x - YARD.x0) / TCELL, fz = (z - YARD.z0) / TCELL;
  if (fx < 0 || fz < 0 || fx > TNX || fz > TNZ) return GY;
  const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j;
  return lerp(lerp(tH(i, j), tH(i + 1, j), u), lerp(tH(i, j + 1), tH(i + 1, j + 1), u), v);
}
function terrainNormalY(x, z){ const e = TCELL, dx = terrainH(x + e, z) - terrainH(x - e, z), dz = terrainH(x, z + e) - terrainH(x, z - e); return 2 * e / Math.hypot(dx, 2 * e, dz); }
function terrainRay(o, d, far){
  if (o.y < terrainH(o.x, o.z)) return null;
  let prev = 0;
  for (let t = 0.04; t < far; t += 0.04){
    const x = o.x + d.x * t, z = o.z + d.z * t;
    if (x < YARD.x0 || x > YARD.x1 || z < YARD.z0 || z > YARD.z1) return null;
    if (o.y + d.y * t < terrainH(x, z)){
      let a = prev, b = t;
      for (let k = 0; k < 7; k++){ const m = (a + b) / 2; if (o.y + d.y * m < terrainH(o.x + d.x * m, o.z + d.z * m)) b = m; else a = m; }
      return b;
    }
    prev = t;
  }
  return null;
}
// cells that can't be dug: near the house, the path, the fence, trees, hedges and flower beds
const TLOCK = new Uint8Array(TROW * (TNZ + 1));
function lockReason(x, z){
  if ((x > -6.65 && x < 7.65 && z > -5.65 && z < 5.65) || (x > -9.6 && x < -5.9 && z > -1.85 && z < 2.95)) return 'Too close to the house';
  if (Math.abs(x + 0.6) < 0.5 && z > 5.3 && z < 14.2) return 'That\u2019s the garden path';
  if (x > -2.2 && x < 1.0 && z > 12.4) return 'That\u2019s where the gate swings';
  if (x < YARD.x0 + 0.45 || x > YARD.x1 - 0.45 || z < YARD.z0 + 0.45 || z > YARD.z1 - 0.45) return 'Too close to the fence';
  if (z > 5.2 && z < 6.95 && x > -6.9 && x < 7.0) return 'That\u2019s the flower bed';
  if (Math.hypot(x - 5.0, z + 8.7) < 2.95) return 'That\u2019s the pond';
  for (const b of outdoorCols){ const qx = clamp(x, b.x0, b.x1), qz = clamp(z, b.z0, b.z1); if (Math.hypot(x - qx, z - qz) < 0.35) return 'Something\u2019s in the way'; }
  return null;
}
let outdoorCols = [];
function lockTerrain(){
  outdoorCols = colliders.filter(b => !((b.x1 > -6.4 && b.x0 < 7.4 && b.z1 > -5.4 && b.z0 < 5.4) || (b.x1 > -9.3 && b.x0 < -5.8 && b.z1 > -1.6 && b.z0 < 2.7)) && (b.x1 - b.x0) < 20);
  for (let j = 0; j <= TNZ; j++) for (let i = 0; i <= TNX; i++){ const v = j * TROW + i; TLOCK[v] = lockReason(TPOS.array[v * 3], TPOS.array[v * 3 + 2]) ? 1 : 0; }
}
// ---- hole shapes (outline in the hole's local frame; local -z points away from you) ----
const SHAPES = [
  { id: 'round', name: 'Round' }, { id: 'square', name: 'Square', snap: true }, { id: 'trench', name: 'Trench', snap: true },
  { id: 'wide', name: 'Wide pit' }, { id: 'natural', name: 'Natural' }, { id: 'heart', name: 'Heart' }, { id: 'star', name: 'Star' },
  { id: 'level', name: 'Level ground' }
];
let shapeIdx = 0, nextSeed = 1;
function shapeOutline(id, seed){
  const P = [], circ = (r, n = 40, f = () => 1) => { for (let i = 0; i < n; i++){ const a = i / n * TAU; const k = f(a); P.push({ x: Math.cos(a) * r * k, z: Math.sin(a) * r * k }); } };
  const rect = (w, d) => { const c = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]]; for (let i = 0; i < 4; i++){ const [x0, z0] = c[i], [x1, z1] = c[(i + 1) % 4]; for (let k = 0; k < 6; k++) P.push({ x: lerp(x0, x1, k / 6), z: lerp(z0, z1, k / 6) }); } };
  if (id === 'round') circ(0.3);
  else if (id === 'level') circ(0.5, 40);
  else if (id === 'wide') circ(0.5, 48);
  else if (id === 'square') rect(0.62, 0.62);
  else if (id === 'trench') rect(0.42, 1.5);
  else if (id === 'natural'){ const r = RNG(seed * 97 + 13), p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU; circ(0.34, 48, a => 1 + 0.17 * Math.sin(3 * a + p1) + 0.1 * Math.sin(5 * a + p2) + 0.06 * Math.sin(7 * a + p3)); }
  else if (id === 'heart'){ for (let i = 0; i < 48; i++){ const t = i / 48 * TAU, sx = 16 * Math.pow(Math.sin(t), 3), sy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); P.push({ x: sx * 0.024, z: -(sy + 2.5) * 0.024 }); } }
  else if (id === 'star'){ for (let i = 0; i < 10; i++){ const a = i / 10 * TAU - PI / 2, r = i % 2 ? 0.2 : 0.46; P.push({ x: Math.cos(a) * r, z: Math.sin(a) * r }); } }
  return P;
}
function polyArea(P){ let a = 0; for (let i = 0; i < P.length; i++){ const p = P[i], q = P[(i + 1) % P.length]; a += p.x * q.z - q.x * p.z; } return Math.abs(a) / 2; }
function toWorld(h, p){ const c = Math.cos(h.yaw), s = Math.sin(h.yaw); return { x: h.cx + p.x * c + p.z * s, z: h.cz - p.x * s + p.z * c }; }
function toLocal(h, x, z){ const dx = x - h.cx, dz = z - h.cz, c = Math.cos(h.yaw), s = Math.sin(h.yaw); return { x: dx * c - dz * s, z: dx * s + dz * c }; }
function inPoly(P, x, z){ let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const a = P[i], b = P[j]; if (((a.z > z) !== (b.z > z)) && (x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x)) inside = !inside; } return inside; }
function polyDist(P, x, z){ let d = 1e9; for (let i = 0; i < P.length; i++){ const a = P[i], b = P[(i + 1) % P.length], vx = b.x - a.x, vz = b.z - a.z, t = clamp(((x - a.x) * vx + (z - a.z) * vz) / (vx * vx + vz * vz || 1), 0, 1); d = Math.min(d, Math.hypot(x - a.x - vx * t, z - a.z - vz * t)); } return d; }

// apply a brush to every unlocked vertex under the shape (soft 13 cm edge)
function brush(t, cb){
  const r = t.boundR + 0.14;
  const i0 = Math.max(0, Math.floor((t.cx - r - YARD.x0) / TCELL)), i1 = Math.min(TNX, Math.ceil((t.cx + r - YARD.x0) / TCELL));
  const j0 = Math.max(0, Math.floor((t.cz - r - YARD.z0) / TCELL)), j1 = Math.min(TNZ, Math.ceil((t.cz + r - YARD.z0) / TCELL));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const v = j * TROW + i; if (TLOCK[v]) continue;
    const x = TPOS.array[v * 3], z = TPOS.array[v * 3 + 2], lp = toLocal(t, x, z);
    const w = inPoly(t.pts, lp.x, lp.z) ? 1 : clamp(1 - polyDist(t.pts, lp.x, lp.z) / 0.13, 0, 1);
    if (w > 0) cb(v, w, x, z);
  }
  return [i0, i1, j0, j1];
}
function refreshTerrain(bb){
  const [i0, i1, j0, j1] = bb, A = TPOS.array, N = TNOR.array;
  for (let j = Math.max(0, j0 - 1); j <= Math.min(TNZ, j1 + 1); j++) for (let i = Math.max(0, i0 - 1); i <= Math.min(TNX, i1 + 1); i++){
    const nx = tH(i - 1, j) - tH(i + 1, j), nz = tH(i, j - 1) - tH(i, j + 1), ny = 2 * TCELL, l = Math.hypot(nx, ny, nz), v = (j * TROW + i) * 3;
    N[v] = nx / l; N[v + 1] = ny / l; N[v + 2] = nz / l;
  }
  TPOS.needsUpdate = true; TNOR.needsUpdate = true; TDIG.needsUpdate = true;
  for (const f of found) if (f.t >= 1) f.g.position.y = floorAt(f.g.position.x, f.g.position.z);
  for (const pl of planted) pl.g.position.y = floorAt(pl.g.position.x, pl.g.position.z);
}
function digAt(t){
  let removed = 0; const A = TPOS.array, D = TDIG.array;
  const bb = brush(t, (v, w) => { const h = A[v * 3 + 1], nh = Math.max(GY - (t.maxD || MAX_DEPTH), h - (t.step || STEP) * w); if (nh < h){ removed += (h - nh) * TCELL * TCELL; A[v * 3 + 1] = nh; } D[v] = Math.max(D[v], Math.min(1, w * 1.6)); });
  return { removed, bb };
}
function addHeap(hx, hz, vol){
  const R = 0.5, peak = Math.min(0.3, vol / (0.934 * R * R)); if (peak < 0.005) return null;
  const t = { cx: hx, cz: hz, yaw: 0, pts: [{ x: 0, z: 0 }], boundR: R };
  const A = TPOS.array, D = TDIG.array;
  const i0 = Math.max(0, Math.floor((hx - R - YARD.x0) / TCELL)), i1 = Math.min(TNX, Math.ceil((hx + R - YARD.x0) / TCELL)), j0 = Math.max(0, Math.floor((hz - R - YARD.z0) / TCELL)), j1 = Math.min(TNZ, Math.ceil((hz + R - YARD.z0) / TCELL));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const v = j * TROW + i; if (TLOCK[v]) continue;
    const d = Math.hypot(A[v * 3] - hx, A[v * 3 + 2] - hz); if (d >= R) continue;
    const h = A[v * 3 + 1]; if (h < GY - 0.05) continue;
    const add = peak * 0.5 * (1 + Math.cos(PI * d / R));
    A[v * 3 + 1] = Math.min(GY + 0.35, h + add); D[v] = Math.max(D[v], clamp(add / 0.02, 0, 1));
  }
  return [i0, i1, j0, j1];
}
function digTarget(){
  ray2.setFromCamera(rayCenter, camera); ray2.far = 2.6;
  let first = null;
  for (const hit of ray2.intersectObjects(scene.children, true)){
    const o = hit.object;
    if (o.isSprite || o.isLine || o.isLineSegments || o === sky || o === preview || (held && isUnder(o, held.g)) || !o.visible || (o.material && o.material.transparent && o.material.opacity < 0.3)) continue;
    first = hit; break;
  }
  const td = terrainRay(ray2.ray.origin, ray2.ray.direction, 2.6);
  const indoors = inHouse(camera.position.x, camera.position.z);
  if (td == null || (first && first.distance < td)) return { ok: false, msg: indoors ? 'Take the shovel outside to dig' : first ? 'Aim at the lawn to dig' : 'Too far away. Aim at the ground closer to you.' };
  const p = ray2.ray.at(td, new THREE.Vector3()), sh = SHAPES[shapeIdx];
  let yaw = player.yaw; if (sh.snap) yaw = Math.round(yaw / (PI / 2)) * (PI / 2);
  const t = { cx: p.x, cz: p.z, yaw, kind: sh.id, seed: nextSeed, mode: sh.id === 'level' ? 'level' : 'dig' };
  t.pts = shapeOutline(sh.id, nextSeed); t.boundR = Math.max(...t.pts.map(q => Math.hypot(q.x, q.z))); t.area = polyArea(t.pts);
  const why = lockReason(p.x, p.z);
  if (why) return Object.assign(t, { ok: false, msg: why });
  t.ok = true; return t;
}
function doDig(t){
  if (!t.step && GY - terrainH(t.cx, t.cz) > 2.0){ t.step = 0.1; if (Math.random() < 0.35) toast('Hard rock. A pickaxe or the power auger would be much faster.'); }
  const { removed, bb } = digAt(t); markActive(bb); if (removed >= 0.002) addDirt('soil', 0.05);
  if (removed < 0.002){ refreshTerrain(bb); toast('Nothing came loose. Try again.'); return false; }
  nextSeed++;
  // throw the soil onto a heap on the far side
  let dx = t.cx - camera.position.x, dz = t.cz - camera.position.z, dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
  const hd = t.boundR + 0.55;
  for (const [ax, az] of [[dx, dz], [-dz, dx], [dz, -dx]]){
    const hx = t.cx + ax * hd, hz = t.cz + az * hd;
    if (!lockReason(hx, hz) && terrainH(hx, hz) > GY - 0.05){ const hb = addHeap(hx, hz, removed * 0.3); if (hb) refreshTerrain(hb); break; }
  }
  refreshTerrain(bb);
  for (let k = 0; k < 16; k++) emit('crumb', new THREE.Vector3(t.cx + (Math.random() - 0.5) * 0.3, terrainH(t.cx, t.cz) + 0.1, t.cz + (Math.random() - 0.5) * 0.3), new THREE.Vector3(dx * (0.6 + Math.random() * 0.6), 1.3 + Math.random() * 0.9, dz * (0.6 + Math.random() * 0.6)));
  sfx('dig');
  const depth = GY - terrainH(t.cx, t.cz), L = layerAt(Math.max(0, depth - 0.001));
  const depthTxt = parseFloat(depth.toFixed(2)) + ' m', an = n => (/^[aeiou]/.test(n) ? 'an ' : 'a ') + n;
  const names = [], rolls = t.area > 0.45 ? 2 : 1; let gold = false;
  for (let k = 0; k < rolls; k++){
    let r = Math.random(), type = null;
    for (const [ty, pr] of L.loot){ if (r < pr){ type = ty; break; } r -= pr; }
    const vein = veinAt(t.cx, t.cz, depth); if (vein && Math.random() < 0.85){ type = 'gold'; vein.left--; }
    if (type){ names.push(an(spawnFind(type, t))); if (type === 'gold' || type === 'gem' || type === 'relic' || type === 'fossil') gold = true; }
  }
  if (names.length){ const list = names.join(' and '); toast(gold ? `Found ${list} at ${depthTxt}!` : `Found ${list} in the ${L.name} (${depthTxt})`); if (gold) setTimeout(chime, 250); }
  else toast(depth >= MAX_DEPTH - 0.01 ? `Hit solid rock at ${depthTxt}.` : `Just ${L.name} at ${depthTxt}. Keep digging.`);
}
function doLevel(t){
  const A = TPOS.array, D = TDIG.array;
  const bb = brush(t, (v, w) => { const h = A[v * 3 + 1], dh = GY - h, s = Math.sign(dh) * Math.min(Math.abs(dh), STEP * w); A[v * 3 + 1] = h + s; if (Math.abs(GY - A[v * 3 + 1]) < 0.004) D[v] = Math.max(0, D[v] - 0.5 * w); });
  refreshTerrain(bb); markActive(bb); addDirt('soil', 0.03); sfx('dig');
  for (let k = 0; k < 10; k++) emit('crumb', new THREE.Vector3(t.cx + (Math.random() - 0.5) * 0.6, terrainH(t.cx, t.cz) + 0.3, t.cz + (Math.random() - 0.5) * 0.6), new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.3, (Math.random() - 0.5) * 0.4));
  toast(Math.abs(terrainH(t.cx, t.cz) - GY) < 0.01 ? 'Levelled. The grass will grow back if you smooth it once more.' : 'Filling in\u2026');
}
// outline of where the next scoop will go, draped over the ground
const preview = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false }));
preview.visible = false; preview.renderOrder = 4; scene.add(preview); movers.push(preview); let previewKey = '';
function updateDigPreview(){
  if (held !== shovelItem || heldAnim || inHouse(camera.position.x, camera.position.z)){ preview.visible = false; return; }
  const t = digTarget();
  if (!t.pts){ preview.visible = false; return; }
  const key = [t.kind, t.seed, t.cx.toFixed(2), t.cz.toFixed(2), t.yaw.toFixed(2), terrainH(t.cx, t.cz).toFixed(2)].join('|');
  if (key !== previewKey){
    previewKey = key; preview.geometry.dispose();
    const pts = t.pts.map(q => { const w = toWorld(t, q); return new THREE.Vector3(w.x, terrainH(w.x, w.z) + 0.025, w.z); });
    preview.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'centripetal'), Math.max(48, pts.length * 3), 0.012, 4, true);
  }
  preview.material.color.set(t.ok ? '#ffffff' : '#e0625a'); preview.visible = true;
}
// ---- things buried in the soil ----
const goldM = new THREE.MeshStandardMaterial({ color: C('#e2b33c'), metalness: 1, roughness: 0.22, envMapIntensity: 1.4 });
function lumpGeo(r, seed, detail = 1){ const g = new THREE.IcosahedronGeometry(r, detail), p = g.attributes.position, rr = RNG(seed); for (let i = 0; i < p.count; i++){ const k = 0.75 + rr() * 0.5; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k); } g.computeVertexNormals(); return g; }
const FINDS = {
  trash: { label: 'trash', items: [
    ['crushed can', g => { const c = cyl(0.03, 0.03, 0.07, M('#c0392b', 0.35, 0.6), 0, 0.02, 0, g, 14); c.rotation.z = PI / 2; c.scale.set(1, 1, 0.45); }],
    ['plastic bottle', g => { const c = cyl(0.03, 0.03, 0.17, M('#cfe6ee', 0.15), 0, 0.03, 0, g, 14); c.rotation.z = PI / 2; cyl(0.012, 0.012, 0.02, M('#2f6fb3', 0.4), 0.095, 0.03, 0, g, 10).rotation.z = PI / 2; }],
    ['crisp packet', g => { const b = rboxB(0.13, 0.012, 0.1, 0.005, M('#e8b93a', 0.45, 0.3), 0, 0, 0, g); b.rotation.y = 0.4; b.scale.set(1, 1.6, 0.8); }],
    ['bottle cap', g => cyl(0.016, 0.016, 0.007, M('#b03a2e', 0.4, 0.6), 0, 0.0035, 0, g, 16)]
  ] },
  waste: { label: 'waste', items: [
    ['rusty tin', g => cyl(0.04, 0.04, 0.08, M('#7a4428', 0.95, 0.4), 0, 0.04, 0, g, 16)],
    ['old battery', g => { const c = cyl(0.016, 0.016, 0.055, M('#1d1f1f', 0.5), 0, 0.016, 0, g, 12); c.rotation.z = PI / 2; cyl(0.007, 0.007, 0.006, M('#c08a3e', 0.3, 0.9), 0.03, 0.016, 0, g, 8).rotation.z = PI / 2; }],
    ['bent pipe', g => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.1, 0.012, 0), new THREE.Vector3(0, 0.012, 0.03), new THREE.Vector3(0.06, 0.012, 0.09)]), 12, 0.012, 8, false), M('#6f7477', 0.6, 0.6), 0, 0, 0, g)],
    ['broken tile', g => { const b = boxB(0.1, 0.012, 0.08, M('#b86a4b', 0.8), 0, 0, 0, g); b.rotation.y = 0.7; }]
  ] },
  stone: { label: 'stone', items: [
    ['pebble', g => sph(0.035, M('#8d8a84', 0.7), 0, 0.02, 0, g, 1, 0.6, 0.8, 14)],
    ['flint', g => mesh(lumpGeo(0.04, 7, 0), M('#3f3d3b', 0.35), 0, 0.022, 0, g)],
    ['quartz crystal', g => { mesh(new THREE.ConeGeometry(0.02, 0.08, 6), new THREE.MeshStandardMaterial({ color: C('#f1ecf4'), roughness: 0.1, transparent: true, opacity: 0.85, emissive: C('#ffffff'), emissiveIntensity: 0.15 }), 0, 0.04, 0, g, false); }],
    ['granite chunk', g => mesh(lumpGeo(0.05, 11, 1), M('#a39c93', 0.8), 0, 0.028, 0, g)]
  ] },
  fossil: { label: 'fossil', items: [
    ['ammonite', g => { const t = mesh(new THREE.TorusGeometry(0.035, 0.016, 8, 24), M('#b9a88a', 0.8), 0, 0.016, 0, g); t.rotation.x = PI / 2; sph(0.02, M('#a39376', 0.8), 0, 0.016, 0, g, 1, 0.7, 1); }],
    ['trilobite', g => { const b = sph(0.045, M('#7d7468', 0.7), 0, 0.012, 0, g, 0.7, 0.3, 1.1); for (let k = 0; k < 5; k++) boxB(0.06, 0.004, 0.005, M('#5d554b', 0.8), 0, 0.02, -0.03 + k * 0.015, g, false); }],
    ['fossil fern', g => { boxB(0.12, 0.025, 0.09, M('#8e8a84', 0.85), 0, 0, 0, g); const l = mesh(leafGeo(0.08, 0.03, 0.02, 0, 4), M('#4a4640', 0.9), 0, 0.026, 0.035, g, false, false); l.rotation.x = -PI / 2; }],
    ['dinosaur tooth', g => { const c = mesh(new THREE.ConeGeometry(0.018, 0.09, 10), M('#e8dcc2', 0.5), 0, 0.02, 0, g); c.rotation.z = PI / 2 - 0.3; }]
  ] },
  relic: { label: 'relic', items: [
    ['ancient coin', g => cyl(0.022, 0.022, 0.004, M('#b9bec2', 0.35, 0.9), 0, 0.002, 0, g, 22)],
    ['bronze arrowhead', g => { const c = mesh(new THREE.ConeGeometry(0.02, 0.07, 4), M('#a8743e', 0.4, 0.8), 0, 0.012, 0, g); c.rotation.z = PI / 2; c.scale.set(1, 1, 0.3); }],
    ['stone tablet', g => { boxB(0.11, 0.02, 0.15, M('#a39c8f', 0.9), 0, 0, 0, g); for (let k = 0; k < 4; k++) boxB(0.08, 0.002, 0.006, M('#6b665c', 0.9), 0, 0.02, -0.045 + k * 0.03, g, false); }],
    ['meteorite', g => mesh(lumpGeo(0.045, 21, 1), M('#2f2d2b', 0.35, 0.8), 0, 0.03, 0, g)]
  ] },
  gem: { label: 'gem', items: [
    ['diamond', g => { const m = mesh(new THREE.OctahedronGeometry(0.02), new THREE.MeshStandardMaterial({ color: C('#eef7ff'), roughness: 0.02, metalness: 0.2, emissive: C('#9fd8ff'), emissiveIntensity: 0.35 }), 0, 0.02, 0, g); m.scale.set(1, 1.2, 1); }],
    ['amethyst', g => { for (let k = 0; k < 5; k++){ const c = mesh(new THREE.ConeGeometry(0.012, 0.05, 6), new THREE.MeshStandardMaterial({ color: C('#8e5cc2'), roughness: 0.1, emissive: C('#2a1240'), emissiveIntensity: 0.4 }), (k - 2) * 0.012, 0.025, (k % 2) * 0.01, g); c.rotation.z = (k - 2) * 0.25; } }],
    ['ruby', g => { const m = mesh(new THREE.OctahedronGeometry(0.022), new THREE.MeshStandardMaterial({ color: C('#c0172e'), roughness: 0.08, metalness: 0.1, emissive: C('#5a0010'), emissiveIntensity: 0.4 }), 0, 0.02, 0, g); m.scale.set(1, 1.3, 1); }],
    ['emerald', g => { const m = mesh(new THREE.OctahedronGeometry(0.022), new THREE.MeshStandardMaterial({ color: C('#1f9e5a'), roughness: 0.08, emissive: C('#04301a'), emissiveIntensity: 0.4 }), 0, 0.02, 0, g); m.scale.set(1, 1.4, 0.8); }],
    ['sapphire', g => { const m = mesh(new THREE.OctahedronGeometry(0.022), new THREE.MeshStandardMaterial({ color: C('#2453c7'), roughness: 0.08, emissive: C('#071a4a'), emissiveIntensity: 0.4 }), 0, 0.02, 0, g); m.scale.set(1.2, 1.1, 1); }]
  ] },
  gold: { label: 'gold', items: [
    ['gold nugget', g => mesh(lumpGeo(0.028, 3, 1), goldM, 0, 0.018, 0, g)],
    ['gold coin', g => { cyl(0.022, 0.022, 0.004, goldM, 0, 0.002, 0, g, 24); }],
    ['gold ring', g => { const t = mesh(new THREE.TorusGeometry(0.018, 0.0045, 10, 28), goldM, 0, 0.005, 0, g); t.rotation.x = PI / 2; }]
  ] }
};
const found = [], pocket = { relic: 0, fossil: 0, gem: 0, gold: 0, stone: 0, trash: 0, waste: 0, items: [] };
function spawnFind(type, h){
  const T = FINDS[type], [name, build] = T.items[(Math.random() * T.items.length) | 0];
  const g = new THREE.Group(); build(g); scene.add(g);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  hitProxy(g, 0.16, 0.12, 0.16, 0, 0.05, 0);
  const deepHole = GY - terrainH(h.cx, h.cz) > 2.5, a = Math.random() * TAU, rr = deepHole ? 0.04 + Math.random() * 0.12 : h.boundR + 0.2 + Math.random() * 0.2, tx = h.cx + Math.cos(a) * rr, tz = h.cz + Math.sin(a) * rr;
  const f = { type, name, g, from: new THREE.Vector3(h.cx, terrainH(h.cx, h.cz) + 0.05, h.cz), to: new THREE.Vector3(tx, floorAt(tx, tz), tz), t: 0, spark: 0 };
  g.position.copy(f.from); g.rotation.y = Math.random() * TAU;
  const rec = { kind: 'custom', label: () => 'Pick up the ' + name, use: () => pocketFind(f) };
  g.traverse(o => { if (o.isMesh){ o.userData.act = rec; actMeshes.push(o); } });
  rayList = null; found.push(f);
  return name;
}
function pocketFind(f){
  scene.remove(f.g); found.splice(found.indexOf(f), 1);
  const set = new Set(); f.g.traverse(o => set.add(o));
  for (let i = actMeshes.length - 1; i >= 0; i--) if (set.has(actMeshes[i])) actMeshes.splice(i, 1);
  rayList = null; pocket[f.type]++; pocket.items.push({ type: f.type, name: f.name }); refreshFinds();
  if (f.type === 'gold' || f.type === 'gem' || f.type === 'relic' || f.type === 'fossil') chime(); else sfx('pick');
  toast(f.type === 'trash' || f.type === 'waste' ? 'Picked up the ' + f.name + '. Drop it in the bin by the house.' : 'The ' + f.name + ' goes in your pocket');
}
function refreshFinds(){
  const el = $('#finds'), parts = [];
  if (pocket.relic) parts.push(`<span class="fd" style="background:#8a6a3a"></span>${pocket.relic} ${pocket.relic === 1 ? 'relic' : 'relics'}`);
  if (pocket.fossil) parts.push(`<span class="fd" style="background:#b9a88a"></span>${pocket.fossil} ${pocket.fossil === 1 ? 'fossil' : 'fossils'}`);
  if (pocket.gem) parts.push(`<span class="fd" style="background:#c0172e"></span>${pocket.gem} ${pocket.gem === 1 ? 'gem' : 'gems'}`);
  if (pocket.gold) parts.push(`<span class="fd" style="background:#e2b33c"></span>${pocket.gold} gold`);
  if (pocket.stone) parts.push(`<span class="fd" style="background:#9a958d"></span>${pocket.stone} ${pocket.stone === 1 ? 'stone' : 'stones'}`);
  if (pocket.trash) parts.push(`<span class="fd" style="background:#c0392b"></span>${pocket.trash} trash`);
  if (pocket.waste) parts.push(`<span class="fd" style="background:#7a4428"></span>${pocket.waste} waste`);
  el.innerHTML = `<b>$${money}</b><span class="sep"></span><span class="fi">${wearingLabel()}</span><span class="fi">${dirtLabel()}</span>` + (parts.length ? '<span class="sep"></span>' + parts.map(p => `<span class="fi">${p}</span>`).join('') : '');
  el.classList.toggle('hidden', !started);
}
function chime(){
  if (!audio) return;
  const now = audio.currentTime;
  [[1318, 0], [1760, 0.09], [2637, 0.18]].forEach(([f, dt]) => { const o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, now + dt); g.gain.linearRampToValueAtTime(0.08, now + dt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + dt + 0.6); o.connect(g); g.connect(audio.destination); o.start(now + dt); o.stop(now + dt + 0.65); });
}

// ---- the shovel ----
const shovelItem = (() => {
  const g = new THREE.Group(); g.rotation.order = 'YXZ'; g.position.set(1.6, GY - 0.1, 7.4); g.rotation.set(0, 0.4, 0.1);
  const steel = M('#8d9295', 0.35, 0.8);
  const sh = new THREE.Shape(); sh.moveTo(-0.1, 0.26); sh.lineTo(0.1, 0.26); sh.lineTo(0.1, 0.07); sh.quadraticCurveTo(0.06, 0.0, 0, -0.005); sh.quadraticCurveTo(-0.06, 0.0, -0.1, 0.07); sh.closePath();
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.008, bevelEnabled: false }); bg.translate(0, 0, -0.004);
  mesh(bg, steel, 0, 0, 0, g);
  cyl(0.022, 0.03, 0.1, steel, 0, 0.31, 0, g, 12);
  cyl(0.017, 0.017, 0.56, MAT.oak, 0, 0.64, 0, g, 12);
  const dh = mesh(new THREE.TorusGeometry(0.055, 0.011, 8, 24), MAT.black, 0, 0.955, 0, g); dh.scale.set(1, 0.9, 1);
  const cb = cyl(0.012, 0.012, 0.1, MAT.oak, 0, 0.91, 0, g, 8); cb.rotation.z = PI / 2;
  hitProxy(g, 0.26, 1.0, 0.26, 0, 0.5, 0);
  const clump = sph(0.075, soilMat, 0, 0.15, 0.03, g, 1.1, 0.7, 0.45, 12); clump.visible = false;
  const it = makeItem('shovel', 'shovel', g, { heavy: true, alt: { key: 'R', label: () => (SHAPES[shapeIdx].id === 'level' ? 'Mode: ' : 'Shape: ') + SHAPES[shapeIdx].name, use: () => { shapeIdx = (shapeIdx + 1) % SHAPES.length; refreshHeld(); previewKey = ''; sfx('click'); } },
    hold: [0.28, -0.52, -0.95, 0.75, 0, -0.45], verb: 'Dig', restR: [PI / 2, 0], restY: 0.02, use: it => {
    const tg = digTarget();
    if (!tg.ok){ toast(tg.msg); return; }
    let done = false;
    animHeld(1.0, k => {
      const P = it.g.position, R = it.g.rotation;
      if (k < 0.4){ const e = smooth(k / 0.4); P.set(0.28, lerp(-0.52, -0.76, e), lerp(-0.95, -1.18, e)); R.x = lerp(0.75, 0.62, e); }
      else if (k < 0.75){ const e = smooth((k - 0.4) / 0.35); P.set(0.28, lerp(-0.76, -0.42, e), lerp(-1.18, -1.02, e)); R.x = lerp(0.62, 0.35, e); }
      else { const e = smooth((k - 0.75) / 0.25); P.set(0.28, lerp(-0.42, -0.52, e), lerp(-1.02, -0.95, e)); R.x = lerp(0.35, 0.75, e); }
      clump.visible = tg.mode === 'dig' && k > 0.42 && k < 0.88;
      if (!done && k >= 0.4){ done = true; if (tg.mode === 'level') doLevel(tg); else doDig(tg); }
    }, () => { clump.visible = false; });
  } });
  return it;
})();

// ---- wheelie bin for the rubbish ----
{
  const g = grp(7.75, 4.3, -PI / 2, scene, GY), green = M('#2f5d46', 0.55);
  rboxB(0.52, 0.9, 0.56, 0.03, green, 0, 0.05, 0, g);
  const lid = new THREE.Group(); lid.position.set(0, 0.97, -0.3); g.add(lid);
  rboxB(0.56, 0.04, 0.62, 0.015, green, 0, 0, 0.3, lid, true, 2);
  boxB(0.3, 0.03, 0.04, M('#23473a', 0.5), 0, 0.02, 0.6, lid, false);
  for (const s of [-1, 1]){ const w = cyl(0.07, 0.07, 0.04, MAT.black, s * 0.24, 0.07, -0.26, g, 16); w.rotation.z = PI / 2; }
  movers.push(lid);
  const lidRec = animated({ kind: 'custom', open: false, dur: 0.35, apply: k => { lid.rotation.x = -1.2 * k; } }, null);
  lidRec.label = () => { const n = pocket.trash + pocket.waste; return n ? `Bin ${n} ${n === 1 ? 'piece' : 'pieces'} of rubbish` : (lidRec.open ? 'Close the bin' : 'Open the bin'); };
  lidRec.use = () => {
    const n = pocket.trash + pocket.waste;
    if (n){ lidRec.open = true; setTimeout(() => { lidRec.open = false; sfx('close'); }, 1200); pocket.trash = 0; pocket.waste = 0; pocket.items = pocket.items.filter(q => q.type !== 'trash' && q.type !== 'waste'); refreshFinds(); sfx('rattle'); toast(`Binned ${n} ${n === 1 ? 'piece' : 'pieces'} of rubbish. The garden is tidier.`); }
    else { lidRec.open = !lidRec.open; sfx(lidRec.open ? 'open' : 'close'); }
  };
  tagAct(g, lidRec);
  blob(7.75, 4.3, 0.56, 0.6, -PI / 2, 0.35, GY + 0.004);
  foot(7.75, 4.3, 0.56, 0.6, -PI / 2);
}


lockTerrain();
function updateGarden(dt){
  for (const f of found){
    if (f.t < 1){
      f.t = Math.min(1, f.t + dt / 0.6);
      f.g.position.lerpVectors(f.from, f.to, f.t); f.g.position.y += Math.sin(f.t * PI) * 0.5;
      if (f.t >= 1) f.g.position.copy(f.to);
    } else if (f.type === 'gold' || f.type === 'gem' || f.type === 'relic'){ f.spark -= dt; if (f.spark <= 0){ f.spark = 1 + Math.random(); emit('spark', f.g.position.clone().add(new THREE.Vector3(0, 0.05, 0)), new THREE.Vector3(0, 0.15, 0)); } }
  }
}
