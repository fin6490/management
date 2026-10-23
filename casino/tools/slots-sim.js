// Monte Carlo check of the slot machine's return: node tools/slots-sim.js [spins]
const fs = require('fs'), path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../js/slots.js'), 'utf8').split('/* ======== machine ======== */')[0] + ';global.SlotMath = SlotMath;');
const N = +(process.argv[2] || 2e6), rng = Math.random;
let tot = 0, sq = 0, base = 0, fsv = 0, hs = 0, lucky = 0, nfs = 0, nhs = 0, nl = 0, full = 0, hits = 0, big = 0;
for (let i = 0; i < N; i++) {
  const r = SlotMath.simulate(rng); tot += r.total; sq += r.total * r.total;
  base += r.parts.base - r.parts.lucky; fsv += r.parts.fs; hs += r.parts.hs; lucky += r.parts.lucky;
  if (r.trig.fs) nfs++; if (r.trig.hs) nhs++; if (r.trig.lucky) nl++; if (r.parts.full) full++; if (r.total > 0) hits++; if (r.total >= 100) big++;
}
const pct = x => (x / N * 100).toFixed(2) + '%', sd = Math.sqrt(sq / N - (tot / N) ** 2);
console.log(`spins ${N.toLocaleString()}  RTP ${pct(tot)} ± ${(196 * sd / Math.sqrt(N)).toFixed(2)}% (95%)`);
console.log(`  base ${pct(base)}  free spins ${pct(fsv)}  hold & spin ${pct(hs)}  lucky 17 ${pct(lucky)}`);
console.log(`  hit rate ${(hits / N * 100).toFixed(1)}%  free spins 1 in ${(N / nfs).toFixed(0)}  hold & spin 1 in ${(N / nhs).toFixed(0)}  lucky 17 1 in ${(N / nl).toFixed(0)}  GRAND 1 in ${full ? (N / full).toFixed(0) : '-'}  100x+ 1 in ${(N / big).toFixed(0)}  sd ${sd.toFixed(2)}`);
