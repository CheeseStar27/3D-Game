
// ================= SHOPS ACROSS THE STREET =================
let money = 25, shopOpen = null, shopTab = 'buy', itemSeq = 0;
const planted = [], candles = [], keepers = [], shopDefs = [];

// ---------- product models (origin at the bottom) ----------
function cvsTex(w, h, draw){ return canvasTex(w, h, draw); }
const B = {
  apple: g => { sph(0.04, M('#b8322a', 0.35), 0, 0.038, 0, g, 1, 0.92, 1, 18); cyl(0.003, 0.002, 0.025, M('#5a4636', 0.8), 0, 0.085, 0, g, 5, false); },
  sandwich: g => { const br = M('#e2c08a', 0.8); rboxB(0.13, 0.025, 0.1, 0.01, br, 0, 0, 0, g); boxB(0.135, 0.008, 0.105, M('#6fa34f', 0.6), 0, 0.025, 0, g, false); boxB(0.12, 0.008, 0.095, M('#c7473a', 0.5), 0, 0.033, 0, g, false); boxB(0.13, 0.006, 0.1, M('#f2c94c', 0.5), 0, 0.041, 0, g, false); rboxB(0.13, 0.025, 0.1, 0.01, br, 0, 0.047, 0, g); },
  croissant: g => { const t = mesh(new THREE.TorusGeometry(0.045, 0.022, 10, 18, PI * 1.1), M('#c98a3d', 0.55), 0, 0.022, 0, g); t.rotation.x = -PI / 2; t.scale.set(1, 1, 0.8); },
  icecream: g => { const c = mesh(new THREE.ConeGeometry(0.032, 0.11, 16), M('#d9a55f', 0.8), 0, 0.055, 0, g); c.rotation.x = PI; sph(0.036, M('#f2a7c3', 0.5), 0, 0.12, 0, g); sph(0.012, M('#c0392b', 0.4), 0, 0.16, 0, g); },
  coffee: g => { cyl(0.036, 0.028, 0.11, M('#f4efe6', 0.6), 0, 0.055, 0, g, 18); cyl(0.0345, 0.031, 0.04, M('#a5754a', 0.9), 0, 0.055, 0, g, 18); cyl(0.038, 0.038, 0.012, M('#2b2c2d', 0.5), 0, 0.114, 0, g, 18); },
  juice: g => { cyl(0.028, 0.028, 0.13, M('#f2a03c', 0.25), 0, 0.065, 0, g, 16); cyl(0.014, 0.014, 0.02, M('#3a7a43', 0.5), 0, 0.14, 0, g, 12); },
  fish: g => { rboxB(0.1, 0.13, 0.03, 0.01, M('#3f7fb8', 0.5), 0, 0, 0, g); const f = sph(0.025, M('#f2c94c', 0.5), 0, 0.07, 0.017, g, 1.4, 0.7, 0.3); },
  soap: g => rboxB(0.08, 0.028, 0.05, 0.012, M('#f2b3c6', 0.35), 0, 0, 0, g),
  tooth: g => { const t = cyl(0.014, 0.012, 0.12, M('#f4f5f2', 0.4), 0.02, 0.014, 0, g, 12); t.rotation.z = PI / 2; cyl(0.016, 0.016, 0.02, M('#2fa39a', 0.4), 0.09, 0.014, 0, g, 12).rotation.z = PI / 2; const b = boxB(0.15, 0.01, 0.014, M('#5aa0c8', 0.4), 0.0, 0.0, 0.04, g); },
  roll: g => { cyl(0.055, 0.055, 0.1, M('#fbfaf7', 0.9), 0, 0.05, 0, g, 22); cyl(0.02, 0.02, 0.101, M('#b58b5e', 0.9), 0, 0.05, 0, g, 12); },
  candle: g => { cyl(0.04, 0.04, 0.09, new THREE.MeshStandardMaterial({ color: C('#e9f1f2'), roughness: 0.05, transparent: true, opacity: 0.45 }), 0, 0.045, 0, g, 20, false); cyl(0.036, 0.036, 0.06, M('#f3e7cf', 0.8), 0, 0.03, 0, g, 20); cyl(0.002, 0.002, 0.015, MAT.black, 0, 0.067, 0, g, 4, false); },
  bouquet: g => { const c = mesh(new THREE.ConeGeometry(0.07, 0.24, 14, 1, true), new THREE.MeshStandardMaterial({ color: C('#c9a77a'), roughness: 0.9, side: THREE.DoubleSide }), 0, 0.12, 0, g); c.rotation.x = PI; const P = []; const r = RNG(5); for (let i = 0; i < 9; i++){ const a = i / 9 * TAU; P.push(sp(0.022, Math.cos(a) * 0.04 * r(), 0.25 + r() * 0.04, Math.sin(a) * 0.04 * r(), ['#f2a7c3', '#ffffff', '#e86f8a', '#f7d774'][i % 4])); } P.push(sp(0.02, 0, 0.28, 0, '#b9a4de')); vcMesh(P, g); },
  gnome: g => { cyl(0.07, 0.085, 0.16, M('#3f6fb3', 0.6), 0, 0.08, 0, g, 18); sph(0.05, M('#f0c9a5', 0.6), 0, 0.2, 0.0, g); const bd = mesh(new THREE.ConeGeometry(0.05, 0.1, 14), M('#f4f2ee', 0.9), 0, 0.15, 0.03, g); bd.rotation.x = PI; mesh(new THREE.ConeGeometry(0.058, 0.16, 16), M('#c0392b', 0.6), 0, 0.31, 0, g); sph(0.014, M('#e8a090', 0.6), 0, 0.2, 0.05, g); cyl(0.09, 0.09, 0.02, M('#6b4d34', 0.8), 0, 0.01, 0, g, 18); },
  seeds: g => rboxB(0.09, 0.012, 0.13, 0.004, new THREE.MeshStandardMaterial({ map: cvsTex(96, 128, (c, W, Hh) => { c.fillStyle = '#f6efdc'; c.fillRect(0, 0, W, Hh); for (let i = 0; i < 5; i++){ c.fillStyle = ['#e86f8a', '#f7d774', '#b9a4de', '#f2a7c3', '#ffffff'][i]; c.beginPath(); c.arc(20 + i * 14, 50 + (i % 2) * 18, 9, 0, TAU); c.fill(); } c.fillStyle = '#3a6b45'; c.font = '600 15px Georgia, serif'; c.fillText('Flower seeds', 6, 108); }), roughness: 0.7 }), 0, 0, 0, g),
  detector: g => { const st = M('#2f3331', 0.5, 0.4); const coil = cyl(0.11, 0.11, 0.02, M('#2b2c2d', 0.5), 0, 0.01, 0, g, 28); cyl(0.012, 0.012, 0.85, M('#a7adb0', 0.3, 0.8), 0, 0.45, 0, g, 10); boxB(0.08, 0.06, 0.12, M('#e3b23c', 0.5), 0, 0.62, 0.03, g); const sc = mesh(new THREE.PlaneGeometry(0.05, 0.03), new THREE.MeshStandardMaterial({ color: 0x0a1a12, emissive: C('#4fd08a'), emissiveIntensity: 0.5 }), 0, 0.66, 0.0905, g, false, false); boxB(0.03, 0.12, 0.03, st, 0, 0.82, 0, g); }
};
// ---------- what each product does when you use it ----------
function removeItem(it){
  if (held === it){ held = null; heldAnim = null; refreshHeld(); }
  if (it.g.parent) it.g.parent.remove(it.g);
  const set = new Set(); it.g.traverse(o => set.add(o));
  for (let i = actMeshes.length - 1; i >= 0; i--) if (set.has(actMeshes[i])) actMeshes.splice(i, 1);
  const k = ITEMS.indexOf(it); if (k >= 0) ITEMS.splice(k, 1); const k2 = THROWABLES.indexOf(it); if (k2 >= 0) THROWABLES.splice(k2, 1); rayList = null;
}
const toMouth = (it, k) => { const e = Math.sin(k * PI), h = it.o.hold; it.g.position.set(lerp(h[0], 0.02, e), lerp(h[1], -0.1, e), lerp(h[2], -0.24, e)); };
const eat = (n, done) => it => { animHeld(0.9, k => toMouth(it, k), () => { it.st.n = (it.st.n || 0) + 1; const s = 1 - it.st.n / (n + 1) * 0.8; it.g.scale.setScalar(s); if (it.st.n >= n){ toast(done); removeItem(it); } }); setTimeout(() => sfx('crunch'), 420); };
const drink = (n, done) => it => { animHeld(1.3, k => { toMouth(it, Math.min(1, k * 1.2)); it.g.rotation.x = -0.9 * Math.sin(Math.min(1, k * 1.2) * PI); }, () => { it.st.n = (it.st.n || 0) + 1; if (it.st.n >= n){ toast(done); removeItem(it); } }); sfx('slurp'); };
const TAPS = [[-4.0, 1.0, -4.85], [-7.1, 1.0, 2.18], [-8.52, 0.9, 0.55]];
const nearTap = () => TAPS.some(([x, y, z]) => Math.hypot(camera.position.x - x, camera.position.z - z) < 1.5);
function foam(n = 10, col = 'steam'){ for (let i = 0; i < n; i++) emit(col, camWorld([(Math.random() - 0.5) * 0.25, -0.2 + Math.random() * 0.1, -0.45]), new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.15, (Math.random() - 0.5) * 0.1)); }
const spareRolls = [];
const USE = {
  catfish: it => { if (canPet()){ giveTreat(); it.st.n = (it.st.n || 0) + 1; if (it.st.n >= 3){ toast('That was the last fish snack'); removeItem(it); } } else { sfx('rattle'); catNotice('treats'); toast('Mochi heard the packet!'); } },
  soap: it => { if (!nearTap()){ toast('Find a tap to wash your hands'); return; } sfx('pour'); animHeld(1.2, k => { it.g.rotation.z = Math.sin(k * TAU * 3) * 0.4; foam(1); }, () => { it.st.n = (it.st.n || 0) + 1; toast('Squeaky clean hands'); if (it.st.n >= 5){ toast('The soap is all used up'); removeItem(it); } }); },
  tooth: it => { if (roomAt(camera.position.x, camera.position.z) !== 'Bathroom'){ toast('Brush your teeth in the bathroom'); return; } animHeld(1.6, k => { it.g.position.set(0.02 + Math.sin(k * TAU * 6) * 0.03, -0.12, -0.28); if (Math.random() < 0.3) foam(1); }, () => toast('Minty fresh!')); sfx('slurp'); },
  roll: it => { if (Math.hypot(camera.position.x + 7.6, camera.position.z + 0.85) > 2.2){ toast('Take it to the bathroom'); return; } const n = spareRolls.length, m = cyl(0.055, 0.055, 0.1, M('#fbfaf7', 0.9), -7.15 + (n % 2) * 0.12, -0.0 + 0.05 + Math.floor(n / 2) * 0.1, -1.05, scene, 22); spareRolls.push(m); removeItem(it); sfx('place'); toast('Toilet roll restocked'); },
  candle: it => { it.st.lit = !it.st.lit; it.flame.visible = it.st.lit; it.o.verb = it.st.lit ? 'Blow out' : 'Light'; refreshHeld(); sfx(it.st.lit ? 'click' : 'whoosh'); toast(it.st.lit ? 'The candle smells of vanilla' : 'Candle blown out'); },
  bouquet: it => { for (let i = 0; i < 8; i++) emit('spark', camWorld([(Math.random() - 0.5) * 0.3, -0.05, -0.45]), new THREE.Vector3(0, 0.2, 0)); toast('They smell lovely. Put them down somewhere nice.'); },
  gnome: it => { animHeld(0.6, k => { it.g.rotation.z = Math.sin(k * TAU * 2) * 0.25; }); toast('He looks very proud of your garden'); },
  seeds: it => plantSeed(it),
  detector: it => scanGold(it)
};
// ---------- catalogue ----------
const PRODUCTS = {
  apple: { name: 'apple', price: 1, color: '#b8322a', desc: 'Crisp and sweet. Four bites.', build: B.apple, hold: [0.18, -0.22, -0.38], verb: 'Take a bite', use: eat(4, 'Crunchy') },
  sandwich: { name: 'sandwich', price: 5, color: '#e2c08a', desc: 'Cheese, tomato and lettuce.', build: B.sandwich, hold: [0.18, -0.22, -0.4], verb: 'Take a bite', use: eat(3, 'That hit the spot') },
  croissant: { name: 'croissant', price: 3, color: '#c98a3d', desc: 'Buttery and flaky.', build: B.croissant, hold: [0.18, -0.22, -0.38], verb: 'Take a bite', use: eat(3, 'Flaky and delicious') },
  icecream: { name: 'ice cream', price: 3, color: '#f2a7c3', desc: 'Strawberry, in a cone.', build: B.icecream, hold: [0.17, -0.25, -0.38], verb: 'Have a lick', use: eat(5, 'Brain freeze!') },
  coffee: { name: 'coffee', price: 3, color: '#a5754a', desc: 'A flat white to go.', build: B.coffee, hold: [0.18, -0.24, -0.4], verb: 'Sip', use: drink(4, 'All gone. Feeling awake.') },
  juice: { name: 'orange juice', price: 2, color: '#f2a03c', desc: 'Freshly squeezed.', build: B.juice, hold: [0.18, -0.25, -0.4], verb: 'Drink', use: drink(3, 'Refreshing') },
  fish: { name: 'fish snack', price: 4, color: '#3f7fb8', desc: 'Mochi\u2019s favourite. Three portions.', build: B.fish, hold: [0.2, -0.26, -0.45], verb: 'Feed Mochi', use: USE.catfish },
  soap: { name: 'soap', price: 2, color: '#f2b3c6', desc: 'Rose scented. Use it at any tap.', build: B.soap, hold: [0.17, -0.22, -0.36], verb: 'Wash hands', use: USE.soap },
  tooth: { name: 'toothbrush and paste', price: 4, color: '#2fa39a', desc: 'Brush up in the bathroom.', build: B.tooth, hold: [0.16, -0.22, -0.36], verb: 'Brush teeth', use: USE.tooth },
  roll: { name: 'toilet roll', price: 2, color: '#fbfaf7', desc: 'Restock the bathroom.', build: B.roll, hold: [0.18, -0.26, -0.42], verb: 'Restock', use: USE.roll },
  candle: { name: 'scented candle', price: 6, color: '#f3e7cf', desc: 'Vanilla. Light it anywhere.', build: B.candle, hold: [0.18, -0.25, -0.42], verb: 'Light', use: USE.candle },
  bouquet: { name: 'bunch of flowers', price: 8, color: '#e86f8a', desc: 'Put them on a table.', build: B.bouquet, hold: [0.19, -0.3, -0.46], verb: 'Smell', use: USE.bouquet },
  gnome: { heavy: true, name: 'garden gnome', price: 15, color: '#c0392b', desc: 'Guards the garden.', build: B.gnome, hold: [0.2, -0.32, -0.55], verb: 'Admire', use: USE.gnome },
  seeds: { name: 'packet of flower seeds', price: 5, color: '#e86f8a', desc: 'Plant six clumps of flowers.', build: B.seeds, hold: [0.18, -0.22, -0.38, 1.0, 0, 0], verb: 'Plant', use: USE.seeds },
  detector: { heavy: true, name: 'metal detector', price: 90, color: '#e3b23c', desc: 'Beeps near buried gold.', build: B.detector, hold: [0.24, -0.6, -0.95, 0.6, 0, -0.35], order: 'YXZ', restR: [PI / 2, 0], restY: 0.02, verb: 'Scan', use: USE.detector },
  spade: { name: 'pro spade upgrade', price: 60, color: '#c9a64a', desc: 'Your shovel digs twice as deep per scoop.', upgrade: true }
};
const SHOPS = [
  { id: 'hardware', name: 'Hardware & Garden', sub: 'Tools and things for the garden', x: -10.5, wall: '#d9d2c4', awning: ['#3a6b45', '#f1efe9'], keeper: ['#3a6b45', '#5a3d2b'], items: ['spade', 'detector', 'seeds', 'gnome'] },
  { id: 'grocer', name: 'Corner Grocer', sub: 'Fresh food and snacks', x: -3.5, wall: '#efe3cf', awning: ['#c0392b', '#f6f1e7'], keeper: ['#c46e4d', '#2b2c2d'], items: ['apple', 'sandwich', 'croissant', 'icecream', 'coffee', 'juice', 'fish'] },
  { id: 'mart', name: 'Daily Mart', sub: 'Everyday things for the house', x: 3.5, wall: '#dfe7ea', awning: ['#2f6fb3', '#f6f1e7'], keeper: ['#2f6fb3', '#d9a55f'], items: ['soap', 'tooth', 'roll', 'candle', 'bouquet'] },
  { id: 'exchange', name: 'Gold & Scrap Exchange', sub: 'We buy anything you dig up', x: 10.5, wall: '#e6dcc8', awning: ['#b8892f', '#2b2c2d'], keeper: ['#2b2c2d', '#8a8a8a'], items: [], sells: true }
];
const PRICES = { 'ammonite': 70, 'trilobite': 85, 'fossil fern': 55, 'dinosaur tooth': 150, 'ancient coin': 140, 'bronze arrowhead': 110, 'stone tablet': 200, 'meteorite': 300, 'diamond': 400, 'amethyst': 90, 'ruby': 120, 'emerald': 110, 'sapphire': 100, 'gold flake': 15, 'gold nugget': 45, 'gold coin': 60, 'gold ring': 80, 'quartz crystal': 12, 'granite chunk': 5, 'flint': 3, 'pebble': 1 };
const priceOf = q => PRICES[q.name] != null ? PRICES[q.name] : q.type === 'waste' ? 2 : q.type === 'trash' ? 1 : 1;

// ---------- the buildings ----------
function signTex(text, bg, fg){ return cvsTex(512, 80, (c, W, Hh) => { c.fillStyle = bg; c.fillRect(0, 0, W, Hh); c.fillStyle = fg; c.font = '600 40px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, Hh / 2 + 2); }); }
function stripeTex(a, b){ return cvsTex(128, 32, (c, W, Hh) => { for (let i = 0; i < 8; i++){ c.fillStyle = i % 2 ? b : a; c.fillRect(i * 16, 0, 16, Hh); } }); }
function keeperFigure(x, z, shirt, hair){
  const g = grp(x, z, PI, scene, GY), skin = M('#d9a77c', 0.6);
  for (const s of [-1, 1]) cyl(0.06, 0.055, 0.85, M('#2f3a44', 0.8), s * 0.08, 0.425, 0, g, 10);
  cyl(0.17, 0.2, 0.62, M(shirt, 0.8), 0, 1.16, 0, g, 18);
  boxB(0.3, 0.42, 0.02, M('#f1efe9', 0.9), 0, 0.9, 0.16, g, false);
  for (const s of [-1, 1]){ const a = cyl(0.045, 0.04, 0.5, M(shirt, 0.8), s * 0.21, 1.15, 0.08, g, 10); a.rotation.x = -0.5; sph(0.045, skin, s * 0.21, 0.94, 0.24, g); }
  const hd = new THREE.Group(); hd.position.set(0, 1.6, 0); g.add(hd);
  sph(0.12, skin, 0, 0, 0, hd, 1, 1.1, 1, 20);
  sph(0.125, M(hair, 0.8), 0, 0.04, -0.02, hd, 1.02, 0.9, 1.0, 20);
  for (const s of [-1, 1]) sph(0.014, MAT.black, s * 0.04, 0.01, 0.108, hd);
  const sm = mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 14, PI), M('#8a3a2a', 0.6), 0, -0.04, 0.105, hd, false, false); sm.rotation.z = PI;
  keepers.push({ g, hd, x, z });
}
function buildShop(S){
  const cx = S.x, z0 = 20.8, D = 5, W = 6, Hs = 3.2, y0 = GY;
  const wallM = new THREE.MeshStandardMaterial({ color: C(S.wall), roughness: 0.9, map: TX.plaster }), inner = M('#f4f1ea', 0.85), trim = M('#2f3331', 0.6, 0.2);
  const fl = mesh(new THREE.PlaneGeometry(W - 0.2, D - 0.2), new THREE.MeshStandardMaterial({ map: TX.oak, roughness: 0.55 }), cx, y0 + 0.004, z0 + D / 2, scene, false, true); fl.rotation.x = -PI / 2;
  boxB(W, Hs, 0.15, wallM, cx, y0, z0 + D, scene); addCol(cx - W / 2, cx + W / 2, z0 + D - 0.08, z0 + D + 0.08); wallCols.push(colliders[colliders.length - 1]);
  boxB(W - 0.3, Hs - 0.05, 0.01, inner, cx, y0, z0 + D - 0.08, scene, false);
  for (const s of [-1, 1]){
    boxB(0.15, Hs, D, wallM, cx + s * W / 2, y0, z0 + D / 2, scene); addCol(cx + s * W / 2 - 0.08, cx + s * W / 2 + 0.08, z0, z0 + D); wallCols.push(colliders[colliders.length - 1]);
    // front: low wall, shop window, then the door gap in the middle
    const px = cx + s * (W / 2 + 1) / 2, pw = W / 2 - 1;
    boxB(pw, 0.7, 0.15, wallM, px, y0, z0, scene); addCol(px - pw / 2, px + pw / 2, z0 - 0.08, z0 + 0.08);
    mesh(new THREE.PlaneGeometry(pw - 0.1, 1.7), MAT.glass, px, y0 + 1.55, z0, scene, false, false).renderOrder = 2;
    boxB(pw, 0.05, 0.18, trim, px, y0 + 0.7, z0, scene, false); boxB(0.05, 1.8, 0.16, trim, cx + s * 1.0, y0 + 0.7, z0, scene, false);
  }
  boxB(W, Hs - 2.5, 0.15, wallM, cx, y0 + 2.5, z0, scene);
  box(W + 0.3, 0.2, D + 0.3, M('#4a4f55', 0.85), cx, y0 + Hs + 0.1, z0 + D / 2, scene, true, true);
  box(W - 0.3, 0.02, D - 0.3, inner, cx, y0 + Hs - 0.01, z0 + D / 2, scene, false, false);
  const lp = mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshStandardMaterial({ color: C('#ffffff'), emissive: C('#fff6e6'), emissiveIntensity: 0.9 }), cx, y0 + Hs - 0.025, z0 + D / 2, scene, false, false); lp.rotation.x = PI / 2;
  const sign = mesh(new THREE.PlaneGeometry(4.2, 0.62), new THREE.MeshStandardMaterial({ map: signTex(S.name, S.awning[0], '#fbf7ee'), emissive: C('#ffffff'), emissiveMap: signTex(S.name, S.awning[0], '#fbf7ee'), roughness: 0.6 }), cx, y0 + 2.86, z0 - 0.085, scene, false, false);
  sign.rotation.y = PI; glows.push({ mat: sign.material, day: 0.15, night: 0.9 });
  const aw = mesh(new THREE.BoxGeometry(W + 0.2, 0.03, 1.0), new THREE.MeshStandardMaterial({ map: stripeTex(S.awning[0], S.awning[1]), roughness: 0.9 }), cx, y0 + 2.45, z0 - 0.45, scene, true, false); aw.rotation.x = -0.32;
  // counter, register, shopkeeper
  const cz = z0 + D - 1.6;
  boxB(2.4, 0.95, 0.6, M(S.awning[0], 0.6), cx, y0, cz, scene); boxB(2.5, 0.05, 0.7, MAT.oak, cx, y0 + 0.95, cz, scene); addCol(cx - 1.25, cx + 1.25, cz - 0.35, cz + 0.35);
  boxB(0.3, 0.16, 0.24, M('#2b2c2d', 0.5), cx + 0.85, y0 + 1.0, cz + 0.08, scene);
  keeperFigure(cx, cz + 0.55, S.keeper[0], S.keeper[1]);
  // shelves with stock (or a gold scale at the exchange)
  const stock = [], r = RNG(S.x * 10 + 99), cols = S.items.length ? S.items.map(k => PRODUCTS[k].color) : ['#e2b33c', '#9a958d', '#7a4428', '#c0392b'];
  for (const s of [-1, 1]){
    const sx = cx + s * (W / 2 - 0.35);
    boxB(0.3, 2.0, 2.8, MAT.oak, sx + s * 0.05, y0, z0 + 2.1, scene); addCol(sx - 0.25, sx + 0.25, z0 + 0.7, z0 + 3.5);
    for (const y of [0.42, 0.92, 1.42]){
      boxB(0.26, 0.03, 2.8, MAT.oak, sx - s * 0.2, y0 + y - 0.03, z0 + 2.1, scene, false);
      for (let k = 0; k < 9; k++){ const zz = z0 + 0.9 + k * 0.28; stock.push(r() < 0.5 ? bx(0.16, 0.12 + r() * 0.12, 0.14, sx - s * 0.2, y0 + y, zz, cols[(r() * cols.length) | 0]) : cy(0.05, 0.1 + r() * 0.12, sx - s * 0.2, y0 + y, zz, cols[(r() * cols.length) | 0])); }
    }
  }
  boxB(4.2, 2.2, 0.2, MAT.oak, cx, y0, z0 + D - 0.2, scene);
  for (const y of [0.55, 1.1, 1.65]){
    boxB(4.2, 0.03, 0.26, MAT.oak, cx, y0 + y - 0.03, z0 + D - 0.42, scene, false);
    for (let k = 0; k < 14; k++) stock.push(r() < 0.6 ? bx(0.16, 0.14 + r() * 0.12, 0.16, cx - 1.95 + k * 0.3, y0 + y, z0 + D - 0.42, cols[(r() * cols.length) | 0]) : cy(0.06, 0.12 + r() * 0.14, cx - 1.95 + k * 0.3, y0 + y, z0 + D - 0.42, cols[(r() * cols.length) | 0]));
  }
  vcMesh(stock);
  // talk to the shopkeeper
  const hp = hitProxy(scene, 2.6, 1.8, 1.4, cx, y0 + 1.1, cz + 0.3);
  tagAct(hp, { kind: 'custom', label: () => S.sells ? 'Sell your finds' : 'Shop at ' + S.name, use: () => openShop(S) });
  S.slot = 0; S.counter = { x: cx, y: y0 + 1.0, z: cz - 0.15 };
  shopDefs.push(S);
}
SHOPS.forEach(buildShop);

// ---------- buying and selling ----------
function makeProduct(key){
  const P = PRODUCTS[key], g = new THREE.Group(); if (P.order) g.rotation.order = P.order;
  P.build(g);
  if (key === 'candle'){ const fl = sph(0.008, glowMat('#ffb34d', 1.5, 2.2), 0, 0.082, 0, g, 1, 1.9, 1); fl.castShadow = false; fl.visible = false; }
  hitProxy(g, 0.16, 0.16, 0.16, 0, 0.08, 0);
  const it = makeItem(key + (++itemSeq), P.name, g, { hold: P.hold, verb: P.verb, use: P.use, restR: P.restR, restY: P.restY, heavy: P.heavy });
  if (key === 'candle'){ it.flame = g.children.find(o => o.geometry && o.geometry.type === 'SphereGeometry' && o.position.y > 0.08); candles.push(it); }
  return it;
}
function buy(key){
  const S = shopOpen, P = PRODUCTS[key];
  if (money < P.price){ toast('Not enough money. Dig up something to sell!'); return; }
  if (P.upgrade){
    if (STEP > 0.3){ toast('Your shovel is already a pro spade'); return; }
    money -= P.price; STEP = 0.5; shovelItem.name = 'pro spade';
    shovelItem.g.traverse(o => { if (o.isMesh && o.geometry.type === 'ExtrudeGeometry') o.material = M('#c9a64a', 0.25, 0.9); });
    refreshHeld(); kaching(); toast('Upgraded! Your shovel now digs 50 cm per scoop.'); renderShop(); refreshFinds(); return;
  }
  money -= P.price; kaching();
  const it = makeProduct(key), c = S.counter, sl = (S.slot++ % 5) - 2;
  it.g.position.set(c.x + sl * 0.35, c.y, c.z); it.g.rotation.y = PI;
  if (!held){ pickUp(it); toast(`You bought ${(/^[aeiou]/.test(P.name) ? 'an ' : 'a ')}${P.name}. It\u2019s in your hands.`); }
  else toast(`You bought ${(/^[aeiou]/.test(P.name) ? 'an ' : 'a ')}${P.name}. It\u2019s on the counter.`);
  renderShop(); refreshFinds();
}
function sell(name, all){
  let n = 0, got = 0;
  for (let i = pocket.items.length - 1; i >= 0; i--){
    const q = pocket.items[i]; if (name && q.name !== name) continue;
    got += priceOf(q); pocket[q.type]--; pocket.items.splice(i, 1); n++;
    if (!all) break;
  }
  if (!n) return;
  money += got; kaching(); toast(`Sold ${n} ${n === 1 ? 'item' : 'items'} for $${got}`); renderShop(); refreshFinds();
}
function kaching(){ if (!audio) return; const now = audio.currentTime; [[1568, 0], [2093, 0.08]].forEach(([f, d]) => { const o = audio.createOscillator(), g = audio.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, now + d); g.gain.linearRampToValueAtTime(0.07, now + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + d + 0.35); o.connect(g); g.connect(audio.destination); o.start(now + d); o.stop(now + d + 0.4); }); }
function openShop(S){
  shopOpen = S; shopTab = S.sells ? 'sell' : 'buy';
  if (document.pointerLockElement) document.exitPointerLock();
  $('#shop').classList.remove('hidden'); renderShop();
  for (const k in keys) keys[k] = false;
  setTimeout(() => { const b = $('#shop button.buyBtn:not([disabled]), #shopClose'); if (b) b.focus({ preventScroll: true }); }, 30);
}
function closeShop(){ shopOpen = null; $('#shop').classList.add('hidden'); if (!IS_TOUCH && canvas.requestPointerLock && !lockFailed){ try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (_) {} } canvas.focus({ preventScroll: true }); }
function renderShop(){
  const S = shopOpen; if (!S) return;
  $('#shopTitle').textContent = S.name; $('#shopSub').textContent = S.sub; $('#shopMoney').textContent = '$' + money;
  const list = $('#shopList'), rows = [];
  if (!S.sells){
    for (const key of S.items){
      const P = PRODUCTS[key], owned = P.upgrade && STEP > 0.3, can = money >= P.price && !owned;
      rows.push(`<div class="row"><span class="sw" style="background:${P.color}"></span><div class="tx"><b>${P.name.charAt(0).toUpperCase() + P.name.slice(1)}</b><span>${P.desc}</span></div><span class="pr">$${P.price}</span><button class="btn primary buyBtn" data-buy="${key}" ${can ? '' : 'disabled'}>${owned ? 'Owned' : 'Buy'}</button></div>`);
    }
  } else {
    const groups = {}; for (const q of pocket.items){ groups[q.name] = groups[q.name] || { q, n: 0 }; groups[q.name].n++; }
    const names = Object.keys(groups);
    if (!names.length) rows.push('<p class="empty">Nothing to sell yet. Grab the shovel and dig in the garden. Gold is deepest, below 1.5 m.</p>');
    let total = 0;
    for (const nm of names){ const { q, n } = groups[nm], p = priceOf(q); total += p * n;
      rows.push(`<div class="row"><span class="sw" style="background:${q.type === 'relic' ? '#8a6a3a' : q.type === 'fossil' ? '#b9a88a' : q.type === 'gem' ? '#c0172e' : q.type === 'gold' ? '#e2b33c' : q.type === 'stone' ? '#9a958d' : q.type === 'waste' ? '#7a4428' : '#c0392b'}"></span><div class="tx"><b>${nm.charAt(0).toUpperCase() + nm.slice(1)} \u00d7 ${n}</b><span>$${p} each</span></div><button class="btn" data-sell1="${nm}">Sell 1</button><button class="btn primary" data-sellall="${nm}">Sell all</button></div>`); }
    if (names.length) rows.push(`<div class="row total"><div class="tx"><b>Everything</b><span>${pocket.items.length} items</span></div><span class="pr">$${total}</span><button class="btn primary" data-sellevery="1">Sell everything</button></div>`);
  }
  list.innerHTML = rows.join('');
}
$('#shopList').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; initAudio();
  if (b.dataset.buy) buy(b.dataset.buy);
  else if (b.dataset.sell1) sell(b.dataset.sell1, false);
  else if (b.dataset.sellall) sell(b.dataset.sellall, true);
  else if (b.dataset.sellevery) sell(null, true);
});
$('#shopClose').addEventListener('click', closeShop);

// ---------- seeds, metal detector ----------
function plantSeed(it){
  ray2.setFromCamera(rayCenter, camera);
  const td = terrainRay(ray2.ray.origin, ray2.ray.direction, 2.6);
  if (td == null){ toast(inHouse(camera.position.x, camera.position.z) ? 'Plant them outside in the garden' : 'Aim at the ground closer to you'); return; }
  const p = ray2.ray.at(td, new THREE.Vector3()), why = lockReason(p.x, p.z);
  if (why && why !== 'Something\u2019s in the way'){ toast(why); return; }
  const g = new THREE.Group(); g.position.set(p.x, terrainH(p.x, p.z), p.z); scene.add(g);
  const P = [], r = RNG((p.x * 100 + p.z * 37) | 0), col = ['#e86f8a', '#f7d774', '#b9a4de', '#f2a7c3', '#ffffff', '#f08a7e'][(r() * 6) | 0];
  for (let i = 0; i < 9; i++){ const a = r() * TAU, d = r() * 0.16, h = 0.18 + r() * 0.16, x = Math.cos(a) * d, z = Math.sin(a) * d; P.push(cy(0.004, h, x, 0, z, '#4d7c43')); P.push(sp(0.03, x, h, z, col, 1, 0.7, 1)); P.push(sp(0.01, x, h + 0.012, z, '#f2c14e')); const lf = leafGeo(0.07, 0.025, 0.1, 0.05, 3); orientLeaf(lf, r() * TAU, 0.6, x, h * 0.4, z); P.push(tint(lf, '#4d7c43')); }
  vcMesh(P, g); g.scale.setScalar(0.01);
  planted.push({ g, t: 0 });
  animHeld(0.5, k => { it.g.rotation.z = Math.sin(k * PI) * 0.6; });
  for (let i = 0; i < 8; i++) emit('crumb', new THREE.Vector3(p.x, terrainH(p.x, p.z) + 0.05, p.z), new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.6, (Math.random() - 0.5) * 0.4));
  it.st.n = (it.st.n || 0) + 1; sfx('dig');
  if (it.st.n >= 6){ toast('That was the last of the seeds'); removeItem(it); } else toast(`Planted! ${6 - it.st.n} left in the packet`);
}
const veins = [];
{ const r = RNG(777); let tries = 0; while (veins.length < 12 && tries++ < 400){ const x = -14 + r() * 29, z = -12 + r() * 25; if (!lockReason(x, z)) veins.push({ x, z, left: 2 }); } }
function veinAt(x, z, depth){ if (depth < 1.0) return null; for (const v of veins) if (v.left > 0 && Math.hypot(v.x - x, v.z - z) < 0.85) return v; return null; }
function nearestVein(x, z){ let best = null, bd = 1e9; for (const v of veins){ if (v.left <= 0) continue; const d = Math.hypot(v.x - x, v.z - z); if (d < bd){ bd = d; best = v; } } return { v: best, d: bd }; }
let detT = 0;
function scanGold(it){
  if (inHouse(camera.position.x, camera.position.z) || roomAt(camera.position.x, camera.position.z) === 'Street'){ toast('Scan the garden. There\u2019s nothing under the house or the street.'); return; }
  const f = forwardV(), px = camera.position.x + f.x * 0.9, pz = camera.position.z + f.z * 0.9, { v, d } = nearestVein(px, pz);
  animHeld(1.2, k => { it.g.rotation.z = -0.35 + Math.sin(k * TAU * 2) * 0.35; });
  const n = d < 0.7 ? 5 : d < 1.6 ? 3 : d < 3.5 ? 1 : 0;
  for (let i = 0; i < n; i++) setTimeout(() => beep(1400 + n * 120), 200 + i * 160);
  if (!v || n === 0){ toast('No signal here. Try somewhere else.'); return; }
  if (n === 5){ toast('Strong signal right here! Gold is buried about 1.5 m down.'); return; }
  const dx = v.x - px, dz = v.z - pz, right = { x: Math.cos(player.yaw), z: -Math.sin(player.yaw) }, side = dx * right.x + dz * right.z, ahead = dx * f.x + dz * f.z;
  const dir = Math.abs(side) > Math.abs(ahead) ? (side > 0 ? 'to your right' : 'to your left') : (ahead > 0 ? 'further ahead' : 'behind you');
  toast(n === 3 ? `Signal getting stronger, ${dir}` : `Faint signal, ${dir}`);
}

function updateShops(dt, t){
  for (const p of planted) if (p.t < 1){ p.t = Math.min(1, p.t + dt / 6); p.g.scale.setScalar(Math.max(0.01, smooth(p.t))); }
  for (const c of candles) if (c.st.lit && c.flame){ c.flame.scale.set(1 + Math.sin(t * 23) * 0.12, 1.9 + Math.sin(t * 17) * 0.25, 1); }
  for (const k of keepers){ const d = Math.hypot(player.x - k.x, player.z - k.z); const want = d < 6 ? clamp(angDiff(PI, Math.atan2(player.x - k.x, player.z - k.z)), -0.8, 0.8) : 0; k.hd.rotation.y += (want - k.hd.rotation.y) * (1 - Math.exp(-4 * dt)); k.g.children[2] && (k.g.position.y = GY + Math.sin(t * 1.5 + k.x) * 0.004); }
  // the detector ticks on its own while you carry it in the garden
  if (held && held.name === 'metal detector' && !inHouse(player.x, player.z)){
    const { d } = nearestVein(camera.position.x, camera.position.z);
    if (d < 4){ detT -= dt; if (detT <= 0){ beep(900 + (4 - d) * 200); detT = clamp(d * 0.45, 0.15, 1.8); } }
  }
}
