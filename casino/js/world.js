/* The overworld: a tile map you walk around Pokémon-style. The town has casinos, food, shops and
   places to sleep; each casino has an interior where you walk up to a dealer to sit down.
   Everything is drawn procedurally on a canvas, so there are no image files. */
const World = (() => {
  const T = 16; // tile size in art pixels
  const G = { GRASS: 0, FLOWERS: 1, TREE: 2, ROAD: 3, WALK: 4, WATER: 5, PLANK: 6, WOOD: 7, CARPET: 8, WALL: 9, HEDGE: 10, SAND: 11, VOID: 12 };
  const SOLID = new Set([G.TREE, G.WATER, G.WALL, G.HEDGE, G.VOID]);
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const hash = (x, y, s = 0) => { let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

  /* ======================= map building ======================= */
  function blank(id, w, h, fill) {
    const m = { id, w, h, tiles: new Uint8Array(w * h).fill(fill), block: new Uint8Array(w * h), buildings: [], props: [], npcs: [], doors: {}, acts: {}, labels: [], areas: [], tables: [] };
    m.at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? G.VOID : m.tiles[y * w + x];
    m.set = (x, y, t) => { if (x >= 0 && y >= 0 && x < w && y < h) m.tiles[y * w + x] = t; };
    m.rect = (x, y, rw, rh, t) => { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) m.set(i, j, t); };
    m.solid = (x, y) => SOLID.has(m.at(x, y)) || (x >= 0 && y >= 0 && x < w && y < h && m.block[y * w + x] === 1);
    m.blockRect = (x, y, rw, rh) => { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (i >= 0 && j >= 0 && i < w && j < h) m.block[j * w + i] = 1; };
    m.act = (x, y, a) => { m.acts[x + ',' + y] = a; };
    return m;
  }

  function buildTown() {
    const m = blank('town', 56, 42, G.GRASS);
    // flowers and trees in the open grass
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (hash(x, y, 1) < 0.08) m.set(x, y, G.FLOWERS);
    m.rect(0, 0, 56, 1, G.TREE); m.rect(0, 41, 56, 1, G.TREE); m.rect(0, 0, 1, 42, G.TREE);
    for (let x = 1; x < 26; x++) for (let y = 1; y < 9; y++) if (hash(x, y, 2) < 0.22) m.set(x, y, G.TREE);
    for (let x = 30; x < 47; x++) for (let y = 1; y < 6; y++) if (hash(x, y, 3) < 0.25) m.set(x, y, G.TREE);
    m.rect(30, 6, 17, 1, G.HEDGE);
    // river and the dock
    m.rect(48, 0, 8, 42, G.WATER); m.rect(47, 0, 1, 42, G.SAND);
    // roads and sidewalks
    m.rect(0, 17, 47, 1, G.WALK); m.rect(0, 18, 44, 2, G.ROAD); m.rect(0, 20, 47, 1, G.WALK);
    m.rect(26, 1, 1, 40, G.WALK); m.rect(27, 1, 2, 40, G.ROAD); m.rect(29, 1, 1, 40, G.WALK);
    m.rect(0, 30, 47, 1, G.WALK); m.rect(0, 31, 47, 2, G.ROAD); m.rect(0, 33, 47, 1, G.WALK);
    m.rect(29, 40, 12, 1, G.WALK);
    m.rect(44, 17, 4, 5, G.PLANK); m.rect(47, 18, 1, 3, G.PLANK);
    // Lucky Park
    m.rect(1, 34, 25, 7, G.GRASS);
    for (let x = 1; x < 26; x++) for (let y = 34; y < 41; y++) if (hash(x, y, 4) < 0.1) m.set(x, y, G.FLOWERS);
    m.rect(3, 37, 21, 1, G.WALK); m.rect(13, 34, 1, 7, G.WALK);
    [[2, 35], [5, 39], [22, 35], [24, 39], [19, 40], [7, 34]].forEach(([x, y]) => m.set(x, y, G.TREE));

    const B = (key, name, x, y, w, h, door, style, action) => {
      m.buildings.push({ key, name, x, y, w, h, door, style });
      m.blockRect(x, y, w, h);
      const dx = x + door, dy = y + h - 1;
      m.block[dy * m.w + dx] = 0;
      m.doors[dx + ',' + dy] = { ...action, out: [dx, dy + 1], label: name };
    };
    B('spur', 'The Rusty Spur', 2, 10, 8, 7, 3, 'spur', { venue: 'spur' });
    B('diner', "Mel's Diner", 11, 12, 6, 5, 2, 'diner', { place: 'diner' });
    B('store', 'Quik-Stop', 18, 12, 6, 5, 2, 'store', { place: 'store' });
    B('palace', 'The Gilded Palace', 31, 7, 10, 10, 4, 'palace', { venue: 'palace' });
    B('salon', 'Monte Royale', 42, 9, 5, 8, 2, 'salon', { venue: 'salon' });
    B('motel', 'Starlite Motel', 2, 23, 7, 7, 3, 'motel', { sleep: ['motel'] });
    B('pawn', "Vinnie's Pawn & Loan", 10, 24, 6, 6, 2, 'pawn', { screen: 'loans' });
    B('shop', 'Lucky Strike Outfitters', 17, 23, 8, 7, 3, 'shop', { screen: 'shop' });
    B('grand', 'Grand Hotel', 31, 22, 7, 8, 3, 'grand', { sleep: ['grand', 'penthouse'] });
    B('apts', 'Downtown Apartments', 39, 23, 5, 7, 2, 'apts', { sleep: ['apartment'] });
    B('steak', 'Prime Cut', 31, 35, 6, 5, 2, 'steak', { place: 'steak' });
    // the riverboat moored at the dock; the gangplank is its door
    m.props.push({ type: 'boat', x: 48, y: 14, w: 7, h: 10 });
    m.doors['47,19'] = { venue: 'riverboat', out: [46, 19], label: "Lucky Lou's Riverboat" };
    // park furniture
    m.props.push({ type: 'fountain', x: 12, y: 36, w: 3, h: 3 }); m.blockRect(12, 36, 3, 3);
    m.rect(13, 36, 1, 3, G.GRASS);
    [[6, 36], [19, 36], [6, 38], [19, 38]].forEach(([x, y]) => { m.props.push({ type: 'bench', x, y }); m.blockRect(x, y, 1, 1); m.act(x, y, { sleep: ['bench'], label: 'Park bench' }); });
    for (let x = 3; x < 46; x += 6) { m.props.push({ type: 'lamp', x, y: 17 }); m.props.push({ type: 'lamp', x, y: 30 }); }
    // signposts
    m.props.push({ type: 'sign', x: 25, y: 16, text: 'OLD TOWN' }); m.blockRect(25, 16, 1, 1);
    m.act(25, 16, { talk: 'Old Town: the Spur, Mel\'s, the motel, and Vinnie. The Strip is north-east, the Riverboat is at the east dock.', label: 'Signpost' });
    m.props.push({ type: 'sign', x: 30, y: 16, text: 'THE STRIP' }); m.blockRect(30, 16, 1, 1);
    m.act(30, 16, { talk: 'The Strip: The Gilded Palace and the Monte Royale. Dress code strictly enforced.', label: 'Signpost' });
    m.areas = [
      { name: 'Old Town', x: 0, y: 0, w: 26, h: 34 }, { name: 'The Strip', x: 29, y: 0, w: 19, h: 17 },
      { name: 'Riverfront', x: 29, y: 17, w: 27, h: 17 }, { name: 'Lucky Park', x: 0, y: 34, w: 26, h: 8 }, { name: 'Steakhouse Row', x: 29, y: 34, w: 19, h: 8 },
    ];
    // townsfolk
    const lines = [
      'They say the Blazing 7s meter at the Spur hasn\'t hit in weeks. Somebody\'s due.',
      'Mel\'s pie is the only sure thing in this town.',
      'Don\'t borrow from Vinnie. Or do. I\'m not your mother.',
      'The Palace craps table pays triple on the twelve. Triple!',
      'If you\'re gonna sleep in the park, sleep with one eye open.',
      'I bought a rabbit\'s foot. Lost forty bucks in ten minutes. Great rabbit.',
      'The Riverboat comps drinks once you\'ve put some action down.',
      'Kessler\'s Salon has no clocks. People go in Tuesday and come out Friday.',
    ];
    const looks = [['#c0392b', '#2c3e50'], ['#8e44ad', '#34495e'], ['#16a085', '#2d3436'], ['#d35400', '#4b3b2a'], ['#2980b9', '#3d3d3d'], ['#f1c40f', '#5d4037']];
    [[8, 17], [21, 20], [33, 20], [15, 30], [40, 33], [10, 37], [29, 12], [44, 19]].forEach(([x, y], i) =>
      m.npcs.push({ x, y, dir: 'down', wander: true, home: [x, y], look: { shirt: looks[i % 6][0], pants: looks[i % 6][1], skin: ['#f0c19a', '#c68863', '#8d5524', '#e0ac69'][i % 4], hair: ['#3a2a1e', '#111', '#a0522d', '#d9c27a'][i % 4] }, line: lines[i % lines.length], name: 'Local' }));
    m.start = [5, 30];
    return m;
  }

  const INTERIOR = {
    spur: { floor: G.WOOD, wall: '#5a3a22', trim: '#2e1d10', carpet: '#8a5a33', accent: '#e74c3c', bar: 'bar_spur', npc: { who: 'dolores', x: 2, y: 6, bartender: true } },
    riverboat: { floor: G.CARPET, wall: '#3b2414', trim: '#c9a14a', carpet: '#7a1d2a', accent: '#f1c40f', bar: 'bar_riverboat', npc: { who: 'doc', x: 5, y: 13 } },
    palace: { floor: G.CARPET, wall: '#d8c38a', trim: '#8a6a24', carpet: '#5e1430', accent: '#f6d88d', bar: 'bar_palace', npc: { who: 'margot', x: 5, y: 14 } },
    salon: { floor: G.CARPET, wall: '#1d1a14', trim: '#c9a14a', carpet: '#15151c', accent: '#c9a14a', bar: 'bar_salon', npc: { who: 'kessler', x: 23, y: 14 } },
  };
  function buildInterior(venueId) {
    const v = VENUES[venueId], I = INTERIOR[venueId];
    const W = 26, H = 17, m = blank('v:' + venueId, W, H, I.floor);
    m.venue = venueId; m.theme = I;
    m.rect(0, 0, W, 2, G.WALL); m.rect(0, 0, 1, H, G.WALL); m.rect(W - 1, 0, 1, H, G.WALL); m.rect(0, H - 1, W, 1, G.WALL);
    const doorX = 13; m.set(doorX, H - 1, G.CARPET === I.floor ? G.CARPET : G.WOOD);
    m.doors[doorX + ',' + (H - 1)] = { exit: venueId, label: 'Exit to the street' };
    // the bar along the left wall
    m.props.push({ type: 'counter', x: 3, y: 4, h: 6 }); m.blockRect(3, 4, 1, 6);
    for (let y = 4; y < 10; y++) m.act(3, y, { place: I.bar, label: PLACES[I.bar].name });
    m.props.push({ type: 'shelf', x: 1, y: 1, w: 3 });
    // slot machines on the right wall
    for (let y = 3; y < 14; y += 1) { m.props.push({ type: 'slot', x: W - 2, y }); m.blockRect(W - 2, y, 1, 1); m.act(W - 2, y, { talk: 'This slot machine holds 12%. Doc would never forgive you.', label: 'Slot machine' }); }
    // tables, 3 x 3 grid
    const cols = [7, 13, 19], rows = [4, 8, 12];
    v.games.forEach((g, i) => {
      const x = cols[i % 3], y = rows[Math.floor(i / 3)];
      m.tables.push({ game: g, x, y, w: 4, h: 2 });
      m.blockRect(x, y, 4, 2);
      for (let j = 0; j < 2; j++) for (let k = 0; k < 4; k++) m.act(x + k, y + j, { table: g, label: GAMES[g].name });
      m.npcs.push({ x: x + 1 + (i % 2), y: y - 1, dir: 'down', dealer: true, look: { shirt: '#f4f4f4', pants: '#111', vest: venueId === 'spur' ? '#7a2131' : '#111', skin: ['#f0c19a', '#c68863', '#8d5524'][i % 3], hair: ['#111', '#3a2a1e', '#a0522d'][i % 3], bow: true }, line: null, table: g });
      if (hash(i, 7, venueId.length) < 0.45) m.npcs.push({ x: x + (hash(i, 9) < 0.5 ? 0 : 3), y: y + 2, dir: 'up', look: { shirt: ['#2980b9', '#8e44ad', '#c0392b', '#16a085'][i % 4], pants: '#2d3436', skin: '#e0ac69', hair: '#3a2a1e' }, line: RNG.pick(['Shh. I\'m counting.', 'Dealer\'s been hot all night.', 'One more hand. Then dinner. Probably.', 'You want my seat? Tough.']), name: 'Gambler' });
    });
    const n = I.npc, ch = CHARACTERS[n.who];
    m.npcs.push({ x: n.x, y: n.y, dir: n.bartender ? 'right' : 'down', look: { shirt: ch.color, pants: '#222', skin: n.who === 'kessler' ? '#e8c4a0' : '#f0c19a', hair: { dolores: '#a0522d', doc: '#ddd', margot: '#111', kessler: '#999' }[n.who], hat: n.who === 'kessler' }, who: n.who, name: ch.name, story: true });
    m.labels.push({ x: W / 2, y: 0.9, text: v.name.toUpperCase(), neon: true });
    m.start = [doorX, H - 2];
    return m;
  }

  /* ======================= static art ======================= */
  function paintTile(c, m, x, y) {
    const t = m.at(x, y), px = x * T, py = y * T, r = (s) => hash(x, y, s);
    const fill = (col, a = 0, b = 0, w = T, h2 = T) => { c.fillStyle = col; c.fillRect(px + a, py + b, w, h2); };
    const theme = m.theme;
    switch (t) {
      case G.GRASS: case G.FLOWERS: case G.TREE: case G.HEDGE: {
        fill('#4f9a45');
        for (let i = 0; i < 4; i++) fill(r(i) < .5 ? '#5fae52' : '#43873b', Math.floor(r(i + 10) * 15), Math.floor(r(i + 20) * 15), 1, 2);
        if (t === G.FLOWERS) for (let i = 0; i < 3; i++) fill(['#ffe26b', '#ff7aa8', '#ffffff'][i], 2 + Math.floor(r(i + 30) * 12), 2 + Math.floor(r(i + 40) * 12), 2, 2);
        if (t === G.TREE) {
          c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(px + 8, py + 14, 6, 2, 0, 0, 7); c.fill();
          fill('#6b4423', 7, 10, 2, 5);
          c.fillStyle = '#2d6b2a'; c.beginPath(); c.arc(px + 8, py + 7, 7, 0, 7); c.fill();
          c.fillStyle = '#3d8a37'; c.beginPath(); c.arc(px + 6, py + 5, 4, 0, 7); c.fill();
          fill('#5cae4f', 4, 3, 2, 1);
        }
        if (t === G.HEDGE) { fill('#2f6e2c', 0, 3, 16, 12); fill('#3d8a37', 0, 3, 16, 3); for (let i = 0; i < 4; i++) fill('#4d9d46', i * 4 + 1, 5, 2, 2); }
        break;
      }
      case G.ROAD: {
        fill('#3a3b44');
        for (let i = 0; i < 3; i++) fill('#44454f', Math.floor(r(i) * 15), Math.floor(r(i + 5) * 15), 1, 1);
        if (m.at(x, y - 1) === G.WALK && m.at(x, y + 1) === G.ROAD && x % 2 === 0) fill('#e8c547', 2, 15, 10, 1);
        if (m.at(x - 1, y) === G.WALK && m.at(x + 1, y) === G.ROAD && y % 2 === 0) fill('#e8c547', 15, 2, 1, 10);
        break;
      }
      case G.WALK: fill('#b9b0a0'); fill('#a39a8a', 0, 15, 16, 1); fill('#a39a8a', 15, 0, 1, 16); if (r(1) < .2) fill('#c8c0b0', 3, 4, 3, 2); break;
      case G.SAND: fill('#d8c28c'); for (let i = 0; i < 3; i++) fill('#c9b07a', Math.floor(r(i) * 15), Math.floor(r(i + 3) * 15), 1, 1); break;
      case G.WATER: fill('#2d6aa8'); for (let i = 0; i < 2; i++) fill('#3b7ec0', Math.floor(r(i) * 12), Math.floor(r(i + 4) * 15), 4, 1); break;
      case G.PLANK: fill('#8a6038'); for (let i = 0; i < 4; i++) fill('#6e4a2a', 0, i * 4 + 3, 16, 1); fill('#5a3a1f', (y % 2) * 8 + 3, 0, 1, 16); break;
      case G.WOOD: fill('#8a5a33'); for (let i = 0; i < 4; i++) fill('#77492a', 0, i * 4 + 3, 16, 1); fill('#6a3f22', ((y * 5) % 16), 0, 1, 16); break;
      case G.CARPET: {
        fill(theme ? theme.carpet : '#7a1d2a');
        const acc = theme ? theme.trim : '#c9a14a';
        if ((x + y) % 2 === 0) { c.fillStyle = acc; c.globalAlpha = .35; c.fillRect(px + 7, py + 3, 2, 2); c.fillRect(px + 3, py + 7, 2, 2); c.fillRect(px + 11, py + 7, 2, 2); c.fillRect(px + 7, py + 11, 2, 2); c.globalAlpha = 1; }
        break;
      }
      case G.WALL: {
        const col = theme ? theme.wall : '#555', trim = theme ? theme.trim : '#333';
        fill(col);
        if (y === 1 && m.at(x, y + 1) !== G.WALL) { fill(trim, 0, 13, 16, 3); fill('rgba(255,255,255,.08)', 0, 0, 16, 2); if (x % 4 === 0) fill(trim, 7, 0, 2, 13); }
        else if (y >= 2) { fill(trim, 0, 0, 16, 1); fill('rgba(0,0,0,.25)'); }
        break;
      }
      default: fill('#000');
    }
  }

  function paintBuilding(c, b) {
    const S = {
      spur: { wall: '#8b5a2b', roof: '#5b2c16', trim: '#d9a066', sign: '#e74c3c' },
      diner: { wall: '#e8e2d0', roof: '#c0392b', trim: '#2c3e50', sign: '#e74c3c' },
      store: { wall: '#dfe6e9', roof: '#2980b9', trim: '#2d3436', sign: '#27ae60' },
      palace: { wall: '#f1e3b5', roof: '#b8862b', trim: '#8a6a24', sign: '#f6d88d' },
      salon: { wall: '#1d1a14', roof: '#0c0a08', trim: '#c9a14a', sign: '#c9a14a' },
      motel: { wall: '#e4c99a', roof: '#6b7b8c', trim: '#7a5230', sign: '#ff5fa2' },
      pawn: { wall: '#9a8c78', roof: '#4a4a4a', trim: '#2d2d2d', sign: '#f1c40f' },
      shop: { wall: '#f5e6d3', roof: '#16a085', trim: '#0e5e4e', sign: '#f39c12' },
      grand: { wall: '#d4d0c8', roof: '#5d6d7e', trim: '#8a6a24', sign: '#f6d88d' },
      apts: { wall: '#b07d62', roof: '#5d4037', trim: '#3e2723', sign: '#bdc3c7' },
      steak: { wall: '#4e342e', roof: '#212121', trim: '#c9a14a', sign: '#e67e22' },
    }[b.style];
    const px = b.x * T, py = b.y * T, w = b.w * T, hgt = b.h * T, roofH = Math.max(2, Math.round(b.h * 0.42)) * T;
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(px + 3, py + 4, w, hgt);
    // roof
    c.fillStyle = S.roof; c.fillRect(px, py, w, roofH);
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < roofH; i += 4) c.fillRect(px, py + i, w, 1);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(px, py + roofH - 2, w, 2);
    // facade
    c.fillStyle = S.wall; c.fillRect(px, py + roofH, w, hgt - roofH);
    c.fillStyle = S.trim; c.fillRect(px, py + roofH, w, 2); c.fillRect(px, py + hgt - 2, w, 2);
    // sign board
    c.fillStyle = '#111'; c.fillRect(px + 6, py + roofH + 4, w - 12, 9);
    c.fillStyle = S.sign; c.fillRect(px + 7, py + roofH + 5, w - 14, 1);
    // windows
    const doorPx = px + b.door * T;
    for (let wx = px + 4; wx < px + w - 10; wx += 14) {
      if (wx + 10 > doorPx - 2 && wx < doorPx + T + 2) continue;
      const wy = py + roofH + 18; if (wy + 10 > py + hgt - 3) continue;
      c.fillStyle = S.trim; c.fillRect(wx - 1, wy - 1, 12, 11);
      c.fillStyle = b.style === 'salon' ? '#3a2f10' : '#9fd3f0'; c.fillRect(wx, wy, 10, 9);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(wx + 1, wy + 1, 3, 2);
    }
    // door with awning
    const dy = py + hgt - T;
    c.fillStyle = S.trim; c.fillRect(doorPx + 1, dy - 1, T - 2, T + 1);
    c.fillStyle = ['palace', 'grand', 'salon'].includes(b.style) ? '#6b4a12' : '#3b2414'; c.fillRect(doorPx + 3, dy + 1, T - 6, T - 1);
    c.fillStyle = '#f6d88d'; c.fillRect(doorPx + T - 6, dy + 8, 1, 2);
    c.fillStyle = S.sign; c.fillRect(doorPx - 2, dy - 4, T + 4, 3);
    if (b.style === 'palace') { c.fillStyle = '#fff8dc'; for (let i = 0; i < 4; i++) c.fillRect(px + 8 + i * ((w - 20) / 3), py + roofH + 16, 4, hgt - roofH - 18); }
  }

  function paintBoat(c, p) {
    const px = p.x * T, py = p.y * T, w = p.w * T, hh = p.h * T;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(px + 6, py + 10, w - 4, hh - 6);
    c.fillStyle = '#f4f1ea'; c.fillRect(px + 4, py + 18, w - 10, hh - 26);
    c.fillStyle = '#b3122b'; c.fillRect(px + 4, py + hh - 14, w - 10, 6);
    c.fillStyle = '#e8e2d0'; c.fillRect(px + 12, py + 30, w - 28, hh - 60);
    c.fillStyle = '#c9a14a'; for (let i = 0; i < 5; i++) c.fillRect(px + 16, py + 38 + i * 18, w - 36, 2);
    c.fillStyle = '#1b2631'; c.fillRect(px + 24, py + 2, 8, 30); c.fillRect(px + 46, py + 2, 8, 30);
    c.fillStyle = '#c9a14a'; c.fillRect(px + 22, py + 2, 12, 3); c.fillRect(px + 44, py + 2, 12, 3);
    c.fillStyle = '#b3122b'; c.fillRect(px + 10, py + hh - 6, w - 22, 8);
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#7a0c1c' : '#c0392b'; c.fillRect(px + 12 + i * 12, py + hh - 4, 6, 10); }
    // gangplank
    c.fillStyle = '#8a6038'; c.fillRect(px - 2, py + 5 * T + 2, 10, 12);
  }

  function paintProp(c, p) {
    const px = p.x * T, py = p.y * T;
    if (p.type === 'fountain') {
      c.fillStyle = '#9e9e9e'; c.beginPath(); c.arc(px + 24, py + 24, 22, 0, 7); c.fill();
      c.fillStyle = '#3b7ec0'; c.beginPath(); c.arc(px + 24, py + 24, 17, 0, 7); c.fill();
      c.fillStyle = '#bdbdbd'; c.fillRect(px + 21, py + 14, 6, 14);
    } else if (p.type === 'bench') {
      c.fillStyle = '#6b4423'; c.fillRect(px + 1, py + 6, 14, 3); c.fillRect(px + 1, py + 10, 14, 3);
      c.fillStyle = '#333'; c.fillRect(px + 2, py + 13, 2, 3); c.fillRect(px + 12, py + 13, 2, 3);
    } else if (p.type === 'lamp') {
      c.fillStyle = '#2d2d2d'; c.fillRect(px + 7, py + 2, 2, 12); c.fillRect(px + 5, py + 13, 6, 2);
      c.fillStyle = '#ffe08a'; c.fillRect(px + 5, py, 6, 4);
    } else if (p.type === 'sign') {
      c.fillStyle = '#6b4423'; c.fillRect(px + 7, py + 8, 2, 8);
      c.fillStyle = '#a0522d'; c.fillRect(px + 1, py + 2, 14, 8); c.fillStyle = '#f3e0b5'; c.fillRect(px + 3, py + 4, 10, 1); c.fillRect(px + 3, py + 7, 8, 1);
    } else if (p.type === 'counter') {
      c.fillStyle = '#4a2a14'; c.fillRect(px, py, T, p.h * T); c.fillStyle = '#7a4a24'; c.fillRect(px + 2, py, T - 4, p.h * T);
      c.fillStyle = '#c9a14a'; c.fillRect(px + 2, py, 1, p.h * T);
      for (let i = 0; i < p.h; i++) { c.fillStyle = ['#d35400', '#27ae60', '#f1c40f'][i % 3]; c.fillRect(px + 6, py + i * T + 5, 3, 5); }
    } else if (p.type === 'shelf') {
      for (let i = 0; i < p.w * 4; i++) { c.fillStyle = ['#27ae60', '#c0392b', '#f1c40f', '#8e44ad', '#ecf0f1'][i % 5]; c.fillRect(px + 2 + i * 4, py + 8 + (i % 2), 2, 6); }
      c.fillStyle = '#3b2414'; c.fillRect(px, py + 14, p.w * T, 2);
    } else if (p.type === 'slot') {
      c.fillStyle = '#2c2c34'; c.fillRect(px + 2, py, 12, 15); c.fillStyle = '#c9a14a'; c.fillRect(px + 2, py, 12, 2);
      c.fillStyle = '#111'; c.fillRect(px + 4, py + 4, 8, 5); c.fillStyle = '#b3122b'; c.fillRect(px + 3, py + 11, 10, 2);
    }
  }

  function paintTable(c, tb) {
    const px = tb.x * T, py = tb.y * T, w = tb.w * T, hh = tb.h * T;
    const felt = { green: '#16703f', blue: '#1b4f8a', red: '#8a1c2b', black: '#1a1a1a' }[App.state.equipped.felt] || '#16703f';
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(px + 2, py + 4, w, hh);
    if (tb.game === 'craps') {
      c.fillStyle = '#4a2a14'; c.fillRect(px - 2, py - 2, w + 4, hh + 4);
      c.fillStyle = felt; c.fillRect(px + 2, py + 2, w - 4, hh - 4);
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(px + 6, py + 6, w - 12, 1); c.fillRect(px + 6, py + hh - 8, w - 12, 1); c.fillRect(px + w / 2, py + 6, 1, hh - 14);
      c.fillStyle = '#fff'; c.fillRect(px + 20, py + 12, 4, 4); c.fillRect(px + 27, py + 14, 4, 4);
    } else if (tb.game === 'roulette') {
      c.fillStyle = '#4a2a14'; c.fillRect(px - 1, py - 1, w + 2, hh + 2);
      c.fillStyle = felt; c.fillRect(px + 1, py + 1, w - 2, hh - 2);
      c.fillStyle = '#5a3a1a'; c.beginPath(); c.arc(px + 12, py + 16, 11, 0, 7); c.fill();
      for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? '#b3122b' : '#111'; c.beginPath(); c.moveTo(px + 12, py + 16); c.arc(px + 12, py + 16, 9, i * Math.PI / 6, (i + 1) * Math.PI / 6); c.fill(); }
      c.fillStyle = '#c9a14a'; c.beginPath(); c.arc(px + 12, py + 16, 3, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 4; i++) c.fillRect(px + 28 + i * 8, py + 6, 1, 20); c.fillRect(px + 28, py + 6, 32, 1); c.fillRect(px + 28, py + 26, 32, 1);
    } else {
      c.fillStyle = '#4a2a14'; c.beginPath(); c.moveTo(px - 2, py - 1); c.lineTo(px + w + 2, py - 1); c.lineTo(px + w + 2, py + 8); c.quadraticCurveTo(px + w / 2, py + hh + 12, px - 2, py + 8); c.closePath(); c.fill();
      c.fillStyle = felt; c.beginPath(); c.moveTo(px + 2, py + 2); c.lineTo(px + w - 2, py + 2); c.lineTo(px + w - 2, py + 8); c.quadraticCurveTo(px + w / 2, py + hh + 6, px + 2, py + 8); c.closePath(); c.fill();
      c.fillStyle = '#2b2b2b'; c.fillRect(px + w / 2 - 10, py + 2, 20, 4);
      for (let i = 0; i < 4; i++) { c.fillStyle = ['#c8102e', '#138a3e', '#151515', '#f2f2f2'][i]; c.fillRect(px + w / 2 - 9 + i * 5, py + 3, 3, 2); }
      c.fillStyle = '#fbf8f1'; c.fillRect(px + 22, py + 12, 5, 7); c.fillRect(px + 30, py + 12, 5, 7); c.fillRect(px + 38, py + 12, 5, 7);
      c.fillStyle = 'rgba(255,230,160,.5)'; c.fillRect(px + 10, py + 20, 6, 1); c.fillRect(px + 48, py + 20, 6, 1);
    }
  }

  function prerender(m) {
    const cv = document.createElement('canvas'); cv.width = m.w * T; cv.height = m.h * T;
    const c = cv.getContext('2d');
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) paintTile(c, m, x, y);
    // draw trees again so canopies overlap neighbouring tiles nicely
    m.buildings.forEach(b => paintBuilding(c, b));
    m.props.forEach(p => p.type === 'boat' ? paintBoat(c, p) : paintProp(c, p));
    m.tables.forEach(tb => paintTable(c, tb));
    m.canvas = cv;
  }

  /* ======================= sprites ======================= */
  function playerLook() {
    const it = k => App.has(k);
    return {
      shirt: it('tux') ? '#111' : it('suit') ? '#2f3e5c' : it('blazer') ? '#6b4f3a' : '#4a7a46',
      pants: it('tux') ? '#111' : it('suit') ? '#25314a' : '#3b4a6b',
      skin: '#f0c19a', hair: '#3a2a1e', hat: it('fedora'), shades: it('shades'), chain: it('chain'), bow: it('tux'), tie: it('suit') && !it('tux'),
    };
  }
  // 16x16 pixel person; u = screen pixels per art pixel
  function drawPerson(c, sx, sy, u, dir, frame, L) {
    const p = (x, y, w, hh, col) => { c.fillStyle = col; c.fillRect(Math.round(sx + x * u), Math.round(sy + y * u), Math.ceil(w * u), Math.ceil(hh * u)); };
    c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(sx + 8 * u, sy + 15 * u, 5 * u, 1.6 * u, 0, 0, 7); c.fill();
    const step = frame % 2 ? 1 : 0, side = dir === 'left' || dir === 'right';
    // legs
    if (side) { p(6, 11, 2, 4 - step, L.pants); p(9, 11, 2, 3 + step, L.pants); p(6, 15 - step, 2, 1, '#222'); p(9, 14 + step, 2, 1, '#222'); }
    else { p(5, 11, 2, frame % 2 ? 3 : 4, L.pants); p(9, 11, 2, frame % 2 ? 4 : 3, L.pants); p(5, 14, 2, 1, '#222'); p(9, 14, 2, 1, '#222'); }
    // body + arms
    p(4, 7, 8, 5, L.shirt);
    if (L.vest) p(5, 7, 6, 5, L.vest);
    if (dir === 'down') { p(7, 7, 2, 2, '#f4f4f4'); if (L.tie) p(7.5, 8, 1, 3, '#a3242e'); if (L.bow) p(6.5, 7, 3, 1, '#111'); if (L.chain) p(5, 9, 6, 1, '#f5c542'); }
    if (!side) { p(3, 7.5, 1.5, 4, L.shirt); p(11.5, 7.5, 1.5, 4, L.shirt); p(3, 11, 1.5, 1.2, L.skin); p(11.5, 11, 1.5, 1.2, L.skin); }
    else p(dir === 'left' ? 6 : 8, 8, 2, 4, L.shirt);
    // head
    p(4, 1, 8, 7, L.skin);
    if (dir === 'up') p(4, 1, 8, 6, L.hair);
    else {
      p(4, 1, 8, 2, L.hair);
      if (side) { p(dir === 'left' ? 9 : 4, 1, 3, 4, L.hair); p(dir === 'left' ? 5 : 10, 4, 1, 1, '#222'); }
      else { p(4, 1, 1, 4, L.hair); p(11, 1, 1, 4, L.hair); p(6, 4, 1, 1, '#222'); p(9, 4, 1, 1, '#222'); }
      if (L.shades && !side) { p(5, 3.6, 2.5, 1.4, '#111'); p(8.5, 3.6, 2.5, 1.4, '#111'); p(7.5, 4, 1, .5, '#111'); }
      if (L.shades && side) p(dir === 'left' ? 4 : 9, 3.6, 3, 1.4, '#111');
    }
    if (L.hat) { p(2.5, 1, 11, 1.2, '#3b2f2a'); p(4.5, -1.5, 7, 2.6, '#4b3b33'); p(4.5, .2, 7, .8, '#1d1715'); }
  }

  /* ======================= runtime ======================= */
  const maps = {};
  function getMap(id) {
    if (!maps[id]) { maps[id] = id === 'town' ? buildTown() : buildInterior(id.slice(2)); prerender(maps[id]); }
    return maps[id];
  }
  let S = null; // live state while the world screen is up

  function mount(main) {
    const st = App.state, w = st.world;
    const root = h('div.world',
      h('canvas.world-cv'),
      h('div.w-top',
        h('button.w-goal', { onclick: () => Router.go('status') }),
        h('div.w-area')),
      h('div.w-prompt', { onclick: () => interact() }),
      h('div.pad', ['up', 'left', 'right', 'down'].map(d => h('button.pad-' + d, { 'aria-label': d, 'data-dir': d }, { up: '▲', down: '▼', left: '◀', right: '▶' }[d]))),
      h('div.ab', h('button.ab-b', { 'aria-label': 'Run' }, 'B'), h('button.ab-a', { 'aria-label': 'Interact' }, 'A')),
      h('div.w-fade'));
    main.append(root);
    const cv = root.querySelector('canvas');
    const m = getMap(w.map);
    populate(m);
    if (m.solid(w.x, w.y) && !m.doors[w.x + ',' + w.y]) [w.x, w.y] = m.start;
    S = { root, cv, c: cv.getContext('2d'), m, p: { x: w.x, y: w.y, dir: w.dir || 'down', fx: w.x, fy: w.y, moving: null, frame: 0 }, keys: new Set(), run: false, area: null, lastStep: 0, steps: 0, raf: 0, busy: false };
    resize();
    bindInput();
    updateGoal();
    showArea(true);
    S.raf = requestAnimationFrame(loop);
  }
  function unmount() {
    if (!S) return;
    cancelAnimationFrame(S.raf);
    window.removeEventListener('keydown', S.kd); window.removeEventListener('keyup', S.ku); window.removeEventListener('resize', S.rs);
    savePos(); S = null;
  }
  function savePos() { if (!S) return; Object.assign(App.state.world, { map: S.m.id, x: S.p.x, y: S.p.y, dir: S.p.dir }); }

  function resize() {
    const r = S.root.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    S.cv.width = Math.round(r.width * dpr); S.cv.height = Math.round(r.height * dpr);
    S.cv.style.width = r.width + 'px'; S.cv.style.height = r.height + 'px';
    const css = Math.max(2, Math.floor(Math.min(r.width / (16 * 18), r.height / (16 * 12))));
    S.u = css * dpr; S.dpr = dpr;
  }

  function bindInput() {
    const map = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    S.kd = e => {
      if (document.querySelector('.modal-bg') || e.target.matches('input,select,textarea')) return;
      if (map[e.key]) { S.keys.add(map[e.key]); S.lastDir = map[e.key]; e.preventDefault(); }
      else if ([' ', 'Enter', 'e', 'E', 'z', 'Z'].includes(e.key)) { e.preventDefault(); if (!e.repeat) interact(); }
      else if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') S.run = true;
    };
    S.ku = e => { if (map[e.key]) S.keys.delete(map[e.key]); if (e.key === 'Shift' || e.key === 'x' || e.key === 'X') S.run = false; };
    S.rs = () => resize();
    window.addEventListener('keydown', S.kd); window.addEventListener('keyup', S.ku); window.addEventListener('resize', S.rs);
    S.root.querySelectorAll('.pad button').forEach(b => {
      const d = b.dataset.dir;
      const on = e => { e.preventDefault(); S.keys.add(d); S.lastDir = d; b.classList.add('on'); };
      const off = () => { S.keys.delete(d); b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
    const A = S.root.querySelector('.ab-a'), Bb = S.root.querySelector('.ab-b');
    A.addEventListener('pointerdown', e => { e.preventDefault(); interact(); });
    Bb.addEventListener('pointerdown', e => { e.preventDefault(); S.run = true; Bb.classList.add('on'); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => Bb.addEventListener(ev, () => { S.run = false; Bb.classList.remove('on'); }));
    S.root.querySelector('canvas').addEventListener('contextmenu', e => e.preventDefault());
  }

  // story characters and rivals move around with the story and the day, so refresh them on entry
  function populate(m) { m.npcs = m.npcs.filter(n => !n.dyn).concat(Cast.forMap(m)); }
  function npcAt(m, x, y) { return m.npcs.find(n => n.x === x && n.y === y); }
  function passable(m, x, y) { return !m.solid(x, y) && !npcAt(m, x, y); }

  function tryMove(now) {
    const p = S.p;
    const held = S.keys.has(S.lastDir) ? S.lastDir : [...S.keys][0];
    if (!held) return;
    if (p.dir !== held) { p.dir = held; S.turnAt = now; return; }
    if (S.turnAt && now - S.turnAt < 70) return;
    const [dx, dy] = DIRS[held], nx = p.x + dx, ny = p.y + dy;
    if (!passable(S.m, nx, ny)) return;
    p.moving = { fx: p.x, fy: p.y, tx: nx, ty: ny, t0: now, dur: S.run ? 95 : 165 };
    p.x = nx; p.y = ny;
  }

  async function arrive() {
    const p = S.p, m = S.m;
    S.steps++;
    Career.drain('step', S.run ? 1.5 : 1);
    if (S.steps % 15 === 0) { savePos(); App.save(); }
    showArea();
    const door = m.doors[p.x + ',' + p.y];
    if (door) { await useDoor(door); return; }
    if (Career.needsOn() && App.state.stamina <= 0) { S.busy = true; await Career.passOut(); }
  }

  // leave the player on the tile outside a door after using it
  function stepOut(door) {
    if (door.out) { S.p.x = door.out[0]; S.p.y = door.out[1]; S.p.dir = 'down'; }
    savePos();
  }

  async function useDoor(door) {
    S.busy = true; S.keys.clear();
    try {
      if (door.venue) {
        const id = door.venue;
        if (!Career.venueOpen(id) && !Career.tryUnlock(id)) {
          stepOut(door);
          const v = VENUES[id], reqs = Career.venueReqs(id);
          await UI.modal({ title: `${v.icon} ${v.name}`, body: h('div', h('p', v.tag), h('p', 'The doorman stops you. To get in:'), h('ul.reqs', reqs.map(([t, ok]) => h('li' + (ok ? '.ok' : ''), (ok ? '✔ ' : '✘ ') + t)))) });
          return;
        }
        App.state.venue = id;
        App.state.world.returnTo = door.out;
        await go('v:' + id);
        await Career.enterVenue(id);
        return;
      }
      if (door.exit) {
        const town = getMap('town');
        const back = App.state.world.returnTo || Object.values(town.doors).find(d => d.venue === door.exit).out;
        await go('town', back[0], back[1], 'down');
        return;
      }
      stepOut(door);
      if (door.place) await foodMenu(door.place);
      else if (door.sleep) await sleepMenu(door.sleep, door.label);
      else if (door.screen) { savePos(); App.save(); Router.go(door.screen); return; }
    } finally { if (S) S.busy = false; }
  }

  async function go(mapId, x, y, dir) {
    const fade = S.root.querySelector('.w-fade');
    fade.classList.add('on'); await new Promise(r => setTimeout(r, 180));
    const m = getMap(mapId);
    populate(m);
    S.m = m; S.p.x = x != null ? x : m.start[0]; S.p.y = y != null ? y : m.start[1]; S.p.dir = dir || 'up'; S.p.moving = null;
    savePos(); App.save(); updateGoal(); showArea(true);
    fade.classList.remove('on');
  }

  function facing() {
    const p = S.p, [dx, dy] = DIRS[p.dir], fx = p.x + dx, fy = p.y + dy, m = S.m;
    const n = npcAt(m, fx, fy);
    if (n && n.table) return { kind: 'table', game: n.table, label: GAMES[n.table].name };
    if (n) return { kind: 'npc', npc: n, label: n.name || 'Talk' };
    const a = m.acts[fx + ',' + fy];
    if (a) return { kind: a.table ? 'table' : 'act', ...a, game: a.table };
    const d = m.doors[fx + ',' + fy];
    if (d) return { kind: 'door', door: d, label: d.label };
    return null;
  }

  async function interact() {
    if (!S || S.busy || S.p.moving || document.querySelector('.modal-bg')) return;
    const f = facing(); if (!f) return;
    S.busy = true; S.keys.clear();
    try {
      if (f.kind === 'table') {
        const why = Career.canPlay(); if (why) { UI.toast(why, 'warn'); return; }
        savePos(); App.save(); Router.openTable(f.game); return;
      }
      if (f.kind === 'door') { await useDoor(f.door); return; }
      if (f.kind === 'npc') {
        const n = f.npc;
        const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[S.p.dir];
        if (!n.dealer) n.dir = back;
        if (n.who) await Chat.open(n.who);
        else await UI.dialog([{ who: 'narrator', text: `**${n.name}:** "${n.line}"` }]);
        return;
      }
      if (f.place) await foodMenu(f.place);
      else if (f.sleep) await sleepMenu(f.sleep, f.label);
      else if (f.talk) await UI.dialog([{ who: 'narrator', text: f.talk }]);
    } finally { if (S) S.busy = false; }
  }

  /* ---------- menus ---------- */
  function needBars() {
    const st = App.state;
    if (!Career.needsOn()) return h('p.muted.small', 'Free Play: no hunger, thirst or tiredness.');
    const bar = (icon, v, max) => h('div.need', h('span', icon), h('div.bar', h('i', { style: { width: clamp(v / max, 0, 1) * 100 + '%' } })), h('em', Math.round(v)));
    return h('div.needs', bar('🍔', st.hunger, 100), bar('💧', st.thirst, 100), bar('⚡', st.stamina, st.staminaMax));
  }
  function foodMenu(placeId) {
    const P = PLACES[placeId];
    const body = h('div');
    const render = () => {
      body.innerHTML = '';
      const comp = P.comp && P.venue && App.state.today.wagered >= VENUES[P.venue].limits.min * 20;
      body.append(h('p', h('i', `"${P.line}"`)), needBars());
      if (P.comp) body.append(h('p.muted.small', comp ? '🎟️ You\'ve been playing: drinks are comped.' : `Drinks are comped once you've wagered ${fmt(VENUES[P.venue].limits.min * 20)} here today.`));
      const list = h('div.menu-list');
      for (const id of P.items) {
        const it = MENU[id], free = Career.isComped(P, it);
        const tags = [it.hunger && `🍔+${it.hunger}`, it.thirst && `💧+${it.thirst}`, it.energy && `⚡${it.energy > 0 ? '+' : ''}${it.energy}`].filter(Boolean);
        list.append(h('div.menu-row', h('span.mi', it.icon), h('div.mn', h('b', it.name), h('small', tags.join('  '))),
          h('button.btn.sm' + (free ? '.primary' : ''), { disabled: !free && App.state.bank < it.price, onclick: () => { if (Career.consume(id, placeId)) render(); } }, free ? 'Free' : fmt(it.price))));
      }
      if (P.npc) list.append(h('div.menu-row', h('span.mi', CHARACTERS[P.npc].face), h('div.mn', h('b', `Talk to ${CHARACTERS[P.npc].name.split(',')[0]}`), h('small', 'Catch up, ask for advice, or ask if there\'s any work')),
        h('button.btn.sm', { onclick: () => { pop.close(); Chat.open(P.npc); } }, 'Talk')));
      if (P.job) list.append(h('div.menu-row', h('span.mi', '🧽'), h('div.mn', h('b', 'Work a shift washing glasses'), h('small', `Earn ${fmt(120 + App.state.chapter * 80)} · ⚡−40 🍔−15 💧−15`)),
        h('button.btn.sm', { onclick: async () => { await Career.oddJob(); render(); } }, 'Work')));
      body.append(list);
    };
    render();
    const pop = UI.modal({ title: `${P.icon} ${P.name}`, body });
    return pop;
  }
  function sleepMenu(options, label) {
    const st = App.state;
    const body = h('div', needBars());
    const list = h('div.menu-list'); body.append(list);
    let any = false;
    for (const id of options) {
      const L = LODGING[id];
      if (L.item && !App.has(L.item)) {
        list.append(h('div.menu-row.dim', h('span.mi', L.icon), h('div.mn', h('b', L.name), h('small', `You don't own one yet. Buy the ${ITEMS[L.item].name} at Lucky Strike Outfitters.`))));
        continue;
      }
      any = true;
      list.append(h('div.menu-row', h('span.mi', L.icon), h('div.mn', h('b', L.name), h('small', L.text)),
        h('button.btn.sm.primary', { disabled: L.cost > st.bank, onclick: async () => { pop.close(); await Career.sleep(id); } }, L.cost ? `Sleep · ${fmt(L.cost)}` : 'Sleep')));
    }
    if (!any) body.append(h('p.muted.small', 'Nowhere to sleep here yet.'));
    body.append(h('p.muted.small', `Sleeping ends day ${st.day}: loan interest compounds, rent is due, and your players club pays out.`));
    const pop = UI.modal({ title: `🛏️ ${label}`, body });
    return pop;
  }

  /* ---------- HUD bits ---------- */
  function updateGoal() {
    if (!S) return;
    const st = App.state, ch = CHAPTERS[st.chapter], el = S.root.querySelector('.w-goal');
    el.textContent = st.mode === 'career' && ch ? `📖 ${ch.title}` : '🎲 Free Play';
    el.title = ch ? ch.goalText : '';
  }
  function areaName() {
    const m = S.m, p = S.p;
    if (m.venue) return VENUES[m.venue].name;
    const a = m.areas.find(a => p.x >= a.x && p.x < a.x + a.w && p.y >= a.y && p.y < a.y + a.h);
    return a ? a.name : '';
  }
  function showArea(force) {
    const n = areaName();
    if (n === S.area && !force) return;
    S.area = n;
    const el = S.root.querySelector('.w-area'); el.textContent = n;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }

  /* ---------- frame loop ---------- */
  function wander(m, now) {
    for (const n of m.npcs) {
      if (!n.wander) continue;
      if (n.moving) { const k = (now - n.moving.t0) / 260; if (k >= 1) n.moving = null; continue; }
      if (!n.next) n.next = now + 800 + Math.random() * 2500;
      if (now < n.next) continue;
      n.next = 0;
      const d = RNG.pick(Object.keys(DIRS)), [dx, dy] = DIRS[d], nx = n.x + dx, ny = n.y + dy;
      n.dir = d;
      if (Math.abs(nx - n.home[0]) + Math.abs(ny - n.home[1]) > 4) continue;
      const t = m.at(nx, ny);
      if (m.solid(nx, ny) || npcAt(m, nx, ny) || (nx === S.p.x && ny === S.p.y) || m.doors[nx + ',' + ny] || ![G.WALK, G.GRASS, G.FLOWERS, G.PLANK].includes(t)) continue;
      n.moving = { fx: n.x, fy: n.y, t0: now }; n.x = nx; n.y = ny;
    }
  }

  function loop(now) {
    if (!S) return;
    S.raf = requestAnimationFrame(loop);
    const p = S.p, m = S.m;
    if (p.moving) {
      const k = Math.min(1, (now - p.moving.t0) / p.moving.dur);
      p.fx = p.moving.fx + (p.moving.tx - p.moving.fx) * k; p.fy = p.moving.fy + (p.moving.ty - p.moving.fy) * k;
      p.frame = Math.floor(now / 120);
      if (k >= 1) { p.moving = null; p.fx = p.x; p.fy = p.y; arrive().then(() => { }); }
    } else if (!S.busy && !document.querySelector('.modal-bg')) tryMove(now);
    if (!p.moving) { p.fx = p.x; p.fy = p.y; }
    wander(m, now);
    draw(now);
    const f = !p.moving && !S.busy ? facing() : null;
    const pr = S.root.querySelector('.w-prompt');
    const txt = f ? (f.kind === 'table' ? `${GAMES[f.game].icon} ${f.label} · ${fmt(VENUES[m.venue].limits.min)}–${fmt(VENUES[m.venue].limits.max, { short: true })}` : f.label) : '';
    if (pr.dataset.t !== txt) { pr.dataset.t = txt; pr.innerHTML = ''; if (txt) pr.append(h('span', txt), h('kbd', 'A')); pr.classList.toggle('show', !!txt); }
  }

  function draw(now) {
    const { c, cv, m, p, u } = S, TS = T * u;
    c.imageSmoothingEnabled = false;
    c.fillStyle = m.venue ? '#000' : '#2d6aa8'; c.fillRect(0, 0, cv.width, cv.height);
    // camera centred on the player, clamped to the map
    const vw = cv.width / TS, vh = cv.height / TS;
    let cx = p.fx + 0.5 - vw / 2, cy = p.fy + 0.5 - vh / 2;
    cx = m.w <= vw ? (m.w - vw) / 2 : clamp(cx, 0, m.w - vw);
    cy = m.h <= vh ? (m.h - vh) / 2 : clamp(cy, 0, m.h - vh);
    const ox = -cx * TS, oy = -cy * TS;
    c.drawImage(m.canvas, Math.round(ox), Math.round(oy), m.w * TS, m.h * TS);
    const sx = x => ox + x * TS, sy = y => oy + y * TS;
    // animated bits
    const blink = Math.floor(now / 400) % 2;
    for (const b of m.buildings) if (['spur', 'palace', 'salon', 'motel'].includes(b.style)) {
      const roofH = Math.max(2, Math.round(b.h * 0.42));
      for (let i = 0; i < b.w * 2; i++) { c.fillStyle = (i + blink) % 2 ? '#fff3b0' : '#e0a030'; c.fillRect(sx(b.x + i / 2 + .2), sy(b.y + roofH) - 2 * u, 2 * u, 2 * u); }
    }
    if (m.id === 'town') { // water glints
      for (let i = 0; i < 18; i++) { const wx = 48 + ((i * 7 + Math.floor(now / 900)) % 8), wy = (i * 5 + Math.floor(now / 1300)) % 42; c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(sx(wx) + 3 * u, sy(wy) + 6 * u, 5 * u, u); }
      const smoke = (now / 40) % 30; c.fillStyle = 'rgba(220,220,220,.5)'; c.beginPath(); c.arc(sx(49.7), sy(14) - smoke * u, (3 + smoke / 6) * u, 0, 7); c.fill();
    }
    for (const pr of m.props) if (pr.type === 'slot') { c.fillStyle = ['#ff4d4d', '#ffe066', '#4dff88'][(Math.floor(now / 250) + pr.y) % 3]; c.fillRect(sx(pr.x) + 5 * u, sy(pr.y) + 5 * u, 6 * u, 3 * u); }
    // people, sorted by row so overlaps look right
    const people = m.npcs.map(n => {
      let fx = n.x, fy = n.y, fr = 0;
      if (n.moving) { const k = Math.min(1, (now - n.moving.t0) / 260); fx = n.moving.fx + (n.x - n.moving.fx) * k; fy = n.moving.fy + (n.y - n.moving.fy) * k; fr = Math.floor(now / 130); }
      return { fx, fy, dir: n.dir, fr, look: n.look, story: n.story, rival: n.rival };
    });
    people.push({ fx: p.fx, fy: p.fy, dir: p.dir, fr: p.moving ? p.frame : 0, look: playerLook(), me: true });
    people.sort((a, b) => a.fy - b.fy);
    for (const q of people) {
      drawPerson(c, sx(q.fx), sy(q.fy) - 3 * u, u, q.dir, q.fr, q.look);
      if (q.rival) { c.fillStyle = '#ff6b6b'; c.font = `bold ${6 * u}px sans-serif`; c.textAlign = 'center'; c.fillText('♦', sx(q.fx + .5), sy(q.fy) - 4 * u + Math.sin(now / 260) * u); }
      if (q.story) { c.fillStyle = '#ffe066'; c.font = `bold ${7 * u}px sans-serif`; c.textAlign = 'center'; c.fillText('!', sx(q.fx + .5), sy(q.fy) - 4 * u + Math.sin(now / 200) * u); }
    }
    // signs and labels (crisp text at screen resolution)
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const fs = Math.max(9 * S.dpr, 3.6 * u);
    for (const b of m.buildings) {
      const roofH = Math.max(2, Math.round(b.h * 0.42));
      c.font = `bold ${fs}px "Trebuchet MS", sans-serif`;
      c.fillStyle = '#fff'; c.fillText(b.name, sx(b.x + b.w / 2), sy(b.y + roofH) + 8.5 * u);
      const locked = { spur: 'spur', palace: 'palace', salon: 'salon' }[b.key];
      if (locked && !Career.venueOpen(locked)) { c.font = `${fs * 1.1}px sans-serif`; c.fillText('🔒', sx(b.x + b.door + .5), sy(b.y + b.h - 1.6)); }
    }
    if (m.id === 'town') {
      c.font = `bold ${fs}px "Trebuchet MS", sans-serif`; c.fillStyle = '#fff';
      c.fillText("LUCKY LOU'S", sx(51.5), sy(17.4)); c.fillText('RIVERBOAT', sx(51.5), sy(18.1));
      if (!Career.venueOpen('riverboat')) c.fillText('🔒', sx(47.5), sy(18.4));
    }
    for (const tb of m.tables) {
      const g = GAMES[tb.game];
      c.font = `bold ${fs * .95}px "Trebuchet MS", sans-serif`;
      const label = `${g.icon} ${g.name.replace("Ultimate Texas Hold'em", "Ultimate Hold'em")}`;
      const tw = c.measureText(label).width + 6 * u;
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(sx(tb.x + tb.w / 2) - tw / 2, sy(tb.y + tb.h) + 1 * u, tw, fs * 1.4);
      c.fillStyle = '#ffe9a8'; c.fillText(label, sx(tb.x + tb.w / 2), sy(tb.y + tb.h) + 1 * u + fs * .72);
    }
    for (const L of m.labels) {
      c.font = `bold ${fs * 1.5}px Georgia, serif`;
      c.shadowColor = m.theme.accent; c.shadowBlur = 8 * S.dpr * (blink ? 1 : .6);
      c.fillStyle = m.theme.accent; c.fillText(L.text, sx(L.x), sy(L.y));
      c.shadowBlur = 0;
    }
  }

  return { mount, unmount, refreshGoal: () => updateGoal(), savePos, where: () => S && { map: S.m.id, x: S.p.x, y: S.p.y, dir: S.p.dir } };
})();
