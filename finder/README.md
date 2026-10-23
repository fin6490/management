# Value & Reload Finder

A phone-friendly page that finds bets with a real edge. It doesn't place bets: you place them yourself, which keeps your bookmaker accounts within their terms.

The page has four tabs:

- **Scan**
  - *Value bets:* bookmaker prices longer than the exchange's fair price, with a stake sized for your bankroll (quarter Kelly, capped at 5%).
  - *Lay matches:* for each bookmaker price, the exchange lay that loses least on a £10 qualifying bet. It also shows how much of a free bet you'd lock in.
- **Calculator:** lay stake, liability and outcomes for a qualifying bet, a free bet where the stake isn't returned (SNR), or one where it is (SR).
- **Tracker:** log reloads, sign-ups and value bets, settle open bets, see running profit, and copy everything as CSV.
- **Settings:** odds API key, bankroll, minimum edge, exchange commission, and which bookmakers you have accounts with.

## Live odds

Live prices come from [The Odds API](https://the-odds-api.com). The free tier gives 500 credits a month, and each league scanned costs 2 credits. Paste the key in Settings; it's stored in your browser only.

The Claude artifact version can't load live odds, because the artifact preview blocks outside connections. There it shows example odds, and the calculator and tracker work normally. For live scans, open the page from GitHub Pages:

1. Merge this branch into `main`.
2. Go to repo **Settings → Pages**, set **Deploy from a branch**, then `main` / `root`.
3. Open `https://fin6490.github.io/management/finder/` on your phone and add it to your home screen.

## How the maths works

- **Fair price.** For each outcome, the page takes the midpoint between the best exchange back and lay prices (Betfair, Smarkets, Matchbook). It then scales the probabilities so they add up to 100%. A match is skipped if any outcome's back/lay gap is wider than 10%.
- **Value.** Edge = fair chance × bookmaker odds − 1. The page flags prices at or above the minimum edge (3% by default).
- **Lay stakes.**
  - Qualifying bet and free bet (stake returned): back stake × back odds ÷ (lay odds − commission).
  - Free bet (stake not returned): back stake × (back odds − 1) ÷ (lay odds − commission).

  Both are balanced, so the result is the same whichever side wins.

Run the tests with `node finder/test_finder.js`.

## Accounts

Every account must be opened and used by its own holder, with their own details and payment card. If your partner wants to do matched betting, they open and run their own accounts. The tracker's "Account holder" field keeps each person's results separate. Using someone else's identity or running their account breaks bookmaker terms, and winnings get voided.
