// Monte Carlo return for the main bets of the poker-style games (UTH, Let It Ride, Mississippi Stud,
// Crazy 4, Three Card Poker), mirroring each game's settlement with a good basic strategy. Its results
// are the MAIN figures in tools/odds.js. Usage: node casino/tools/main-odds.js [uth|lir|ms|c4|tcp] [hands]
const Poker = require('../js/poker.js');
const PAY = require('../js/paytables.js');
const N = +(process.argv[3] || 400000), only = process.argv[2];
const deck = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push({ r, s });
function deal(n) { const d = deck.slice(); for (let i = 0; i < n; i++) { const j = i + Math.floor(Math.random() * (52 - i)); [d[i], d[j]] = [d[j], d[i]]; } return d.slice(0, n); }
const CK = ['high', 'pair', 'twopair', 'trips', 'straight', 'flush', 'fh', 'quads', 'sf', 'royal'];
const row = (t, k) => t.find(r => r.key === k);
const res = {}; const F = {}; const addF = (k, u) => F[k] = (F[k] || 0) + u;

// ---------- Ultimate Texas Hold'em: per ante unit (ante + blind both 1; total return / initial 2 units reported per ante) ----------
function uth() {
  let net = 0;
  // Wizard-of-Odds style simple strategy
  const pre = (a, b) => { const hi = Math.max(a.r, b.r), lo = Math.min(a.r, b.r), suited = a.s === b.s;
    if (a.r === b.r) return a.r >= 3; if (hi === 14) return true; if (hi === 13) return suited || lo >= 5; if (hi === 12) return suited ? lo >= 6 : lo >= 8; if (hi === 11) return suited ? lo >= 8 : lo >= 10; return false; };
  const M = +(process.env.UTH_SAMPLE || 150);
  for (let i = 0; i < N; i++) {
    const c = deal(9), p = c.slice(0, 2), d = c.slice(2, 4), b = c.slice(4, 9);
    let raise = 0;
    if (pre(p[0], p[1])) raise = 4;
    else {
      const flop = p.concat(b.slice(0, 3)), e = Poker.best(flop);
      const hiddenPair = p.some(x => b.slice(0, 3).some(y => y.r === x.r)) || (p[0].r === p[1].r && p[0].r > 2);
      const suits = {}; flop.forEach(x => suits[x.s] = (suits[x.s] || 0) + 1);
      const fourFlushHi = Object.entries(suits).some(([s, n]) => n >= 4 && p.some(x => x.s == s && x.r >= 10));
      if (e.cat >= 2 || hiddenPair || fourFlushHi) raise = 2;
      else {
        const me = Poker.best(p.concat(b));
        const hidden = me.cat >= 1 && p.some(x => b.some(y => y.r === x.r));
        if (hidden || me.cat > Poker.best(b).cat) raise = 1;
        else { // count how often a random dealer hand beats us (the "21 outs" rule, sampled)
          const left = deck.filter(x => !c.slice(0, 2).concat(b).some(y => y.r === x.r && y.s === x.s));
          let call = 0; for (let k = 0; k < M; k++) { const i1 = Math.floor(Math.random() * 45); let i2 = Math.floor(Math.random() * 44); if (i2 >= i1) i2++;
            const dh = Poker.best([left[i1], left[i2]].concat(b)), dq = dh.cat >= 1;
            call += dh.score > me.score ? -(2 + (dq ? 1 : 0)) : dh.score < me.score ? 1 + (dq ? 1 : 0) : 0; }
          if (call / M > -2) raise = 1;
        }
      }
    }
    if (!raise) { net -= 2; continue; }
    const me = Poker.best(p.concat(b)), dl = Poker.best(d.concat(b)), q = dl.cat >= 1;
    const bl = row(PAY.uth.blind, CK[me.cat]), bp = bl ? bl.pays : 0;
    if (me.score > dl.score) net += raise + (q ? 1 : 0) + bp;
    else if (me.score < dl.score) net -= raise + (q ? 1 : 0) + 1;
  }
  return net / N; // per ante (house edge is usually quoted per ante)
}
// ---------- Let It Ride: three equal bets, pull two ----------
function lir() {
  let net = 0;
  const pays = e => { if (e.cat === 1) return e.groups[0] >= 10 ? 1 : -1; if (e.cat === 0) return -1; return row(PAY.lir.main, CK[e.cat]).pays; };
  const keep3 = c => { const rs = c.map(x => x.r).sort((a, b) => a - b);
    if (rs[0] === rs[1] && rs[0] >= 10 || rs[1] === rs[2] && rs[1] >= 10) return true; if (rs[0] === rs[2]) return true;
    const suited = c[0].s === c[1].s && c[1].s === c[2].s, span = rs[2] - rs[0], hi = rs.filter(r => r >= 10).length;
    if (suited && span <= 4 && rs[0] !== rs[1] && rs[1] !== rs[2]) { const gaps = span - 2; return hi >= gaps && !(rs[0] === 2 && rs[2] === 4); }
    return false; };
  const keep4 = c => { const e4 = c.map(x => x.r); const cnt = {}; e4.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
    if (Object.entries(cnt).some(([r, n]) => n >= 2 && (n >= 3 || +r >= 10))) return true; if (Object.values(cnt).filter(n => n === 2).length === 2) return true;
    const suits = {}; c.forEach(x => suits[x.s] = (suits[x.s] || 0) + 1); if (Object.values(suits).some(n => n === 4)) return true;
    const rs = [...new Set(e4)].sort((a, b) => a - b); if (rs.length === 4) { const span = rs[3] - rs[0]; if (span === 3 && rs[0] >= 2 && rs[3] <= 13) return true; if (span === 4 && rs.filter(r => r >= 10).length === 4) return true; }
    return false; };
  for (let i = 0; i < N; i++) {
    const c = deal(5); const b1 = keep3(c.slice(0, 3)) ? 1 : 0, b2 = keep4(c.slice(0, 4)) ? 1 : 0, units = 1 + b1 + b2;
    { const e = Poker.eval5(c); addF(e.cat === 1 ? 'pair' + (e.groups[0] >= 10 ? 'hi' : 'lo') : CK[e.cat], units); net += units * pays(e); }
  }
  return net / N; // per base bet
}
// ---------- Mississippi Stud: ante 1, then up to 3x on three streets ----------
function ms() {
  let net = 0;
  const mult = e => { if (e.cat === 1) { const p = e.groups[0]; return p >= 11 ? 1 : p >= 6 ? 0 : -1; } if (e.cat === 0) return -1; return row(PAY.ms.main, CK[e.cat]).pays; };
  const pts = r => r >= 11 ? 2 : r >= 6 ? 1 : 0;
  for (let i = 0; i < N; i++) {
    const c = deal(5); let committed = 1; let folded = false;
    for (let st = 2; st <= 4 && !folded; st++) {
      const h = c.slice(0, st), rs = h.map(x => x.r), cnt = {}; rs.forEach(r => cnt[r] = (cnt[r] || 0) + 1);
      const pair = Object.entries(cnt).find(([r, n]) => n >= 2), p6 = pair && +pair[0] >= 6, P = rs.reduce((a, r) => a + pts(r), 0);
      const suits = {}; h.forEach(x => suits[x.s] = (suits[x.s] || 0) + 1); const flushN = Math.max(...Object.values(suits));
      const u = [...new Set(rs)].sort((a, b) => a - b), span = u[u.length - 1] - u[0];
      let r = 0;
      if (st === 2) { if (pair) r = 3; else if (P >= 2 || (flushN === 2 && span === 1 && u[0] >= 5)) r = 1; }
      else if (st === 3) { if (p6 || Object.values(cnt).some(n => n >= 3) || (flushN === 3 && span <= 4 && P >= 3)) r = 3; else if (pair || P >= 3 || flushN === 3 || (u.length === 3 && span <= 4 && u[0] >= 4)) r = 1; }
      else { const e = Poker.eval5 ? null : null; if (p6 || Object.values(cnt).some(n => n >= 3) || Object.values(cnt).filter(n => n === 2).length === 2 || flushN === 4 || (u.length === 4 && span === 3 && u[0] >= 2)) r = 3; else if (pair || P >= 4 || (u.length === 4 && span === 4 && P >= 3) || flushN === 3 && P >= 3) r = 1; }
      if (!r) folded = true; else committed += r;
    }
    { const e = Poker.eval5(c); if (!folded) addF(e.cat === 1 ? 'pair' + (e.groups[0] >= 11 ? 'hi' : e.groups[0] >= 6 ? 'mid' : 'lo') : CK[e.cat], committed); net += folded ? -committed : committed * mult(e); }
  }
  return net / N; // per ante
}
// ---------- Crazy 4: ante 1 + super bonus 1, play 1x (3x with pair of aces+) ----------
function c4() {
  let net = 0;
  for (let i = 0; i < N; i++) {
    const c = deal(10), me = Poker.best4(c.slice(0, 5)), dl = Poker.best4(c.slice(5, 10));
    const g = me.groups || [], playable = me.cat > 0 || (me.high === 14) || (me.high === 13 && (g[1] || 0) >= 12 && (g[2] || 0) >= 8 && (g[3] || 0) >= 4);
    if (!playable) { net -= 2; continue; }
    const play = me.cat >= 1 && (me.cat > 1 || (g[0] || 0) === 14) ? 3 : 1;
    const q = dl.cat > 0 || dl.high >= 13, cmp = me.score - dl.score;
    let v = 0; v += !q ? 0 : cmp > 0 ? 1 : cmp < 0 ? -1 : 0; v += cmp > 0 ? play : cmp < 0 ? -play : 0;
    const sb = row(PAY.c4.superBonus, me.key); v += sb ? sb.pays : cmp >= 0 ? 0 : -1;
    net += v;
  }
  return net / N; // per ante
}
// ---------- Three Card Poker ante/play, Q-6-4 ----------
function tcp() {
  let net = 0;
  for (let i = 0; i < N; i++) {
    const c = deal(6), me = Poker.eval3(c.slice(0, 3)), dl = Poker.eval3(c.slice(3, 6));
    const rs = c.slice(0, 3).map(x => x.r).sort((a, b) => b - a), playIt = me.cat > 0 || rs[0] > 12 || (rs[0] === 12 && (rs[1] > 6 || (rs[1] === 6 && rs[2] >= 4)));
    if (!playIt) { net -= 1; continue; }
    const key = me.miniRoyal ? 'sf' : ['high', 'pair', 'flush', 'straight', 'trips', 'sf'][me.cat], ab = row(PAY.tcp.anteBonus, key); let v = ab ? ab.pays : 0;
    const q = dl.cat > 0 || Math.max(...c.slice(3, 6).map(x => x.r)) >= 12;
    if (!q) v += 1; else if (me.score > dl.score) v += 2; else if (me.score < dl.score) v -= 2;
    net += v;
  }
  return net / N; // per ante
}
const games = { uth, lir, ms, c4, tcp };
for (const [k, f] of Object.entries(games)) if (!only || only === k) { const t0 = Date.now(); res[k] = f(); console.log(k.padEnd(5), ((1 + res[k]) * 100).toFixed(2) + '% per ante', `(${((Date.now() - t0) / 1000).toFixed(1)}s)`); }
if (process.env.FREQ) for (const k of Object.keys(F).sort()) console.log('  F', k.padEnd(9), (F[k] / N).toFixed(5));
