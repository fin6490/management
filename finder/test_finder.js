// Run: node finder/test_finder.js  (checks the maths in index.html's FINDER block)
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const src = html.slice(html.indexOf('/* FINDER START'), html.indexOf('/* FINDER END */'));
const Finder = new Function(src + '; return Finder;')();
const near = (a, b, msg, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${msg}: ${a} vs ${b}`);
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('ok', name); };

test('qualifying bet balances both outcomes', () => {
  const r = Finder.calc('qual', 10, 3.0, 3.1, 0.05);
  near(r.layStake, 10 * 3 / 3.05, 'lay stake');
  near(r.backWins.total, r.layWins.total, 'balanced');
  near(r.backWins.total, 20 - (30 / 3.05) * 2.1, 'back wins total');
  assert.ok(r.backWins.total < 0 && r.backWins.total > -1, 'small qualifying loss');
});

test('free bet SNR keeps about 70-80% at sensible odds', () => {
  const r = Finder.calc('snr', 10, 6.0, 6.2, 0.02);
  near(r.layStake, 10 * 5 / 6.18, 'lay stake');
  near(r.backWins.total, r.layWins.total, 'balanced');
  near(r.layWins.total, (50 / 6.18) * 0.98, 'locked profit');
  assert.ok(r.layWins.total > 7 && r.layWins.total < 8.5);
});

test('free bet SR', () => {
  const r = Finder.calc('sr', 10, 2.0, 2.04, 0.02);
  near(r.backWins.total, r.layWins.total, 'balanced');
  assert.ok(r.layWins.total > 9.5);
});

const ev = {
  home_team: 'A', away_team: 'B', commence_time: '2030-01-01T15:00:00Z', sport_title: 'X',
  bookmakers: [
    { key: 'betfair_ex_uk', title: 'Betfair', markets: [
      { key: 'h2h', outcomes: [{ name: 'A', price: 2.0 }, { name: 'Draw', price: 3.5 }, { name: 'B', price: 4.0 }] },
      { key: 'h2h_lay', outcomes: [{ name: 'A', price: 2.02 }, { name: 'Draw', price: 3.55 }, { name: 'B', price: 4.1 }] }] },
    { key: 'smarkets', title: 'Smarkets', markets: [
      { key: 'h2h', outcomes: [{ name: 'A', price: 1.99 }, { name: 'Draw', price: 3.5 }, { name: 'B', price: 4.0 }] },
      { key: 'h2h_lay', outcomes: [{ name: 'A', price: 2.04 }, { name: 'Draw', price: 3.6 }, { name: 'B', price: 4.05 }] }] },
    { key: 'skybet', title: 'Sky Bet', markets: [
      { key: 'h2h', outcomes: [{ name: 'A', price: 2.2 }, { name: 'Draw', price: 3.3 }, { name: 'B', price: 3.6 }] }] },
  ],
};
const cfg = { bankroll: 100, kellyFrac: 0.25, minEdge: 0.03, maxOdds: 10, minOdds: 1.5, skipBooks: [],
              commission: { betfair_ex_uk: 0.05, smarkets: 0.02 } };

test('fair probabilities use the best two-sided exchange price and sum to 1', () => {
  const p = Finder.fairProbs(ev);
  near(p.A + p.Draw + p.B, 1, 'sum');
  const rawA = (1 / 2.0 + 1 / 2.02) / 2;
  assert.ok(Math.abs(p.A - rawA) < 0.02);
});

test('value bets flag only the long bookmaker price', () => {
  const v = Finder.valueBets([ev], cfg);
  assert.deepStrictEqual(v.map(x => x.selection), ['A']);
  const p = Finder.fairProbs(ev).A;
  near(v[0].edge, p * 2.2 - 1, 'edge');
  const f = (p * 2.2 - 1) / 1.2;
  near(v[0].stake, Math.floor(Math.min(f * 0.25, 0.05) * 100 * 10) / 10, 'stake');
  assert.strictEqual(Finder.valueBets([ev], { ...cfg, skipBooks: ['skybet'] }).length, 0);
});

test('no fair price when the exchange spread is wide', () => {
  const wide = JSON.parse(JSON.stringify(ev));
  wide.bookmakers.forEach(b => b.markets.forEach(m => m.key === 'h2h_lay' && m.outcomes.forEach(o => { o.price *= 1.3; })));
  assert.strictEqual(Finder.fairProbs(wide), null);
});

test('lay matches pick the exchange that loses least after commission', () => {
  const m = Finder.layMatches([ev], cfg);
  const a = m.find(x => x.selection === 'A');
  // Betfair lay 2.02 at 5% vs Smarkets 2.04 at 2%
  const bf = Finder.calc('qual', 10, 2.2, 2.02, 0.05).backWins.total;
  const sm = Finder.calc('qual', 10, 2.2, 2.04, 0.02).backWins.total;
  assert.strictEqual(a.exch, sm > bf ? 'smarkets' : 'betfair_ex_uk');
  near(a.ql, Math.max(bf, sm), 'best qualifying result');
  assert.ok(a.ql > 0, 'a price above the lay is a profit');
});

console.log(`\n${passed} tests passed`);
