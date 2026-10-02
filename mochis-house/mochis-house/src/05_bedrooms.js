
// ================= BEDROOMS =================
function bed(x, z, ry, w, o){
  const g = grp(x, z, ry), L = 2.08;
  rboxB(w + 0.08, 0.26, L, 0.03, o.frame, 0, 0.1, 0.03, g);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) boxB(0.05, 0.1, 0.05, o.legs || MAT.walnut, sx * (w / 2 - 0.05), 0, 0.03 + sz * (L / 2 - 0.08), g);
  const sheet = fabric('#f5f3ee', TX.linen);
  rboxB(w, 0.22, L - 0.06, 0.05, sheet, 0, 0.36, 0.03, g);
  const duv = fabric(o.duvet, TX.linen), dL = L - 0.52, dz = 0.03 + 0.26;
  rboxB(w + 0.1, 0.3, dL, 0.06, duv, 0, 0.325, dz, g);
  const fold = rbox(w + 0.12, 0.07, 0.2, 0.035, o.sheetFold ? sheet : duv, 0, 0.64, dz - dL / 2 + 0.08, g); fold.rotation.x = 0.05;
  // pillows
  const pw = (w - 0.1) / 2;
  for (const s of [-1, 1]){
    const p = rbox(pw - 0.02, 0.15, 0.4, 0.07, sheet, s * (pw / 2 + 0.02), 0.66, -L / 2 + 0.3, g); p.rotation.x = -0.35;
  }
  o.pillows.forEach(([c, xo, rz, sz], i) => {
    const p = rbox(sz, sz, 0.13, 0.06, fabric(c, TX.linen), xo, 0.58 + sz / 2 + 0.02, -L / 2 + 0.48 + i * 0.06, g); p.rotation.set(-0.3, 0, rz);
  });
  const th = fabric(o.throwCol, o.throwTex || TX.knit);
  rboxB(w + 0.16, 0.03, 0.5, 0.012, th, 0, 0.615, L / 2 - 0.3, g);
  for (const s of [-1, 1]) rboxB(0.03, 0.26, 0.5, 0.012, th, s * (w / 2 + 0.065), 0.36, L / 2 - 0.3, g);
  o.head(g, w, L);
  seatRec(g, [[-w * 0.25, 1.0, -0.42, -0.1], [w * 0.25, 1.0, -0.42, -0.1]], 'Sit on the bed');
  return g;
}
function channelHead(mat){
  return (g, w, L) => {
    const n = Math.round((w + 0.2) / 0.15), cw = (w + 0.2) / n;
    for (let i = 0; i < n; i++) rboxB(cw - 0.004, 1.08, 0.12, 0.055, mat, -(w + 0.2) / 2 + cw * (i + 0.5), 0.2, -L / 2 - 0.02, g, true, 3);
  };
}
function caneHead(){
  return (g, w, L) => {
    const W = w + 0.16, hh = 0.75, y0 = 0.45;
    const cane = new THREE.MeshStandardMaterial({ map: TX.rattan, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.8 });
    mesh(new THREE.PlaneGeometry(W - 0.08, hh - 0.08), cane, 0, y0 + hh / 2, -L / 2 - 0.02, g, true, true);
    boxB(W, 0.04, 0.05, MAT.oak, 0, y0 + hh - 0.04, -L / 2 - 0.02, g); boxB(W, 0.04, 0.05, MAT.oak, 0, y0, -L / 2 - 0.02, g);
    for (const s of [-1, 1]) boxB(0.05, y0 + hh, 0.06, MAT.oak, s * (W / 2 - 0.025), 0, -L / 2 - 0.02, g);
  };
}
function nightstand(x, z, ry, mat, lampSide, unit){
  const g = grp(x, z, ry);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(0.016, 0.01, 0.14, mat, sx * 0.2, 0.07, sz * 0.15, g, 8);
  rboxB(0.48, 0.42, 0.4, 0.012, mat, 0, 0.14, 0, g);
  drawer(g, 0, 0.415, 0.2, 0.46, 0.14, 0.32, mat, { pull: 'knob', fill: fillBedside });
  // lamp (click to switch)
  curUnit = unit;
  const lx = -0.07 * lampSide, lg = new THREE.Group(); g.add(lg);
  mesh(latheGeo([[0, 0], [0.06, 0], [0.085, 0.07], [0.08, 0.15], [0.04, 0.24], [0.012, 0.27], [0, 0.27]], 24), M('#d9cdb7', 0.3), lx, 0.56, -0.03, lg);
  lampShade(0.11, 0.14, 0.19, lx, 0.93, -0.03, lg, '#f1e9da', 0.05, 1.2);
  sph(0.025, glowMat('#fff1d6', 0, 2.0), lx, 0.88, -0.03, lg).castShadow = false;
  g.updateMatrixWorld(true);
  const wp = g.localToWorld(new THREE.Vector3(lx, 0.9, 0.05));
  addPoint(wp.x, wp.y, wp.z, '#ffc98c', 0, 0.6, 3.6);
  curUnit = null;
  tagAct(lg, { kind: 'lamp', unit });
  bookStack(0.1 * lampSide, 0.56, 0.04, 2, g, (x * 10) | 0, 0.3);
  cyl(0.028, 0.025, 0.09, new THREE.MeshStandardMaterial({ color: C('#eef3f4'), roughness: 0.05, transparent: true, opacity: 0.45 }), 0.14 * lampSide, 0.645, -0.1, g, 14, false);
  blob(x, z, 0.48, 0.4, ry, 0.35);
  foot(x, z, 0.48, 0.4, ry);
}
function wardrobe(x, z, ry, w, mat, seed = 1){
  const g = grp(x, z, ry), r = RNG(seed);
  boxB(w - 0.04, 0.08, 0.54, M('#2c2622', 0.8), 0, 0, -0.02, g, false);
  shell(g, 0, 0.08, -0.3, w, 2.14, 0.58, mat, { shelves: [1.95] });
  const rail = cyl(0.012, 0.012, w - 0.05, MAT.steel, 0, 1.84, -0.01, g, 10, false); rail.rotation.z = PI / 2;
  const P = [], n = Math.floor((w - 0.14) / 0.075);
  for (let i = 0; i < n; i++){
    const hx = -w / 2 + 0.09 + i * 0.075 + (r() - 0.5) * 0.02, len = 0.6 + r() * 0.45, col = CLOTH[(r() * CLOTH.length) | 0];
    P.push(bx(0.02, 0.01, 0.36, hx, 1.8, -0.01, '#b58b5e'));
    P.push(bx(0.025, len, 0.4 + r() * 0.06, hx, 1.8 - len, -0.01, col));
  }
  for (let k = 0; k < 3; k++) P.push(bx(0.3, 0.04 + r() * 0.03, 0.34, -w / 2 + 0.2 + k * 0.36 * (w / 1.2), 1.966, -0.04, CLOTH[(r() * CLOTH.length) | 0]));
  P.push(bx(0.34, 0.2, 0.3, w / 2 - 0.22, 1.966, -0.05, '#d8c7a4'));
  for (let k = 0; k < 2; k++){ const sx = -w / 2 + 0.2 + k * 0.3; P.push(bx(0.09, 0.07, 0.24, sx, 0.098, 0.05, k ? '#e9e4da' : '#6d6a64'), bx(0.09, 0.07, 0.24, sx + 0.11, 0.098, 0.05, k ? '#e9e4da' : '#6d6a64')); }
  vcMesh(P, g);
  for (const s of [-1, 1]){
    hingedDoor(g, s * w / 2, 0.1, 0.28, w / 2, 2.1, mat, s, { angle: 1.7, dur: 0.6, name: 'wardrobe', handleInset: 0.045,
      handle: (p, hx, h, t) => boxB(0.014, 0.42, 0.02, MAT.black, hx, 0.82, t / 2 + 0.01, p, false) });
  }
  blob(x, z, w, 0.6, ry, 0.45);
  foot(x, z, w, 0.6, ry);
}

// ---------- main bedroom ----------
rug(4.0, -3.05, 2.6, 2.2, berberTex());
bed(4.0, -3.78, 0, 1.6, {
  frame: fabric('#e3d9ca'), duvet: '#f1eee8', throwCol: '#b86a4b', throwTex: TX.linen, sheetFold: true,
  pillows: [['#8f9e89', -0.4, 0.1, 0.44], ['#d8c8ad', 0.4, -0.1, 0.44], ['#b86a4b', 0, 0, 0.34]],
  head: channelHead(fabric('#e3d9ca'))
});
blob(4.0, -3.72, 1.7, 2.1, 0, 0.5); foot(4.0, -3.78, 1.72, 2.2, 0);
nightstand(2.85, -4.62, 0, MAT.walnut, -1, U.bed1L);
nightstand(5.15, -4.62, 0, MAT.walnut, 1, U.bed1R);
artFrame(artTex('hills', 768, 384), 1.1, 0.55, 4.0, 1.68, -4.905, 0, MAT.oak, 0.06);
wardrobe(6.63, -1.15, -PI / 2, 1.2, MAT.lightWood);
{ // dresser + round mirror
  const x = 3.2, z = -0.31, g = grp(x, z, PI);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]){ const l = cyl(0.02, 0.012, 0.18, MAT.walnut, sx * 0.54, 0.09, sz * 0.18, g, 8); l.rotation.z = sx * 0.08; }
  boxB(1.2, 0.64, 0.46, MAT.walnut, 0, 0.17, 0, g);
  for (let c = 0; c < 2; c++) for (let r = 0; r < 3; r++){
    const cx = -0.3 + c * 0.6, cy = 0.2 + r * 0.205;
    drawer(g, cx, cy, 0.23, 0.59, 0.198, 0.4, MAT.walnut, { pullY: 0.14, fill: (dg, iw, th, d) => fillClothes(dg, iw, th, d, c * 3 + r + 1) });
  }
  rboxB(0.3, 0.015, 0.18, 0.006, M('#e7e1d6', 0.35), -0.3, 0.81, 0.02, g);
  cyl(0.025, 0.025, 0.1, new THREE.MeshStandardMaterial({ color: C('#d8b07a'), roughness: 0.05, transparent: true, opacity: 0.7 }), -0.38, 0.875, 0.02, g, 12, false);
  sph(0.012, MAT.black, -0.38, 0.935, 0.02, g);
  vase(0.35, 0.81, 0, 0.2, M('#b98a62', 0.5), g, 0);
  stems(x - 0.35, 1.0, z, 0.25, 6, scene, '#98a88a', 23);
  bookStack(0.0, 0.81, 0.03, 2, g, 41, 0.1);
  blob(x, z, 1.2, 0.46, PI, 0.4);
  foot(x, z, 1.2, 0.47, PI);
  const mg = grp(x, -0.09, PI, scene, 1.55);
  const rim = mesh(new THREE.TorusGeometry(0.36, 0.016, 12, 64), MAT.brass, 0, 0, 0, mg); 
  mesh(new THREE.CircleGeometry(0.36, 64), new THREE.MeshStandardMaterial({ color: C('#dfe3e3'), metalness: 1, roughness: 0.03, envMapIntensity: 1.3 }), 0, 0, -0.004, mg, false, false);
}
plantFiddle(1.5, -4.45, 0.92, MAT.terracotta);
function flushLight(x, z, day, night){
  cyl(0.2, 0.2, 0.02, MAT.white, x, H - 0.01, z, scene, 32, false);
  const d = sph(0.18, glowMat('#fff5e6', day, night, new THREE.MeshStandardMaterial({ color: C('#f7f3ea'), roughness: 0.3 })), x, H - 0.02, z, scene, 1, 0.28, 1, 32);
  d.castShadow = false;
}
curUnit = U.bed1c;
flushLight(4.0, -2.5, 0.02, 1.2);
addPoint(4.0, 2.45, -2.5, '#ffe2bd', 0, 1.1, 5.5);
curUnit = null;

// ---------- second bedroom ----------
{
  const rj = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.012, 64), [new THREE.MeshStandardMaterial({ color: C('#b2956a'), roughness: 1 }), new THREE.MeshStandardMaterial({ map: roundJuteTex(), roughness: 1 }), MAT.soil]);
  rj.position.set(4.1, 0.006, 2.75); rj.receiveShadow = true; scene.add(rj);
  planItems.push({ cx: 4.1, cz: 2.75, w: 2.2, d: 2.2, ry: 0, kind: 'rugRound' });
}
bed(5.795, 3.0, -PI / 2, 1.4, {
  frame: MAT.oak, legs: MAT.oak, duvet: '#d6dde0', throwCol: '#d8c7a4', throwTex: TX.knit,
  pillows: [['#e9e1d0', -0.33, 0.1, 0.4], ['#5d7482', 0.33, -0.08, 0.4]],
  head: caneHead()
});
blob(5.8, 3.0, 1.5, 2.1, -PI / 2, 0.5); foot(5.795, 3.0, 1.52, 2.2, -PI / 2);
nightstand(6.66, 1.75, -PI / 2, MAT.oak, 1, U.bed2L);
nightstand(6.66, 4.25, -PI / 2, MAT.oak, -1, U.bed2R);
wardrobe(4.5, 0.375, 0, 1.2, M('#e9e6df', 0.5), 7);
{ // desk
  const x = 3.1, z = 4.62, g = grp(x, z, PI);
  rboxB(1.2, 0.03, 0.58, 0.01, MAT.oak, 0, 0.72, 0, g);
  for (const sx of [-1, 1]){
    for (const sz of [-1, 1]) boxB(0.03, 0.72, 0.03, MAT.black, sx * 0.56, 0, sz * 0.25, g);
    boxB(0.03, 0.03, 0.5, MAT.black, sx * 0.56, 0.08, 0, g);
  }
  boxB(1.1, 0.03, 0.03, MAT.black, 0, 0.66, -0.25, g);
  // laptop
  const lg = grp(0.05, 0.05, 0, g, 0.75);
  rboxB(0.32, 0.014, 0.22, 0.005, M('#b9bdc1', 0.35, 0.7), 0, 0, 0, lg);
  boxB(0.28, 0.002, 0.1, M('#2b2d30', 0.6), 0, 0.014, -0.03, lg, false);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.012, -0.11); hinge.rotation.x = -0.28; lg.add(hinge);
  rboxB(0.32, 0.21, 0.007, 0.004, M('#b9bdc1', 0.35, 0.7), 0, 0, 0, hinge);
  mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: laptopTex(), emissiveIntensity: 0.8, roughness: 0.2 }), 0, 0.105, 0.0041, hinge, false, false);
  // desk lamp
  curUnit = U.desk;
  const dl = new THREE.Group(); g.add(dl);
  cyl(0.07, 0.075, 0.02, MAT.black, -0.45, 0.76, -0.12, dl, 20);
  const arm = cyl(0.008, 0.008, 0.42, MAT.black, -0.45, 0.97, -0.12, dl, 8); arm.rotation.z = 0.2;
  const head = mesh(new THREE.ConeGeometry(0.075, 0.13, 24, 1, true), new THREE.MeshStandardMaterial({ color: C('#1f2221'), roughness: 0.5, side: THREE.DoubleSide }), -0.36, 1.12, -0.12, dl);
  head.rotation.z = -2.3;
  sph(0.022, glowMat('#fff1d6', 0, 1.8), -0.33, 1.1, -0.12, dl).castShadow = false;
  curUnit = null;
  tagAct(dl, { kind: 'lamp', unit: U.desk });
  // mug, notebook, little plant
  mesh(latheGeo([[0, 0], [0.04, 0], [0.042, 0.09], [0.038, 0.09], [0.036, 0.008], [0, 0.008]], 20), M('#c46e4d', 0.4), 0.38, 0.75, 0.08, g);
  rboxB(0.2, 0.012, 0.27, 0.004, M('#2f3e4f', 0.8), 0.36, 0.75, -0.1, g).rotation.y = 0.2;
  potMesh(0.48, -0.2, 0.05, 0.08, MAT.ceramic, g, 0.75); plantBush(0.48, 0.83, -0.2, 0.6, g);
  blob(x, z, 1.2, 0.58, PI, 0.35);
  foot(x, z, 1.2, 0.58, PI);
  chair(3.1, 3.98, 0, fabric('#5d7482', TX.fabric, 0.9), MAT.walnut);
}
{ // cat bed
  const x = 1.62, z = 4.35;
  const sherpa = fabric('#efe7da', fabricTex(8, 60, 0.02));
  const t = mesh(new THREE.TorusGeometry(0.21, 0.075, 14, 36), sherpa, x, 0.07, z); t.rotation.x = PI / 2; t.scale.set(1, 1, 0.9);
  cyl(0.21, 0.21, 0.05, sherpa, x, 0.03, z, scene, 32);
  blob(x, z, 0.55, 0.55, 0, 0.4, 0.004, true);
  planItems.push({ cx: x, cz: z, w: 0.58, d: 0.58, ry: 0, kind: 'catbed' });
}
artFrame(artTex('leaf', 400, 500), 0.36, 0.46, 1.091, 1.5, 2.3, PI / 2, MAT.black, 0.04);
artFrame(artTex('sun', 480, 600), 0.46, 0.58, 1.091, 1.55, 2.92, PI / 2, MAT.oak, 0.05);
artFrame(artTex('waves', 400, 500), 0.36, 0.46, 1.091, 1.5, 3.54, PI / 2, MAT.black, 0.04);
artFrame(artTex('blocks', 600, 420), 0.7, 0.49, 2.45, 1.58, 0.091, 0, MAT.oak, 0.05);
plantSnake(6.5, 0.62, 1.1, M('#e9e4da', 0.4));
{ // paper lantern
  curUnit = U.lantern;
  const x = 3.9, z = 2.5;
  cyl(0.005, 0.005, H - 2.35, MAT.black, x, (H + 2.35) / 2, z, scene, 6, false);
  cyl(0.05, 0.05, 0.025, MAT.white, x, H - 0.012, z, scene, 16, false);
  const lan = sph(0.27, glowMat('#fff3e0', 0.03, 1.3, new THREE.MeshStandardMaterial({ color: C('#f6f1e7'), roughness: 0.9, map: TX.linen })), x, 2.12, z, scene, 1, 0.92, 1, 32);
  lan.castShadow = false;
  for (let i = 0; i < 6; i++){ const r = mesh(new THREE.TorusGeometry(0.27 * Math.sin((i + 1) / 7 * PI) + 0.002, 0.002, 4, 48), M('#d8d0c2', 0.8), x, 2.12 + 0.27 * 0.92 * Math.cos((i + 1) / 7 * PI), z, scene, false, false); r.rotation.x = PI / 2; }
  addPoint(x, 2.0, z, '#ffe2bd', 0, 1.2, 5.5);
  curUnit = null;
}
