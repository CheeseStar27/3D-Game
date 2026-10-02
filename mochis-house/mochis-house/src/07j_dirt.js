
// ================= GETTING DIRTY, WASHING, SWIMMING =================
const DIRT = { soil: 0, pond: 0, soot: 0 };
const DCOL = { soil: C('#6b4526'), pond: C('#55693a'), soot: C('#252525') }, CLEAN = C('#cfe6ee'), _dc = new THREE.Color(), _dc2 = new THREE.Color();
let swimming = false, diving = false, showerMsg = 0, cleanMsg = true, dirtLabelLast = '', dirtT = 0, swimT = 0;
function addDirt(kind, amt){ DIRT[kind] = Math.min(1, DIRT[kind] + amt); if (DIRT.soil + DIRT.pond + DIRT.soot > 0.15) cleanMsg = false; }
function dirtTotal(){ return DIRT.soil + DIRT.pond + DIRT.soot; }
function dirtMix(out){
  const tot = dirtTotal(); if (tot < 0.002) return out.copy(CLEAN);
  out.setRGB(0, 0, 0);
  for (const k in DCOL){ const w = DIRT[k] / tot; out.r += DCOL[k].r * w; out.g += DCOL[k].g * w; out.b += DCOL[k].b * w; }
  return out.lerp(CLEAN, 1 - Math.min(1, tot * 1.3));
}
function dirtHue(out){
  const tot = dirtTotal(); if (tot < 0.002) return out.copy(DCOL.soil);
  out.setRGB(0, 0, 0); for (const k in DCOL){ const w = DIRT[k] / tot; out.r += DCOL[k].r * w; out.g += DCOL[k].g * w; out.b += DCOL[k].b * w; } return out;
}
function dirtLabel(){
  const tot = dirtTotal(); if (tot < 0.08) return 'Clean';
  let k = 'soil'; for (const q in DIRT) if (DIRT[q] > DIRT[k]) k = q;
  const word = { soil: 'muddy', pond: 'pond-slimy', soot: 'sooty' }[k], lvl = Math.max(DIRT[k], tot * 0.7);
  const s = lvl > 0.7 ? 'Very ' + word : lvl > 0.3 ? word : 'A bit ' + word;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
// shower runoff puddle on the tiles
const runoff = mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshStandardMaterial({ color: C('#6b4526'), roughness: 0.55, envMapIntensity: 0.25, transparent: true, opacity: 0, depthWrite: false }), -8.45, 0.008, 1.75, scene, false, false);
runoff.rotation.x = -PI / 2; runoff.scale.set(1, 1.15, 1); runoff.renderOrder = 3; movers.push(runoff);
const drainSwirl = mesh(new THREE.RingGeometry(0.03, 0.09, 20), new THREE.MeshBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0, depthWrite: false }), -8.86, 0.01, 1.7, scene, false, false);
drainSwirl.rotation.x = -PI / 2; movers.push(drainSwirl);
function inShower(){ return player.x < -7.72 && player.x > -8.95 && player.z > 1.06 && player.z < 2.3; }
// underwater tint
const uw = document.createElement('div'); uw.id = 'underwater'; document.body.appendChild(uw);
function isSwimDepth(x, z){ return inPond(x, z) && WATER_Y - floorAt(x, z) > 1.15; }
function applySwim(dt, t){
  swimming = isSwimDepth(player.x, player.z) && !seatState && !player.climb;
  if (!swimming){ diving = false; return; }
  diving = player.crouch;
  const g = floorAt(player.x, player.z), tgt = Math.max(g, WATER_Y - 1.32 - (diving ? 0.85 : 0)) + Math.sin(t * 1.7) * 0.025;
  player.vy = 0; player.fy += (tgt - player.fy) * (1 - Math.exp(-3 * dt));
  addDirt('pond', 0.18 * dt);
  swimT -= dt;
  if (swimT <= 0 && (Math.abs(player.vx) + Math.abs(player.vz) > 0.2)){ swimT = 1.0; ripple(player.x, player.z); if (!diving) splash(); for (let k = 0; k < 4; k++) emit('drop', new THREE.Vector3(player.x - Math.sin(player.yaw) * 0.4, WATER_Y + 0.02, player.z - Math.cos(player.yaw) * 0.4), new THREE.Vector3((Math.random() - 0.5) * 0.6, 0.6, (Math.random() - 0.5) * 0.6)); }
  FOOT.wet = 1;
}
let wasSwimming = false;
function updateDirt(dt, t){
  // swimming notices
  if (swimming && !wasSwimming) toast('You\u2019re swimming. Press C to duck under, C again to come up.');
  wasSwimming = swimming;
  const under = camera.position.y < WATER_Y - 0.02 && inPond(camera.position.x, camera.position.z);
  uw.classList.toggle('on', under);
  // shower: the water running off you carries the dirt
  const showering = BATH.shower && inShower(), tot = dirtTotal();
  dirtMix(_dc);
  if (showering){
    for (const k in DIRT) DIRT[k] = Math.max(0, DIRT[k] - dt * (0.07 + DIRT[k] * 0.12));
    FOOT.mud = Math.max(0, FOOT.mud - dt * 0.3); FOOT.wet = 1;
    if (tot > 0.15 && showerMsg <= 0){
      let k = 'soil'; for (const q in DIRT) if (DIRT[q] > DIRT[k]) k = q;
      toast({ soil: 'The water runs brown with mud', pond: 'Murky green pond water swirls down the drain', soot: 'Black soot streams off you' }[k]); showerMsg = 20;
    }
    if (tot < 0.02 && !cleanMsg){ cleanMsg = true; toast('Squeaky clean!'); }
    // lower half of each streak takes the dirt colour
    const col = rainGeo.attributes.color, a = col.array;
    for (let i = 0; i < RAIN_N; i++){
      const lowA = rainSeed[i].y < 1.4, lowB = rainSeed[i].y - 0.07 < 1.4;
      const ca = lowA ? _dc : CLEAN, cb = lowB ? _dc : CLEAN;
      a[i * 6] = ca.r; a[i * 6 + 1] = ca.g; a[i * 6 + 2] = ca.b; a[i * 6 + 3] = cb.r; a[i * 6 + 4] = cb.g; a[i * 6 + 5] = cb.b;
    }
    col.needsUpdate = true;
    if (tot > 0.04 && Math.random() < 0.6) emit('drop', new THREE.Vector3(player.x + (Math.random() - 0.5) * 0.3, 0.5 + Math.random() * 0.6, player.z + (Math.random() - 0.5) * 0.3), new THREE.Vector3((Math.random() - 0.5) * 0.3, -1.5, (Math.random() - 0.5) * 0.3), _dc);
  } else if (BATH.shower){
    const a = rainGeo.attributes.color.array; if (a[0] !== CLEAN.r){ for (let i = 0; i < a.length; i += 3){ a[i] = CLEAN.r; a[i + 1] = CLEAN.g; a[i + 2] = CLEAN.b; } rainGeo.attributes.color.needsUpdate = true; }
  }
  showerMsg -= dt;
  const want = showering ? Math.min(0.85, 0.15 + tot * 0.9) : 0;
  runoff.material.opacity += (want - runoff.material.opacity) * (1 - Math.exp(-(showering ? 2 : 0.5) * dt));
  if (showering) runoff.material.color.lerp(_dc2.copy(dirtHue(_dc2)).multiplyScalar(0.8).lerp(CLEAN, Math.max(0, 1 - tot * 1.6)), 0.1);
  drainSwirl.material.opacity = runoff.material.opacity * 0.8; drainSwirl.rotation.z += dt * 4; drainSwirl.material.color.copy(runoff.material.color).multiplyScalar(0.6);
  // bath: soaking while dirty turns the water murky
  if (BATH.dirt == null){ BATH.dirt = 0; BATH.dirtCol = new THREE.Color().copy(DCOL.soil); }
  if (BATH.dirt < 0.01) dirtHue(BATH.dirtCol);
  const inBath = seatState && seatState.s.rec && seatState.s.rec.label === 'Get in the bath' && seatState.k > 0.9;
  if (inBath && BATH.level > 0.2 && tot > 0.01){
    const m = Math.min(tot, dt * 0.35); for (const k in DIRT) DIRT[k] = Math.max(0, DIRT[k] - m * DIRT[k] / tot);
    BATH.dirt = Math.min(1, BATH.dirt + m * 1.2); BATH.dirtCol.lerp(dirtHue(_dc2), Math.min(1, m * 6));
    if (showerMsg <= 0 && BATH.dirt > 0.25){ toast('The bathwater is turning murky'); showerMsg = 25; }
  }
  if (BATH.bathTap) BATH.dirt *= Math.exp(-0.04 * dt);
  if (BATH.level <= 0.11) BATH.dirt = 0;
  bathWater.material.color.copy(C('#8fc3d1')).lerp(BATH.dirtCol, Math.min(0.85, BATH.dirt));
  bathWater.material.opacity = 0.72 + BATH.dirt * 0.25;
  // your feet look as dirty as you are
  dirtT -= dt;
  if (dirtT <= 0){
    dirtT = 0.3;
    const amt = FOOT.wearing ? Math.min(0.75, FOOT.mud * 0.8) : Math.min(0.85, DIRT.soil + DIRT.pond * 0.7 + DIRT.soot);
    feetG.traverse(o => { if (o.isMesh && o.material && o.material.color){ if (!o.userData.base) o.userData.base = o.material.color.clone(); o.material.color.copy(o.userData.base).lerp(FOOT.wearing ? DCOL.soil : _dc.copy(dirtMix(_dc2)), amt); } });
    const lab = dirtLabel(); if (lab !== dirtLabelLast){ dirtLabelLast = lab; refreshFinds(); }
  }
}
