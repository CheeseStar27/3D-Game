
// ================= ITEMS: pick up, use, put down =================
scene.add(camera);
const hand = new THREE.Group(); camera.add(hand);
const ITEMS = [], THROWABLES = []; let held = null, heldAnim = null;
const ray2 = new THREE.Raycaster(); ray2.far = 2.6;
const tmpV = new THREE.Vector3(), tmpF = new THREE.Vector3();

function makeItem(id, name, g, o){
  const it = { id, name, g, o, home: { p: g.position.clone(), ry: g.rotation.y }, st: {} };
  scene.add(g); movers.push(g);
  it.rec = { kind: 'item', item: it };
  tagAct(g, it.rec); ITEMS.push(it); rayList = null; return it;
}
function setShadows(g, on){ g.traverse(o => { if (o.isMesh) o.castShadow = on; }); }
function floorAt(x, z){ const inside = (x > -6.3 && x < 7.3 && z > -5.3 && z < 5.3) || (x > -9.25 && x < -5.9 && z > -1.5 && z < 2.6); return inside ? 0 : terrainH(x, z); }
function inHouse(x, z){ return (x > -5.95 && x < 6.95 && z > -4.95 && z < 4.95) || (x > -8.95 && x < -6 && z > -1.2 && z < 2.3); }
function holdPose(it){ const h = it.o.hold; it.g.position.set(h[0], h[1], h[2]); it.g.rotation.set(h[3] || 0, h[4] || 0, h[5] || 0); it.g.scale.setScalar(1); }
function pickUp(it){
  if (it.st.gone) return;
  if (held){ const tgt = it.g.position.clone(); tgt.y += 0.002; tossTo(tgt); }
  it.vel = null; it.settle = null; hand.add(it.g); holdPose(it); setShadows(it.g, false);
  held = it; heldAnim = null; sfx('pick'); if (it.o.onPick) it.o.onPick(it); refreshHeld();
}
function putDownAt(it, p, ry){
  if (it.o.onDrop) it.o.onDrop(it);
  scene.add(it.g); it.g.position.copy(p); const rr = it.o.restR; it.g.rotation.set(rr ? rr[0] : 0, ry, rr ? (rr[1] || 0) : 0); if (it.o.restY) it.g.position.y += it.o.restY; it.g.scale.setScalar(1); setShadows(it.g, true);
  if (held === it){ held = null; heldAnim = null; }
  refreshHeld();
}
function isUnder(o, root){ while (o){ if (o === root) return true; o = o.parent; } return false; }
function surfaceHit(){
  ray2.setFromCamera(rayCenter, camera);
  const hits = ray2.intersectObjects(scene.children, true);
  const td = typeof terrainRay === 'function' ? terrainRay(ray2.ray.origin, ray2.ray.direction, 2.6) : null;
  for (const h of hits){
    const o = h.object;
    if (td != null && td < h.distance) break;
    if (!o.visible || !h.face || o.isSprite || o.isLine || o.isLineSegments || (held && isUnder(o, held.g)) || o === sky) continue;
    if (o.material && o.material.transparent && o.material.opacity < 0.3) continue;
    const n = h.face.normal.clone().transformDirection(o.matrixWorld);
    return n.y > 0.7 ? h.point : null;
  }
  if (td != null){ const q = ray2.ray.at(td, new THREE.Vector3()); return terrainNormalY(q.x, q.z) > 0.7 ? q : null; }
  return null;
}
// ---- letting go: everything leaves your hand with real motion ----
const DOWN = new THREE.Vector3(0, -1, 0), downRay = new THREE.Raycaster(), _dv = new THREE.Vector3();
function restQuat(it, yaw){ const r = it.o.restR; return new THREE.Quaternion().setFromEuler(new THREE.Euler(r ? r[0] : 0, yaw, r ? (r[1] || 0) : 0, it.g.rotation.order)); }
function releaseHeld(vel, av, mode){
  const it = held; if (!it) return null;
  if (it.o.onDrop) it.o.onDrop(it);
  it.g.updateWorldMatrix(true, false);
  const wp = new THREE.Vector3(), wq = new THREE.Quaternion(); it.g.getWorldPosition(wp); it.g.getWorldQuaternion(wq);
  scene.add(it.g); it.g.position.copy(wp); it.g.quaternion.copy(wq); it.g.scale.setScalar(1); setShadows(it.g, true);
  held = null; heldAnim = null; refreshHeld();
  it.vel = vel; it.av = av; it.mode = mode; it.settle = null; it.prevY = wp.y; it.r = it.r || (it.o.heavy ? 0.1 : 0.06);
  if (!THROWABLES.includes(it)) THROWABLES.push(it);
  return it;
}
// toss the held item in an arc so it lands on a point
function tossTo(target){
  const it = held; if (!it) return;
  it.g.updateWorldMatrix(true, false);
  const start = it.g.getWorldPosition(new THREE.Vector3()), T = clamp(start.distanceTo(target) / 3.2, 0.25, 0.6);
  const vel = new THREE.Vector3((target.x - start.x) / T, (target.y - start.y + 4.9 * T * T) / T, (target.z - start.z) / T);
  const yaw = player.yaw + (it.o.restRy || 0);
  releaseHeld(vel, null, 'place'); it.placeYaw = yaw; it.placeQ = restQuat(it, yaw);
}
function putDown(){
  if (!held || heldAnim) return;
  const p = surfaceHit();
  if (p){ p.y += 0.002; tossTo(p); sfx('whoosh'); }
  else { releaseHeld(new THREE.Vector3(player.vx * 0.6, 0.4, player.vz * 0.6), new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4), 'drop'); }
}
function throwHeld(){
  if (!held || heldAnim) return;
  const it = held; initAudio();
  animHeld(0.22, k => { const h = it.o.hold; it.g.position.set(h[0], h[1] + Math.sin(k * PI) * 0.06, h[2] + Math.sin(k * PI) * 0.14); }, () => {
    const heavy = !!it.o.heavy, f = forwardV().multiplyScalar(heavy ? 3.4 : 5.6);
    const vel = f.add(new THREE.Vector3(player.vx, heavy ? 1.0 : 1.4, player.vz));
    const av = it.ballMesh ? null : new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 12);
    releaseHeld(vel, av, 'throw'); sfx('whoosh');
    if (!heavy) catNotice('ball', it);
  });
}
// what's directly under a flying item: furniture tops, beds, shelves, floor or lawn
function surfaceBelow(it){
  const p = it.g.position, fl = floorAt(p.x, p.z), top = Math.max(p.y, it.prevY != null ? it.prevY : p.y) + 0.02;
  if (top <= fl) return fl;
  downRay.set(_dv.set(p.x, top, p.z), DOWN); downRay.far = top - fl + 0.01; downRay.camera = camera;
  for (const h of downRay.intersectObjects(scene.children, true)){
    const o = h.object;
    if (!o.visible || !h.face || o.isSprite || o.isLine || o.isLineSegments || o === sky || isUnder(o, it.g) || isUnder(o, catRoot)) continue;
    if (o.material && o.material.transparent && o.material.opacity < 0.3) continue;
    if (h.face.normal.clone().transformDirection(o.matrixWorld).y < 0.6) continue;
    return Math.max(fl, h.point.y);
  }
  return fl;
}
function useHeld(){
  if (!held || heldAnim) return;
  initAudio(); held.o.use(held);
}
function animHeld(dur, fn, done){ heldAnim = { t: 0, dur, fn, done }; }

// ---------- particles (water drops, steam, sparkles) ----------
const PTEX = {
  soft: canvasTex(64, 64, (g, W) => { const r = g.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, W, W); }),
  star: canvasTex(64, 64, (g, W) => { g.fillStyle = '#fff'; g.beginPath(); for (let i = 0; i < 8; i++){ const a = i / 8 * TAU, r = i % 2 ? 7 : 30; g.lineTo(W / 2 + Math.cos(a) * r, W / 2 + Math.sin(a) * r); } g.fill(); })
};
const parts = [];
for (let i = 0; i < 90; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: PTEX.soft, transparent: true, depthWrite: false })); s.visible = false; s.frustumCulled = false; scene.add(s); parts.push({ s, life: 0 }); movers.push(s); }
function emit(kind, p, v, col){
  const q = parts.find(q => q.life <= 0); if (!q) return;
  const cfg = { drop: ['#9fd0e6', PTEX.soft, 0.03, 1.2, 1], steam: ['#ffffff', PTEX.soft, 0.06, 1.6, 0], spark: ['#fff3b0', PTEX.star, 0.05, 1.0, 0], crumb: ['#8a5a2b', PTEX.soft, 0.02, 0.8, 1] }[kind];
  q.kind = kind; q.life = q.max = cfg[3]; q.g = cfg[4]; q.size = cfg[2];
  q.s.material.map = cfg[1]; q.s.material.color.set(cfg[0]); q.s.material.opacity = 1;
  if (col) q.s.material.color.copy(col);
  q.s.position.copy(p); q.v = v.clone(); q.s.visible = true; q.s.scale.setScalar(cfg[2]);
}
function updateParts(dt){
  for (const q of parts){
    if (q.life <= 0) continue;
    q.life -= dt; const k = q.life / q.max;
    q.v.y -= q.g * 9.8 * dt; q.s.position.addScaledVector(q.v, dt);
    const fl = floorAt(q.s.position.x, q.s.position.z);
    if (q.g && q.s.position.y < fl + 0.01){ q.life = Math.min(q.life, 0.15); q.v.set(0, 0, 0); q.s.position.y = fl + 0.01; }
    if (q.kind === 'steam'){ q.s.scale.setScalar(q.size * (1 + (1 - k) * 2)); q.s.material.opacity = k * 0.35; }
    else if (q.kind === 'spark'){ q.s.material.opacity = Math.min(1, k * 2); q.s.material.rotation += dt * 3; }
    else q.s.material.opacity = Math.min(1, k * 3) * 0.85;
    if (q.life <= 0) q.s.visible = false;
  }
}

// ---------- item models ----------
function camWorld(local){ return camera.localToWorld(tmpV.set(local[0], local[1], local[2]).clone()); }
function forwardV(){ return camera.getWorldDirection(tmpF).clone(); }
// yarn ball
const yarnTex = canvasTex(256, 128, (g, W, Hh) => { g.fillStyle = '#d96f78'; g.fillRect(0, 0, W, Hh); g.strokeStyle = 'rgba(120,30,45,0.45)'; g.lineWidth = 2; for (let i = 0; i < 70; i++){ g.beginPath(); const y = Math.random() * Hh; g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + (Math.random() - 0.5) * 60, W * 0.7, y + (Math.random() - 0.5) * 60, W, y + (Math.random() - 0.5) * 20); g.stroke(); } noisePass(g, W, Hh, 14, 5); });
const ballItem = (() => {
  const g = new THREE.Group(); g.position.set(-3.1, 0.012, 1.7);
  const b = sph(0.06, new THREE.MeshStandardMaterial({ map: yarnTex, roughness: 1 }), 0, 0.06, 0, g, 1, 1, 1, 20);
  const strand = new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, 0.03, 0.02), new THREE.Vector3(0.12, 0.004, 0.05), new THREE.Vector3(0.2, 0.004, 0.02), new THREE.Vector3(0.26, 0.004, 0.08)]);
  mesh(new THREE.TubeGeometry(strand, 20, 0.004, 5, false), M('#d96f78', 1), 0, 0, 0, g, false);
  const it = makeItem('ball', 'yarn ball', g, { hold: [0.22, -0.26, -0.52], verb: 'Throw', use: throwBall });
  it.ballMesh = b; THROWABLES.push(it); return it;
})();
function throwBall(it){ throwHeld(); }
const winCols = mapWins.map(w => w.axis === 'x' ? { x0: w.a, x1: w.b, z0: w.c - T / 2, z1: w.c + T / 2 } : { x0: w.c - T / 2, x1: w.c + T / 2, z0: w.a, z1: w.b });
function ballHit(b, p, v, r){
  const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1), dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
  if (d < r && d > 1e-6){ const nx = dx / d, nz = dz / d; p.x = cx + nx * r; p.z = cz + nz * r; const vn = v.x * nx + v.z * nz; if (vn < 0){ v.x -= 1.5 * vn * nx; v.z -= 1.5 * vn * nz; if (vn < -0.8) sfx('tap'); } }
}
function updateBall(dt){ for (const it of THROWABLES) updateThrown(it, dt); }
function updateThrown(it, dt){
  if (held === it){ it.settle = null; return; }
  if (it.settle){ it.settle.t = Math.min(1, it.settle.t + dt / 0.28); it.g.quaternion.slerpQuaternions(it.settle.q0, it.settle.q1, smooth(it.settle.t)); if (it.settle.t >= 1) it.settle = null; }
  if (!it.vel) return;
  const p = it.g.position, v = it.vel, isBall = !!it.ballMesh, r = it.r || 0.06;
  const surf = surfaceBelow(it); it.prevY = p.y;
  const overFurniture = surf > floorAt(p.x, p.z) + 0.05;
  const n = Math.max(1, Math.ceil(v.length() * dt / 0.035)), h = dt / n;
  let landed = false;
  for (let s = 0; s < n; s++){
    v.y -= 9.8 * h; p.addScaledVector(v, h);
    const fl = Math.max(surf, floorAt(p.x, p.z));
    if (p.y < fl){
      p.y = fl; landed = true; const imp = -v.y;
      if (imp > 1.0){ v.y = imp * (isBall ? 0.42 : it.mode === 'place' ? 0.12 : 0.3); if (imp > 1.6) sfx(imp > 3.5 && it.o.heavy ? 'close' : 'tap'); if (it.av) it.av.multiplyScalar(0.45); }
      else v.y = 0;
      if (it.mode === 'place'){ v.x = 0; v.z = 0; }
      const fr = isBall ? 1.6 : 5; v.x *= Math.max(0, 1 - fr * h); v.z *= Math.max(0, 1 - fr * h);
    }
    if (inHouse(p.x, p.z) && p.y > H - 0.12){ p.y = H - 0.12; v.y = -Math.abs(v.y) * 0.3; }
    for (const b of colliders){
      if (b.off) continue;
      const tall = wallCols.includes(b) || doorCols.includes(b) || (b.x1 - b.x0) > 30 || (b.z1 - b.z0) > 30, fence = !tall && ((b.x1 - b.x0) > 8 || (b.z1 - b.z0) > 8);
      if (!tall && (p.y > (fence ? 1.05 : 0.55) || overFurniture)) continue;
      ballHit(b, p, v, r);
    }
    for (const b of winCols) if (p.y < 2.4) ballHit(b, p, v, r);
  }
  if (!isBall && it.av && !landed && it.mode !== 'place'){ it.g.rotation.x += it.av.x * dt; it.g.rotation.y += it.av.y * dt; it.g.rotation.z += it.av.z * dt; }
  if (it.mode === 'place' && it.placeQ) it.g.quaternion.slerp(it.placeQ, 1 - Math.exp(-12 * dt));
  if (isBall){ it.ballMesh.rotation.x += v.z * dt / r; it.ballMesh.rotation.z -= v.x * dt / r; }
  const sp = Math.hypot(v.x, v.z); it.speed = sp;
  if (sp < 0.05 && Math.abs(v.y) < 0.01 && p.y <= Math.max(surf, floorAt(p.x, p.z)) + 0.001){
    it.vel = null; it.speed = 0;
    if (!isBall){
      const yaw = it.mode === 'place' ? it.placeYaw : new THREE.Euler().setFromQuaternion(it.g.quaternion, 'YXZ').y;
      it.settle = { t: 0, q0: it.g.quaternion.clone(), q1: restQuat(it, yaw) };
      if (it.mode === 'place') sfx('place');
    }
  }
}
// feather wand
const wandItem = (() => {
  const g = new THREE.Group(); g.position.set(2.3, 0.012, 4.3); g.rotation.y = 0.5;
  const st = cyl(0.006, 0.007, 0.55, MAT.oak, 0.275, 0.007, 0, g, 8); st.rotation.z = PI / 2;
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.55, 0.008, 0), new THREE.Vector3(0.62, 0.006, 0.03), new THREE.Vector3(0.68, 0.006, 0.02)]), 12, 0.0015, 4, false), M('#2b2c2d', 0.6), 0, 0, 0, g, false);
  const fp = new THREE.Group(); fp.position.set(0.68, 0.01, 0.02); g.add(fp);
  const P = [];
  [['#3aa6a0', 0], ['#e86f8a', 0.5], ['#f2c14e', -0.5]].forEach(([c, a]) => { const f = leafGeo(0.12, 0.022, 0.1, 0.05, 4); orientLeaf(f, PI / 2 - a * 0.6, 0.05, 0, 0, 0); P.push(tint(f, c)); });
  mesh(merge(P), MAT.leaf, 0, 0, 0, fp, false, false);
  hitProxy(g, 0.8, 0.08, 0.16, 0.36, 0.04, 0);
  const it = makeItem('wand', 'feather wand', g, { hold: [0.14, -0.22, -0.36, 0.45, PI / 2, 0], verb: 'Wave', use: it => {
    animHeld(1.2, k => { it.g.rotation.z = Math.sin(k * TAU * 3) * 0.35; it.g.rotation.x = 0.45 + Math.sin(k * TAU * 1.5) * 0.15; fp.rotation.y = Math.sin(k * TAU * 6) * 0.6; }, () => { it.g.rotation.z = 0; });
    sfx('whoosh'); catNotice('wand');
  } });
  return it;
})();
// treats
const treatTex = canvasTex(128, 192, (g, W, Hh) => { g.fillStyle = '#e8b04a'; g.fillRect(0, 0, W, Hh); g.fillStyle = '#b8643f'; g.fillRect(0, 0, W, 40); g.fillStyle = '#fff8ea'; g.font = '600 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('Treats', W / 2, 90); g.fillStyle = '#5b3a1e'; g.beginPath(); g.ellipse(W / 2, 135, 26, 14, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(W / 2 + 22, 135); g.lineTo(W / 2 + 42, 122); g.lineTo(W / 2 + 42, 148); g.fill(); });
const treatItem = (() => {
  const g = new THREE.Group(); g.position.set(-1.72, 0.92, -4.5);
  rboxB(0.09, 0.13, 0.045, 0.01, new THREE.MeshStandardMaterial({ map: treatTex, roughness: 0.6 }), 0, 0, 0, g, true, 2);
  boxB(0.092, 0.01, 0.03, M('#b8643f', 0.6), 0, 0.13, 0, g, false);
  return makeItem('treats', 'treats', g, { hold: [0.22, -0.28, -0.52, 0, -0.4, 0.1], verb: 'Shake', use: it => {
    const near = Math.hypot(cs.pos.x - camera.position.x, cs.pos.z - camera.position.z) < 1.6 && canPet();
    if (near) { giveTreat(); return; }
    animHeld(0.7, k => { it.g.position.y = -0.28 + Math.sin(k * TAU * 3) * 0.02; it.g.rotation.z = 0.1 + Math.sin(k * TAU * 3) * 0.25; });
    sfx('rattle'); catNotice('treats');
  } });
})();
// mug (fill it at the kettle)
const mugItem = (() => {
  const g = new THREE.Group(); g.position.set(-1.95, 0.92, -4.45);
  mesh(latheGeo([[0, 0], [0.04, 0], [0.042, 0.09], [0.038, 0.09], [0.036, 0.008], [0, 0.008]], 24), M('#e9e4da', 0.35), 0, 0, 0, g);
  const h = mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, PI), M('#e9e4da', 0.35), 0.04, 0.045, 0, g); h.rotation.z = -PI / 2;
  const tea = mesh(new THREE.CircleGeometry(0.036, 20), M('#7a4a28', 0.2), 0, 0.075, 0, g, false, false); tea.rotation.x = -PI / 2; tea.visible = false;
  const it = makeItem('mug', 'mug', g, { hold: [0.2, -0.24, -0.42, 0, -0.6, 0], verb: 'Drink', use: it => {
    if (!it.st.sips){ toast('It\u2019s empty. Fill it at the kettle.'); return; }
    animHeld(1.5, k => { const e = Math.sin(Math.min(1, k * 1.6) * PI / 2) * (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3); it.g.position.set(lerp(0.2, 0.02, e), lerp(-0.24, -0.1, e), lerp(-0.42, -0.24, e)); it.g.rotation.x = -1.0 * e; }, () => {
      it.st.sips--; tea.position.y = 0.035 + it.st.sips * 0.013; tea.visible = it.st.sips > 0; if (!it.st.sips) toast('All gone. That was a nice cup of tea.');
    });
    sfx('slurp');
  } });
  it.tea = tea; return it;
})();
// TV remote
const remoteItem = (() => {
  const g = new THREE.Group(); g.position.set(-3.7, 0.4, 2.72); g.rotation.y = 0.3;
  rboxB(0.048, 0.016, 0.16, 0.007, M('#232526', 0.45), 0, 0, 0, g, true, 2);
  const P = [cy(0.007, 0.004, 0, 0.016, -0.055, '#c0492f')];
  for (let r = 0; r < 4; r++) for (let c = -1; c <= 1; c++) P.push(cy(0.0045, 0.003, c * 0.013, 0.016, -0.02 + r * 0.02, '#8d9295'));
  vcMesh(P, g);
  return makeItem('remote', 'TV remote', g, { hold: [0.17, -0.2, -0.36, 0.35, 0, 0], verb: 'Change channel', use: it => {
    animHeld(0.25, k => { it.g.rotation.x = 0.35 + Math.sin(k * PI) * 0.15; });
    sfx('click');
    if (!tvOn){ setTV(true); toast(CHANNELS[tvChannel] + ' channel'); return; }
    tvChannel = (tvChannel + 1) % CHANNELS.length; toast(CHANNELS[tvChannel] + ' channel');
  } });
})();
// torch
const torchLight = new THREE.SpotLight(C('#fff2dc'), 0, 14, 0.42, 0.5, 1.5);
torchLight.position.set(0.15, -0.15, -0.3); camera.add(torchLight);
const torchTarget = new THREE.Object3D(); torchTarget.position.set(0.05, -0.3, -4); camera.add(torchTarget); torchLight.target = torchTarget;
const torchItem = (() => {
  const g = new THREE.Group(); g.position.set(0.72, 0.764, -2.28); g.rotation.y = PI / 2;
  const b = cyl(0.017, 0.017, 0.15, M('#2f3a36', 0.4, 0.3), 0.075, 0.018, 0, g, 14); b.rotation.z = PI / 2;
  const hd = cyl(0.026, 0.019, 0.05, M('#2f3a36', 0.4, 0.3), 0.175, 0.026, 0, g, 16); hd.rotation.z = PI / 2;
  const lensM = new THREE.MeshStandardMaterial({ color: C('#f4f1e6'), emissive: C('#fff2dc'), emissiveIntensity: 0, roughness: 0.2 });
  const lens = cyl(0.022, 0.022, 0.004, lensM, 0.201, 0.026, 0, g, 16, false); lens.rotation.z = PI / 2;
  boxB(0.02, 0.006, 0.012, M('#c0492f', 0.5), 0.07, 0.034, 0, g, false);
  const it = makeItem('torch', 'torch', g, { hold: [0.17, -0.2, -0.34, 0.05, PI / 2, 0], verb: 'Switch on', use: it => {
    it.st.on = !it.st.on; torchLight.intensity = it.st.on ? 3.2 : 0; lensM.emissiveIntensity = it.st.on ? 2.5 : 0; it.o.verb = it.st.on ? 'Switch off' : 'Switch on'; sfx('click'); refreshHeld();
  }, onDrop: it => { if (it.st.on){ torchLight.intensity = 0; } }, onPick: it => { if (it.st.on) torchLight.intensity = 3.2; } });
  return it;
})();
// watering can
const canItem = (() => {
  const g = new THREE.Group(); g.position.set(-5.2, 0.002, 1.05); g.rotation.y = -0.6;
  const cm = M('#7c917d', 0.45, 0.35);
  cyl(0.075, 0.08, 0.16, cm, 0, 0.08, 0, g, 24);
  const sp = new THREE.CatmullRomCurve3([new THREE.Vector3(0.06, 0.04, 0), new THREE.Vector3(0.15, 0.12, 0), new THREE.Vector3(0.22, 0.2, 0)]);
  mesh(new THREE.TubeGeometry(sp, 12, 0.011, 8, false), cm, 0, 0, 0, g);
  cyl(0.02, 0.014, 0.02, cm, 0.225, 0.205, 0, g, 12).rotation.z = -0.9;
  const hd = mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 20, PI), cm, -0.02, 0.16, 0, g); hd.rotation.y = PI / 2;
  const it = makeItem('can', 'watering can', g, { heavy: true, hold: [0.22, -0.3, -0.5, 0, PI / 2 + 0.25, 0], verb: 'Water', use: it => {
    if (it.st.water <= 0){ toast('The can is empty. Fill it at the kitchen tap.'); return; }
    it.st.water--; sfx('pour');
    animHeld(1.8, k => { const e = Math.sin(Math.min(1, k * 3) * PI / 2) * (k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2); it.g.rotation.z = -0.75 * e; it.g.position.y = -0.3 + 0.05 * e;
      if (e > 0.8) for (let j = 0; j < 2; j++){ const tip = it.g.localToWorld(new THREE.Vector3(0.23, 0.2, 0)); emit('drop', tip, forwardV().multiplyScalar(0.9).add(new THREE.Vector3((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15))); } }, () => {
      const f = forwardV(), px = camera.position.x + f.x * 0.9, pz = camera.position.z + f.z * 0.9;
      let best = null, bd = 1.1; for (const pl of PLANTS){ const d = Math.hypot(pl.x - px, pl.z - pz); if (d < bd){ bd = d; best = pl; } }
      if (best){ for (let i = 0; i < 14; i++) emit('spark', new THREE.Vector3(best.x + (Math.random() - 0.5) * 0.5, best.h * (0.3 + Math.random() * 0.7), best.z + (Math.random() - 0.5) * 0.5), new THREE.Vector3(0, 0.25 + Math.random() * 0.2, 0)); toast('The ' + best.name + ' looks happier'); }
      else if (it.st.water <= 0) toast('The can is empty now');
    });
  } });
  it.st.water = 3; return it;
})();
const PLANTS = [{ x: -5.45, z: 0.55, h: 1.5, name: 'fiddle-leaf fig' }, { x: 0.5, z: 4.55, h: 0.9, name: 'snake plant' }, { x: 1.5, z: -4.45, h: 1.4, name: 'fiddle-leaf fig' }, { x: 6.5, z: 0.62, h: 0.9, name: 'snake plant' }, { x: -6.33, z: 2.02, h: 0.7, name: 'snake plant' }];
// storybook
const BOOK = [
  ['The Cat Who Ran the House', '', 'A very short story'],
  ['', 'Every morning, Mochi inspected the house. She checked the sunny spot by the window, the soft spot on the sofa, and the warm spot on top of the fridge, which was forbidden and therefore the best.'],
  ['', 'The people who lived there believed they owned the house. Mochi let them believe it. It kept them happy, and happy people open more tins.'],
  ['', 'At night, when the lamps glowed, she climbed onto the bed, turned around exactly three times, and fell asleep in the very middle, where the blanket was warmest.'],
  ['', 'And every evening someone asked, \u201cWhere\u2019s Mochi?\u201d She was always exactly where she wanted to be.'],
  ['The end', '', '']
];
const pageCanvas = makeCanvas(1024, 700), pageCtx = pageCanvas.getContext('2d'), pageTex = new THREE.CanvasTexture(pageCanvas); pageTex.encoding = THREE.sRGBEncoding;
function wrapText(g, text, x, y, w, lh){ const words = text.split(' '); let line = ''; for (const wd of words){ const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > w && line){ g.fillText(line, x, y); line = wd; y += lh; } else line = t; } if (line) g.fillText(line, x, y); }
function drawSpread(i){
  const g = pageCtx, W = 1024, Hh = 700;
  g.fillStyle = '#6d4d3a'; g.fillRect(0, 0, W, Hh);
  for (const s of [0, 1]){
    const x0 = s ? W / 2 + 4 : 14, pw = W / 2 - 18;
    const gr = g.createLinearGradient(x0, 0, x0 + pw, 0); gr.addColorStop(s ? 0 : 1, '#e8dfcc'); gr.addColorStop(s ? 0.12 : 0.88, '#f8f2e4'); gr.addColorStop(s ? 1 : 0, '#f6efdf');
    g.fillStyle = gr; g.fillRect(x0, 14, pw, Hh - 28);
    const pg = BOOK[i * 2 + s]; if (!pg) continue;
    g.fillStyle = '#3a2f28'; g.textAlign = 'center';
    if (pg[0]){ g.font = '600 46px Georgia, serif'; wrapText(g, pg[0], x0 + pw / 2, 250, pw - 90, 56); }
    if (pg[2]){ g.font = 'italic 30px Georgia, serif'; g.fillText(pg[2], x0 + pw / 2, 380); }
    if (pg[1]){ g.font = '31px Georgia, serif'; g.textAlign = 'left'; wrapText(g, pg[1], x0 + 50, 120, pw - 100, 46); }
    g.textAlign = 'center'; g.font = '22px Georgia, serif'; g.fillStyle = '#8a7a66'; g.fillText(String(i * 2 + s + 1), x0 + pw / 2, Hh - 40);
    if (i === 2 && s === 1){ g.fillStyle = '#d98a40'; g.beginPath(); g.ellipse(x0 + pw / 2, 420, 80, 50, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x0 + pw / 2 + 70, 380, 38, 0, TAU); g.fill(); g.beginPath(); g.moveTo(x0 + pw / 2 + 48, 355); g.lineTo(x0 + pw / 2 + 58, 318); g.lineTo(x0 + pw / 2 + 74, 348); g.fill(); g.beginPath(); g.moveTo(x0 + pw / 2 + 80, 348); g.lineTo(x0 + pw / 2 + 96, 320); g.lineTo(x0 + pw / 2 + 102, 356); g.fill(); g.strokeStyle = '#d98a40'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + pw / 2 - 75, 430); g.quadraticCurveTo(x0 + pw / 2 - 140, 470, x0 + pw / 2 - 60, 480); g.stroke(); }
  }
  pageTex.needsUpdate = true;
}
const bookItem = (() => {
  const g = new THREE.Group(); g.position.set(-2.3, 0.462, 3.12); g.rotation.y = 0.5;
  const closed = new THREE.Group(); g.add(closed);
  rboxB(0.155, 0.032, 0.22, 0.004, M('#44546a', 0.7), 0, 0, 0, closed, true, 2);
  boxB(0.146, 0.026, 0.212, M('#f3ecdc', 0.9), 0.006, 0.003, 0, closed, false);
  const open = mesh(new THREE.PlaneGeometry(0.46, 0.315), new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9, emissive: C('#ffffff'), emissiveMap: pageTex, emissiveIntensity: 0.25 }), 0, 0, 0, g, false, false);
  open.visible = false;
  const it = makeItem('book', 'storybook', g, { hold: [0.2, -0.24, -0.42, 1.1, -0.3, 0], verb: 'Read', use: it => {
    const s = it.st; s.page = s.page == null ? 0 : s.page + 1;
    if (s.page > 2){ s.page = null; closed.visible = true; open.visible = false; holdPose(it); it.o.verb = 'Read'; sfx('page'); refreshHeld(); return; }
    drawSpread(s.page); closed.visible = false; open.visible = true;
    it.g.position.set(0, -0.015, -0.37); it.g.rotation.set(0, 0, 0);
    it.o.verb = s.page < 2 ? 'Turn the page' : 'Close the book'; sfx('page'); refreshHeld();
  }, onDrop: it => { it.st.page = null; closed.visible = true; open.visible = false; it.o.verb = 'Read'; } });
  return it;
})();
// apple
const appleItem = (() => {
  const g = new THREE.Group(); g.position.set(-3.25, 0.775, -2.05);
  const a = sph(0.04, M('#b8322a', 0.35), 0, 0.038, 0, g, 1, 0.92, 1, 18);
  cyl(0.003, 0.002, 0.025, M('#5a4636', 0.8), 0, 0.085, 0, g, 5, false);
  const lf = mesh(leafGeo(0.03, 0.012, 0.1, 0.02, 3), M('#5b8a4a', 0.6), 0.003, 0.09, 0, g, false, false); lf.rotation.set(-1.0, 0.4, -0.8);
  const it = makeItem('apple', 'apple', g, { hold: [0.18, -0.22, -0.38], verb: 'Take a bite', use: it => {
    animHeld(0.9, k => { const e = Math.sin(k * PI); it.g.position.set(lerp(0.18, 0.02, e), lerp(-0.22, -0.1, e), lerp(-0.38, -0.22, e)); }, () => {
      it.st.bites = (it.st.bites || 0) + 1; a.scale.set(1 - it.st.bites * 0.18, 0.92 - it.st.bites * 0.1, 1 - it.st.bites * 0.1);
      if (it.st.bites >= 4){ toast('Crunchy. A new apple will turn up on the table.'); scene.add(it.g); it.g.visible = false; it.st.gone = true; held = null; heldAnim = null; refreshHeld();
        setTimeout(() => { it.st = {}; a.scale.set(1, 0.92, 1); it.g.position.copy(it.home.p); it.g.rotation.set(0, 0, 0); it.g.visible = true; setShadows(it.g, true); }, 30000); }
    });
    setTimeout(() => sfx('crunch'), 420);
  } });
  return it;
})();

// ---------- world interactions that depend on what you're holding ----------
{ // kettle: boil, or pour a cup of tea into the held mug
  const kp = hitProxy(scene, 0.26, 0.26, 0.26, -2.54, 1.02, -4.72);
  tagAct(kp, { kind: 'custom', label: () => held === mugItem ? (mugItem.st.sips ? 'The mug is already full' : 'Pour a cup of tea') : 'Boil the kettle', use: () => {
    const top = new THREE.Vector3(-2.54, 1.13, -4.72);
    for (let i = 0; i < 10; i++) setTimeout(() => emit('steam', top.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.04, 0, (Math.random() - 0.5) * 0.04)), new THREE.Vector3((Math.random() - 0.5) * 0.05, 0.35, (Math.random() - 0.5) * 0.05)), i * 140);
    if (held === mugItem && !mugItem.st.sips){ mugItem.st.sips = 3; mugItem.tea.position.y = 0.074; mugItem.tea.visible = true; sfx('pour'); toast('Tea is ready'); }
    else sfx('boil');
  } });
}
{ // kitchen tap: runs, and refills the watering can
  const kt = mesh(new THREE.CylinderGeometry(0.005, 0.004, 0.2, 8), streamMat, -4.0, 1.07, -4.68, scene, false, false); kt.visible = false; movers.push(kt);
  const kp = hitProxy(scene, 0.22, 0.4, 0.3, -4.0, 1.1, -4.8);
  tagAct(kp, { kind: 'custom', label: () => held === canItem ? 'Fill the watering can' : (kt.visible ? 'Turn off the tap' : 'Turn on the tap'), use: () => {
    if (held === canItem){ canItem.st.water = 3; sfx('pour'); toast('The watering can is full'); kt.visible = true; setTimeout(() => { kt.visible = false; }, 1500); return; }
    kt.visible = !kt.visible; BATH.kitchenTap = kt.visible; sfx('click');
  } });
}

// ---------- Mochi plays ----------
function catCanPlay(){ return !cs.hop && cs.pos.y < 0.1 && cs.mode !== 'free'; }
function catNotice(kind, item){
  const d = Math.hypot(cs.pos.x - camera.position.x, cs.pos.z - camera.position.z);
  if (cs.pos.y > 0.1 || cs.hop){ if (d < 6) toast('Mochi is too cosy to get up'); return; }
  if (cs.mode === 'free'){ if (cs.free.kind === 'come' && kind === 'wand'){ cs.free.waveT = 1.4; cs.free.wand = true; cs.free.t = Math.min(cs.free.t, 8); } return; }
  const sleepy = cs.mode === 'act' && cs.pose === 'sleep';
  if (kind === 'ball'){ if (sleepy && Math.random() < 0.5){ toast('Mochi opens one eye, then goes back to sleep'); return; } startFree('ball'); cs.free.item = item || ballItem; }
  else if (kind === 'wand'){ if (d > 5 || wallBetween(cs.pos.x, cs.pos.z, camera.position.x, camera.position.z)) return; if (sleepy && Math.random() < 0.6) return; startFree('come'); cs.free.wand = true; cs.free.waveT = 1.4; }
  else if (kind === 'treats'){ startFree('come'); if (sleepy) cs.free.react = 1.0; }
}
function startFree(kind){ cs.mode = 'free'; cs.free = { kind, t: 0, react: kind === 'ball' ? 0.35 : 0.3, chk: 0, cd: 1e9, stuck: 0, bats: 0, sit: 0, bat: 0, eat: 0, wait: 0 }; cs.path = null; cs.groom = 0; cs.getUp = 0; }
function endFree(){
  let best = null, bd = 1e9;
  for (const k in NODES){ const n = NODES[k]; if (n.y > 0.1) continue; const d = Math.hypot(n.x - cs.pos.x, n.z - cs.pos.z); if (d < bd && !wallBetween(cs.pos.x, cs.pos.z, n.x, n.z)){ bd = d; best = k; } }
  cs.free = { kind: 'return', node: best || cs.node, t: 0, chk: 0, cd: 1e9, stuck: 0 };
}
function giveTreat(){
  if (cs.mode !== 'free' || cs.free.kind !== 'come') startFree('come');
  const F = cs.free; F.react = 0; F.eat = 2.6; F.arrived = true;
  const tx = cs.pos.x + Math.sin(cs.heading) * 0.24, tz = cs.pos.z + Math.cos(cs.heading) * 0.24;
  treatMesh.position.set(tx, floorAt(tx, tz) + 0.006, tz); treatMesh.visible = true;
  sfx('rattle'); purr(); for (let i = 0; i < 3; i++) setTimeout(() => { head.getWorldPosition(headWorld); spawnHeart(headWorld); }, 400 + i * 500);
}
const treatMesh = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.008, 10), M('#8a5a2b', 0.8), 0, 0, 0, scene, false, false); treatMesh.visible = false; movers.push(treatMesh);
function stepToward(tx, tz, speed, dt, stop){
  const dx = tx - cs.pos.x, dz = tz - cs.pos.z, d = Math.hypot(dx, dz);
  if (d <= stop) return d;
  const want = Math.atan2(dx, dz), turn = angDiff(cs.heading, want);
  cs.heading += clamp(turn, -6 * dt, 6 * dt);
  const sp = Math.min(speed * clamp(1 - Math.abs(turn) / 1.8, 0.25, 1), (d - stop) / Math.max(dt, 1e-3));
  const p = { x: cs.pos.x + Math.sin(cs.heading) * sp * dt, z: cs.pos.z + Math.cos(cs.heading) * sp * dt };
  collide(p, 0.12);
  cs.pos.x = p.x; cs.pos.z = p.z; cs.pos.y = floorAt(p.x, p.z);
  cs.phase += dt * sp * 15;
  return d;
}
function stuckCheck(F, d, dt){ F.chk += dt; if (F.chk > 1){ if (d > F.cd - 0.08) F.stuck++; else F.stuck = 0; F.cd = d; F.chk = 0; } return F.stuck >= 2; }
function updateCatFree(dt, t, P){
  const F = cs.free; F.t += dt;
  if (F.react > 0){ F.react -= dt; return { pose: 'stand', moving: false }; }
  if (F.kind === 'return'){
    const n = NODES[F.node], d = stepToward(n.x, n.z, 0.6, dt, 0.05);
    if (d <= 0.05 || F.t > 12 || stuckCheck(F, d, dt)){ cs.pos.set(n.x, n.y, n.z); cs.free = null; arrive(F.node); return { pose: cs.pose, moving: false }; }
    return { pose: 'walk', moving: true };
  }
  if (F.kind === 'ball'){
    const b = F.item || ballItem, bp = b.g.position;
    if (held === b || F.t > 25 || !inHouse(bp.x, bp.z)){ if (!inHouse(bp.x, bp.z)) toast('Mochi watches the ball roll outside'); endFree(); return { pose: 'stand', moving: false }; }
    if (F.sit > 0){ F.sit -= dt; cs.groom = 1; if (F.sit <= 0){ cs.groom = 0; endFree(); } return { pose: 'sit', moving: false }; }
    if (F.bat > 0){ F.bat -= dt; cs.batT = F.bat; return { pose: 'crouch', moving: false }; }
    if (wallBetween(cs.pos.x, cs.pos.z, bp.x, bp.z)){ F.lost = (F.lost || 0) + dt; if (F.lost > 2){ endFree(); return { pose: 'stand', moving: false }; } } else F.lost = 0;
    const d = Math.hypot(bp.x - cs.pos.x, bp.z - cs.pos.z);
    if (d > 0.27){ stepToward(bp.x, bp.z, b.vel ? 1.5 : 1.1, dt, 0.25); if (stuckCheck(F, d, dt)) endFree(); return { pose: 'walk', moving: true }; }
    if (!b.vel || (b.speed || 0) < 0.5){
      F.bats++;
      if (F.bats > 3){ F.sit = 4.5; return { pose: 'sit', moving: false }; }
      F.bat = 0.45; cs.heading += clamp(angDiff(cs.heading, Math.atan2(bp.x - cs.pos.x, bp.z - cs.pos.z)), -1, 1);
      const a = cs.heading + (Math.random() - 0.5) * 1.3, s = 1.0 + Math.random() * 1.1;
      b.vel = new THREE.Vector3(Math.sin(a) * s, 0.4 + Math.random() * 0.8, Math.cos(a) * s); sfx('tap');
    }
    return { pose: 'crouch', moving: false };
  }
  // 'come': walk up to you (treats or feather wand)
  if (F.eat > 0){ F.eat -= dt; if (F.eat < 0.4) treatMesh.visible = false; if (F.eat <= 0){ treatMesh.visible = false; endFree(); } return { pose: 'eat', moving: false }; }
  const ax = cs.pos.x - P.x, az = cs.pos.z - P.z, al = Math.hypot(ax, az) || 1, tx = P.x + ax / al * 0.6, tz = P.z + az / al * 0.6;
  const d = Math.hypot(tx - cs.pos.x, tz - cs.pos.z);
  if (F.t > 22 || F.wait > 9 || (wallBetween(cs.pos.x, cs.pos.z, P.x, P.z) && F.t > 3)){ endFree(); return { pose: 'stand', moving: false }; }
  if (d > 0.7) F.arrived = false;
  if (!F.arrived){ stepToward(tx, tz, 1.15, dt, 0.12); if (d < 0.15) F.arrived = true; if (stuckCheck(F, d, dt)) F.arrived = true; return { pose: 'walk', moving: true }; }
  cs.heading += clamp(angDiff(cs.heading, Math.atan2(P.x - cs.pos.x, P.z - cs.pos.z)), -4 * dt, 4 * dt);
  const waving = F.waveT > 0; if (waving){ F.waveT -= dt; F.wait = 0; cs.swipe = Math.sin(t * 13) * 0.4; } else F.wait += dt;
  return { pose: waving ? 'reach' : 'sit', moving: false };
}

// ---------- per-frame ----------
function updateItems(dt, t){
  if (held){
    const b = REDUCED ? 0 : player.bobAmp;
    hand.position.set(Math.sin(player.bob * 0.5) * 0.006 * b, Math.abs(Math.sin(player.bob)) * -0.006 * b, 0);
    if (heldAnim){ heldAnim.t += dt; const k = Math.min(1, heldAnim.t / heldAnim.dur); heldAnim.fn(k); if (k >= 1){ const a = heldAnim; heldAnim = null; if (held && !(held.id === 'book' && held.st.page != null)) holdPose(held); if (a.done) a.done(); } }
    if (held === mugItem && mugItem.st.sips && Math.random() < dt * 3) emit('steam', mugItem.g.localToWorld(new THREE.Vector3(0, 0.09, 0)), new THREE.Vector3(0, 0.12, 0));
  }
  updateBall(dt); updateParts(dt);
}

// ---------- TV channels (the remote cycles them) ----------
function drawTV(t){ if (tvChannel === 1) drawFire(t); else if (tvChannel === 2) drawNature(t); else drawAquarium(t); }
function drawFire(t){
  const g = tvCtx, W = 384, Hh = 216, base = Hh * 0.82;
  g.fillStyle = '#140b08'; g.fillRect(0, 0, W, Hh);
  g.fillStyle = '#2a1510'; for (let y = 0; y < Hh; y += 18) for (let x = (y / 18) % 2 ? 0 : -20; x < W; x += 40) g.fillRect(x + 1, y + 1, 38, 16);
  const gl = g.createRadialGradient(W / 2, base, 10, W / 2, base, 180); gl.addColorStop(0, 'rgba(255,150,40,0.6)'); gl.addColorStop(1, 'rgba(255,80,0,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, Hh);
  for (let i = 0; i < 9; i++){
    const x = W * 0.27 + i * W * 0.058, h = 62 + 38 * Math.sin(t * 6 + i * 1.7) + 18 * Math.sin(t * 11 + i);
    const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, 'rgba(255,240,150,0)'); gr.addColorStop(0.3, 'rgba(255,200,60,0.85)'); gr.addColorStop(1, 'rgba(230,80,20,0.95)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(x - 18, base); g.quadraticCurveTo(x - 14 + Math.sin(t * 7 + i) * 6, base - h * 0.6, x + Math.sin(t * 9 + i) * 8, base - h); g.quadraticCurveTo(x + 14 + Math.sin(t * 5 + i) * 6, base - h * 0.5, x + 18, base); g.fill();
  }
  g.fillStyle = '#4a2a18'; g.save(); g.translate(W / 2, Hh * 0.87); g.rotate(0.1); g.fillRect(-110, -10, 220, 20); g.rotate(-0.2); g.fillRect(-105, -8, 210, 17); g.restore();
  g.fillStyle = '#ffb45c'; for (let i = 0; i < 16; i++){ const x = W * 0.3 + ((i * 37 + t * 18) % (W * 0.4)), y = base - ((t * 45 + i * 23) % 130); g.globalAlpha = 0.7 * (1 - (base - y) / 130); g.fillRect(x, y, 2, 2); } g.globalAlpha = 1;
  tvTex.needsUpdate = true;
}
function drawNature(t){
  const g = tvCtx, W = 384, Hh = 216;
  const sk = g.createLinearGradient(0, 0, 0, Hh); sk.addColorStop(0, '#7fb2dd'); sk.addColorStop(0.7, '#f3d9b0'); g.fillStyle = sk; g.fillRect(0, 0, W, Hh);
  g.fillStyle = 'rgba(255,238,190,0.95)'; g.beginPath(); g.arc(W * 0.72, Hh * 0.38, 22, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 4; i++){ const x = ((i * 120 + t * (8 + i * 3)) % (W + 120)) - 60, y = 30 + i * 16; g.beginPath(); g.ellipse(x, y, 34, 10, 0, 0, TAU); g.ellipse(x + 20, y - 6, 22, 9, 0, 0, TAU); g.fill(); }
  [['#8fae7c', 0.62, 16, 0.012], ['#6f9463', 0.72, 20, 0.018], ['#557a4e', 0.84, 14, 0.025]].forEach(([c, y0, a, f], k) => {
    g.fillStyle = c; g.beginPath(); g.moveTo(0, Hh);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, Hh * y0 - Math.sin(x * f + k * 2 + t * 0.05 * (k + 1)) * a);
    g.lineTo(W, Hh); g.fill();
  });
  g.strokeStyle = '#2f3b37'; g.lineWidth = 1.6;
  for (let i = 0; i < 4; i++){ const x = ((i * 60 + t * 22) % (W + 60)) - 30, y = 60 + i * 9 + Math.sin(t * 2 + i) * 4, w = Math.sin(t * 10 + i * 2) * 4; g.beginPath(); g.moveTo(x - 6, y - w); g.lineTo(x, y); g.lineTo(x + 6, y - w); g.stroke(); }
  tvTex.needsUpdate = true;
}
