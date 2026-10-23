/* "The Last Hand": a mystery running alongside the story. Sal swore his last game at Kessler's
   Salon was rigged. Collect clues around town, crack a lockbox and a cipher, get a witness to
   talk, and accuse the right person, method and proof. Solving it forces Kessler to halve the
   price of the Rusty Spur's deed. */
const CLUES = {
  key: { icon: '🗝️', name: "Sal's locker key", text: 'A brass key stamped "STARLITE 7". Dolores says Sal kept a lockbox at the Starlite Motel and swore his last game was crooked.' },
  photo: { icon: '📷', name: 'Birthday photo', text: 'Doc\'s photo of Sal at his 50th birthday party, dated June 17. Sal is grinning in front of a cake shaped like a poker chip.' },
  card: { icon: '🂭', name: 'Marked Queen of Spades', text: 'Found in Sal\'s lockbox. Tiny pinpricks along one edge, so someone could feel it in the dark. The back carries the Monte Royale crest.' },
  note: { icon: '📜', name: "Sal's coded note", text: 'Also in the lockbox: scrambled capital letters in Sal\'s handwriting. Underneath: "Shift back by the decks in Kessler\'s shoe."' },
  decoded: { icon: '🔓', name: 'Decoded note', text: 'KESSLER BROUGHT HIS OWN DECKS. OSCAR DEALT. HE WAS PAID IN BLUE.' },
  oscar: { icon: '🗣️', name: "Oscar's confession", text: 'Oscar dealt Sal\'s last hand at the Salon. Kessler brought his own marked decks and paid Oscar with a blue chip from his private set. Oscar later lost the chip to Rico Suave in a side bet.' },
  chip: { icon: '🔵', name: 'The blue chip', text: 'A blue $10,000 chip engraved "A.K. PRIVATE": Kessler\'s payment to Oscar for dealing marked cards.' },
};
const PLAIN = 'KESSLER BROUGHT HIS OWN DECKS. OSCAR DEALT. HE WAS PAID IN BLUE.';
const SHIFT = 6; // every blackjack shoe in town, the Salon's included, holds six decks
const caesar = (txt, k) => txt.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k + 260) % 26 + 65));
const CIPHER = caesar(PLAIN, SHIFT);
const OSCAR_ID = 'dealer:palace:bj';

const Mystery = {
  st() { const s = App.state; if (!s.mystery) s.mystery = { clues: {}, solved: false }; return s.mystery; },
  has(k) { return !!this.st().clues[k]; },
  started() { return this.has('key'); },
  give(k, quiet) {
    if (this.has(k)) return;
    this.st().clues[k] = App.state.day;
    if (!quiet) { UI.toast(`🔎 New clue: ${CLUES[k].icon} ${CLUES[k].name}`, 'big'); SFX.win(); }
    App.news(`🔎 Clue found: ${CLUES[k].name}.`);
    App.save();
  },
  lead() {
    if (this.st().solved) return 'Case closed. Kessler rigged Sal\'s last game, and now he knows that you know.';
    if (!this.has('key')) return 'Dolores at the Rusty Spur knew Sal better than anyone. Ask her about him (the bar menu has a Talk option).';
    if (!this.has('photo')) return 'Sal\'s lockbox at the Starlite Motel has a 4-digit lock labelled "my birthday, backwards". Someone who knew Sal for decades might have a photo from his birthday. Doc lives on the Riverboat.';
    if (!this.has('card')) return 'You know Sal\'s birthday. Walk into the Starlite Motel and open his lockbox. Months and days are written MMDD.';
    if (!this.has('decoded')) return 'Decode Sal\'s note (Case file → Decode). The hint says to shift back by the number of decks in Kessler\'s blackjack shoe. The Paytables button at any blackjack table tells you how many decks there are.';
    if (!this.has('oscar')) return 'Find the dealer named in the note. A man like that gets fired and moves somewhere fancy, maybe the blackjack table at the Gilded Palace. He won\'t talk without proof that would scare him.';
    if (!this.has('chip')) return 'Rico Suave won the blue chip from Oscar. Find Rico (☰ → Status shows where the rivals are today) and talk to him. He loves to brag about his lucky number when he wins big.';
    return 'You have everything. Confront Kessler at the Monte Royale Salon Privé. Name the culprit, the method, and the proof.';
  },

  /* ---------- what characters say first, when the case gives them something to say ---------- */
  opener(id) {
    const m = this.st();
    if (m.solved) return null;
    if (id === 'dolores' && !this.has('key')) {
      this.give('key');
      return 'Sal swore on his mother that his last game at Kessler\'s Salon was crooked. Nobody believed him. He kept a lockbox in room 7 at the Starlite. Here, sugar: his key. Maybe you can prove it.';
    }
    if (id === 'doc' && this.has('key') && !this.has('photo')) {
      this.give('photo');
      return 'A lockbox with a birthday code? That\'s Sal all over. Here, look at this photo: his fiftieth. June the seventeenth. Best cake I ever ate, shaped like a poker chip.';
    }
    if (id === OSCAR_ID && this.has('decoded') && !this.has('oscar')) return 'I... I don\'t know anything about the Salon. I just deal cards here now. Bets, please.';
    if (id === 'rico' && this.has('oscar') && !this.has('chip')) return 'The blue chip? Ha! I won it fair and square from that nervous dealer. You want it? Tell me my lucky number, papi. If you\'ve been paying attention, you know it.';
    if (id === 'kessler' && this.has('chip')) return 'You have the look of someone who thinks they\'re holding a card. Go on, then. Accuse me of something.';
    return null;
  },

  /* ---------- puzzle widgets inside a conversation ---------- */
  panel(id, api) {
    const m = this.st();
    if (m.solved) return null;
    if (id === OSCAR_ID && this.has('decoded') && !this.has('oscar')) {
      const box = h('div.job-card', h('b', '🔎 Show Oscar some evidence'), h('p.muted.small', 'Pick the one thing that proves the Salon game was rigged.'));
      const row = h('div.ev-row');
      for (const k of ['key', 'photo', 'card', 'note', 'decoded'].filter(k => this.has(k))) {
        row.append(h('button.btn.sm', { onclick: () => {
          if (k === 'card') {
            this.give('oscar');
            api.say('*goes pale* That\'s one of the Salon decks. All right. Kessler brought his own cards that night and I dealt them. He paid me with a blue chip from his private set. I lost it to Rico Suave in a stupid side bet. Please, don\'t tell anyone it came from me.');
            box.remove();
          } else api.say(k === 'photo' ? 'A birthday party? So Sal liked cake. That proves nothing.' : k === 'key' ? 'A motel key. Congratulations.' : 'Scribbles on paper. Anyone could write that.');
        } }, CLUES[k].icon + ' ' + CLUES[k].name));
      }
      box.append(row); return box;
    }
    if (id === 'rico' && this.has('oscar') && !this.has('chip')) {
      const inp = h('input.field.sm#rico-guess', { inputmode: 'numeric', placeholder: 'Number', maxlength: 12 });
      const box = h('div.job-card', h('b', '🔎 Rico\'s riddle: "What\'s my lucky number?"'),
        h('form.ev-row', { onsubmit: e => {
          e.preventDefault();
          const v = inp.value.trim().toLowerCase();
          if (v === '17' || v === 'seventeen') {
            this.give('chip');
            api.say('SEVENTEEN! You listen! Here, take the ugly blue chip. It\'s bad juju anyway. Every time I touch it, I lose.');
            box.remove();
          } else { api.say(`${inp.value}? Nope. Watch me play sometime, papi. I shout it when I win big.`); inp.value = ''; }
        } }, inp, h('button.btn.sm.primary', 'Answer')));
      return box;
    }
    if (id === 'kessler' && this.has('chip')) {
      return h('div.job-card', h('b', '🔎 Confront Kessler'), h('p.muted.small', 'Name who rigged Sal\'s last game, how, and what proves it.'),
        h('button.btn.sm.primary', { onclick: () => this.accuse(api) }, 'Make the accusation'));
    }
    return null;
  },

  async accuse(api) {
    const m = this.st(), st = App.state;
    if (m.lastAccuse === st.day) { api.say('You\'ve made your little speech today. Come back when you have something new.'); return; }
    const sel = (id, opts) => h('select.field#' + id, opts.map(o => h('option', { value: o[0] }, o[1])));
    const who = sel('acc-who', [['', 'Choose…'], ['kessler', 'Augustus Kessler'], ['vinnie', 'Vinnie Moretti'], ['oscar', 'Oscar the dealer'], ['margot', 'Margot Laval']]);
    const how = sel('acc-how', [['', 'Choose…'], ['cards', 'Marked cards'], ['dice', 'Loaded dice'], ['wheel', 'A rigged roulette wheel'], ['shuffle', 'A tampered shuffle machine']]);
    const proof = sel('acc-proof', [['', 'Choose…'], ...Object.keys(CLUES).filter(k => this.has(k)).map(k => [k, CLUES[k].icon + ' ' + CLUES[k].name])]);
    const body = h('div', h('label.lbl', { for: 'acc-who' }, 'Who rigged the game?'), who, h('label.lbl', { for: 'acc-how' }, 'How?'), how, h('label.lbl', { for: 'acc-proof' }, 'What proves it?'), proof,
      h('p.muted.small', 'You get one accusation a day. Kessler does not take kindly to being wrong.'));
    const go = await UI.modal({ title: '⚖️ The accusation', body, buttons: [{ label: 'Not yet', value: false, cls: 'ghost' }, { label: 'Accuse', value: true, cls: 'primary' }] });
    if (!go) return;
    m.lastAccuse = st.day;
    const right = who.value === 'kessler' && how.value === 'cards' && proof.value === 'chip';
    if (!right) {
      const why = who.value !== 'kessler' ? 'Pointing fingers at my friends now? How desperate.' : how.value !== 'cards' ? 'Dice? Wheels? You don\'t even know how it was done.' : 'And your proof is that? Please.';
      api.say(why + ' *smiles* Try again tomorrow, if you dare.'); App.save(); return;
    }
    m.solved = st.day;
    App.credit(10000);
    st.flags.bonusSwagger = (st.flags.bonusSwagger || 0) + 10;
    api.say('*turns the blue chip over slowly* Oscar always did talk too much. Very well. The deed to that bar is yours for half price: five hundred thousand. And you will never mention this chip again. Agreed?');
    App.news('⚖️ Case closed: Kessler rigged Sal\'s last game. The deed to the Spur is now $500,000.');
    UI.toast('⚖️ Case closed! +$10,000 · ★ +10 · the deed is half price', 'big'); SFX.big();
    App.save(); Router.hud(); Career.checkAchievements();
  },

  /* ---------- the lockbox at the motel ---------- */
  lockboxRow(onDone) {
    if (!this.has('key') || this.has('card')) return null;
    return h('div.menu-row', h('span.mi', '🔐'), h('div.mn', h('b', "Open Sal's lockbox (room 7)"), h('small', 'A 4-digit lock. Scratched on the lid: "my birthday, backwards. S."')),
      h('button.btn.sm', { onclick: async () => { const ok = await this.keypad(); if (ok && onDone) onDone(); } }, 'Try the lock'));
  },
  keypad() {
    let code = '';
    const disp = h('div.keypad-disp', '_ _ _ _'), msg = h('p.muted.small', 'Scratched on the lid: "my birthday, backwards. S."');
    const pad = h('div.keypad');
    let pop;
    const press = d => {
      if (d === '⌫') code = code.slice(0, -1); else if (code.length < 4) code += d;
      disp.textContent = (code + '____').slice(0, 4).split('').join(' ');
      if (code.length === 4) {
        if (code === '7160') {
          this.give('card', true); this.give('note', true);
          UI.toast('🔓 The lockbox opens: a marked Queen of Spades and a coded note', 'big'); SFX.big();
          pop.close(true);
        } else { disp.classList.add('shake'); msg.textContent = 'Click. Nothing. Try again.'; SFX.lose(); setTimeout(() => { disp.classList.remove('shake'); code = ''; disp.textContent = '_ _ _ _'; }, 500); }
      }
    };
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0'].forEach(d => pad.append(h('button.btn', { onclick: () => press(d) }, d)));
    pop = UI.modal({ title: "🔐 Sal's lockbox", body: h('div', disp, pad, msg) });
    return pop;
  },

  /* ---------- the cipher ---------- */
  async decoder() {
    let k = 0;
    const out = h('div.cipher-out'), num = h('b.num');
    const answer = h('input.field#cipher-ans', { placeholder: 'Name', maxlength: 20, autocomplete: 'off' });
    const msg = h('p.muted.small');
    const render = () => { out.textContent = caesar(CIPHER, -k); num.textContent = String(k); };
    render();
    const body = h('div', h('p.muted.small', 'Sal\'s note, as written:'), h('div.cipher-in', CIPHER), h('p.small', 'Underneath: "Shift back by the decks in Kessler\'s shoe."'),
      h('div.cipher-dial', h('button.btn.sm', { onclick: () => { k = (k + 25) % 26; render(); } }, '◀'), h('span', 'Shift back by ', num), h('button.btn.sm', { onclick: () => { k = (k + 1) % 26; render(); } }, '▶')),
      out, h('label.lbl', { for: 'cipher-ans' }, 'Who dealt Sal\'s last hand?'),
      h('form.ev-row', { onsubmit: e => {
        e.preventDefault();
        if (answer.value.trim().toUpperCase() === 'OSCAR') { this.give('decoded'); pop.close(true); }
        else { msg.textContent = 'That name isn\'t in the note. Keep turning the dial until the words make sense.'; }
      } }, answer, h('button.btn.sm.primary', 'Submit')), msg);
    const pop = UI.modal({ title: '📜 Decode the note', body });
    return pop;
  },

  /* ---------- what Claude needs to know so chat stays consistent ---------- */
  brief(id) {
    const m = this.st(), found = Object.keys(m.clues).map(k => CLUES[k].name);
    const facts = {
      dolores: 'In the mystery you are the one who gave the player Sal\'s motel locker key. You believe Sal was cheated at the Salon.',
      doc: 'In the mystery you gave the player a photo of Sal\'s 50th birthday (June 17). You know Sal\'s lockbox uses his birthday as a code but you never say the digits.',
      kessler: 'Secretly, you rigged Sal\'s last game with marked decks dealt by Oscar and paid him with a blue chip from your private set. Deny everything and stay icily calm. Only the formal accusation in the game can make you admit it.',
      rico: 'You won a blue chip from a nervous dealer named Oscar. You will hand it over only if the player names your lucky number through the riddle in the game. Never say the number when asked about the chip; you may brag about it in other contexts.',
      [OSCAR_ID]: 'You dealt Sal\'s last, rigged game at Kessler\'s Salon with marked decks and were paid with a blue chip you later lost to Rico. You are terrified and admit nothing in conversation; only seeing real evidence in the game makes you confess.',
    }[id];
    return [
      `Sal's mystery ("The Last Hand"): the player has found ${found.length ? found.join(', ') : 'nothing yet'}${m.solved ? ', and has solved it (Kessler admitted rigging the game and halved the deed price)' : ''}. Current lead: ${this.lead()}`,
      facts || '',
      'Never give away puzzle answers: not the lockbox code, not the decoded note, not Rico\'s lucky number, not who to accuse. You may drop gentle hints that point toward where to look.',
    ].filter(Boolean).join(' ');
  },

  /* ---------- the case file screen ---------- */
  screen(main) {
    const m = this.st();
    const clueCards = Object.keys(CLUES).filter(k => this.has(k)).map(k => h('div.item', h('div.item-i', CLUES[k].icon), h('b', CLUES[k].name), h('p', CLUES[k].text),
      k === 'note' && !this.has('decoded') ? h('button.btn.sm.primary', { onclick: async () => { await this.decoder(); Router.refresh(); } }, 'Decode') : null));
    main.append(h('div.casefile',
      h('div.lobby-h', h('button.btn.ghost.sm', { onclick: () => Router.go('world') }, '← Back to the map'),
        h('div', h('h2', '🔎 The Last Hand'), h('p.muted', 'Sal swore his last game at Kessler\'s Salon was rigged. Prove it.'))),
      h('section.panel.story', h('div.kicker', m.solved ? 'Solved' : 'Next lead'), h('p', this.lead())),
      h('h3.sec', `Clues (${Object.keys(m.clues).length}/${Object.keys(CLUES).length})`),
      clueCards.length ? h('div.shopgrid', clueCards) : h('p.muted', 'No clues yet.')));
  },
};

// solving the case halves the deed
Object.defineProperty(ITEMS.spurDeed, 'price', { get: () => (App.state && App.state.mystery && App.state.mystery.solved ? 500000 : 1000000), configurable: true });
ACHIEVEMENTS.push({ id: 'case', name: 'Case Closed', desc: 'Solve the mystery of Sal\'s last hand', test: () => !!(App.state.mystery && App.state.mystery.solved), reward: 2500, swagger: 3 });
