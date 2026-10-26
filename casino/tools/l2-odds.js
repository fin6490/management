#!/usr/bin/env node
/* Return-to-player for the Level 2 floor games.
     node casino/tools/l2-odds.js           exact figures for Big Six and Sic Bo, then a coin pusher simulation
     node casino/tools/l2-odds.js 200000    a longer pusher run (coins dropped)
   The pusher has no closed form: it plays the real shelf physics from js/reality/games.js. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../js/reality/games.js'), 'utf8');
const ctx = { Math, console }; vm.createContext(ctx); vm.runInContext(src + '\nthis.G = L2Games;', ctx);
const G = ctx.G, pct = x => (x * 100).toFixed(2) + '%';

console.log('Big Six (54 segments)');
for (const k in G.WHEEL.pays) { const n = G.WHEEL.order.filter(x => x === String(k)).length; console.log(`  ${k.padEnd(3)} ${String(n).padStart(2)} segs  pays ${G.WHEEL.pays[k]}  RTP ${pct(n / 54 * (1 + G.WHEEL.pays[k]))}`); }

console.log('Sic Bo (all 216 rolls)');
const keys = ['small', 'big', 'odd', 'even', 'any', 't1', ...Object.keys(G.SUMS).map(s => 's' + s), 'n1'];
for (const k of keys) { let ret = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) { const p = G.sicboPays(k, [a, b, c]); if (p >= 0) ret += 1 + p; } console.log(`  ${k.padEnd(6)} RTP ${pct(ret / 216)}`); }

const N = +process.argv[2] || 30000, P = G.PUSH;
console.log(`Coin pusher (${N} coins, gutters outside |x| > ${P.pay})`);
const S = G.pusherNew(); let paid = 0, gold = 0;
for (let i = 0; i < 2000; i++) G.pusherStep(S, 1 / 30); // let the starting shelf settle
for (let i = 1; i <= N; i++) {
  S.drops++; S.coins.push({ x: Math.sin(i * 1.7) * .85, y: G.pusherFace(S.t) + P.r + .01, g: 0 });
  if (S.drops % P.goldEvery === 0) S.coins.push({ x: (Math.random() - .5) * 1.2, y: G.pusherFace(S.t) + P.r + .2, g: 1 });
  for (let k = 0; k < 15; k++) for (const c of G.pusherStep(S, 1 / 30)) if (Math.abs(c.x) <= P.pay) { paid += c.g ? P.goldWorth : 1; if (c.g) gold++; }
}
console.log(`  paid ${paid} coins for ${N}: RTP ${pct(paid / N)}  (gold tokens won ${gold}, coins left on shelf ${S.coins.length})`);
