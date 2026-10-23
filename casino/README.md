# High Roller

A casino table-games app with a career mode. Open `index.html` in any modern browser: no install,
no build step, no internet needed. Everything runs from local files.

## Games

| Game | Side bets / progressive |
| --- | --- |
| Blackjack (6 decks, splits, doubles, surrender, insurance) | Perfect Pairs, 21+3, Blazing 7s jackpot |
| Ultimate Texas Hold'em | Trips, Pocket Bonus, Hold'em jackpot |
| Mississippi Stud | 3-Card Bonus, Stud jackpot |
| Three Card Poker | Pair Plus, 6-Card Bonus, Mini Royal jackpot |
| Let It Ride | 3-Card Bonus |
| Baccarat (commission or EZ) | Player/Banker Pair, Dragon 7, Panda 8, Four of a Kind jackpot |
| Craps | Odds up to 100x, come bets, place bets, true-odds props, Fire Bet, All/Tall/Small |
| Roulette (American, European, French La Partage) | Inside and outside bets |
| Casino War | Tie / suited tie |

### Player-friendly odds

The side bets use paytables no real casino would offer. Most return 98.5–100.6%, and craps props
pay true odds. Progressive jackpots start a little under break-even; each one goes positive once its
meter climbs past a certain point (the Jackpot Tracker item shows the live return). The figures come
from an exact calculation, not a simulation:

```
node casino/tools/odds.js   # prints every return-to-player and regenerates js/rtp.js
```

Edit `js/paytables.js` and re-run the script to rebalance anything.

## Career mode

Uncle Sal left you a silver dollar and a $2,500 marker owed to Vinnie "The Vig", a loan shark. Start
at The Rusty Spur with $500, clear the debt, then work up through the Riverboat, the Gilded Palace
and the Monte Royale Salon Privé. Better venues have higher limits and better rules (3:2 vs. S17,
surrender, bigger craps odds, single-zero roulette).

- **Days and stamina**: every round uses stamina. Sleep to end the day; interest compounds and rent
  is due. Coffee and energy drinks buy more rounds.
- **Vinnie's Back Room**: borrow against a credit line that grows with your swagger. Miss a due
  date, or borrow too far past your line, and Nico pays a visit. Three strikes ends the career.
- **Lucky Strike Outfitters**: clothes and cars (swagger and stamina), players club cards (nightly
  cash-back on everything you wager), strategy cards, counting course, the Odds Book, the Jackpot
  Tracker, felts and card backs, and finally the deeds.
- **Trophy Room**: achievements that pay cash and swagger.

**Free Play** opens every venue with all helpers on and a refillable $10,000 bankroll.

## Saving

The game autosaves to browser storage after every round (three slots). Use **☰ → Export save file**
to download a backup `.json`, and **Import save file** on the title screen to load one, including
on another computer.

## Controls

Pick a chip in the rack, then click a betting spot to add it. Right-click (or long-press on touch)
removes the last chip. Keyboard shortcuts are shown on the action buttons (Space deals).
