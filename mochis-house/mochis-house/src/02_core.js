(function(){
'use strict';
const $ = s => document.querySelector(s);
const statusEl = $('#status'), goBtn = $('#go');
function fail(msg){ goBtn.textContent = 'Unable to load'; statusEl.textContent = msg; }
if (typeof THREE === 'undefined'){ fail('The 3D engine did not load. Check your connection, then reload the page.'); return; }

const IS_TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
if (IS_TOUCH) document.body.classList.add('touch');
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2, PI = Math.PI;
const H = 2.8, T = 0.15;           // ceiling height, wall thickness
const clamp = (v,a,b) => v < a ? a : v > b ? b : v;
const lerp = (a,b,t) => a + (b-a)*t;
const smooth = t => t*t*(3-2*t);
function RNG(seed){ let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const C = hex => new THREE.Color(hex).convertSRGBToLinear();

// ---------- renderer / scene ----------
const canvas = $('#view');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) { fail('WebGL is not available in this browser, so the house cannot be shown.'); return; }
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const MAXANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(IS_TOUCH ? 74 : 70, innerWidth / innerHeight, 0.04, 700);
camera.rotation.order = 'YXZ';
scene.add(camera);

// ---------- canvas textures ----------
function makeCanvas(w, h){ const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function canvasTex(w, h, draw, o = {}){
  const c = makeCanvas(w, h), g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (o.srgb !== false) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = MAXANISO;
  if (o.wrap !== false){ t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
  return t;
}
function hsl(h, s, l, a = 1){ return `hsla(${h},${s}%,${l}%,${a})`; }
function noisePass(g, w, h, amt, seed, mono = true){
  const r = RNG(seed), d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4){
    const n = (r() - 0.5) * amt;
    if (mono){ p[i] += n; p[i+1] += n; p[i+2] += n; }
    else { p[i] += (r()-0.5)*amt; p[i+1] += (r()-0.5)*amt; p[i+2] += (r()-0.5)*amt; }
  }
  g.putImageData(d, 0, 0);
}

// wood plank floor; planks run along canvas v (seamless in both directions)
function woodFloor(seed, hue, sat, light, px = 1024, cols = 8){
  const rng = RNG(seed);
  return canvasTex(px, px, (g, W, Hh) => {
    const pw = W / cols;
    g.fillStyle = hsl(hue, sat, light * 0.55); g.fillRect(0, 0, W, Hh);
    for (let c = 0; c < cols; c++){
      const lens = []; let sum = 0;
      while (sum < Hh){ const l = Hh * (0.3 + rng() * 0.5); lens.push(l); sum += l; }
      const k = Hh / sum; let y = rng() * Hh;
      for (const L0 of lens){
        const L = L0 * k;
        const dl = (rng() - 0.5) * 9, dh = (rng() - 0.5) * 4, ds = (rng() - 0.5) * 8;
        const seedP = Math.floor(rng() * 1e9);
        for (const off of [0, -Hh]) drawPlank(g, c * pw, y + off, pw, L, hue + dh, sat + ds, light + dl, seedP);
        y += L; if (y > Hh) y -= Hh;
      }
    }
    noisePass(g, W, Hh, 10, seed + 7);
  });
}
function drawPlank(g, x, y, w, l, h, s, li, seed){
  const r = RNG(seed);
  g.save(); g.beginPath(); g.rect(x, y, w, l); g.clip();
  const grd = g.createLinearGradient(x, 0, x + w, 0);
  grd.addColorStop(0, hsl(h, s, li - 2)); grd.addColorStop(0.5, hsl(h, s, li + 2)); grd.addColorStop(1, hsl(h, s, li - 1));
  g.fillStyle = grd; g.fillRect(x, y, w, l);
  // grain lines
  const lines = 22 + Math.floor(r() * 10);
  for (let i = 0; i < lines; i++){
    const gx = x + r() * w, amp = 1 + r() * 4, freq = 0.004 + r() * 0.01, ph = r() * 10;
    g.strokeStyle = r() < 0.5 ? hsl(h - 4, s + 6, li - 14 - r() * 10, 0.22 + r() * 0.25) : hsl(h + 3, s - 5, li + 8, 0.15);
    g.lineWidth = 0.6 + r() * 1.6;
    g.beginPath();
    for (let yy = 0; yy <= l; yy += 8){ const xx = gx + Math.sin(yy * freq + ph) * amp + Math.sin(yy * freq * 3.1 + ph) * amp * 0.3; yy === 0 ? g.moveTo(xx, y + yy) : g.lineTo(xx, y + yy); }
    g.stroke();
  }
  // cathedral figure
  if (r() < 0.55){
    const cx = x + w * (0.3 + r() * 0.4), cy = y + l * (0.2 + r() * 0.6);
    for (let k = 0; k < 7; k++){
      g.strokeStyle = hsl(h - 3, s + 8, li - 16, 0.18); g.lineWidth = 1.2;
      g.beginPath(); g.ellipse(cx, cy, 4 + k * 5, 40 + k * 26, 0, 0, TAU); g.stroke();
    }
  }
  if (r() < 0.18){ // knot
    const kx = x + w * (0.2 + r() * 0.6), ky = y + r() * l;
    g.fillStyle = hsl(h - 6, s + 10, li - 28, 0.7); g.beginPath(); g.ellipse(kx, ky, 3 + r() * 3, 5 + r() * 5, 0, 0, TAU); g.fill();
  }
  g.restore();
  g.fillStyle = 'rgba(40,24,12,0.55)'; g.fillRect(x, y, 1.5, l); g.fillRect(x, y, w, 1.5);
  g.fillStyle = 'rgba(255,240,220,0.10)'; g.fillRect(x + 1.5, y + 1.5, 1, l);
}

// plain wood grain (for furniture), grain along u
function woodGrain(seed, hue, sat, light, px = 512){
  const r = RNG(seed);
  return canvasTex(px, px, (g, W, Hh) => {
    g.fillStyle = hsl(hue, sat, light); g.fillRect(0, 0, W, Hh);
    for (let i = 0; i < 110; i++){
      const y0 = r() * Hh, amp = 2 + r() * 6, f = 0.006 + r() * 0.012, ph = r() * 9;
      g.strokeStyle = r() < 0.6 ? hsl(hue - 3, sat + 5, light - 10 - r() * 10, 0.25) : hsl(hue + 2, sat - 5, light + 7, 0.18);
      g.lineWidth = 0.7 + r() * 1.8; g.beginPath();
      for (let x = -8; x <= W + 8; x += 8){ const yy = y0 + Math.sin(x * f + ph) * amp; x === -8 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
      g.stroke();
    }
    noisePass(g, W, Hh, 8, seed + 3);
  });
}

function plasterTex(){
  return canvasTex(256, 256, (g, W, Hh) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, Hh);
    const r = RNG(11);
    for (let i = 0; i < 40; i++){ const x = r()*W, y = r()*Hh, rad = 30 + r()*50, gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(0,0,0,0.012)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    noisePass(g, W, Hh, 6, 12);
  });
}
function fabricTex(seed = 3, amt = 26, weave = 0.05){
  return canvasTex(256, 256, (g, W, Hh) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, Hh);
    g.fillStyle = `rgba(0,0,0,${weave})`;
    for (let y = 0; y < Hh; y += 2) g.fillRect(0, y, W, 1);
    g.fillStyle = `rgba(0,0,0,${weave * 0.7})`;
    for (let x = 0; x < W; x += 2) g.fillRect(x, 0, 1, Hh);
    noisePass(g, W, Hh, amt, seed);
  });
}
function knitTex(){
  return canvasTex(256, 256, (g, W, Hh) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, Hh);
    for (let y = 0; y < Hh; y += 16) for (let x = 0; x < W; x += 16){
      g.strokeStyle = 'rgba(0,0,0,0.20)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 8, y + 14); g.lineTo(x + 14, y); g.stroke();
    }
    noisePass(g, W, Hh, 16, 21);
  });
}

// rugs
function kilimTex(){
  return canvasTex(640, 768, (g, W, Hh) => {
    const rust = '#a8513a', ink = '#2c3a55', cream = '#ebe2cf', mustard = '#c99843', sage = '#7f8f6b', dark = '#2a2320';
    g.fillStyle = cream; g.fillRect(0, 0, W, Hh);
    g.fillStyle = rust; g.fillRect(24, 24, W - 48, Hh - 48);
    g.fillStyle = cream; g.fillRect(44, 44, W - 88, Hh - 88);
    g.fillStyle = ink; g.fillRect(56, 56, W - 112, Hh - 112);
    g.fillStyle = cream; g.fillRect(76, 76, W - 152, Hh - 152);
    // border triangles
    g.fillStyle = mustard;
    for (let x = 60; x < W - 60; x += 24){ g.beginPath(); g.moveTo(x, 56); g.lineTo(x + 12, 72); g.lineTo(x + 24, 56); g.fill(); g.beginPath(); g.moveTo(x, Hh - 56); g.lineTo(x + 12, Hh - 72); g.lineTo(x + 24, Hh - 56); g.fill(); }
    // field
    g.fillStyle = rust; g.fillRect(96, 96, W - 192, Hh - 192);
    const cx = W / 2, rows = 3;
    for (let i = 0; i < rows; i++){
      const cy = 96 + (Hh - 192) * (i + 0.5) / rows, s = 92;
      const layer = (sz, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(cx, cy - sz); g.lineTo(cx + sz * 1.25, cy); g.lineTo(cx, cy + sz); g.lineTo(cx - sz * 1.25, cy); g.closePath(); g.fill(); };
      layer(s, cream); layer(s - 14, ink); layer(s - 28, mustard); layer(s - 44, rust); layer(s - 58, cream); layer(s - 70, dark);
      for (const sx of [-1, 1]){ g.fillStyle = sage; g.beginPath(); const bx = cx + sx * (W / 2 - 150); g.moveTo(bx, cy - 36); g.lineTo(bx + 28, cy); g.lineTo(bx, cy + 36); g.lineTo(bx - 28, cy); g.fill(); g.fillStyle = cream; g.fillRect(bx - 5, cy - 5, 10, 10); }
    }
    // weave lines
    g.globalAlpha = 0.1; g.fillStyle = '#000'; for (let y = 0; y < Hh; y += 3) g.fillRect(0, y, W, 1); g.globalAlpha = 1;
    noisePass(g, W, Hh, 26, 31, false);
  }, { wrap: false });
}
function berberTex(){
  return canvasTex(640, 560, (g, W, Hh) => {
    g.fillStyle = '#ebe5d8'; g.fillRect(0, 0, W, Hh);
    const r = RNG(41);
    g.strokeStyle = 'rgba(46,40,36,0.85)'; g.lineCap = 'round';
    const cw = 120, ch = 140;
    for (let row = -1; row < Hh / ch + 1; row++) for (let col = -1; col < W / cw + 1; col++){
      const x = col * cw + (row % 2 ? cw / 2 : 0), y = row * ch;
      g.lineWidth = 5 + r() * 3;
      g.beginPath();
      const j = () => (r() - 0.5) * 10;
      g.moveTo(x + j(), y - ch / 2 + j()); g.lineTo(x + cw / 2 + j(), y + j()); g.lineTo(x + j(), y + ch / 2 + j()); g.lineTo(x - cw / 2 + j(), y + j()); g.closePath(); g.stroke();
    }
    noisePass(g, W, Hh, 34, 42);
    g.globalAlpha = 0.25;
    for (let i = 0; i < 4000; i++){ g.fillStyle = r() < 0.5 ? '#fff' : '#cfc6b5'; g.fillRect(r() * W, r() * Hh, 2, 2); }
    g.globalAlpha = 1;
  }, { wrap: false });
}
function juteTex(seed = 51, border = true){
  return canvasTex(512, 512, (g, W, Hh) => {
    g.fillStyle = '#c3a476'; g.fillRect(0, 0, W, Hh);
    const r = RNG(seed);
    for (let y = 0; y < Hh; y += 8) for (let x = 0; x < W; x += 8){
      const hor = ((x >> 3) + (y >> 3)) % 2 === 0;
      g.fillStyle = hsl(36 + r() * 6, 38 + r() * 10, 56 + r() * 12);
      if (hor) g.fillRect(x, y + 1, 8, 6); else g.fillRect(x + 1, y, 6, 8);
    }
    if (border){ g.strokeStyle = 'rgba(70,52,34,0.8)'; g.lineWidth = 16; g.strokeRect(8, 8, W - 16, Hh - 16); }
    noisePass(g, W, Hh, 20, seed + 1);
  }, { wrap: false });
}
function roundJuteTex(){
  return canvasTex(512, 512, (g, W) => {
    const r = RNG(61), c = W / 2;
    for (let rad = c; rad > 0; rad -= 7){
      g.fillStyle = hsl(34 + r() * 8, 34 + r() * 12, 52 + r() * 16);
      g.beginPath(); g.arc(c, c, rad, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(80,60,35,0.25)'; g.lineWidth = 1.5; g.stroke();
    }
    g.fillStyle = 'rgba(58,44,30,0.0)';
    noisePass(g, W, W, 18, 62);
  }, { wrap: false });
}
function runnerTex(){
  return canvasTex(768, 256, (g, W, Hh) => {
    const cols = ['#2f3c52', '#e9e1d0', '#a9573e', '#e9e1d0', '#2f3c52', '#c99843', '#2f3c52', '#e9e1d0', '#a9573e', '#e9e1d0', '#2f3c52'];
    const bh = Hh / cols.length;
    cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, i * bh, W, bh + 1); });
    g.globalAlpha = 0.14; g.fillStyle = '#000'; for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, Hh); g.globalAlpha = 1;
    noisePass(g, W, Hh, 24, 71, false);
  }, { wrap: false });
}

// art
function artTex(kind, w = 512, h = 640){
  return canvasTex(w, h, (g, W, Hh) => {
    const r = RNG(kind.length * 97 + 5);
    if (kind === 'arches'){
      g.fillStyle = '#efe9df'; g.fillRect(0, 0, W, Hh);
      const cols = ['#6f8a6a', '#d19a52', '#c97d6b', '#2f3f4e'];
      const cx = W / 2, by = Hh * 0.78;
      for (let i = 0; i < 4; i++){
        const rad = W * 0.36 - i * W * 0.075; g.fillStyle = cols[i];
        g.beginPath(); g.moveTo(cx - rad, by); g.arc(cx, by - 0, rad, PI, 0); g.lineTo(cx + rad, by); g.closePath(); g.fill();
      }
      g.fillStyle = '#d19a52'; g.beginPath(); g.arc(W * 0.74, Hh * 0.2, W * 0.07, 0, TAU); g.fill();
      g.fillStyle = '#2f3f4e'; g.fillRect(W * 0.14, by, W * 0.72, 5);
    } else if (kind === 'hills'){
      const grd = g.createLinearGradient(0, 0, 0, Hh); grd.addColorStop(0, '#e9e3d6'); grd.addColorStop(1, '#f2ede3');
      g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#e1a86b'; g.beginPath(); g.arc(W * 0.68, Hh * 0.36, Hh * 0.14, 0, TAU); g.fill();
      const layers = ['#a9b9a2', '#7f9a86', '#5d7a6c', '#3e5a55'];
      layers.forEach((c, i) => {
        g.fillStyle = c; g.beginPath(); g.moveTo(0, Hh);
        const base = Hh * (0.5 + i * 0.11), ph = r() * 6;
        for (let x = 0; x <= W; x += 8) g.lineTo(x, base + Math.sin(x * 0.012 + ph) * Hh * 0.06 + Math.sin(x * 0.031 + ph * 2) * Hh * 0.025);
        g.lineTo(W, Hh); g.fill();
      });
    } else if (kind === 'leaf'){
      g.fillStyle = '#f1ece2'; g.fillRect(0, 0, W, Hh);
      g.strokeStyle = '#2f3b33'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(W * 0.5, Hh * 0.88); g.bezierCurveTo(W * 0.48, Hh * 0.6, W * 0.55, Hh * 0.35, W * 0.5, Hh * 0.12); g.stroke();
      for (let i = 0; i < 7; i++){
        const t = 0.2 + i * 0.1, y = Hh * (0.85 - t * 0.8), s = i % 2 ? 1 : -1, len = W * (0.28 - i * 0.02);
        g.fillStyle = i % 3 === 0 ? '#7d9474' : '#9fb096';
        g.beginPath(); g.moveTo(W * 0.5, y); g.quadraticCurveTo(W * 0.5 + s * len * 0.6, y - Hh * 0.12, W * 0.5 + s * len, y - Hh * 0.05); g.quadraticCurveTo(W * 0.5 + s * len * 0.5, y + Hh * 0.02, W * 0.5, y); g.fill();
      }
    } else if (kind === 'sun'){
      g.fillStyle = '#ece5d9'; g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#c8663f'; g.beginPath(); g.arc(W / 2, Hh * 0.45, W * 0.26, 0, TAU); g.fill();
      g.fillStyle = '#304055'; g.fillRect(0, Hh * 0.62, W, Hh * 0.38);
      g.fillStyle = '#e1b36a'; for (let i = 0; i < 5; i++) g.fillRect(W * 0.18, Hh * (0.68 + i * 0.05), W * 0.64 * (1 - i * 0.15), 5);
    } else if (kind === 'waves'){
      g.fillStyle = '#eef0ec'; g.fillRect(0, 0, W, Hh);
      const cols = ['#4a6b7c', '#7fa0a8', '#c9d4cc', '#d8a86d'];
      for (let i = 0; i < 9; i++){
        g.strokeStyle = cols[i % 4]; g.lineWidth = 14; g.beginPath();
        const y0 = Hh * 0.15 + i * Hh * 0.085;
        for (let x = -10; x <= W + 10; x += 6){ const y = y0 + Math.sin(x * 0.03 + i * 0.7) * 12; x === -10 ? g.moveTo(x, y) : g.lineTo(x, y); }
        g.stroke();
      }
    } else if (kind === 'blocks'){
      g.fillStyle = '#efe9df'; g.fillRect(0, 0, W, Hh);
      const cols = ['#5c7466', '#d39f5a', '#bd6e5a', '#294052', '#cdb89a'];
      for (let i = 0; i < 9; i++){ g.fillStyle = cols[i % 5]; const x = r() * W * 0.7, y = r() * Hh * 0.75; g.fillRect(x, y, W * (0.15 + r() * 0.25), Hh * (0.1 + r() * 0.2)); }
    }
    noisePass(g, W, Hh, 10, 5);
  }, { wrap: false });
}

function marbleTex(){
  return canvasTex(1024, 512, (g, W, Hh) => {
    g.fillStyle = '#f2f1ee'; g.fillRect(0, 0, W, Hh);
    const r = RNG(81);
    g.filter = 'blur(1.5px)';
    for (let i = 0; i < 26; i++){
      g.strokeStyle = `rgba(110,110,118,${0.08 + r() * 0.22})`; g.lineWidth = 0.6 + r() * 2.4;
      g.beginPath(); let x = r() * W, y = r() * Hh; g.moveTo(x, y);
      for (let k = 0; k < 6; k++){ const nx = x + (r() - 0.3) * 240, ny = y + (r() - 0.5) * 160; g.quadraticCurveTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 120, nx, ny); x = nx; y = ny; }
      g.stroke();
    }
    g.filter = 'none';
    noisePass(g, W, Hh, 6, 82);
  });
}
function tileTex(){
  return canvasTex(512, 512, (g, W, Hh) => {
    g.fillStyle = '#cfcbc3'; g.fillRect(0, 0, W, Hh);
    const r = RNG(91), tw = W / 4, th = Hh / 8;
    for (let row = 0; row < 8; row++) for (let c = -1; c < 5; c++){
      const x = c * tw + (row % 2 ? tw / 2 : 0), y = row * th;
      const l = 93 + r() * 4;
      const grd = g.createLinearGradient(0, y, 0, y + th); grd.addColorStop(0, hsl(40, 12, l + 2)); grd.addColorStop(1, hsl(40, 10, l - 3));
      g.fillStyle = grd; g.fillRect(x + 3, y + 3, tw - 6, th - 6);
    }
  });
}
function grassTex(){
  return canvasTex(512, 512, (g, W, Hh) => {
    g.fillStyle = '#5f7f3e'; g.fillRect(0, 0, W, Hh);
    const r = RNG(101);
    for (let i = 0; i < 9000; i++){ g.fillStyle = hsl(80 + r() * 25, 35 + r() * 25, 26 + r() * 22, 0.7); const x = r() * W, y = r() * Hh; g.fillRect(x, y, 1.5, 3 + r() * 5); }
    noisePass(g, W, Hh, 14, 102);
  });
}
function blobTex(){
  return canvasTex(128, 128, (g, W) => {
    g.filter = 'blur(13px)'; g.fillStyle = '#000';
    g.beginPath(); if (g.roundRect) g.roundRect(28, 28, 72, 72, 18); else g.rect(28, 28, 72, 72); g.fill();
    g.filter = 'none';
  }, { wrap: false });
}
function roundBlobTex(){
  return canvasTex(128, 128, (g, W) => {
    const grd = g.createRadialGradient(64, 64, 4, 64, 64, 62); grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(0.55, 'rgba(0,0,0,0.55)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, W, W);
  }, { wrap: false });
}
function rattanTex(){
  return canvasTex(256, 256, (g, W) => {
    g.clearRect(0, 0, W, W);
    g.lineWidth = 6; g.lineCap = 'round';
    for (let i = -W; i < W * 2; i += 26){
      g.strokeStyle = '#b58a55'; g.beginPath(); g.moveTo(i, 0); g.lineTo(i + W, W); g.stroke();
      g.strokeStyle = '#a57a47'; g.beginPath(); g.moveTo(i, W); g.lineTo(i + W, 0); g.stroke();
    }
    g.strokeStyle = '#8e6638'; g.lineWidth = 8; for (let y = 0; y < W; y += 64){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  });
}
function furTex(){
  return canvasTex(512, 512, (g, W, Hh) => {
    // u around body (belly at 0.25W, back at 0.75W), v along body (top = head end)
    const r = RNG(111);
    for (let x = 0; x < W; x++){
      const d = Math.abs(((x / W - 0.25 + 1) % 1) - 0.5) * 2; // 1 at belly, 0 at back
      const belly = smooth(clamp((d - 0.5) / 0.3, 0, 1));
      const c = new THREE.Color('#d8883f').lerp(new THREE.Color('#f3dcbc'), belly);
      g.fillStyle = '#' + c.getHexString(); g.fillRect(x, 0, 1, Hh);
    }
    // stripes (rings) fading toward belly
    for (let i = 0; i < 13; i++){
      const y = Hh * (0.14 + i * 0.066) + (r() - 0.5) * 10, th = 9 + r() * 9;
      for (let x = 0; x < W; x += 2){
        const back = Math.abs(((x / W - 0.75 + 1) % 1) - 0.5) * 2; // 1 at back
        const a = smooth(clamp((back - 0.35) / 0.4, 0, 1)) * 0.85;
        if (a <= 0.01) continue;
        const wob = Math.sin(x * 0.05 + i) * 5 + Math.sin(x * 0.013 + i * 2) * 8;
        g.fillStyle = `rgba(150,72,24,${a})`; g.fillRect(x, y + wob, 2, th * (0.5 + back * 0.6));
      }
    }
    g.fillStyle = 'rgba(140,66,22,0.55)'; g.fillRect(W * 0.75 - 10, 0, 20, Hh);
    g.globalAlpha = 0.25;
    for (let i = 0; i < 7000; i++){ g.fillStyle = r() < 0.5 ? '#fff4e2' : '#8a4a1e'; g.fillRect(r() * W, r() * Hh, 1, 4); }
    g.globalAlpha = 1;
  });
}
function clockTex(){
  return canvasTex(512, 512, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#f4f2ed'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    g.fillStyle = '#1f2522';
    for (let i = 0; i < 60; i++){
      const a = i / 60 * TAU, big = i % 5 === 0, l = big ? 34 : 14, w = big ? 7 : 2.5;
      g.save(); g.translate(c, c); g.rotate(a); g.fillRect(-w / 2, -c + 22, w, l); g.restore();
    }
    g.font = '600 34px "DM Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('12', c, 110); g.fillText('6', c, W - 104); g.fillText('3', W - 104, c); g.fillText('9', 104, c);
  }, { wrap: false });
}
function heartTex(){
  return canvasTex(128, 128, (g) => {
    g.fillStyle = '#f0607d'; g.beginPath();
    g.moveTo(64, 108); g.bezierCurveTo(18, 78, 6, 48, 26, 28); g.bezierCurveTo(42, 12, 60, 20, 64, 36);
    g.bezierCurveTo(68, 20, 86, 12, 102, 28); g.bezierCurveTo(122, 48, 110, 78, 64, 108); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(40, 40, 9, 6, -0.7, 0, TAU); g.fill();
  }, { wrap: false });
}
function laptopTex(){
  return canvasTex(512, 320, (g, W, Hh) => {
    const grd = g.createLinearGradient(0, 0, W, Hh); grd.addColorStop(0, '#294b5a'); grd.addColorStop(1, '#6f9c8e');
    g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.fillRect(70, 50, 300, 200);
    g.fillStyle = '#e9ece8'; g.fillRect(70, 50, 300, 22);
    g.fillStyle = '#9aa7a0'; for (let i = 0; i < 8; i++) g.fillRect(90, 92 + i * 18, 120 + (i * 53 % 140), 7);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(0, Hh - 26, W, 26);
  }, { wrap: false });
}
function spinesDraw(){ /* placeholder to keep structure clear */ }

// env maps (equirect) for reflections + soft fill
function envTex(night){
  const t = canvasTex(512, 256, (g, W, Hh) => {
    const grd = g.createLinearGradient(0, 0, 0, Hh);
    if (!night){
      grd.addColorStop(0, '#f4f1ea'); grd.addColorStop(0.42, '#d9d3c9'); grd.addColorStop(0.55, '#b9ab98'); grd.addColorStop(1, '#6d5846');
    } else {
      grd.addColorStop(0, '#2a2622'); grd.addColorStop(0.45, '#221e1b'); grd.addColorStop(0.6, '#1a1612'); grd.addColorStop(1, '#120e0b');
    }
    g.fillStyle = grd; g.fillRect(0, 0, W, Hh);
    if (!night){
      g.fillStyle = '#ffffff';
      [[40, 70, 60, 50], [170, 80, 40, 44], [300, 66, 70, 56], [430, 76, 34, 44]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
      g.fillStyle = '#d8ecff'; g.fillRect(300, 66, 70, 18);
    } else {
      g.fillStyle = '#ffcf8f';
      [[60, 40, 14], [220, 60, 10], [380, 36, 16]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
      g.fillStyle = '#1e2a44'; [[40, 70, 60, 50], [300, 66, 70, 56]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
    }
  }, { wrap: false });
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// ---------- geometry helpers ----------
const matCache = new Map();
function M(color, rough = 0.8, metal = 0, props = null){
  const key = color + '|' + rough + '|' + metal;
  if (!props && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: C(color), roughness: rough, metalness: metal }, props || {}));
  if (!props) matCache.set(key, m);
  return m;
}
function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene, cast = true, recv = true){
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m;
}
function box(w, h, d, mat, x, y, z, parent, cast, recv){ return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent, cast, recv); }
function boxB(w, h, d, mat, x, y0, z, parent, cast, recv){ return box(w, h, d, mat, x, y0 + h / 2, z, parent, cast, recv); }
function grp(x = 0, z = 0, ry = 0, parent = scene, y = 0){ const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
function cyl(rt, rb, h, mat, x, y, z, parent, seg = 20, cast = true){ return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, parent, cast, true); }
function sph(r, mat, x, y, z, parent, sx = 1, sy = 1, sz = 1, seg = 20){ const m = mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.7 | 0)), mat, x, y, z, parent); m.scale.set(sx, sy, sz); return m; }

// rounded box with analytic smooth normals
function rboxGeo(w, h, d, r, s = 3){
  r = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const m = 2 * s + 1;
  const geo = new THREE.BoxGeometry(2, 2, 2, m, m, m);
  const p = geo.attributes.position, n = geo.attributes.normal;
  const half = [w / 2, h / 2, d / 2], inner = half.map(v => v - r);
  const map = (t, k) => { const i = Math.round((t + 1) * m / 2); if (i <= s) return -half[k] + r * (i / s); if (i >= m - s) return half[k] - r * ((m - i) / s); return 0; };
  const v = [0, 0, 0], c = [0, 0, 0];
  for (let i = 0; i < p.count; i++){
    v[0] = map(p.getX(i), 0); v[1] = map(p.getY(i), 1); v[2] = map(p.getZ(i), 2);
    // coordinates exactly on face planes: keep ±half for axis of the face
    const ox = p.getX(i), oy = p.getY(i), oz = p.getZ(i);
    if (Math.abs(ox) > 0.999) v[0] = Math.sign(ox) * half[0];
    if (Math.abs(oy) > 0.999) v[1] = Math.sign(oy) * half[1];
    if (Math.abs(oz) > 0.999) v[2] = Math.sign(oz) * half[2];
    for (let k = 0; k < 3; k++) c[k] = clamp(v[k], -inner[k], inner[k]);
    let dx = v[0] - c[0], dy = v[1] - c[1], dz = v[2] - c[2];
    const L = Math.hypot(dx, dy, dz) || 1; dx /= L; dy /= L; dz /= L;
    p.setXYZ(i, c[0] + dx * r, c[1] + dy * r, c[2] + dz * r);
    n.setXYZ(i, dx, dy, dz);
  }
  p.needsUpdate = true; n.needsUpdate = true;
  geo.computeBoundingSphere();
  return geo;
}
function rbox(w, h, d, r, mat, x, y, z, parent, cast = true, s = 3){ return mesh(rboxGeo(w, h, d, r, s), mat, x, y, z, parent, cast, true); }
function rboxB(w, h, d, r, mat, x, y0, z, parent, cast = true, s = 3){ return rbox(w, h, d, r, mat, x, y0 + h / 2, z, parent, cast, s); }

function worldUV(geo, ox, oy, oz, s = 1){
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++){
    const x = p.getX(i) + ox, y = p.getY(i) + oy, z = p.getZ(i) + oz;
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ax >= ay && ax >= az){ u = z; v = y; } else if (ay >= az){ u = x; v = z; } else { u = x; v = y; }
    uv.setXY(i, u / s, v / s);
  }
  uv.needsUpdate = true; return geo;
}

// merge geometries (non-indexed), keeping position/normal/uv/color
function xf(geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1){
  const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  geo.applyMatrix4(m); return geo;
}
function tint(geo, hex){
  const c = C(hex), n = geo.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++){ a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); return geo;
}
function merge(list){
  const parts = list.map(g => g.index ? g.toNonIndexed() : g);
  let total = 0; parts.forEach(g => total += g.attributes.position.count);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2), col = new Float32Array(total * 3);
  let o = 0;
  for (const g of parts){
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + n) * 3);
    o += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}
function latheGeo(pts, seg = 28){ return new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg); }

// ---------- shared textures & materials ----------
const TX = {};
TX.oak = woodFloor(7, 32, 42, 58); TX.oak.repeat.set(1 / 1.6, 1 / 1.6);
TX.ash = woodFloor(17, 36, 30, 70); TX.ash.repeat.set(1 / 1.6, 1 / 1.6);
TX.plaster = plasterTex(); TX.plaster.repeat.set(1 / 1.5, 1 / 1.5);
TX.fabric = fabricTex(3, 26, 0.05); TX.fabric.repeat.set(3, 3);
TX.linen = fabricTex(4, 18, 0.07); TX.linen.repeat.set(4, 4);
TX.knit = knitTex(); TX.knit.repeat.set(4, 4);
TX.oakGrain = woodGrain(5, 32, 45, 55);
TX.walnut = woodGrain(6, 22, 38, 30);
TX.lightWood = woodGrain(8, 36, 38, 66);
TX.marble = marbleTex();
TX.tile = tileTex();
TX.grass = grassTex(); TX.grass.repeat.set(60, 60);
TX.blob = blobTex(); TX.rblob = roundBlobTex();
TX.rattan = rattanTex(); TX.rattan.repeat.set(3, 2);
TX.fur = furTex();
TX.heart = heartTex();

const MAT = {
  wall: new THREE.MeshStandardMaterial({ color: C('#efebe4'), roughness: 0.95, map: TX.plaster }),
  ceiling: new THREE.MeshStandardMaterial({ color: C('#f4f2ee'), roughness: 0.95, emissive: C('#e9e3d8'), emissiveIntensity: 0.4 }),
  exterior: new THREE.MeshStandardMaterial({ color: C('#e3e1da'), roughness: 0.9, map: TX.plaster }),
  trim: M('#f5f3ee', 0.55),
  frame: M('#232624', 0.45, 0.2),
  glass: new THREE.MeshStandardMaterial({ color: C('#dfeef5'), roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.4 }),
  oak: new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: 0.55, map: TX.oakGrain }),
  walnut: new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: 0.5, map: TX.walnut }),
  lightWood: new THREE.MeshStandardMaterial({ color: C('#ffffff'), roughness: 0.6, map: TX.lightWood }),
  black: M('#1e201f', 0.5, 0.3),
  brass: M('#c9a15a', 0.32, 0.9),
  steel: M('#c7cbcd', 0.28, 0.85),
  white: M('#f3f2ee', 0.5),
  linen: new THREE.MeshStandardMaterial({ color: C('#ddd6c9'), roughness: 1, map: TX.linen, side: THREE.DoubleSide }),
  ceramic: M('#efece6', 0.35),
  terracotta: M('#b8714f', 0.8),
  leaf: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, side: THREE.DoubleSide }),
  vc: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }),
  soil: M('#3b2b20', 1),
};
function fabric(hex, tex = TX.fabric, rough = 0.95){ return new THREE.MeshStandardMaterial({ color: C(hex), roughness: rough, map: tex }); }
function glow(hex, i = 1){ return new THREE.MeshStandardMaterial({ color: C(hex), roughness: 0.9, emissive: C(hex), emissiveIntensity: i }); }

// contact shadows (fake AO)
const blobMat = new THREE.MeshBasicMaterial({ map: TX.blob, transparent: true, depthWrite: false, color: 0x000000, opacity: 0.4 });
const rblobMat = new THREE.MeshBasicMaterial({ map: TX.rblob, transparent: true, depthWrite: false, color: 0x000000, opacity: 0.4 });
function blob(x, z, w, d, ry = 0, op = 0.38, y = 0.004, round = false){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.55, d * 1.55), op === 0.38 ? (round ? rblobMat : blobMat) : new THREE.MeshBasicMaterial({ map: round ? TX.rblob : TX.blob, transparent: true, depthWrite: false, color: 0, opacity: op }));
  m.rotation.set(-PI / 2, 0, ry); m.position.set(x, y, z); m.renderOrder = 1; scene.add(m); return m;
}

// colliders & floor-plan items
const colliders = [];
const planItems = [];
function addCol(x0, x1, z0, z1){ colliders.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }); }
function foot(cx, cz, w, d, ry = 0, solid = true, kind = 'f'){
  const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry));
  const hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2;
  if (solid) addCol(cx - hw, cx + hw, cz - hd, cz + hd);
  planItems.push({ cx, cz, w, d, ry, kind });
}
