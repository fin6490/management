/* The Barman, what the bottle sends after you in Level 2. You never get a good look at it. It's a
   shape the size of a person, black as a hole in the air, with a red glow round its edges like
   heat off a stove. It hides: you catch it at the corner of your eye, standing very still at the
   far end of a room, and when you turn to look there's nothing there. When it hunts you it comes
   flat through the air, head first, arms out, like something swimming, and it slows and thins to
   almost nothing while you're looking straight at it, and comes on fast when you look away.
   When it catches you, you see its face for the first time. It's yours: your skin, your hair, your
   glasses, a few years and a lot of bottles from now. Grey, gaunt, eyes sunk into the skull,
   lips cracked. Dead.
   Everything it sounds like is made here with Web Audio (no files): a low drone that swells as it
   closes in, wet ragged breathing, scraping whispers, and a scream when it gets you. */
const L2Demon = (() => {
  const mix = (a, b, k) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString();
  const looks = () => (typeof Looks !== 'undefined' ? Looks.get() : { skin: '#f0c19a', hair: '#3a2a1e', style: 'short', beard: '', glasses: false, shirt: '#4a7a46' });

  /* ---------- the shape ---------- */
  function make() {
    const T = THREE, g = new T.Group(), body = new T.Group(); g.add(body);
    const dark = new T.MeshBasicMaterial({ color: '#030000', transparent: true, opacity: 1, fog: false });
    const rim = new T.MeshBasicMaterial({ color: '#ff1a0a', transparent: true, opacity: .55, side: T.BackSide, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
    const mats = [dark, rim];
    // every part twice: the black shape, and a slightly bigger red shell behind it that reads as a glowing edge
    const part = (geo, x, y, z, parent = body, rx = 0, rz = 0) => { const grp = new T.Group(); grp.position.set(x, y, z); grp.rotation.set(rx, 0, rz); parent.add(grp); grp.add(new T.Mesh(geo, dark)); const r = new T.Mesh(geo, rim); r.scale.setScalar(1.13); grp.add(r); return grp; };
    const cap = (r, l) => new T.CapsuleGeometry(r, l, 4, 10);
    const torso = part(cap(.19, .5), 0, 1.15, 0); torso.scale.set(1, 1, .7);
    const head = part(new T.SphereGeometry(.14, 16, 12), 0, 1.68, .02); head.scale.set(.9, 1.1, 1);
    const arms = [-1, 1].map(sx => { const sh = new T.Group(); sh.position.set(sx * .25, 1.42, 0); body.add(sh); part(cap(.055, .62), 0, -.36, 0, sh); return { sh, sx }; });
    const legs = [-1, 1].map(sx => { const hip = new T.Group(); hip.position.set(sx * .1, .88, 0); body.add(hip); part(cap(.075, .72), 0, -.42, 0, hip); return { hip, sx }; });
    // the aura: a red glow behind it, a light that stains whatever it passes
    const auraTex = R3.api.canvasTex('demonaura', 64, 128, (c, w, hh) => { const gr = c.createRadialGradient(w / 2, hh / 2, 2, w / 2, hh / 2, w * .95); gr.addColorStop(0, 'rgba(255,40,20,.55)'); gr.addColorStop(.5, 'rgba(160,0,0,.25)'); gr.addColorStop(1, 'rgba(80,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, hh); });
    const aura = new T.Sprite(new T.SpriteMaterial({ map: auraTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, opacity: .9 }));
    aura.scale.set(1.6, 2.9, 1); aura.position.set(0, 1.1, -.2); body.add(aura);
    const light = new T.PointLight('#ff1a0a', 2.2, 7, 2); light.position.set(0, 1.2, -.4); body.add(light);
    // a smear of dark red it leaves in the air behind it when it flies
    const trail = []; for (let i = 0; i < 8; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: auraTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, toneMapped: false })); sp.scale.set(.9, .9, 1); R3.api.add(sp); trail.push({ sp, life: 0 }); }
    let phase = Math.random() * 9, trailT = 0, ti = 0, fade = 1;
    const U = g.userData;
    U.mode = 'stand'; U.pace = 1;
    // is it where you're looking?
    U.seen = () => { const P = R3.player, dx = g.position.x - P.x, dz = g.position.z - P.z, d = Math.hypot(dx, dz) || 1; return Math.acos(Math.max(-1, Math.min(1, (dx * Math.sin(P.yaw) + dz * Math.cos(P.yaw)) / d))) < R3.hfov * .2; };
    U.animate = (t, dt, dist = 9) => {
      phase += dt;
      const fly = U.mode === 'fly', seen = U.seen(), close = dist < 4;
      // hiding: it thins almost to nothing while you look at it, unless it's already on you
      const want = fly ? (seen && !close ? .55 + (Math.random() < .25 ? -.4 : 0) : 1) : (seen ? 0 : 1);
      fade += (want - fade) * Math.min(1, dt * (want < fade ? 6 : 2.5));
      U.pace = fly ? (seen && !close ? .55 : 1.25) : 1;
      dark.opacity = fade; rim.opacity = .55 * fade * (.8 + Math.sin(t * 7) * .2); aura.material.opacity = .9 * Math.max(.25, fade) * (.85 + Math.random() * .15); light.intensity = 2.2 * Math.max(.2, fade);
      if (fly) {
        // flat through the air, head first, arms out ahead of it, legs trailing, rising and falling like breathing
        body.rotation.x += (Math.PI / 2 - body.rotation.x) * Math.min(1, dt * 4);
        body.position.y = 1.15 + Math.sin(phase * 2.1) * .12; body.position.z = -.95; // lying on the air at chest height, head towards you body.rotation.z = Math.sin(phase * 1.3) * .15;
        for (const A of arms) { A.sh.rotation.x = Math.PI * .95 + Math.sin(phase * 3 + A.sx) * .12; A.sh.rotation.z = A.sx * (.2 + Math.sin(phase * 2.2) * .05); }
        for (const L of legs) L.hip.rotation.x = Math.sin(phase * 5 + L.sx * 1.5) * .25;
        trailT -= dt; if (trailT <= 0) { trailT = .12; const tr = trail[ti++ % trail.length], wp = new T.Vector3(); head.getWorldPosition(wp); tr.sp.position.copy(wp); tr.life = 1; }
      } else {
        // standing: perfectly still, head a little to one side, the way nothing alive stands
        body.rotation.x += (0 - body.rotation.x) * Math.min(1, dt * 4); body.position.set(0, 0, 0); body.rotation.z = 0;
        head.rotation.z = .28; for (const A of arms) { A.sh.rotation.set(0, 0, A.sx * .05); }
      }
      for (const tr of trail) { if (tr.life <= 0) continue; tr.life -= dt * 1.4; tr.sp.material.opacity = Math.max(0, tr.life) * .5 * fade; tr.sp.scale.setScalar(.9 + (1 - tr.life) * .8); }
    };
    U.dispose = () => { trail.forEach(tr => tr.sp.parent && tr.sp.parent.remove(tr.sp)); if (g.parent) g.parent.remove(g); };
    U.fade = () => fade;
    R3.api.add(g); return g;
  }

  /* ---------- its face, which is yours ---------- */
  // painted, not modelled: a close-up portrait of you, dead. Your skin drained grey-green, your hair
  // thinned and greyed, your beard and glasses if you have them, eyes sunk into black sockets,
  // cheeks fallen in, lips shrunk back off the teeth. Painted on a gently curved surface in two
  // halves, so the jaw can drop away from the face onto black.
  const W = 512, H = 704, MOUTH = .655; // the split between face and jaw, as a fraction of the height
  const faceCache = {};
  function paintFace(L) {
    const key = [L.skin, L.hair, L.style, L.beard, L.glasses].join(); if (faceCache[key]) return faceCache[key];
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const cx = W / 2, skin = new THREE.Color(mix(mix(L.skin, '#7d8a76', .55), '#4b5048', .1));
    const tone = (k, a = 1) => { const t = skin.clone().multiplyScalar(k); return `rgba(${t.r * 255 | 0},${t.g * 255 | 0},${t.b * 255 | 0},${a})`; };
    const blob = (x, y, rx, ry, col, col2 = 'rgba(0,0,0,0)') => { g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, col); gr.addColorStop(1, col2); g.fillStyle = gr; g.fillRect(-rx, -rx, rx * 2, rx * 2); g.restore(); };
    // the head: long and narrow, pinched at the temples and under the cheekbones
    const head = new Path2D(); head.moveTo(cx, 40); head.bezierCurveTo(cx + 175, 40, cx + 200, 200, cx + 168, 270); head.bezierCurveTo(cx + 150, 330, cx + 175, 400, cx + 150, 470);
    head.bezierCurveTo(cx + 125, 590, cx + 70, 690, cx, 700); head.bezierCurveTo(cx - 70, 690, cx - 125, 590, cx - 150, 470); head.bezierCurveTo(cx - 175, 400, cx - 150, 330, cx - 168, 270); head.bezierCurveTo(cx - 200, 200, cx - 175, 40, cx, 40);
    g.save(); g.clip(head);
    const base = g.createRadialGradient(cx, 330, 40, cx, 330, 330); base.addColorStop(0, tone(1.05)); base.addColorStop(.6, tone(.8)); base.addColorStop(1, tone(.25)); g.fillStyle = base; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) blob(Math.random() * W, Math.random() * H, 8 + Math.random() * 40, 8 + Math.random() * 40, `rgba(${50 + Math.random() * 50},${30 + Math.random() * 30},${40 + Math.random() * 30},.16)`); // mottled
    // hollow temples and cheeks, a jaw you can see the bone of
    for (const sx of [-1, 1]) { blob(cx + sx * 150, 250, 70, 110, 'rgba(10,6,10,.75)'); blob(cx + sx * 105, 470, 70, 95, 'rgba(12,6,12,.8)'); blob(cx + sx * 110, 395, 60, 22, tone(1.35, .8)); blob(cx + sx * 85, 600, 60, 40, 'rgba(10,5,10,.5)'); }
    // the forehead, lined
    g.strokeStyle = 'rgba(20,10,15,.45)'; g.lineWidth = 2; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 110, 150 + i * 22); g.quadraticCurveTo(cx, 138 + i * 22 + (i % 2) * 6, cx + 110, 150 + i * 22); g.stroke(); }
    // the sockets: deep and black, the bone of the brow catching the light above them
    for (const sx of [-1, 1]) {
      blob(cx + sx * 72, 292, 88, 70, 'rgba(0,0,0,.98)', 'rgba(20,5,15,0)'); blob(cx + sx * 72, 296, 50, 36, 'rgba(0,0,0,1)', 'rgba(0,0,0,.6)');
      blob(cx + sx * 70, 232, 85, 18, tone(1.4, .7)); blob(cx + sx * 75, 350, 70, 26, 'rgba(70,20,50,.65)'); // brow, and the bruised bags under the eyes
    }
    // the nose: a thin bridge, a sharp tip, black nostrils
    blob(cx, 360, 16, 90, tone(1.35, .55)); blob(cx - 22, 435, 12, 7, 'rgba(0,0,0,.95)'); blob(cx + 22, 435, 12, 7, 'rgba(0,0,0,.95)'); blob(cx, 418, 24, 16, tone(1.2, .6));
    // broken veins across the cheeks and nose
    g.lineWidth = 1.3; for (let i = 0; i < 160; i++) { const sx = Math.random() < .5 ? -1 : 1; let x = cx + sx * (20 + Math.random() * 110), y = 340 + Math.random() * 140; g.strokeStyle = `rgba(${130 + Math.random() * 70},15,${40 + Math.random() * 40},.5)`; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - .5) * 16; y += (Math.random() - .5) * 12; g.lineTo(x, y); } g.stroke(); }
    // the mouth: lips shrunk back off long, yellow teeth, some gone
    const my = H * MOUTH;
    g.fillStyle = 'rgba(25,8,12,1)'; g.beginPath(); g.ellipse(cx, my, 78, 26, 0, 0, 7); g.fill();
    for (let i = 0; i < 9; i++) { if (i === 2 || i === 6) continue; const x = cx - 64 + i * 16, up = my - 2; g.fillStyle = `rgb(${150 + Math.random() * 30},${130 + Math.random() * 20},${70 + Math.random() * 20})`; g.fillRect(x, up - 20, 13, 20); g.fillRect(x + 1, my + 2, 12, 16 + Math.random() * 4); g.fillStyle = 'rgba(60,30,10,.6)'; g.fillRect(x, up - 20, 13, 3); }
    g.strokeStyle = '#3a1c22'; g.lineWidth = 7; g.beginPath(); g.ellipse(cx, my, 80, 28, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.beginPath(); g.ellipse(cx, my, 76, 26, 0, Math.PI * .1, Math.PI * .9); g.stroke(); // what's left of the lips
    g.strokeStyle = 'rgba(10,0,4,.9)'; g.lineWidth = 1; for (let i = 0; i < 16; i++) { const x = cx - 70 + i * 9; g.beginPath(); g.moveTo(x, my - 30); g.lineTo(x + 2, my - 20); g.stroke(); } // cracks
    blob(cx + 76, my + 6, 12, 10, 'rgba(140,20,30,.95)'); // a sore at the corner
    // stubble, or what the beard has become
    if (L.beard) { g.fillStyle = mix(L.hair, '#8c8c8c', .55); g.globalAlpha = .55; for (let i = 0; i < (L.beard === 'stubble' ? 4000 : 8000); i++) { const a = Math.random() * Math.PI, r = 90 + Math.random() * 90; const x = cx + Math.cos(a) * r * 1.05, y = 470 + Math.sin(a) * r * 1.15; if (y > 440) g.fillRect(x, y, 1.6, 3.4); } g.globalAlpha = 1; }
    g.restore();
    // hair: thin, greasy, greyed, in strands
    if (L.style !== 'bald') { const hc = mix(L.hair, '#8a8a8a', .45); g.strokeStyle = hc; g.globalAlpha = .7; for (let i = 0; i < 220; i++) { const a = -Math.PI * .95 + Math.random() * Math.PI * .9, x0 = cx + Math.cos(a) * 160, y0 = 175 + Math.sin(a) * 140; g.lineWidth = .8 + Math.random() * 1.4; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + (Math.random() - .5) * 40, y0 + 60, x0 + (x0 < cx ? -10 : 10) + (Math.random() - .5) * 30, y0 + 90 + Math.random() * (L.style === 'long' || L.style === 'bob' ? 260 : 80)); g.stroke(); } g.globalAlpha = 1; }
    // the glasses, one lens cracked
    if (L.glasses) { g.strokeStyle = '#111'; g.lineWidth = 6; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * 72, 296, 62, 46, 0, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(cx - 12, 290); g.quadraticCurveTo(cx, 280, cx + 12, 290); g.stroke(); g.strokeStyle = 'rgba(230,230,230,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + 40, 265); g.lineTo(cx + 70, 300); g.lineTo(cx + 62, 330); g.moveTo(cx + 70, 300); g.lineTo(cx + 108, 290); g.stroke(); }
    return (faceCache[key] = c);
  }
  // the eyes are separate so the lids can open over them: yellowed, bloodshot, the pupils pinned
  function paintEye() {
    return R3.api.canvasTex('deadeye2', 128, 96, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * .45); gr.addColorStop(0, '#e6dc9a'); gr.addColorStop(.7, '#b8a24a'); gr.addColorStop(1, '#5a1a10'); g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h / 2, w * .42, h * .34, 0, 0, 7); g.fill();
      g.strokeStyle = 'rgba(170,10,10,.8)'; g.lineWidth = 1; for (let i = 0; i < 30; i++) { const a = Math.random() * 7; let x = w / 2 + Math.cos(a) * w * .4, y = h / 2 + Math.sin(a) * h * .3; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (w / 2 - x) * .2 + (Math.random() - .5) * 6; y += (h / 2 - y) * .2 + (Math.random() - .5) * 6; g.lineTo(x, y); } g.stroke(); }
      g.fillStyle = '#4a3a10'; g.beginPath(); g.arc(w / 2, h / 2, 13, 0, 7); g.fill(); g.fillStyle = '#000'; g.beginPath(); g.arc(w / 2, h / 2, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(w / 2 + 7, h / 2 - 6, 3, 0, 7); g.fill();
    });
  }
  // a plane bent back at the sides, so the face has a little depth to it
  function curved(w, h, y0, y1, depth = .05) {
    const geo = new THREE.PlaneGeometry(w, h * (y1 - y0), 24, 8), pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, -depth * Math.pow(x / (w / 2), 2)); uv.setY(i, 1 - (y0 + (1 - uv.getY(i)) * (y1 - y0))); }
    geo.computeVertexNormals(); return geo;
  }
  function face() {
    const T = THREE, L = looks(), g = new T.Group(), fw = .27, fh = fw * H / W;
    const tex = new T.CanvasTexture(paintFace(L)); tex.encoding = T.sRGBEncoding;
    const m = new T.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
    const upper = new T.Mesh(curved(fw, fh, 0, MOUTH), m); upper.position.y = fh * (.5 - MOUTH / 2); g.add(upper);
    const jaw = new T.Group(); jaw.position.y = fh * (.5 - MOUTH); g.add(jaw);
    const lower = new T.Mesh(curved(fw, fh, MOUTH, 1), m); lower.position.y = -fh * (1 - MOUTH) / 2; jaw.add(lower);
    // behind the face: the inside of the mouth, which goes back further than it should
    const voidM = new T.MeshBasicMaterial({ transparent: true, map: R3.api.canvasTex('deadmouth2', 128, 128, (c, w, hh) => { c.fillStyle = '#000'; c.beginPath(); c.ellipse(w / 2, hh / 2, w * .48, hh * .48, 0, 0, 7); c.fill(); const gr = c.createRadialGradient(w / 2, hh * .55, 2, w / 2, hh * .55, w * .5); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.7, 'rgba(10,0,2,1)'); gr.addColorStop(1, 'rgba(70,6,14,1)'); c.globalCompositeOperation = 'source-atop'; c.fillStyle = gr; c.fillRect(0, 0, w, hh); }) });
    const back = new T.Mesh(new T.PlaneGeometry(fw * .6, fh * .42), voidM); back.position.set(0, fh * (.5 - MOUTH) - fh * .12, -.03); g.add(back);
    // skin stretched between the face and the dropped jaw, so it's one face pulling open, not two pieces
    const sc = mix(mix(L.skin, '#7d8a76', .55), '#1e1e1e', .45);
    const stretch = new T.Mesh(new T.PlaneGeometry(fw * .82, fh * .36), new T.MeshBasicMaterial({ transparent: true, toneMapped: false, map: R3.api.canvasTex('stretch' + sc, 128, 64, (c, w, hh) => { const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.12, sc); gr.addColorStop(.88, sc); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, hh); c.strokeStyle = 'rgba(0,0,0,.35)'; for (let i = 0; i < 14; i++) { c.beginPath(); c.moveTo(10 + Math.random() * 30, Math.random() * hh); c.lineTo(10 + Math.random() * 30, Math.random() * hh); c.moveTo(w - 10 - Math.random() * 30, Math.random() * hh); c.lineTo(w - 10 - Math.random() * 30, Math.random() * hh); c.stroke(); } }) }));
    stretch.position.set(0, fh * (.5 - MOUTH) - fh * .12, -.036); g.add(stretch);
    // the eyes, and the lids over them
    const eyeM = new T.MeshBasicMaterial({ map: paintEye(), toneMapped: false, transparent: true });
    const lidCol = mix(mix(L.skin, '#7d8a76', .55), '#141414', .55);
    const lidTex = R3.api.canvasTex('deadlid' + lidCol, 128, 96, (c, w, hh) => { c.fillStyle = lidCol; c.beginPath(); c.ellipse(w / 2, hh / 2, w * .46, hh * .4, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(0,0,0,.9)'; c.lineWidth = 4; c.beginPath(); c.ellipse(w / 2, hh * .52, w * .4, hh * .18, 0, .15, Math.PI - .15); c.stroke(); });
    const lids = [];
    for (const sx of [-1, 1]) {
      const ex = sx * 72 / W * fw, ey = fh * (.5 - 296 / H);
      const eye = new T.Mesh(new T.PlaneGeometry(fw * .17, fw * .12), eyeM); eye.position.set(ex, ey, .004 - .05 * Math.pow(ex / (fw / 2), 2)); g.add(eye);
      const lid = new T.Mesh(new T.PlaneGeometry(fw * .19, fw * .14), new T.MeshBasicMaterial({ map: lidTex, transparent: true, toneMapped: false })); lid.position.set(ex, ey, .008 - .05 * Math.pow(ex / (fw / 2), 2)); g.add(lid); lids.push({ lid, y: ey });
    }
    g.userData = { jaw, lids, fh };
    return g;
  }

  /* ---------- the sound of it ---------- */
  let ax = null, bus = null, drone = null, breathT = 0, whisperT = 0, near = 0;
  const on = () => App.state && App.state.settings.sound !== false;
  function ctx() {
    if (!ax) { ax = new (window.AudioContext || window.webkitAudioContext)(); bus = ax.createGain(); bus.gain.value = .9; bus.connect(ax.destination); }
    if (ax.state === 'suspended') ax.resume();
    return ax;
  }
  function noiseBuf(sec = 2) {
    const a = ctx(), b = a.createBuffer(1, a.sampleRate * sec, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  const curve = k => { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; c[i] = (1 + k) * x / (1 + k * Math.abs(x)); } return c; };
  // a low, sour drone: detuned saws through a lowpass that opens as it closes in
  function startDrone() {
    if (!on() || drone) return;
    try {
      const a = ctx(), out = a.createGain(), lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; lp.Q.value = 6;
      out.gain.value = 0; out.connect(bus); lp.connect(out);
      const oscs = [41, 43.6, 58.3, 82.4].map(f => { const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(lp); o.start(); return o; });
      const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = .23; lg.gain.value = 60; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      out.gain.linearRampToValueAtTime(.12, a.currentTime + 2);
      drone = { out, lp, oscs: [...oscs, lfo] };
    } catch (e) { drone = null; }
  }
  function stopDrone() {
    if (!drone) return; const d = drone; drone = null;
    try { const t = ax.currentTime; d.out.gain.cancelScheduledValues(t); d.out.gain.setValueAtTime(d.out.gain.value, t); d.out.gain.linearRampToValueAtTime(0, t + 1.2); d.oscs.forEach(o => o.stop(t + 1.3)); } catch (e) { }
  }
  // one ragged breath, in or out: filtered noise with a shaky envelope
  function breath(v, inhale) {
    if (!on()) return;
    try {
      const a = ctx(), t = a.currentTime, src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain(), len = inhale ? .9 : 1.3;
      src.buffer = noiseBuf(2); bp.type = 'bandpass'; bp.frequency.setValueAtTime(inhale ? 900 : 520, t); bp.frequency.linearRampToValueAtTime(inhale ? 1500 : 300, t + len); bp.Q.value = 2.5;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.5 * v, t + len * .35);
      for (let k = 1; k < 6; k++) g.gain.setValueAtTime(.5 * v * (.55 + Math.random() * .45), t + len * (.35 + k * .1)); // the rattle in it
      g.gain.exponentialRampToValueAtTime(.0001, t + len);
      src.connect(bp); bp.connect(g); g.connect(bus); src.start(t); src.stop(t + len + .05);
      if (!inhale) { const o = a.createOscillator(), og = a.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(52, t + len); og.gain.setValueAtTime(.0001, t); og.gain.exponentialRampToValueAtTime(.09 * v, t + .3); og.gain.exponentialRampToValueAtTime(.0001, t + len); o.connect(og); og.connect(bus); o.start(t); o.stop(t + len); } // a growl under the out-breath
    } catch (e) { }
  }
  // a scrape, or a whisper you almost understand
  function whisper(v) {
    if (!on()) return;
    try {
      const a = ctx(), t = a.currentTime, src = a.createBufferSource(), hp = a.createBiquadFilter(), g = a.createGain(), pan = a.createStereoPanner ? a.createStereoPanner() : null;
      src.buffer = noiseBuf(2); hp.type = 'bandpass'; hp.Q.value = 9; hp.frequency.setValueAtTime(2400 + Math.random() * 1800, t);
      for (let k = 0; k < 6; k++) hp.frequency.setValueAtTime(1600 + Math.random() * 3200, t + k * .12);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35 * v, t + .1); g.gain.exponentialRampToValueAtTime(.0001, t + .8);
      src.connect(hp); hp.connect(g);
      if (pan) { pan.pan.value = Math.random() * 2 - 1; g.connect(pan); pan.connect(bus); } else g.connect(bus);
      src.start(t); src.stop(t + .85);
    } catch (e) { }
  }
  // the scream: a cluster of detuned saws bending up and down, run through distortion, with a crack of noise
  function scream() {
    if (!on()) return;
    try {
      const a = ctx(), t = a.currentTime, sh = a.createWaveShaper(), g = a.createGain(); sh.curve = curve(40); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.55, t + .04); g.gain.setValueAtTime(.55, t + .9); g.gain.exponentialRampToValueAtTime(.0001, t + 1.6);
      sh.connect(g); g.connect(bus);
      for (const [f, d] of [[340, 0], [361, 3], [452, -4], [610, 7], [173, 0]]) {
        const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f * .6, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + .18); o.frequency.exponentialRampToValueAtTime(f * .9 + d, t + 1.5);
        const v = a.createOscillator(), vg = a.createGain(); v.frequency.value = 11 + Math.random() * 6; vg.gain.value = f * .05; v.connect(vg); vg.connect(o.frequency); v.start(t); v.stop(t + 1.6);
        o.connect(sh); o.start(t); o.stop(t + 1.6);
      }
      const n = a.createBufferSource(), ng = a.createGain(); n.buffer = noiseBuf(1); ng.gain.setValueAtTime(.8, t); ng.gain.exponentialRampToValueAtTime(.0001, t + .5); n.connect(ng); ng.connect(bus); n.start(t); n.stop(t + .5);
    } catch (e) { }
  }
  // a stinger for the first glimpse: a dissonant cluster that swells and is cut off
  function sting() {
    if (!on()) return;
    try {
      const a = ctx(), t = a.currentTime, g = a.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + .9); g.gain.setValueAtTime(.0001, t + 1.05); g.connect(bus);
      for (const f of [196, 207.7, 277.2, 293.7, 415.3]) { const o = a.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 1.1); }
    } catch (e) { }
  }
  // called every frame of a hunt with how close it is (0 far, 1 on you)
  function tick(dt, v) {
    near = v; startDrone();
    if (drone) { try { const t = ax.currentTime; drone.out.gain.setTargetAtTime(.06 + v * .22, t, .3); drone.lp.frequency.setTargetAtTime(150 + v * 900, t, .3); } catch (e) { } }
    breathT -= dt; if (breathT <= 0) { breathT = 2.6 - v * 1.4; breath(.25 + v * .75, true); setTimeout(() => near > 0 && breath(.25 + near * .75, false), 950); }
    whisperT -= dt; if (whisperT <= 0) { whisperT = 1.6 + Math.random() * 3; whisper(.3 + v * .5); }
  }
  function quiet() { near = 0; stopDrone(); }

  /* ---------- when it gets you ---------- */
  // the dark goes out of it and there's a face an arm's length from yours: your own, dead. Its eyes
  // open. Its mouth opens too far. A flash, the scream, the screen shaking, then black. Then the words.
  async function scare() {
    const P = R3.player, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    R3.freeze(true); quiet();
    const g = face(), fx = Math.sin(P.yaw), fz = Math.cos(P.yaw); P.pitch = 0;
    g.position.set(P.x + fx * .4, P.y + .02, P.z + fz * .4); g.rotation.y = Math.atan2(fx, fz) + Math.PI; g.scale.setScalar(1.1); R3.api.add(g);
    const under = new THREE.PointLight('#ff2a14', 2.4, 2.5, 2); under.position.set(0, -.35, .35); g.add(under); // lit from below, red
    const flick = new THREE.PointLight('#dfe8ff', 0, 2.5, 2); flick.position.set(.3, .3, .5); g.add(flick);
    const { jaw, lids, fh } = g.userData, jaw0 = jaw.position.y;
    const flash = h('div.l2-scare'); document.body.append(flash);
    scream(); if (navigator.vibrate) try { navigator.vibrate([90, 40, 220]); } catch (e) { }
    R3.setFx({ shake: reduce ? 0 : .03, sway: 0, slow: 1 });
    const t0 = performance.now();
    const anim = () => {
      const k = (performance.now() - t0) / 1000;
      lids.forEach(({ lid, y }) => { const o = Math.min(1, Math.max(0, k - .12) * 12); lid.position.y = y + o * fh * .05; lid.scale.y = 1 - o * .85; lid.material.opacity = 1 - o; }); // the eyes snap open
      jaw.position.y = jaw0 - Math.min(1, Math.max(0, k - .22) * 3) * fh * .17; jaw.rotation.x = Math.min(.25, Math.max(0, k - .22)) ; // and the jaw drops, too far
      g.scale.setScalar(1.1 + Math.min(.25, k * .5)); g.rotation.z = Math.sin(k * 23) * .04 * (reduce ? 0 : 1);
      flick.intensity = Math.random() < .3 ? 2.5 : 0;
      if (k < 1.4 && g.parent) requestAnimationFrame(anim);
    };
    anim();
    await new Promise(r => setTimeout(r, 1250));
    flash.classList.add('black');
    await new Promise(r => setTimeout(r, 700));
    if (g.parent) g.parent.remove(g);
    R3.setFx(null);
    flash.classList.add('out'); setTimeout(() => flash.remove(), 600);
    R3.freeze(false);
  }

  return { make, face, tick, quiet, scream, sting, scare };
})();
