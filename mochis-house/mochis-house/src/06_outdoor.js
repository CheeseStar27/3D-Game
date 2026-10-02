
// ================= OUTDOORS =================
let groundMesh = null;
const YARD = { x0: -15, x1: 16, z0: -13, z1: 14 }, TCELL = 0.125;
const TNX = Math.round((YARD.x1 - YARD.x0) / TCELL), TNZ = Math.round((YARD.z1 - YARD.z0) / TCELL);
function foliageTex(seed, base){
  return canvasTex(256, 256, (g, W) => {
    g.fillStyle = base; g.fillRect(0, 0, W, W);
    const r = RNG(seed);
    for (let i = 0; i < 1400; i++){ g.fillStyle = hsl(85 + r() * 40, 30 + r() * 25, 18 + r() * 26, 0.8); g.beginPath(); g.ellipse(r() * W, r() * W, 2 + r() * 4, 1 + r() * 2.5, r() * PI, 0, TAU); g.fill(); }
  });
}
TX.foliage = foliageTex(131, '#3f5f33'); TX.foliage.repeat.set(2, 2);
{
  const gtex = TX.grass.clone(); gtex.needsUpdate = true; gtex.repeat.set(1, 1);
  const TS = 4.55;
  // lawn outside the fence: a big ring with the yard cut out
  const outer = new THREE.Shape([new THREE.Vector2(-250, -250), new THREE.Vector2(250, -250), new THREE.Vector2(250, 250), new THREE.Vector2(-250, 250)]);
  outer.holes.push(new THREE.Path([new THREE.Vector2(YARD.x0, -YARD.z1), new THREE.Vector2(YARD.x0, -YARD.z0), new THREE.Vector2(YARD.x1, -YARD.z0), new THREE.Vector2(YARD.x1, -YARD.z1)]));
  const og = new THREE.ShapeGeometry(outer); og.rotateX(-PI / 2);
  { const q = og.attributes.position, uv = og.attributes.uv; for (let i = 0; i < q.count; i++) uv.setXY(i, q.getX(i) / TS, -q.getZ(i) / TS); }
  mesh(og, new THREE.MeshStandardMaterial({ map: gtex, roughness: 1 }), 0, -0.2, 0, scene, false, true);
  // the yard itself is a heightfield you can dig into
  const tg = new THREE.PlaneGeometry(YARD.x1 - YARD.x0, YARD.z1 - YARD.z0, TNX, TNZ); tg.rotateX(-PI / 2); tg.translate((YARD.x0 + YARD.x1) / 2, -0.2, (YARD.z0 + YARD.z1) / 2);
  { const q = tg.attributes.position, uv = tg.attributes.uv; for (let i = 0; i < q.count; i++) uv.setXY(i, q.getX(i) / TS, -q.getZ(i) / TS); }
  tg.setAttribute('dig', new THREE.Float32BufferAttribute(new Float32Array(tg.attributes.position.count), 1));
  const tmat = new THREE.MeshStandardMaterial({ map: gtex, roughness: 1 });
  tmat.onBeforeCompile = sh => {
    sh.vertexShader = 'attribute float dig;\nvarying float vDig;\nvarying vec3 vWP;\nvarying float vNY;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n  vDig = dig;\n  vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vNY = normalize(mat3(modelMatrix) * objectNormal).y;');
    sh.fragmentShader = 'varying float vDig;\nvarying vec3 vWP;\nvarying float vNY;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float soilAmt = clamp(max(vDig, max(1.0 - smoothstep(0.6, 0.85, vNY), smoothstep(0.03, 0.08, -0.2 - vWP.y))), 0.0, 1.0);
      if (soilAmt > 0.001){
        float dp = -0.2 - vWP.y;
        vec3 c0 = vec3(0.07, 0.036, 0.02), c1 = vec3(0.19, 0.078, 0.03), c2 = vec3(0.15, 0.125, 0.1), c3 = vec3(0.045, 0.035, 0.03);
        vec3 soil = mix(c0, c1, smoothstep(0.42, 0.58, dp)); soil = mix(soil, c2, smoothstep(0.92, 1.08, dp)); soil = mix(soil, c3, smoothstep(1.42, 1.58, dp));
        vec3 cell = floor(vWP * 28.0); float n = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float n2 = fract(sin(dot(floor(vWP.xz * 8.0), vec2(39.3468, 11.135))) * 23421.631);
        soil *= 0.78 + 0.32 * n + 0.14 * n2;
        if (dp > 0.95 && dp < 1.5 && n > 0.9) soil = vec3(0.3, 0.29, 0.27);
        if (dp > 1.45 && dp < 3.0 && n > 0.975) soil = vec3(0.8, 0.55, 0.12);
        vec3 c4 = vec3(0.055, 0.06, 0.075), c5 = vec3(0.15, 0.07, 0.045), c6 = vec3(0.24, 0.18, 0.17), c7 = vec3(0.05, 0.04, 0.09), c8 = vec3(0.09, 0.025, 0.012);
        if (dp > 2.9){
          vec3 deep = mix(c4, c5, smoothstep(4.8, 5.3, dp)); deep = mix(deep, c6, smoothstep(7.8, 8.3, dp)); deep = mix(deep, c7, smoothstep(11.6, 12.4, dp)); deep = mix(deep, c8, smoothstep(19.0, 21.0, dp));
          deep *= 0.8 + 0.35 * n;
          if (dp > 8.0 && dp < 12.0 && n > 0.93) deep = vec3(0.45, 0.42, 0.4);
          if (dp > 12.0 && dp < 20.0 && n > 0.95) deep = mix(vec3(0.5, 0.3, 0.9), vec3(0.4, 0.8, 0.9), n2);
          soil = mix(soil, deep, smoothstep(2.9, 3.2, dp));
        }
        diffuseColor.rgb = mix(diffuseColor.rgb, soil, soilAmt);
      }`).replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float dpe = -0.2 - vWP.y; if (dpe > 18.0){ float ng = fract(sin(dot(floor(vWP * 14.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453); totalEmissiveRadiance += vec3(0.9, 0.22, 0.04) * smoothstep(18.0, 26.0, dpe) * (0.25 + 0.75 * step(0.9, ng)); } }`);
  };
  groundMesh = mesh(tg, tmat, 0, 0, 0, scene, true, true);
  boxB(13.6, 0.19, 10.6, M('#a9a7a1', 0.95), 0.5, -0.2, 0, scene, false, true);
  const stone = M('#9c9990', 0.9);
  for (let i = 0; i < 12; i++){ const s = rbox(0.62, 0.05, 0.42, 0.02, stone, -0.6 + (i % 2 ? 0.08 : -0.08), -0.19, 5.75 + i * 0.72, scene, false); s.rotation.y = (i % 3 - 1) * 0.08; }
  const hedgeMat = new THREE.MeshStandardMaterial({ map: TX.foliage, roughness: 1, color: C('#ffffff') });
  for (const [x, w] of [[-3.6, 4.2], [-6.2, 1.2], [3.3, 2.4], [5.8, 1.9]]){ rboxB(w, 0.95, 0.8, 0.28, hedgeMat, x, -0.2, 5.75, scene, true, 3); addCol(x - w / 2, x + w / 2, 5.35, 6.15); }
  const fl = [], r = RNG(141);
  for (let i = 0; i < 160; i++){
    const s = new THREE.SphereGeometry(0.035 + r() * 0.03, 6, 5), x = -6 + r() * 13, z = 6.3 + r() * 0.5;
    if (x > -1.2 && x < 0) continue;
    s.translate(x, -0.2 + 0.1 + r() * 0.25, z);
    fl.push(tint(s, ['#f2a7c3', '#ffffff', '#b9a4de', '#f7d774', '#f08a7e'][(r() * 5) | 0]));
  }
  mesh(merge(fl), MAT.vc, 0, 0, 0, scene, false, false);
}
function tree(x, z, s = 1, seed = 1){
  const r = RNG(seed);
  cyl(0.12 * s, 0.18 * s, 3.2 * s, M('#5a4636', 0.95), x, -0.2 + 1.6 * s, z, scene, 8);
  addCol(x - 0.2 * s, x + 0.2 * s, z - 0.2 * s, z + 0.2 * s);
  const cols = ['#4a6b3a', '#56773f', '#3f5f35', '#61814a'];
  for (let i = 0; i < 5; i++){
    const g = new THREE.SphereGeometry(1, 14, 10), p = g.attributes.position;
    for (let k = 0; k < p.count; k++){ const n = 1 + (Math.sin(p.getX(k) * 5 + seed) * Math.cos(p.getY(k) * 4 + i) * 0.12) + (r() - 0.5) * 0.04; p.setXYZ(k, p.getX(k) * n, p.getY(k) * n, p.getZ(k) * n); }
    g.computeVertexNormals();
    const rad = (1.1 + r() * 0.8) * s;
    const m = mesh(g, new THREE.MeshStandardMaterial({ map: TX.foliage, roughness: 1, color: C(cols[i % 4]).multiplyScalar(2.2) }), x + (r() - 0.5) * 1.6 * s, -0.2 + (3.4 + r() * 1.6) * s, z + (r() - 0.5) * 1.6 * s);
    m.scale.set(rad, rad * 0.85, rad);
  }
}
[[-9.5, 9, 1.1], [-3.5, 11.5, 1.0], [3.5, 12, 1.2], [10, 10, 1.0], [12.5, 3.5, 1.1], [13, -3.5, 0.9], [10.5, -9.5, 1.2], [2.5, -11.5, 1.0], [-5, -12, 1.1], [-11.5, -8, 1.0], [-12, 1, 1.2], [-14, 7.5, 0.9], [17, 13, 1.3], [-17, -13, 1.2], [7, -16, 1.1], [-20, 12, 1.4], [21, -6, 1.3], [-22, -4, 1.2], [17, 22.5, 1.3], [-16.5, 22.5, 1.2]]
  .forEach(([x, z, s], i) => tree(x, z, s, i * 17 + 3));
{ // picket fence
  const parts = [], X0 = -15, X1 = 16, Z0 = -13, Z1 = 14, y0 = -0.2;
  const run = (ax, az, bx, bz) => {
    const L = Math.hypot(bx - ax, bz - az), n = Math.floor(L / 0.16), ang = Math.atan2(bx - ax, bz - az);
    for (let i = 0; i <= n; i++){
      const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      const g = new THREE.BoxGeometry(0.08, 1.0, 0.025); g.translate(0, y0 + 0.5, 0); g.rotateY(ang + PI / 2); g.translate(x, 0, z); parts.push(g);
    }
    for (const y of [0.3, 0.8]){ const g = new THREE.BoxGeometry(0.04, 0.06, L); g.rotateY(ang); g.translate((ax + bx) / 2, y0 + y, (az + bz) / 2); parts.push(g); }
  };
  // the front fence leaves a gap for the automatic gate
  run(X0, Z0, X1, Z0); run(X1, Z0, X1, Z1); run(X0, Z1, -1.94, Z1); run(0.74, Z1, X1, Z1); run(X0, Z0, X0, Z1);
  const m = mesh(merge(parts), M('#f1efe9', 0.7), 0, 0, 0, scene, true, true);
  addCol(X0 - 0.1, X1 + 0.1, Z0 - 0.1, Z0 + 0.1); addCol(X0 - 0.1, -1.94, Z1 - 0.1, Z1 + 0.1); addCol(0.74, X1 + 0.1, Z1 - 0.1, Z1 + 0.1);
  addCol(X0 - 0.1, X0 + 0.1, Z0, Z1); addCol(X1 - 0.1, X1 + 0.1, Z0, Z1);
}
{ // gable roof over the house
  const sh = new THREE.Shape(); sh.moveTo(-5.55, 0); sh.lineTo(5.55, 0); sh.lineTo(0, 2.1); sh.closePath();
  const rg = new THREE.ExtrudeGeometry(sh, { depth: 13.3, bevelEnabled: false });
  rg.rotateY(PI / 2); rg.translate(-6.15, 3.0, 0);
  const roof = mesh(rg, [MAT.exterior, M('#4a4f55', 0.85)], 0, 0, 0, scene, false, false);
  boxB(13.3, 0.12, 10.9, M('#f1efe9', 0.8), 0.5, 2.9, 0, scene, false, false);
}
function neighbour(x, z, ry, w, d, h, wallHex, roofHex){
  const g = grp(x, z, ry, scene, -0.2);
  { const sw = Math.abs(Math.sin(ry)) > 0.5, hw = (sw ? d : w) / 2 + 0.4, hd = (sw ? w : d) / 2 + 0.4; addCol(x - hw, x + hw, z - hd, z + hd); }
  boxB(w, h, d, M(wallHex, 0.9), 0, 0, 0, g, false, true);
  const sh = new THREE.Shape(); sh.moveTo(-w / 2 - 0.4, 0); sh.lineTo(w / 2 + 0.4, 0); sh.lineTo(0, h * 0.55); sh.closePath();
  const roof = new THREE.ExtrudeGeometry(sh, { depth: d + 0.6, bevelEnabled: false }); roof.translate(0, h, -(d + 0.6) / 2);
  mesh(roof, M(roofHex, 0.8), 0, 0, 0, g, false, true);
  const win = M('#2b3440', 0.2, 0.3);
  for (let i = 0; i < 3; i++) box(0.9, 1.1, 0.05, win, -w / 3 + i * w / 3, h * 0.5, d / 2 + 0.02, g, false, false);
  box(1.0, 2.0, 0.05, M('#5b4636', 0.6), w / 2 - 1.2, 1.0, d / 2 + 0.02, g, false, false);
}
neighbour(-27, 24, PI, 9, 7, 3.6, '#e9e4da', '#4a4f55');
neighbour(24, 25, PI, 8, 7, 3.4, '#d9dfe2', '#5a4a42');
neighbour(30, -16, -PI / 2, 9, 8, 3.8, '#efe8dc', '#3f454b');
neighbour(-28, -20, PI / 2, 8, 7, 3.5, '#e6e1d4', '#56504a');
neighbour(4, -30, 0, 10, 8, 3.8, '#dfe3e0', '#474c52');
{ // pavement and a quiet street outside the gate
  const conc = new THREE.MeshStandardMaterial({ color: C('#b9b5ad'), roughness: 0.95, map: TX.plaster });
  const pv = mesh(new THREE.PlaneGeometry(120, 1.25), conc, 0, -0.196, 14.9, scene, false, true); pv.rotation.x = -PI / 2;
  const pv2 = mesh(new THREE.PlaneGeometry(120, 1.0), conc, 0, -0.196, 19.8, scene, false, true); pv2.rotation.x = -PI / 2;
  const road = mesh(new THREE.PlaneGeometry(120, 3.8), M('#3b3d3f', 0.92), 0, -0.198, 17.4, scene, false, true); road.rotation.x = -PI / 2;
  const P = []; for (let x = -58; x < 58; x += 3){ const g = new THREE.BoxGeometry(1.5, 0.002, 0.1); g.translate(x, -0.196, 17.4); P.push(g); }
  mesh(merge(P), M('#e8e2cf', 0.7), 0, 0, 0, scene, false, false);
  for (const z of [15.52, 19.28]) box(120, 0.05, 0.08, M('#a19c93', 0.9), 0, -0.175, z, scene, false, true);
  for (const x of [-12, 8, 26]){ cyl(0.05, 0.06, 4.2, M('#2f3331', 0.6, 0.4), x, 1.9, 19.9, scene, 10); const arm = boxB(0.9, 0.05, 0.06, M('#2f3331', 0.6, 0.4), x, 3.9, 19.6, scene); arm.rotation.y = PI / 2; sph(0.12, glowMat('#fff1d6', 0.0, 1.8), x, 3.85, 19.2, scene, 1, 0.5, 1); addCol(x - 0.08, x + 0.08, 19.82, 19.98); }
  addCol(-40, 40, 28, 28.3); addCol(-40.3, -40, -36, 28.3); addCol(40, 40.3, -36, 28.3);
  const plaza = mesh(new THREE.PlaneGeometry(29, 1.4), conc, 0, -0.197, 20.95, scene, false, true); plaza.rotation.x = -PI / 2; addCol(-40, 40, -36.3, -36);
}
{ // distant hills
  const r = RNG(151);
  for (let i = 0; i < 16; i++){
    const a = i / 16 * TAU + r() * 0.2, d = 190 + r() * 60, s = 40 + r() * 50;
    const m = sph(1, M(['#6d8a66', '#7d9a70', '#5e7a5b', '#8aa37c'][i % 4], 1), Math.sin(a) * d, -s * 0.18, Math.cos(a) * d, scene, s * 1.6, s * 0.45, s, 16);
    m.castShadow = false;
  }
}

// ================= SKY, LIGHTS, ATMOSPHERE =================
const SUN_DIR = new THREE.Vector3(13.5, 17, 15).normalize();
const MOON_DIR = new THREE.Vector3(-10, 14, 12).normalize();
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: C('#5d93c9') }, hor: { value: C('#cfe0ea') }, bot: { value: C('#8a9a7a') }, sunDir: { value: SUN_DIR }, moonDir: { value: MOON_DIR }, night: { value: 0 } },
  vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 moonDir; uniform float night; varying vec3 vDir;
    float hash(vec3 p){ p = fract(p*0.3183099+0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    void main(){
      vec3 d = normalize(vDir); float h = d.y;
      vec3 col = h > 0.0 ? mix(hor, top, pow(smoothstep(0.0, 1.0, h), 0.55)) : mix(hor, bot, smoothstep(0.0, 0.08, -h));
      float s = max(dot(d, sunDir), 0.0);
      col += (1.0-night) * (vec3(1.0,0.85,0.6)*pow(s, 900.0)*6.0 + vec3(1.0,0.8,0.55)*pow(s, 10.0)*0.35);
      if (night > 0.01 && h > 0.0){ vec3 q = floor(d*260.0); float r = hash(q); float st = step(0.9965, r) * smoothstep(0.03, 0.35, h); col += vec3(st) * night * (0.4 + 0.8*hash(q+3.1)); }
      float m = dot(d, moonDir); col += night * (vec3(0.9,0.92,1.0)*smoothstep(0.99955, 0.9997, m)*1.4 + vec3(0.25,0.3,0.45)*pow(max(m,0.0), 60.0)*0.25);
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }`
});
const sky = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), skyMat); sky.renderOrder = -1; scene.add(sky);
scene.fog = new THREE.Fog(C('#cfe0ea'), 45, 280);

const hemi = new THREE.HemisphereLight(C('#dfeaf5'), C('#b8a58c'), 0.42); scene.add(hemi);
const sun = new THREE.DirectionalLight(C('#fff0d8'), 2.6);
sun.position.copy(SUN_DIR).multiplyScalar(26).add(new THREE.Vector3(0.5, 0, 0));
sun.target.position.set(0.5, 0, 0); scene.add(sun.target);
sun.castShadow = true;
sun.shadow.mapSize.set(IS_TOUCH ? 1024 : 2048, IS_TOUCH ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 2, far: 60 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(sun);

const pmrem = new THREE.PMREMGenerator(renderer);
const ENV_DAY = pmrem.fromEquirectangular(envTex(false)).texture;
const ENV_NIGHT = pmrem.fromEquirectangular(envTex(true)).texture;
pmrem.dispose();
scene.environment = ENV_DAY;

const DAY = { top: '#5d93c9', hor: '#d3e3ec', bot: '#8a9a7a', fog: '#d3e3ec', hs: '#dfeaf5', hg: '#b8a58c', hi: 0.42, sc: '#fff0d8', si: 2.6, exp: 1.0 };
const NIGHT = { top: '#060a18', hor: '#1a2540', bot: '#0b0f0c', fog: '#121a2c', hs: '#3a4668', hg: '#1c1712', hi: 0.1, sc: '#9fb3de', si: 0.3, exp: 1.08 };
const tmpA = new THREE.Color(), tmpB = new THREE.Color();
function lerpHex(out, a, b, t){ tmpA.copy(C(a)); tmpB.copy(C(b)); out.copy(tmpA).lerp(tmpB, t); return out; }
let nightT = 0, nightTarget = 0;
function applyTime(t){
  const k = smooth(clamp(t, 0, 1));
  lerpHex(skyMat.uniforms.top.value, DAY.top, NIGHT.top, k);
  lerpHex(skyMat.uniforms.hor.value, DAY.hor, NIGHT.hor, k);
  lerpHex(skyMat.uniforms.bot.value, DAY.bot, NIGHT.bot, k);
  skyMat.uniforms.night.value = k;
  lerpHex(scene.fog.color, DAY.fog, NIGHT.fog, k);
  lerpHex(hemi.color, DAY.hs, NIGHT.hs, k); lerpHex(hemi.groundColor, DAY.hg, NIGHT.hg, k); hemi.intensity = lerp(DAY.hi, NIGHT.hi, k);
  lerpHex(sun.color, DAY.sc, NIGHT.sc, k); sun.intensity = lerp(DAY.si, NIGHT.si, k);
  const sd = new THREE.Vector3().copy(SUN_DIR).lerp(MOON_DIR, k).normalize();
  sun.position.copy(sd).multiplyScalar(26).add(sun.target.position);
  renderer.toneMappingExposure = lerp(DAY.exp, NIGHT.exp, k);
  scene.environment = k > 0.5 ? ENV_NIGHT : ENV_DAY;
  for (const g of glows) g.mat.emissiveIntensity = lerp(g.day, g.night, k);
  for (const L of lightsList) L.l.intensity = lerp(L.day, L.night, k);
}
glows.push({ mat: MAT.ceiling, day: 0.4, night: 0.06 });
applyTime(0);
