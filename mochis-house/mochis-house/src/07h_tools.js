
// ================= DIGGING TOOLS (sold at Hardware & Garden) =================
let shake = 0;
const ladders = [], fuses = [];
const DEEP = 1e6;
function circlePts(r, n = 28){ const P = []; for (let i = 0; i < n; i++){ const a = i / n * TAU; P.push({ x: Math.cos(a) * r, z: Math.sin(a) * r }); } return P; }
function toolTarget(r, reach = 2.8){
  ray2.setFromCamera(rayCenter, camera);
  const td = terrainRay(ray2.ray.origin, ray2.ray.direction, reach);
  if (td == null) return { ok: false, msg: inHouse(camera.position.x, camera.position.z) ? 'Use it outside in the garden' : 'Aim at the ground closer to you' };
  const p = ray2.ray.at(td, new THREE.Vector3()), why = lockReason(p.x, p.z);
  if (why) return { ok: false, msg: why };
  const pts = circlePts(r);
  return { ok: true, cx: p.x, cz: p.z, yaw: 0, pts, boundR: r, area: PI * r * r, kind: 'round', p };
}
function sparks(p, n = 10, col = 'spark'){ for (let i = 0; i < n; i++) emit(col, p.clone().add(new THREE.Vector3(0, 0.05, 0)), new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.6 + Math.random() * 1.2, (Math.random() - 0.5) * 1.2)); }
function clink(){ if (!audio) return; const now = audio.currentTime, o = audio.createOscillator(), g = audio.createGain(); o.type = 'square'; o.frequency.setValueAtTime(1900, now); o.frequency.exponentialRampToValueAtTime(900, now + 0.12); g.gain.setValueAtTime(0.05, now); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18); o.connect(g); g.connect(audio.destination); o.start(now); o.stop(now + 0.2); sfx('tap'); }

// ---- models ----
const steelM = M('#8d9295', 0.35, 0.8), handleM = new THREE.MeshStandardMaterial({ map: TX.oak, color: C('#c49a6c'), roughness: 0.8 }), redM = M('#c0392b', 0.5), yellowM = M('#e3b23c', 0.5);
B.pickaxe = g => { cyl(0.018, 0.02, 0.85, handleM, 0, 0.425, 0, g, 10); const hd = new THREE.Group(); hd.position.set(0, 0.84, 0); g.add(hd); const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.3, -0.08, 0), new THREE.Vector3(-0.15, 0.01, 0), new THREE.Vector3(0, 0.03, 0), new THREE.Vector3(0.15, 0.01, 0), new THREE.Vector3(0.3, -0.08, 0)]); mesh(new THREE.TubeGeometry(c, 20, 0.02, 8, false), steelM, 0, 0, 0, hd); };
B.auger = g => { const c = new THREE.CatmullRomCurve3(Array.from({ length: 30 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.9) * 0.05, i * 0.022, Math.sin(i * 0.9) * 0.05))); mesh(new THREE.TubeGeometry(c, 80, 0.012, 6, false), steelM, 0, 0, 0, g); cyl(0.012, 0.012, 0.72, steelM, 0, 0.36, 0, g, 8); rboxB(0.22, 0.2, 0.18, 0.03, yellowM, 0, 0.72, 0, g); cyl(0.03, 0.03, 0.12, M('#2b2c2d', 0.6), 0.08, 0.84, 0.0, g, 10).rotation.z = PI / 2; const hb = cyl(0.014, 0.014, 0.7, M('#2b2c2d', 0.6), 0, 0.98, 0, g, 8); hb.rotation.z = PI / 2; };
B.pan = g => { const m = mesh(latheGeo([[0, 0], [0.13, 0.0], [0.19, 0.05], [0.2, 0.052], [0.14, 0.006], [0, 0.006]], 28), M('#3f4246', 0.45, 0.6), 0, 0, 0, g); const r = mesh(new THREE.CircleGeometry(0.12, 24), M('#6b4f35', 0.95), 0, 0.012, 0, g, false, false); r.rotation.x = -PI / 2; r.visible = false; g.userData.dirt = r; };
B.ladder = g => { for (const s of [-1, 1]) boxB(0.05, 3.0, 0.06, handleM, s * 0.22, 0, 0, g); for (let k = 1; k < 10; k++){ const r = cyl(0.016, 0.016, 0.44, handleM, 0, k * 0.3, 0, g, 8); r.rotation.z = PI / 2; } };
B.dynamite = g => { const s = cyl(0.022, 0.022, 0.2, redM, 0, 0.022, 0, g, 14); s.rotation.z = PI / 2; for (const x of [-0.06, 0.06]){ const b = cyl(0.0225, 0.0225, 0.012, M('#2b2c2d', 0.6), x, 0.022, 0, g, 14); b.rotation.z = PI / 2; } mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.1, 0.022, 0), new THREE.Vector3(0.14, 0.04, 0.01), new THREE.Vector3(0.17, 0.035, 0.02)]), 8, 0.003, 4, false), M('#3a2d22', 0.8), 0, 0, 0, g, false); };

// ---- pickaxe: breaks rock, reaches 3 m ----
function usePickaxe(it){
  const tg = toolTarget(0.24);
  if (!tg.ok){ toast(tg.msg); return; }
  let hit = false;
  animHeld(0.75, k => {
    const P = it.g.position, R = it.g.rotation, h = it.o.hold;
    if (k < 0.45){ const e = smooth(k / 0.45); R.x = lerp(h[3], h[3] + 0.9, e); P.y = lerp(h[1], h[1] + 0.12, e); }
    else { const e = smooth((k - 0.45) / 0.55); R.x = lerp(h[3] + 0.9, h[3] - 0.5 + Math.sin(e * PI) * 0.5, e); P.y = lerp(h[1] + 0.12, h[1] - 0.05, e); }
    if (!hit && k > 0.62){ hit = true; tg.step = 0.4; tg.maxD = DEEP; const deep = GY - terrainH(tg.cx, tg.cz) > 0.9; doDig(tg); if (deep){ clink(); sparks(new THREE.Vector3(tg.cx, terrainH(tg.cx, tg.cz), tg.cz), 8); } shake = Math.max(shake, 0.015); }
  });
}
// ---- power auger: narrow shafts that hold their shape ----
function useAuger(it){
  const tg = toolTarget(0.19);
  if (!tg.ok){ toast(tg.msg); return; }
  augerSound(1.4);
  let done = false;
  animHeld(1.5, k => {
    const P = it.g.position, h = it.o.hold;
    P.set(h[0] + (Math.random() - 0.5) * 0.012, lerp(h[1], h[1] - 0.25, Math.sin(Math.min(1, k * 1.2) * PI / 2)) + (Math.random() - 0.5) * 0.01, h[2]);
    it.g.children[0].rotation.y += 0.6;
    shake = Math.max(shake, 0.006);
    if (Math.random() < 0.5) emit('crumb', new THREE.Vector3(tg.cx, terrainH(tg.cx, tg.cz) + 0.05, tg.cz), new THREE.Vector3((Math.random() - 0.5) * 1.4, 0.6 + Math.random() * 0.6, (Math.random() - 0.5) * 1.4));
    if (!done && k > 0.75){
      done = true; tg.step = 1.0; tg.maxD = DEEP; doDig(tg);
      // auger shafts are clean and narrow, so their walls stay up
      const A = TPOS.array, r = 0.42, i0 = Math.max(0, Math.floor((tg.cx - r - YARD.x0) / TCELL)), i1 = Math.min(TNX, Math.ceil((tg.cx + r - YARD.x0) / TCELL)), j0 = Math.max(0, Math.floor((tg.cz - r - YARD.z0) / TCELL)), j1 = Math.min(TNZ, Math.ceil((tg.cz + r - YARD.z0) / TCELL));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++){ const v = j * TROW + i; if (Math.hypot(A[v * 3] - tg.cx, A[v * 3 + 2] - tg.cz) < r) TSUP2[v] = 1; }
    }
  });
}
let augerNode = null;
function augerSound(dur){
  if (!audio) return; const now = audio.currentTime, o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(90, now); o.frequency.linearRampToValueAtTime(140, now + 0.3); f.type = 'lowpass'; f.frequency.value = 700;
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.05, now + 0.1); g.gain.setValueAtTime(0.05, now + dur - 0.2); g.gain.linearRampToValueAtTime(0.0001, now + dur);
  o.connect(f); f.connect(g); g.connect(audio.destination); o.start(now); o.stop(now + dur + 0.05);
}
// ---- gold pan: sift the spoil heaps ----
function usePan(it){
  const tg = toolTarget(0.32);
  if (!tg.ok){ toast(tg.msg); return; }
  if (terrainH(tg.cx, tg.cz) < GY + 0.03){ toast('Sift the dirt piles next to your holes'); return; }
  const dirt = it.g.userData.dirt;
  animHeld(1.6, k => { const h = it.o.hold; it.g.position.set(h[0] + Math.sin(k * TAU * 5) * 0.04, h[1] + Math.abs(Math.sin(k * TAU * 2.5)) * 0.03, h[2]); dirt.visible = k > 0.1 && k < 0.85; if (Math.random() < 0.25) emit('crumb', camWorld([(Math.random() - 0.5) * 0.25, -0.35, -0.5]), new THREE.Vector3(0, -0.2, 0)); }, () => {
    dirt.visible = false; addDirt('soil', 0.04);
    // the sifted soil gets spread out a little
    const A = TPOS.array, bb = brush(tg, (v, w) => { const h = A[v * 3 + 1]; if (h > GY + 0.002) A[v * 3 + 1] = Math.max(GY, h - 0.07 * w); });
    refreshTerrain(bb);
    const r = Math.random(); let name = null, type = null;
    if (r < 0.33){ name = 'gold flake'; type = 'gold'; } else if (r < 0.55){ name = 'pebble'; type = 'stone'; } else if (r < 0.68){ name = 'bottle cap'; type = 'trash'; }
    if (name){ pocket[type]++; pocket.items.push({ type, name }); refreshFinds(); if (type === 'gold'){ chime(); for (let i = 0; i < 6; i++) emit('spark', camWorld([(Math.random() - 0.5) * 0.2, -0.3, -0.5]), new THREE.Vector3(0, 0.15, 0)); } toast(type === 'gold' ? 'A glint in the pan: a gold flake!' : `You sifted out ${name === 'pebble' ? 'a pebble' : 'a bottle cap'}`); }
    else toast('Just dirt this time. Keep sifting.');
  });
  sfx('slide');
}
// ---- ladder: lean it against the side of a hole ----
function nearLadder(x, z){ return ladders.some(l => Math.hypot(l.bx - x, l.bz - z) < 1.0 || Math.hypot(l.tx - x, l.tz - z) < 0.9); }
function useLadder(it){
  ray2.setFromCamera(rayCenter, camera);
  const td = terrainRay(ray2.ray.origin, ray2.ray.direction, 3.2);
  if (td == null){ toast('Aim at the side of a deep hole'); return; }
  const w0 = findWall(ray2.ray.at(td, new THREE.Vector3()));
  if (!w0){ toast('Aim at the side of a deep hole'); return; }
  const p = new THREE.Vector3(w0.x, 0, w0.z), ux = w0.ux, uz = w0.uz;
  let top = -1e9, bot = 1e9;
  for (let s = -1.0; s <= 1.0; s += 0.05){ const hh = terrainH(p.x + ux * s, p.z + uz * s); top = Math.max(top, hh); bot = Math.min(bot, hh); }
  if (top - bot < 0.8){ toast('This hole isn\u2019t deep enough to need a ladder'); return; }
  let ws = 0; const mid = (top + bot) / 2; for (let s = -1.0; s <= 1.0; s += 0.025) if (terrainH(p.x + ux * s, p.z + uz * s) >= mid){ ws = s; break; }
  const wx = p.x + ux * ws, wz = p.z + uz * ws;
  const bx = wx - ux * 0.45, bz = wz - uz * 0.45, by = terrainH(bx, bz), tx = wx + ux * 0.05, tz = wz + uz * 0.05, ty = top + 0.75;
  const dir = new THREE.Vector3(tx - bx, ty - by, tz - bz), L = dir.length(); dir.normalize();
  removeItem(it);
  const g = new THREE.Group(); g.position.set(bx, by, bz); scene.add(g);
  for (const s of [-1, 1]) boxB(0.05, L, 0.06, handleM, s * 0.22, 0, 0, g); for (let k = 1; k * 0.3 < L - 0.1; k++){ const r = cyl(0.016, 0.016, 0.44, handleM, 0, k * 0.3, 0, g, 8); r.rotation.z = PI / 2; }
  const xAx = new THREE.Vector3(-uz, 0, ux).normalize(), zAx = new THREE.Vector3().crossVectors(xAx, dir).normalize();
  g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, dir, zAx));
  const lad = { g, bx, bz, tx, tz };
  const rec = { kind: 'custom', label: () => 'Take the ladder', use: () => { scene.remove(g); ladders.splice(ladders.indexOf(lad), 1); const set = new Set(); g.traverse(o => set.add(o)); for (let i = actMeshes.length - 1; i >= 0; i--) if (set.has(actMeshes[i])) actMeshes.splice(i, 1); rayList = null; const n = makeProduct('ladder'); n.g.position.set(camera.position.x, floorAt(camera.position.x, camera.position.z), camera.position.z); pickUp(n); } };
  g.traverse(o => { if (o.isMesh){ o.userData.act = rec; actMeshes.push(o); } }); rayList = null;
  ladders.push(lad); sfx('close');
  toast('Ladder set up. Walk into it to climb in or out of the hole.');
}
// ---- dynamite ----
function useDynamite(it){
  if (it.st.lit) { toast('It\u2019s already lit. Throw it (G) and get back!'); return; }
  if (inHouse(camera.position.x, camera.position.z) || roomAt(camera.position.x, camera.position.z) !== 'Garden'){ toast('Not here! Only light dynamite out in the garden.'); return; }
  it.st.lit = true; it.st.fuse = 4.0; it.o.verb = 'Fuse lit!'; refreshHeld(); fuses.push(it); sfx('click');
  toast('Fuse lit! Throw it (G) and stand well back.');
}
function explode(it){
  const p = new THREE.Vector3(); it.g.getWorldPosition(p);
  const inHand = held === it;
  removeItem(it); fuses.splice(fuses.indexOf(it), 1);
  if (inHouse(p.x, p.z) || p.z > 14.1 || p.x < -15 || p.x > 16 || p.z < -13){ for (let i = 0; i < 14; i++) emit('steam', p.clone(), new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.3, (Math.random() - 0.5) * 0.4)); toast('The fuse fizzled out. Dynamite only works in the garden.'); return; }
  boom();
  shake = 0.18;
  for (let i = 0; i < 40; i++) emit('crumb', p.clone().add(new THREE.Vector3(0, 0.2, 0)), new THREE.Vector3((Math.random() - 0.5) * 6, 2 + Math.random() * 4, (Math.random() - 0.5) * 6));
  for (let i = 0; i < 22; i++) emit('steam', p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.2 + Math.random() * 0.6, (Math.random() - 0.5) * 1.2)), new THREE.Vector3((Math.random() - 0.5) * 0.8, 0.5 + Math.random() * 0.6, (Math.random() - 0.5) * 0.8));
  flash.position.copy(p).add(new THREE.Vector3(0, 0.6, 0)); flash.userData.t = 1; flash.visible = true;
  const t = { ok: true, cx: p.x, cz: p.z, yaw: 0, pts: circlePts(1.0, 36), boundR: 1.0, area: PI, kind: 'round', step: 0.9, maxD: DEEP };
  doDig(t);
  const d = Math.hypot(player.x - p.x, player.z - p.z);
  if (d < 4.5 || inHand) addDirt('soot', Math.min(1, 0.7 * (1 - Math.min(d, 4.5) / 4.5) + (inHand ? 0.6 : 0)));
  if (d < 3.2 || inHand){ const k = (3.2 - Math.min(d, 3.2)) / 3.2 + (inHand ? 0.5 : 0); player.vy = 2.5 + k * 2; const ax = (player.x - p.x) / (d || 1), az = (player.z - p.z) / (d || 1); player.vx += ax * 4 * k; player.vz += az * 4 * k; player.fy += 0.02; }
  if (cs.pos.y < 0.5 && Math.hypot(cs.pos.x - p.x, cs.pos.z - p.z) < 25 && cs.mode === 'act' && cs.pose === 'sleep'){ cs.actT = 0.1; }
  setTimeout(() => toast(inHand ? 'BOOM! That was close. Throw it next time!' : 'BOOM! A big crater. Check the edges for finds.'), 300);
}
const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: PTEX.soft, color: 0xffd28a, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
flash.visible = false; flash.userData.t = 0; scene.add(flash); movers.push(flash);
function boom(){
  if (!audio) return; const now = audio.currentTime;
  const len = audio.sampleRate * 1.6, buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain(); s.buffer = buf; f.type = 'lowpass'; f.frequency.setValueAtTime(900, now); f.frequency.exponentialRampToValueAtTime(90, now + 1.2); g.gain.value = 0.7;
  s.connect(f); f.connect(g); g.connect(audio.destination); s.start(now);
  const o = audio.createOscillator(), og = audio.createGain(); o.frequency.setValueAtTime(70, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.8); og.gain.setValueAtTime(0.5, now); og.gain.exponentialRampToValueAtTime(0.0001, now + 0.9); o.connect(og); og.connect(audio.destination); o.start(now); o.stop(now + 1);
}

// ---- add them to the hardware shop ----
Object.assign(PRODUCTS, {
  pickaxe: { name: 'pickaxe', price: 35, color: '#8d9295', desc: 'Smashes through rock fast. Deep down there are gems, fossils and relics.', build: B.pickaxe, hold: [0.3, -0.55, -0.75, 0.3, -0.2, -0.5], order: 'YXZ', restR: [PI / 2, 0], restY: 0.03, heavy: true, verb: 'Swing', use: usePickaxe },
  auger: { name: 'power auger', price: 120, color: '#e3b23c', desc: 'Drills a narrow shaft 1 m deeper per go. Its walls stay up.', build: B.auger, hold: [0.18, -0.95, -0.95, 0, 0, 0], order: 'YXZ', restR: [PI / 2, 0], restY: 0.05, heavy: true, verb: 'Drill', use: useAuger },
  pan: { name: 'gold pan', price: 18, color: '#3f4246', desc: 'Sift your dirt piles for gold flakes.', build: B.pan, hold: [0.12, -0.38, -0.5, 0.35, 0, 0], verb: 'Sift', use: usePan },
  ladder: { name: 'ladder', price: 25, color: '#c49a6c', desc: 'Lean it on the side of a deep hole to climb in and out.', build: B.ladder, hold: [0.42, -0.42, -0.25, -1.45, 0.08, 0], order: 'YXZ', restR: [PI / 2, 0], restY: 0.03, heavy: true, verb: 'Set up', use: useLadder },
  dynamite: { name: 'stick of dynamite', price: 30, color: '#c0392b', desc: 'Blasts a big crater. Light it, throw it, stand back.', build: B.dynamite, hold: [0.18, -0.24, -0.4, 0, 0.6, 0], verb: 'Light the fuse', use: useDynamite }
});
SHOPS[0].items.push('pickaxe', 'auger', 'pan', 'ladder', 'dynamite');
SHOPS[0].sub = 'Tools for digging, and things for the garden';

function updateTools(dt, t){
  shake *= Math.exp(-6 * dt); if (shake < 0.0005) shake = 0;
  if (flash.visible){ flash.userData.t -= dt * 2.2; const k = Math.max(0, flash.userData.t); flash.scale.setScalar(1 + (1 - k) * 5); flash.material.opacity = k; if (k <= 0) flash.visible = false; }
  for (let i = fuses.length - 1; i >= 0; i--){
    const it = fuses[i]; it.st.fuse -= dt;
    const tip = it.g.localToWorld(new THREE.Vector3(0.17, 0.035, 0.02));
    if (Math.random() < 0.7) emit('spark', tip, new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.4, (Math.random() - 0.5) * 0.4));
    if (Math.random() < dt * 8) sfx('rattle');
    if (it.st.fuse <= 0) explode(it);
  }
}
