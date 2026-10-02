
// ================= HOUSE SHELL =================
const mapWalls = [], mapWins = [], wallCols = [];
function floorPlane(x0, x1, z0, z1, tex, rough = 0.5){
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const geo = new THREE.PlaneGeometry(w, d); geo.rotateX(-PI / 2);
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i) + cz, p.getX(i) + cx); // planks run along x
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: rough, color: C('#ffffff'), envMapIntensity: 0.9 });
  return mesh(geo, mat, cx, 0, cz, scene, false, true);
}
floorPlane(-6, 1, -5, 5, TX.oak, 0.48);
floorPlane(1, 7, -5, 0, TX.ash, 0.52);
floorPlane(1, 7, 0, 5, TX.ash, 0.52);

function wall(axis, c, s0, s1, ops = [], o = {}){
  const pl = o.plus || MAT.wall, mi = o.minus || MAT.wall;
  const mats = axis === 'x' ? [MAT.wall, MAT.wall, MAT.wall, MAT.wall, pl, mi] : [pl, mi, MAT.wall, MAT.wall, MAT.wall, MAT.wall];
  const pieces = []; let cur = s0;
  ops.slice().sort((a, b) => a.a - b.a).forEach(op => {
    if (op.a > cur) pieces.push({ a: cur, b: op.a, y0: 0, y1: H });
    if (op.y0 > 0) pieces.push({ a: op.a, b: op.b, y0: 0, y1: op.y0 });
    if (op.y1 < H) pieces.push({ a: op.a, b: op.b, y0: op.y1, y1: H });
    cur = op.b;
    if (op.y0 > 0) mapWins.push({ axis, c, a: op.a, b: op.b });
  });
  if (cur < s1) pieces.push({ a: cur, b: s1, y0: 0, y1: H });
  for (const p of pieces){
    const len = p.b - p.a, h = p.y1 - p.y0, mid = (p.a + p.b) / 2, yc = (p.y0 + p.y1) / 2;
    const geo = axis === 'x' ? new THREE.BoxGeometry(len, h, T) : new THREE.BoxGeometry(T, h, len);
    const px = axis === 'x' ? mid : c, pz = axis === 'x' ? c : mid;
    worldUV(geo, px, yc, pz, 1);
    blockMeshes.push(mesh(geo, mats, px, yc, pz));
    if (p.y0 < 1.5){
      const b = axis === 'x' ? [p.a, p.b, c - T / 2, c + T / 2] : [c - T / 2, c + T / 2, p.a, p.b];
      addCol(...b); wallCols.push(colliders[colliders.length - 1]);
    }
    if (p.y0 === 0 && p.y1 === H) mapWalls.push({ axis, c, a: p.a, b: p.b });
    if (p.y0 === 0){
      for (const s of (o.bb || [])){
        const off = c + s * (T / 2 + 0.007);
        if (axis === 'x') box(len, 0.09, 0.014, MAT.trim, mid, 0.045, off, scene, false, true);
        else box(0.014, 0.09, len, MAT.trim, off, 0.045, mid, scene, false, true);
      }
    }
  }
}
// local frame on a wall: x along wall, +z toward the chosen side
function wallFrame(axis, c, mid, side){
  const g = new THREE.Group();
  g.position.set(axis === 'x' ? mid : c, 0, axis === 'x' ? c : mid);
  g.rotation.y = axis === 'x' ? (side > 0 ? 0 : PI) : (side > 0 ? PI / 2 : -PI / 2);
  scene.add(g); return g;
}
function curtainGeo(w, h, folds = 7, amp = 0.035, seed = 1){
  const geo = new THREE.PlaneGeometry(w, h, 32, 10);
  const p = geo.attributes.position, r = RNG(seed), ph = r() * 6;
  for (let i = 0; i < p.count; i++){
    const x = p.getX(i), y = p.getY(i), u = x / w + 0.5, t = 0.5 - y / h; // t: 0 top -> 1 bottom
    const a = amp * (0.85 + t * 0.45);
    p.setZ(i, Math.sin(u * folds * TAU + ph) * a + Math.sin(u * folds * 2.3 * TAU + ph) * a * 0.18);
    p.setX(i, x * (1 + t * 0.06));
  }
  geo.computeVertexNormals(); return geo;
}
function windowUnit(axis, c, a, b, y0, y1, inS, o = {}){
  const w = b - a, h = y1 - y0, yc = (y0 + y1) / 2;
  const g = wallFrame(axis, c, (a + b) / 2, inS);
  const f = 0.05;
  box(w, f, 0.06, MAT.frame, 0, y1 - f / 2, 0, g);
  box(w, f, 0.06, MAT.frame, 0, y0 + f / 2, 0, g);
  box(f, h, 0.06, MAT.frame, -w / 2 + f / 2, yc, 0, g);
  box(f, h, 0.06, MAT.frame, w / 2 - f / 2, yc, 0, g);
  const nv = Math.max(0, Math.round(w / 0.8) - 1);
  for (let i = 0; i < nv; i++) box(0.032, h, 0.05, MAT.frame, -w / 2 + w * (i + 1) / (nv + 1), yc, 0, g);
  if (h > 1.3) box(w, 0.032, 0.05, MAT.frame, 0, y0 + h * 0.72, 0, g);
  const gl = mesh(new THREE.PlaneGeometry(w - 0.02, h - 0.02), o.glassMat || MAT.glass, 0, yc, -0.005, g, false, false);
  gl.renderOrder = 2;
  // sills
  box(w + 0.16, 0.035, T / 2 + 0.07, MAT.trim, 0, y0 + 0.0175, (T / 2 + 0.07) / 2, g, true, true);
  box(w + 0.1, 0.04, 0.12, MAT.exterior, 0, y0 - 0.02, -(T / 2 + 0.04), g, false, true);
  // casing
  box(w + 0.16, 0.07, 0.016, MAT.trim, 0, y1 + 0.035, T / 2 + 0.008, g, false, true);
  box(0.07, h, 0.016, MAT.trim, -w / 2 - 0.035, yc, T / 2 + 0.008, g, false, true);
  box(0.07, h, 0.016, MAT.trim, w / 2 + 0.035, yc, T / 2 + 0.008, g, false, true);
  if (o.curtain !== false){
    const ry = y1 + 0.17, rz = T / 2 + 0.12, span = w + 0.64;
    const rod = cyl(0.011, 0.011, span, MAT.black, 0, ry, rz, g, 10, false); rod.rotation.z = PI / 2;
    for (const s of [-1, 1]){
      sph(0.022, MAT.black, s * span / 2, ry, rz, g);
      box(0.02, 0.02, rz - T / 2, MAT.black, s * (span / 2 - 0.06), ry, T / 2 + (rz - T / 2) / 2, g, false);
    }
    const top = ry - 0.02, bottom = o.short ? y0 - 0.12 : 0.015, ch = top - bottom, pw = 0.5;
    const cm = o.curtainMat || MAT.linen;
    for (const s of [-1, 1]){
      const m = mesh(curtainGeo(pw, ch, 6, 0.035, (a * 13 + s * 7) | 0), cm, s * (w / 2 + 0.32 - pw / 2), bottom + ch / 2, rz - 0.02, g, true, true);
    }
  }
  return g;
}
function casing(axis, c, a, b, top, sides){
  const w = b - a;
  for (const s of sides){
    const g = wallFrame(axis, c, (a + b) / 2, s);
    box(w + 0.16, 0.07, 0.016, MAT.trim, 0, top + 0.035, T / 2 + 0.008, g, false, true);
    box(0.07, top, 0.016, MAT.trim, -w / 2 - 0.035, top / 2, T / 2 + 0.008, g, false, true);
    box(0.07, top, 0.016, MAT.trim, w / 2 + 0.035, top / 2, T / 2 + 0.008, g, false, true);
  }
}

// exterior + interior walls
wall('x', -5, -6.075, 7.075, [{ a: -4.6, b: -3.4, y0: 1.2, y1: 2.1 }], { plus: MAT.wall, minus: MAT.exterior, bb: [1] });
wall('x', 5, -6.075, 7.075, [
  { a: -4.6, b: -2.2, y0: 0.6, y1: 2.2 }, { a: -1.1, b: -0.1, y0: 0, y1: 2.1 },
  { a: 2.4, b: 3.8, y0: 0.95, y1: 2.1 }, { a: 5.0, b: 6.1, y0: 0.95, y1: 2.1 }
], { plus: MAT.exterior, minus: MAT.wall, bb: [-1] });
wall('z', -6, -4.925, 4.925, [{ a: -3.4, b: -1.4, y0: 0.9, y1: 2.1 }, { a: -0.9, b: 0.0, y0: 0, y1: 2.1 }], { plus: MAT.wall, minus: MAT.exterior, bb: [1] });
wall('z', 7, -4.925, 4.925, [{ a: -3.9, b: -2.5, y0: 0.9, y1: 2.1 }], { plus: MAT.exterior, minus: MAT.wall, bb: [-1] });
wall('z', 1, -4.925, 4.925, [{ a: -1.3, b: -0.3, y0: 0, y1: 2.1 }, { a: 0.3, b: 1.3, y0: 0, y1: 2.1 }], { bb: [1, -1] });
wall('x', 0, 1.075, 6.925, [], { bb: [1, -1] });

windowUnit('x', -5, -4.6, -3.4, 1.2, 2.1, 1, { curtain: false });
windowUnit('x', 5, -4.6, -2.2, 0.6, 2.2, -1);
windowUnit('x', 5, 2.4, 3.8, 0.95, 2.1, -1, { short: true, curtainMat: new THREE.MeshStandardMaterial({ color: C('#dfe5e6'), roughness: 1, map: TX.linen, side: THREE.DoubleSide }) });
windowUnit('x', 5, 5.0, 6.1, 0.95, 2.1, -1, { short: true, curtainMat: new THREE.MeshStandardMaterial({ color: C('#dfe5e6'), roughness: 1, map: TX.linen, side: THREE.DoubleSide }) });
windowUnit('z', -6, -3.4, -1.4, 0.9, 2.1, 1);
windowUnit('z', 7, -3.9, -2.5, 0.9, 2.1, -1, { curtainMat: new THREE.MeshStandardMaterial({ color: C('#e7e0d3'), roughness: 1, map: TX.linen, side: THREE.DoubleSide }) });

casing('x', 5, -1.1, -0.1, 2.1, [-1]);
casing('z', 1, -1.3, -0.3, 2.1, [1, -1]);
casing('z', 1, 0.3, 1.3, 2.1, [1, -1]);

// ---- doors you can open and close ----
const DOORS = {}, doorCols = [];
function houseDoor(name, label, px, pz, closedRy, openRy, w, t, mat, startOpen, colC, colO, dress){
  const p = new THREE.Group(); p.position.set(px, 0, pz); scene.add(p);
  boxB(w, 2.07, t, mat, w / 2, 0.01, 0, p);
  if (dress) dress(p, w, t);
  for (const s of [-1, 1]){
    boxB(0.12, 0.018, 0.02, MAT.brass, w - 0.13, 0.99, s * (t / 2 + 0.022), p, false);
    const r = cyl(0.024, 0.024, 0.012, MAT.brass, w - 0.08, 1.0, s * (t / 2 + 0.006), p, 14, false); r.rotation.x = PI / 2;
  }
  addCol(...colC); const cC = colliders[colliders.length - 1];
  addCol(...colO); const cO = colliders[colliders.length - 1];
  doorCols.push(cC);
  const rec = animated({ kind: 'door', name: label, open: startOpen, dur: 0.85, pivot: p, w,
    apply: k => { p.rotation.y = lerp(closedRy, openRy, k); cC.off = k > 0.45; cO.off = k < 0.9; } }, p);
  rec.apply(rec.t);
  tagAct(p, rec); DOORS[name] = rec; return rec;
}
{
  const doorMat = M('#2f4a48', 0.45), inset = M('#2a4341', 0.5);
  houseDoor('front', 'front door', -0.12, 4.95, PI, PI / 2 + 0.12, 0.98, 0.05, doorMat, false,
    [-1.1, -0.1, 4.925, 5.075], [-0.28, -0.06, 3.95, 4.95], (p, w, t) => {
      for (const s of [-1, 1]) for (const [y, hh] of [[0.18, 0.78], [1.12, 0.78]]) for (const x of [0.27, 0.71]){
        boxB(0.34, hh, 0.012, inset, x, y, s * (t / 2 + 0.004), p, false);
        boxB(0.3, hh - 0.04, 0.008, doorMat, x, y + 0.02, s * (t / 2 + 0.011), p, false);
      }
      const db = cyl(0.02, 0.02, 0.012, MAT.brass, w - 0.08, 1.2, -(t / 2 + 0.006), p, 14, false); db.rotation.x = PI / 2;
    });
  boxB(1.0, 0.012, T + 0.04, MAT.oak, -0.6, 0, 5, scene, false);
  houseDoor('bed1', 'bedroom door', 1.055, -0.312, PI / 2, 0, 0.98, 0.04, MAT.white, true, [0.925, 1.075, -1.3, -0.3], [1.04, 2.02, -0.37, -0.29]);
  houseDoor('bed2', 'bedroom door', 1.055, 0.312, -PI / 2, 0, 0.98, 0.04, MAT.white, true, [0.925, 1.075, 0.3, 1.3], [1.04, 2.02, 0.29, 0.37]);
  DOORS.bed1.zone = [0.2, 2.1, -1.45, -0.15]; DOORS.bed2.zone = [0.2, 2.1, 0.15, 1.45];
}
for (const z of [-0.8, 0.8]) boxB(T + 0.03, 0.008, 1.0, MAT.oak, 1, 0, z, scene, false);

// ceiling slab
mesh(new THREE.BoxGeometry(13.3, 0.2, 10.3), MAT.ceiling, 0.5, H + 0.1, 0);
// crown shadow line (thin darker strip) for depth
const cornice = M('#e9e6df', 0.9);
for (const [x0, x1, z0, z1] of [[-5.925, 0.925, -4.925, 4.925], [1.075, 6.925, -4.925, -0.075], [1.075, 6.925, 0.075, 4.925]]){
  box(x1 - x0, 0.05, 0.03, cornice, (x0 + x1) / 2, H - 0.025, z0 + 0.015, scene, false, true);
  box(x1 - x0, 0.05, 0.03, cornice, (x0 + x1) / 2, H - 0.025, z1 - 0.015, scene, false, true);
  box(0.03, 0.05, z1 - z0, cornice, x0 + 0.015, H - 0.025, (z0 + z1) / 2, scene, false, true);
  box(0.03, 0.05, z1 - z0, cornice, x1 - 0.015, H - 0.025, (z0 + z1) / 2, scene, false, true);
}

// accent walls
{
  const sage = new THREE.MeshStandardMaterial({ color: C('#8f9e89'), roughness: 0.95, map: TX.plaster });
  const g1 = new THREE.BoxGeometry(5.85, H - 0.05, 0.004); worldUV(g1, 4, H / 2, -4.921, 1.2);
  mesh(g1, sage, 4.0, (H - 0.05) / 2, -4.921, scene, false, true);
  const blue = new THREE.MeshStandardMaterial({ color: C('#8a9fae'), roughness: 0.95, map: TX.plaster });
  const g2 = new THREE.BoxGeometry(0.004, H - 0.05, 4.85); worldUV(g2, 6.921, H / 2, 2.5, 1.2);
  mesh(g2, blue, 6.921, (H - 0.05) / 2, 2.5, scene, false, true);
}
// light switches (each one controls its room's lights)
for (const [x, z, ry, room] of [[0.92, -1.48, -PI / 2, 'kitchen'], [1.08, -1.48, PI / 2, 'bed1'], [1.08, 1.48, PI / 2, 'bed2'], [-1.3, 4.92, PI, 'living'], [-5.918, 0.27, PI / 2, 'bath']]){
  const g = grp(x, z, ry); boxB(0.08, 0.12, 0.01, MAT.white, 0, 1.1, 0, g, false);
  const rk = new THREE.Group(); rk.position.set(0, 1.16, 0.01); g.add(rk); movers.push(rk);
  boxB(0.024, 0.042, 0.01, M('#e6e3dc', 0.5), 0, -0.021, 0, rk, false);
  hitProxy(g, 0.22, 0.26, 0.08, 0, 1.16, 0.03);
  const rec = { kind: 'switch', room, rocker: rk }; switchRecs.push(rec); tagAct(g, rec);
}
