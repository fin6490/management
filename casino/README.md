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

Uncle Sal left you a silver dollar and a **$500,000 marker** owed to Vinnie "The Vig", a loan shark.
You start with $500 outside the Starlite Motel and work up from The Rusty Spur through the
Riverboat, the Gilded Palace and the Monte Royale Salon Privé. Better venues have higher limits and
better rules (S17, surrender, bigger craps odds, single-zero roulette).

### Sal's marker

The marker charges no interest as long as you pay Vinnie every week.

- **Weekly payments.** The amount grows as you come up in the world:

  | Chapter | Weekly payment |
  | --- | --- |
  | 1 | $1,500 |
  | 2 | $3,000 |
  | 3 | $10,000 |
  | 4 | $30,000 |
  | Legend | $60,000 |

- **Chapter one** ends when you make the first payment.
- **Paying more.** Anything over the weekly amount comes off the marker.
- **Missing a payment.**
  - Nico takes 30% of your wallet.
  - Three weeks' payments go on the marker.
  - You get a strike. Three strikes ends the career.
- **Where to see it.** The status screen shows how much is left and what's due this week. Vinnie's
  loan counter has a **Pay this week** button.
- **Achievements.** Like Clockwork for ten payments on time. Free and Clear for paying off every
  cent.

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

Every other building has an inside too, each with its own staff, locals and things to poke at:

- **Mel's Diner**: order at the counter, eye the pie case, play the jukebox and look at the old photo on the wall.
- **Quik-Stop**: snacks and drinks at the register or the cooler, today's paper and $5 scratch cards
  (three matching symbols wins).
- **Starlite Motel**: the front desk rents a room for the night; the lobby has an ice machine,
  vending machine, Sal's old Room 7 and your own Room 12.
- **Vinnie's Pawn & Loan**: the loan counter, cases of pawned treasures, and Vinnie himself leaning
  on the safe.
- **Lucky Strike Outfitters**: Rosa's counter, the racks, the showroom car and a full-length mirror.
- **Grand Hotel**: reception (a suite for the night), the lobby fountain, piano and elevator.
- **Downtown Apartments**: the mailboxes, your own front door once you rent a place, and the elevator.
- **Prime Cut Steakhouse**: the maître d', the lobster tank and the wine cellar.

Out on the street there's a newsstand, an ATM, a phone booth and the Lucky Park duck pond, and the
main roads are signposted. Tap 🗺️ (or press **M**, or ☰ → Town map) for a map of the whole town
with everywhere labelled and a marker where you're standing.

### Hunger, thirst and energy

Three bars drain as you walk and play. If any of them is empty you can't deal a new hand, and if
energy runs out while walking you pass out on the street (and someone goes through your pockets).

- **Eat and drink** at Mel's, the Quik-Stop, the steakhouse or any casino bar. Casino bars comp
  drinks once you've wagered 20x the table minimum that day.
- **Tiredness.** After about eight hours awake you start to get tired, and the end of your energy
  bar turns striped. Food and coffee can only refill the unstriped part; only sleep gives the rest
  back. By the small hours there's almost nothing left to refill, so plan to be in bed.
- **Caffeine** (coffee, soda, energy drinks, espresso) shares one tolerance for the day: the first
  two work fully, then each one does half as much, and past five you just get the jitters. The menus
  show what each drink is actually worth to you right now.
- **Sleep** to end the day. Where you sleep matters:
  - the Starlite Motel ($25) keeps you sharp for about 8 hours
  - your apartment for 9 hours
  - the Grand Hotel ($350) for 10 hours, and you wake with extra energy
  - the penthouse for 11 hours
  - a park bench is free but risky, and you wake up already tired
  
  Sleeping compounds loan interest, charges rent and pays your players club cash-back.
- A hand at the tables takes about four minutes of game time, so a full day is roughly 200 hands.

### Mood, drinks and the degen meter

A fourth HUD bar with a face tracks your **mood**. It drifts back toward "getting by" over the day.
These lift it:

- a good night in a real bed (the better the room, the bigger the lift)
- restaurant meals and pie
- a drink or two
- big wins and winning days

These wear it down:

- debt keeping you up at night
- hangovers and going hungry, thirsty or exhausted
- losing streaks
- sleeping rough

A happy player tires more slowly. A miserable one tires faster.

- **Booze** (beer, whiskey, cocktails, champagne) raises your **buzz**. You go from Merry to Tipsy,
  then Drunk, then Hammered. The first couple of drinks cheer you up, but after that they stop
  helping and start hurting.
  - Merry steadies your darts arm a touch.
  - Tipsy makes the screen sway.
  - Drunk drops the dealer hints, makes your darts wobble, and gets you turned away by the bouncers
    at the Gilded Palace and the Salon.
  - Drinking too much makes you black out.
  - Water and food sober you up, and buzz wears off by the hour.
  - Going to bed with a big buzz means a hangover in the morning.
- **Coffee.** Four caffeinated drinks in a day make you jittery: the HUD shakes, your mood dips and
  your darts get worse. Three or more coffees in a day also spoil that night's sleep.
- **The degen meter** rises when you play recklessly:
  - betting a big share of your bankroll
  - chasing losses
  - playing drunk or exhausted
  - playing the 3 AM session
  - gambling on the day you borrowed

  It cools off overnight. Your title goes Recreational → Regular → Grinder → Degenerate → Full Degen.
  The status screen shows all three gauges and what moved your mood lately. The end-of-day summary
  explains the night's changes.
- **The Degen Diaries.** Lonnie in town keeps a diary of legends. Start a page with him, then:
  - chase a loss back to even
  - win a hand while tipsy
  - play a hand between 4 and 6 AM
  - win with half your roll on one hand

  Do all four for $2,500 and the "In the Book" achievement.
- New achievements cover living well, rock bottom, your first hangover, the coffee jitters, a full
  degen and a clean week.

### People in town

- **Story characters** follow the chapters: Dolores (the Spur's bar), Doc (the Riverboat), Lucky Lou
  (the dock), Vinnie (inside his pawn shop), Nico (only when you're behind on a payment), Margot
  (the Palace) and Kessler (the Salon). A gold **!** marks them. Some offer side jobs for cash and
  swagger.
- **Rival gamblers** (red **♦**): Tex Calhoun, Mei "The Calculator" Lin, Baron von Hollow and Rico
  Suave each have a bankroll and a personality. Every day they show up at a different casino or
  around town, and they sometimes sit down at your table, bet alongside you and talk trash.
  ☰ → Status shows who's ahead.
- **Dealers** have names and personalities that fit their casino. Tap the 💬 button with the
  dealer's name at any table to chat; they know the table's rules and how your sitting is going.
- **Talk to anyone in your own words** with Claude. See [AI chat](#ai-chat) below.

### Friends

Dolores, Doc, Lucky Lou, Mick, Sparky and Margot each keep a friendship level with you:
Stranger → Acquaintance → Friend → Close friend → Family. The hearts in their chat window show
where you stand. You earn friendship by:

- stopping to talk (once a day)
- buying them something they like, such as Dolores's good bourbon or Doc's pie and coffee (once a
  day; the price grows with the story)
- finishing their side jobs
- hearing their whispers

Once they're your friend they treat you better:

| Person | Friend | Close friend |
| --- | --- | --- |
| Dolores | Spur drinks on the house | Shifts pay half as much again |
| Doc | You wake up in a better mood | The degen meter cools twice as fast |
| Lou | Paddlewheel Lounge drinks free | Lounge food free too |
| Mick | Steadier darts arm | Steadier still |
| Sparky | +$100 a day in slot tech tips | +$300 a day |
| Margot | Palace drinks free | +5 swagger |

Every Friend level also adds swagger, and so does every Close friend level. Friends open up in AI
chat, and each one has a personal side job that only appears once you're friends (the chat shows
🔒 until then). The status screen lists everyone you know. Achievements: Regular, Inner Circle and
Family.

### Side jobs

| From | Job | What to do |
| --- | --- | --- |
| Dolores | Twenty-One at the Spur | Win 15 blackjack hands at the Spur |
| Dolores | Big Night | Finish a day $5,000 up |
| Dolores | The Back Room | Refit the Spur's poker room |
| Dolores (friend) | Dolores's Night Off | Cover three of her bar shifts |
| Doc | Doc's sweet tooth | Bring him cherry pie |
| Doc | Three Card Monte | Win Pair Plus with a straight or better |
| Doc | Cash in the Back | Finish in the money in a Back Room tournament |
| Doc (friend) | A Letter for Lou | Carry his letter to Lou |
| Lou | Hot shooter | Make three points on one shooter |
| Lou | The Hard Way | Win a hardways bet |
| Lou (friend) | Storm Watch | Play 20 Riverboat rounds between 10 PM and 4 AM |
| Vinnie | Tex owes Vinnie | Beat the table while Tex is there |
| Vinnie | Vinnie's Number | Hit 17 straight up at roulette |
| Margot | Humble the Baron | Win three hands against him |
| Margot | Royal Treatment | Win UTH Trips with a flush or better |
| Margot (friend) | The Banker's Daughter | Win five Banker bets at the Palace |
| Mick | Darts ladder | Four darts jobs, ending in the Golden Arrow |
| Mick (friend) | Bar Legend | Win three darts money matches in a row |
| Sparky | Slots ladder | Four slots jobs |
| Sparky (friend) | Field Survey | 50 spins in each of three casinos |

Finish ten side jobs for the Odd Jobs achievement.

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
   vault, and choose what to do with what's inside. There are four endings. Bringing Kessler to
   justice pays about as well as taking his empire: a $5,000,000 whistleblower's reward and a
   court-appointed trusteeship of the Monte Royale worth $300,000 a day.

Rivals have their own arcs too: challenge any of them to a heads-up blackjack match from their
chat window.

**The Seventeen Postcards.** Once Oscar talks, postcards signed only "17" start reaching you.
- Each one is a different puzzle that points somewhere in town: a jukebox, a pawn ticket, a wine
  bin, a piano.
- Each one you solve gives up a keepsake from Sal's life and the next card.
- The trail ends with a tape Sal recorded for you. It only plays once you know the truth about him.
- Postcards and keepsakes live in the case file's **Postcards** tab, with a nudge if you're stuck.

### Whispers

Some people in town are holding a secret they'll only share if you ask about the right thing in
your own words. These secrets are called whispers.

- **Needs AI chat.** Each whisper needs AI chat switched on. None of them are needed to finish the
  story.
- **Where to find them.** The case file's **Whispers** tab lists who is holding something back,
  with a nudge about what to ask. Some only show up once the story has reached them.
- **What you get.** Each one is a piece of the town's past, plus some cash or a perk. Perks include:
  - $500 off your debt
  - free pie at Mel's for good
  - a steadier darts arm
- **Achievements.** Good Listener for your first whisper, All Ears for all nine.
- **How the game checks it.** The character tells the secret when you ask about the right thing.
  The game only counts it if your own question was actually about that topic, so you can't trick
  someone into handing it over.

### Your file

☰ → Your file lets you tell the town a few real things about yourself: first name, hometown,
birthday, your drink, and so on. All of it is optional. Characters use it: Dolores pours your
usual, Sal's postcards use your name, Kessler reads out his dossier on you at the final table, and
your real birthday throws a party at the Spur. It's stored only in this browser, never in save
files or exports. When AI chat is on, it is sent to Claude with each message so characters can
use it.

The town also knows about your betting-tool projects in this repository: the Auto-Dice
progression simulator, the Betfair value-betting bot and the Value & Reload Finder. Kessler's
dossier brings them up, Mei, Tex and Rico needle you about them at the tables, the Lucky Ledger
runs the odd story about a local tinkerer, and your laptop is open in **Room 12** at the Starlite
Motel. Untick the box in Your file to turn this off.

### Your look

New careers start at the mirror: pick your skin tone, hairstyle and colour, facial hair, glasses,
shirt and trousers, and which of your bought outfits, hats, shades and chains to wear. It changes
your walking sprite and your portrait. Change it any time at the full-length mirror in Lucky Strike
Outfitters or from ☰ → Your look.

Everyone in town has a drawn portrait now instead of an emoji (story characters, rivals, staff,
regulars and locals), and each table game has its own drawn crest on its sign and in the table
header.

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

When everyone left in a hand is all in, the hole cards turn face up and the board runs out one
street at a time, slowly enough to sweat. A showdown you played in waits for you to tap **Next
hand** (or press Space). Blinds and antes rise on a schedule. Players at the other tables bust out, and survivors move to
your table until it's the final table. Side pots, minimum raises and short all-ins follow the real
rules. Opponents play differently (nits, tight-aggressive regulars, calling stations, maniacs), and the rivals buy in
when they can afford it. The controls show pot odds, and you can size bets with the slider or the
½ pot, pot and all-in buttons. By default, once you fold, the rest of the hand plays out quickly.

### Darts at the Spur

There's a dartboard on the Rusty Spur's back wall, and Mick "The Arrow" Doyle, Sal's old hustling
partner, stands beside it. Walk up to the board, or talk to Mick and press **🎯 Play darts**.

- **How to throw**: two taps per dart. First a pointer sweeps around the board: tap (or press
  **Space**) to stop it on the number you want. Then a marker runs along that line in to the bull
  and back out: tap again to stop it on the ring you want. The thin outer ring is the double, the
  thin inner ring the treble, and the marker names the bed it's over. A steadier arm slows both
  sweeps down.
- **The rules** are regulation: a 451mm board, 501 or 301, double out, bust on 1 or below zero, and a
  bull-up to decide who throws first. The game suggests standard checkouts like T20 · T20 · Bull.
- **Your arm** steadies as you throw more darts. Custom flights and Sal's tungsten darts help, and
  being tired makes it shakier. **Around the Clock** is free practice.
- **Mick's side jobs**: beat Mick at 301 (he throws left-handed), win three money matches against
  the regulars (Benny the Barfly at $50, Shotgun Sheila at $250, the Professor at $1,000, and
  eventually Mick himself at $5,000) or any rival drinking at the Spur. Then buy back Sal's
  tungsten darts and win **the Golden Arrow**, an eight-player knockout ($2,000 entry, $18,000 to
  the winner) where Kessler's ringer, Dutch Joost, is the favourite. After that it runs every
  seventh day.
- Achievements include a 180, a 170 checkout ("The Big Fish") and a bullseye finish.

### Slots

Every casino has a bank of slot machines on its right-hand wall, each with its own theme, art, bets
and bonus:

| Machine | Where | Bets | Bonuses |
| --- | --- | --- | --- |
| Dusty Dollars | Rusty Spur | $0.25–$10 | Gold Rush Hold & Spin coins; Wanted poster pick-em; free spins with ×2/×3 wilds |
| Paddlewheel Gold | Riverboat | $1–$50 | The Paddlewheel wheel bonus (cash, 8 free spins, MAJOR, GRAND); free spins with a multiplier that grows with every win |
| Gilded Dragon | Palace | $5–$250 | Free spins with sticky expanding wild reels; Dragon Pearl Hold & Spin |
| Kessler's Vault | Salon | $25–$2,500 | Crack the Vault: open safes until three jackpots match; free spins with ×2/×3 wilds |

- **243 ways**: symbols pay left to right on adjacent reels, in any row. Wilds on reels 2 to 4.
- **Bonus symbols** on each of reels 1, 2 and 3 start the machine's bonus game. Each outcome is
  decided (and paid) the moment it triggers, so closing the app mid-bonus never costs you.
- **Hold & Spin**: 6 or more coins or pearls lock in with cash values and give you 3 respins, reset
  whenever one lands. They can carry the MINI (20× bet), MINOR (50×) or MAJOR (250×); fill all 15 for
  the GRAND (1,000×).
- **Sal's Lucky 17**: at random, one or two middle reels turn completely wild.
- **Gamble** ordinary wins on red or black (a fair 50/50), and **autoplay** 10 to 100 spins.
- **Mystery jackpots to target**: each casino has four must-hit-by meters (Copper, Silver, Gold,
  Diamond). Every spin by anyone feeds them, and each must hit before its cap, so a meter close to
  its cap is worth more than it costs to chase. Other players feed them overnight (and sometimes hit
  them); ☰ → Status shows each casino's hottest meter.
- **Return**: about 97–98% from the reels and features on every machine (`node tools/slots-sim.js`
  simulates them all: free spins about 1 in 100–120, Hold & Spin about 1 in 175, bonus games about 1
  in 420–510), plus about 2.6% from the mystery jackpots on average. That's roughly 100% overall, and
  more when you play a meter near its cap.
- **Sparky's side jobs**: Ignatius "Sparky" Vance, the fired slot tech by the Spur's slot row, secretly
  reflashed every machine in town. Play 100 spins, win a mystery jackpot, then buy the **Meter
  Reader** (it shows exactly what the next spin is worth), and finally hit a Gold or Diamond (or the
  GRAND) for $10,000.

### Legend goals

When the story ends, the game keeps going. ☰ → Status shows your legend goals: be worth $10M,
$100M, $1B and $10B, earn $1M a day from businesses, own every business in town, build The
Seventeen Resort & Casino, and win $1M on a single round. The Investments tab sells businesses
that pay out every night, from a stake in Mel's Diner up to the Salon itself. The Salon's tables
go up to $1,000,000 a hand.

### Everything else

- **Vinnie's Pawn & Loan**: pay Sal's marker, or borrow against a credit line that grows with your
  swagger (4% a day, compounding). Miss a weekly payment, or borrow too far past your line, and
  Nico pays a visit. Three strikes ends the career.
- **Lucky Strike Outfitters**: clothes and cars (swagger and energy), players club cards (nightly
  cash-back on everything you wager), strategy cards, the counting course, the Odds Book, the
  Jackpot Tracker, felts and card backs, and finally the deeds. Your clothes show on your character.
- **Spot for Doc's team** (talk to Doc on the Riverboat): a skill job for the middle of the
  career. Cards flash past and you keep the Hi-Lo running count (2 to 6 is +1, 7 to 9 is 0, tens,
  faces and aces are −1). An exact count earns Doc's full cut, one off earns 40%. Three tables,
  from one card at a time up to three at once; one paid shift a day, unlimited free practice, and
  the pay grows each chapter (up to $24,000 a shift before the ending).
- **☰ → Status**: story progress, trophies and stats.

**Free Play** opens every venue with all helpers on, no hunger or tiredness, and a refillable $10,000 bankroll (☰ → Status).

## AI chat

Everyone in town can talk back in their own voice: story characters, rivals, dealers (the 💬 button
at any table), the staff behind every counter (Mel, Raj at the Quik-Stop, the bartenders, Darlene at
the motel, Mr. Pemberton at the Grand, Rosa at the Outfitters), the townsfolk and the regulars by the
tables, and your darts and poker opponents (💬 Talk and 💬 Table talk). They know the story so far,
your bankroll and needs, what they sell, and the state of the game you're playing.

- **On claude.ai** (the published artifact): nothing to set up. The first time you chat, Claude asks
  for permission to answer from your account.
- **The installed app or GitHub Pages version**: you need your own Anthropic API key.
  1. Sign in at console.anthropic.com, add a payment method and buy some credits under Billing.
  2. Create a key under API Keys.
  3. In the game, open ☰ → AI chat (or press **Set up AI chat** in any chat window), paste the key
     and press **Test**. Each phone or browser needs the key once.

  Each reply costs roughly 1 to 2 cents. The key stays in that browser and is never saved into save
  files or exports.
- **Without either**, characters use their scripted lines and the whole game still works.

### Voice

☰ → AI chat → **Voice** turns on spoken replies. Story scenes can be read aloud too: the narrator,
Dolores, Kessler, Sal and the rest each get their own voice. Tap 🎤 in any chat to talk instead of
typing, or turn on **Hands-free** and the mic reopens after each reply. Tap 🔊 in a chat to mute it.

- **Device voices (free):**
  - Every character is cast to a different voice installed on your phone that fits their accent: a
    British voice for Kessler, Irish for Mick, French for Margot and Philippe.
  - Joke voices are skipped.
  - If the browser won't list its voices (common in iPhone home-screen apps), characters are still
    told apart by accent.
  - For better voices on iPhone, go to Settings → Accessibility → Spoken Content → Voices → English
    and download a few **Enhanced** or **Premium** voices in different accents.
- **Natural voices (optional):**
  - These use OpenAI's text-to-speech with your own key, and every character gets acting directions
    (accent, age, mood).
  - Paste the key under ☰ → AI chat → Voice. It stays in this browser and is never saved to save
    files or exports.
- **🎭 Voice cast** lets you hear each character and pick their voice yourself.

### Background sound

Each place has its own quiet soundscape, generated live:
- the Spur's murmur and clinking glasses
- the Riverboat's water and paddle thump
- the Palace's slot chimes
- the clock ticking in Vinnie's shop
- the motel sign's buzz
- wind in town by day, crickets at night

Turn it off with ☰ → Background sound.

### Music

Every casino has its own band, generated live in the browser (no audio files):

| Where | Style |
| --- | --- |
| The Rusty Spur | Honky-tonk piano shuffle |
| The Riverboat | Ragtime stride |
| The Gilded Palace | Lounge jazz on electric piano and vibes |
| The Salon Privé | Slow minor-key noir |
| Mel's Diner | Jukebox doo-wop |

The tunes follow each venue's chord changes and are built from short phrases that repeat and vary,
so they never loop exactly. The street stays quiet.

Turn the music off with ☰ → Music.

Table sounds:
- The roulette ball clicks round the rim, slows down and rattles into its pocket.
- Slot reels tick while they spin and land with a thunk.

### At the tables

- The top-right badge shows this sitting's profit and loss, split into **main** bets and **side** bets.
- After each round a results strip lists every bet you had down and what it did ("21+3 · Flush +$45"),
  and it stays up until the next round settles, so a side-bet win never flashes past.
- **×2** next to Rebet doubles every bet on the table (or rebets twice over).
- **Blackjack: play up to three hands** (Hands 1 / 2 / 3 in the table header). Each hand has its own
  bet; side bets ride on hand 1, insurance covers every hand, and splits work on every hand.
- Tap a player sitting at your table to talk to them.
- Craps shows the point, a coaching line that says what to do next, and the pass line's **Odds**
  bet right behind it (pays true odds, no house edge; it pulses when a point is set). Props and side
  bets fold away under "Props & side bets". On phones, roulette turns upright: three columns of
  numbers, twelve rows.
- The night ends at 4 AM: sleep before then. Dolores has one eight-hour shift a day, and energy
  drinks lose their kick after the second one.

## Saving

The game autosaves to browser storage after every round (three slots). Use **☰ → Export save file**
to download a backup `.json`, and **Import save file** on the title screen to load one, including
on another computer.

## Controls

Pick a chip in the rack, then click a betting spot to add it. Right-click (or long-press on touch)
removes the last chip. Keyboard shortcuts are shown on the action buttons (Space deals).

Everything works from the keyboard and with a screen reader: Tab moves between chips, betting
spots and buttons; the arrow keys change the selected chip; Enter or Space on a betting spot adds a
chip and Backspace takes one off. Each spot announces its name and current bet, and results and the
session profit and loss are read out as they change. On touch screens the buttons are sized for
fingers.
