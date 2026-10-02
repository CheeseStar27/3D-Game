
// ================= TIME OF DAY =================
// Kuala Lumpur-ish days: sunrise about 07:05, sunset about 19:15, almost no seasons.
const SUNRISE = 7.08, SUNSET = 19.25;
const SPEEDS = [{ s: 60, name: 'Normal speed: 1 game minute per second' }, { s: 600, name: 'Fast: 10 game minutes per second' }, { s: 1, name: 'Real time' }, { s: 0, name: 'Time paused' }];
const GAME = (() => { const d = new Date(); return { h: d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600, day: d.getDay(), speed: 0, ff: null, acc: 0, lastMin: -1, wasNight: null }; })();
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SUNSET_PAL = { top: '#4d63a6', hor: '#f58f52', fog: '#e8a57c', sc: '#ffa252' };
const _east = new THREE.Vector3(1, 0, 0.15).normalize(), _up = new THREE.Vector3(0, 1, 0), _south = new THREE.Vector3(0, 0, 1);
const sunDirNow = new THREE.Vector3(), moonDirNow = new THREE.Vector3(), _cA = new THREE.Color(), _cB = new THREE.Color();
function sunAngle(h){ return (h - SUNRISE) / (SUNSET - SUNRISE) * PI; }   // 0 at sunrise, PI at sunset
function mixPal(out, day, night, gold, kN, kG){ _cA.copy(C(day)).lerp(C(night), kN); return out.copy(_cA).lerp(C(gold), kG); }
function applyClock(h){
  const th = sunAngle(h), elev = Math.sin(th);
  // the sun's path: up from the east, high and a little to the front of the house at noon, down in the west
  sunDirNow.copy(_east).multiplyScalar(Math.cos(th)).addScaledVector(_up, Math.sin(th)).addScaledVector(_south, 0.38).normalize();
  moonDirNow.copy(_east).multiplyScalar(-Math.cos(th) * 0.8).addScaledVector(_up, Math.max(0.25, -Math.sin(th))).addScaledVector(_south, 0.3).normalize();
  const dayAmt = smooth(clamp((elev + 0.1) / 0.3, 0, 1)), kN = 1 - dayAmt;
  const gold = clamp(1 - Math.abs(elev - 0.03) / 0.26, 0, 1) * (elev > -0.2 ? 1 : 0);
  nightT = nightTarget = kN;
  mixPal(skyMat.uniforms.top.value, DAY.top, NIGHT.top, SUNSET_PAL.top, kN, gold * 0.55);
  mixPal(skyMat.uniforms.hor.value, DAY.hor, NIGHT.hor, SUNSET_PAL.hor, kN, gold * 0.95);
  skyMat.uniforms.bot.value.copy(C(DAY.bot)).lerp(C(NIGHT.bot), kN);
  skyMat.uniforms.night.value = kN;
  skyMat.uniforms.sunDir.value.copy(sunDirNow); skyMat.uniforms.moonDir.value.copy(moonDirNow);
  mixPal(scene.fog.color, DAY.fog, NIGHT.fog, SUNSET_PAL.fog, kN, gold * 0.7);
  hemi.color.copy(C(DAY.hs)).lerp(C(NIGHT.hs), kN); hemi.groundColor.copy(C(DAY.hg)).lerp(C(NIGHT.hg), kN);
  hemi.intensity = lerp(DAY.hi, NIGHT.hi, kN) * (1 - gold * 0.15);
  // sunlight by day, moonlight by night (the switch happens while both are dim)
  if (elev > -0.05){
    sun.color.copy(C(DAY.sc)).lerp(C(SUNSET_PAL.sc), gold);
    sun.intensity = DAY.si * smooth(clamp((elev + 0.05) / 0.35, 0, 1)) * (0.75 + 0.25 * clamp(elev, 0, 1));
    sun.position.copy(sunDirNow).multiplyScalar(26).add(sun.target.position);
  } else {
    sun.color.copy(C(NIGHT.sc)); sun.intensity = NIGHT.si * smooth(clamp((-elev - 0.05) / 0.25, 0, 1));
    sun.position.copy(moonDirNow).multiplyScalar(26).add(sun.target.position);
  }
  renderer.toneMappingExposure = GAME.baseExp = lerp(DAY.exp, NIGHT.exp, kN);
  scene.environment = kN > 0.5 ? ENV_NIGHT : ENV_DAY;
  for (const g of glows) g.mat.emissiveIntensity = lerp(g.day, g.night, kN);
  for (const L of lightsList) L.l.intensity = lerp(L.day, L.night, kN);
  // lamps switch themselves on in the evening and off in the morning
  const isNight = kN > 0.55;
  if (GAME.wasNight !== null && isNight !== GAME.wasNight && started){ UNITS.forEach(u => u.on = isNight); toast(isNight ? 'Evening. The lamps come on.' : 'Good morning! The sun is up.'); }
  if (GAME.wasNight === null) UNITS.forEach(u => u.on = isNight);
  GAME.wasNight = isNight;
  $('#nightLabel').textContent = isNight ? 'Day' : 'Night';
  $('#icoMoon').style.display = isNight ? 'none' : ''; $('#icoSun').style.display = isNight ? '' : 'none';
  nightBtn.setAttribute('aria-label', isNight ? 'Skip to morning' : 'Skip to evening');
}
function clockText(){ const m = Math.floor(GAME.h * 60) % 1440, hh = Math.floor(m / 60), mm = m % 60; return `${DAYS[GAME.day]} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; }
function updateGameClock(dt){
  if (GAME.ff != null){
    // fast-forward towards the next morning or evening
    const step = dt * 4.5, left = (GAME.ff - GAME.h + 24) % 24;
    if (left <= step || left > 23.9){ GAME.h = GAME.ff; GAME.ff = null; } else GAME.h += step;
  } else GAME.h += dt * SPEEDS[GAME.speed].s / 3600;
  if (GAME.h >= 24){ GAME.h -= 24; GAME.day = (GAME.day + 1) % 7; }
  GAME.acc += dt;
  if (GAME.acc > 0.1 || GAME.ff != null){ GAME.acc = 0; applyClock(GAME.h); }
  const min = Math.floor(GAME.h * 60);
  if (min !== GAME.lastMin){ GAME.lastMin = min; $('#clockTxt').textContent = clockText(); }
}
function skipTime(){
  const night = GAME.wasNight;
  GAME.ff = night ? 7.25 : 19.6;
  toast(night ? 'Skipping ahead to morning\u2026' : 'Skipping ahead to evening\u2026');
}
function cycleSpeed(){ GAME.speed = (GAME.speed + 1) % SPEEDS.length; toast(SPEEDS[GAME.speed].name); $('#clockBtn').setAttribute('aria-label', 'Time: ' + SPEEDS[GAME.speed].name + '. Tap to change.'); $('#clockBtn').classList.toggle('paused', SPEEDS[GAME.speed].s === 0); }
$('#clockBtn').addEventListener('click', () => { cycleSpeed(); $('#clockBtn').blur(); });
