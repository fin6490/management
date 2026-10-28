#!/usr/bin/env node
/* Return-to-player for the Level 2 floor games.
     node casino/tools/l2-odds.js           exact figures for Big Six, Sic Bo and the jackpot bets, then coin pusher simulations
     node casino/tools/l2-odds.js 200000    longer pusher runs (coins dropped)
   The pusher has no closed form: it plays the real shelf physics from js/reality/games.js, once with
   coins dropped at random moments and once by a player who only drops when the bonus pocket lines up. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../js/reality/games.js'), 'utf8');
const ctx = { Math, console }; vm.createContext(ctx); vm.runInContext(src + '\nthis.G = L2Games;', ctx);
const G = ctx.G, pct = x => (x * 100).toFixed(2) + '%';

console.log('Big Six (54 segments)');
for (const k in G.WHEEL.pays) { const n = G.WHEEL.order.filter(x => x === String(k)).length; console.log(`  ${k.padEnd(3)} ${String(n).padStart(2)} segs  pays ${G.WHEEL.pays[k]}  RTP ${pct(n / 54 * (1 + G.WHEEL.pays[k]))}`); }

console.log('Sic Bo (all 216 rolls)');
const keys = ['small', 'big', 'odd', 'even', 'any', 't1', ...Object.keys(G.SUMS).map(s => 's' + s), 'n1'];
for (const k of keys) { let ret = 0; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) { const p = G.sicboPays(k, [a, b, c]); if (p >= 0) ret += 1 + p; } console.log(`  ${k.padEnd(6)} RTP ${pct(ret / 216)}`); }

// the jackpot bets: a share of each one goes on the meters (and comes back when a meter is won)
const ev = G.JPW.ev(), bet = G.JP.bet, meters = G.JP.perBet / bet;
console.log(`Jackpot Wheel: ${G.JPW.n} segments, worth ${ev.toFixed(2)} on average with the meters at their seeds`);
console.log(`  Big Six jackpot spin (JOKER or MERIDIAN, 2 in 54): RTP ${pct(2 / 54 * ev / bet)} + ${pct(meters)} to the meters = ${pct(2 / 54 * ev / bet + meters)}`);
console.log(`  Sic Bo jackpot roll (any triple, 6 in 216, plus $${G.TRIPLE_BONUS}): RTP ${pct(6 / 216 * (ev + G.TRIPLE_BONUS) / bet)} + ${pct(meters)} = ${pct(6 / 216 * (ev + G.TRIPLE_BONUS) / bet + meters)}`);

const N = +process.argv[2] || 30000, P = G.PUSH;
function run(skilled) {
  const S = G.pusherNew(); let paid = 0, gold = 0, chips = 0, pockets = 0, t = 0;
  for (let i = 0; i < 2000; i++) G.pusherStep(S, 1 / 30);
  for (let i = 1; i <= N; i++) {
    // the dropper sweeps; a careful player waits until it lines up with the pocket
    let x = Math.sin(t * 1.25) * .85;
    if (skilled) for (let k = 0; k < 90 && Math.abs(x - G.pocketAt(S.t)) >= P.pocketW; k++) { t += 1 / 30; G.pusherStep(S, 1 / 30).forEach(take); x = Math.sin(t * 1.25) * .85; }
    if (Math.abs(x - G.pocketAt(S.t)) < P.pocketW && Math.random() < P.pocketIn) {
      pockets++; const out = G.reelPick(), f = G.pusherFace(S.t);
      if (out === 'shower3' || out === 'shower7') for (let k = 0; k < (out === 'shower3' ? 3 : 7); k++) S.coins.push({ x: (Math.random() - .5) * 1.5, y: f + P.r + .02, g: 0 });
      if (out === 'gold') S.coins.push({ x: (Math.random() - .5), y: f + P.r + .25, g: 1 });
      if (out === 'jp') S.coins.push({ x: (Math.random() - .5) * .6, y: f + P.r + .3, g: 2 });
    } else S.coins.push({ x, y: G.pusherFace(S.t) + P.r + .01, g: 0 });
    if (i % P.goldEvery === 0) S.coins.push({ x: (Math.random() - .5) * 1.2, y: G.pusherFace(S.t) + P.r + .2, g: 1 });
    for (let k = 0; k < 15; k++) { t += 1 / 30; G.pusherStep(S, 1 / 30).forEach(take); }
  }
  function take(c) { if (Math.abs(c.x) > P.pay) return; if (c.g === 2) { chips++; paid += ev / P.coin; } else { paid += c.g ? P.goldWorth : 1; if (c.g) gold++; } }
  return { paid, gold, chips, pockets, left: S.coins.length };
}
for (const skilled of [false, true]) {
  const r = run(skilled);
  console.log(`Coin pusher, ${skilled ? 'waiting for the pocket' : 'dropping at random'} (${N} coins, gutters outside |x| > ${P.pay})`);
  console.log(`  paid ${r.paid.toFixed(0)} coins for ${N}: RTP ${pct(r.paid / N)} + ${pct(G.JP.perCoin / P.coin)} to the meters  (pocket ${pct(r.pockets / N)}, gold tokens won ${r.gold}, JP chips won ${r.chips}, coins left ${r.left})`);
}
