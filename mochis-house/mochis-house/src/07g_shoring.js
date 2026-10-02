
// ================= CAVE-INS AND SHORING =================
// Deep, steep holes slump: soil slides from the walls into the bottom unless planks hold it back.
const TSUP = new Uint8Array(TROW * (TNZ + 1)), TSUP2 = new Uint8Array(TROW * (TNZ + 1));
const boards = [];
let slumpBox = null, slumpAcc = 0, slumpQuiet = 0, slumpSoundT = 0, slumpWarned = false;
const SLUMP_STEP = 0.22, SLUMP_DEPTH = 0.45;
function markActive(bb){
  const [i0, i1, j0, j1] = bb, a = [Math.max(1, i0 - 4), Math.min(TNX - 1, i1 + 4), Math.max(1, j0 - 4), Math.min(TNZ - 1, j1 + 4)];
  slumpBox = slumpBox ? [Math.min(slumpBox[0], a[0]), Math.max(slumpBox[1], a[1]), Math.min(slumpBox[2], a[2]), Math.max(slumpBox[3], a[3])] : a;
  slumpQuiet = 0;
}
function updateSlump(dt){
  slumpSoundT -= dt;
  if (!slumpBox) return;
  slumpAcc += dt; if (slumpAcc < 0.2) return; slumpAcc = 0;
  const A = TPOS.array, Dg = TDIG.array, [i0, i1, j0, j1] = slumpBox, falls = [];
  let moved = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const v = j * TROW + i; if (TLOCK[v] || TSUP[v] || TSUP2[v]) continue;
    const h = A[v * 3 + 1];
    let nb = -1, nh = h;
    for (const u of [v - 1, v + 1, v - TROW, v + TROW]){ if (TLOCK[u]) continue; const hu = A[u * 3 + 1]; if (hu < nh){ nh = hu; nb = u; } }
    if (nb < 0 || GY - nh < SLUMP_DEPTH) continue;
    const diff = h - nh; if (diff <= SLUMP_STEP) continue;
    const m = Math.min(0.07, (diff - SLUMP_STEP) * 0.3);
    A[v * 3 + 1] -= m; A[nb * 3 + 1] += m; Dg[nb] = 1; Dg[v] = Math.max(Dg[v], 0.85);
    moved += m * TCELL * TCELL;
    if (falls.length < 5 && Math.random() < 0.08) falls.push(v);
  }
  if (moved > 0.00005){
    slumpQuiet = 0; refreshTerrain(slumpBox);
    for (const v of falls){ const x = A[v * 3], z = A[v * 3 + 2], y = A[v * 3 + 1]; for (let k = 0; k < 3; k++) emit('crumb', new THREE.Vector3(x, y + 0.05, z), new THREE.Vector3((Math.random() - 0.5) * 0.3, 0.2 + Math.random() * 0.3, (Math.random() - 0.5) * 0.3)); }
    if (slumpSoundT <= 0 && moved > 0.002 && Math.hypot(camera.position.x - A[falls.length ? falls[0] * 3 : 0], camera.position.z - A[falls.length ? falls[0] * 3 + 2 : 2]) < 8){ sfx('dig'); slumpSoundT = 0.9; }
    if (!slumpWarned && moved > 0.004){ slumpWarned = true; toast('The sides are caving in! Hold the soil back with planks from the woodpile by the house.'); }
  } else if ((slumpQuiet += 0.2) > 2) slumpBox = null;
}
// ---- planks ----
const plankMat = new THREE.MeshStandardMaterial({ map: TX.oak, color: C('#c49a6c'), roughness: 0.8 });
function recomputeSupport(){
  TSUP.fill(0);
  const A = TPOS.array;
  for (const b of boards){
    const r = 0.7, i0 = Math.max(0, Math.floor((b.x - r - YARD.x0) / TCELL)), i1 = Math.min(TNX, Math.ceil((b.x + r - YARD.x0) / TCELL)), j0 = Math.max(0, Math.floor((b.z - r - YARD.z0) / TCELL)), j1 = Math.min(TNZ, Math.ceil((b.z + r - YARD.z0) / TCELL));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
      const v = j * TROW + i, dx = A[v * 3] - b.x, dz = A[v * 3 + 2] - b.z;
      const along = dx * -b.uz + dz * b.ux, back = dx * b.ux + dz * b.uz;
      if (Math.abs(along) < 0.46 && back > -0.07 && back < 0.55) TSUP[v] = 1;
    }
  }
}
function findWall(p){
  const f = forwardV(); let fx = f.x, fz = f.z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
  let best = null, bg = 0.04;
  for (let s = -1.0; s <= 1.0; s += 0.05){
    const x = p.x + fx * s, z = p.z + fz * s, e = 0.12;
    const gx = terrainH(x + e, z) - terrainH(x - e, z), gz = terrainH(x, z + e) - terrainH(x, z - e), g = Math.hypot(gx, gz);
    if (g > bg){ bg = g; best = { x, z, ux: gx / g, uz: gz / g }; }
  }
  return best;
}
function placeBoard(it){
  ray2.setFromCamera(rayCenter, camera);
  const td = terrainRay(ray2.ray.origin, ray2.ray.direction, 2.8);
  if (td == null){ toast(inHouse(camera.position.x, camera.position.z) ? 'Planks are for holding up the sides of holes in the garden' : 'Aim at the side of a hole'); return; }
  const w0 = findWall(ray2.ray.at(td, new THREE.Vector3()));
  if (!w0){ toast('Aim at the side of a hole to shore it up'); return; }
  const p = new THREE.Vector3(w0.x, 0, w0.z), ux = w0.ux, uz = w0.uz;
  let top = -1e9, bot = 1e9;
  for (let s = -0.7; s <= 0.7; s += 0.05){ const hh = terrainH(p.x + ux * s, p.z + uz * s); top = Math.max(top, hh); bot = Math.min(bot, hh); }
  if (top - bot < 0.22){ toast('That slope is gentle enough without a plank'); return; }
  const mid = (top + bot) / 2; let ws = 0;
  for (let s = -0.7; s <= 0.7; s += 0.025){ if (terrainH(p.x + ux * s, p.z + uz * s) >= mid){ ws = s; break; } }
  const wx = p.x + ux * (ws - 0.03), wz = p.z + uz * (ws - 0.03);
  if (boards.some(b => Math.hypot(b.x - wx, b.z - wz) < 0.35)){ toast('There\u2019s already a plank there'); return; }
  const hgt = top - bot + 0.14, g = new THREE.Group(); g.position.set(wx, bot - 0.03, wz); g.rotation.y = Math.atan2(-ux, -uz); scene.add(g);
  const n = Math.ceil(hgt / 0.18);
  for (let k = 0; k < n; k++){ const ph = Math.min(0.17, hgt - k * 0.18); if (ph > 0.02) boxB(0.84, ph, 0.035, plankMat, 0, k * 0.18, 0, g, true, true); }
  for (const s of [-1, 1]){ boxB(0.06, hgt + 0.1, 0.045, plankMat, s * 0.3, -0.05, 0.04, g, true, true); const tip = mesh(new THREE.ConeGeometry(0.035, 0.08, 4), plankMat, s * 0.3, hgt + 0.09, 0.04, g); tip.rotation.y = PI / 4; }
  const b = { g, x: wx, z: wz, ux, uz };
  const rec = { kind: 'custom', label: () => 'Pull out the plank', use: () => removeBoard(b) };
  g.traverse(o => { if (o.isMesh){ o.userData.act = rec; actMeshes.push(o); } }); rayList = null;
  boards.push(b); recomputeSupport();
  const ci = Math.round((wx - YARD.x0) / TCELL), cj = Math.round((wz - YARD.z0) / TCELL); markActive([ci - 6, ci + 6, cj - 6, cj + 6]);
  sfx('close'); addDirt('soil', 0.02); for (let k = 0; k < 8; k++) emit('crumb', new THREE.Vector3(wx, top + 0.05, wz), new THREE.Vector3((Math.random() - 0.5) * 0.5, 0.6, (Math.random() - 0.5) * 0.5));
  animHeld(0.5, k => { it.g.position.y = it.o.hold[1] - Math.sin(k * PI) * 0.12; });
  it.st.n = (it.st.n == null ? 6 : it.st.n) - 1;
  if (it.st.n <= 0){ toast('Wall shored up. That was your last plank.'); removeItem(it); }
  else toast(`Wall shored up. ${it.st.n} ${it.st.n === 1 ? 'plank' : 'planks'} left.`);
}
function removeBoard(b){
  scene.remove(b.g); boards.splice(boards.indexOf(b), 1);
  const set = new Set(); b.g.traverse(o => set.add(o));
  for (let i = actMeshes.length - 1; i >= 0; i--) if (set.has(actMeshes[i])) actMeshes.splice(i, 1);
  rayList = null; recomputeSupport();
  const ci = Math.round((b.x - YARD.x0) / TCELL), cj = Math.round((b.z - YARD.z0) / TCELL); markActive([ci - 6, ci + 6, cj - 6, cj + 6]);
  sfx('whoosh');
  if (held && held.name === 'bundle of planks'){ held.st.n = Math.min(12, (held.st.n == null ? 6 : held.st.n) + 1); toast(`Plank pulled out. ${held.st.n} planks in your bundle.`); }
  else toast('Plank pulled out and stacked back on the woodpile');
}
function buildPlanks(g){
  for (let k = 0; k < 4; k++) boxB(0.9, 0.03, 0.12, plankMat, (k % 2 - 0.5) * 0.04, k * 0.032, (k - 1.5) * 0.004, g, true, true);
  for (const s of [-1, 1]) boxB(0.03, 0.135, 0.13, M('#2b2c2d', 0.6), s * 0.3, -0.002, 0, g, false);
}
PRODUCTS.planks = { name: 'bundle of planks', price: 8, color: '#c49a6c', desc: 'Six planks to hold up the sides of deep holes.', build: buildPlanks, hold: [0.24, -0.46, -0.62, 0, 0.35, 0], heavy: true, verb: 'Shore up the wall', use: placeBoard };
SHOPS[0].items.push('planks');
function makePlanks(){ const it = makeProduct('planks'); it.st.n = 6; return it; }
{ // a woodpile beside the house
  const x = 8.7, z = 1.6, g = grp(x, z, PI / 2, scene, GY);
  for (const s of [-1, 1]) boxB(0.1, 0.1, 1.0, M('#6b4d34', 0.9), s * 0.45, 0, 0, g);
  const r = RNG(31);
  for (let row = 0; row < 5; row++) for (let k = 0; k < 6; k++) boxB(1.25, 0.032, 0.13, plankMat, (r() - 0.5) * 0.06, 0.1 + row * 0.034, -0.36 + k * 0.145, g, row === 4, true);
  boxB(1.4, 0.03, 1.1, M('#3f4a45', 0.7), 0, 0.42, 0, g, true, false);
  for (const s of [-1, 1]) for (const t of [-1, 1]) boxB(0.05, 0.4, 0.05, M('#6b4d34', 0.9), s * 0.65, 0.02, t * 0.5, g, false);
  hitProxy(g, 1.5, 0.6, 1.2, 0, 0.25, 0);
  tagAct(g, { kind: 'custom', label: () => held && held.name === 'bundle of planks' ? 'Top up your planks' : 'Take a bundle of planks', use: () => {
    if (held && held.name === 'bundle of planks'){ held.st.n = 6; toast('Your bundle is full: 6 planks'); sfx('place'); return; }
    const it = makePlanks(); it.g.position.set(x, GY + 0.45, z); pickUp(it); toast('You took a bundle of 6 planks. Aim at the side of a deep hole and press F.');
  } });
  blob(x, z, 1.5, 1.2, PI / 2, 0.35, GY + 0.004);
  foot(x, z, 1.45, 1.1, PI / 2);
}

lockTerrain();
