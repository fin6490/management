// Monte Carlo check of every slot machine's return: node tools/slots-sim.js [spins] [machine]
const fs = require('fs'), path = require('path');
eval(fs.readFileSync(path.join(__dirname, '../js/slots.js'), 'utf8').split('/* ======== machine ======== */')[0] + ';global.SlotMath = SlotMath;');
const N = +(process.argv[2] || 1e6), only = process.argv[3], rng = Math.random;
for (const key of Object.keys(SlotMath.CFG)) {
  if (only && key !== only) continue;
  const m = SlotMath.machine(key);
  let tot = 0, sq = 0, nfs = 0, nhs = 0, nb = 0, big = 0; const P = { base: 0, fs: 0, hs: 0, bonus: 0, lucky: 0 };
  for (let i = 0; i < N; i++) {
    const r = m.simulate(rng); tot += r.total; sq += r.total * r.total;
    for (const k in P) P[k] += r.parts[k] || 0; P.base -= r.parts.lucky;
    if (r.trig.fs) nfs++; if (r.trig.hs) nhs++; if (r.trig.bonus) nb++; if (r.total >= 100) big++;
  }
  const pct = x => (x / N * 100).toFixed(2) + '%', sd = Math.sqrt(sq / N - (tot / N) ** 2), one = n => n ? '1 in ' + Math.round(N / n) : '-';
  console.log(`${key.padEnd(10)} RTP ${pct(tot)} ± ${(196 * sd / Math.sqrt(N)).toFixed(2)}%  base ${pct(P.base)}  free spins ${pct(P.fs)}  hold&spin ${pct(P.hs)}  bonus ${pct(P.bonus)}  lucky ${pct(P.lucky)}  |  FS ${one(nfs)}  H&S ${one(nhs)}  bonus ${one(nb)}  100x+ ${one(big)}`);
}
