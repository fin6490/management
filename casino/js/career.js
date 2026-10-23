/* Career mode: characters, venues, shop items, loans, goals, story chapters and the day cycle. */
const CHARACTERS = {
  narrator: { name: '', face: '🎲', color: '#334' },
  me: { name: 'You', face: '🙂', color: '#2a6' },
  vinnie: { name: 'Vinnie "The Vig" Moretti', face: '🦈', color: '#7a2131' },
  dolores: { name: 'Dolores, bartender at the Spur', face: '💁‍♀️', color: '#a0522d' },
  doc: { name: '"Doc" Holloway', face: '🧓', color: '#3a5f8a' },
  margot: { name: 'Margot Laval', face: '💃', color: '#8a2be2' },
  kessler: { name: 'Augustus Kessler', face: '🎩', color: '#222' },
  nico: { name: 'Nico, Vinnie\'s muscle', face: '🦍', color: '#555' },
};

const VENUES = {
  spur: {
    name: 'The Rusty Spur', icon: '🤠', tag: 'Sticky floors, cheap beer, honest-ish dealers.',
    limits: { min: 5, max: 250 }, chips: [1, 5, 25, 100],
    games: ['bj', 'tcp', 'war', 'roulette', 'craps'],
    rules: {
      bj: { bjPays: 1.5, h17: true, das: false, surrender: false, maxHands: 3 },
      craps: { odds: 2, field2: 2, field12: 2 },
      roulette: { wheel: 'american' },
    },
    unlock: null,
  },
  riverboat: {
    name: "Lucky Lou's Riverboat", icon: '🛳️', tag: 'Paddle wheels, brass rails and a proper poker pit.',
    limits: { min: 10, max: 2000 }, chips: [5, 25, 100, 500],
    games: ['bj', 'uth', 'ms', 'tcp', 'lir', 'bac', 'craps', 'roulette', 'war'],
    rules: {
      bj: { bjPays: 1.5, h17: true, das: true, surrender: false, maxHands: 4 },
      craps: { odds: 345, field2: 2, field12: 3 },
      roulette: { wheel: 'american' },
      bac: { ez: false, commission: 0.05 },
    },
    unlock: { chapter: 1, item: 'suit', bank: 3000, text: 'Clear Sal\'s marker, own a Decent Suit and carry $3,000.' },
  },
  palace: {
    name: 'The Gilded Palace', icon: '🏛️', tag: 'Chandeliers, champagne, and a dress code.',
    limits: { min: 25, max: 10000 }, chips: [25, 100, 500, 1000, 5000],
    games: ['bj', 'uth', 'ms', 'tcp', 'lir', 'bac', 'craps', 'roulette', 'war'],
    rules: {
      bj: { bjPays: 1.5, h17: false, das: true, surrender: true, maxHands: 4 },
      craps: { odds: 10, field2: 3, field12: 3 },
      roulette: { wheel: 'european' },
      bac: { ez: true },
    },
    unlock: { chapter: 2, item: 'tux', bank: 25000, swagger: 25, text: 'Reach chapter 3, own a Tailored Tuxedo, 25 swagger, carry $25,000.' },
  },
  salon: {
    name: 'Monte Royale Salon Privé', icon: '💎', tag: 'No windows, no clocks, no limits worth mentioning.',
    limits: { min: 100, max: 100000 }, chips: [100, 500, 1000, 5000, 25000],
    games: ['bj', 'uth', 'ms', 'tcp', 'lir', 'bac', 'craps', 'roulette'],
    rules: {
      bj: { bjPays: 1.5, h17: false, das: true, surrender: true, maxHands: 4, rsa: true },
      craps: { odds: 100, field2: 3, field12: 3 },
      roulette: { wheel: 'french' },
      bac: { ez: false, commission: 0.04 },
    },
    unlock: { chapter: 3, item: 'platinum', bank: 250000, swagger: 60, text: 'Reach chapter 4, hold a Platinum Players Card, 60 swagger, carry $250,000.' },
  },
};

/* Shop items. swagger = reputation; perks unlock in-game helpers; stamina raises rounds per day;
   comp = cash-back on everything wagered, paid when you sleep; upkeep = cost per day. */
const ITEMS = {
  // Wardrobe
  blazer: { cat: 'Wardrobe', name: 'Thrift-Store Blazer', icon: '🧥', price: 150, swagger: 3, desc: 'Smells faintly of mothballs and ambition.' },
  shades: { cat: 'Wardrobe', name: 'Aviator Shades', icon: '🕶️', price: 400, swagger: 4, desc: 'Nobody can read your tells. You have so many tells.' },
  suit: { cat: 'Wardrobe', name: 'Decent Suit', icon: '👔', price: 1200, swagger: 6, desc: 'Required to board the Riverboat. Off the rack, but the right rack.' },
  fedora: { cat: 'Wardrobe', name: 'Felt Fedora', icon: '🎩', price: 900, swagger: 5, desc: 'Tip it to the dealer after a big hand.' },
  chain: { cat: 'Wardrobe', name: 'Gold Rope Chain', icon: '📿', price: 3500, swagger: 8, desc: 'Heavy enough to anchor the Riverboat.' },
  tux: { cat: 'Wardrobe', name: 'Tailored Tuxedo', icon: '🤵', price: 12000, swagger: 12, desc: 'The Gilded Palace dress code, and then some.' },
  watch: { cat: 'Wardrobe', name: 'Swiss Chronograph', icon: '⌚', price: 35000, swagger: 15, desc: 'Tells the time. Mostly tells everyone else you have money.' },
  ring: { cat: 'Wardrobe', name: 'Diamond Pinky Ring', icon: '💍', price: 90000, swagger: 20, desc: 'Catches the light on every double down.' },
  // Lifestyle
  apartment: { cat: 'Lifestyle', name: 'Downtown Apartment', icon: '🏢', price: 6000, swagger: 6, stamina: 30, upkeep: 60, desc: 'Better sleep than the motel. +30 stamina per day. $60/day rent.' },
  penthouse: { cat: 'Lifestyle', name: 'Strip Penthouse', icon: '🌆', price: 150000, swagger: 20, stamina: 80, upkeep: 600, requires: 'apartment', desc: 'Floor-to-ceiling neon. +80 stamina. $600/day upkeep.' },
  sedan: { cat: 'Lifestyle', name: 'Rusty Sedan', icon: '🚗', price: 2500, swagger: 3, stamina: 10, desc: 'Beats the bus. +10 stamina.' },
  muscle: { cat: 'Lifestyle', name: 'Cherry-Red Muscle Car', icon: '🏎️', price: 40000, swagger: 14, stamina: 10, requires: 'sedan', desc: 'Valet guys fight over it.' },
  limo: { cat: 'Lifestyle', name: 'Stretch Limo & Driver', icon: '🚙', price: 400000, swagger: 30, stamina: 30, upkeep: 300, requires: 'muscle', desc: 'Nap between casinos. +30 stamina. $300/day for the driver.' },
  // Gear (perks)
  stratcard: { cat: 'Gear', name: 'Basic Strategy Card', icon: '🃏', price: 200, perks: ['bjhint'], desc: 'Highlights the mathematically best blackjack play.' },
  oddsbook: { cat: 'Gear', name: 'Pit Boss Odds Book', icon: '📕', price: 600, perks: ['odds'], desc: 'Shows the exact return-to-player of every bet and side bet.' },
  pokerguide: { cat: 'Gear', name: "Doc's Poker Notebook", icon: '📓', price: 1500, perks: ['pokerhint'], desc: 'Strategy hints for Hold\'em, Mississippi Stud, Three Card Poker and Let It Ride.', requiresFlag: 'metDoc' },
  counting: { cat: 'Gear', name: "Doc's Card Counting Course", icon: '🧮', price: 5000, perks: ['count'], desc: 'Shows the Hi-Lo running and true count at blackjack.', requiresFlag: 'metDoc' },
  tracker: { cat: 'Gear', name: 'Jackpot Tracker App', icon: '📱', price: 2500, perks: ['tracker'], desc: 'Live return-to-player for every progressive meter. Bet when it goes green.' },
  silver: { cat: 'Gear', name: 'Silver Players Card', icon: '🥈', price: 800, comp: 0.0025, desc: '0.25% cash-back on everything you wager, paid nightly.' },
  gold: { cat: 'Gear', name: 'Gold Players Card', icon: '🥇', price: 15000, comp: 0.005, requires: 'silver', swagger: 5, desc: '0.5% cash-back on everything you wager.' },
  platinum: { cat: 'Gear', name: 'Platinum Players Card', icon: '💳', price: 120000, comp: 0.01, requires: 'gold', swagger: 10, desc: '1% cash-back on everything you wager. The Salon wants to see one.' },
  black: { cat: 'Gear', name: 'Black Card', icon: '🖤', price: 1500000, comp: 0.015, requires: 'platinum', swagger: 20, desc: '1.5% cash-back. They send a car.' },
  // Lucky charms (cosmetic swagger; the math does not care)
  rabbit: { cat: 'Charms', name: "Rabbit's Foot", icon: '🐇', price: 75, swagger: 1, desc: 'Statistically does nothing. You feel luckier anyway.' },
  dice: { cat: 'Charms', name: 'Fuzzy Dice', icon: '🎲', price: 120, swagger: 1, desc: 'For the rear-view mirror you do not have yet.' },
  cigar: { cat: 'Charms', name: 'Box of Havanas', icon: '🚬', price: 2000, swagger: 4, desc: 'Light one when the meter is green.' },
  // Table cosmetics
  feltBlue: { cat: 'Table Style', name: 'Royal Blue Felt', icon: '🟦', price: 300, felt: 'blue', desc: 'Swap the felt on every table you sit at.' },
  feltRed: { cat: 'Table Style', name: 'Crimson Felt', icon: '🟥', price: 300, felt: 'red', desc: 'Very Monte Carlo.' },
  feltBlack: { cat: 'Table Style', name: 'Black & Gold Felt', icon: '⬛', price: 5000, felt: 'black', desc: 'High-limit room energy.' },
  backBlue: { cat: 'Table Style', name: 'Blue Card Backs', icon: '🂠', price: 150, back: 'blue', desc: 'Classic blue diamond backs.' },
  backGold: { cat: 'Table Style', name: 'Gilded Card Backs', icon: '🌟', price: 4000, back: 'gold', desc: 'Gold leaf. Probably not real gold.' },
  // Deeds (story)
  spurDeed: { cat: 'Deeds', name: 'Deed to The Rusty Spur', icon: '📜', price: 1000000, swagger: 40, requiresChapter: 3, desc: 'Buy back the bar Sal lost. Rename it. Finish the story.' },
  palaceDeed: { cat: 'Deeds', name: 'Controlling Stake: The Gilded Palace', icon: '🏰', price: 25000000, swagger: 100, requires: 'spurDeed', desc: 'The final flex. Margot will want a word.' },
};
/* Food and drink. hunger/thirst/energy are how much each bar refills (bars run 0-100). */
const MENU = {
  coffee: { name: 'Coffee', icon: '☕', price: 3, thirst: 20, energy: 12, drink: true },
  water: { name: 'Bottled Water', icon: '💧', price: 2, thirst: 35, drink: true },
  soda: { name: 'Soda', icon: '🥤', price: 3, thirst: 30, energy: 4, drink: true },
  energy: { name: 'Lightning Energy Drink', icon: '⚡', price: 6, thirst: 15, energy: 35, drink: true },
  candy: { name: 'Candy Bar', icon: '🍫', price: 2, hunger: 12, energy: 4 },
  sandwich: { name: 'Gas-Station Sandwich', icon: '🥪', price: 7, hunger: 35 },
  breakfast: { name: 'Lumberjack Breakfast', icon: '🍳', price: 9, hunger: 45, thirst: 10, energy: 8 },
  burger: { name: 'Double Cheeseburger & Fries', icon: '🍔', price: 12, hunger: 60 },
  pie: { name: 'Slice of Cherry Pie', icon: '🥧', price: 5, hunger: 20 },
  shake: { name: 'Chocolate Milkshake', icon: '🥛', price: 6, hunger: 10, thirst: 25 },
  beer: { name: 'Draft Beer', icon: '🍺', price: 5, thirst: 30, energy: -3, drink: true },
  whiskey: { name: 'Whiskey, Neat', icon: '🥃', price: 9, thirst: 15, energy: -2, drink: true },
  nachos: { name: 'Loaded Nachos', icon: '🧀', price: 8, hunger: 35 },
  cocktail: { name: 'Riverboat Old Fashioned', icon: '🍹', price: 12, thirst: 30, drink: true },
  shrimp: { name: 'Shrimp Basket', icon: '🍤', price: 16, hunger: 45 },
  champagne: { name: 'Champagne', icon: '🥂', price: 35, thirst: 30, energy: 3, drink: true },
  espresso: { name: 'Double Espresso', icon: '☕', price: 8, thirst: 10, energy: 25, drink: true },
  buffet: { name: 'Palace Buffet', icon: '🍽️', price: 55, hunger: 100, thirst: 20 },
  martini: { name: 'Vesper Martini', icon: '🍸', price: 60, thirst: 30, drink: true },
  caviar: { name: 'Caviar Service', icon: '🥄', price: 400, hunger: 35, energy: 10 },
  wagyu: { name: 'Wagyu Sliders', icon: '🍔', price: 150, hunger: 75 },
  steak: { name: '32oz Tomahawk Steak', icon: '🥩', price: 120, hunger: 100, energy: 15 },
  lobster: { name: 'Lobster Thermidor', icon: '🦞', price: 95, hunger: 70 },
  wine: { name: 'Glass of Bordeaux', icon: '🍷', price: 30, thirst: 25, drink: true },
};
// places you can eat/drink. comp: drinks are free once you've wagered 20x the venue minimum today.
const PLACES = {
  diner: { name: "Mel's Diner", icon: '🍳', who: 'Mel', line: 'Sit anywhere, hon. Coffee\'s fresh-ish.', items: ['coffee', 'breakfast', 'burger', 'pie', 'shake'] },
  store: { name: 'Quik-Stop', icon: '🏪', who: 'Clerk', line: 'Lottery tickets are behind the counter. Kidding. We\'re sold out.', items: ['water', 'soda', 'energy', 'candy', 'sandwich'] },
  steak: { name: 'Prime Cut Steakhouse', icon: '🥩', who: 'Maître d\'', line: 'Your table is ready. It has been ready since you walked in looking like money.', items: ['steak', 'lobster', 'wine', 'water'] },
  bar_spur: { name: 'Spur Bar', icon: '🍺', npc: 'dolores', venue: 'spur', comp: true, job: true, line: 'What\'ll it be, sugar?', items: ['beer', 'whiskey', 'soda', 'nachos', 'water'] },
  bar_riverboat: { name: 'Paddlewheel Lounge', icon: '🍹', venue: 'riverboat', comp: true, line: 'Welcome aboard. Drinks are on the house for players.', items: ['cocktail', 'beer', 'coffee', 'shrimp', 'water'] },
  bar_palace: { name: 'Chandelier Bar', icon: '🥂', venue: 'palace', comp: true, line: 'Champagne, darling?', items: ['champagne', 'espresso', 'buffet', 'water'] },
  bar_salon: { name: 'Salon Privé Bar', icon: '🍸', venue: 'salon', comp: true, line: 'Mr. Kessler insists you want for nothing. Within reason.', items: ['martini', 'espresso', 'wagyu', 'caviar', 'water'] },
};
// where you can sleep. energy: fraction of max restored. cost is per night.
const LODGING = {
  motel: { name: 'Starlite Motel', icon: '🛏️', cost: 25, energy: 1, text: 'A bed, a buzzing sign, and a lock that mostly works.' },
  grand: { name: 'Grand Hotel Suite', icon: '🏨', cost: 350, energy: 1.25, hunger: 25, thirst: 25, text: 'Feather pillows and room-service breakfast. Wake up with extra energy.' },
  apartment: { name: 'Your Apartment', icon: '🏢', cost: 0, energy: 1.1, item: 'apartment', text: 'Your own place. Rent is paid daily.' },
  penthouse: { name: 'Your Penthouse', icon: '🌆', cost: 0, energy: 1.35, hunger: 20, thirst: 20, item: 'penthouse', text: 'The whole city glittering below. Wake up unstoppable.' },
  bench: { name: 'Park Bench', icon: '🪑', cost: 0, energy: 0.6, risky: true, text: 'Free. Cold. Somebody might lift your wallet while you sleep.' },
};

const ACHIEVEMENTS = [
  { id: 'first', name: 'First Hand', desc: 'Play your first round', test: () => App.state.stats.rounds >= 1, reward: 25 },
  { id: 'bj', name: 'Natural', desc: 'Get a blackjack', test: () => App.counter('blackjacks') >= 1, reward: 50 },
  { id: 'bj10', name: 'Twenty-One Club', desc: 'Get 10 blackjacks', test: () => App.counter('blackjacks') >= 10, reward: 250, swagger: 2 },
  { id: 'side25', name: 'Side Hustle', desc: 'Win a side bet paying 25 to 1 or better', test: () => App.counter('bigSide') >= 1, reward: 100, swagger: 1 },
  { id: 'prog', name: 'On the Meter', desc: 'Win any progressive payout', test: () => App.counter('progHits') >= 1, reward: 100 },
  { id: 'jackpot', name: 'JACKPOT', desc: 'Hit a percentage jackpot tier', test: () => App.counter('jackpots') >= 1, reward: 5000, swagger: 10 },
  { id: 'streak5', name: 'Heater', desc: 'Win 5 rounds in a row', test: () => App.state.stats.bestStreak >= 5, reward: 150, swagger: 1 },
  { id: 'streak10', name: 'On Fire', desc: 'Win 10 rounds in a row', test: () => App.state.stats.bestStreak >= 10, reward: 1000, swagger: 3 },
  { id: 'fire4', name: 'Fire Starter', desc: 'Make 4 unique points on a Fire Bet', test: () => App.counter('firePoints') >= 4, reward: 500, swagger: 2 },
  { id: 'royal', name: 'Royalty', desc: 'Make a royal flush in any poker game', test: () => App.counter('royals') >= 1, reward: 2500, swagger: 5 },
  { id: 'allgames', name: 'Renaissance Gambler', desc: 'Play every game at least once', test: () => Object.keys(GAMES).every(g => App.state.stats.perGame[g]), reward: 500, swagger: 3 },
  { id: 'wag10k', name: 'Action Player', desc: 'Wager $10,000 total', test: () => App.state.stats.wagered >= 10000, reward: 200 },
  { id: 'wag1m', name: 'Whale', desc: 'Wager $1,000,000 total', test: () => App.state.stats.wagered >= 1e6, reward: 10000, swagger: 8 },
  { id: 'big1k', name: 'Big Hit', desc: 'Win $1,000+ in one round', test: () => App.state.stats.biggestWin >= 1000, reward: 100, swagger: 1 },
  { id: 'big50k', name: 'Monster Hit', desc: 'Win $50,000+ in one round', test: () => App.state.stats.biggestWin >= 50000, reward: 2500, swagger: 5 },
  { id: 'debtfree', name: 'Clean Slate', desc: 'Owe nobody anything', test: () => App.state.day > 1 && App.debt === 0, reward: 100, swagger: 2 },
  { id: 'mill', name: 'Millionaire', desc: 'Hold $1,000,000 in your bankroll', test: () => App.state.bank >= 1e6, reward: 0, swagger: 10 },
];

/* Story chapters. goal() decides when the chapter is complete. */
const CHAPTERS = [
  {
    title: "Sal's Marker", goalText: "Pay off Uncle Sal's $2,500 marker to Vinnie (plus interest) before it comes due.",
    goal: () => !App.state.loans.find(l => l.id === 'sal'),
    intro: [
      { who: 'narrator', text: 'Uncle Sal left you three things: a silver dollar, a dented flask, and a debt.' },
      { who: 'vinnie', text: () => `So you're Sal's kid. ${App.state.name}, right? Sal owed me **$2,500**. Sal's not around, so now you owe me $2,500.` },
      { who: 'vinnie', text: 'I\'m a reasonable guy. **3% a day**, due in two weeks. You need more walking-around money, my door is always open. The interest is too.' },
      { who: 'me', text: 'I\'ve got $500 to my name.' },
      { who: 'vinnie', text: 'Then I suggest you get lucky. The Rusty Spur is down the street. Tell Dolores I sent you. Actually, don\'t.' },
      { who: 'dolores', text: 'Sal\'s kid? He used to say the side bets here were the best-kept secret in town. Maybe the paytables are softer than they look, sugar.' },
    ],
    outro: [
      { who: 'vinnie', text: 'Paid in full. Huh. Sal never managed that. Maybe you\'re smarter than him.' },
      { who: 'vinnie', text: 'Word of advice: the Riverboat\'s where the real action is. They don\'t let you on in a sweatshirt, though. Get a **Decent Suit**.' },
      { who: 'dolores', text: 'Before you go: Sal had a friend on that boat. Old guy, sharp eyes. Calls himself **Doc**. Find him.' },
    ],
  },
  {
    title: 'Riverboat Gambler', goalText: 'Board the Riverboat, find Doc, and build your bankroll to $25,000.',
    goal: () => App.state.flags.metDoc && App.state.bank >= 25000,
    intro: [
      { who: 'narrator', text: 'The Riverboat smells like brass polish and diesel. Somewhere a craps table is screaming.' },
      { who: 'doc', text: 'You\'ve got Sal\'s nose. And his silver dollar, I see. Sit. Let an old man buy you a drink.' },
      { who: 'doc', text: 'Sal was good. Too good. He figured out the meters on the progressives run hot, and he only bet them when the math said so. Then somebody took his bar.' },
      { who: 'doc', text: 'I can teach you what he knew. My **Poker Notebook** and **Counting Course** are for sale in the shop. Friends-and-family price, which is to say full price.' },
      { who: 'me', text: 'Who took his bar?' },
      { who: 'doc', text: 'Make some real money first. **$25,000**. Then we\'ll talk about Kessler.' },
    ],
    outro: [
      { who: 'doc', text: 'Twenty-five grand. Sal\'d be proud. Alright: Augustus Kessler. Owns the Monte Royale, owns half the town. He bought Sal\'s note from Vinnie and took the Rusty Spur.' },
      { who: 'margot', text: 'Talking about Augustus? Darling, everyone is. I\'m Margot. I run the floor at **The Gilded Palace**. You look like someone who could use a bigger table.' },
      { who: 'margot', text: 'Come by. Wear something worth looking at: a **Tailored Tuxedo**, at minimum. And bring a little swagger.' },
    ],
  },
  {
    title: 'The Gilded Palace', goalText: 'Take the Palace for $250,000, and earn a Platinum Players Card.',
    goal: () => App.state.bank >= 250000 && App.has('platinum'),
    intro: [
      { who: 'margot', text: 'Welcome to the Palace. S17, late surrender, 10x odds, and our craps field pays triple on the twelve. I spoil my players.' },
      { who: 'margot', text: 'Kessler only lets **Platinum** members into his Salon. Bank a quarter million and buy a card, and I\'ll make the introduction.' },
      { who: 'margot', text: 'Why help you? Let\'s just say Augustus and I have history. And I\'d love to see someone take a bite out of him.' },
    ],
    outro: [
      { who: 'margot', text: 'Platinum and a quarter million. I made the call. The Salon expects you.' },
      { who: 'kessler', text: 'So you\'re the nephew. Sal used to sit exactly where you\'re standing, right before he lost everything.' },
      { who: 'kessler', text: 'I\'ll sell you the Rusty Spur. For **one million dollars**. Earned at my tables. If you can manage it.' },
    ],
  },
  {
    title: 'The Salon Privé', goalText: 'Buy back the deed to The Rusty Spur ($1,000,000) from the shop.',
    goal: () => App.has('spurDeed'),
    intro: [
      { who: 'narrator', text: 'No windows. No clocks. Every bet in the room could buy a house.' },
      { who: 'kessler', text: 'One million. Not a dollar of it borrowed from Vinnie, I hope. Interest is such a vulgar way to lose.' },
    ],
    outro: [
      { who: 'kessler', text: 'Well. A deal is a deal. Sal would be... insufferable about this.' },
      { who: 'dolores', text: 'They\'re hanging the new sign now, sugar. "SAL\'S". First round\'s on you.' },
      { who: 'vinnie', text: 'For the record, kid, I always liked you. Interest-free loans for life. Kidding. 1%.' },
      { who: 'narrator', text: '🏆 **You beat the story!** Keep playing: the Salon is open, the meters keep climbing, and a stake in the Gilded Palace is still for sale...' },
    ],
  },
  { title: 'Legend', goalText: 'Free roam. Buy a controlling stake in The Gilded Palace if you dare.', goal: () => false, intro: [], outro: [] },
];

/* ---------- Career logic ---------- */
const Career = {
  swagger() {
    if (!App.state) return 0;
    let s = 0;
    for (const k in App.state.items) if (App.state.items[k] && ITEMS[k] && ITEMS[k].swagger) s += ITEMS[k].swagger;
    for (const a of ACHIEVEMENTS) if (App.state.achievements[a.id] && a.swagger) s += a.swagger;
    return s + (App.state.flags.bonusSwagger || 0);
  },
  staminaMax() {
    let s = 100; for (const k in App.state.items) if (App.state.items[k] && ITEMS[k] && ITEMS[k].stamina) s += ITEMS[k].stamina;
    return s;
  },
  compRate() {
    let c = 0.001; for (const k in App.state.items) if (App.state.items[k] && ITEMS[k] && ITEMS[k].comp) c = Math.max(c, ITEMS[k].comp);
    return c;
  },
  upkeep() { let u = 0; for (const k in App.state.items) if (App.state.items[k] && ITEMS[k] && ITEMS[k].upkeep) u += ITEMS[k].upkeep; return u; },
  creditLimit() { return 1000 + Career.swagger() * 400 + App.state.chapter * 5000; },
  vinnieRate() { return App.state.chapter >= 4 ? 0.01 : 0.04; },

  venueOpen(id) {
    const st = App.state; if (st.mode === 'free' || st.unlocked[id]) return true;
    return false;
  },
  venueReqs(id) { // list of [label, ok]
    const u = VENUES[id].unlock; if (!u) return [];
    const st = App.state, out = [];
    if (u.chapter) out.push([`Story: chapter ${u.chapter + 1}`, st.chapter >= u.chapter]);
    if (u.item) out.push([`Own ${ITEMS[u.item].name}`, App.has(u.item)]);
    if (u.bank) out.push([`Carry ${fmt(u.bank)}`, st.bank >= u.bank]);
    if (u.swagger) out.push([`${u.swagger} swagger`, Career.swagger() >= u.swagger]);
    return out;
  },
  tryUnlock(id) {
    const reqs = this.venueReqs(id);
    if (reqs.every(r => r[1])) { App.state.unlocked[id] = true; App.save(); return true; }
    return false;
  },

  checkAchievements() {
    for (const a of ACHIEVEMENTS) {
      if (App.state.achievements[a.id]) continue;
      let ok = false; try { ok = a.test(); } catch (e) { }
      if (ok) {
        App.state.achievements[a.id] = App.state.day;
        if (a.reward) App.credit(a.reward);
        UI.toast(`🏅 ${a.name}${a.reward ? ' · +' + fmt(a.reward) : ''}${a.swagger ? ' · +' + a.swagger + ' swagger' : ''}`, 'good');
        SFX.cash();
      }
    }
  },

  afterRound() {
    this.checkAchievements();
    if (App.state.mode !== 'career') return;
    this.checkChapter();
  },

  async checkChapter() {
    const st = App.state, ch = CHAPTERS[st.chapter];
    if (!ch || this._busy || !ch.goal()) return;
    this._busy = true;
    try {
      if (ch.outro.length) await UI.dialog(ch.outro);
      st.chapter++;
      const next = CHAPTERS[st.chapter];
      if (next) {
        App.news(`📖 Chapter ${st.chapter + 1}: ${next.title}`);
        UI.toast(`📖 New chapter: ${next.title}`, 'big');
      }
      App.save(); Router.refresh();
    } finally { this._busy = false; }
  },

  // chapter intros play the first time you walk into the venue they happen in
  async enterVenue(id) {
    const st = App.state; if (st.mode !== 'career') return;
    const idx = { riverboat: 1, palace: 2, salon: 3 }[id];
    if (!idx || st.chapter < idx || st.flags['intro_' + id]) return;
    st.flags['intro_' + id] = true;
    if (id === 'riverboat') st.flags.metDoc = true;
    App.save();
    await UI.dialog(CHAPTERS[idx].intro);
  },

  /* ---------- loans ---------- */
  borrow(amount) {
    const st = App.state;
    let l = st.loans.find(l => l.id === 'vinnie');
    if (!l) { l = { id: 'vinnie', label: 'Vinnie\'s walking-around money', balance: 0, rate: this.vinnieRate(), due: null, strikes: 0 }; st.loans.push(l); }
    l.balance = round2(l.balance + amount); l.rate = this.vinnieRate();
    App.credit(amount); App.count('borrowed', amount); App.save();
  },
  repay(loanId, amount) {
    const l = App.state.loans.find(l => l.id === loanId); if (!l) return;
    amount = Math.min(amount, l.balance, App.state.bank);
    if (amount <= 0) return;
    App.debit(amount); l.balance = round2(l.balance - amount);
    if (l.balance <= 0.005) App.state.loans = App.state.loans.filter(x => x !== l);
    App.save(); this.afterRound();
  },

  /* ---------- the day cycle ---------- */
  /* ---------- needs: hunger, thirst and energy (energy is state.stamina) ---------- */
  needsOn() { return App.state && App.state.mode === 'career'; },
  canPlay() {
    if (!this.needsOn()) return null;
    const st = App.state;
    if (st.stamina <= 0) return 'You\'re exhausted. Get some sleep (or an energy drink).';
    if (st.hunger <= 0) return 'You\'re starving. Go get something to eat.';
    if (st.thirst <= 0) return 'You\'re parched. Get a drink first.';
    return null;
  },
  // drain the bars. kind = 'round' (k = rounds) or 'step'
  drain(kind, k = 1) {
    if (!this.needsOn()) return;
    const st = App.state, starving = st.hunger <= 0 || st.thirst <= 0;
    const r = kind === 'round' ? { h: 0.8, t: 1.2, e: 1 } : { h: 0.04, t: 0.05, e: 0.02 };
    const before = { hunger: st.hunger, thirst: st.thirst, stamina: st.stamina };
    st.hunger = Math.max(0, st.hunger - r.h * k);
    st.thirst = Math.max(0, st.thirst - r.t * k);
    st.stamina = Math.max(0, st.stamina - r.e * k * (starving ? 3 : 1));
    const warn = { hunger: '🍔 You\'re getting hungry.', thirst: '💧 You\'re getting thirsty.', stamina: '⚡ You\'re getting tired.' };
    for (const key in warn) {
      const lim = key === 'stamina' ? st.staminaMax * 0.2 : 20;
      if (before[key] > lim && st[key] <= lim) UI.toast(warn[key], 'warn');
      if (before[key] > 0 && st[key] <= 0) UI.toast({ hunger: '🍔 Starving! You can\'t play until you eat.', thirst: '💧 Parched! You can\'t play until you drink.', stamina: '😴 Exhausted! Sleep or grab an energy drink.' }[key], 'warn');
    }
    Router.hud();
  },
  consume(id, placeId) {
    const m = MENU[id], st = App.state, place = PLACES[placeId];
    // a slice of pie for Doc's side job gets boxed up instead of eaten
    if (id === 'pie' && Quests.status('docPie') === 'active' && !st.flags.hasPie) {
      if (!App.debit(m.price)) { UI.toast('Not enough cash', 'warn'); return false; }
      st.flags.hasPie = true; SFX.cash(); UI.toast('🥧 Boxed up a slice for Doc', 'good'); App.save(); return true;
    }
    const free = this.isComped(place, m);
    if (!free && !App.debit(m.price)) { UI.toast('Not enough cash', 'warn'); return false; }
    if (m.hunger) st.hunger = clamp(st.hunger + m.hunger, 0, 100);
    if (m.thirst) st.thirst = clamp(st.thirst + m.thirst, 0, 100);
    if (m.energy) st.stamina = clamp(st.stamina + m.energy, 0, st.staminaMax + 40);
    SFX.cash(); UI.toast(`${m.icon} ${m.name}${free ? ' (comped)' : ''}`, 'good');
    App.save(); Router.hud(); return true;
  },
  isComped(place, m) {
    if (!place || !place.comp || !m.drink || !place.venue) return false;
    return App.state.today.wagered >= VENUES[place.venue].limits.min * 20;
  },

  /* ---------- the day cycle ---------- */
  async sleep(lodgingId) {
    const L = LODGING[lodgingId], st = App.state;
    if (L.cost && !App.debit(L.cost)) { UI.toast(`A night here costs ${fmt(L.cost)}`, 'warn'); return; }
    let robbed = 0;
    if (L.risky && st.bank > 20 && RNG.chance(0.3)) { robbed = round2(Math.min(st.bank * 0.15, 5000)); st.bank = round2(st.bank - robbed); }
    await this.endDay(L, robbed);
  },
  async passOut() {
    const st = App.state;
    const robbed = st.bank > 20 ? round2(Math.min(st.bank * 0.2, 10000)) : 0;
    st.bank = round2(st.bank - robbed);
    await UI.dialog([{ who: 'narrator', text: `You collapse on the sidewalk and sleep where you fall.${robbed ? ` When you wake up, **${fmt(robbed)}** is missing from your wallet.` : ''} Next time, find a bed before you hit empty.` }]);
    await this.endDay({ name: 'The sidewalk', energy: 0.5 }, 0);
  },
  async endDay(L = LODGING.motel, robbed = 0) {
    const st = App.state, lines = [];
    lines.push(['Today\'s result', fmt(st.today.net, { sign: true })]);
    const comp = round2(st.today.wagered * this.compRate());
    if (comp > 0) { App.credit(comp); lines.push(['Players club cash-back', fmt(comp, { sign: true })]); }
    if (L.cost) lines.push([L.name, fmt(-L.cost)]);
    const rent = this.upkeep();
    if (rent) { st.bank = round2(st.bank - Math.min(rent, st.bank)); lines.push(['Rent & staff', fmt(-rent)]); }
    if (robbed) lines.push(['Wallet lifted in your sleep', fmt(-robbed)]);
    let interest = 0;
    for (const l of st.loans) { const i = round2(l.balance * l.rate); l.balance = round2(l.balance + i); interest += i; }
    if (interest) lines.push(['Loan interest', fmt(-interest)]);
    st.day++; st.staminaMax = this.staminaMax(); st.stamina = Math.round(st.staminaMax * (L.energy || 1));
    st.hunger = clamp(st.hunger - 20 + (L.hunger || 0), 0, 100);
    st.thirst = clamp(st.thirst - 25 + (L.thirst || 0), 0, 100);
    st.today = { wagered: 0, net: 0, rounds: 0 };
    Progressives.dailyGrowth();
    Rivals.newDay();
    this.randomNews();
    App.save(); Router.hud();
    await UI.modal({
      title: `🌙 Night ${st.day - 1} · ${L.name}`, buttons: [{ label: `Wake up: Day ${st.day}`, cls: 'primary' }],
      body: h('div', h('table.paytable', lines.map(r => h('tr', h('td', r[0]), h('td.num', r[1])))),
        h('p.muted.small', `Energy ${Math.round(st.stamina)}/${st.staminaMax}. You wake up a little hungry and thirsty. Progressive meters grew overnight.`)),
    });
    await this.collections();
    Router.refresh();
  },

  randomNews() {
    const st = App.state;
    const hot = Progressives.KEYS.filter(k => Progressives.rtp(k) >= 1);
    const opts = [
      () => `📰 "Local man insists rabbit's foot is 'basically a strategy'". Experts disagree.`,
      () => `📰 Riverboat reports record craps roll: shooter held the dice for 47 minutes.`,
      () => `📰 Kessler Holdings posts another record quarter. "The house always wins," says Kessler.`,
      () => `📰 Vinnie Moretti seen buying a third boat. Nobody knows where the money comes from.`,
      () => `📰 The Gilded Palace unveils a new chandelier. It is, somehow, even bigger.`,
    ];
    if (hot.length) App.news(`📈 Word on the street: the ${PAY[hot[0]].prog.name} meter is running hot.`);
    else App.news(RNG.pick(opts)());
  },

  // Vinnie checks on overdue markers and anyone over their credit limit
  async collections() {
    const st = App.state;
    const overdue = st.loans.find(l => l.due && st.day > l.due);
    const vin = st.loans.find(l => l.id === 'vinnie');
    const over = vin && vin.balance > this.creditLimit() * 1.5;
    if (!overdue && !over) {
      const soon = st.loans.find(l => l.due && l.due - st.day <= 3 && l.due >= st.day);
      if (soon) UI.toast(`⏰ ${soon.label} is due on day ${soon.due}: ${fmt(soon.balance)}`, 'warn');
      return;
    }
    const target = overdue || vin;
    target.strikes = (target.strikes || 0) + 1;
    if (target.strikes >= 3) {
      await UI.dialog([
        { who: 'nico', text: 'Vinnie says this is the third time. Vinnie says there won\'t be a fourth.' },
        { who: 'narrator', text: '💀 **Game over.** You wake up on a bus out of town with a black eye and Sal\'s silver dollar. Load a save or start a new career.' },
      ]);
      st.flags.gameOver = true; App.save(); Router.go('title'); return;
    }
    const take = round2(st.bank * 0.3);
    const ownedLoseable = Object.keys(st.items).filter(k => st.items[k] && ITEMS[k] && ['Wardrobe', 'Charms'].includes(ITEMS[k].cat) && !['suit', 'tux'].includes(k));
    const lost = ownedLoseable.length ? RNG.pick(ownedLoseable) : null;
    st.bank = round2(st.bank - take);
    if (take > 0) target.balance = round2(Math.max(0, target.balance - take));
    if (lost) delete st.items[lost];
    target.balance = round2(target.balance * 1.15);
    if (target.due) target.due = st.day + 7;
    if (target.balance <= 0.005) st.loans = st.loans.filter(l => l !== target);
    await UI.dialog([
      { who: 'nico', text: `Vinnie\'s been patient. Vinnie is done being patient. (Strike ${target.strikes} of 3.)` },
      { who: 'narrator', text: `Nico "collects" **${fmt(take)}** from your wallet${lost ? ' and takes your **' + ITEMS[lost].name + '**' : ''}. A 15% late fee goes on the balance${target.due ? ', and the new due date is day ' + target.due : ''}.` },
    ]);
    App.save();
  },

  // if you're broke, Dolores always has a shift
  async oddJob() {
    const st = App.state;
    if (st.stamina < 40) { UI.toast('You\'re too tired to work a shift', 'warn'); return; }
    const pay = 120 + st.chapter * 80;
    st.stamina -= 40; st.hunger = Math.max(0, st.hunger - 15); st.thirst = Math.max(0, st.thirst - 15);
    App.credit(pay); App.count('shifts');
    await UI.dialog([{ who: 'dolores', text: `Grab an apron, sugar. Eight hours of washing glasses: **${fmt(pay)}** cash, and your feet will hate you.` }]);
    App.save(); Router.hud();
  },

  buy(id) {
    const it = ITEMS[id], st = App.state;
    if (!it || st.items[id]) return;
    if (!App.debit(it.price)) { UI.toast('Not enough bankroll', 'warn'); return; }
    st.items[id] = st.day;
    if (it.felt) st.equipped.felt = it.felt;
    if (it.back) st.equipped.back = it.back;
    st.staminaMax = this.staminaMax();
    SFX.cash(); UI.toast(`${it.icon} Bought ${it.name}`, 'good');
    App.save(); this.afterRound();
  },
  itemAvailable(id) {
    const it = ITEMS[id], st = App.state;
    if (it.requires && !st.items[it.requires]) return `Requires ${ITEMS[it.requires].name}`;
    if (it.requiresFlag && !st.flags[it.requiresFlag] && st.mode === 'career') return 'Meet Doc on the Riverboat first';
    if (it.requiresChapter && st.chapter < it.requiresChapter && st.mode === 'career') return 'Not for sale yet (story)';
    return null;
  },
};
