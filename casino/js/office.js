/* Vinnie's back office: the door behind the pawn counter with the sign that says KNOCK. THEN LEAVE. Knock anyway; Nico lets
   you in, and Vinnie has three things for you, all of them risky:
   - The flip (once a week, while you owe Sal's marker): Sal's silver dollar. Heads, half the marker goes. Tails, it grows by
     half. Even money, enormous swings; he lets you save a copy of your game first.
   - An errand (once a day): carry something somewhere for him. Usually it pays; sometimes it goes wrong and costs you.
   - The ledger (once, while he takes a phone call): read it, and maybe learn what Vinnie did to Sal. If Nico catches you,
     there's a rudeness tax. */
const Office = (() => {
  const st = () => { const f = App.state.flags; if (!f.office) f.office = { visits: 0, flipDay: -99, errandDay: -99, ledger: 0, flips: 0, errands: 0 }; return f.office; };
  const marker = () => App.state.loans.find(l => l.id === 'sal' && l.balance > 0.005);
  const say = lines => UI.dialog(lines);
  const ch = () => App.state.chapter || 0;

  async function knock() {
    const o = st(), first = !o.visits; o.visits++; App.count('officeVisit'); App.save();
    if (first) await say([
      { who: 'narrator', text: 'You knock. Nothing. You knock again. The door opens four inches and fills with Nico.' },
      { who: 'nico', text: 'Sign says leave.' },
      { who: 'vinnie', text: '*from inside* Let the kid in, Nico. Family knocks twice.' },
      { who: 'narrator', text: 'A desk too big for the room. A safe. A painting of a racehorse. A ledger, open, face down. Vinnie doesn\'t get up.' },
    ]);
    Career.checkAchievements();
    for (;;) {
      const m = marker(), flipWait = o.flipDay + 7 - App.state.day, errandToday = o.errandDay === App.state.day;
      const c = await UI.modal({ title: '🚪 Vinnie\'s back office', body: h('div',
        h('p', RNG.pick(['"Sit. Don\'t touch the horse."', '"You\'re here, so you want something. Everybody wants something."', '"Nico, the door."'])),
        h('p.muted.small', 'Everything in here is a risk. If you\'re about to do something you can\'t take back, save a copy first (☰ → Save a copy to another slot).')),
        buttons: [
          { label: m ? (flipWait > 0 ? `🪙 The flip (again in ${flipWait} day${flipWait > 1 ? 's' : ''})` : '🪙 Flip for Sal\'s marker') : '🪙 The flip (no marker left)', value: 'flip', disabled: !m || flipWait > 0 },
          { label: errandToday ? '💼 An errand (tomorrow)' : '💼 Run an errand', value: 'errand', disabled: errandToday },
          { label: o.ledger ? '📒 The ledger (he keeps it closed now)' : '📞 Wait while he takes a call', value: 'ledger', disabled: !!o.ledger },
          { label: 'Leave', value: 'leave', cls: 'ghost' },
        ] });
      if (!c || c === 'leave') return say([{ who: 'vinnie', text: RNG.pick(['Close it on your way out.', 'Say hi to Dolores. Don\'t tell her I said hi.', 'Next time, knock once.']) }]);
      if (c === 'flip') await flip();
      if (c === 'errand') await errand();
      if (c === 'ledger') await ledger();
    }
  }

  /* ---------- the flip: Sal's silver dollar, for half the marker ---------- */
  async function flip() {
    const o = st(), m = marker(); if (!m) return;
    const half = Math.round(m.balance / 2);
    await say([{ who: 'vinnie', text: 'Sal\'s silver dollar. He flipped me for a bar tab once, in eighty-one, and won. I never forgot it.' },
      { who: 'vinnie', text: `Heads, I knock ${fmt(half)} off the marker. Tails, it goes up ${fmt(half)}. One flip a week. No crying.` }]);
    for (;;) {
      const go = await UI.modal({ title: '🪙 Double or nothing (nearly)', body: h('div', h('p', `The marker stands at ${fmt(m.balance)}.`), h('p', `Heads: ${fmt(m.balance - half)}. Tails: ${fmt(m.balance + half)}.`), h('p.muted.small', 'Even money. There\'s no taking it back once the coin is in the air.')),
        buttons: [{ label: 'Not today', value: 'no', cls: 'ghost' }, { label: '🗂️ Save a copy first', value: 'save' }, { label: 'Flip it', value: 'go', cls: 'primary' }] });
      if (go === 'save') { await Screens.slots('copy'); continue; }
      if (go !== 'go') return say([{ who: 'vinnie', text: 'Smart. Sal was never smart.' }]);
      break;
    }
    o.flipDay = App.state.day; o.flips++; App.count('officeFlips');
    const heads = RNG.chance(.5);
    await toss(heads);
    if (heads) { m.balance = Math.round((m.balance - half) * 100) / 100; if (m.weekly) m.weekly = Math.min(m.weekly, Math.ceil(m.balance)); App.count('officeHeads'); SFX.big(); }
    else { m.balance = Math.round((m.balance + half) * 100) / 100; App.count('officeTails'); SFX.lose(); }
    App.save(); Router.hud(); Career.checkAchievements();
    await say(heads ? [{ who: 'vinnie', text: '*He looks at it for a long time.* Sal\'s luck. It skips a generation and lands on you.' }, { who: 'narrator', text: `Sal's marker: ${fmt(m.balance)}.` }]
      : [{ who: 'vinnie', text: '*He pockets the coin.* Tails never fails, kid. Not for me.' }, { who: 'narrator', text: `Sal's marker: ${fmt(m.balance)}.` }]);
  }
  // the coin in the air
  function toss(heads) {
    return new Promise(res => {
      const coin = h('div.ofc-coin' + (heads ? '.heads' : '.tails'), h('i.f', '17'), h('i.b', '🦅'));
      const m = UI.modal({ title: '🪙', closable: false, body: h('div.ofc-toss', coin, h('p.ofc-res', '…')) });
      SFX.flip();
      setTimeout(() => { const r = document.querySelector('.ofc-res'); if (r) r.textContent = heads ? 'HEADS' : 'TAILS'; }, 1700);
      setTimeout(() => { m.close(); res(); }, 2600);
    });
  }

  /* ---------- an errand: usually it pays ---------- */
  const ERRANDS = [
    ['a shoebox to the Riverboat\'s purser', 'The purser counts it twice and gives you a cigar you don\'t smoke.', 'The purser isn\'t there. Lou is. Lou has questions, and so does the river police.'],
    ['an envelope to a man in the Grand Hotel bar', 'He tips you like you\'re the bellhop. You take it.', 'He isn\'t the man. The man was the one watching from the lobby. You lose the envelope, and then some.'],
    ['a word with Tex Calhoun about what he owes', 'Tex pays, mostly to stop you talking. Vinnie takes his cut and gives you yours.', 'Tex talks louder than you do, and his friends are bigger. It costs you to get out of the parking lot.'],
    ['a sealed crate from the motel to the pawn shop\'s back door', 'Heavy, clinking, none of your business. Delivered.', 'The crate breaks on the motel stairs. Darlene saw. Darlene wants paying.'],
  ];
  async function errand() {
    const o = st(), [what, good, bad] = RNG.pick(ERRANDS), pay = Math.round((1000 + 1500 * ch()) * (1 + RNG.float()));
    const c = await UI.modal({ title: '💼 An errand', body: h('div', h('p', `"Take ${what}. Don't open anything. Don't be clever."`), h('p.muted.small', `Pays about ${fmt(pay)}. It usually goes fine. Usually.`)),
      buttons: [{ label: 'Not today', value: false, cls: 'ghost' }, { label: 'Do it', value: true, cls: 'primary' }] });
    if (!c) return;
    o.errandDay = App.state.day; o.errands++;
    if (RNG.chance(.72)) { App.credit(pay); App.count('officeErrands'); Rel.add('vinnie', 2, 'an errand'); SFX.cash(); await say([{ who: 'narrator', text: good }, { who: 'vinnie', text: `${fmt(pay)}. You didn\'t open anything. I can tell.` }]); }
    else { const lost = Math.round(Math.min(App.state.bank * .15, 2500 + 2500 * ch())); App.state.bank = Math.max(0, Math.round((App.state.bank - lost) * 100) / 100); App.count('officeErrandsBad'); if (typeof Mood !== 'undefined') Mood.change(-5, 'a bad errand'); SFX.lose(); await say([{ who: 'narrator', text: bad }, { who: 'narrator', text: lost ? `It costs you ${fmt(lost)}.` : 'You get out with nothing but a story.' }, { who: 'vinnie', text: 'That\'s why it pays.' }]); }
    App.save(); Router.hud(); Career.checkAchievements();
  }

  /* ---------- the ledger: what Vinnie did ---------- */
  async function ledger() {
    const o = st();
    await say([{ who: 'narrator', text: 'The desk phone rings. Vinnie listens, says "Not here," and goes out to the shop to take it on the other line. Nico follows him to the door, and stands in it, facing out.' },
      { who: 'narrator', text: 'The ledger is right there. Face down. Open.' }]);
    const c = await UI.modal({ title: '📒 The ledger', body: h('p', 'Nico has his back to you. Probably.'), buttons: [{ label: 'Leave it', value: false, cls: 'ghost' }, { label: 'Turn it over', value: true, cls: 'primary' }] });
    if (!c) { o.ledger = 1; App.save(); return say([{ who: 'vinnie', text: '*coming back in* You didn\'t touch it. Good. Sal would\'ve touched it.' }]); }
    o.ledger = 1;
    if (RNG.chance(.6)) {
      App.count('officeLedger'); App.save(); Career.checkAchievements();
      return say([{ who: 'narrator', text: 'Columns of names and numbers in Vinnie\'s small, careful hand. Tex. The Baron. A page for Sal, in red, going back twenty years.' },
        { who: 'narrator', text: 'At the bottom of Sal\'s page, a different pen: "K. — paid in full. For the name of the man copying his books." Then, smaller: "God forgive me."' },
        { who: 'narrator', text: 'You turn it back over a second before the door opens. Vinnie looks at you, then at the ledger, then at you. He doesn\'t say anything. He doesn\'t have to.' }]);
    }
    const m = marker(), tax = m ? 10000 : Math.min(2500, App.state.bank);
    if (m) m.balance = Math.round((m.balance + tax) * 100) / 100; else App.state.bank = Math.round((App.state.bank - tax) * 100) / 100;
    App.count('officeCaught'); App.save(); Router.hud();
    return say([{ who: 'nico', text: '*very quietly, very close* Hands.' },
      { who: 'vinnie', text: `*from the doorway* That\'s ${fmt(tax)} for the rudeness, kid. ${m ? 'It\'s on the marker.' : 'Cash.'} Sal never learned either.` }]);
  }

  return { knock, st };
})();
