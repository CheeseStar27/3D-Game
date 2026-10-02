
// ================= INTERACTION KIT =================
const movers = [], actMeshes = [], blockMeshes = [], anims = [], switchRecs = [];
function tagAct(obj, rec){ obj.traverse(o => { if (o.isMesh){ o.userData.act = rec; actMeshes.push(o); } }); return rec; }
function animated(rec, obj){ rec.t = rec.open ? 1 : 0; anims.push(rec); if (obj) movers.push(obj); return rec; }
function hitProxy(parent, w, h, d, x, y, z){ const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), MAT.white); m.position.set(x, y, z); m.visible = false; parent.add(m); return m; }
const INNER = new THREE.MeshStandardMaterial({ color: C('#ece8e0'), roughness: 0.75 });
const CAVITY = new THREE.MeshStandardMaterial({ color: C('#2a2521'), roughness: 1 });

// merged vertex-coloured props (cheap to draw)
function vcMesh(parts, parent = scene){ if (!parts.length) return null; return mesh(merge(parts), MAT.vc, 0, 0, 0, parent, false, true); }
function bx(w, h, d, x, y, z, col, ry = 0){ const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y + h / 2, z); return tint(g, col); }
function cy(r, h, x, y, z, col, r2 = null, seg = 14){ const g = new THREE.CylinderGeometry(r2 == null ? r : r2, r, h, seg); g.translate(x, y + h / 2, z); return tint(g, col); }
function sp(r, x, y, z, col, sx = 1, sy = 1, sz = 1){ const g = new THREE.SphereGeometry(r, 12, 8); g.scale(sx, sy, sz); g.translate(x, y, z); return tint(g, col); }
const CLOTH = ['#d9d2c4', '#8a9c83', '#44546a', '#b86a4b', '#e9e4da', '#6d6a64', '#c9a27a', '#9fb3c8', '#3f3a36'];
function fillClothes(g, iw, th, depth, seed = 1){
  const r = RNG(seed), p = [], n = iw > 0.4 ? 2 : 1, sw = iw / n - 0.03;
  for (let s = 0; s < n; s++){ let y = 0.03; for (let k = 0; k < 3 && y < th - 0.02; k++){ const h = 0.03 + r() * 0.015; p.push(bx(sw, h, depth * 0.8, -iw / 2 + (s + 0.5) * iw / n, y, -depth / 2, CLOTH[(r() * CLOTH.length) | 0], (r() - 0.5) * 0.06)); y += h; } }
  vcMesh(p, g);
}
function fillCutlery(g, iw, th, depth){
  const p = [bx(iw - 0.02, 0.012, depth - 0.04, 0, 0.03, -depth / 2, '#c9a27a')];
  const cols = 4, cw = (iw - 0.04) / cols;
  for (let c = 1; c < cols; c++) p.push(bx(0.008, 0.04, depth - 0.06, -iw / 2 + 0.02 + c * cw, 0.042, -depth / 2, '#b58b5e'));
  for (let c = 0; c < cols; c++) for (let k = 0; k < 4; k++){ const x = -iw / 2 + 0.02 + (c + 0.5) * cw + (k - 1.5) * 0.018; p.push(bx(0.012, 0.004, depth * 0.55, x, 0.043 + k * 0.002, -depth / 2, '#c7cbcd')); p.push(bx(0.02, 0.006, 0.05, x, 0.043, -depth / 2 + depth * 0.28, '#c7cbcd')); }
  vcMesh(p, g);
}
function fillUtensils(g, iw, th, depth){
  const p = [], r = RNG(7);
  for (let i = 0; i < 6; i++){ const x = -iw / 2 + 0.06 + i * (iw - 0.12) / 5; p.push(bx(0.022, 0.012, depth * 0.62, x, 0.032, -depth / 2 + 0.03, i % 2 ? '#b58b5e' : '#2b2c2d', (r() - 0.5) * 0.15)); p.push(sp(0.03, x, 0.04, -depth / 2 - depth * 0.3, i % 2 ? '#b58b5e' : '#2b2c2d', 1, 0.35, 1.3)); }
  vcMesh(p, g);
}
function fillTowels(g, iw, th, depth){ const p = []; for (let i = 0; i < 3; i++){ p.push(bx(iw * 0.28, 0.05, depth * 0.7, -iw / 2 + (i + 0.5) * iw / 3, 0.03, -depth / 2, ['#e9e4da', '#b86a4b', '#8a9c83'][i])); p.push(bx(iw * 0.28, 0.006, depth * 0.7, -iw / 2 + (i + 0.5) * iw / 3, 0.081, -depth / 2, i === 0 ? '#44546a' : '#e9e4da')); } vcMesh(p, g); }
function fillBedside(g, iw, th, depth){ vcMesh([bx(0.14, 0.025, 0.2, -0.08, 0.03, -depth / 2, '#44546a', 0.2), bx(0.12, 0.02, 0.17, -0.07, 0.055, -depth / 2, '#d8c7a4', 0.1), bx(0.13, 0.03, 0.06, 0.1, 0.03, -depth / 2 + 0.03, '#2b2c2d', -0.3), cy(0.008, 0.13, 0.12, 0.03, -depth / 2 - 0.08, '#b58b4a')], g); }
function fillFreezer(g, iw, th, depth){ const p = [], r = RNG(3); for (let i = 0; i < 6; i++) p.push(bx(0.14 + r() * 0.06, 0.05 + r() * 0.05, 0.18, -iw / 2 + 0.1 + (i % 3) * iw / 3.2, 0.03 + (i > 2 ? 0.1 : 0), -depth / 2 + (r() - 0.5) * 0.1, ['#d9e4ea', '#9fb3c8', '#e3b25a', '#c7cbcd', '#b86a4b', '#8a9c83'][i])); vcMesh(p, g); }

// a drawer that slides out of a carcass whose front face is at local z = zf
function drawer(parent, x, y0, zf, w, h, depth, frontMat, o = {}){
  if (o.cavity !== false) mesh(new THREE.PlaneGeometry(w - 0.03, h - 0.03), CAVITY, x, y0 + h / 2, zf + 0.001, parent, false, false);
  const g = new THREE.Group(); g.position.set(x, y0, zf); parent.add(g);
  rboxB(w - 0.008, h - 0.006, 0.02, 0.004, frontMat, 0, 0.003, 0.01, g, false, 2);
  const th = Math.min(h * 0.7, 0.16), iw = w - 0.06;
  boxB(iw, 0.01, depth, INNER, 0, 0.02, -depth / 2, g, false);
  for (const s of [-1, 1]) boxB(0.012, th, depth, INNER, s * (iw / 2 - 0.006), 0.02, -depth / 2, g, false);
  boxB(iw, th, 0.012, INNER, 0, 0.02, -depth + 0.006, g, false);
  if (o.pull === 'knob') sph(0.014, MAT.brass, 0, h * 0.5, 0.028, g);
  else boxB(o.pullW || 0.14, 0.012, 0.014, o.pullMat || MAT.brass, 0, o.pullY != null ? o.pullY : h * 0.5, 0.027, g, false);
  if (o.fill) o.fill(g, iw, th, depth);
  const rec = animated({ kind: 'drawer', name: o.name || 'drawer', open: false, dur: 0.32, apply: k => { g.position.z = zf + k * depth * 0.72; } }, g);
  tagAct(g, rec); return rec;
}
// a hinged cabinet door; hinge = -1 hinges on its left edge, +1 on its right edge
function hingedDoor(parent, xh, y0, zf, w, h, mat, hinge, o = {}){
  const t = o.thick || 0.02, p = new THREE.Group(); p.position.set(xh, y0, zf + t / 2); parent.add(p);
  rboxB(w - 0.006, h - 0.006, t, 0.004, mat, -hinge * w / 2, 0.003, 0, p, false, 2);
  if (o.handle) o.handle(p, -hinge * (w - (o.handleInset || 0.06)), h, t);
  const ang = o.angle || 1.75;
  const rec = animated({ kind: 'cabinet', name: o.name || 'cabinet', open: false, dur: o.dur || 0.45, apply: k => { p.rotation.y = hinge * ang * k; if (o.onK) o.onK(k); } }, p);
  tagAct(p, rec); rec.pivot = p; return rec;
}
const vHandle = (len = 0.13, mat = MAT.brass, yf = 0.62) => (p, x, h, t) => boxB(0.012, len, 0.016, mat, x, h * yf - len / 2, t / 2 + 0.008, p, false);
// hollow, open-fronted carcass (local +z is the front)
function shell(parent, cx, y0, zb, w, h, d, outMat, o = {}){
  const t = 0.018, zc = zb + d / 2;
  boxB(w, h, t, INNER, cx, y0, zb + t / 2, parent, false);
  boxB(w, t, d, INNER, cx, y0, zc, parent, false);
  if (o.top !== false) boxB(w, t, d, o.topMat || outMat, cx, y0 + h - t, zc, parent, false);
  for (const s of [-1, 1]) boxB(t, h, d, outMat, cx + s * (w / 2 - t / 2), y0, zc, parent, true);
  (o.shelves || []).forEach(y => boxB(w - 2 * t, 0.016, d - 0.03, INNER, cx, y, zc - 0.012, parent, false));
  (o.dividers || []).forEach(x => boxB(t, h - 2 * t, d - 0.012, INNER, x, y0 + t, zc - 0.006, parent, false));
}

// ---- light units: each lamp / ceiling light can be switched on and off ----
const UNITS = []; let curUnit = null;
function lightUnit(name){ const u = { name, on: false, k: 0, lights: [], glows: [] }; UNITS.push(u); return u; }
const U = {};
['rattan', 'floor', 'mushroom', 'kitchen', 'dining', 'bed1c', 'bed1L', 'bed1R', 'lantern', 'bed2L', 'bed2R', 'desk', 'bathC', 'bathM'].forEach(n => U[n] = lightUnit(n));
const ROOM_UNITS = { living: [U.rattan, U.floor, U.mushroom], kitchen: [U.kitchen, U.dining], bed1: [U.bed1c, U.bed1L, U.bed1R], bed2: [U.lantern, U.bed2L, U.bed2R, U.desk], bath: [U.bathC, U.bathM] };
function applyUnit(u){ for (const L of u.lights) L.l.intensity = L.night * u.k; for (const g of u.glows) g.mat.emissiveIntensity = lerp(g.day, g.night, u.k); }
function updateUnits(dt){
  for (const u of UNITS){ const tg = u.on ? 1 : 0; if (u.k !== tg){ u.k = REDUCED ? tg : (tg > u.k ? Math.min(1, u.k + dt / 0.22) : Math.max(0, u.k - dt / 0.22)); applyUnit(u); } }
}
function updateAnims(dt){
  for (const r of anims){ const tg = r.open ? 1 : 0; if (r.t !== tg){ r.t = REDUCED ? tg : (tg > r.t ? Math.min(1, r.t + dt / r.dur) : Math.max(0, r.t - dt / r.dur)); r.apply(smooth(r.t)); } }
  for (const s of switchRecs){ const on = ROOM_UNITS[s.room].some(u => u.on); s.rocker.rotation.x += ((on ? -0.28 : 0.28) - s.rocker.rotation.x) * 0.35; }
}

// seats: local [x, eyeY, z, pitch] in the furniture's own frame, facing its local +z
function seatRec(g, locals, label = 'Sit down'){
  g.updateMatrixWorld(true);
  const rec = { kind: 'seat', label, seats: [] };
  rec.seats = locals.map(([x, y, z, pitch = -0.12]) => { const v = g.localToWorld(new THREE.Vector3(x, y, z)); return { x: v.x, y: v.y, z: v.z, yaw: g.rotation.y + PI, pitch, rec }; });
  tagAct(g, rec); return rec;
}
