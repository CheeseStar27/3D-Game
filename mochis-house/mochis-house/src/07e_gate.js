
// ================= AUTOMATIC GATE (controlled from a panel inside the front door) =================
const GATE = { k: 0, target: 0, auto: false, idle: 0, autoOpened: false, moving: false, blink: 0, stateTxt: '' };
{
  const white = M('#f1efe9', 0.7), dark = M('#2f3331', 0.55, 0.4), gz = 14, y0 = GY;
  // posts
  for (const x of [-1.87, 0.67]){ boxB(0.14, 1.35, 0.14, white, x, y0, gz, scene); boxB(0.18, 0.04, 0.18, white, x, y0 + 1.35, gz, scene, false); addCol(x - 0.08, x + 0.08, gz - 0.08, gz + 0.08); }
  boxB(0.16, 0.22, 0.1, dark, -1.87, y0 + 0.35, gz - 0.13, scene);            // motor box on the inside of the left post
  GATE.lampMat = new THREE.MeshStandardMaterial({ color: C('#d98a2b'), roughness: 0.3, emissive: C('#ffa53a'), emissiveIntensity: 0 });
  sph(0.05, GATE.lampMat, 0.67, y0 + 1.43, gz, scene, 1, 1.2, 1);
  // leaves: built along local +x from the hinge
  function leaf(px, closedRy){
    const p = new THREE.Group(); p.position.set(px, y0, gz); p.rotation.y = closedRy; scene.add(p); movers.push(p);
    const L = 1.18;
    for (const y of [0.22, 0.82]) boxB(L, 0.06, 0.045, white, L / 2, y, 0, p);
    boxB(0.06, 1.0, 0.045, white, 0.03, 0.05, 0, p); boxB(0.06, 1.0, 0.045, white, L - 0.03, 0.05, 0, p);
    const P = []; for (let i = 0; i < 7; i++){ const x = 0.14 + i * 0.15, g = new THREE.BoxGeometry(0.08, 1.02, 0.025); g.translate(x, 0.05 + 0.51, 0); P.push(g); const tip = new THREE.ConeGeometry(0.057, 0.08, 4); tip.rotateY(PI / 4); tip.scale(1, 1, 0.3); tip.translate(x, 1.11, 0); P.push(tip); }
    mesh(merge(P), white, 0, 0, 0, p, true, true);
    const br = boxB(1.2, 0.05, 0.03, white, L / 2, 0.5, 0.02, p); br.rotation.z = 0.48;
    boxB(0.03, 0.14, 0.03, dark, L - 0.08, 0.55, 0.035, p, false);
    return p;
  }
  GATE.left = leaf(-1.8, 0); GATE.right = leaf(0.6, PI);
  addCol(-1.8, 0.6, gz - 0.05, gz + 0.05); GATE.cClosed = colliders[colliders.length - 1];
  addCol(-1.86, -1.74, gz - 1.2, gz); GATE.cL = colliders[colliders.length - 1];
  addCol(0.54, 0.66, gz - 1.2, gz); GATE.cR = colliders[colliders.length - 1];
  GATE.cL.off = GATE.cR.off = true;
  // a letterbox by the gate, just for looks
  boxB(0.07, 1.0, 0.07, dark, 1.2, y0, gz + 0.3, scene); rboxB(0.3, 0.26, 0.42, 0.06, M('#2f4a48', 0.45, 0.2), 1.2, y0 + 1.0, gz + 0.3, scene);
}
// ---- indoor gate control panel, next to the living-room light switch ----
const gateScreen = makeCanvas(160, 100), gateCtx = gateScreen.getContext('2d'), gateTex = new THREE.CanvasTexture(gateScreen); gateTex.encoding = THREE.sRGBEncoding;
const gateLed = new THREE.MeshStandardMaterial({ color: C('#b84a3a'), emissive: C('#e0563f'), emissiveIntensity: 1.2, roughness: 0.3 });
const autoLed = new THREE.MeshStandardMaterial({ color: C('#5d6b63'), emissive: C('#4fd08a'), emissiveIntensity: 0, roughness: 0.3 });
function gateState(){ return GATE.k <= 0.001 ? 'Closed' : GATE.k >= 0.999 ? 'Open' : GATE.target ? 'Opening\u2026' : 'Closing\u2026'; }
function drawGateScreen(){
  const g = gateCtx, W = 160, Hh = 100, st = gateState();
  if (st + GATE.auto === GATE.stateTxt) return; GATE.stateTxt = st + GATE.auto;
  g.fillStyle = '#10181a'; g.fillRect(0, 0, W, Hh);
  g.fillStyle = '#7fa89a'; g.font = '600 15px system-ui, sans-serif'; g.fillText('GATE', 12, 24);
  if (GATE.auto){ g.fillStyle = '#4fd08a'; g.fillRect(W - 58, 10, 46, 20); g.fillStyle = '#10181a'; g.font = '700 13px system-ui, sans-serif'; g.fillText('AUTO', W - 51, 25); }
  g.fillStyle = '#e9f1ee'; g.font = '600 24px system-ui, sans-serif'; g.fillText(st, 12, 62);
  g.strokeStyle = '#7fa89a'; g.lineWidth = 3; g.beginPath(); const a = GATE.k * 1.3; g.moveTo(22, 88); g.lineTo(22 + Math.cos(a) * 34, 88 - Math.sin(a) * 34); g.moveTo(138, 88); g.lineTo(138 - Math.cos(a) * 34, 88 - Math.sin(a) * 34); g.stroke();
  g.fillStyle = '#7fa89a'; g.fillRect(16, 86, 12, 6); g.fillRect(132, 86, 12, 6);
  gateTex.needsUpdate = true;
}
{
  const g = grp(-1.58, 4.918, PI, scene, 0);
  boxB(0.13, 0.2, 0.014, M('#eceae4', 0.5), 0, 1.2, 0, g, false);
  mesh(new THREE.PlaneGeometry(0.1, 0.0625), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: gateTex, emissiveIntensity: 0.9, roughness: 0.2 }), 0, 1.345, 0.0075, g, false, false);
  const btn = new THREE.Group(); g.add(btn);
  const b = cyl(0.02, 0.02, 0.01, M('#dcdad3', 0.4), 0, 1.265, 0.012, btn, 20, false); b.rotation.x = PI / 2;
  const ring = mesh(new THREE.TorusGeometry(0.024, 0.003, 6, 24), gateLed, 0, 1.265, 0.012, btn, false, false);
  hitProxy(btn, 0.14, 0.16, 0.05, 0, 1.3, 0.02);
  tagAct(btn, { kind: 'custom', label: () => (GATE.target ? 'Close the gate' : 'Open the gate'), use: () => { setGate(!GATE.target, true); } });
  const ab = new THREE.Group(); g.add(ab);
  const a2 = cyl(0.009, 0.009, 0.008, M('#dcdad3', 0.4), 0.035, 1.21, 0.012, ab, 14, false); a2.rotation.x = PI / 2;
  sph(0.004, autoLed, -0.02, 1.21, 0.012, ab);
  hitProxy(ab, 0.13, 0.05, 0.05, 0, 1.2, 0.035);
  tagAct(ab, { kind: 'custom', label: () => (GATE.auto ? 'Turn off automatic gate' : 'Turn on automatic gate'), use: () => {
    GATE.auto = !GATE.auto; autoLed.emissiveIntensity = GATE.auto ? 1.4 : 0; beep(GATE.auto ? 1320 : 880);
    toast(GATE.auto ? 'Automatic gate on. It opens when you walk up to it and closes behind you.' : 'Automatic gate off');
    if (!GATE.auto) GATE.autoOpened = false; drawGateScreen();
  } });
  drawGateScreen();
}
function setGate(open, manual){
  if ((GATE.target ? 1 : 0) === (open ? 1 : 0)) return;
  GATE.target = open ? 1 : 0; GATE.autoOpened = !manual && open; GATE.idle = 0;
  beep(open ? 1175 : 880); sfx('click');
  if (manual) toast(open ? 'Opening the gate' : 'Closing the gate');
}
function beep(f){
  if (!audio) return; const now = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
  o.frequency.value = f; g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.01); g.gain.linearRampToValueAtTime(0.0001, now + 0.14);
  o.connect(g); g.connect(audio.destination); o.start(now); o.stop(now + 0.16);
}
let gateHum = null;
function gateMotor(on){
  if (!audio) return;
  if (on && !gateHum){
    const o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
    o.type = 'sawtooth'; o.frequency.value = 62; f.type = 'lowpass'; f.frequency.value = 260; g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.035, audio.currentTime + 0.2);
    o.connect(f); f.connect(g); g.connect(audio.destination); o.start(); gateHum = { o, g };
  } else if (!on && gateHum){ const h = gateHum; h.g.gain.linearRampToValueAtTime(0, audio.currentTime + 0.2); setTimeout(() => { try { h.o.stop(); } catch (_) {} }, 300); gateHum = null; }
}
function updateGate(dt){
  const px = player.x, pz = player.z, near = Math.hypot(px + 0.6, pz - 14) < 3.2;
  const inSwing = px > -1.95 && px < 0.75 && pz > 12.6 && pz < 14.35;
  if (GATE.auto){
    if (near){ GATE.idle = 0; if (!GATE.target){ setGate(true, false); } }
    else if (GATE.target && GATE.autoOpened){ GATE.idle += dt; if (GATE.idle > 2.5) setGate(false, false); }
  }
  // safety sensor: never close on someone standing in the gateway
  if (!GATE.target && GATE.k > 0 && inSwing){ GATE.target = 1; GATE.autoOpened = GATE.auto; toast('Gate sensor: something\u2019s in the way'); }
  const was = GATE.k;
  if (GATE.k !== GATE.target) GATE.k = GATE.target ? Math.min(1, GATE.k + dt / 3.2) : Math.max(0, GATE.k - dt / 3.2);
  const moving = GATE.k !== was;
  const e = smooth(GATE.k);
  GATE.left.rotation.y = e * PI / 2; GATE.right.rotation.y = PI - e * PI / 2;
  GATE.cClosed.off = GATE.k > 0.2; GATE.cL.off = GATE.cR.off = GATE.k < 0.85;
  if (moving){ GATE.blink += dt; GATE.lampMat.emissiveIntensity = (GATE.blink % 0.6) < 0.3 ? 2.4 : 0.2; }
  else GATE.lampMat.emissiveIntensity = 0;
  if (moving !== GATE.moving){ GATE.moving = moving; gateMotor(moving); if (!moving) beep(GATE.k > 0.5 ? 1568 : 660); }
  gateLed.emissive.set(moving ? '#ffa53a' : GATE.k > 0.5 ? '#4fd08a' : '#e0563f');
  gateLed.emissiveIntensity = moving ? ((GATE.blink % 0.6) < 0.3 ? 1.6 : 0.3) : 1.2;
  drawGateScreen();
}
