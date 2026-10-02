
// ================= INTERACTION =================
const ray = new THREE.Raycaster(); ray.far = 2.4; ray.near = 0.05;
const rayCenter = new THREE.Vector2(0, 0);
let rayList = null, target = null, seatState = null;

function roomLightsOn(room){ return ROOM_UNITS[room].some(u => u.on); }
function labelOf(rec){
  switch (rec.kind){
    case 'door': case 'drawer': case 'cabinet': return (rec.open ? 'Close the ' : 'Open the ') + rec.name;
    case 'switch': return roomLightsOn(rec.room) ? 'Turn the lights off' : 'Turn the lights on';
    case 'lamp': return rec.unit.on ? 'Turn the lamp off' : 'Turn the lamp on';
    case 'tv': return tvOn ? 'Turn the TV off' : 'Turn the TV on';
    case 'seat': return rec.label;
    case 'custom': return rec.label();
    case 'item': return (held ? 'Swap for the ' : 'Pick up the ') + rec.item.name;
  }
  return 'Use';
}
function updateTarget(){
  target = null;
  if (!rayList) rayList = actMeshes.concat(blockMeshes);
  ray.setFromCamera(rayCenter, camera);
  const hits = ray.intersectObjects(rayList, false);
  let hit = hits.find(h => !(held && isUnder(h.object, held.g))) || null;
  let rec = hit && hit.object.userData.act;
  if (rec && seatState && rec === seatState.s.rec) rec = null;
  if (rec && rec.kind === 'item' && (rec.item === held || rec.item.st.gone)) rec = null;
  if (canPet()){
    const d = Math.hypot(cs.pos.x - camera.position.x, cs.pos.z - camera.position.z);
    if (!rec || d < hit.distance + 0.4){ target = { kind: 'cat', label: held && held.id === 'treats' ? 'Give Mochi a treat' : 'Pet Mochi' }; return; }
  }
  if (rec){ target = { kind: 'act', rec, point: hit.point, label: labelOf(rec) }; return; }
  if (seatState && seatState.dir === 1) target = { kind: 'stand', label: 'Stand up' };
}
function doAction(){
  initAudio();
  if (!target) updateTarget();
  if (!target){ if (seatState) standUp(); return; }
  if (target.kind === 'cat'){ if (held && held.id === 'treats') giveTreat(); else petCat(); }
  else if (target.kind === 'stand') standUp();
  else useRec(target.rec, target.point);
  updateTarget(); refreshPrompt();
}
function useRec(rec, point){
  if (rec.kind === 'seat'){
    let best = rec.seats[0], bd = 1e9;
    for (const s of rec.seats){ const d = Math.hypot(s.x - point.x, s.z - point.z); if (d < bd){ bd = d; best = s; } }
    if (seatState && seatState.dir === 1){ seatState.s = best; seatState.k = 0; seatState.from = { x: camera.position.x, y: camera.position.y, z: camera.position.z }; seatState.yaw0 = player.yaw; seatState.pitch0 = player.pitch; seatState.settled = false; }
    else sitDown(best);
    sfx('sit'); return;
  }
  if (rec.kind === 'switch'){ const on = !roomLightsOn(rec.room); ROOM_UNITS[rec.room].forEach(u => u.on = on); sfx('click'); return; }
  if (rec.kind === 'lamp'){ rec.unit.on = !rec.unit.on; sfx('click'); return; }
  if (rec.kind === 'tv'){ setTV(!tvOn); sfx('click'); return; }
  if (rec.kind === 'custom'){ rec.use(); return; }
  if (rec.kind === 'item'){ pickUp(rec.item); return; }
  const open = !rec.open;
  if (!open && rec.kind === 'door' && rec.zone){
    const [x0, x1, z0, z1] = rec.zone;
    if (cs.pos.x > x0 && cs.pos.x < x1 && cs.pos.z > z0 && cs.pos.z < z1 && cs.pos.y < 0.3){ toast('Mochi is in the doorway'); return; }
  }
  for (const r of rec.linked || [rec]) r.open = open;
  sfx(rec.kind === 'drawer' ? 'slide' : open ? 'open' : 'close');
}

// ---- sitting ----
function sitDown(s){
  seatState = { s, k: 0, dir: 1, settled: false, from: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, yaw0: player.yaw, pitch0: player.pitch };
  player.vx = player.vz = 0;
}
function standUp(){ if (seatState && seatState.dir === 1){ seatState.dir = -1; seatState.from = { x: player.x, y: player.eyeH + player.fy, z: player.z }; sfx('sit'); } }
function updateSeat(dt){
  const S = seatState; if (!S) return;
  S.k = clamp(S.k + S.dir * dt / (REDUCED ? 0.02 : 0.6), 0, 1);
  if (S.dir === 1 && !S.settled){
    const e = smooth(S.k);
    player.yaw = S.yaw0 + angDiff(S.yaw0, S.s.yaw) * e;
    player.pitch = lerp(S.pitch0, S.s.pitch, e);
    if (S.k >= 1) S.settled = true;
  }
  if (S.dir === -1 && S.k <= 0) seatState = null;
}
function seatedEye(){
  const S = seatState, e = smooth(S.k);
  if (S.dir === 1) return [lerp(S.from.x, S.s.x, e), lerp(S.from.y, S.s.y, e), lerp(S.from.z, S.s.z, e)];
  return [lerp(S.from.x, S.s.x, e), lerp(S.from.y, S.s.y, e), lerp(S.from.z, S.s.z, e)];
}

// ---- little synthesized sounds ----
let noiseBuf = null;
function sfx(kind){
  if (!audio) return;
  try {
    const now = audio.currentTime;
    if (!noiseBuf){ noiseBuf = audio.createBuffer(1, audio.sampleRate * 0.5, audio.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = audio.createBufferSource(); src.buffer = noiseBuf;
    const f = audio.createBiquadFilter(), g = audio.createGain();
    const P = { click: ['highpass', 2500, 0.18, 0.035], slide: ['bandpass', 900, 0.12, 0.28], open: ['lowpass', 700, 0.14, 0.22], close: ['lowpass', 380, 0.32, 0.16], sit: ['lowpass', 300, 0.16, 0.3], flush: ['lowpass', 1800, 0.3, 2.3], pick: ['bandpass', 1200, 0.12, 0.06], place: ['lowpass', 600, 0.2, 0.08], tap: ['lowpass', 500, 0.18, 0.06], whoosh: ['bandpass', 700, 0.14, 0.3], rattle: ['highpass', 1800, 0.12, 0.05], slurp: ['bandpass', 500, 0.1, 1.0], pour: ['bandpass', 1500, 0.09, 1.4], page: ['highpass', 1500, 0.1, 0.18], crunch: ['bandpass', 2200, 0.22, 0.12], boil: ['bandpass', 900, 0.06, 1.8], dig: ['lowpass', 420, 0.32, 0.3] }[kind] || ['lowpass', 500, 0.1, 0.1];
    f.type = P[0]; f.frequency.value = P[1];
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(P[2], now + 0.008); g.gain.exponentialRampToValueAtTime(0.001, now + P[3]);
    src.loop = kind === 'flush' || kind === 'pour' || kind === 'boil' || kind === 'slurp'; src.connect(f); f.connect(g); g.connect(audio.destination); src.start(now); src.stop(now + P[3] + 0.05);
    if (kind === 'flush'){ f.frequency.setValueAtTime(1800, now); f.frequency.exponentialRampToValueAtTime(250, now + 2.2); g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.3, now + 0.15); g.gain.linearRampToValueAtTime(0.001, now + 2.3); }
    if (kind === 'rattle'){ for (let k = 1; k < 5; k++){ const s2 = audio.createBufferSource(), g2 = audio.createGain(); s2.buffer = noiseBuf; s2.connect(f); g2.gain.value = 1; const t0 = now + k * 0.12; s2.start(t0); s2.stop(t0 + 0.04); } g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(0.12, now); g.gain.setValueAtTime(0.12, now + 0.6); g.gain.linearRampToValueAtTime(0.0001, now + 0.65); }
    if (kind === 'slurp'){ f.frequency.setValueAtTime(300, now + 0.5); f.frequency.linearRampToValueAtTime(900, now + 0.9); g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(0, now + 0.45); g.gain.linearRampToValueAtTime(0.12, now + 0.55); g.gain.linearRampToValueAtTime(0.0001, now + 1.0); }
    if (kind === 'boil'){ const o = audio.createOscillator(), og = audio.createGain(); o.frequency.setValueAtTime(1400, now + 0.8); o.frequency.linearRampToValueAtTime(1900, now + 1.8); og.gain.setValueAtTime(0, now); og.gain.linearRampToValueAtTime(0.03, now + 1.2); og.gain.linearRampToValueAtTime(0.0001, now + 2.0); o.connect(og); og.connect(audio.destination); o.start(now); o.stop(now + 2.1); }
    if (kind === 'close'){ const o = audio.createOscillator(), og = audio.createGain(); o.frequency.setValueAtTime(110, now); o.frequency.exponentialRampToValueAtTime(55, now + 0.12); og.gain.setValueAtTime(0.25, now); og.gain.exponentialRampToValueAtTime(0.001, now + 0.15); o.connect(og); og.connect(audio.destination); o.start(now); o.stop(now + 0.2); }
  } catch (_) {}
}
let toastTimer = 0;
function toast(msg){ const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden'); toastTimer = 1.8; }
function updateToast(dt){ if (toastTimer > 0){ toastTimer -= dt; if (toastTimer <= 0) $('#toast').classList.add('hidden'); } }
