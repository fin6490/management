// Exact return-to-player for every side bet / progressive in js/paytables.js.
// Usage: node casino/tools/odds.js         -> prints a report and writes js/rtp.js
const path = require('path');
const fs = require('fs');
const Poker = require('../js/poker.js');
const PAY = require('../js/paytables.js');

const deck = []; for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) deck.push({ r, s });
const out = {};
const pct = x => (x * 100).toFixed(2) + '%';
const tierMap = list => Object.fromEntries(list.map(t => [t.key, t]));

// Progressive helper: returns {fixed, jp:[[prob, pct]...]} where RTP(meter) = (fixed + Σ p*pct*meter)/cost
function progResult(prog, probs) {
  let fixed = 0; const jp = [];
  for (const t of prog.tiers) {
    const p = probs[t.key] || 0;
    if (t.pct) jp.push([p, t.pct]); else fixed += p * t.amt;
  }
  const rtpAt = m => (fixed + jp.reduce((a, [p, f]) => a + p * f * m, 0)) / prog.cost;
  // meter where RTP reaches 100%
  const slope = jp.reduce((a, [p, f]) => a + p * f, 0);
  const breakEven = slope > 0 ? (prog.cost - fixed) / slope : Infinity;
  return { fixed, jp, seedRtp: rtpAt(prog.seed), breakEven, probs };
}

// ---------- Blackjack (6 decks): first three cards P1, P2, Dealer up ----------
{
  const D = 6, N = 52 * D;
  const pp = tierMap(PAY.bj.perfectPairs), p3 = tierMap(PAY.bj.plus3);
  let rtpPP = 0, rtp3 = 0; const prog = {};
  for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) {
    const wab = D * (a === b ? D - 1 : D) / (N * (N - 1));
    const A = deck[a], B = deck[b];
    if (A.r === B.r) {
      if (A.s === B.s) rtpPP += wab * (pp.perfect.pays + 1);
      else if ((A.s === 1 || A.s === 2) === (B.s === 1 || B.s === 2)) rtpPP += wab * (pp.colored.pays + 1);
      else rtpPP += wab * (pp.mixed.pays + 1);
    }
    for (let c = 0; c < 52; c++) {
      const used = (c === a) + (c === b);
      const w = wab * (D - used) / (N - 2);
      const C = deck[c];
      const e = Poker.eval3([A, B, C]);
      let k = null;
      if (e.cat === 4) k = (A.s === B.s && B.s === C.s) ? 'suitedTrips' : 'trips';
      else if (e.cat === 5) k = 'straightFlush';
      else if (e.cat === 3) k = 'straight';
      else if (e.cat === 2) k = 'flush';
      if (k) rtp3 += w * (p3[k].pays + 1);
      const sevens = (A.r === 7) + (B.r === 7) + (C.r === 7);
      let pk = null;
      if (sevens === 3) pk = (A.s === B.s && B.s === C.s) ? 's777' : '777';
      else if (A.r === 7 && B.r === 7) pk = A.s === B.s ? 's77' : '77';
      else if (A.r === 7 || B.r === 7) pk = '7';
      if (pk) prog[pk] = (prog[pk] || 0) + w;
    }
  }
  out.bj = { perfectPairs: rtpPP, plus3: rtp3, prog: progResult(PAY.bj.prog, prog) };
}

// ---------- 5-card and 7-card category probabilities ----------
const catKey = ['high', 'pair', 'twopair', 'trips', 'straight', 'flush', 'fh', 'quads', 'sf', 'royal'];
const p5 = Array(10).fill(0), p7counts = [23294460, 58627800, 31433400, 6461620, 6180020, 4047644, 3473184, 224848, 37260, 4324];
{
  let n = 0;
  for (let a = 0; a < 48; a++) for (let b = a + 1; b < 49; b++) for (let c = b + 1; c < 50; c++) for (let d = c + 1; d < 51; d++) for (let e = d + 1; e < 52; e++) {
    p5[Poker.eval5([deck[a], deck[b], deck[c], deck[d], deck[e]]).cat]++; n++;
  }
  for (let i = 0; i < 10; i++) p5[i] /= n;
}
const p7 = p7counts.map(x => x / 133784560);
const byKey = arr => Object.fromEntries(catKey.map((k, i) => [k, arr[i]]));

// ---------- 3-card categories (with mini royal split) ----------
const p3c = { mini: 0, sf: 0, trips: 0, straight: 0, flush: 0, pair: 0, spadeRoyal: 0, high: 0 };
{
  let n = 0;
  for (let a = 0; a < 50; a++) for (let b = a + 1; b < 51; b++) for (let c = b + 1; c < 52; c++) {
    const e = Poker.eval3([deck[a], deck[b], deck[c]]); n++;
    const k = e.miniRoyal ? 'mini' : ['high', 'pair', 'flush', 'straight', 'trips', 'sf'][e.cat];
    p3c[k]++;
    if (e.miniRoyal && deck[a].s === 0) p3c.spadeRoyal++;
  }
  for (const k in p3c) p3c[k] /= n;
}
const rtpTable = (table, probs) => table.reduce((a, t) => a + (probs[t.key] || 0) * (t.pays + 1), 0);

// ---------- UTH ----------
{
  const P7 = byKey(p7);
  // hole card bonus
  let n = 0; const hc = {};
  for (let a = 0; a < 51; a++) for (let b = a + 1; b < 52; b++) {
    n++; const A = deck[a], B = deck[b]; let k = null;
    const hi = Math.max(A.r, B.r), lo = Math.min(A.r, B.r), s = A.s === B.s;
    if (A.r === B.r) k = A.r === 14 ? 'AA' : 'pair';
    else if (hi === 14 && lo === 13) k = s ? 'AKs' : 'AKo';
    else if (hi === 14 && (lo === 12 || lo === 11)) k = s ? 'AQJs' : 'AQJo';
    if (k) hc[k] = (hc[k] || 0) + 1;
  }
  for (const k in hc) hc[k] /= n;
  out.uth = { trips: rtpTable(PAY.uth.trips, P7), pocket: rtpTable(PAY.uth.pocket, hc), prog: progResult(PAY.uth.prog, byKey(p5)) };
}

// ---------- Mississippi Stud ----------
{
  const b3 = { ...p3c, sf: p3c.sf }; // eval3 'sf' excludes mini royals already
  out.ms = { bonus3: rtpTable(PAY.ms.bonus3, b3), prog: progResult(PAY.ms.prog, byKey(p5)) };
}

// ---------- Three Card Poker ----------
{
  // 6-card bonus: best 5 of 6 from 52 cards (enumerated)
  // (20M hands: slow, so the distribution is cached next to this script)
  const cacheFile = path.join(__dirname, 'six-card-cache.json');
  let c6 = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : null;
  if (!c6) { c6 = Array(10).fill(0); let n = 0;
  for (let a = 0; a < 47; a++) for (let b = a + 1; b < 48; b++) for (let c = b + 1; c < 49; c++)
    for (let d = c + 1; d < 50; d++) for (let e = d + 1; e < 51; e++) for (let f = e + 1; f < 52; f++) {
      c6[Poker.best([deck[a], deck[b], deck[c], deck[d], deck[e], deck[f]]).cat]++; n++;
    }
  for (let i = 0; i < 10; i++) c6[i] /= n;
  fs.writeFileSync(cacheFile, JSON.stringify(c6)); }
  const progProbs = { spadeRoyal: p3c.spadeRoyal, mini: p3c.mini - p3c.spadeRoyal, sf: p3c.sf, trips: p3c.trips, straight: p3c.straight, flush: p3c.flush };
  out.tcp = { pairPlus: rtpTable(PAY.tcp.pairPlus, p3c), six: rtpTable(PAY.tcp.six, byKey(c6)), prog: progResult(PAY.tcp.prog, progProbs), six_probs: c6 };
}

// ---------- Let It Ride 3-card bonus ----------
out.lir = { bonus3: rtpTable(PAY.lir.bonus3, p3c) };

// ---------- Casino War (6 decks) ----------
{
  const N = 312, pt = 23 / 311, ps = 5 / 311;
  out.war = { tie: (pt - ps) * (PAY.war.tie + 1) + ps * (PAY.war.suitedTie + 1) };
}

// ---------- Baccarat (8 decks) exact enumeration by rank value ----------
{
  const D = 8;
  const val = r => (r >= 10 && r <= 13 ? 0 : r === 14 ? 1 : r); // card ranks 2..14
  // counts by baccarat value 0..9
  const cnt = Array(10).fill(4 * D); cnt[0] = 16 * D; const N0 = 52 * D;
  let pW = 0, bW = 0, tie = 0, dragon = 0, panda = 0;
  const left = cnt.slice();
  function bankerDraws(b, pThird) {
    if (pThird === null) return b <= 5;
    if (b <= 2) return true;
    if (b === 3) return pThird !== 8;
    if (b === 4) return pThird >= 2 && pThird <= 7;
    if (b === 5) return pThird >= 4 && pThird <= 7;
    if (b === 6) return pThird === 6 || pThird === 7;
    return false;
  }
  // enumerate 6 card values sequentially with probabilities (cards beyond those used are irrelevant)
  function draw(nUsed) { /* helper not needed */ }
  for (let p1 = 0; p1 < 10; p1++) { let w1 = left[p1] / N0; left[p1]--;
  for (let b1 = 0; b1 < 10; b1++) { let w2 = w1 * left[b1] / (N0 - 1); left[b1]--;
  for (let p2 = 0; p2 < 10; p2++) { let w3 = w2 * left[p2] / (N0 - 2); left[p2]--;
  for (let b2 = 0; b2 < 10; b2++) { let w4 = w3 * left[b2] / (N0 - 3); left[b2]--;
    const P = (p1 + p2) % 10, B = (b1 + b2) % 10;
    const finish = (pt, bt, w, pCards, bCards) => {
      if (pt > bt) { pW += w; if (pCards === 3 && pt === 8) panda += w; }
      else if (bt > pt) { bW += w; if (bCards === 3 && bt === 7) dragon += w; }
      else tie += w;
    };
    if (P >= 8 || B >= 8) finish(P, B, w4, 2, 2);
    else {
      if (P <= 5) {
        for (let p3 = 0; p3 < 10; p3++) { const w5 = w4 * left[p3] / (N0 - 4); left[p3]--;
          const PT = (P + p3) % 10;
          if (bankerDraws(B, p3)) {
            for (let b3 = 0; b3 < 10; b3++) { const w6 = w5 * left[b3] / (N0 - 5); finish(PT, (B + b3) % 10, w6, 3, 3); }
          } else finish(PT, B, w5, 3, 2);
          left[p3]++; }
      } else {
        if (bankerDraws(B, null)) {
          for (let b3 = 0; b3 < 10; b3++) { const w5 = w4 * left[b3] / (N0 - 4); finish(P, (B + b3) % 10, w5, 2, 3); }
        } else finish(P, B, w4, 2, 2);
      }
    }
  left[b2]++; } left[p2]++; } left[b1]++; } left[p1]++; }
  const m = PAY.bac.main;
  // pair: first two cards of a hand same rank (13 ranks x 32 cards)
  const pPair = 31 / 415, pSuited = 7 / 415;
  const pr = tierMap(PAY.bac.pair);
  // progressive over first four cards (P1,P2,B1,B2), card-level with 8 copies of each of 52
  const N = 416; const prog = {};
  const cardVal = c => val(c.r);
  for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) for (let c = 0; c < 52; c++) for (let d = 0; d < 52; d++) {
    const ids = [a, b, c, d]; let w = 1, used = {};
    for (let i = 0; i < 4; i++) { const u = used[ids[i]] || 0; w *= (D - u) / (N - i); used[ids[i]] = u + 1; }
    const A = deck[a], B2 = deck[b], C = deck[c], Dd = deck[d];
    const pt = (cardVal(A) + cardVal(B2)) % 10, bt = (cardVal(C) + cardVal(Dd)) % 10;
    const ps = A.s === B2.s, bs = C.s === Dd.s;
    let k = null;
    if (A.r === B2.r && B2.r === C.r && C.r === Dd.r) k = (a === b && b === c && c === d) ? 'q4s' : 'q4';
    else if (pt === 9 && bt === 9) k = 'n99';
    else if (pt === 8 && bt === 8) k = 'n88';
    else if ((pt === 9 && bt === 8) || (pt === 8 && bt === 9)) k = 'n98';
    else if ((pt >= 8 && ps) || (bt >= 8 && bs)) k = 'sn';
    else if (A.r === B2.r || C.r === Dd.r) k = 'pair';
    if (k) prog[k] = (prog[k] || 0) + w;
  }
  out.bac = {
    probs: { player: pW, banker: bW, tie, dragon, panda },
    player: pW * (1 + m.player) + tie, banker: bW * (1 + m.banker) + tie, tie: tie * (m.tie + 1),
    pair: (pPair - pSuited) * (pr.pair.pays + 1) + pSuited * (pr.suited.pays + 1),
    dragon7: dragon * (PAY.bac.dragon7 + 1), panda8: panda * (PAY.bac.panda8 + 1),
    // EZ Baccarat: banker pays 1:1 but pushes on a three-card 7
    bankerEZ: (bW - dragon) * 2 + dragon + tie,
    prog: progResult(PAY.bac.prog, prog),
  };
}

// ---------- Craps ----------
{
  const ways = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
  const points = [4, 5, 6, 8, 9, 10];
  // Fire bet: distribution of unique points made before seven-out
  const memo = new Map();
  function fire(mask) { // returns array dist[k] of final count of unique points
    if (memo.has(mask)) return memo.get(mask);
    // per point cycle (conditioned on a point being established)
    let pStay = 0; const res = Array(7).fill(0);
    const trans = [];
    for (const p of points) {
      const pe = ways[p] / 24, make = ways[p] / (ways[p] + 6);
      const bit = 1 << points.indexOf(p);
      if (mask & bit) pStay += pe * make; else trans.push([mask | bit, pe * make]);
      const cnt = popc(mask); res[cnt] += pe * (1 - make);
    }
    const scale = 1 / (1 - pStay);
    for (let k = 0; k < 7; k++) res[k] *= scale;
    for (const [m2, pr] of trans) { const sub = fire(m2); for (let k = 0; k < 7; k++) res[k] += scale * pr * sub[k]; }
    memo.set(mask, res); return res;
  }
  function popc(m) { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; }
  const fd = fire(0);
  const fireRtp = PAY.craps.fire.reduce((a, t) => a + fd[t.pts] * (t.pays + 1), 0);
  // ATS: probability that all of a set is rolled before a 7
  const nums = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
  function allBefore7(set) {
    const memo2 = new Map();
    function f(mask) { // mask = remaining needed
      if (mask === 0) return 1; if (memo2.has(mask)) return memo2.get(mask);
      let tot = 6, acc = 0; const rem = [];
      set.forEach((n, i) => { if (mask & (1 << i)) { tot += ways[n]; rem.push(i); } });
      for (const i of rem) acc += ways[set[i]] / tot * f(mask & ~(1 << i));
      memo2.set(mask, acc); return acc;
    }
    return f((1 << set.length) - 1);
  }
  const pSmall = allBefore7([2, 3, 4, 5, 6]), pTall = allBefore7([8, 9, 10, 11, 12]), pAll = allBefore7(nums);
  out.craps = {
    fire: fireRtp, fireDist: fd,
    small: pSmall * (PAY.craps.ats.small + 1), tall: pTall * (PAY.craps.ats.tall + 1), all: pAll * (PAY.craps.ats.all + 1),
    pSmall, pAll,
  };
}

// ---------- Crazy 4 Poker: Queens Up over every 5-card hand ----------
{
  const qu = tierMap(PAY.c4.queensUp), cnt = {}; let n = 0;
  for (let a = 0; a < 52; a++) for (let b = a + 1; b < 52; b++) for (let c = b + 1; c < 52; c++) for (let d = c + 1; d < 52; d++) for (let e = d + 1; e < 52; e++) {
    const h = Poker.best4([deck[a], deck[b], deck[c], deck[d], deck[e]]);
    let k = h.key === 'aces4' ? 'quads' : h.key;
    if (k === 'pair') k = h.groups[0] >= 12 ? 'qup' : null;
    if (k === 'high') k = null;
    if (k) cnt[k] = (cnt[k] || 0) + 1; n++;
  }
  let r = 0; for (const k in cnt) if (qu[k]) r += cnt[k] / n * (qu[k].pays + 1);
  out.c4 = { queensUp: r, probs: Object.fromEntries(Object.entries(cnt).map(([k, v]) => [k, v / n])) };
}

// ---------- report ----------
const lines = [];
const show = (name, v) => lines.push(name.padEnd(34) + (typeof v === 'number' ? pct(v) : v));
const showProg = (name, p) => lines.push(name.padEnd(34) + `fixed ${pct(p.fixed / PAY[name.split('.')[0]].prog.cost)}  at seed ${pct(p.seedRtp)}  break-even meter $${Math.round(p.breakEven).toLocaleString()}`);
show('bj.perfectPairs', out.bj.perfectPairs); show('bj.plus3', out.bj.plus3); showProg('bj.prog', out.bj.prog);
show('uth.trips', out.uth.trips); show('uth.pocket', out.uth.pocket); showProg('uth.prog', out.uth.prog);
show('ms.bonus3', out.ms.bonus3); showProg('ms.prog', out.ms.prog);
show('tcp.pairPlus', out.tcp.pairPlus); show('tcp.six', out.tcp.six); showProg('tcp.prog', out.tcp.prog);
show('lir.bonus3', out.lir.bonus3); show('war.tie', out.war.tie); show('c4.queensUp', out.c4.queensUp);
for (const k of ['player', 'banker', 'bankerEZ', 'tie', 'pair', 'dragon7', 'panda8']) show('bac.' + k, out.bac[k]);
showProg('bac.prog', out.bac.prog);
for (const k of ['fire', 'small', 'tall', 'all']) show('craps.' + k, out.craps[k]);
console.log(lines.join('\n'));
console.log('bac probs', out.bac.probs, '\nbac prog', out.bac.prog.probs, '\nfire', out.craps.fireDist.map(x => x.toExponential(3)));

// compact file for the app
const prog = p => ({ fixed: +p.fixed.toFixed(6), jp: p.jp.map(([pr, f]) => [+pr.toExponential(6), f]) });
const rtp = {
  'bj.perfectPairs': out.bj.perfectPairs, 'bj.plus3': out.bj.plus3,
  'uth.trips': out.uth.trips, 'uth.pocket': out.uth.pocket,
  'ms.bonus3': out.ms.bonus3, 'tcp.pairPlus': out.tcp.pairPlus, 'tcp.six': out.tcp.six,
  'lir.bonus3': out.lir.bonus3, 'war.tie': out.war.tie, 'c4.queensUp': out.c4.queensUp,
  'bac.player': out.bac.player, 'bac.banker': out.bac.banker, 'bac.bankerEZ': out.bac.bankerEZ, 'bac.tie': out.bac.tie,
  'bac.pair': out.bac.pair, 'bac.dragon7': out.bac.dragon7, 'bac.panda8': out.bac.panda8,
  'craps.fire': out.craps.fire, 'craps.small': out.craps.small, 'craps.tall': out.craps.tall, 'craps.all': out.craps.all,
};
for (const k in rtp) rtp[k] = +rtp[k].toFixed(5);
const progs = { bj: prog(out.bj.prog), uth: prog(out.uth.prog), ms: prog(out.ms.prog), tcp: prog(out.tcp.prog), bac: prog(out.bac.prog) };
fs.writeFileSync(path.join(__dirname, '../js/rtp.js'),
  '/* Generated by tools/odds.js — exact return-to-player figures. Do not edit by hand. */\n' +
  'window.RTP = ' + JSON.stringify(rtp, null, 1) + ';\n' +
  'window.PROG_ODDS = ' + JSON.stringify(progs) + ';\n');
