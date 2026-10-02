
// ================= PLAYER & CONTROLS =================
const EYE = 1.62, PR = 0.27;
const player = { x: -0.45, z: 4.1, yaw: 0, pitch: -0.2, vx: 0, vz: 0, bob: 0, bobAmp: 0, walked: 0, fy: 0, vy: 0, eyeH: 1.62, crouch: false, climb: null, ledgeT: 0 };
player.yaw = Math.atan2(-(-4.2 - player.x), -(3.1 - player.z));
function collide(p, r){
  for (let it = 0; it < 3; it++){
    for (const b of colliders){
      if (b.off) continue;
      if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
      const cx = clamp(p.x, b.x0, b.x1), cz = clamp(p.z, b.z0, b.z1);
      const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      if (d2 > 1e-10){ const d = Math.sqrt(d2); p.x += dx / d * (r - d); p.z += dz / d * (r - d); }
      else {
        const l = p.x - b.x0, rr = b.x1 - p.x, t = p.z - b.z0, bb = b.z1 - p.z, m = Math.min(l, rr, t, bb);
        if (m === l) p.x = b.x0 - r; else if (m === rr) p.x = b.x1 + r; else if (m === t) p.z = b.z0 - r; else p.z = b.z1 + r;
      }
    }
  }
}
function segHitsBox(x0, z0, x1, z1, b){
  let t0 = 0, t1 = 1; const dx = x1 - x0, dz = z1 - z0;
  for (const [p, q] of [[-dx, x0 - b.x0], [dx, b.x1 - x0], [-dz, z0 - b.z0], [dz, b.z1 - z0]]){
    if (Math.abs(p) < 1e-9){ if (q < 0) return false; continue; }
    const r = q / p; if (p < 0){ if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}
function wallBetween(ax, az, bx, bz){ return wallCols.some(b => segHitsBox(ax, az, bx, bz, b)) || doorCols.some(b => !b.off && segHitsBox(ax, az, bx, bz, b)); }
function roomAt(x, z){ if (z > 20.7 && z < 25.9) for (const S of SHOPS) if (Math.abs(x - S.x) < 3) return S.name; if (x < -6 && x > -9 && z > -1.25 && z < 2.35) return 'Bathroom'; if (z > 14.1 || x < -15.1 || x > 16.1 || z < -13.1) return 'Street'; if (x < -6 || x > 7 || z < -5 || z > 5) return 'Garden'; if (x < 1) return z < -1.2 ? 'Kitchen and dining' : 'Living room'; return z < 0 ? 'Main bedroom' : 'Second bedroom'; }

const keys = {};
let started = false, locked = false, lockFailed = false, drag = null, joy = null, lookTouch = null;
function canPet(){
  if (!started || cs.hop) return false;
  const ex = camera.position.x, ez = camera.position.z;
  const dx = cs.pos.x - ex, dz = cs.pos.z - ez, d = Math.hypot(dx, dz);
  if (d > 1.9 || d < 1e-3) return false;
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw);
  if ((dx * fx + dz * fz) / d < 0.72) return false;
  return !wallBetween(ex, ez, cs.pos.x, cs.pos.z);
}

addEventListener('keydown', e => {
  if (!started) return;
  if (shopOpen){ if (e.code === 'Escape'){ e.preventDefault(); closeShop(); } return; }
  if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return;
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'KeyE') doAction();
  else if (e.code === 'KeyF'){ if (held) useHeld(); else doAction(); }
  else if (e.code === 'KeyQ') putDown();
  else if (e.code === 'KeyG') throwHeld();
  else if (e.code === 'KeyR' && held && held.o.alt) held.o.alt.use();
  else if (e.code === 'Space'){ if (seatState) standUp(); else jump(); }
  else if (e.code === 'KeyC') toggleCrouch();
  else if (e.code === 'KeyT') cycleSpeed();
  else if (e.code === 'KeyN') toggleNight();
  else if (e.code === 'KeyM') toggleMap();
  else if (e.code === 'KeyH' || e.code === 'Slash') toggleHelp();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; drag = null; });

const LOOK_MOUSE = 0.0022, LOOK_DRAG = 0.0042, LOOK_TOUCH = 0.0055;
function look(dx, dy, s){ player.yaw -= dx * s; player.pitch = clamp(player.pitch - dy * s, -1.35, 1.35); }
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === canvas; canvas.classList.toggle('locked', locked); });
document.addEventListener('pointerlockerror', () => { lockFailed = true; locked = false; });
const joyEl = $('#joy'), joyKnob = joyEl.querySelector('i');
canvas.addEventListener('pointerdown', e => {
  if (!started || shopOpen) return;
  canvas.focus({ preventScroll: true });
  if (e.pointerType === 'mouse'){
    if (locked && held && e.button === 0){ useHeld(); return; }
    if (locked && held && e.button === 2){ throwHeld(); return; }
    if (!locked && !lockFailed && canvas.requestPointerLock){ try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { lockFailed = true; }); } catch (_) { lockFailed = true; } }
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.classList.add('dragging');
  } else {
    if (!joy && e.clientX < innerWidth * 0.45 && e.clientY > innerHeight * 0.3){
      joy = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: 0, y: 0, mag: 0 };
      joyEl.style.left = e.clientX + 'px'; joyEl.style.top = e.clientY + 'px'; joyEl.style.display = 'block'; joyKnob.style.transform = '';
      $('#touchHint').classList.add('hidden');
    } else if (!lookTouch){ lookTouch = { id: e.pointerId, x: e.clientX, y: e.clientY }; }
  }
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
});
canvas.addEventListener('pointermove', e => {
  if (!started) return;
  if (e.pointerType === 'mouse'){
    if (locked) look(e.movementX || 0, e.movementY || 0, LOOK_MOUSE);
    else if (drag && drag.id === e.pointerId){ look(e.clientX - drag.x, e.clientY - drag.y, LOOK_DRAG); drag.x = e.clientX; drag.y = e.clientY; }
  } else if (joy && joy.id === e.pointerId){
    let dx = e.clientX - joy.x0, dy = e.clientY - joy.y0; const m = Math.hypot(dx, dy), R = 50;
    if (m > R){ dx *= R / m; dy *= R / m; }
    joy.x = dx / R; joy.y = dy / R; joy.mag = Math.min(1, m / R);
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  } else if (lookTouch && lookTouch.id === e.pointerId){
    look(e.clientX - lookTouch.x, e.clientY - lookTouch.y, LOOK_TOUCH); lookTouch.x = e.clientX; lookTouch.y = e.clientY;
  }
});
function endPointer(e){
  if (drag && drag.id === e.pointerId){ drag = null; canvas.classList.remove('dragging'); }
  if (joy && joy.id === e.pointerId){ joy = null; joyEl.style.display = 'none'; }
  if (lookTouch && lookTouch.id === e.pointerId) lookTouch = null;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('contextmenu', e => e.preventDefault());

function updatePlayer(dt){
  if (shopOpen){ player.vx = player.vz = 0; player.bobAmp = 0; return; }
  if (player.climb){
    const c = player.climb; c.t = Math.min(1, c.t + dt / (c.dur || 0.75));
    const up = smooth(clamp(c.t / 0.6, 0, 1)), fw = smooth(clamp((c.t - 0.35) / 0.65, 0, 1));
    player.fy = lerp(c.f0, c.f1, up); player.x = lerp(c.x0, c.x1, fw); player.z = lerp(c.z0, c.z1, fw);
    player.vx = player.vz = 0; player.vy = 0; player.bobAmp = 0;
    if (c.t >= 1) player.climb = null;
    return;
  }
  let f = 0, s = 0, turn = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1;
  if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyD) s += 1;
  if (keys.KeyA) s -= 1;
  if (keys.ArrowLeft) turn += 1;
  if (keys.ArrowRight) turn -= 1;
  if (joy){ f -= joy.y; s += joy.x; }
  if (seatState){
    if (seatState.dir === 1 && seatState.k > 0.6 && (Math.abs(f) > 0.3 || Math.abs(s) > 0.3)) standUp();
    player.vx = player.vz = 0; player.bobAmp = 0; player.yaw += turn * 1.9 * dt; return;
  }
  const run = keys.ShiftLeft || keys.ShiftRight || (joy && joy.mag > 0.97);
  player.yaw += turn * 1.9 * dt;
  const mag = Math.hypot(f, s); if (mag > 1){ f /= mag; s /= mag; }
  player.eyeH += ((player.crouch ? 1.0 : EYE) - player.eyeH) * (1 - Math.exp(-10 * dt));
  const speed = (player.crouch ? 0.8 : run ? 3.0 : 1.55) * (swimming ? 0.6 : 1);
  const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw);
  const k = 1 - Math.exp(-10 * dt);
  player.vx += ((fx * f + rx * s) * speed - player.vx) * k;
  player.vz += ((fz * f + rz * s) * speed - player.vz) * k;
  const p = { x: player.x + player.vx * dt, z: player.z + player.vz * dt };
  collide(p, PR);
  if (cs.pos.y < 0.15){
    const dx = p.x - cs.pos.x, dz = p.z - cs.pos.z, d = Math.hypot(dx, dz), R = PR + 0.15;
    if (d < R && d > 1e-4){ p.x = cs.pos.x + dx / d * R; p.z = cs.pos.z + dz / d * R; collide(p, PR); }
  }
  shoeRule(p);
  // ground height: step up small rises, push against taller ledges to climb them
  const STEP_UP = (swimming || inPond(player.x, player.z)) ? 1.25 : 0.45, gNew = floorAt(p.x, p.z);
  if (gNew > player.fy + STEP_UP){
    if (floorAt(p.x, player.z) <= player.fy + STEP_UP) p.z = player.z;
    else if (floorAt(player.x, p.z) <= player.fy + STEP_UP) p.x = player.x;
    else { p.x = player.x; p.z = player.z; }
    if (f > 0.3 && player.vy === 0){
      player.ledgeT += dt;
      const lx = player.x - Math.sin(player.yaw) * 0.45, lz = player.z - Math.cos(player.yaw) * 0.45, gt = floorAt(lx, lz), rise = gt - player.fy;
      const lad = nearLadder(player.x, player.z), canClimb = rise > STEP_UP && (rise < 2.4 ? player.ledgeT > 0.35 : lad ? player.ledgeT > 0.35 : player.ledgeT > 2.2);
      if (player.ledgeT > 0.9 && player.ledgeT < 1.0 && rise >= 2.4 && !lad) toast('Too high to climb easily. Keep pushing to scramble up, or set up a ladder.');
      if (canClimb){
        if (rise >= 2.4 && !lad) toast('You scramble up the side. Hard work!'); const q = { x: lx, z: lz }; collide(q, PR); if (!inHouse(player.x, player.z)) addDirt('soil', 0.04); player.climb = { t: 0, dur: 0.5 + rise * (lad ? 0.3 : 0.6), x0: player.x, z0: player.z, f0: player.fy, x1: q.x, z1: q.z, f1: floorAt(q.x, q.z) }; player.ledgeT = 0; sfx('dig'); }
    }
  } else player.ledgeT = 0;
  const moved = Math.hypot(p.x - player.x, p.z - player.z);
  player.x = p.x; player.z = p.z; player.walked += moved;
  const sp = moved / Math.max(dt, 1e-4);
  player.bob += moved * (run ? 4.2 : 5.4);
  player.bobAmp += ((sp > 0.25 ? 1 : 0) - player.bobAmp) * (1 - Math.exp(-6 * dt));
  applySwim(dt, performance.now() / 1000);
  const g = floorAt(player.x, player.z);
  if (swimming){}
  else if (player.vy > 0 || player.fy > g + 0.03){
    player.vy -= 9.8 * dt; player.fy += player.vy * dt;
    if (player.fy <= g){ if (player.vy < -4.2) sfx('close'); player.fy = g; player.vy = 0; }
  } else { player.fy += (g - player.fy) * (1 - Math.exp(-14 * dt)); player.vy = 0; }
}
function jump(){ if (player.climb || seatState) return; const g = floorAt(player.x, player.z); if (player.vy === 0 && player.fy < g + 0.05){ player.vy = player.crouch ? 2.2 : 3.3; player.fy += 0.01; } }
function toggleCrouch(){ player.crouch = !player.crouch; const b = $('#crouchBtn'); if (b){ b.setAttribute('aria-pressed', String(player.crouch)); b.classList.toggle('on', player.crouch); } }
function updateCamera(){
  const b = REDUCED ? 0 : player.bobAmp;
  if (seatState){ const e = seatedEye(); camera.position.set(e[0], e[1], e[2]); camera.rotation.set(player.pitch, player.yaw, 0); return; }
  camera.position.set(player.x, player.eyeH + player.fy + Math.sin(player.bob) * 0.02 * b, player.z);
  if (shake > 0.001 && !REDUCED){ camera.position.x += (Math.random() - 0.5) * shake; camera.position.y += (Math.random() - 0.5) * shake; camera.position.z += (Math.random() - 0.5) * shake; }
  camera.rotation.set(player.pitch, player.yaw, Math.sin(player.bob * 0.5) * 0.003 * b);
}

// ================= HUD =================
const hudIds = ['#room', '#mapWrap', '#cross', '#tools', '#hint', '#touchHint'];
const roomName = $('#roomName'), promptEl = $('#prompt'), petBtn = $('#petBtn'), promptText = $('#promptText'), actLabel = $('#actLabel'), crossEl = $('#cross'), nightBtn = $('#nightBtn'), helpBtn = $('#helpBtn'), helpEl = $('#help');
let currentRoom = '', mapOn = true, helpOn = false;
function toggleNight(){ skipTime(); }
function toggleMap(){ mapOn = !mapOn; $('#mapWrap').classList.toggle('hidden', !mapOn); }
function toggleHelp(force){ helpOn = force != null ? force : !helpOn; helpEl.classList.toggle('hidden', !helpOn); helpBtn.setAttribute('aria-expanded', String(helpOn)); }
nightBtn.addEventListener('click', () => { toggleNight(); nightBtn.blur(); });
helpBtn.addEventListener('click', () => toggleHelp());
petBtn.addEventListener('click', () => { doAction(); petBtn.blur(); });
$('#useBtn').addEventListener('click', () => { useHeld(); $('#useBtn').blur(); });
$('#crouchBtn').addEventListener('click', () => { toggleCrouch(); $('#crouchBtn').blur(); });
$('#jumpBtn').addEventListener('click', () => { jump(); $('#jumpBtn').blur(); });
$('#altBtn').addEventListener('click', () => { if (held && held.o.alt) held.o.alt.use(); $('#altBtn').blur(); });
$('#throwBtn').addEventListener('click', () => { throwHeld(); $('#throwBtn').blur(); });
$('#dropBtn').addEventListener('click', () => { putDown(); $('#dropBtn').blur(); });

// minimap
const mapC = $('#map'), mctx = mapC.getContext('2d'), MW = mapC.width, MH = mapC.height;
const MX0 = -9.3, MZ0 = -5.3, MSPAN_X = 16.6, MSPAN_Z = 10.6, MS = Math.min(MW / MSPAN_X, MH / MSPAN_Z);
const MOX = (MW - MSPAN_X * MS) / 2, MOZ = (MH - MSPAN_Z * MS) / 2;
const mX = x => MOX + (x - MX0) * MS, mZ = z => MOZ + (z - MZ0) * MS;
let mapStatic = null;
function isDark(){ const th = document.documentElement.getAttribute('data-theme'); if (th) return th === 'dark'; return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches; }
function buildMapStatic(){
  const dark = isDark();
  const c = makeCanvas(MW, MH), g = c.getContext('2d');
  const P = dark ? { floor: '#313833', floor2: '#2c322e', rug: 'rgba(255,255,255,0.06)', item: '#4b554e', wall: '#e9eee9', win: '#7fb6d6', door: '#8a948d' }
                 : { floor: '#f4f1ea', floor2: '#ebe6dc', rug: 'rgba(40,50,45,0.06)', item: '#c9c4b9', wall: '#26302b', win: '#5aa0c8', door: '#9aa19b' };
  g.fillStyle = P.floor; g.fillRect(mX(-6), mZ(-5), 7 * MS, 10 * MS);
  g.fillStyle = P.floor2; g.fillRect(mX(1), mZ(-5), 6 * MS, 10 * MS); g.fillRect(mX(-9), mZ(-1.25), 3 * MS, 3.6 * MS);
  for (const it of planItems){
    g.save(); g.translate(mX(it.cx), mZ(it.cz)); g.rotate(-it.ry);
    if (it.kind === 'rug'){ g.fillStyle = P.rug; g.fillRect(-it.w / 2 * MS, -it.d / 2 * MS, it.w * MS, it.d * MS); }
    else if (it.kind === 'rugRound'){ g.fillStyle = P.rug; g.beginPath(); g.arc(0, 0, it.w / 2 * MS, 0, TAU); g.fill(); }
    else if (it.kind === 'plant' || it.kind === 'lamp' || it.kind === 'catbed'){ g.fillStyle = it.kind === 'plant' ? (dark ? '#4f6b4f' : '#a9c0a0') : P.item; g.beginPath(); g.arc(0, 0, it.w / 2 * MS, 0, TAU); g.fill(); }
    else if (it.kind === 'door'){ g.strokeStyle = P.door; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-it.w / 2 * MS, 0); g.lineTo(it.w / 2 * MS, 0); g.stroke(); }
    else { g.fillStyle = P.item; g.beginPath(); if (g.roundRect) g.roundRect(-it.w / 2 * MS, -it.d / 2 * MS, it.w * MS, it.d * MS, 2); else g.rect(-it.w / 2 * MS, -it.d / 2 * MS, it.w * MS, it.d * MS); g.fill(); }
    g.restore();
  }
  g.strokeStyle = P.wall; g.lineWidth = Math.max(3, T * MS); g.lineCap = 'square';
  for (const w of mapWalls){ g.beginPath(); if (w.axis === 'x'){ g.moveTo(mX(w.a), mZ(w.c)); g.lineTo(mX(w.b), mZ(w.c)); } else { g.moveTo(mX(w.c), mZ(w.a)); g.lineTo(mX(w.c), mZ(w.b)); } g.stroke(); }
  g.strokeStyle = P.win; g.lineWidth = 3; g.lineCap = 'butt';
  for (const w of mapWins){ g.beginPath(); if (w.axis === 'x'){ g.moveTo(mX(w.a), mZ(w.c)); g.lineTo(mX(w.b), mZ(w.c)); } else { g.moveTo(mX(w.c), mZ(w.a)); g.lineTo(mX(w.c), mZ(w.b)); } g.stroke(); }
  mapStatic = c;
}
function drawMap(){
  if (!mapStatic) buildMapStatic();
  mctx.clearRect(0, 0, MW, MH); mctx.drawImage(mapStatic, 0, 0);
  // doors
  mctx.strokeStyle = isDark() ? '#c9d2cc' : '#6b746e'; mctx.lineWidth = 2.5; mctx.lineCap = 'round';
  for (const k in DOORS){ const d = DOORS[k], p = d.pivot, a = p.rotation.y; mctx.beginPath(); mctx.moveTo(mX(p.position.x), mZ(p.position.z)); mctx.lineTo(mX(p.position.x + Math.cos(a) * d.w), mZ(p.position.z - Math.sin(a) * d.w)); mctx.stroke(); }
  // cat
  mctx.fillStyle = '#e0873a'; mctx.strokeStyle = '#ffffff'; mctx.lineWidth = 2;
  mctx.beginPath(); mctx.arc(mX(cs.pos.x), mZ(cs.pos.z), 5, 0, TAU); mctx.fill(); mctx.stroke();
  // player view cone + arrow
  const px = clamp(mX(camera.position.x), 8, MW - 8), pz = clamp(mZ(camera.position.z), 8, MH - 8), a = Math.atan2(-Math.cos(player.yaw), -Math.sin(player.yaw));
  const cone = mctx.createRadialGradient(px, pz, 2, px, pz, 46);
  const acc = isDark() ? '147,208,177' : '44,102,80';
  cone.addColorStop(0, `rgba(${acc},0.35)`); cone.addColorStop(1, `rgba(${acc},0)`);
  mctx.fillStyle = cone; mctx.beginPath(); mctx.moveTo(px, pz); mctx.arc(px, pz, 46, a - 0.6, a + 0.6); mctx.closePath(); mctx.fill();
  mctx.save(); mctx.translate(px, pz); mctx.rotate(a);
  mctx.fillStyle = `rgb(${acc})`; mctx.strokeStyle = '#ffffff'; mctx.lineWidth = 2;
  mctx.beginPath(); mctx.moveTo(9, 0); mctx.lineTo(-6, -6.5); mctx.lineTo(-3, 0); mctx.lineTo(-6, 6.5); mctx.closePath(); mctx.stroke(); mctx.fill();
  mctx.restore();
}
if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { mapStatic = null; });

let lastLabel = '';
function refreshHeld(){
  const bar = $('#heldBar'), ub = $('#useBtn'), db = $('#dropBtn');
  if (!held){ bar.classList.add('hidden'); ub.classList.remove('show'); db.classList.remove('show'); $('#throwBtn').classList.remove('show'); $('#altBtn').classList.remove('show'); return; }
  $('#heldName').textContent = held.name.charAt(0).toUpperCase() + held.name.slice(1);
  $('#heldVerb').textContent = held.o.verb; $('#useLabel').textContent = held.o.verb;
  const alt = held.o.alt; $('#heldAlt').style.display = alt ? '' : 'none'; $('#altBtn').classList.toggle('show', !!alt); if (alt){ $('#heldAltLabel').textContent = alt.label(); $('#altLabel').textContent = alt.label(); }
  bar.classList.remove('hidden'); ub.classList.add('show'); db.classList.add('show'); $('#throwBtn').classList.add('show');
}
function refreshPrompt(){
  const lab = target && !shopOpen ? target.label : '';
  if (lab !== lastLabel){ lastLabel = lab; if (lab){ promptText.textContent = lab; actLabel.textContent = lab; } }
  promptEl.classList.toggle('hidden', !lab || IS_TOUCH);
  petBtn.classList.toggle('show', !!lab);
  crossEl.classList.toggle('on', !!target && target.kind !== 'stand');
}
function updateHUD(){
  const r = roomAt(player.x, player.z);
  const dd = GY - player.fy, lab = r === 'Garden' && dd > 0.6 ? `Garden \u00b7 ${dd.toFixed(1)} m down` : r;
  if (lab !== currentRoom){ currentRoom = lab; roomName.textContent = lab; }
  updateTarget(); refreshPrompt(); updateDigPreview();
  if (player.walked > 10) $('#hint').classList.add('hidden');
  if (mapOn) drawMap();
}

// ================= START & LOOP =================
function fitCamera(){
  const aspect = innerWidth / Math.max(1, innerHeight);
  const hf = (IS_TOUCH ? 84 : 86) * PI / 180;
  camera.fov = clamp(2 * Math.atan(Math.tan(hf / 2) / aspect) * 180 / PI, 52, 78);
  camera.aspect = aspect; camera.updateProjectionMatrix();
}
fitCamera();
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight, false); fitCamera(); });
const dynamicObjs = new Set([...movers, catRoot, camera, sky, clock.h, clock.m, clock.s, sun, sun.target, catShadow, ...hearts.map(h => h.s)]);
(function freeze(list){ for (const o of list){ if (dynamicObjs.has(o)) continue; o.updateMatrix(); o.matrixAutoUpdate = false; freeze(o.children); } })(scene.children);

let last = performance.now(), tvAcc = 0, hudAcc = 0;
function updateClock(){
  const tm = GAME.h * 3600, sec = tm % 60, min = (tm / 60) % 60, hr = (GAME.h % 12);
  clock.s.rotation.z = -sec / 60 * TAU; clock.m.rotation.z = -min / 60 * TAU; clock.h.rotation.z = -hr / 12 * TAU;
}
function frame(now){ requestAnimationFrame(frame); tick(now); }
function tick(now, noRender){
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
  const t = now / 1000;
  if (started) updatePlayer(dt);
  updateSeat(dt);
  updateAnims(dt); updateUnits(dt); updateToast(dt); updateBath(dt, t); updateItems(dt, t); updateGarden(dt); updateGate(dt); updateShops(dt, t); updateSlump(dt); updateTools(dt, t); updateFeet(dt, t); updateDirt(dt, t);
  updateCat(dt, t, camera.position);
  updateGameClock(dt);
  { const dd = GY - camera.position.y; renderer.toneMappingExposure = (GAME.baseExp || renderer.toneMappingExposure) * (dd > 2 ? lerp(1, 0.35, smooth(clamp((dd - 2) / 12, 0, 1))) : 1); }
  tvAcc += dt; if (tvAcc > 0.066){ if (tvOn) drawTV(t); tvAcc = 0; }
  updateClock();
  updateCamera();
  hudAcc += dt; if (started && hudAcc > 0.05){ updateHUD(); hudAcc = 0; }
  if (!noRender) renderer.render(scene, camera);
}
UNITS.forEach(applyUnit);
applyClock(GAME.h); $('#clockTxt').textContent = clockText();
updateCamera();
try { renderer.compile(scene, camera); } catch (_) {}
requestAnimationFrame(frame);

goBtn.disabled = false;
goBtn.textContent = 'Step inside';
statusEl.textContent = '';
goBtn.addEventListener('click', () => {
  started = true; initAudio();
  $('#start').classList.add('gone');
  hudIds.forEach(id => $(id).classList.remove('hidden')); refreshFinds();
  if (!IS_TOUCH && canvas.requestPointerLock && !lockFailed){ try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { lockFailed = true; }); } catch (_) { lockFailed = true; } }
  canvas.focus({ preventScroll: true });
  setTimeout(() => $('#touchHint').classList.add('hidden'), 9000);
});
window.__house = { GAME, applyClock, skipTime, cycleSpeed, DIRT, addDirt, get swimming(){ return swimming; }, FOOT, wearShoes, PRINTS, surfaceType, ladders, pocketAll(){ return pocket; }, boards, get slumpBox(){ return slumpBox; }, throwHeld, THROWABLES, get money(){ return money; }, set money(v){ money = v; refreshFinds(); }, openShop, closeShop, buy, sell, SHOPS, veins, GATE, setGate, terrainH, jump, toggleCrouch, SHAPES, setShape(i){ shapeIdx = i; refreshHeld(); }, pocket, digTarget, ITEMS, pickUp, useHeld, putDown, get held(){ return held; }, BATH, DOORS, U, UNITS, doAction, updateTarget, get target(){ return target; }, get seatState(){ return seatState; }, standUp, sim(sec){ let n = last; for (let i = 0; i < sec * 20; i++){ n += 50; tick(n, true); } }, tick, updateHUD, drawMap, scene, camera, renderer, player, cs, colliders, applyTime, toggleNight, get nightT(){ return nightT; }, setNight(v){ GAME.h = v > 0.5 ? 22 : 12; GAME.ff = null; applyClock(GAME.h); }, petCat, startWalk, NODES, arrive };
})();
</script>
</body>
</html>
