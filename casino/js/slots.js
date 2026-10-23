/* Slots: a five-reel, 243-ways video slot with wilds, free spins with multiplier wilds, Hold & Spin
   cash orbs, Sal's Lucky 17 wild reels, an even-money gamble, and four must-hit-by mystery
   jackpots per casino. The reel maths is plain functions so tools can simulate it. */
const SlotMath = (() => {
  // symbol ids
  const W = 0, S = 1, O = 2, H1 = 3, H2 = 4, H3 = 5, H4 = 6, A = 7, K_ = 8, Q = 9, J = 10, T = 11;
  const PAYING = [H1, H2, H3, H4, A, K_, Q, J, T];
  // pays per way, in multiples of the total bet, for 3, 4 and 5 of a kind
  const K = 2.25; // pay scale, tuned by simulation
  const PAY0 = {
    [H1]: [0.50, 1.50, 5.00], [H2]: [0.40, 1.20, 4.00], [H3]: [0.30, 0.80, 2.50], [H4]: [0.25, 0.60, 2.00],
    [A]: [0.15, 0.40, 1.20], [K_]: [0.15, 0.40, 1.20], [Q]: [0.10, 0.30, 1.00], [J]: [0.10, 0.30, 1.00], [T]: [0.10, 0.25, 0.80],
  };
  const PAY = {}; for (const s in PAY0) PAY[s] = PAY0[s].map(v => Math.round(v * K * 100) / 100);
  const SCAT_PAY = { 3: 1, 4: 5, 5: 25 }, FS_AWARD = { 3: 8, 4: 12, 5: 20 };
  const CAP = 5000; // biggest win on one spin, in bets
  // reel make-up (counts per symbol)
  const MAKEUP = [
    { [W]: 0, [S]: 1, [O]: 3, [H1]: 2, [H2]: 3, [H3]: 3, [H4]: 4, [A]: 5, [K_]: 5, [Q]: 6, [J]: 6, [T]: 6 },
    { [W]: 2, [S]: 2, [O]: 3, [H1]: 2, [H2]: 3, [H3]: 4, [H4]: 4, [A]: 5, [K_]: 5, [Q]: 5, [J]: 6, [T]: 6 },
    { [W]: 2, [S]: 2, [O]: 3, [H1]: 2, [H2]: 3, [H3]: 4, [H4]: 4, [A]: 5, [K_]: 5, [Q]: 5, [J]: 6, [T]: 6 },
    { [W]: 2, [S]: 2, [O]: 3, [H1]: 2, [H2]: 3, [H3]: 4, [H4]: 4, [A]: 5, [K_]: 5, [Q]: 5, [J]: 6, [T]: 6 },
    { [W]: 0, [S]: 1, [O]: 3, [H1]: 2, [H2]: 3, [H3]: 3, [H4]: 4, [A]: 5, [K_]: 5, [Q]: 6, [J]: 6, [T]: 6 },
  ];
  // a fixed, seeded layout so every machine in town has the same reels
  function seeded(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function buildStrip(mk, seed) {
    const r = seeded(seed), bag = [];
    for (const s in mk) if (+s !== O && +s !== S) for (let i = 0; i < mk[s]; i++) bag.push(+s);
    for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
    // orbs come in stacks of three; scatters sit far apart
    const strip = bag.slice();
    for (let k = 0; k < mk[O] / 3; k++) { const at = Math.floor(r() * strip.length); strip.splice(at, 0, O, O, O); }
    for (let k = 0; k < mk[S]; k++) {
      for (let tries = 0; tries < 200; tries++) {
        const at = Math.floor(r() * strip.length);
        const near = [-3, -2, -1, 0, 1, 2].some(d => strip[(at + d + strip.length) % strip.length] === S);
        if (!near) { strip.splice(at, 0, S); break; }
      }
    }
    return strip;
  }
  const STRIPS = MAKEUP.map((mk, i) => buildStrip(mk, 1700 + i * 17));
  // free spins use reels with more wilds
  const STRIPS_FS = MAKEUP.map((mk, i) => buildStrip({ ...mk, [W]: mk[W] ? mk[W] + 1 : 0, [O]: 0 }, 2900 + i * 31));

  // Hold & Spin orb values (multiples of the bet) and the fixed jackpots on the orbs
  const ORB = [[1, 400], [2, 250], [3, 150], [5, 120], [8, 70], [10, 50], [15, 30], [25, 15], ['MINI', 12], ['MINOR', 2.5], ['MAJOR', .5]];
  const ORB_TOTAL = ORB.reduce((a, [, w]) => a + w, 0);
  const JP = { MINI: 20, MINOR: 50, MAJOR: 250, GRAND: 1000 };
  const HS_LAND = .04; // chance an empty cell catches an orb on a respin
  function orbValue(rng) { let x = rng() * ORB_TOTAL; for (const [v, w] of ORB) { if ((x -= w) < 0) return v; } return 1; }
  const orbPays = v => typeof v === 'number' ? v : JP[v];

  // a 5x3 window from random stops; grid[r][row]
  function stops(rng, set = STRIPS) { return set.map(s => Math.floor(rng() * s.length)); }
  function view(st, set = STRIPS) { return st.map((p, r) => [0, 1, 2].map(k => set[r][(p + k) % set[r].length])); }

  // evaluate 243 ways. mults[r][row] holds wild multipliers (1 in the base game)
  function evaluate(grid, mults) {
    const wins = []; let total = 0;
    for (const s of PAYING) {
      let ways = 1, len = 0;
      for (let r = 0; r < 5; r++) {
        let c = 0;
        for (let k = 0; k < 3; k++) { const g = grid[r][k]; if (g === s) c += 1; else if (g === W) c += mults ? mults[r][k] : 1; }
        if (!c) break;
        ways *= c; len++;
      }
      if (len >= 3) { const p = PAY[s][len - 3] * ways; total += p; wins.push({ s, len, ways, pay: p }); }
    }
    let sc = 0; for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (grid[r][k] === S) sc++;
    let orbs = 0; for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (grid[r][k] === O) orbs++;
    if (sc >= 3) total += SCAT_PAY[Math.min(5, sc)];
    return { wins, total, sc, orbs };
  }

  // one paid spin, resolved completely (features included), for simulation and for the machine
  const LUCKY = 1 / 300;
  function spinBase(rng) {
    const st = stops(rng), grid = view(st);
    let lucky = null;
    if (rng() < LUCKY) { // Sal's Lucky 17: one to three middle reels go wild
      const n = rng() < .75 ? 1 : 2, reels = [1, 2, 3].sort(() => rng() - .5).slice(0, n).sort();
      lucky = reels; for (const r of reels) grid[r] = [W, W, W];
    }
    return { st, grid, lucky, ev: evaluate(grid) };
  }
  // free spins: every wild carries x2 or x3
  function spinFree(rng) {
    const st = stops(rng, STRIPS_FS), grid = view(st, STRIPS_FS), mults = grid.map(col => col.map(g => g === W ? (rng() < .8 ? 2 : 3) : 1));
    return { st, grid, mults, ev: evaluate(grid, mults) };
  }
  function holdAndSpin(rng, startGrid) {
    // cells: value or null; orbs that triggered are locked in
    const cells = startGrid.map(col => col.map(g => g === O ? orbValue(rng) : null));
    const rounds = []; let left = 3;
    while (left > 0) {
      let landed = false;
      const add = [];
      for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (cells[r][k] === null && rng() < HS_LAND) { cells[r][k] = orbValue(rng); landed = true; add.push([r, k]); }
      rounds.push(add);
      if (cells.every(col => col.every(v => v !== null))) break;
      left = landed ? 3 : left - 1;
    }
    const full = cells.every(col => col.every(v => v !== null));
    const total = cells.flat().reduce((a, v) => a + (v === null ? 0 : orbPays(v)), 0) + (full ? JP.GRAND : 0);
    return { cells, rounds, full, total };
  }
  function playFree(rng, n) {
    let total = 0, played = 0;
    while (n > 0 && played < 300) { const f = spinFree(rng); total += f.ev.total; if (f.ev.sc >= 3) n += 8; n--; played++; }
    return { total, played };
  }
  // the whole spin's return in bets (for the simulator)
  function simulate(rng) {
    const b = spinBase(rng); let total = b.ev.total, parts = { base: b.ev.total, fs: 0, hs: 0, lucky: b.lucky ? b.ev.total : 0 };
    if (b.ev.sc >= 3) { const f = playFree(rng, FS_AWARD[Math.min(5, b.ev.sc)]); total += f.total; parts.fs = f.total; }
    if (b.ev.orbs >= 6) { const hs = holdAndSpin(rng, b.grid); total += hs.total; parts.hs = hs.total; parts.full = hs.full; }
    return { total: Math.min(CAP, total), parts, trig: { fs: b.ev.sc >= 3, hs: b.ev.orbs >= 6, lucky: !!b.lucky } };
  }
  return { W, S, O, H1, H2, H3, H4, A, K: K_, Q, J, T, PAYING, PAY, SCAT_PAY, FS_AWARD, CAP, STRIPS, STRIPS_FS, ORB, JP, HS_LAND, LUCKY, orbValue, orbPays, stops, view, evaluate, spinBase, spinFree, holdAndSpin, playFree, simulate };
})();

/* ======== machine ======== */
const SLOT_MACHINES = {
  spur: { name: 'Dusty Dollars', bets: [0.25, 0.5, 1, 2, 5, 10], b: 2, hi: ['🤠', '🐎', '👢', '🌵'], wild: '🌟', orb: '🪙', cls: 'western' },
  riverboat: { name: 'Paddlewheel Gold', bets: [1, 2, 5, 10, 25, 50], b: 10, hi: ['⚓', '🦞', '🎺', '🛶'], wild: '🌊', orb: '🪙', cls: 'river' },
  palace: { name: 'Gilded Dragon', bets: [5, 10, 25, 50, 100, 250], b: 50, hi: ['🐉', '💎', '🏮', '🪭'], wild: '🔥', orb: '🧧', cls: 'dragon' },
  salon: { name: 'Kessler\'s Vault', bets: [25, 100, 250, 500, 1000, 2500], b: 500, hi: ['🗝️', '💼', '🍾', '🎩'], wild: '♛', orb: '💰', cls: 'vault' },
};
// must-hit-by mystery jackpots: each hits somewhere between reset and cap (in multiples of the machine's
// typical bet b), so a meter close to its cap is worth chasing
const MYSTERY = [
  { key: 'copper', name: 'Copper', icon: '🥉', reset: 5, cap: 10, rate: .004 },
  { key: 'silver', name: 'Silver', icon: '🥈', reset: 25, cap: 60, rate: .0025 },
  { key: 'gold', name: 'Gold', icon: '🥇', reset: 150, cap: 400, rate: .002 },
  { key: 'diamond', name: 'Diamond', icon: '💎', reset: 1500, cap: 5000, rate: .002 },
];
const SLOT_RTP = .973; // reels and features, from tools/slots-sim.js

const Slots = (() => {
  const M = SlotMath;
  let V = null, el = null, busy = false, auto = 0, betIdx = 1, gambleWin = 0;
  const st = () => {
    const s = App.state;
    if (!s.slots) s.slots = { meters: {}, spins: 0, wagered: 0, won: 0, best: 0, fs: 0, hs: 0, grand: 0, mystery: {} };
    return s.slots;
  };
  /* ---------- mystery meters ---------- */
  function fresh(t, b, v) { const trig = (t.reset + RNG.float() * (t.cap - t.reset)) * b; return { v: v != null ? Math.min(v, trig - 0.01) : t.reset * b, trig }; }
  function meters(venueId) {
    const s = st(), m = SLOT_MACHINES[venueId];
    if (!s.meters[venueId]) {
      s.meters[venueId] = {};
      for (const t of MYSTERY) { const f = fresh(t, m.b); f.v = t.reset * m.b + RNG.float() * (f.trig - t.reset * m.b) * .9; s.meters[venueId][t.key] = f; }
    }
    return s.meters[venueId];
  }
  // feed the meters; returns the tiers you hit
  function feed(venueId, bet) {
    const m = SLOT_MACHINES[venueId], ms = meters(venueId), hits = [];
    for (const t of MYSTERY) {
      const x = ms[t.key];
      x.v += t.rate * bet;
      if (x.v >= x.trig) { hits.push({ t, amt: Math.round(x.trig * 100) / 100 }); Object.assign(x, fresh(t, m.b)); continue; }
      // other players around the floor
      x.v += t.rate * m.b * RNG.float() * 1.2;
      if (x.v >= x.trig) { const amt = Math.round(x.trig * 100) / 100; Object.assign(x, fresh(t, m.b)); App.news(`🎰 Someone at ${VENUES[venueId].name} hit the ${t.name} mystery jackpot (${fmt(amt)}).`); if (el) UI.toast(`${t.icon} Someone across the floor just hit the ${t.name} for ${fmt(amt)}`, 'warn'); }
    }
    return hits;
  }
  // overnight play by everyone else
  function dailyGrowth() {
    for (const venueId in SLOT_MACHINES) {
      const m = SLOT_MACHINES[venueId], ms = meters(venueId), vol = m.b * 1500 * (.5 + RNG.float());
      for (const t of MYSTERY) {
        const x = ms[t.key]; x.v += t.rate * vol;
        // strangers hit it as often as the night's play carries it past a trigger; never leave a meter parked just under one
        for (let guard = 0; x.v >= x.trig && guard < 20; guard++) {
          const amt = Math.round(x.trig * 100) / 100, over = x.v - x.trig;
          Object.assign(x, fresh(t, m.b)); x.v += over * .5;
          if (t.key !== 'copper') App.news(`🎰 Overnight, a ${RNG.pick(['retired dentist', 'bus-tour grandma', 'lucky tourist', 'off-duty dealer', 'honeymooner'])} hit ${m.name}'s ${t.name} jackpot at ${VENUES[venueId].name} for ${fmt(amt)}.`);
        }
      }
    }
  }
  // what the next spin is worth, including the chance of a mystery hit (needs the Meter Reader)
  function heat(venueId, bet) {
    const m = SLOT_MACHINES[venueId], ms = meters(venueId);
    let ev = SLOT_RTP;
    for (const t of MYSTERY) { const x = ms[t.key], room = t.cap * m.b - x.v, inc = t.rate * bet; const p = Math.min(1, inc / Math.max(room, 1e-9)); ev += p * (p >= 1 ? (x.v + t.cap * m.b) / 2 : x.v + inc / 2) / bet; }
    return ev;
  }

  /* ---------- the screen ---------- */
  const bet = () => SLOT_MACHINES[V].bets[betIdx];
  const glyph = g => { const m = SLOT_MACHINES[V]; return g === M.W ? m.wild : g === M.S ? '⭐' : g === M.O ? m.orb : g >= M.H1 && g <= M.H4 ? m.hi[g - M.H1] : ['A', 'K', 'Q', 'J', '10'][g - M.A]; };
  const label = g => g === M.W ? 'WILD' : g === M.S ? 'FREE' : '';
  const money = x => x >= 1000 || Number.isInteger(x) ? fmt(Math.round(x)) : '$' + x.toFixed(2);
  function screen(main, venueId) {
    V = venueId || App.state.venue || 'spur';
    if (!SLOT_MACHINES[V]) V = 'spur';
    const m = SLOT_MACHINES[V];
    betIdx = Math.min(App.state.flags['slotBet_' + V] ?? 1, m.bets.length - 1);
    el = { cells: [] };
    const reels = h('div.sl-reels');
    for (let r = 0; r < 5; r++) { const col = h('div.sl-reel'); el.cells.push([0, 1, 2].map(() => { const c = h('div.sl-cell'); col.append(c); return c; })); reels.append(col); }
    main.append(h('div.sl.' + m.cls,
      h('div.table-top', el.back = h('button.btn.ghost.sm', { onclick: () => { if (!busy) { auto = 0; Router.go('world'); } } }, '← Leave'),
        h('div.tt-title', `🎰 ${m.name} · ${VENUES[V].name}`), h('button.btn.ghost.sm', { onclick: paytable }, 'Paytable')),
      el.meters = h('div.sl-meters'),
      h('div.sl-cab', el.jps = h('div.sl-jps'), reels, el.banner = h('div.sl-banner'), el.msg = h('div.sl-msg', 'Good luck!')),
      h('div.sl-ctl',
        h('div.sl-bet', h('button.btn.sm', { onclick: () => setBet(-1) }, '−'), el.bet = h('b'), h('button.btn.sm', { onclick: () => setBet(1) }, '+')),
        el.spin = h('button.btn.primary.sl-spin', { onclick: () => spin() }, 'SPIN', h('kbd', 'Space')),
        el.auto = h('button.btn.sl-auto', { onclick: toggleAuto }, 'Auto'),
        el.gamble = h('button.btn.ghost.sl-gamble', { onclick: gamble, hidden: true }, '🃏 Gamble')),
      el.heat = h('p.small.sl-heat')));
    showGrid(M.view(M.stops(Math.random)));
    renderMeters(); renderBet();
  }
  function setBet(d) { if (busy) return; const m = SLOT_MACHINES[V]; betIdx = clamp(betIdx + d, 0, m.bets.length - 1); App.state.flags['slotBet_' + V] = betIdx; renderBet(); }
  function renderBet() {
    if (!el) return;
    el.bet.textContent = money(bet());
    el.jps.innerHTML = '';
    for (const k of ['MINI', 'MINOR', 'MAJOR', 'GRAND']) el.jps.append(h('div.sl-jp.' + k.toLowerCase(), h('small', k), h('b', money(M.JP[k] * bet()))));
    renderHeat();
  }
  function renderMeters() {
    if (!el) return;
    const ms = meters(V), m = SLOT_MACHINES[V];
    el.meters.innerHTML = '';
    for (const t of MYSTERY) {
      const x = ms[t.key], lo = t.reset * m.b, hi = t.cap * m.b, p = clamp((x.v - lo) / (hi - lo), 0, 1);
      el.meters.append(h('div.sl-mm.' + t.key + (p > .85 ? '.hot' : ''), h('div.sl-mm-h', h('span', `${t.icon} ${t.name}`), h('b', money(x.v))),
        h('div.bar', h('i', { style: { width: (p * 100) + '%' } })), h('small', `Must hit by ${money(hi)}`)));
    }
    renderHeat();
  }
  function renderHeat() {
    if (!el) return;
    if (App.has('meterReader')) {
      const e = heat(V, bet());
      el.heat.className = 'small sl-heat ' + (e >= 1.02 ? 'good' : e >= 1 ? 'ok' : 'muted');
      el.heat.textContent = `📟 Meter Reader: this spin returns ${(e * 100).toFixed(1)}% right now${e >= 1.02 ? ': the machine is HOT' : ''}.`;
    } else el.heat.textContent = 'Every mystery meter must hit before its cap. Machines return 97.3% plus the mystery jackpots.';
  }
  function showGrid(grid, mults) {
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) setCell(el.cells[r][k], grid[r][k], mults && mults[r][k]);
  }
  function setCell(c, g, mult) {
    c.className = 'sl-cell s' + g; c.innerHTML = '';
    c.append(h('span.g', glyph(g)));
    if (label(g)) c.append(h('small', label(g)));
    if (mult > 1) c.append(h('em.x', '×' + mult));
  }

  /* ---------- spinning ---------- */
  async function animate(grid, mults, slowFrom) {
    const spinning = [0, 1, 2, 3, 4];
    const tick = setInterval(() => { for (const r of spinning) for (let k = 0; k < 3; k++) { const c = el.cells[r][k]; c.className = 'sl-cell blur'; c.innerHTML = ''; c.append(h('span.g', glyph(RNG.int(12)))); } }, 70);
    try {
      for (let r = 0; r < 5; r++) {
        await sleep(r === 0 ? 380 : slowFrom != null && r >= slowFrom ? 900 : 170);
        spinning.splice(spinning.indexOf(r), 1);
        for (let k = 0; k < 3; k++) { setCell(el.cells[r][k], grid[r][k], mults && mults[r][k]); el.cells[r][k].classList.add('land'); }
        SFX.chip();
        if (slowFrom == null && r === 1) { const sc = [0, 1].reduce((a, q) => a + grid[q].filter(g => g === M.S).length, 0); if (sc >= 2) { slowFrom = 2; el.msg.textContent = '⭐ ⭐ … one more!'; } }
      }
    } finally { clearInterval(tick); }
  }
  function highlight(grid, wins) {
    for (const w of wins) for (let r = 0; r < w.len; r++) for (let k = 0; k < 3; k++) if (grid[r][k] === w.s || grid[r][k] === M.W) el.cells[r][k].classList.add('hit');
    for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) if (grid[r][k] === M.S && wins.scat) el.cells[r][k].classList.add('hit');
  }
  function banner(text, cls = '', ms = 1600) {
    el.banner.className = 'sl-banner show ' + cls; el.banner.textContent = text;
    clearTimeout(banner._t); banner._t = setTimeout(() => el && (el.banner.className = 'sl-banner'), ms * App.speedFactor());
  }
  async function countUp(amount, B) {
    const tier = amount >= 100 * B ? ['EPIC WIN', 'epic'] : amount >= 50 * B ? ['MEGA WIN', 'mega'] : amount >= 15 * B ? ['BIG WIN', 'big'] : null;
    if (tier) { banner(`${tier[0]}! ${money(amount)}`, tier[1], 2600); SFX.big(); }
    const steps = tier ? 24 : 8;
    for (let i = 1; i <= steps; i++) { el.msg.textContent = `WIN ${money(amount * i / steps)}`; await sleep(tier ? 60 : 30); }
  }
  async function spin() {
    if (busy || !el) return;
    const B = bet(), why = Career.canPlay();
    if (why) { auto = 0; renderAuto(); return UI.toast(why, 'warn'); }
    if (!App.debit(B)) { auto = 0; renderAuto(); return UI.toast('Not enough bankroll for that bet', 'warn'); }
    busy = true; el.spin.disabled = true; el.back.disabled = true; el.gamble.hidden = true; gambleWin = 0;
    const s = st(); s.spins++; s.wagered += B; App.count('slotSpins');
    let paid = 0, feature = false;
    try {
      const b = M.spinBase(Math.random);
      el.msg.textContent = '';
      if (b.lucky) { banner('🍀 SAL\'S LUCKY 17!', 'lucky'); await sleep(700); }
      await animate(b.grid);
      let win = b.ev.total * B;
      if (b.ev.sc >= 3) b.ev.wins.scat = true;
      highlight(b.grid, b.ev.wins);
      if (win > 0) { App.credit(win); paid += win; await countUp(win, B); }
      else el.msg.textContent = '';
      if (b.ev.sc >= 3) { feature = true; paid += await freeSpins(M.FS_AWARD[Math.min(5, b.ev.sc)], B); }
      if (b.ev.orbs >= 6) { feature = true; paid += await holdSpin(b.grid, B); }
      // mystery jackpots
      for (const hit of feed(V, B)) {
        feature = true; paid += hit.amt; App.credit(hit.amt);
        s.mystery[hit.t.key] = (s.mystery[hit.t.key] || 0) + 1; App.count('slotMystery_' + hit.t.key);
        banner(`${hit.t.icon} ${hit.t.name.toUpperCase()} MYSTERY JACKPOT! ${money(hit.amt)}`, 'jackpot', 3200); SFX.big();
        App.news(`🎰 ${App.state.name} hit the ${hit.t.name} mystery jackpot on ${SLOT_MACHINES[V].name} for ${fmt(hit.amt)}!`);
        Quests.bump('slots2'); if (hit.t.key === 'gold' || hit.t.key === 'diamond') Quests.bump('slots4');
        await sleep(1800);
      }
      renderMeters();
      s.won += paid; if (paid / B > s.best) s.best = Math.round(paid / B);
      if (paid >= 100 * B) App.count('slotEpic');
      if (paid > 0 && !feature && paid <= 50 * B) { gambleWin = paid; el.gamble.hidden = false; }
      if (paid > 0 && !feature) el.msg.textContent = `WIN ${money(paid)}`;
      if (!paid) el.msg.textContent = RNG.pick(['So close.', 'Spin again?', '', 'Next one\'s the one.', '']);
      App.state.stats.biggestWin = Math.max(App.state.stats.biggestWin || 0, paid - B);
    } finally {
      Quests.bump('slots1'); Career.drain('round', .12);
      Career.checkAchievements(); App.save(); Router.hud();
      busy = false; if (el) { el.spin.disabled = false; el.back.disabled = false; }
    }
    if (feature && auto) { auto = 0; renderAuto(); }
    if (auto > 0 && el) { await sleep(350); if (auto > 0 && el && Router.screen === 'slots') { auto--; renderAuto(); spin(); } }
  }
  async function freeSpins(n, B) {
    const s = st(); s.fs++; App.count('slotFS');
    banner(`⭐ ${n} FREE SPINS! ⭐`, 'fs', 2200); SFX.big(); await sleep(2000);
    // resolve every free spin up front and bank the result, so closing the app mid-feature can't lose it
    const plays = []; let owed = 0;
    for (let k = n; k > 0 && plays.length < 300; k--) { const f = M.spinFree(Math.random); plays.push(f); owed += f.ev.total * B; if (f.ev.sc >= 3) k += 8; }
    owed = Math.min(owed, M.CAP * B); App.credit(owed); App.save(); Router.hud();
    let total = 0, i = 0;
    for (const f of plays) {
      i++; n--;
      el.msg.textContent = `FREE SPIN ${i} · ${Math.max(0, n)} left · won ${money(total)}`;
      await animate(f.grid, f.mults);
      if (f.ev.sc >= 3) f.ev.wins.scat = true;
      highlight(f.grid, f.ev.wins);
      const w = f.ev.total * B;
      if (w > 0) { total += w; el.msg.textContent = `FREE SPIN ${i} · +${money(w)} · total ${money(total)}`; await sleep(500); }
      if (f.ev.sc >= 3) { n += 8; banner('⭐ +8 FREE SPINS! ⭐', 'fs', 1800); await sleep(1500); }
      await sleep(350);
    }
    total = owed;
    await countUp(total, B);
    banner(`Free spins paid ${money(total)}`, 'fs', 2200);
    await sleep(900);
    return total;
  }
  async function holdSpin(grid, B) {
    const s = st(); s.hs++; App.count('slotHS');
    banner('🪙 HOLD & SPIN! 🪙', 'hs', 2000); SFX.big(); await sleep(1800);
    const res = M.holdAndSpin(Math.random, grid);
    App.credit(res.total * B); App.save(); Router.hud(); // banked before the show
    // replay: start with the triggering orbs, then each respin round
    const shown = grid.map(col => col.map(g => g === M.O));
    const paint = () => { for (let r = 0; r < 5; r++) for (let k = 0; k < 3; k++) { const c = el.cells[r][k], v = res.cells[r][k]; c.className = 'sl-cell ' + (shown[r][k] ? 'orb' : 'empty'); c.innerHTML = ''; if (shown[r][k]) c.append(h('span.g', SLOT_MACHINES[V].orb), h('b.ov' + (typeof v === 'string' ? '.jpv' : ''), typeof v === 'string' ? v : money(v * B))); } };
    paint();
    let left = 3;
    for (const add of res.rounds) {
      el.msg.textContent = `HOLD & SPIN · respins left: ${left}`;
      await sleep(650);
      for (const [r, k] of add) { shown[r][k] = true; }
      paint(); for (const [r, k] of add) el.cells[r][k].classList.add('land');
      if (add.length) { SFX.chip(); left = 3; } else left--;
      el.msg.textContent = `HOLD & SPIN · respins left: ${left}`;
    }
    if (res.full) { s.grand++; App.count('slotGrand'); banner(`👑 GRAND JACKPOT! ${money(M.JP.GRAND * B)}`, 'jackpot', 3500); SFX.big(); await sleep(2500); Quests.bump('slots4'); }
    const total = res.total * B;
    await countUp(total, B);
    await sleep(900);
    return total;
  }

  /* ---------- autoplay, gamble, paytable ---------- */
  function renderAuto() { if (el) el.auto.textContent = auto > 0 ? `Stop (${auto})` : 'Auto'; }
  async function toggleAuto() {
    if (auto > 0) { auto = 0; renderAuto(); return; }
    const n = await UI.modal({ title: '🔁 Autoplay', body: h('p.muted', 'Stops on any feature, mystery jackpot, or when you run short.'), buttons: [10, 25, 50, 100].map(v => ({ label: `${v} spins`, value: v })) });
    if (!n) return;
    auto = n - 1; renderAuto(); spin();
  }
  async function gamble() {
    if (busy || !gambleWin) return;
    let amount = gambleWin; gambleWin = 0; el.gamble.hidden = true;
    for (let round = 0; round < 5; round++) {
      const choice = await UI.modal({ title: '🃏 Double or nothing', body: h('div', h('p', `Stake: ${money(amount)}. Guess the colour of the next card: right doubles it, wrong loses it.`), h('p.muted.small', 'A fair 50/50: this doesn\'t change the machine\'s return.')),
        buttons: [{ label: `Collect ${money(amount)}`, value: 'take', cls: 'ghost' }, { label: '♥ Red', value: 'red' }, { label: '♠ Black', value: 'black', cls: 'primary' }] });
      if (choice !== 'red' && choice !== 'black') break;
      if (!App.debit(amount)) break;
      const red = Math.random() < .5, card = (red ? ['♥', '♦'] : ['♠', '♣'])[RNG.int(2)];
      if ((choice === 'red') === red) { st().won += amount; amount *= 2; App.credit(amount); UI.toast(`${card} ${red ? 'Red' : 'Black'}! Now ${money(amount)}`, 'good'); SFX.chip(); }
      else { st().won -= amount; UI.toast(`${card} ${red ? 'Red' : 'Black'}. Gone.`, 'warn'); amount = 0; break; }
    }
    if (el) el.msg.textContent = amount ? `COLLECTED ${money(amount)}` : 'Lost the gamble.';
    App.save(); Router.hud();
  }
  function paytable() {
    const B = bet(), m = SLOT_MACHINES[V];
    const row = (g, i) => h('tr', h('td.big', glyph(g)), ...M.PAY[g].map(p => h('td.num', money(p * B))));
    UI.modal({ title: `🎰 ${m.name} · paytable at ${money(B)}`, wide: true, body: h('div.sl-pay',
      h('p', '243 ways: symbols pay left to right on adjacent reels, in any row. Each way pays the amount below; more matching symbols on a reel multiply the ways.'),
      h('table.paytable', h('tr', h('th'), h('th', '3'), h('th', '4'), h('th', '5')), M.PAYING.map(row)),
      h('p', `${m.wild} WILD (reels 2 to 4) substitutes for every symbol except ⭐ and ${m.orb}.`),
      h('p', `⭐ 3, 4 or 5 scatters anywhere pay ${money(B)}, ${money(5 * B)} or ${money(25 * B)} and award 8, 12 or 20 FREE SPINS. In free spins the reels carry extra wilds, every wild is ×2 or ×3 (multiplying together across a way), and 3 more scatters add 8 spins.`),
      h('p', `${m.orb} 6 or more coins start HOLD & SPIN: coins lock in place with cash values, and you get 3 respins, reset whenever a new coin lands. Coins can carry the MINI (${money(20 * B)}), MINOR (${money(50 * B)}) or MAJOR (${money(250 * B)}); fill all 15 spots for the GRAND (${money(1000 * B)}).`),
      h('p', '🍀 SAL\'S LUCKY 17: at random, one or two middle reels turn completely wild before they land.'),
      h('p', '🃏 After an ordinary win (up to 50× your bet) you can gamble it on red or black, up to five times.'),
      h('p', `Mystery jackpots (Copper, Silver, Gold, Diamond) build with every spin by everyone in ${VENUES[V].name}, and each one MUST hit before it reaches its cap. Whoever's spin crosses the hidden trigger wins it, whatever their bet.`),
      h('p.muted.small', `Return: ${(SLOT_RTP * 100).toFixed(1)}% from the reels and features (10 million simulated spins), plus about 2.6% from the mystery jackpots on average: roughly 100% overall, and more when a meter is close to its cap. Maximum win ${M.CAP.toLocaleString()}× bet per spin.`)) });
  }
  document.addEventListener('keydown', e => {
    if (Router.screen !== 'slots' || !el || document.querySelector('.modal-bg') || e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); spin(); }
  });
  function unmount() { auto = 0; el = null; }
  return { screen, dailyGrowth, meters, heat, busy: () => busy, unmount, MACHINES: SLOT_MACHINES, st };
})();
