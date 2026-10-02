
// ================= SHOES, POND AND FOOTPRINTS =================
const SHOES = {
  trainers: { name: 'trainers', col: '#f1efe9', sole: '#cfccc4', accent: '#2f6fb3', print: 'wave', len: 0.27, wid: 0.1 },
  boots: { name: 'garden wellies', col: '#3a6b45', sole: '#2b2c2d', accent: '#2b2c2d', print: 'lug', len: 0.3, wid: 0.11, tall: 0.24, wader: true },
  hiking: { name: 'hiking boots', col: '#7a4f30', sole: '#2b2c2d', accent: '#c46e4d', print: 'hike', len: 0.29, wid: 0.11, tall: 0.12 },
  flipflops: { name: 'flip-flops', col: '#e86f8a', sole: '#e86f8a', accent: '#f6f1e7', print: 'flip', len: 0.26, wid: 0.095, open: true }
};
const FOOT = { wearing: null, mud: 0, wet: 0, dist: 0, side: 1, warnT: 0, wipeT: 0, soakedOnce: false, inPond: false };
function wearingLabel(){ return FOOT.wearing ? SHOES[FOOT.wearing].name.charAt(0).toUpperCase() + SHOES[FOOT.wearing].name.slice(1) : 'Barefoot'; }
// ---- a shoe model (origin at the heel-centre of the sole, toe toward local -z) ----
function shoeModel(key, mirror = 1){
  const S = SHOES[key], g = new THREE.Group(), L = S.len, W = S.wid, up = M(S.col, 0.55), so = M(S.sole, 0.8), ac = M(S.accent, 0.5);
  rboxB(W, 0.025, L, 0.01, so, 0, 0, -L / 2 + 0.04, g, false, 2);
  if (S.open){
    const a = boxB(0.012, 0.012, 0.11, ac, mirror * 0.022, 0.025, -L * 0.55, g, false); a.rotation.y = 0.5 * mirror;
    const b = boxB(0.012, 0.012, 0.11, ac, -mirror * 0.022, 0.025, -L * 0.55, g, false); b.rotation.y = -0.5 * mirror;
  } else {
    rboxB(W * 0.94, 0.065, L * 0.62, 0.025, up, 0, 0.022, -L * 0.24, g, false, 2);
    const toe = sph(W * 0.48, up, 0, 0.035, -L * 0.66, g, 1, 0.65, 1.3, 12); toe.castShadow = false;
    if (S.tall) cyl(W * 0.47, W * 0.5, S.tall, up, 0, 0.06 + S.tall / 2, -0.01, g, 14, false);
    if (key === 'trainers'){ boxB(0.004, 0.025, L * 0.4, ac, mirror * W * 0.48, 0.035, -L * 0.25, g, false); for (let k = 0; k < 3; k++) boxB(W * 0.5, 0.006, 0.01, M('#e9e4da', 0.6), 0, 0.086, -L * (0.42 + k * 0.06), g, false); }
    if (key === 'hiking') for (let k = 0; k < 4; k++) boxB(W * 0.55, 0.006, 0.01, ac, 0, 0.088 + (k < 2 ? 0 : 0.02), -L * (0.38 + k * 0.05), g, false);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}
function bareFoot(mirror = 1){
  const g = new THREE.Group(), skin = M('#d9a77c', 0.6);
  rboxB(0.09, 0.04, 0.22, 0.02, skin, 0, 0, -0.1, g, false, 2);
  for (let k = 0; k < 5; k++) sph(0.011 + (k === 0 ? 0.006 : 0), skin, mirror * (0.035 - k * 0.018), 0.018, -0.225 + Math.abs(k - 0.5) * 0.004, g, 1, 0.8, 1, 8);
  return g;
}
// ---- the shoe rack by the front door ----
const rackSlots = {};
{
  const g = grp(-1.52, 4.72, PI, scene, 0), wood = MAT.oak;
  for (const s of [-1, 1]) boxB(0.025, 0.46, 0.3, wood, s * 0.31, 0, 0, g);
  for (const y of [0.04, 0.24, 0.44]) boxB(0.64, 0.02, 0.3, wood, 0, y, 0, g, true, true);
  const keys = ['trainers', 'boots', 'hiking', 'flipflops'];
  keys.forEach((k, i) => {
    const slot = new THREE.Group(); slot.position.set(-0.15 + (i % 2) * 0.3, i < 2 ? 0.26 : 0.06, 0.02); g.add(slot);
    const pair = new THREE.Group(); slot.add(pair);
    for (const m of [-1, 1]){ const sh = shoeModel(k, m); sh.position.set(m * 0.055, 0.01, -0.1); sh.rotation.y = PI; sh.scale.setScalar(0.85); pair.add(sh); }
    hitProxy(slot, 0.27, 0.19, 0.3, 0, 0.08, 0);
    rackSlots[k] = pair;
    tagAct(slot, { kind: 'custom', label: () => FOOT.wearing === k ? `Take off the ${SHOES[k].name}` : FOOT.wearing ? `Swap to the ${SHOES[k].name}` : `Put on the ${SHOES[k].name}`, use: () => wearShoes(FOOT.wearing === k ? null : k) });
  });
  foot(-1.52, 4.72, 0.66, 0.32, PI);
}
function wearShoes(k){
  if (FOOT.wearing) rackSlots[FOOT.wearing].visible = true;
  FOOT.wearing = k; if (k) rackSlots[k].visible = false;
  FOOT.mud = 0; FOOT.wet = 0; buildFeet(); refreshFinds(); sfx('pick');
  toast(k ? `You put on the ${SHOES[k].name}` : 'Shoes off. Barefoot again.');
}
// ---- your own feet, visible when you look down ----
const feetG = new THREE.Group(); scene.add(feetG); movers.push(feetG);
const feet = [];
function buildFeet(){
  feetG.clear(); feet.length = 0;
  for (const m of [-1, 1]){ const f = FOOT.wearing ? shoeModel(FOOT.wearing, m) : bareFoot(m); f.traverse(o => { if (o.isMesh) o.material = o.material.clone(); }); f.position.x = m * 0.1; feetG.add(f); feet.push(f); }
}
buildFeet();
// ---- pond behind the house ----
const POND = { x: 5.0, z: -8.7 }, WATER_Y = GY - 0.045;
function pondR(a){ return 2.35 + 0.22 * Math.sin(3 * a + 1) + 0.1 * Math.sin(5 * a + 2); }
function inPond(x, z){ const dx = x - POND.x, dz = z - POND.z, d = Math.hypot(dx, dz); return d < pondR(Math.atan2(dz, dx)) - 0.05; }
{
  const A = TPOS.array, Rm = 2.9, i0 = Math.floor((POND.x - Rm - YARD.x0) / TCELL), i1 = Math.ceil((POND.x + Rm - YARD.x0) / TCELL), j0 = Math.floor((POND.z - Rm - YARD.z0) / TCELL), j1 = Math.ceil((POND.z + Rm - YARD.z0) / TCELL);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){
    const v = j * TROW + i, dx = A[v * 3] - POND.x, dz = A[v * 3 + 2] - POND.z, d = Math.hypot(dx, dz), r = pondR(Math.atan2(dz, dx));
    if (d < r + 0.1){ const t = clamp((r + 0.1 - d) / (r + 0.1), 0, 1); A[v * 3 + 1] = GY - 0.32 * smooth(clamp(t / 0.22, 0, 1)) - 1.4 * smooth(clamp((t - 0.3) / 0.45, 0, 1)); TDIG.array[v] = d < r ? 1 : 0.4; }
  }
  refreshTerrain([i0, i1, j0, j1]);
  const pts = []; for (let k = 0; k < 64; k++){ const a = k / 64 * TAU, r = pondR(a); pts.push(new THREE.Vector2(Math.cos(a) * r, -Math.sin(a) * r)); }
  const wg = new THREE.ShapeGeometry(new THREE.Shape(pts)); wg.rotateX(-PI / 2);
  const rip = canvasTex(256, 256, (c, W) => { c.fillStyle = '#7fb0c2'; c.fillRect(0, 0, W, W); c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; const r = RNG(9); for (let k = 0; k < 40; k++){ c.beginPath(); const x = r() * W, y = r() * W; c.ellipse(x, y, 10 + r() * 30, 3 + r() * 6, 0, 0, TAU); c.stroke(); } });
  rip.repeat.set(0.6, 0.6);
  const water = mesh(wg, new THREE.MeshStandardMaterial({ map: rip, color: C('#9ccbd8'), roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }), POND.x, WATER_Y, POND.z, scene, false, true);
  water.renderOrder = 3; POND.water = water;
  const P = [], r = RNG(77);
  for (let k = 0; k < 46; k++){ const a = k / 46 * TAU + r() * 0.05, rr = pondR(a) + 0.12 + r() * 0.08, s = new THREE.DodecahedronGeometry(0.07 + r() * 0.06, 0); s.scale(1, 0.55, 1); s.translate(POND.x + Math.cos(a) * rr, GY + 0.01, POND.z + Math.sin(a) * rr); P.push(tint(s, ['#9c9990', '#8a877f', '#b1ada4'][k % 3])); }
  for (const [a, rr] of [[0.6, 1.5], [2.3, 1.7], [4.1, 1.2], [5.2, 1.8], [1.4, 1.9]]){ const pad = new THREE.CircleGeometry(0.16, 16, 0.3, TAU - 0.6); pad.rotateX(-PI / 2); pad.rotateY(a); pad.translate(POND.x + Math.cos(a) * rr, GY - 0.04, POND.z + Math.sin(a) * rr); P.push(tint(pad, '#4d7c43')); }
  P.push(sp(0.05, POND.x + Math.cos(0.6) * 1.5, GY - 0.02, POND.z + Math.sin(0.6) * 1.5, '#f2a7c3', 1, 0.6, 1));
  for (let k = 0; k < 14; k++){ const a = 3.3 + r() * 0.5, rr = pondR(a) - 0.1 + r() * 0.2, h = 0.5 + r() * 0.5, b = new THREE.CylinderGeometry(0.006, 0.01, h, 4); b.translate(0, h / 2, 0); b.rotateZ((r() - 0.5) * 0.3); b.translate(POND.x + Math.cos(a) * rr, GY - 0.1, POND.z + Math.sin(a) * rr); P.push(tint(b, '#6b8a3f')); }
  vcMesh(P);
}
// ripples
const ripples = [];
for (let k = 0; k < 10; k++){ const m = mesh(new THREE.RingGeometry(0.8, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }), 0, 0, 0, scene, false, false); m.rotation.x = -PI / 2; m.visible = false; m.renderOrder = 4; movers.push(m); ripples.push({ m, t: 1 }); }
function ripple(x, z){ const r = ripples.find(q => q.t >= 1) || ripples[0]; r.t = 0; r.m.position.set(x, GY - 0.04, z); r.m.visible = true; }

// ---- footprints ----
const PRINT_TEX = {};
function printTex(kind){
  if (PRINT_TEX[kind]) return PRINT_TEX[kind];
  const t = canvasTex(64, 160, (c, W, Hh) => {
    c.clearRect(0, 0, W, Hh); c.fillStyle = '#fff';
    const sole = () => { c.beginPath(); c.ellipse(W / 2, Hh * 0.3, W * 0.42, Hh * 0.27, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(W / 2, Hh * 0.78, W * 0.32, Hh * 0.19, 0, 0, TAU); c.fill(); c.fillRect(W * 0.22, Hh * 0.3, W * 0.56, Hh * 0.45); };
    if (kind === 'bare'){ c.beginPath(); c.ellipse(W / 2, Hh * 0.38, W * 0.34, Hh * 0.2, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(W * 0.55, Hh * 0.6, W * 0.22, Hh * 0.13, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(W / 2, Hh * 0.82, W * 0.26, Hh * 0.13, 0, 0, TAU); c.fill(); [[0.32, 0.12, 9], [0.48, 0.08, 7], [0.62, 0.09, 6], [0.74, 0.12, 5.5], [0.84, 0.17, 5]].forEach(([x, y, r]) => { c.beginPath(); c.arc(W * x, Hh * y, r, 0, TAU); c.fill(); }); return; }
    sole();
    c.globalCompositeOperation = 'destination-out';
    if (kind === 'wave'){ c.lineWidth = 4; for (let y = 14; y < Hh - 8; y += 11){ c.beginPath(); for (let x = 0; x <= W; x += 4) c.lineTo(x, y + Math.sin(x * 0.25) * 3); c.stroke(); } }
    else if (kind === 'lug' || kind === 'hike'){ for (let y = 10; y < Hh - 6; y += 14) for (let x = 10; x < W - 6; x += 15) c.fillRect(x + ((y / 14) % 2) * 5, y, 9, 6); if (kind === 'hike') c.fillRect(0, Hh * 0.56, W, 12); }
    else if (kind === 'flip'){ c.beginPath(); c.arc(W * 0.47, Hh * 0.17, 4, 0, TAU); c.fill(); }
  });
  PRINT_TEX[kind] = t; return t;
}
const PRINTS = [], PRINT_N = 220;
const printGeo = new THREE.PlaneGeometry(1, 1); printGeo.rotateX(-PI / 2);
for (let k = 0; k < PRINT_N; k++){
  const m = new THREE.Mesh(printGeo, new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 0.9, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.visible = false; m.renderOrder = 2; scene.add(m); movers.push(m); PRINTS.push({ m, life: 0, max: 1, op: 0, soil: false });
}
let printIdx = 0;
const footRay = new THREE.Raycaster(), _fv = new THREE.Vector3(), _fd = new THREE.Vector3(0, -1, 0);
function footSurface(x, z){
  const fl = floorAt(x, z); footRay.set(_fv.set(x, player.fy + 0.45, z), _fd); footRay.far = player.fy + 0.45 - fl + 0.02; footRay.camera = camera;
  for (const h of footRay.intersectObjects(scene.children, true)){
    const o = h.object; if (!o.visible || !h.face || o.isSprite || o.isLine || o.isLineSegments || isUnder(o, feetG) || isUnder(o, catRoot) || (o.material && o.material.transparent)) continue;
    if (h.face.normal.clone().transformDirection(o.matrixWorld).y < 0.7) continue;
    return Math.max(fl, h.point.y);
  }
  return fl;
}
function placePrint(x, z, yaw, side, kind, col, opacity, life, soil){
  const P = PRINTS[printIdx]; printIdx = (printIdx + 1) % PRINT_N;
  const S = FOOT.wearing ? SHOES[FOOT.wearing] : { len: 0.24, wid: 0.095 };
  P.m.material.map = printTex(kind); P.m.material.color.set(col); P.m.material.needsUpdate = true;
  P.m.position.set(x, footSurface(x, z) + 0.004, z); P.m.rotation.set(0, yaw, 0); P.m.scale.set(S.wid * side, 1, S.len);
  P.op = opacity; P.m.material.opacity = opacity; P.life = P.max = life; P.soil = soil; P.m.visible = true;
}
function surfaceType(x, z){
  if (roomAt(x, z) === 'Bathroom' && BATH.shower && x < -7.7 && z > 1.05) return 'shower';
  if (inHouse(x, z) || (x > -9.25 && x < 7.3 && z > -5.3 && z < 5.3)) return Math.hypot(x + 0.6, z - 4.55) < 0.4 ? 'mat' : 'floor';
  if (inPond(x, z)) return 'water';
  if (z > 14.1 || (Math.abs(x + 0.6) < 0.4 && z > 5.3 && z < 14.1)) return 'hard';
  if (x < YARD.x0 || x > YARD.x1 || z < YARD.z0) return 'grass';
  const i = Math.round((x - YARD.x0) / TCELL), j = Math.round((z - YARD.z0) / TCELL), v = j * TROW + i;
  if (TDIG.array[v] > 0.5 || terrainH(x, z) < GY - 0.04) return 'soil';
  return 'grass';
}
function squelch(){ if (!audio) return; const now = audio.currentTime, len = audio.sampleRate * 0.18, b = audio.createBuffer(1, len, audio.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2); const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(); s.buffer = b; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0.18; s.connect(f); f.connect(g); g.connect(audio.destination); s.start(now); }
function splash(){ if (!audio) return; const now = audio.currentTime, len = audio.sampleRate * 0.35, b = audio.createBuffer(1, len, audio.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.7; g.gain.value = 0.25; s.connect(f); f.connect(g); g.connect(audio.destination); s.start(now); }
function step(){
  FOOT.side = -FOOT.side;
  const yaw = player.yaw, rx = Math.cos(yaw), rz = -Math.sin(yaw), x = player.x + rx * 0.1 * FOOT.side, z = player.z + rz * 0.1 * FOOT.side;
  const kind = FOOT.wearing ? SHOES[FOOT.wearing].print : 'bare', st = surfaceType(x, z);
  if (st === 'water'){
    ripple(x, z); splash(); for (let k = 0; k < 6; k++) emit('drop', new THREE.Vector3(x, GY - 0.02, z), new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.8 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8));
    FOOT.wet = 1; FOOT.mud = Math.max(0, FOOT.mud - 0.35); addDirt('pond', 0.04);
    if (!FOOT.soakedOnce && FOOT.wearing && !SHOES[FOOT.wearing].wader){ FOOT.soakedOnce = true; toast(`Splash! Your ${SHOES[FOOT.wearing].name} are soaked. The wellies would keep you dry.`); }
    return;
  }
  if (st === 'shower'){ FOOT.wet = 1; return; }
  if (st === 'soil'){
    placePrint(x, z, yaw, FOOT.side, kind, '#1a0f08', 0.7, 1e9, true); addDirt('soil', FOOT.wearing ? 0.01 : 0.03);
    if (FOOT.mud < 0.3 && FOOT.wearing === 'flipflops') toast('Squelch! Mud between your toes.');
    FOOT.mud = Math.min(1, FOOT.mud + 0.3); if (Math.random() < 0.4) squelch();
    return;
  }
  if (st === 'mat'){ if (FOOT.mud > 0.05 || FOOT.wet > 0.2){ if (FOOT.wipeT <= 0) toast('You wiped your feet on the mat'); FOOT.wipeT = 6; } FOOT.mud *= 0.3; FOOT.wet *= 0.4; return; }
  if (st === 'grass'){ if (FOOT.mud > 0.25){ placePrint(x, z, yaw, FOOT.side, kind, '#2e1b0e', 0.25 + FOOT.mud * 0.45, 40, false); FOOT.mud -= 0.05; } FOOT.wet = Math.max(0, FOOT.wet - 0.12); return; }
  // floors, path stones, pavement
  if (FOOT.mud > 0.04){ placePrint(x, z, yaw, FOOT.side, kind, '#2e1b0e', Math.min(0.92, 0.45 + FOOT.mud * 0.6), st === 'floor' ? 180 : 70, false); FOOT.mud = Math.max(0, FOOT.mud - 0.07); }
  else if (FOOT.wet > 0.05){ placePrint(x, z, yaw, FOOT.side, kind, '#1c2a33', Math.min(0.5, 0.15 + FOOT.wet * 0.4), 25, false); FOOT.wet = Math.max(0, FOOT.wet - 0.07); }
}
let lastWalked = 0, rippleT = 0;
function updateFeet(dt, t){
  FOOT.warnT -= dt; FOOT.wipeT -= dt;
  // bare feet in a running bath get wet too
  if (seatState && seatState.s.rec && seatState.s.rec.label === 'Get in the bath' && BATH.level > 0.2) FOOT.wet = 1;
  // footsteps
  const d = player.walked - lastWalked; lastWalked = player.walked;
  if (!seatState && !player.climb && player.vy === 0 && started){ FOOT.dist += d; const stride = player.crouch ? 0.42 : 0.6; if (FOOT.dist > stride){ FOOT.dist = 0; step(); } }
  // in the pond: gentle ripples while you stand still
  FOOT.inPond = inPond(player.x, player.z); if (FOOT.inPond){ rippleT -= dt; if (rippleT <= 0){ rippleT = 1.2; ripple(player.x, player.z); } }
  // your feet
  const show = !seatState && started && !swimming;
  feetG.visible = show;
  if (show){
    feetG.position.set(player.x, player.fy + (FOOT.inPond ? 0 : 0.001), player.z); feetG.rotation.y = player.yaw;
    const b = player.bobAmp, ph = player.bob * 0.5;
    feet.forEach((f, i) => { const s = i ? 1 : -1, sw = Math.sin(ph) * s * b; f.position.z = 0.04 - sw * 0.16; f.position.y = Math.max(0, Math.cos(ph) * s) * 0.04 * b; f.rotation.x = -sw * 0.25; });
  }
  for (const P of PRINTS){
    if (!P.m.visible) continue;
    if (P.soil){ if (Math.abs(P.m.position.y - 0.004 - terrainH(P.m.position.x, P.m.position.z)) > 0.04) P.m.visible = false; continue; }
    P.life -= dt; P.m.material.opacity = P.op * Math.min(1, P.life / (P.max * 0.4));
    if (P.life <= 0) P.m.visible = false;
  }
  for (const r of ripples){ if (r.t >= 1) continue; r.t = Math.min(1, r.t + dt / 1.4); r.m.scale.setScalar(0.1 + r.t * 0.6); r.m.material.opacity = (1 - r.t) * 0.45; if (r.t >= 1) r.m.visible = false; }
  if (POND.water) POND.water.material.map.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.01);
}
// no going outside barefoot
function shoeRule(p){
  if (FOOT.wearing) return;
  if (player.z < 5.0 && p.z > 4.86 && p.x > -1.2 && p.x < 0.0){
    p.z = 4.86;
    if (FOOT.warnT <= 0){ FOOT.warnT = 3; toast('Put on some shoes before you go out. The shoe rack is by the door.'); }
  }
}
