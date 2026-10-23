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

### People in town

- **Story characters** follow the chapters: Dolores (the Spur's bar), Doc (the Riverboat), Lucky Lou
  (the dock), Vinnie (outside his pawn shop), Nico (only when you're behind on a payment), Margot
  (the Palace) and Kessler (the Salon). A gold **!** marks them. Some offer side jobs for cash and
  swagger.
- **Rival gamblers** (red **♦**): Tex Calhoun, Mei "The Calculator" Lin, Baron von Hollow and Rico
  Suave each have a bankroll and a personality. Every day they show up at a different casino or
  around town, and they sometimes sit down at your table, bet alongside you and talk trash.
  ☰ → Status shows who's ahead.
- **Dealers** have names and personalities that fit their casino. Tap the 💬 button with the
  dealer's name at any table to chat; they know the table's rules and how your sitting is going.
- **Talk to anyone in your own words** with Claude. See [AI chat](#ai-chat) below.

### The Seventeenth Card

The story is a four-act mystery about what happened at Sal's last game. ☰ → Case file (or 🔎 on
the map) holds the case board: clues, statements and a timeline.

1. **The Last Hand.** Follow clues from Dolores and Doc, crack Sal's lockbox at the Starlite Motel
   and the cipher inside, get a frightened dealer to talk by showing him the right evidence, and
   accuse the culprit with the right method and proof.
2. **The Ledger.** Take statements around town and break them by presenting the evidence that
   contradicts them. Who you trust and what you keep (or burn) are remembered.
3. **The Code.** Eight digits open Kessler's vault. Each pair is hidden in a different puzzle: a
   coin, a bead road, Sal's last dice, and a stacked shoe you have to read 17 cards deep.
4. **The Invitational.** A $100,000 buy-in night at the Salon. Beat Kessler heads-up, open the
   vault, and choose what to do with what's inside. There are four endings.

Rivals have their own arcs too: challenge any of them to a heads-up blackjack match from their
chat window.

### Your file

☰ → Your file lets you tell the town a few real things about yourself: first name, hometown,
birthday, your drink, and so on. All of it is optional. Characters use it: Dolores pours your
usual, Sal's postcards use your name, Kessler reads out his dossier on you at the final table, and
your real birthday throws a party at the Spur. It's stored only in this browser, never in save
files or exports. When AI chat is on, it is sent to Claude with each message so characters can
use it.

### The Back Room (poker)

From the Riverboat chapter on, Dolores has a side job: buy the Back Room Refit (Lucky Strike Outfitters →
Investments) and a door opens behind the Spur's bar. Inside are real no-limit hold'em tournaments:

| Tournament | Buy-in | Field | Notes |
| --- | --- | --- | --- |
| Back Room Sit & Go | $100 + $10 | 6 | One table, top two paid |
| Nine-Handed Turbo | $1,000 + $100 | 9 | Top three paid |
| The Spur Daily | $5,000 + $500 | 27 | Three tables |
| The Tenth-Day Major | $50,000 + $5,000 | 45 | Every tenth day, from the Palace chapter |
| High Roller | $500,000 + $25,000 | 18 | From the Salon chapter |
| Super High Roller | $5,000,000 + $100,000 | 9 | After the story ends |

Blinds and antes rise on a schedule. Players at the other tables bust out, and survivors move to
your table until it's the final table. Side pots, minimum raises and short all-ins follow the real
rules. Opponents play differently (nits, tight-aggressive regulars, calling stations, maniacs), and the rivals buy in
when they can afford it. The controls show pot odds, and you can size bets with the slider or the
½ pot, pot and all-in buttons. By default, once you fold, the rest of the hand plays out quickly.

### Legend goals

When the story ends, the game keeps going. ☰ → Status shows your legend goals: be worth $10M,
$100M, $1B and $10B, earn $1M a day from businesses, own every business in town, build The
Seventeen Resort & Casino, and win $1M on a single round. The Investments tab sells businesses
that pay out every night, from a stake in Mel's Diner up to the Salon itself. The Salon's tables
go up to $1,000,000 a hand.

### Everything else

- **Vinnie's Pawn & Loan**: borrow against a credit line that grows with your swagger. Miss a due
  date, or borrow too far past your line, and Nico pays a visit. Three strikes ends the career.
- **Lucky Strike Outfitters**: clothes and cars (swagger and energy), players club cards (nightly
  cash-back on everything you wager), strategy cards, the counting course, the Odds Book, the
  Jackpot Tracker, felts and card backs, and finally the deeds. Your clothes show on your character.
- **☰ → Status**: story progress, trophies and stats.

**Free Play** opens every venue with all helpers on, no hunger or tiredness, and a refillable $10,000 bankroll (☰ → Status).

## AI chat

Every character and dealer can talk back in their own voice, and they know the story so far.

- **On claude.ai** (the published artifact): nothing to set up. The first time you chat, Claude asks
  for permission to answer from your account.
- **The installed app or GitHub Pages version**: you need your own Anthropic API key.
  1. Sign in at console.anthropic.com, add a payment method and buy some credits under Billing.
  2. Create a key under API Keys.
  3. In the game, open ☰ → AI chat, paste the key and press **Test**.

  Each reply costs roughly 1 to 2 cents. The key stays in that browser and is never saved into save
  files or exports.
- **Without either**, characters use their scripted lines and the whole game still works.

## Saving

The game autosaves to browser storage after every round (three slots). Use **☰ → Export save file**
to download a backup `.json`, and **Import save file** on the title screen to load one, including
on another computer.

## Controls

Pick a chip in the rack, then click a betting spot to add it. Right-click (or long-press on touch)
removes the last chip. Keyboard shortcuts are shown on the action buttons (Space deals).
