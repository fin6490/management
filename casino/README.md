# High Roller

A casino table-games app with a career mode. Open `index.html` in any modern browser: no install,
no build step, no internet needed. Everything runs from local files.

## Install on your phone

High Roller is an installable web app: once it's hosted, add it to your home screen and it runs
full-screen and offline like a native app.

1. Host it with GitHub Pages: in the repo go to **Settings → Pages**, set **Source** to *Deploy from a
   branch*, pick `main` and `/ (root)`, and save. After a minute it's live at
   `https://<your-github-username>.github.io/<repo>/casino/`.
2. Open that link on your phone.
   - **iPhone (Safari):** Share button → **Add to Home Screen**.
   - **Android (Chrome):** ⋮ menu → **Install app** (or **Add to Home screen**).
3. Launch it from the icon. After the first launch it works with no connection.

Saves live on the phone. Export a backup from **☰ → Export save file** now and then.

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
with $500 outside the Starlite Motel, clear the debt, then work up from The Rusty Spur through the
Riverboat, the Gilded Palace and the Monte Royale Salon Privé. Better venues have higher limits and
better rules (S17, surrender, bigger craps odds, single-zero roulette).

### Walking around

The game is a top-down town you walk around. Use the arrow keys or WASD (the on-screen pad on a
phone), **Space / A** to talk, sit down or buy, and hold **Shift / B** to run.

- **Old Town**: The Rusty Spur, Mel's Diner, the Quik-Stop, the Starlite Motel, Vinnie's Pawn &
  Loan and Lucky Strike Outfitters.
- **Riverfront**: Lucky Lou's Riverboat at the east dock, the Grand Hotel and Downtown Apartments.
- **The Strip**: The Gilded Palace and the Monte Royale.
- **Lucky Park** and **Prime Cut Steakhouse** to the south.

Walk through a door to go in. Inside a casino, walk up to a dealer and press A to sit down at that
table; the bar is on the left wall, and the story characters are on the floor.

### Hunger, thirst and energy

Three bars drain as you walk and play. If any of them is empty you can't deal a new hand, and if
energy runs out while walking you pass out on the street (and someone goes through your pockets).

- **Eat and drink** at Mel's, the Quik-Stop, the steakhouse or any casino bar. Casino bars comp
  drinks once you've wagered 20x the table minimum that day.
- **Sleep** to end the day: the Starlite Motel ($25), the Grand Hotel ($350, you wake with extra
  energy), your own apartment or penthouse once you buy one, or a park bench (free, risky).
  Sleeping compounds loan interest, charges rent and pays your players club cash-back.

### Everything else

- **Vinnie's Pawn & Loan**: borrow against a credit line that grows with your swagger. Miss a due
  date, or borrow too far past your line, and Nico pays a visit. Three strikes ends the career.
- **Lucky Strike Outfitters**: clothes and cars (swagger and energy), players club cards (nightly
  cash-back on everything you wager), strategy cards, the counting course, the Odds Book, the
  Jackpot Tracker, felts and card backs, and finally the deeds. Your clothes show on your character.
- **☰ → Status**: story progress, trophies and stats.

**Free Play** opens every venue with all helpers on, no hunger or tiredness, and a refillable $10,000 bankroll (☰ → Status).

## Saving

The game autosaves to browser storage after every round (three slots). Use **☰ → Export save file**
to download a backup `.json`, and **Import save file** on the title screen to load one, including
on another computer.

## Controls

Pick a chip in the rack, then click a betting spot to add it. Right-click (or long-press on touch)
removes the last chip. Keyboard shortcuts are shown on the action buttons (Space deals).
