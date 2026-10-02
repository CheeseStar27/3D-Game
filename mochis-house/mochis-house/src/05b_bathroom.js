
// ================= BATHROOM (wing off the living room's west wall) =================
// interior: x -8.925..-6.075, z -1.175..2.275
function zelligeTex(){
  return canvasTex(512, 512, (g, W) => {
    g.fillStyle = '#e6e2d9'; g.fillRect(0, 0, W, W);
    const r = RNG(401), n = 4, s = W / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
      const x = i * s + 2, y = j * s + 2, w = s - 4;
      const gr = g.createLinearGradient(x, y, x + w, y + w);
      const hh = 140 + r() * 16, ss = 16 + r() * 12, ll = 58 + r() * 9;
      gr.addColorStop(0, hsl(hh, ss, ll + 5)); gr.addColorStop(0.5, hsl(hh, ss, ll)); gr.addColorStop(1, hsl(hh, ss + 4, ll - 6));
      g.fillStyle = gr; g.fillRect(x, y, w, w);
      g.fillStyle = 'rgba(255,255,255,0.045)'; g.beginPath(); g.ellipse(x + w * (0.3 + r() * 0.4), y + w * (0.3 + r() * 0.4), w * 0.3, w * 0.18, r() * PI, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(40,60,45,0.18)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, w - 2);
    }
    noisePass(g, W, W, 8, 402);
  });
}
function stoneFloorTex(){
  return canvasTex(512, 512, (g, W) => {
    g.fillStyle = '#d9d3c8'; g.fillRect(0, 0, W, W);
    const r = RNG(411);
    for (let k = 0; k < 900; k++){ g.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${70 + r() * 40},${0.08 + r() * 0.12})`; g.beginPath(); g.arc(r() * W, r() * W, 0.8 + r() * 2.2, 0, TAU); g.fill(); }
    g.strokeStyle = '#b9b2a6'; g.lineWidth = 3;
    for (const p of [0, W / 2]){ g.beginPath(); g.moveTo(p, 0); g.lineTo(p, W); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(W, p); g.stroke(); }
    noisePass(g, W, W, 10, 412);
  });
}
const zelMat = new THREE.MeshStandardMaterial({ map: zelligeTex(), roughness: 0.14, color: C('#ffffff'), envMapIntensity: 1.1 });
const bathPaint = new THREE.MeshStandardMaterial({ color: C('#efe9df'), roughness: 0.95, map: TX.plaster });
const cer = new THREE.MeshStandardMaterial({ color: C('#f7f5f0'), roughness: 0.12, envMapIntensity: 1 });
const chrome = M('#cfd3d5', 0.15, 1), matteBlack = M('#1d1f1f', 0.4, 0.4);
const BATH = { tap: false, shower: false, bathTap: false, level: 0.105, flushT: 0 };

// walls, window, floor, ceiling, roof
wall('x', -1.25, -9.075, -6.075, [], { plus: bathPaint, minus: MAT.exterior });
wall('x', 2.35, -9.075, -6.075, [], { plus: MAT.exterior, minus: bathPaint });
wall('z', -9, -1.325, 2.425, [{ a: -0.75, b: 0.15, y0: 1.3, y1: 2.05 }], { plus: bathPaint, minus: MAT.exterior });
windowUnit('z', -9, -0.75, 0.15, 1.3, 2.05, 1, { curtain: false, glassMat: new THREE.MeshStandardMaterial({ color: C('#eef3f3'), roughness: 0.35, transparent: true, opacity: 0.8, depthWrite: false }) });
casing('z', -6, -0.9, 0.0, 2.1, [1, -1]);
boxB(T + 0.03, 0.008, 0.9, cer, -6, 0, -0.45, scene, false);
TX.stone = stoneFloorTex(); TX.stone.repeat.set(1 / 1.2, 1 / 1.2);
floorPlane(-9, -6, -1.25, 2.35, TX.stone, 0.3);
box(3.15, 0.2, 3.9, MAT.ceiling, -7.575, H + 0.1, 0.55);
boxB(3.3, 0.19, 4.0, M('#a9a7a1', 0.95), -7.6, -0.2, 0.55, scene, false, true);
{
  const sh = new THREE.Shape(); sh.moveTo(-2.15, 0); sh.lineTo(2.15, 0); sh.lineTo(0, 0.9); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: 3.0, bevelEnabled: false }); rg.rotateY(PI / 2); rg.translate(-9.15, 3.0, 0.55);
  mesh(rg, [MAT.exterior, M('#4a4f55', 0.85)], 0, 0, 0, scene, false, false);
  boxB(3.2, 0.12, 4.3, M('#f1efe9', 0.8), -7.7, 2.9, 0.55, scene, false, false);
}
// tiles: green zellige wainscot, full height inside the shower
function wallPanel(axis, c, a, b, y0, y1, side, mat, scale = 0.6){
  const w = b - a, h = y1 - y0, geo = new THREE.PlaneGeometry(w, h), p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + (a + b) / 2) / scale, (p.getY(i) + (y0 + y1) / 2) / scale);
  const m = mesh(geo, mat, 0, 0, 0, scene, false, true);
  if (axis === 'x'){ m.position.set((a + b) / 2, (y0 + y1) / 2, c + side * 0.004); m.rotation.y = side > 0 ? 0 : PI; }
  else { m.position.set(c + side * 0.004, (y0 + y1) / 2, (a + b) / 2); m.rotation.y = side > 0 ? PI / 2 : -PI / 2; }
  return m;
}
const TW = 1.2;
wallPanel('x', -1.175, -8.925, -6.075, 0, TW, 1, zelMat);
wallPanel('x', 2.275, -8.925, -6.075, 0, TW, -1, zelMat);
wallPanel('x', 2.275, -8.925, -7.725, TW, H, -1, zelMat);
wallPanel('z', -8.925, -1.175, 2.275, 0, TW, 1, zelMat);
wallPanel('z', -8.925, 1.075, 2.275, TW, H, 1, zelMat);
wallPanel('z', -6.075, -1.175, -0.97, 0, TW, -1, zelMat);
wallPanel('z', -6.075, 0.07, 2.275, 0, TW, -1, zelMat);
wallPanel('z', -6.075, -1.175, -0.97, TW, H, -1, bathPaint, 1.5);
wallPanel('z', -6.075, 0.07, 2.275, TW, H, -1, bathPaint, 1.5);
wallPanel('z', -6.075, -0.97, 0.07, 2.17, H, -1, bathPaint, 1.5);
{ // bullnose trim along the top of the tiles
  const tr = M('#f3f1ec', 0.3);
  box(2.85, 0.022, 0.014, tr, -7.5, TW, -1.175 + 0.009, scene, false);
  box(1.65, 0.022, 0.014, tr, -6.9, TW, 2.275 - 0.009, scene, false);
  box(0.014, 0.022, 2.25, tr, -8.925 + 0.009, TW, -0.05, scene, false);
  box(0.014, 0.022, 0.2, tr, -6.075 - 0.009, TW, -1.07, scene, false);
  box(0.014, 0.022, 2.2, tr, -6.075 - 0.009, TW, 1.17, scene, false);
}
houseDoor('bath', 'bathroom door', -6.055, -0.888, -PI / 2, -PI, 0.88, 0.04, MAT.white, true, [-6.075, -5.925, -0.9, 0.0], [-6.95, -6.04, -0.92, -0.85]);
DOORS.bath.zone = [-7.1, -5.3, -1.1, 0.2];

// ---- bathtub (freestanding) with a floor tap you can run ----
const tubInner = [[0.2, 0.11], [0.3, 0.14], [0.35, 0.32], [0.375, 0.56]];
const bathWater = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshStandardMaterial({ color: C('#8fc3d1'), roughness: 0.03, metalness: 0.15, transparent: true, opacity: 0.72, depthWrite: false }));
{
  const bt = grp(-8.52, -0.3, 0);
  const tub = mesh(latheGeo([[0, 0.02], [0.3, 0.02], [0.36, 0.06], [0.4, 0.3], [0.42, 0.555], [0.415, 0.57], [0.395, 0.575], [0.375, 0.56], [0.35, 0.32], [0.3, 0.14], [0.2, 0.11], [0, 0.105]], 48), cer, 0, 0, 0, bt);
  tub.scale.set(0.9, 1, 1.9);
  boxB(0.62, 0.02, 0.22, MAT.oak, 0, 0.575, 0.05, bt);
  cyl(0.03, 0.03, 0.07, M('#f1ece2', 0.7), -0.15, 0.63, 0.05, bt, 14);
  bookStack(0.12, 0.595, 0.05, 2, bt, 71, 0.3);
  sph(0.008, glowMat('#ffb34d', 0.8, 1.6), -0.15, 0.715, 0.05, bt, 1, 1.8, 1).castShadow = false;
  blob(-8.52, -0.3, 0.8, 1.62, 0, 0.4);
  foot(-8.52, -0.3, 0.78, 1.62, 0);
  seatRec(bt, [[0, 0.95, -0.4, -0.25]], 'Get in the bath');
  bathWater.rotation.x = -PI / 2; bathWater.visible = false; scene.add(bathWater); movers.push(bathWater);
  // floor-standing tap
  const tp = grp(-8.52, 0.64, 0);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.92, 0), new THREE.Vector3(0, 1.0, -0.1), new THREE.Vector3(0, 0.93, -0.26)]);
  mesh(new THREE.TubeGeometry(curve, 40, 0.016, 10, false), matteBlack, 0, 0, 0, tp);
  cyl(0.05, 0.06, 0.02, matteBlack, 0, 0.01, 0, tp, 20);
  boxB(0.012, 0.012, 0.09, matteBlack, 0, 0.78, 0.05, tp, false);
  hitProxy(tp, 0.2, 1.05, 0.4, 0, 0.52, -0.1);
  tagAct(tp, { kind: 'custom', label: () => BATH.bathTap ? 'Turn off the bath tap' : (BATH.level > 0.44 ? 'The bath is full' : 'Run the bath'), use: () => { if (!BATH.bathTap && BATH.level > 0.44) return; BATH.bathTap = !BATH.bathTap; sfx('click'); } });
  tagAct(bathWater, { kind: 'custom', label: () => 'Pull the plug', use: () => { BATH.bathTap = false; BATH.draining = true; sfx('click'); } });
}
const streamMat = new THREE.MeshStandardMaterial({ color: C('#e4f3f8'), roughness: 0.05, transparent: true, opacity: 0.6, depthWrite: false });
const bathStream = mesh(new THREE.CylinderGeometry(0.009, 0.007, 1, 8), streamMat, -8.52, 0.6, 0.38, scene, false, false);
bathStream.visible = false; movers.push(bathStream);
rug(-7.82, -0.35, 0.5, 0.85, canvasTex(128, 256, (g, W, Hh) => { g.fillStyle = '#f1ece2'; g.fillRect(0, 0, W, Hh); g.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < Hh; y += 6) g.fillRect(0, y, W, 3); noisePass(g, W, Hh, 14, 5); }), 0, 0.018);

// ---- toilet: lift the lid, flush, or sit ----
const bowlWater = new THREE.Mesh(new THREE.CircleGeometry(0.075, 24), new THREE.MeshStandardMaterial({ color: C('#bfdbe3'), roughness: 0.05, transparent: true, opacity: 0.7 }));
{
  const tg = grp(-7.6, -1.175, 0);
  rboxB(0.38, 0.4, 0.16, 0.025, cer, 0, 0.42, 0.08, tg);
  const pan = mesh(latheGeo([[0, 0], [0.13, 0], [0.14, 0.04], [0.15, 0.2], [0.185, 0.36], [0.19, 0.4], [0.17, 0.405], [0.155, 0.37], [0.1, 0.28], [0.05, 0.24], [0, 0.235]], 40), cer, 0, 0, 0.4, tg);
  pan.scale.set(1, 1, 1.3);
  bowlWater.rotation.x = -PI / 2; bowlWater.position.set(0, 0.252, 0.41); bowlWater.scale.set(1, 1.25, 1); tg.add(bowlWater); movers.push(bowlWater);
  const sp = new THREE.Group(); sp.position.set(0, 0.405, 0.18); tg.add(sp);
  const ring = new THREE.TorusGeometry(0.155, 0.019, 10, 44); ring.rotateX(PI / 2); ring.scale(1, 0.4, 1.3);
  mesh(ring, cer, 0, 0.008, 0.23, sp);
  const lp = new THREE.Group(); lp.position.set(0, 0.418, 0.175); tg.add(lp);
  const lid = cyl(0.175, 0.175, 0.018, cer, 0, 0.009, 0.235, lp, 40); lid.scale.set(1, 1, 1.3);
  const fp = new THREE.Group(); fp.position.set(0, 0.82, 0.08); tg.add(fp);
  cyl(0.034, 0.034, 0.006, chrome, 0, 0.003, 0, fp, 24);
  for (const s of [-1, 1]) boxB(0.028, 0.008, 0.05, chrome, s * 0.016, 0.006, 0, fp, false);
  hitProxy(fp, 0.14, 0.06, 0.12, 0, 0.02, 0);
  blob(-7.6, -0.85, 0.44, 0.68, 0, 0.35);
  foot(-7.6, -0.85, 0.42, 0.66, 0);
  seatRec(tg, [[0, 1.12, 0.38, -0.15]], 'Sit on the toilet');
  const lidRec = animated({ kind: 'cabinet', name: 'toilet lid', open: false, dur: 0.5, apply: k => { lp.rotation.x = -1.52 * k; } }, lp);
  tagAct(lp, lidRec);
  tagAct(fp, { kind: 'custom', label: () => 'Flush the toilet', use: () => { BATH.flushT = 2.4; sfx('flush'); } });
  // paper holder
  boxB(0.012, 0.012, 0.11, matteBlack, -7.18, 0.72, -1.175 + 0.055, scene, false);
  const roll = cyl(0.055, 0.055, 0.1, M('#fbfaf7', 0.9), -7.18, 0.665, -1.175 + 0.078, scene, 20, false); roll.rotation.z = PI / 2;
}

// ---- vanity with drawers, basin tap and a mirror cabinet ----
const tapStream = mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.22, 8), streamMat, 0, 0, 0, scene, false, false);
tapStream.visible = false; movers.push(tapStream);
{
  const vg = grp(-7.1, 2.035, PI);
  boxB(1.0, 0.36, 0.46, MAT.oak, 0, 0.45, 0, vg);
  const rolled = (dg, iw, th, d) => { const p = []; for (let k = 0; k < 3; k++){ const c = new THREE.CylinderGeometry(0.04, 0.04, iw * 0.8, 14); c.rotateZ(PI / 2); c.translate(0, 0.07, -0.06 - k * 0.1); p.push(tint(c, ['#e9e4da', '#8a9c83', '#e9e4da'][k])); } vcMesh(p, dg); };
  const toiletries = (dg, iw, th, d) => vcMesh([cy(0.025, 0.12, -0.12, 0.03, -0.1, '#e9e4da', 0.015), cy(0.03, 0.09, -0.04, 0.03, -0.12, '#c46e4d'), bx(0.12, 0.04, 0.08, 0.1, 0.03, -0.1, '#9fb3c8'), cy(0.04, 0.03, 0.06, 0.03, -0.24, '#f4f5f2')], dg);
  drawer(vg, -0.25, 0.465, 0.23, 0.49, 0.33, 0.36, MAT.oak, { pullW: 0.12, pullY: 0.27, fill: rolled });
  drawer(vg, 0.25, 0.465, 0.23, 0.49, 0.33, 0.36, MAT.oak, { pullW: 0.12, pullY: 0.27, fill: toiletries });
  boxB(1.02, 0.025, 0.48, new THREE.MeshStandardMaterial({ map: TX.marble, roughness: 0.2 }), 0, 0.81, 0, vg);
  mesh(latheGeo([[0, 0], [0.09, 0], [0.16, 0.05], [0.19, 0.12], [0.185, 0.125], [0.155, 0.06], [0.08, 0.02], [0, 0.018]], 36), cer, 0, 0.835, 0.03, vg);
  const fg = new THREE.Group(); vg.add(fg);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.26, 0), new THREE.Vector3(0, 0.31, 0.06), new THREE.Vector3(0, 0.27, 0.15)]);
  mesh(new THREE.TubeGeometry(curve, 30, 0.011, 10, false), matteBlack, 0, 0.835, -0.15, fg);
  cyl(0.022, 0.024, 0.02, matteBlack, 0, 0.845, -0.15, fg, 16);
  boxB(0.07, 0.01, 0.012, matteBlack, 0.05, 0.9, -0.15, fg, false);
  hitProxy(fg, 0.2, 0.35, 0.3, 0, 1.0, -0.05);
  tagAct(fg, { kind: 'custom', label: () => BATH.tap ? 'Turn off the tap' : 'Turn on the tap', use: () => { BATH.tap = !BATH.tap; sfx('click'); } });
  vg.updateMatrixWorld(true);
  const sp = vg.localToWorld(new THREE.Vector3(0, 0.985, 0.0)); tapStream.position.copy(sp);
  vcMesh([cy(0.03, 0.14, 0.38, 0.835, -0.12, '#c9a27a', 0.028), cy(0.008, 0.03, 0.38, 0.975, -0.12, '#1d1f1f'),
    cy(0.035, 0.1, -0.38, 0.835, -0.12, '#dfe7ea', 0.032), bx(0.012, 0.16, 0.01, -0.39, 0.88, -0.12, '#8a9c83'), bx(0.012, 0.16, 0.01, -0.37, 0.88, -0.11, '#c46e4d')], vg);
  // mirror cabinet
  shell(vg, 0, 1.15, -0.24, 0.8, 0.7, 0.13, MAT.oak, { shelves: [1.38, 1.62] });
  vcMesh([cy(0.022, 0.1, -0.25, 1.168, -0.17, '#e9e4da'), cy(0.03, 0.07, -0.15, 1.168, -0.17, '#b86a4b'), bx(0.08, 0.05, 0.06, 0.05, 1.168, -0.17, '#f4f5f2'), cy(0.018, 0.12, 0.2, 1.168, -0.17, '#9fb3c8', 0.012),
    cy(0.028, 0.08, -0.2, 1.396, -0.17, '#8a9c83'), cy(0.028, 0.06, -0.1, 1.396, -0.17, '#e3b25a'), bx(0.1, 0.04, 0.06, 0.15, 1.396, -0.17, '#d8c7a4'),
    cy(0.02, 0.1, -0.2, 1.636, -0.17, '#dfe7ea', 0.015), cy(0.025, 0.07, 0.1, 1.636, -0.17, '#c7cbcd')], vg);
  const mirror = new THREE.MeshStandardMaterial({ color: C('#dfe3e3'), metalness: 1, roughness: 0.03, envMapIntensity: 1.3 });
  hingedDoor(vg, -0.4, 1.15, -0.11, 0.8, 0.7, mirror, -1, { name: 'mirror cabinet', angle: 1.6, dur: 0.5 });
  curUnit = U.bathM;
  boxB(0.76, 0.01, 0.02, glowMat('#fff3e0', 0.02, 1.5), 0, 1.138, -0.13, vg, false);
  curUnit = null;
  potMesh(0.4, 0.13, 0.05, 0.08, MAT.terracotta, vg, 0.835); plantBush(0.4, 0.915, 0.13, 0.6, vg);
  blob(-7.1, 2.035, 1.0, 0.48, PI, 0.3);
  foot(-7.1, 2.035, 1.02, 0.48, PI);
}

// ---- walk-in shower ----
const rainGeo = new THREE.BufferGeometry(), RAIN_N = 110, rainPos = new Float32Array(RAIN_N * 6), rainSeed = [];
for (let i = 0; i < RAIN_N; i++){ const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.13; rainSeed.push({ x: -8.5 + Math.cos(a) * r, z: 1.675 + Math.sin(a) * r, y: Math.random() * 2.15, v: 4 + Math.random() * 1.5 }); }
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainCol = new Float32Array(RAIN_N * 6).fill(0.85); rainGeo.setAttribute('color', new THREE.BufferAttribute(rainCol, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 }));
rain.visible = false; rain.frustumCulled = false; scene.add(rain); movers.push(rain);
{
  const sf = mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshStandardMaterial({ map: TX.stone, color: C('#c9c2b6'), roughness: 0.3 }), -8.325, 0.003, 1.675, scene, false, true); sf.rotation.x = -PI / 2;
  boxB(0.06, 0.004, 1.1, M('#8d9295', 0.3, 0.8), -8.86, 0, 1.675, scene, false);
  const glass = new THREE.MeshStandardMaterial({ color: C('#e6f2f2'), roughness: 0.02, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false });
  box(0.01, 2.0, 0.9, glass, -7.725, 1.0, 1.825, scene, false, false).renderOrder = 3;
  boxB(0.022, 0.022, 0.9, matteBlack, -7.725, 1.99, 1.825, scene, false);
  boxB(0.03, 0.02, 0.9, matteBlack, -7.725, 0, 1.825, scene, false);
  boxB(1.2, 0.012, 0.012, matteBlack, -8.325, 1.995, 1.6, scene, false);
  addCol(-7.745, -7.705, 1.375, 2.275);
  planItems.push({ cx: -7.725, cz: 1.825, w: 0.03, d: 0.9, ry: 0, kind: 'f' });
  boxB(0.43, 0.016, 0.016, matteBlack, -8.71, 2.2, 1.675, scene, false);
  cyl(0.13, 0.13, 0.012, matteBlack, -8.5, 2.19, 1.675, scene, 32, false);
  const mx = grp(-8.915, 1.45, PI / 2, scene, 1.1);
  const plate = cyl(0.07, 0.07, 0.012, matteBlack, 0, 0, 0.006, mx, 24, false); plate.rotation.x = PI / 2;
  boxB(0.014, 0.016, 0.1, matteBlack, 0, -0.008, 0.05, mx, false);
  hitProxy(mx, 0.26, 0.3, 0.14, 0, 0, 0.05);
  tagAct(mx, { kind: 'custom', label: () => BATH.shower ? 'Turn off the shower' : 'Turn on the shower', use: () => { BATH.shower = !BATH.shower; sfx('click'); } });
  boxB(0.5, 0.02, 0.12, zelMat, -8.5, 1.2, 2.215, scene, false);
  vcMesh([cy(0.03, 0.18, -8.64, 1.22, 2.21, '#e9e4da', 0.02), cy(0.03, 0.16, -8.55, 1.22, 2.21, '#6d8a66', 0.02), cy(0.035, 0.12, -8.44, 1.22, 2.21, '#c46e4d'), bx(0.08, 0.03, 0.06, -8.33, 1.22, 2.21, '#f4f5f2')]);
}

// ---- towel ladder, basket, plant, light ----
{
  for (const z of [0.38, 0.92]) cyl(0.012, 0.012, 1.0, matteBlack, -6.14, 0.9, z, scene, 8, false);
  for (let k = 0; k < 5; k++){ const r = cyl(0.009, 0.009, 0.54, matteBlack, -6.14, 0.5 + k * 0.22, 0.65, scene, 8, false); r.rotation.x = PI / 2; }
  rboxB(0.025, 0.55, 0.5, 0.01, fabric('#8a9c83', TX.knit), -6.12, 0.83, 0.65, scene, true);
  rboxB(0.03, 0.3, 0.46, 0.01, fabric('#efe9dc', TX.knit), -6.16, 1.1, 0.65, scene, true);
  const basket = new THREE.MeshStandardMaterial({ map: TX.rattan, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
  mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.5, 28, 1, true), basket, -6.36, 0.25, 1.35);
  cyl(0.16, 0.14, 0.44, fabric('#e7e0d3', TX.linen), -6.36, 0.24, 1.35, scene, 24);
  foot(-6.36, 1.35, 0.36, 0.36, 0, true, 'plant');
  plantSnake(-6.33, 2.02, 0.8, M('#e9e4da', 0.4));
  curUnit = U.bathC;
  flushLight(-7.5, 0.55, 0.02, 1.2);
  addPoint(-7.5, 2.45, 0.55, '#fff0dc', 0, 1.0, 5.0);
  curUnit = null;
}

// ---- water, shower and flush effects ----
let waterSrc = null, waterGain = null;
function waterSound(on){
  if (!audio) return;
  if (on && !waterSrc){
    const len = audio.sampleRate * 1.5, buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    waterSrc = audio.createBufferSource(); waterSrc.buffer = buf; waterSrc.loop = true;
    const f = audio.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6;
    waterGain = audio.createGain(); waterGain.gain.value = 0;
    waterGain.gain.linearRampToValueAtTime(0.09, audio.currentTime + 0.3);
    waterSrc.connect(f); f.connect(waterGain); waterGain.connect(audio.destination); waterSrc.start();
  } else if (!on && waterSrc){
    const s = waterSrc; waterGain.gain.linearRampToValueAtTime(0, audio.currentTime + 0.3); setTimeout(() => { try { s.stop(); } catch (_) {} }, 400);
    waterSrc = null;
  }
}
function tubRadius(y){
  for (let i = 0; i < tubInner.length - 1; i++){ const [r0, y0] = tubInner[i], [r1, y1] = tubInner[i + 1]; if (y <= y1) return lerp(r0, r1, clamp((y - y0) / (y1 - y0), 0, 1)); }
  return tubInner[tubInner.length - 1][0];
}
function updateBath(dt, t){
  if (BATH.bathTap){ BATH.draining = false; BATH.level = Math.min(0.45, BATH.level + dt * 0.03); if (BATH.level >= 0.45){ BATH.bathTap = false; toast('The bath is full'); } }
  else if (BATH.draining){ BATH.level = Math.max(0.105, BATH.level - dt * 0.05); if (BATH.level <= 0.105) BATH.draining = false; }
  const lv = BATH.level;
  bathWater.visible = lv > 0.112;
  if (bathWater.visible){ const r = tubRadius(lv); bathWater.position.set(-8.52, lv, -0.3); bathWater.scale.set(r * 0.9, r * 1.9, 1); }
  bathStream.visible = BATH.bathTap;
  if (BATH.bathTap){ const top = 0.93, h = top - lv; bathStream.scale.set(1, h, 1); bathStream.position.set(-8.52, lv + h / 2, 0.38); }
  tapStream.visible = BATH.tap;
  if (BATH.tap) tapStream.scale.set(1 + Math.sin(t * 40) * 0.08, 1, 1 + Math.cos(t * 37) * 0.08);
  rain.visible = BATH.shower;
  if (BATH.shower){
    for (let i = 0; i < RAIN_N; i++){ const d = rainSeed[i]; d.y -= d.v * dt; if (d.y < 0){ d.y = 2.15; } rainPos.set([d.x, d.y, d.z, d.x, d.y - 0.07, d.z], i * 6); }
    rainGeo.attributes.position.needsUpdate = true;
  }
  if (BATH.flushT > 0){ BATH.flushT -= dt; bowlWater.rotation.z += dt * 9; const k = Math.sin(clamp(BATH.flushT / 2.4, 0, 1) * PI); bowlWater.scale.set(1 - k * 0.35, 1.25 * (1 - k * 0.35), 1); bowlWater.position.y = 0.252 - k * 0.02; }
  waterSound(BATH.tap || BATH.shower || BATH.bathTap || BATH.kitchenTap);
}
