
// ================= FURNITURE KIT =================
const glows = [];   // {mat, day, night}
function glowMat(hex, day, night, base = null){
  const m = base || new THREE.MeshStandardMaterial({ color: C(hex), roughness: 0.9 });
  m.emissive = C(hex); m.emissiveIntensity = day; (curUnit ? curUnit.glows : glows).push({ mat: m, day, night }); return m;
}
function leafGeo(len, wid, fold = 0.25, bend = 0.15, seg = 6){
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(wid, len * 0.42, 0, len); s.quadraticCurveTo(-wid, len * 0.42, 0, 0);
  const g = new THREE.ShapeGeometry(s, seg), p = g.attributes.position;
  for (let i = 0; i < p.count; i++){ const x = p.getX(i), y = p.getY(i), t = y / len; p.setZ(i, Math.abs(x) * fold + t * t * len * bend); }
  g.computeVertexNormals(); return g;
}
function orientLeaf(g, yaw, elev, x, y, z){ g.rotateX(-PI / 2 + elev); g.rotateY(yaw); g.translate(x, y, z); return g; }
const GREENS = ['#3f6b3a', '#4d7c43', '#5b8a4a', '#35603a', '#6a9352'];
function potMesh(x, z, r, h, mat, parent = scene, y = 0){
  const pts = [[0, 0], [r * 0.78, 0], [r * 0.82, 0.01], [r, h * 0.96], [r * 1.03, h], [r * 0.93, h], [r * 0.9, h * 0.92], [0, h * 0.92]];
  const m = mesh(latheGeo(pts, 28), mat, x, y, z, parent);
  return m;
}
function plantFiddle(x, z, s = 1, potMat = MAT.ceramic){
  potMesh(x, z, 0.19 * s, 0.34 * s, potMat);
  cyl(0.17 * s, 0.17 * s, 0.01, MAT.soil, x, 0.31 * s, z, scene, 16, false);
  const r = RNG((x * 100 + z * 10) | 0), parts = [];
  const trunk = new THREE.CylinderGeometry(0.012, 0.018, 1.25 * s, 6); trunk.translate(x, 0.3 * s + 0.62 * s, z); parts.push(tint(trunk, '#6b5138'));
  for (let i = 0; i < 30; i++){
    const t = i / 30, y = (0.6 + t * 0.95) * s, yaw = i * 2.39996 + r() * 0.3;
    const g = leafGeo((0.2 + r() * 0.1) * s, (0.11 + r() * 0.03) * s, 0.2, 0.18);
    orientLeaf(g, yaw, 0.15 + r() * 0.55, x + Math.sin(yaw) * -0.02, y, z + Math.cos(yaw) * -0.02);
    parts.push(tint(g, GREENS[(r() * GREENS.length) | 0]));
  }
  const m = mesh(merge(parts), MAT.leaf, 0, 0, 0); m.castShadow = true;
  blob(x, z, 0.4 * s, 0.4 * s, 0, 0.38, 0.004, true);
  foot(x, z, 0.38 * s, 0.38 * s, 0, true, 'plant');
}
function plantSnake(x, z, s = 1, potMat = M('#2f3431', 0.6)){
  potMesh(x, z, 0.14 * s, 0.3 * s, potMat);
  cyl(0.125 * s, 0.125 * s, 0.01, MAT.soil, x, 0.275 * s, z, scene, 16, false);
  const r = RNG((x * 77 + z * 13) | 0), parts = [];
  for (let i = 0; i < 16; i++){
    const yaw = r() * TAU, g = leafGeo((0.45 + r() * 0.4) * s, 0.035 * s, 0.35, -0.02, 4);
    orientLeaf(g, yaw, 1.25 + r() * 0.28, x + Math.sin(yaw) * 0.05 * r(), 0.27 * s, z + Math.cos(yaw) * 0.05 * r());
    parts.push(tint(g, r() < 0.5 ? '#3a5f37' : '#58773c'));
  }
  mesh(merge(parts), MAT.leaf, 0, 0, 0);
  blob(x, z, 0.3 * s, 0.3 * s, 0, 0.38, 0.004, true);
  foot(x, z, 0.3 * s, 0.3 * s, 0, true, 'plant');
}
function plantBush(x, y, z, s = 1, parent = scene, trail = false){
  const r = RNG((x * 53 + z * 31 + y * 7) | 0), parts = [];
  for (let i = 0; i < 26; i++){
    const yaw = r() * TAU, el = trail ? -0.9 + r() * 1.4 : 0.1 + r() * 0.8;
    const g = leafGeo((0.07 + r() * 0.04) * s, 0.05 * s, 0.15, 0.1, 4);
    const d = (trail ? 0.04 + r() * 0.12 : r() * 0.05) * s;
    orientLeaf(g, yaw, el, Math.sin(yaw) * -d, (trail ? -r() * 0.12 : r() * 0.05) * s, Math.cos(yaw) * -d);
    parts.push(tint(g, GREENS[(r() * GREENS.length) | 0]));
  }
  const m = mesh(merge(parts), MAT.leaf, x, y, z, parent); m.castShadow = false; return m;
}
function vase(x, y, z, h, mat, parent = scene, shape = 0){
  const r = h * 0.35;
  const pts = shape === 0 ? [[0, 0], [r * 0.7, 0], [r, h * 0.35], [r * 0.9, h * 0.7], [r * 0.45, h * 0.88], [r * 0.5, h], [r * 0.42, h], [r * 0.38, h * 0.9]]
    : [[0, 0], [r * 0.9, 0], [r * 0.95, h * 0.9], [r, h], [r * 0.9, h], [r * 0.86, h * 0.95]];
  return mesh(latheGeo(pts, 24), mat, x, y, z, parent, false, true);
}
function stems(x, y, z, h, n, parent = scene, col = '#7e8f6f', seed = 1){
  const r = RNG(seed), parts = [];
  for (let i = 0; i < n; i++){
    const yaw = r() * TAU, lean = 0.1 + r() * 0.35, len = h * (0.7 + r() * 0.4);
    const st = new THREE.CylinderGeometry(0.002, 0.003, len, 4); st.translate(0, len / 2, 0); st.rotateZ(lean); st.rotateY(yaw);
    parts.push(tint(st, '#6d6a4f'));
    for (let k = 0; k < 7; k++){
      const t = 0.35 + k * 0.1, lp = new THREE.Vector3(0, len * t, 0).applyEuler(new THREE.Euler(0, 0, lean)).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const lg = leafGeo(0.035, 0.025, 0.1, 0, 3); orientLeaf(lg, r() * TAU, r() * 0.8, lp.x, lp.y, lp.z);
      parts.push(tint(lg, col));
    }
  }
  return mesh(merge(parts), MAT.leaf, x, y, z, parent, false, false);
}
const BOOK_COLS = ['#2f3e4f', '#8c3f2f', '#d8c7a4', '#5d6f57', '#b58b4a', '#e8e1d2', '#3f3a36', '#9a6b5a', '#6c7f8c', '#c9a27a', '#44544a', '#a8452f'];
function booksGeo(x0, x1, y, zc, seed, lean = true){
  const r = RNG(seed), parts = []; let x = x0;
  while (x < x1 - 0.03){
    const w = 0.018 + r() * 0.03, h = 0.17 + r() * 0.1, d = 0.13 + r() * 0.05;
    if (x + w > x1) break;
    const g = new THREE.BoxGeometry(w, h, d); g.translate(x + w / 2, y + h / 2, zc + (0.16 - d) / 2 - 0.02);
    parts.push(tint(g, BOOK_COLS[(r() * BOOK_COLS.length) | 0])); x += w + 0.002;
    if (r() < 0.07) x += 0.04;
  }
  if (lean && x < x1 - 0.1){
    const w = 0.03, h = 0.22, g = new THREE.BoxGeometry(w, h, 0.15);
    g.translate(0, h / 2, 0); g.rotateZ(-0.35); g.translate(x + 0.01, y, zc);
    parts.push(tint(g, BOOK_COLS[(r() * BOOK_COLS.length) | 0]));
  }
  return merge(parts);
}
function bookStack(x, y, z, n, parent = scene, seed = 3, ry = 0){
  const r = RNG(seed), parts = []; let yy = 0;
  for (let i = 0; i < n; i++){
    const w = 0.2 + r() * 0.06, d = 0.14 + r() * 0.04, h = 0.025 + r() * 0.02;
    const g = new THREE.BoxGeometry(w, h, d); g.rotateY((r() - 0.5) * 0.2); g.translate(0, yy + h / 2, 0); yy += h;
    parts.push(tint(g, BOOK_COLS[(r() * BOOK_COLS.length) | 0]));
  }
  const m = mesh(merge(parts), MAT.vc, x, y, z, parent, true, true); m.rotation.y = ry; return yy;
}
function artFrame(tex, w, h, x, y, z, ry, frameMat = MAT.black, matBorder = 0.05){
  const g = grp(x, z, ry, scene, y);
  box(w + 0.04, h + 0.04, 0.03, frameMat, 0, 0, 0, g, false, true);
  mesh(new THREE.PlaneGeometry(w, h), M('#f6f4ef', 0.9), 0, 0, 0.0155, g, false, true);
  mesh(new THREE.PlaneGeometry(w - matBorder * 2, h - matBorder * 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }), 0, 0, 0.016, g, false, true);
  return g;
}
function rug(x, z, w, d, tex, ry = 0, h = 0.012){
  const m = boxB(w, h, d, new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }), x, 0, z, scene, false, true);
  m.rotation.y = ry; planItems.push({ cx: x, cz: z, w, d, ry, kind: 'rug' }); return m;
}
function lampShade(r0, r1, h, x, y, z, parent, hex = '#efe6d6', day = 0.0, night = 1.1){
  const mat = glowMat(hex, day, night, new THREE.MeshStandardMaterial({ color: C(hex), roughness: 1, map: TX.linen, side: THREE.DoubleSide }));
  const m = mesh(new THREE.CylinderGeometry(r0, r1, h, 32, 1, true), mat, x, y, z, parent, true, false);
  return m;
}

// ================= LIVING ROOM =================
rug(-3.8, 2.55, 2.8, 3.2, kilimTex());

function sofa(x, z, ry, len, col){
  const g = grp(x, z, ry), fab = fabric(col), D = 0.95;
  rboxB(len, 0.2, D, 0.035, fab, 0, 0.1, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.02, 0.014, 0.1, MAT.walnut, sx * (len / 2 - 0.1), 0.05, sz * (D / 2 - 0.1), g, 10);
  for (const s of [-1, 1]) rboxB(0.2, 0.38, D, 0.07, fab, s * (len / 2 - 0.1), 0.24, 0, g);
  rboxB(len - 0.04, 0.5, 0.24, 0.09, fab, 0, 0.26, -D / 2 + 0.12, g);
  const inner = len - 0.4, n = 2, cw = inner / n;
  for (let i = 0; i < n; i++){
    const cx = -inner / 2 + cw * (i + 0.5);
    rboxB(cw - 0.012, 0.17, D - 0.27, 0.07, fab, cx, 0.29, 0.1, g);
    const b = rboxB(cw - 0.02, 0.46, 0.2, 0.09, fab, cx, 0.44, -D / 2 + 0.31, g); b.rotation.x = -0.14;
  }
  const pl = [['#8a9c83', -1, 0.12], ['#b0603c', 1, -0.1], ['#e9e1d0', 0.62, 0.05]];
  for (const [c, s, rz] of pl){
    const p = rbox(0.44, 0.44, 0.13, 0.07, fabric(c, TX.linen), s * (inner / 2 - 0.26), 0.7, -D / 2 + 0.44, g, true, 3);
    p.rotation.set(-0.28, 0, rz); p.scale.set(1, 1, 1);
  }
  const knit = fabric('#c89a4a', TX.knit);
  rboxB(0.26, 0.03, 0.62, 0.012, knit, len / 2 - 0.1, 0.615, 0.05, g);
  rboxB(0.03, 0.32, 0.62, 0.012, knit, len / 2 + 0.008, 0.31, 0.05, g);
  blob(x, z, len, D, ry, 0.45);
  foot(x, z, len, D, ry);
  seatRec(g, [[-0.475, 1.1, 0.14], [0.475, 1.1, 0.14]], 'Sit on the sofa');
  return g;
}
sofa(-2.2, 2.55, -PI / 2, 2.3, '#d9d0c1');

function armchair(x, z, ry, col){
  const g = grp(x, z, ry), fab = fabric(col, TX.fabric, 0.72);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){
    const l = cyl(0.018, 0.012, 0.18, MAT.oak, sx * 0.3, 0.085, sz * 0.28, g, 10); l.rotation.set(sz * 0.12, 0, -sx * 0.12);
  }
  rboxB(0.8, 0.2, 0.76, 0.06, fab, 0, 0.16, 0, g);
  rboxB(0.6, 0.12, 0.62, 0.055, fab, 0, 0.33, 0.06, g);
  const b = rbox(0.8, 0.52, 0.17, 0.08, fab, 0, 0.64, -0.3, g); b.rotation.x = -0.16;
  for (const s of [-1, 1]) rboxB(0.12, 0.26, 0.7, 0.055, fab, s * 0.34, 0.33, 0.01, g);
  const p = rbox(0.36, 0.3, 0.11, 0.05, fabric('#e9e1d0', TX.linen), 0.05, 0.6, -0.16, g); p.rotation.set(-0.3, 0, 0.12);
  blob(x, z, 0.8, 0.78, ry, 0.42);
  foot(x, z, 0.82, 0.8, ry);
  seatRec(g, [[0, 1.1, 0.08]], 'Sit in the armchair');
}
armchair(-4.95, 4.05, 2.5, '#9e5634');

// coffee table (oval pedestal)
{
  const g = grp(-3.9, 2.55, PI / 2);
  const top = cyl(0.5, 0.5, 0.04, MAT.oak, 0, 0.38, 0, g, 48); top.scale.set(1.1, 1, 0.62);
  const base = cyl(0.5, 0.5, 0.36, MAT.oak, 0, 0.18, 0, g, 40); base.scale.set(0.72, 1, 0.3);
  rboxB(0.42, 0.018, 0.26, 0.008, MAT.black, 0.2, 0.4, 0, g);
  vase(0.28, 0.418, -0.03, 0.14, M('#d9cbb4', 0.5), g, 0);
  stems(-3.9 + 0.03, 0.55, 2.55 - 0.28, 0.22, 5, scene, '#86977a', 5);
  cyl(0.03, 0.03, 0.07, M('#f1ece2', 0.7), 0.1, 0.453, 0.04, g, 16);
  bookStack(-0.25, 0.4, 0, 3, g, 7, 0.2);
  blob(-3.9, 2.55, 1.0, 0.55, PI / 2, 0.4, 0.016, true);
  foot(-3.9, 2.55, 1.1, 0.62, PI / 2);
}
// slat wall + TV + media console
{
  const g = grp(-5.925, 2.55, PI / 2);
  box(3.3, H - 0.02, 0.012, M('#2a2522', 0.9), 0, H / 2, 0.006, g, false, true);
  const slats = [];
  for (let x = -1.635; x <= 1.636; x += 0.055){ const s = new THREE.BoxGeometry(0.032, H - 0.03, 0.022); s.translate(x, H / 2, 0.023); slats.push(s); }
  mesh(merge(slats), MAT.oak, 0, 0, 0, g, false, true);
  planItems.push({ cx: -5.9, cz: 2.55, w: 3.3, d: 0.05, ry: PI / 2, kind: 'slat' });
}
const tvCanvas = makeCanvas(384, 216), tvCtx = tvCanvas.getContext('2d');
const tvTex = new THREE.CanvasTexture(tvCanvas); tvTex.encoding = THREE.sRGBEncoding;
const fishes = Array.from({ length: 6 }, (_, i) => ({ x: Math.random() * 384, y: 40 + Math.random() * 130, v: (12 + Math.random() * 18) * (i % 2 ? 1 : -1), c: ['#f28c3a', '#f4d35e', '#5bc0eb', '#ef6f6c', '#f7a072', '#9bc53d'][i], s: 0.7 + Math.random() * 0.6 }));
function drawAquarium(t){
  const g = tvCtx, W = 384, Hh = 216;
  const grd = g.createLinearGradient(0, 0, 0, Hh); grd.addColorStop(0, '#2b8bb0'); grd.addColorStop(1, '#0d3b58');
  g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 5; i++){ g.beginPath(); g.moveTo(60 + i * 70 + Math.sin(t + i) * 10, 0); g.lineTo(90 + i * 70, 0); g.lineTo(40 + i * 80, Hh); g.lineTo(20 + i * 80, Hh); g.fill(); }
  g.fillStyle = '#d9c28e'; g.beginPath(); g.moveTo(0, Hh); for (let x = 0; x <= W; x += 16) g.lineTo(x, Hh - 22 - Math.sin(x * 0.03) * 6); g.lineTo(W, Hh); g.fill();
  g.strokeStyle = '#3f8f55'; g.lineWidth = 5; g.lineCap = 'round';
  for (let i = 0; i < 7; i++){ const bx = 30 + i * 55; g.beginPath(); g.moveTo(bx, Hh - 20); g.quadraticCurveTo(bx + Math.sin(t * 1.3 + i) * 14, Hh - 60, bx + Math.sin(t + i) * 8, Hh - 90 - (i % 3) * 18); g.stroke(); }
  for (const f of fishes){
    f.x += f.v * 0.1; if (f.x > W + 30) f.x = -30; if (f.x < -30) f.x = W + 30;
    const y = f.y + Math.sin(t * 2 + f.c.length + f.x * 0.02) * 6, d = Math.sign(f.v);
    g.save(); g.translate(f.x, y); g.scale(d * f.s, f.s);
    g.fillStyle = f.c; g.beginPath(); g.ellipse(0, 0, 16, 9, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-12, 0); g.lineTo(-26, -9); g.lineTo(-26, 9); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(8, -2, 3, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(9, -2, 1.5, 0, TAU); g.fill();
    g.restore();
  }
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 8; i++){ const bx = (i * 47 + 20) % W, by = Hh - ((t * 30 + i * 37) % Hh); g.beginPath(); g.arc(bx + Math.sin(t * 3 + i) * 3, by, 2 + (i % 3), 0, TAU); g.fill(); }
  tvTex.needsUpdate = true;
}
let tvChannel = 0; const CHANNELS = ['Aquarium', 'Fireplace', 'Countryside'];
drawTV(0);
let tvOn = true, tvScreen = null;
function setTV(v){ tvOn = v; tvScreen.emissiveIntensity = v ? 0.85 : 0; }
{
  const g = grp(-5.855, 2.55, PI / 2);
  box(1.46, 0.84, 0.035, M('#111212', 0.35, 0.4), 0, 1.33, 0, g);
  tvScreen = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.18, metalness: 0, emissive: 0xffffff, emissiveMap: tvTex, emissiveIntensity: 0.85 });
  mesh(new THREE.PlaneGeometry(1.42, 0.8), tvScreen, 0, 1.33, 0.0181, g, false, false);
  tagAct(g, { kind: 'tv' });
}
{
  const g = grp(-5.67, 2.55, PI / 2);
  boxB(1.8, 0.34, 0.4, MAT.oak, 0, 0.12, 0, g);
  const fl = [];
  for (let x = -0.885; x <= 0.886; x += 0.03){ const c = new THREE.CylinderGeometry(0.014, 0.014, 0.32, 8, 1, false, 0, PI); c.rotateY(-PI / 2); c.translate(x, 0.29, 0.2); fl.push(c); }
  mesh(merge(fl), MAT.oak, 0, 0, 0, g, false, true);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxB(0.03, 0.12, 0.03, MAT.black, sx * 0.84, 0, sz * 0.16, g);
  boxB(1.2, 0.07, 0.09, M('#1b1c1c', 0.5, 0.2), -0.05, 0.46, 0.04, g);
  vase(0.66, 0.46, 0.0, 0.22, M('#e7dfd1', 0.4), g, 0);
  stems(-5.67, 0.62, 2.55 - 0.66, 0.35, 6, scene, '#a3a07a', 9);
  bookStack(-0.72, 0.46, 0.02, 3, g, 11, 0.1);
  plantBush(-0.72, 0.56, 0.02, 1.0, g);
  blob(-5.67, 2.55, 1.8, 0.4, PI / 2, 0.42);
  foot(-5.67, 2.55, 1.8, 0.42, PI / 2);
}
// bookshelf
{
  const x = 0.755, z = 3.7, g = grp(x, z, -PI / 2), W = 1.0, D = 0.34, Ht = 2.0;
  for (const s of [-1, 1]) boxB(0.03, Ht, D, MAT.oak, s * (W / 2 - 0.015), 0, 0, g);
  const levels = [0.04, 0.42, 0.8, 1.18, 1.56, 1.97];
  levels.forEach(y => boxB(W - 0.06, 0.028, D - 0.01, MAT.oak, 0, y, 0, g, true, true));
  boxB(W - 0.06, Ht - 0.02, 0.012, M('#d8d2c7', 0.9), 0, 0, -D / 2 + 0.006, g, false, true);
  mesh(booksGeo(-0.46, 0.44, 0.068, 0, 21), MAT.vc, 0, 0, 0, g);
  mesh(booksGeo(-0.46, 0.1, 0.448, 0, 22), MAT.vc, 0, 0, 0, g);
  vase(0.28, 0.448, 0, 0.2, M('#6d7f74', 0.35), g, 1);
  mesh(booksGeo(0.0, 0.46, 0.828, 0, 23), MAT.vc, 0, 0, 0, g);
  plantBush(-0.25, 0.94, 0.02, 1.1, g, true);
  potMesh(-0.25, 0.02, 0.07, 0.12, MAT.terracotta, g, 0.828);
  mesh(booksGeo(-0.46, -0.05, 1.208, 0, 24), MAT.vc, 0, 0, 0, g);
  bookStack(0.25, 1.208, 0.0, 4, g, 25, 0.3);
  vase(0.25, 1.33, 0.0, 0.12, M('#caa77c', 0.45), g, 0);
  vase(-0.3, 1.588, 0.0, 0.26, M('#2f3b37', 0.4), g, 0);
  mesh(booksGeo(-0.1, 0.46, 1.588, 0, 26), MAT.vc, 0, 0, 0, g);
  plantBush(0.1, 2.12, 0.0, 1.2, g, true);
  potMesh(0.1, 0.0, 0.08, 0.13, MAT.ceramic, g, 1.998);
  blob(x, z, D, W, -PI / 2, 0.4);
  foot(x, z, W, D, -PI / 2);
}
{ // round side table by the sofa
  const x = -2.2, z = 1.02;
  cyl(0.22, 0.22, 0.025, MAT.walnut, x, 0.54, z, scene, 32);
  cyl(0.03, 0.03, 0.52, MAT.black, x, 0.27, z, scene, 12);
  cyl(0.16, 0.17, 0.02, MAT.black, x, 0.01, z, scene, 24);
  mesh(latheGeo([[0, 0], [0.05, 0], [0.055, 0.09], [0.05, 0.1], [0.045, 0.012], [0, 0.012]], 20), M('#e9e4da', 0.4), x - 0.06, 0.553, z + 0.04);
  bookStack(x + 0.05, 0.553, z - 0.03, 2, scene, 61, 0.6);
  blob(x, z, 0.46, 0.46, 0, 0.3, 0.004, true);
  foot(x, z, 0.44, 0.44, 0, true, 'lamp');
}
artFrame(artTex('arches'), 0.6, 0.78, 0.908, 1.55, 2.2, -PI / 2, MAT.oak);
plantFiddle(-5.45, 0.55, 1.0);
plantSnake(0.5, 4.55, 1.0);
rug(-0.6, 4.55, 0.9, 0.55, juteTex(55, false), 0, 0.015);

// rattan pendant over the coffee table
const lightsList = [];
function addPoint(x, y, z, hex, dayI, nightI, dist = 6){
  const l = new THREE.PointLight(C(hex), dayI, dist, 2); l.position.set(x, y, z); scene.add(l);
  (curUnit ? curUnit.lights : lightsList).push({ l, day: dayI, night: nightI }); return l;
}
{
  curUnit = U.rattan;
  const x = -3.9, z = 2.55;
  cyl(0.006, 0.006, H - 2.3, MAT.black, x, (H + 2.3) / 2, z, scene, 6, false);
  cyl(0.06, 0.06, 0.03, MAT.white, x, H - 0.015, z, scene, 20, false);
  const rat = new THREE.MeshStandardMaterial({ map: TX.rattan, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85, color: C('#ffffff') });
  glowMat('#ffb86b', 0, 0.55, rat); rat.emissiveMap = TX.rattan;
  const shade = sph(0.27, rat, x, 2.12, z, scene, 1, 0.8, 1, 28); shade.castShadow = false;
  sph(0.04, glowMat('#fff1d6', 0, 2.5), x, 2.1, z, scene).castShadow = false;
  addPoint(x, 2.02, z, '#ffc98c', 0, 1.5, 6.5);
  curUnit = null;
}
// tripod floor lamp (click it to switch it on or off)
{
  const x = -5.5, z = 4.5, lg = grp(x, z, 0);
  curUnit = U.floor;
  for (let i = 0; i < 3; i++){
    const a = i / 3 * TAU + 0.4, l = cyl(0.011, 0.011, 1.22, MAT.walnut, Math.sin(a) * 0.13, 0.6, Math.cos(a) * 0.13, lg, 8);
    l.rotation.set(Math.cos(a) * 0.21, 0, -Math.sin(a) * 0.21);
  }
  cyl(0.009, 0.009, 0.35, MAT.black, 0, 1.38, 0, lg, 8, false);
  lampShade(0.2, 0.23, 0.3, 0, 1.58, 0, lg, '#efe6d6', 0.05, 1.3);
  sph(0.03, glowMat('#fff1d6', 0, 2.2), 0, 1.52, 0, lg).castShadow = false;
  addPoint(x, 1.5, z, '#ffc98c', 0, 1.6, 6);
  curUnit = null;
  tagAct(lg, { kind: 'lamp', unit: U.floor });
  blob(x, z, 0.45, 0.45, 0, 0.3, 0.004, true);
  foot(x, z, 0.36, 0.36, 0, true, 'lamp');
}
// sideboard with opening doors + clock on the wall shared with the bedroom
{
  const x = 0.725, z = -2.9, g = grp(x, z, -PI / 2);
  shell(g, 0, 0.18, -0.2, 1.4, 0.58, 0.38, MAT.walnut, { shelves: [0.46], dividers: [-0.2333, 0.2333] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.016, 0.01, 0.18, MAT.walnut, sx * 0.64, 0.09, sz * 0.16, g, 8);
  vcMesh([
    bx(0.36, 0.06, 0.28, -0.465, 0.198, -0.03, '#b86a4b'), bx(0.34, 0.05, 0.26, -0.465, 0.258, -0.03, '#44546a'), bx(0.35, 0.07, 0.27, -0.465, 0.308, -0.03, '#e3b25a'),
    bx(0.3, 0.2, 0.16, -0.465, 0.476, -0.06, '#d8c7a4'),
    cy(0.035, 0.24, -0.08, 0.198, -0.02, '#2f4a3a', 0.015), cy(0.035, 0.24, 0.0, 0.198, -0.02, '#5a2230', 0.015), cy(0.035, 0.24, 0.08, 0.198, -0.02, '#2f4a3a', 0.015),
    cy(0.035, 0.1, -0.08, 0.476, -0.02, '#dfe7ea', 0.03), cy(0.035, 0.1, 0.0, 0.476, -0.02, '#dfe7ea', 0.03), cy(0.035, 0.1, 0.08, 0.476, -0.02, '#dfe7ea', 0.03),
    cy(0.12, 0.07, 0.465, 0.198, -0.03, '#f1eee8'), cy(0.09, 0.05, 0.465, 0.476, -0.03, '#c46e4d', 0.07), cy(0.02, 0.12, 0.38, 0.198, 0.1, '#efe9dc')
  ], g);
  for (let i = 0; i < 3; i++){ const hs = i === 2 ? 1 : -1, cx = -0.465 + i * 0.465; hingedDoor(g, cx + hs * 0.2325, 0.18, 0.18, 0.465, 0.58, MAT.walnut, hs, { handle: vHandle(0.1, MAT.brass, 0.5), angle: 1.6, name: 'cabinet' }); }
  boxB(1.4, 0.004, 0.4, M('#1e1a17', 0.6), 0, 0.76, 0, g, false);
  curUnit = U.mushroom;
  const lg = new THREE.Group(); g.add(lg);
  vase(-0.45, 0.764, 0, 0.22, M('#efe8dc', 0.3), lg, 0);
  sph(0.12, glowMat('#f6e3c3', 0.05, 1.0, new THREE.MeshStandardMaterial({ color: C('#f6e3c3'), roughness: 0.4 })), -0.45, 0.99, 0, lg, 1, 0.55, 1);
  curUnit = null;
  tagAct(lg, { kind: 'lamp', unit: U.mushroom });
  bookStack(0.35, 0.764, 0, 2, g, 31, -0.2);
  mesh(latheGeo([[0, 0], [0.09, 0.005], [0.13, 0.05], [0.125, 0.052], [0.085, 0.01], [0, 0.008]], 24), M('#3d4a45', 0.4), 0.05, 0.764, 0, g);
  blob(x, z, 1.4, 0.4, -PI / 2, 0.4);
  foot(x, z, 1.4, 0.4, -PI / 2);
}
const clock = {};
{
  const g = grp(0.905, -2.9, -PI / 2, scene, 1.75);
  const rim = cyl(0.22, 0.22, 0.035, MAT.black, 0, 0, 0, g, 48); rim.rotation.x = PI / 2;
  const face = mesh(new THREE.CircleGeometry(0.2, 48), new THREE.MeshStandardMaterial({ map: clockTex(), roughness: 0.6 }), 0, 0, 0.0185, g, false);
  const hand = (w, l, z) => { const p = new THREE.Group(); p.position.z = z; g.add(p); boxB(w, l, 0.004, MAT.black, 0, -0.02, 0, p, false); return p; };
  clock.h = hand(0.011, 0.12, 0.022); clock.m = hand(0.007, 0.17, 0.026); clock.s = hand(0.003, 0.18, 0.03);
  clock.s.children[0].material = M('#c0492f', 0.5);
  sph(0.01, MAT.black, 0, 0, 0.032, g);
  clock.g = g;
}

// ================= KITCHEN (drawers and cabinet doors open) =================
{
  const x0 = -5.925, x1 = -1.5, L = x1 - x0, xc = (x0 + x1) / 2, back = -4.925, D = 0.6, front = back + D, zf = front - 0.02;
  const sage = new THREE.MeshStandardMaterial({ color: C('#7c917d'), roughness: 0.5 });
  boxB(L, 0.1, D - 0.07, M('#2b2c2a', 0.8), xc, 0, back + (D - 0.07) / 2, scene, false);
  const n = 7, dw = L / n, ux = i => x0 + dw * (i + 0.5), zc = back + 0.29;
  shell(scene, xc, 0.1, back, L, 0.78, D - 0.02, sage, { top: false, shelves: [0.675], dividers: Array.from({ length: n - 1 }, (_, i) => x0 + dw * (i + 1)) });
  const P = [];
  P.push(cy(0.11, 0.09, ux(0) - 0.08, 0.406, zc, '#f1eee8'), cy(0.08, 0.07, ux(0) + 0.15, 0.406, zc, '#e7dfd1', 0.06), cy(0.12, 0.16, ux(0), 0.118, zc, '#b8bcbd'));
  P.push(cy(0.11, 0.13, ux(1) - 0.05, 0.118, zc - 0.05, '#9ea3a6'), cy(0.112, 0.012, ux(1) - 0.05, 0.248, zc - 0.05, '#2b2c2d'), cy(0.09, 0.1, ux(1) + 0.1, 0.406, zc, '#c46e4d'));
  P.push(cy(0.14, 0.36, ux(2) + 0.12, 0.118, zc, '#6d7f74'), cy(0.035, 0.2, ux(3) - 0.14, 0.118, zc + 0.08, '#5aa0c8', 0.02), cy(0.035, 0.22, ux(3) - 0.04, 0.118, zc + 0.05, '#e3b25a', 0.02), bx(0.2, 0.12, 0.14, ux(3) + 0.12, 0.118, zc, '#e9e4da'));
  P.push(cy(0.12, 0.09, ux(4), 0.118, zc, '#e9e4da', 0.07), cy(0.09, 0.08, ux(4), 0.406, zc, '#8a9c83', 0.05));
  P.push(cy(0.13, 0.04, ux(5), 0.118, zc, '#2b2c2d'), cy(0.12, 0.04, ux(5), 0.16, zc, '#3a3b3c'), bx(0.03, 0.02, 0.2, ux(5), 0.13, zc + 0.2, '#2b2c2d'));
  for (let k = 0; k < 4; k++) P.push(cy(0.04, 0.11, ux(6) - 0.15 + k * 0.1, 0.406, zc + (k % 2) * 0.06, ['#e3b25a', '#b86a4b', '#c7cbcd', '#8a9c83'][k]));
  P.push(cy(0.05, 0.16, ux(6) - 0.08, 0.118, zc, '#d9d2c4'), cy(0.05, 0.16, ux(6) + 0.08, 0.118, zc, '#d9d2c4'));
  vcMesh(P);
  const fills = [fillTowels, fillCutlery, null, null, fillUtensils, fillCutlery, fillTowels];
  for (let i = 0; i < n; i++){
    const cx = ux(i), sink = i === 2 || i === 3;
    if (sink){ // fixed false fronts under the sink
      rboxB(dw - 0.008, 0.172, 0.02, 0.004, sage, cx, 0.695, zf + 0.01, scene, false, 2);
      boxB(0.16, 0.012, 0.014, MAT.brass, cx, 0.775, zf + 0.027, scene, false);
    } else {
      drawer(scene, cx, 0.693, zf, dw, 0.175, 0.5, sage, { cavity: false, pullY: 0.082, pullW: 0.16, fill: fills[i] });
      boxB(dw - 0.02, 0.016, D - 0.05, INNER, cx, 0.39, back + (D - 0.05) / 2, scene, false);
    }
    const hs = i % 2 ? 1 : -1;
    hingedDoor(scene, cx + hs * dw / 2, 0.11, zf, dw, 0.575, sage, hs, { handle: vHandle(0.13, MAT.brass, 0.8), angle: 1.6, name: 'cabinet' });
  }
  // counters with a cut-out for the sink
  const marble = new THREE.MeshStandardMaterial({ map: TX.marble, roughness: 0.22, color: C('#ffffff'), envMapIntensity: 1 });
  const cTop = 0.88, ct = 0.04, cf = front + 0.04;
  const seg = (a, b, z0, z1) => { const g = new THREE.BoxGeometry(b - a, ct, z1 - z0); const m = mesh(g, marble, (a + b) / 2, cTop + ct / 2, (z0 + z1) / 2); return m; };
  seg(x0, -4.35, back, cf); seg(-3.65, x1 + 0.01, back, cf); seg(-4.35, -3.65, back, -4.8); seg(-4.35, -3.65, -4.45, cf);
  const sinkMat = new THREE.MeshStandardMaterial({ color: C('#b8bcbd'), roughness: 0.3, metalness: 0.85, side: THREE.BackSide });
  mesh(new THREE.BoxGeometry(0.7, 0.2, 0.35), sinkMat, -4.0, cTop - 0.1 + 0.001, -4.625, scene, false, true);
  cyl(0.02, 0.02, 0.005, M('#555', 0.4, 0.8), -4.0, cTop - 0.195, -4.62, scene, 16, false);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.28, 0), new THREE.Vector3(0, 0.36, 0.08), new THREE.Vector3(0, 0.3, 0.19)]);
  mesh(new THREE.TubeGeometry(curve, 32, 0.012, 10, false), M('#232323', 0.4, 0.5), -4.0, cTop + ct, -4.87);
  cyl(0.025, 0.028, 0.03, M('#232323', 0.4, 0.5), -4.0, cTop + ct + 0.015, -4.87);
  boxB(0.012, 0.012, 0.09, M('#232323', 0.4, 0.5), -3.93, cTop + ct + 0.05, -4.84, scene, false);
  // backsplash tiles
  const tileMat = new THREE.MeshStandardMaterial({ map: TX.tile, roughness: 0.2, color: C('#ffffff'), envMapIntensity: 0.9 });
  const splash = (a, b, y0, y1) => { const g = new THREE.PlaneGeometry(b - a, y1 - y0); const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + (a + b) / 2) / 0.6, (p.getY(i) + (y0 + y1) / 2) / 0.6); mesh(g, tileMat, (a + b) / 2, (y0 + y1) / 2, back + 0.004, scene, false, true); };
  splash(x0, -4.6, cTop + ct, 1.5); splash(-4.6, -3.4, cTop + ct, 1.2); splash(-3.4, x1, cTop + ct, 1.5);
  // upper cabinets
  curUnit = U.kitchen;
  for (const [a, b] of [[x0, -4.72], [-3.28, x1]]){
    const w = b - a, cx = (a + b) / 2, nd = Math.max(1, Math.round(w / 0.45)), dwk = w / nd;
    shell(scene, cx, 1.5, back, w, 0.8, 0.34, sage, { shelves: [1.75, 2.02] });
    const Q = [];
    for (let k = 0; k < nd; k++){
      const dx = a + dwk * (k + 0.5);
      Q.push(cy(0.1, 0.08, dx, 1.518, back + 0.17, '#f1eee8'));
      for (let j = 0; j < 3; j++) Q.push(cy(0.034, 0.11, dx - 0.1 + j * 0.1, 1.766, back + 0.17, '#dfe7ea', 0.03));
      Q.push(cy(0.042, 0.09, dx - 0.07, 2.036, back + 0.17, ['#c46e4d', '#8a9c83', '#e9e4da'][k % 3]), cy(0.042, 0.09, dx + 0.07, 2.036, back + 0.17, '#e9e4da'));
    }
    vcMesh(Q);
    for (let k = 0; k < nd; k++){
      const dx = a + dwk * (k + 0.5), hs = k % 2 ? 1 : -1;
      hingedDoor(scene, dx + hs * dwk / 2, 1.5, back + 0.34, dwk, 0.8, sage, hs, { handle: vHandle(0.12, MAT.brass, 0.2), angle: 1.6, name: 'cabinet' });
    }
    boxB(w - 0.02, 0.012, 0.025, glowMat('#ffe2b0', 0.02, 1.6), cx, 1.488, back + 0.3, scene, false);
  }
  addPoint(-3.7, 1.3, -4.5, '#ffd9a0', 0, 0.8, 3.2);
  curUnit = null;
  // cooktop, kettle
  rboxB(0.6, 0.008, 0.5, 0.004, M('#0e0f10', 0.15, 0.3), -2.4, cTop + ct, -4.62, scene, false);
  for (const [dx, dz, r] of [[-0.14, -0.1, 0.085], [0.14, -0.1, 0.07], [-0.14, 0.12, 0.07], [0.14, 0.12, 0.085]]){
    const t = mesh(new THREE.TorusGeometry(r, 0.0035, 6, 40), M('#5a5e60', 0.5), -2.4 + dx, cTop + ct + 0.009, -4.62 + dz, scene, false, false); t.rotation.x = PI / 2;
  }
  const kettle = mesh(latheGeo([[0, 0], [0.09, 0], [0.1, 0.05], [0.095, 0.12], [0.06, 0.16], [0.02, 0.17], [0, 0.17]], 28), M('#e9e5dc', 0.25, 0.1), -2.54, cTop + ct + 0.008, -4.72);
  const hdl = mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 20, PI), MAT.black, -2.54, cTop + ct + 0.18, -4.72, scene, false); 
  // counter decor
  const board = rboxB(0.34, 0.02, 0.24, 0.01, MAT.oak, -5.3, cTop + ct, -4.83, scene); board.rotation.x = 1.3; board.position.set(-5.3, cTop + ct + 0.12, -4.87);
  mesh(latheGeo([[0, 0], [0.1, 0.005], [0.14, 0.06], [0.135, 0.065], [0.095, 0.012], [0, 0.01]], 28), M('#e8e2d7', 0.35), -5.0, cTop + ct, -4.62);
  const lem = []; const rr = RNG(5); for (let i = 0; i < 5; i++){ const s = new THREE.SphereGeometry(0.035, 12, 9); s.scale(1, 0.9, 1.2); s.rotateY(rr() * 3); s.translate((rr() - 0.5) * 0.12, 0.05 + (i > 3 ? 0.04 : 0), (rr() - 0.5) * 0.1); lem.push(s); }
  mesh(merge(lem), M('#e8c23a', 0.45), -5.0, cTop + ct, -4.62);
  cyl(0.055, 0.05, 0.16, M('#6d7f74', 0.35), -2.95, cTop + ct + 0.08, -4.8);
  stems(-2.95, cTop + ct + 0.15, -4.8, 0.12, 5, scene, '#6e5a44', 13);
  for (let i = 0; i < 3; i++) cyl(0.045, 0.045, 0.14 - i * 0.02, new THREE.MeshStandardMaterial({ color: C('#e9eef0'), roughness: 0.05, transparent: true, opacity: 0.5 }), -1.95 + i * 0.1, cTop + ct + 0.07 - i * 0.01, -4.82, scene, 16, false);
  potMesh(-4.25, -4.84, 0.06, 0.1, MAT.terracotta, scene, 1.235); plantBush(-4.25, 1.34, -4.84, 0.8);
  potMesh(-3.75, -4.84, 0.05, 0.09, MAT.ceramic, scene, 1.235); plantBush(-3.75, 1.33, -4.84, 0.7);
  blob(xc, back + D / 2, L, D, 0, 0.38);
  addCol(x0, x1, back, front + 0.02);
  planItems.push({ cx: xc, cz: back + D / 2, w: L, d: D, ry: 0, kind: 'f' });
  rug(-3.55, -3.95, 2.4, 0.66, runnerTex(), 0, 0.01);
}
// fridge: French doors and a freezer drawer
{
  const x = -0.98, z = -4.575, g = grp(x, z, 0);
  const steel = MAT.steel, fw = M('#f4f5f2', 0.4), hdl = M('#9ea3a6', 0.2, 0.9);
  for (const s of [-1, 1]) boxB(0.03, 1.88, 0.64, steel, s * 0.385, 0.02, -0.02, g);
  boxB(0.8, 0.03, 0.64, steel, 0, 1.87, -0.02, g);
  boxB(0.74, 1.85, 0.02, steel, 0, 0.02, -0.33, g);
  boxB(0.8, 0.04, 0.64, M('#2b2c2d', 0.8), 0, 0, -0.02, g, false);
  boxB(0.74, 1.14, 0.006, fw, 0, 0.72, -0.317, g, false);
  for (const s of [-1, 1]) boxB(0.006, 1.14, 0.6, fw, s * 0.367, 0.72, -0.02, g, false);
  boxB(0.74, 0.04, 0.62, fw, 0, 0.69, -0.01, g, false);
  const fl = new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: 0.5, emissive: C('#eaf4ff'), emissiveIntensity: 0 });
  boxB(0.5, 0.012, 0.3, fl, 0, 1.845, -0.1, g, false);
  const glassS = new THREE.MeshStandardMaterial({ color: C('#dfeef2'), roughness: 0.1, transparent: true, opacity: 0.35 });
  for (const y of [1.02, 1.3, 1.58]) boxB(0.73, 0.008, 0.48, glassS, 0, y, -0.07, g, false);
  vcMesh([
    bx(0.07, 0.2, 0.07, -0.25, 0.73, -0.1, '#f4f5f2'), bx(0.072, 0.025, 0.072, -0.25, 0.93, -0.1, '#5aa0c8'), bx(0.08, 0.22, 0.08, -0.15, 0.73, -0.15, '#e3b25a'),
    cy(0.035, 0.18, 0.05, 0.73, -0.2, '#6d8a66', 0.02), cy(0.05, 0.08, 0.2, 0.73, -0.05, '#c46e4d'),
    sp(0.035, 0.2, 1.065, -0.15, '#c0392b'), sp(0.035, 0.27, 1.065, -0.1, '#c0392b'), sp(0.04, 0.12, 1.07, -0.08, '#8fb14a'),
    cy(0.045, 0.1, -0.2, 1.028, -0.12, '#e9e4da'), cy(0.046, 0.02, -0.2, 1.128, -0.12, '#b86a4b'), bx(0.25, 0.06, 0.12, 0.0, 1.028, 0.0, '#e9e4da'),
    cy(0.05, 0.12, 0.2, 1.308, -0.1, '#f2d7a0'), cy(0.05, 0.12, 0.08, 1.308, -0.14, '#d9e4ea'), bx(0.18, 0.1, 0.14, -0.18, 1.308, -0.1, '#8a9c83'),
    cy(0.04, 0.09, -0.1, 1.588, -0.12, '#e3b25a'), cy(0.04, 0.09, 0.0, 1.588, -0.12, '#b86a4b'), bx(0.2, 0.08, 0.12, 0.2, 1.588, -0.12, '#f4f5f2')
  ], g);
  const ks = [0, 0], dr = [];
  [-1, 1].forEach((hs, idx) => {
    const rec = hingedDoor(g, hs * 0.4, 0.72, 0.3, 0.4, 1.17, steel, hs, { thick: 0.04, angle: 1.9, dur: 0.55, name: 'fridge', handleInset: 0.04,
      handle: (p, hx, h, t) => boxB(0.022, 0.55, 0.03, hdl, hx, 0.35, t / 2 + 0.015, p, false),
      onK: k => { ks[idx] = k; fl.emissiveIntensity = 1.3 * Math.max(ks[0], ks[1]); } });
    const p = rec.pivot, cxl = -hs * 0.2;
    boxB(0.37, 1.12, 0.004, fw, cxl, 0.025, -0.022, p, false);
    const B = [];
    for (const y of [0.22, 0.58, 0.94]){ boxB(0.33, 0.05, 0.07, fw, cxl, y, -0.058, p, false); B.push(cy(0.03, 0.2, cxl - 0.08, y + 0.01, -0.058, ['#6d8a66', '#e3b25a', '#b86a4b'][(y * 10) % 3 | 0], 0.018), cy(0.03, 0.16, cxl + 0.02, y + 0.01, -0.058, '#f4f5f2', 0.02)); }
    vcMesh(B, p);
    tagAct(p, rec); dr.push(rec);
  });
  dr.forEach(r => r.linked = dr);
  drawer(g, 0, 0.05, 0.32, 0.78, 0.62, 0.5, steel, { cavity: false, pullW: 0.5, pullY: 0.54, pullMat: hdl, name: 'freezer', fill: fillFreezer });
  blob(x, z, 0.8, 0.7, 0, 0.45);
  foot(x, z, 0.82, 0.7, 0);
}
// cat bowls
{
  rboxB(0.55, 0.006, 0.32, 0.003, M('#6f8a7a', 0.9), -1.93, 0, -4.1, scene, false, 2);
  const bowlG = latheGeo([[0, 0], [0.07, 0], [0.085, 0.045], [0.08, 0.05], [0.065, 0.012], [0, 0.012]], 24);
  mesh(bowlG, M('#e5ecef', 0.3), -2.06, 0.006, -4.1);
  mesh(bowlG, M('#e9c9a6', 0.3), -1.8, 0.006, -4.1);
  const w = mesh(new THREE.CircleGeometry(0.068, 24), new THREE.MeshStandardMaterial({ color: C('#9fc3d0'), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.8 }), -2.06, 0.042, -4.1, scene, false, false); w.rotation.x = -PI / 2;
  const kib = [], rr = RNG(9); for (let i = 0; i < 40; i++){ const s = new THREE.SphereGeometry(0.008, 6, 4); s.translate((rr() - 0.5) * 0.1, 0.02 + rr() * 0.02, (rr() - 0.5) * 0.1); kib.push(s); }
  mesh(merge(kib), M('#7a4b2a', 0.8), -1.8, 0.006, -4.1, scene, false);
}

// ================= DINING =================
rug(-3.5, -2.3, 2.6, 2.0, juteTex(51, true));
function chair(x, z, ry, seatMat, wood = MAT.oak){
  const g = grp(x, z, ry);
  for (const sx of [-1, 1]){
    cyl(0.016, 0.013, 0.43, wood, sx * 0.19, 0.215, 0.18, g, 8);
    const r = cyl(0.016, 0.013, 0.82, wood, sx * 0.19, 0.41, -0.18, g, 8); r.rotation.x = -0.06;
  }
  rboxB(0.46, 0.04, 0.44, 0.015, wood, 0, 0.41, 0, g);
  rboxB(0.42, 0.025, 0.4, 0.012, seatMat, 0, 0.45, 0.01, g);
  const arc = new THREE.TorusGeometry(0.34, 0.018, 8, 24, 1.3); arc.rotateZ(PI / 2 - 0.65); arc.rotateX(-PI / 2); arc.translate(0, 0.78, 0.14);
  mesh(arc, wood, 0, 0, 0, g);
  box(0.06, 0.3, 0.014, wood, 0, 0.62, -0.19, g).rotation.x = -0.06;
  blob(x, z, 0.46, 0.44, ry, 0.34);
  foot(x, z, 0.46, 0.46, ry);
  seatRec(g, [[0, 1.12, -0.02]], 'Sit down');
}
{
  const x = -3.5, z = -2.3, g = grp(x, z, 0);
  rboxB(1.6, 0.035, 0.9, 0.012, MAT.oak, 0, 0.74, 0, g);
  boxB(1.4, 0.08, 0.7, MAT.oak, 0, 0.66, 0, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.03, 0.018, 0.74, MAT.oak, sx * 0.7, 0.37, sz * 0.36, g, 10);
  vase(0, 0.775, 0, 0.26, M('#e9e4da', 0.35), g, 0);
  stems(x, 0.99, z, 0.4, 7, scene, '#8a9d86', 17);
  for (const dx of [-0.45, 0.45]){ cyl(0.03, 0.035, 0.01, MAT.brass, dx, 0.78, 0.05, g, 16); cyl(0.012, 0.012, 0.22, M('#efe9dc', 0.6), dx, 0.895, 0.05, g, 12); }
  blob(x, z, 1.6, 0.9, 0, 0.36);
  foot(x, z, 1.6, 0.9, 0);
  const seat = fabric('#cdb58b', TX.knit, 0.9);
  chair(-3.9, -1.67, PI, seat); chair(-3.1, -1.67, PI, seat); chair(-3.9, -2.93, 0, seat); chair(-3.1, -2.93, 0, seat);
  curUnit = U.dining;
  for (const px of [-3.95, -3.05]){
    cyl(0.005, 0.005, H - 1.95, MAT.black, px, (H + 1.95) / 2, z, scene, 6, false);
    cyl(0.04, 0.04, 0.025, MAT.black, px, H - 0.012, z, scene, 16, false);
    const dome = mesh(latheGeo([[0.012, 0.22], [0.05, 0.215], [0.13, 0.17], [0.18, 0.09], [0.2, 0.0], [0.195, 0.0]], 36), new THREE.MeshStandardMaterial({ color: C('#1f2221'), roughness: 0.45, metalness: 0.3, side: THREE.DoubleSide }), px, 1.73, z, scene, true, false);
    sph(0.035, glowMat('#fff1d6', 0, 2.4), px, 1.76, z, scene).castShadow = false;
  }
  addPoint(x, 1.6, z, '#ffc98c', 0, 1.4, 5.5);
  curUnit = null;
}
