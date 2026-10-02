
// ================= MOCHI THE CAT =================
function catHeadTex(){
  return canvasTex(512, 256, (g, W, Hh) => {
    const grd = g.createLinearGradient(0, 0, 0, Hh); grd.addColorStop(0, '#c4722c'); grd.addColorStop(0.45, '#db8a40'); grd.addColorStop(1, '#e9a661');
    g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
    const fx = W * 0.25;
    const m = g.createRadialGradient(fx, Hh * 0.95, 4, fx, Hh * 0.95, Hh * 0.46);
    m.addColorStop(0, 'rgba(247,234,212,1)'); m.addColorStop(0.55, 'rgba(247,234,212,0.92)'); m.addColorStop(1, 'rgba(247,234,212,0)');
    g.fillStyle = m; g.fillRect(0, 0, W, Hh);
    g.strokeStyle = 'rgba(128,62,20,0.8)'; g.lineCap = 'round';
    for (const [dx, w, y0, y1] of [[0, 7, 0.06, 0.4], [-13, 5, 0.1, 0.38], [13, 5, 0.1, 0.38], [-24, 4, 0.15, 0.35], [24, 4, 0.15, 0.35]]){
      g.lineWidth = w; g.beginPath(); g.moveTo(fx + dx * 0.5, Hh * y0); g.quadraticCurveTo(fx + dx * 0.9, Hh * (y0 + y1) / 2, fx + dx * 1.25, Hh * y1); g.stroke();
    }
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++){
      g.lineWidth = 4.5 - k; const cx = fx + s * W * 0.095;
      g.beginPath(); g.moveTo(cx, Hh * (0.5 + k * 0.07)); g.quadraticCurveTo(cx + s * W * 0.05, Hh * (0.53 + k * 0.07), cx + s * W * 0.1, Hh * (0.47 + k * 0.07)); g.stroke();
    }
    for (let k = 0; k < 6; k++){ const x = W * 0.75 + (k - 2.5) * 20; g.lineWidth = 9; g.beginPath(); g.moveTo(x, Hh * 0.03); g.quadraticCurveTo(x + 5, Hh * 0.2, x + 2, Hh * 0.5); g.stroke(); }
    noisePass(g, W, Hh, 16, 91);
  });
}
function catEyeTex(){
  return canvasTex(128, 64, (g, W, Hh) => {
    g.fillStyle = '#5b3d12'; g.fillRect(0, 0, W, Hh);
    const cx = W * 0.25, cy = Hh * 0.5, gr = g.createRadialGradient(cx, cy, 1, cx, cy, W * 0.15);
    gr.addColorStop(0, '#a8b83e'); gr.addColorStop(0.4, '#d9bb3c'); gr.addColorStop(0.85, '#cf8f24'); gr.addColorStop(1, '#6a4512');
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, W * 0.155, Hh * 0.34, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(110,70,15,0.28)'; g.lineWidth = 0.7;
    for (let i = 0; i < 48; i++){ const a = i / 48 * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 3); g.lineTo(cx + Math.cos(a) * W * 0.145, cy + Math.sin(a) * Hh * 0.31); g.stroke(); }
  });
}
const furPlain = new THREE.MeshStandardMaterial({ color: C('#d98a40'), roughness: 0.95, map: TX.fabric });
const furHead = new THREE.MeshStandardMaterial({ map: catHeadTex(), roughness: 0.93 });
const furBody = new THREE.MeshStandardMaterial({ map: TX.fur, roughness: 0.95, color: C('#ffffff') });
const furDark = new THREE.MeshStandardMaterial({ color: C('#a85a22'), roughness: 0.95, map: TX.fabric });
const creamFur = new THREE.MeshStandardMaterial({ color: C('#f4e4cb'), roughness: 0.95, map: TX.fabric });
const pinkM = M('#e39a98', 0.5), noseM = M('#d98583', 0.4), mouthM = M('#6b3a32', 0.8);
const eyeM = new THREE.MeshStandardMaterial({ map: catEyeTex(), roughness: 0.05, emissive: C('#6b5a10'), emissiveIntensity: 0.25 });
const pupilM = M('#050505', 0.08);

const catRoot = new THREE.Group(); scene.add(catRoot);
const hips = new THREE.Group(); catRoot.add(hips);
// body: a smooth lathe profile from rump to chest (stripes run across the back)
const prof = [[0, -0.13], [0.045, -0.124], [0.077, -0.103], [0.096, -0.062], [0.103, -0.01], [0.1, 0.05], [0.092, 0.12], [0.094, 0.19], [0.1, 0.255], [0.097, 0.305], [0.083, 0.347], [0.052, 0.378], [0, 0.39]];
const bodyGeo = new THREE.LatheGeometry(prof.map(p => new THREE.Vector2(p[0], p[1])), 36, -PI / 2);
bodyGeo.rotateX(PI / 2);
{ const p = bodyGeo.attributes.position; for (let i = 0; i < p.count; i++){ const y = p.getY(i), z = p.getZ(i); if (y < 0 && z > -0.02 && z < 0.25) p.setY(i, y * (1 + 0.08 * Math.sin((z + 0.02) / 0.27 * PI))); } bodyGeo.computeVertexNormals(); }
const catBody = mesh(bodyGeo, furBody, 0, 0.012, 0, hips); catBody.scale.set(0.93, 1, 1);
sph(1, creamFur, 0, -0.042, 0.3, hips).scale.set(0.064, 0.066, 0.068);
for (const s of [-1, 1]){
  sph(1, furPlain, s * 0.06, -0.02, 0.012, hips).scale.set(0.044, 0.072, 0.086);
  sph(1, furPlain, s * 0.051, -0.018, 0.268, hips).scale.set(0.034, 0.06, 0.054);
}
function makeLeg(x, y, z, r){
  const g = new THREE.Group(); g.position.set(x, y, z); hips.add(g);
  const shaft = mesh(new THREE.CylinderGeometry(r, r * 0.74, 1, 12), furPlain, 0, -0.5, 0, g, true, false);
  const paw = mesh(new THREE.SphereGeometry(r * 1.2, 14, 9), creamFur, 0, -1, 0.01, g, true, false); paw.scale.set(1, 0.58, 1.4);
  return { g, shaft, paw, jy: y, jz: z };
}
const legs = {
  fl: makeLeg(-0.047, -0.04, 0.27, 0.02), fr: makeLeg(0.047, -0.04, 0.27, 0.02),
  hl: makeLeg(-0.056, -0.045, 0.0, 0.022), hr: makeLeg(0.056, -0.045, 0.0, 0.022)
};
const PAW_R = 0.015;
function setLeg(L, ang, len){ L.g.rotation.x = ang; L.shaft.scale.y = Math.max(0.01, len); L.shaft.position.y = -len / 2; L.paw.position.y = -len; }

const neck = new THREE.Group(); neck.position.set(0, 0.05, 0.33); hips.add(neck);
sph(1, furPlain, 0, 0.028, 0.025, neck).scale.set(0.06, 0.068, 0.07);
const head = new THREE.Group(); head.position.set(0, 0.08, 0.075); neck.add(head);
sph(0.066, furHead, 0, 0.002, 0, head, 1.13, 0.94, 1.0, 32);
for (const s of [-1, 1]){
  sph(0.038, furPlain, s * 0.036, -0.03, 0.014, head, 1.1, 0.8, 0.95);
  sph(0.023, creamFur, s * 0.0145, -0.031, 0.057, head, 1, 0.82, 1);
  const lip = box(0.013, 0.0018, 0.002, mouthM, s * 0.0062, -0.0405, 0.0765, head, false, false); lip.rotation.z = s * 0.4;
}
sph(0.017, creamFur, 0, -0.048, 0.042, head);
sph(0.0105, noseM, 0, -0.0135, 0.0712, head, 1.3, 0.72, 0.85);
box(0.0016, 0.011, 0.002, mouthM, 0, -0.0305, 0.0765, head, false, false);
const eyes = [], pupils = [];
for (const s of [-1, 1]){
  const eg = new THREE.Group(); eg.position.set(s * 0.0295, 0.012, 0.055); eg.rotation.set(0, s * 0.32, -s * 0.12); head.add(eg);
  sph(0.0175, eyeM, 0, 0, 0, eg, 1, 1, 0.62, 20);
  pupils.push(sph(0.0177, pupilM, 0, 0, 0.0033, eg, 0.26, 0.88, 0.5));
  sph(0.0035, M('#ffffff', 0.15), 0.0052, 0.0062, 0.0108, eg);
  sph(0.0015, M('#ffffff', 0.15), -0.004, -0.005, 0.0112, eg);
  eyes.push(eg);
}
const ears = [];
{
  const earGeo = new THREE.ConeGeometry(0.037, 0.072, 4, 1); earGeo.rotateY(PI / 4); earGeo.scale(1, 1, 0.42); earGeo.translate(0, 0.036, 0);
  const inGeo = new THREE.ConeGeometry(0.025, 0.052, 4, 1); inGeo.rotateY(PI / 4); inGeo.scale(1, 1, 0.3); inGeo.translate(0, 0.026, 0);
  const tuft = new THREE.ConeGeometry(0.0035, 0.032, 4); tuft.translate(0, 0.016, 0);
  for (const s of [-1, 1]){
    const eg = new THREE.Group(); eg.position.set(s * 0.041, 0.04, -0.006); eg.rotation.set(-0.12, 0, -s * 0.3); head.add(eg);
    mesh(earGeo, furPlain, 0, 0, 0, eg);
    mesh(inGeo, pinkM, 0, 0.002, 0.0045, eg, false);
    for (let k = 0; k < 3; k++){ const t = mesh(tuft, creamFur, (k - 1) * 0.007 * -s, 0.008 + k * 0.004, 0.009, eg, false); t.rotation.set(0.25, 0, s * (0.35 - k * 0.25)); }
    eg.userData.base = eg.rotation.z; ears.push(eg);
  }
  const wp = [];
  for (const s of [-1, 1]){
    for (const k of [-1, 0, 1, 2]){
      const y0 = -0.031 + k * 0.002, mx = s * 0.075, my = y0 + k * 0.008 + 0.002, ex = s * 0.13, ey = y0 + k * 0.016 - 0.012;
      wp.push(s * 0.022, y0, 0.064, mx, my, 0.074, mx, my, 0.074, ex, ey, 0.066);
    }
    wp.push(s * 0.022, 0.031, 0.055, s * 0.05, 0.062, 0.066, s * 0.02, 0.03, 0.057, s * 0.045, 0.07, 0.06);
  }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
  head.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0xf6f2ea, transparent: true, opacity: 0.85 })));
}
const tailBase = new THREE.Group(); tailBase.position.set(0, 0.035, -0.1); hips.add(tailBase);
const tailSegs = [];
{
  let parent = tailBase; const N = 12, SL = 0.028;
  for (let i = 0; i < N; i++){
    const seg = new THREE.Group(); if (i > 0) seg.position.z = -SL; parent.add(seg);
    const r0 = 0.024 - i * 0.0009, r1 = r0 - 0.0009, m = (i % 3 === 1 || i >= N - 2) ? furDark : furPlain;
    const cg = new THREE.CylinderGeometry(r1, r0, SL, 10); cg.rotateX(-PI / 2);
    mesh(cg, m, 0, 0, -SL / 2, seg, true, false);
    sph(r0 * 1.04, m, 0, 0, 0, seg, 1, 1, 1, 10);
    tailSegs.push(seg); parent = seg;
  }
  sph(0.014, furDark, 0, 0, -SL, parent, 1, 1, 1.3, 10);
}
catRoot.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
blob(0, 0, 0.3, 0.52, 0, 0.3, 0.006, true);
const catShadow = scene.children[scene.children.length - 1];

// poses (angles in world space; leg length -1 = reach the floor)
const POSES = {
  stand: { hipY: 0.205, tilt: -0.06, fA: 0, fL: -1, hA: 0, hL: -1, head: 0.05, tUp: 0.95, tCurl: -0.07, tSide: 0.0, eyes: 1 },
  walk:  { hipY: 0.2, tilt: -0.05, fA: 0, fL: -1, hA: 0, hL: -1, head: 0.12, tUp: 1.3, tCurl: -0.13, tSide: 0.0, eyes: 1 },
  sit:   { hipY: 0.095, tilt: -0.68, fA: 0.02, fL: -1, hA: -1.35, hL: 0.075, head: -0.02, tUp: -0.06, tCurl: 0.0, tSide: 0.28, eyes: 1 },
  lie:   { hipY: 0.083, tilt: 0.0, fA: -1.45, fL: 0.1, hA: -1.2, hL: 0.07, head: 0.12, tUp: -0.08, tCurl: 0.0, tSide: 0.3, eyes: 1 },
  sleep: { hipY: 0.078, tilt: 0.0, fA: -1.45, fL: 0.09, hA: -1.2, hL: 0.07, head: 0.42, tUp: -0.08, tCurl: 0.0, tSide: 0.36, eyes: 0 },
  eat:   { hipY: 0.165, tilt: 0.14, fA: -0.05, fL: -1, hA: 0.05, hL: -1, head: 0.95, tUp: 0.25, tCurl: -0.05, tSide: 0.05, eyes: 0.7 },
  stretch: { hipY: 0.2, tilt: 0.36, fA: -1.2, fL: 0.2, hA: 0.08, hL: -1, head: -0.35, tUp: 1.05, tCurl: -0.04, tSide: 0.0, eyes: 0.5 },
  crouch: { hipY: 0.125, tilt: -0.02, fA: -0.25, fL: -1, hA: -0.35, hL: -1, head: -0.1, tUp: 0.15, tCurl: 0.05, tSide: 0.0, eyes: 1 },
  reach: { hipY: 0.1, tilt: -1.1, fA: -2.1, fL: 0.13, hA: -1.4, hL: 0.075, head: -0.55, tUp: -0.06, tCurl: 0.0, tSide: 0.22, eyes: 1 },
  hop:   { hipY: 0.2, tilt: -0.3, fA: -0.7, fL: 0.15, hA: 0.7, hL: 0.16, head: 0.0, tUp: 0.35, tCurl: 0.0, tSide: 0.0, eyes: 1 }
};
const PKEYS = ['hipY', 'tilt', 'fA', 'hA', 'head', 'tUp', 'tCurl', 'tSide', 'eyes'];
function poseVec(p){ const v = {}; for (const k of PKEYS) v[k] = p[k]; v.fW = p.fL < 0 ? 1 : 0; v.fV = p.fL < 0 ? 0.17 : p.fL; v.hW = p.hL < 0 ? 1 : 0; v.hV = p.hL < 0 ? 0.16 : p.hL; return v; }
const PV = {}; for (const k in POSES) PV[k] = poseVec(POSES[k]);
const cp = Object.assign({}, PV.sleep);

// navigation graph
const NODES = {
  A: [-0.4, 0], B: [-0.9, 2.9], S: [-3.6, 4.0], C: [-4.8, 1.2], D: [-4.95, 2.6], E: [-2.2, 0.4], G: [-5.3, -2.2],
  F: [-3.5, -3.85], F2: [-1.95, -3.75], DL1: [0.45, -0.8], DB1: [1.6, -0.8], H: [2.3, -2.0], I: [4.0, -2.35], I2: [5.5, -2.3],
  J: [5.85, -3.35], K: [4.0, -3.25, 0.655], DL2: [0.45, 0.8], DB2: [1.6, 0.8], M: [2.4, 2.0], N: [3.85, 2.35], P: [1.85, 3.4], Q: [1.62, 4.35, 0.06],
  DLB: [-5.45, -0.45], DBB: [-6.6, -0.45], BM: [-7.7, 0.1]
};
for (const k in NODES){ const n = NODES[k]; NODES[k] = { x: n[0], z: n[1], y: n[2] || 0 }; }
const ADJ = {};
'E-DLB DLB-DBB DBB-BM A-E A-B A-DL1 A-DL2 E-C C-D D-S E-G E-F2 F2-F DL1-DB1 DB1-H H-I I-I2 I2-J I-K DL2-DB2 DB2-M M-N M-P P-Q'.split(' ').forEach(e => {
  const [a, b] = e.split('-'); (ADJ[a] = ADJ[a] || []).push(b); (ADJ[b] = ADJ[b] || []).push(a);
});
const DOOR_EDGES = { 'DL1|DB1': 'bed1', 'DB1|DL1': 'bed1', 'DL2|DB2': 'bed2', 'DB2|DL2': 'bed2', 'DLB|DBB': 'bath', 'DBB|DLB': 'bath' };
function edgeOpen(a, b){ const d = DOOR_EDGES[a + '|' + b]; return !d || DOORS[d].open; }
function reachable(a){
  const seen = { [a]: true }, q = [a];
  while (q.length){ const n = q.shift(); for (const m of ADJ[n]) if (!seen[m] && edgeOpen(n, m)){ seen[m] = true; q.push(m); } }
  return seen;
}
function route(a, b){
  const prev = { [a]: null }, q = [a];
  while (q.length){ const n = q.shift(); if (n === b) break; for (const m of ADJ[n]) if (!(m in prev) && edgeOpen(n, m)){ prev[m] = n; q.push(m); } }
  if (!(b in prev)) return [a];
  const path = []; let n = b; while (n != null){ path.unshift(n); n = prev[n]; } return path;
}
const SPOTS = {
  S: { pose: 'sleep', h: 2.3, t: [24, 40], w: 3 }, K: { pose: 'sleep', h: 1.9, t: [20, 34], w: 2 }, Q: { pose: 'sleep', h: 0.4, t: [22, 36], w: 2 },
  D: { pose: 'sit', h: -PI / 2, t: [10, 16], w: 2 }, F2: { pose: 'eat', h: PI, t: [7, 10], w: 2 }, G: { pose: 'sit', h: -PI / 2, t: [10, 15], w: 1.5 },
  J: { pose: 'sit', h: PI / 2, t: [10, 15], w: 1.5 }, B: { pose: 'sit', h: 0.5, t: [6, 9], w: 1 }, F: { pose: 'sit', h: PI, t: [5, 8], w: 1 },
  N: { pose: 'lie', h: -2.2, t: [10, 16], w: 1 }, BM: { pose: 'lie', h: -PI / 2 - 0.3, t: [10, 18], w: 1.2 }, P: { pose: 'sit', h: PI / 2, t: [5, 8], w: 1 }
};
const cs = { node: 'S', path: null, i: 0, s: 0, pos: new THREE.Vector3(-3.6, 0, 4.0), heading: 2.3, mode: 'act', pose: 'sleep', actT: 14,
  getUp: 0, hop: null, petT: 0, petPose: 'sit', blockedT: 0, gait: 0, phase: 0, gaitW: 0, lookYaw: 0, lookPitch: 0, blinkT: 2.5, blink: 1, free: null, batT: 0, swipe: 0, groom: 0, groomNext: 4, gA: 0, earT: 2, earFlick: null, stretching: false, purr: 0, heartT: 0, tHead: 0 };
function angDiff(a, b){ let d = b - a; while (d > PI) d -= TAU; while (d < -PI) d += TAU; return d; }
function pickDest(from = cs.node){
  const ok = reachable(from), keys = Object.keys(SPOTS).filter(k => k !== from && ok[k]);
  if (!keys.length) return null;
  let tot = 0; keys.forEach(k => tot += SPOTS[k].w);
  let r = Math.random() * tot; for (const k of keys){ r -= SPOTS[k].w; if (r <= 0) return k; } return keys[0];
}
function startWalk(dest){
  if (!dest || route(cs.node, dest).length < 2){ arrive(cs.node); cs.actT = 4 + Math.random() * 4; return; }
  cs.path = route(cs.node, dest); cs.i = 0; cs.s = 0; cs.mode = 'walk'; cs.blockedT = 0;
  cs.stretching = cs.pose === 'lie' || cs.pose === 'sleep';
  cs.getUp = cs.stretching ? 2.0 : (cs.pose === 'sit' || cs.pose === 'eat') ? 0.75 : 0.1;
  cs.pose = 'stand';
}
function arrive(key){
  cs.node = key; cs.path = null; cs.mode = 'act';
  const sp = SPOTS[key];
  if (sp){ cs.pose = sp.pose; cs.targetH = sp.h; cs.actT = lerp(sp.t[0], sp.t[1], Math.random()); }
  else { cs.pose = 'stand'; cs.targetH = cs.heading; cs.actT = 1.5 + Math.random() * 2; }
}
cs.targetH = 2.3;

// hearts
const heartMat = new THREE.SpriteMaterial({ map: TX.heart, transparent: true, depthWrite: false });
const hearts = [];
for (let i = 0; i < 8; i++){ const s = new THREE.Sprite(heartMat.clone()); s.visible = false; s.scale.set(0.09, 0.09, 1); scene.add(s); hearts.push({ s, t: 1, vx: 0, vz: 0 }); }
function spawnHeart(p){
  const h = hearts.find(h => h.t >= 1) || hearts[0];
  h.t = 0; h.s.visible = true; h.s.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.12, 0.05, (Math.random() - 0.5) * 0.12));
  h.vx = (Math.random() - 0.5) * 0.06; h.vz = (Math.random() - 0.5) * 0.06;
}
// soft synthesized purr
let audio = null;
function initAudio(){ try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); if (audio.state === 'suspended') audio.resume(); } catch (e) { audio = null; } }
function purr(){
  if (!audio) return;
  const now = audio.currentTime, dur = 2.8, len = Math.floor(audio.sampleRate * dur);
  const buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
  let b = 0; for (let i = 0; i < len; i++){ b = b * 0.97 + (Math.random() * 2 - 1) * 0.03; const tt = i / audio.sampleRate; const am = 0.5 + 0.5 * Math.sin(TAU * 24 * tt); const breath = 0.6 + 0.4 * Math.sin(TAU * 0.9 * tt); d[i] = b * 6 * am * am * breath; }
  const src = audio.createBufferSource(); src.buffer = buf;
  const lp = audio.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
  const gn = audio.createGain(); gn.gain.setValueAtTime(0, now); gn.gain.linearRampToValueAtTime(0.5, now + 0.35); gn.gain.linearRampToValueAtTime(0.4, now + dur - 0.6); gn.gain.linearRampToValueAtTime(0, now + dur);
  src.connect(lp); lp.connect(gn); gn.connect(audio.destination); src.start(now); src.stop(now + dur);
}
function petCat(){
  if (cs.petT > 0.8) return;
  const lying = cs.mode === 'act' && (cs.pose === 'sleep' || cs.pose === 'lie');
  cs.petPose = lying ? 'lie' : 'sit';
  cs.petT = 3.2; cs.heartT = 0; purr();
  if (cs.mode === 'act') cs.actT += 3;
}

const headWorld = new THREE.Vector3();
function updateCat(dt, t, P){
  // --- behaviour ---
  let targetPose = cs.pose, moving = false;
  cs.swipe = 0; if (cs.batT > 0) cs.batT -= dt;
  const toP = Math.atan2(P.x - cs.pos.x, P.z - cs.pos.z), dP = Math.hypot(P.x - cs.pos.x, P.z - cs.pos.z);
  if (cs.petT > 0){
    cs.petT -= dt; targetPose = cs.petPose;
    if (cs.petPose === 'sit') cs.heading += clamp(angDiff(cs.heading, toP), -3 * dt, 3 * dt);
    cs.heartT -= dt;
    if (cs.heartT <= 0 && cs.petT > 0.6){ head.getWorldPosition(headWorld); spawnHeart(headWorld); cs.heartT = 0.32; }
  } else if (cs.mode === 'act'){
    cs.actT -= dt;
    if (cs.targetH != null) cs.heading += clamp(angDiff(cs.heading, cs.targetH), -2.5 * dt, 2.5 * dt);
    if (cs.actT <= 0) startWalk(pickDest());
  } else if (cs.mode === 'free'){
    const r = updateCatFree(dt, t, P); targetPose = r.pose; moving = r.moving;
  } else if (cs.mode === 'walk'){
    if (cs.getUp > 0){ cs.getUp -= dt; targetPose = cs.stretching && cs.getUp > 0.8 ? 'stretch' : 'stand'; if (cs.getUp <= 0) cs.stretching = false; }
    else {
      const a = NODES[cs.path[cs.i]], b = NODES[cs.path[cs.i + 1]];
      const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz), dirH = Math.atan2(dx, dz);
      const hopUp = b.y - a.y > 0.2, hopDown = a.y - b.y > 0.2, HL = 0.8;
      if (cs.hop){
        cs.hop.t += dt / 0.5; const k = Math.min(1, cs.hop.t);
        cs.s = lerp(cs.hop.s0, cs.hop.s1, k);
        cs.pos.y = lerp(cs.hop.y0, cs.hop.y1, k) + Math.sin(PI * k) * 0.3;
        targetPose = 'hop'; cp.tilt = lerp(-0.45, 0.25, k);
        if (k >= 1){ cs.pos.y = cs.hop.y1; cs.hop = null; }
      } else {
        // is the player in the way?
        const ax = cs.pos.x + Math.sin(cs.heading) * 0.35, az = cs.pos.z + Math.cos(cs.heading) * 0.35;
        const blocked = cs.pos.y < 0.1 && Math.hypot(P.x - ax, P.z - az) < 0.62;
        if (blocked){
          cs.blockedT += dt; targetPose = 'stand';
          if (cs.blockedT > 3.5){ // turn around and go somewhere else
            const dest = pickDest(cs.path[cs.i]);
            if (dest){ const back = route(cs.path[cs.i], dest); cs.path = [cs.path[cs.i + 1]].concat(back); cs.i = 0; cs.s = L - cs.s; }
            cs.blockedT = 0;
          }
        } else {
          cs.blockedT = Math.max(0, cs.blockedT - dt);
          const turn = angDiff(cs.heading, dirH);
          cs.heading += clamp(turn, -5 * dt, 5 * dt);
          const sp = 0.52 * clamp(1 - Math.abs(turn) / 1.6, 0.2, 1);
          if (hopDown && cs.s < 0.01){ cs.hop = { t: 0, s0: 0, s1: HL, y0: a.y, y1: b.y }; }
          else if (hopUp && cs.s + sp * dt >= L - HL && cs.s < L - HL + 0.001){ cs.s = L - HL; cs.hop = { t: 0, s0: L - HL, s1: L, y0: a.y, y1: b.y }; }
          else { cs.s += sp * dt; moving = true; targetPose = 'walk'; cs.phase += dt * sp * 15; }
          if (!hopUp && !hopDown){
            const tt = cs.s / L;
            cs.pos.y = b.y > a.y ? lerp(a.y, b.y, smooth(clamp((tt - 0.7) / 0.3, 0, 1))) : lerp(a.y, b.y, smooth(clamp(tt / 0.3, 0, 1)));
          }
        }
      }
      const k = clamp(cs.s / L, 0, 1);
      cs.pos.x = lerp(a.x, b.x, k); cs.pos.z = lerp(a.z, b.z, k);
      if (!cs.hop && cs.s >= L - 1e-4){
        if (hopUp || hopDown) cs.pos.y = b.y;
        cs.i++; cs.s = 0;
        if (cs.i >= cs.path.length - 1) arrive(cs.path[cs.path.length - 1]);
        else if (!edgeOpen(cs.path[cs.i], cs.path[cs.i + 1])){ // a door was closed in her way
          const here = cs.path[cs.i], dest = pickDest(here);
          cs.node = here;
          if (dest){ cs.path = route(here, dest); cs.i = 0; } else arrive(here);
        }
      }
    }
  }
  if (cs.mode === 'act' && cs.petT <= 0) targetPose = cs.pose;
  if (targetPose === 'sit' && cs.mode === 'act' && cs.petT <= 0){
    cs.groomNext -= dt;
    if (cs.groomNext <= 0){ cs.groom = 3 + Math.random() * 2.5; cs.groomNext = 7 + Math.random() * 8; }
  }
  cs.groom = targetPose === 'sit' && cs.petT <= 0 ? cs.groom - dt : 0;
  cs.gA += ((cs.groom > 0 ? 1 : 0) - cs.gA) * (1 - Math.exp(-5 * dt));
  // --- pose blending ---
  const tv = PV[targetPose], kk = 1 - Math.exp(-(targetPose === 'hop' ? 14 : 5) * dt);
  for (const k in tv){ if (targetPose === 'hop' && k === 'tilt') continue; cp[k] += (tv[k] - cp[k]) * kk; }
  cs.gaitW += ((moving ? 1 : 0) - cs.gaitW) * (1 - Math.exp(-8 * dt));
  // breathing / blinking
  const petting = cs.petT > 0;
  const breath = Math.sin(t * (targetPose === 'sleep' ? 1.6 : 2.6));
  catBody.scale.set(0.93 * (1 + breath * 0.012), 1 + breath * 0.02, 1);
  // ears: occasional twitch, pupils widen in the dark
  cs.earT -= dt; if (cs.earT <= 0){ cs.earFlick = { i: Math.random() < 0.5 ? 0 : 1, t: 0 }; cs.earT = 2 + Math.random() * 5; }
  ears.forEach((e, i) => { let f = 0; if (cs.earFlick && cs.earFlick.i === i){ cs.earFlick.t += dt; f = Math.sin(Math.min(1, cs.earFlick.t / 0.22) * PI) * 0.45; } e.rotation.z = e.userData.base + (i ? 1 : -1) * f; e.rotation.x = -0.12 - (targetPose === 'sleep' ? 0.35 : 0); });
  const dil = lerp(0.26, 0.78, nightT) + (petting ? 0.1 : 0);
  pupils.forEach(p => { p.scale.x += (dil - p.scale.x) * 0.1; });
  eyeM.emissiveIntensity = lerp(0.25, 0.7, nightT);
  cs.blinkT -= dt; if (cs.blinkT <= 0){ cs.blink = 0; cs.blinkT = 2.5 + Math.random() * 4; }
  cs.blink = Math.min(1, cs.blink + dt * 9);
    const eyeOpen = Math.max(0.08, (petting ? 0.35 : cp.eyes) * (cs.blink < 0.5 ? 0.1 : 1));
  eyes.forEach(e => e.scale.y = eyeOpen);
  // --- apply rig ---
  const tilt = cp.tilt, bob = Math.sin(cs.phase * 2) * 0.006 * cs.gaitW;
  hips.position.set(0, cp.hipY + bob, -0.12);
  hips.rotation.x = tilt;
  const legSet = (L, base, W, V, phase, amp) => {
    const sw = Math.sin(phase) * amp * cs.gaitW, ang = base - sw;
    const jy = cp.hipY + (L.jy * Math.cos(tilt) - L.jz * Math.sin(tilt));
    const auto = (jy - PAW_R) / Math.max(0.35, Math.cos(ang)) - Math.max(0, Math.cos(phase)) * 0.03 * cs.gaitW;
    setLeg(L, ang - tilt, lerp(V, auto, W));
  };
  const ph = cs.phase;
  legSet(legs.fl, cp.fA + cs.swipe, cp.fW, cp.fV, ph, 0.42); legSet(legs.fr, cp.fA - cs.swipe, cp.fW, cp.fV, ph + PI, 0.42);
  if (cs.batT > 0){ const L = legs.fr, k = Math.sin(clamp(1 - cs.batT / 0.45, 0, 1) * PI); L.g.rotation.x = lerp(L.g.rotation.x, -1.45 - tilt, k); }
  if (cs.gA > 0.01){ const L = legs.fr; L.g.rotation.x = lerp(L.g.rotation.x, -1.55 - tilt + Math.sin(t * 9) * 0.08, cs.gA); const ln = lerp(L.shaft.scale.y, 0.13, cs.gA); L.shaft.scale.y = ln; L.shaft.position.y = -ln / 2; L.paw.position.y = -ln; }
  legSet(legs.hl, cp.hA, cp.hW, cp.hV, ph + PI, 0.38); legSet(legs.hr, cp.hA, cp.hW, cp.hV, ph, 0.38);
  // head: look at the player when close and awake
  let wantYaw = 0, wantPitch = 0;
  const awake = targetPose !== 'sleep' || petting;
  if (awake && dP < 3.4 && catVisible){
    const d = angDiff(cs.heading, toP);
    if (Math.abs(d) < 2.2){ wantYaw = clamp(d, -1.0, 1.0); wantPitch = -clamp(0.9 / Math.max(dP, 0.5), 0.15, 0.55); }
  }
  if (targetPose === 'sleep' && !petting) wantYaw = 0.55;
  if (targetPose === 'eat' && !petting){ wantYaw = 0; wantPitch = 0; }
  cs.lookYaw += (wantYaw - cs.lookYaw) * (1 - Math.exp(-4 * dt));
  cs.lookPitch += (wantPitch - cs.lookPitch) * (1 - Math.exp(-4 * dt));
  neck.rotation.set(-tilt + cp.head + cs.lookPitch * (1 - cs.gA) + (targetPose === 'eat' ? Math.sin(t * 7) * 0.05 : 0) + cs.gA * (0.55 + Math.sin(t * 9) * 0.1), cs.lookYaw * (1 - cs.gA) + cs.gA * 0.45, petting ? Math.sin(t * 2) * 0.18 : cs.gA * 0.2);
  // tail
  const sway = moving ? 0.14 : (targetPose === 'sleep' ? 0.03 : 0.08);
  tailSegs.forEach((s, i) => {
    s.rotation.x = (i === 0 ? cp.tUp - tilt : cp.tCurl + (i > 7 ? -0.08 * cs.gaitW : 0));
    s.rotation.y = cp.tSide + Math.sin(t * (moving ? 3.2 : 1.4) - i * 0.45) * sway * (0.3 + i * 0.1);
  });
  catRoot.position.copy(cs.pos);
  catRoot.rotation.y = cs.heading;
  catShadow.position.set(cs.pos.x + Math.sin(cs.heading) * 0.03, cs.pos.y + 0.006, cs.pos.z + Math.cos(cs.heading) * 0.03);
  catShadow.rotation.z = cs.heading;
  catShadow.material.opacity = cs.hop ? 0.15 : 0.32;
  // hearts
  for (const h of hearts){
    if (h.t >= 1) continue;
    h.t += dt / 1.5; h.s.position.y += dt * 0.28; h.s.position.x += h.vx * dt; h.s.position.z += h.vz * dt;
    h.s.material.opacity = h.t < 0.2 ? h.t / 0.2 : 1 - (h.t - 0.2) / 0.8;
    const sc = 0.07 + Math.min(h.t * 3, 1) * 0.04; h.s.scale.set(sc, sc, 1);
    if (h.t >= 1) h.s.visible = false;
  }
}
let catVisible = true;
