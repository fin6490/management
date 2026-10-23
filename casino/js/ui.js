/* Shared UI pieces: playing cards, chips, betting spots, table scaffold, modals, toasts. */
const UI = {};

/* ---------- Playing cards ---------- */
const PIP_LAYOUT = {
  2: [[50, 16], [50, 84]],
  3: [[50, 16], [50, 50], [50, 84]],
  4: [[30, 16], [70, 16], [30, 84], [70, 84]],
  5: [[30, 16], [70, 16], [50, 50], [30, 84], [70, 84]],
  6: [[30, 16], [70, 16], [30, 50], [70, 50], [30, 84], [70, 84]],
  7: [[30, 16], [70, 16], [50, 33], [30, 50], [70, 50], [30, 84], [70, 84]],
  8: [[30, 16], [70, 16], [50, 33], [30, 50], [70, 50], [50, 67], [30, 84], [70, 84]],
  9: [[30, 16], [70, 16], [30, 39], [70, 39], [50, 50], [30, 61], [70, 61], [30, 84], [70, 84]],
  10: [[30, 16], [70, 16], [50, 28], [30, 39], [70, 39], [30, 61], [70, 61], [50, 72], [30, 84], [70, 84]],
};
const FACE_GLYPH = { 11: '♞', 12: '♛', 13: '♚' };

UI.card = function (card, faceDown = false) {
  const red = isRed(card.s), sym = SUIT_SYM[card.s], lab = rankLabel(card.r);
  const face = h('div.face');
  const corner = cls => h('div.corner.' + cls, h('span.cr', lab), h('span.cs', sym));
  face.append(corner('tl'), corner('br'));
  if (card.r === 14) face.append(h('div.ace', sym));
  else if (card.r > 10) face.append(h('div.court', h('div.court-in', h('span.glyph', FACE_GLYPH[card.r]), h('span.court-l', lab), h('span.court-s', sym))));
  else {
    const pips = h('div.pips');
    for (const [x, y] of PIP_LAYOUT[card.r]) pips.append(h('span.pip' + (y > 55 ? '.flip' : ''), { style: { left: x + '%', top: y + '%' } }, sym));
    face.append(pips);
  }
  const el = h('div.card' + (red ? '.red' : '.black') + (faceDown ? '.down' : ''),
    h('div.card-in', face, h('div.back')));
  el.dataset.card = cardName(card);
  el.card = card;
  return el;
};

// A row of cards with deal/flip animation. `shoe` is an element cards fly out of.
class CardRow {
  constructor(el, opts = {}) { this.el = el; this.cards = []; this.opts = opts; }
  async add(card, faceDown = false, from) {
    const c = UI.card(card, faceDown);
    this.el.appendChild(c); this.cards.push(c);
    SFX.card();
    const src = from || UI.shoeEl;
    if (src && c.animate) {
      const a = src.getBoundingClientRect(), b = c.getBoundingClientRect();
      const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
      c.animate([
        { transform: `translate(${dx}px, ${dy}px) rotate(-25deg) scale(.7)`, opacity: 0.4 },
        { transform: 'none', opacity: 1 },
      ], { duration: 320 * App.speedFactor(), easing: 'cubic-bezier(.2,.8,.25,1)' });
    }
    await sleep(260);
    return c;
  }
  async flip(i, card) {
    const c = this.cards[i]; if (!c) return;
    if (card) { const n = UI.card(card, true); c.replaceWith(n); this.cards[i] = n; await sleep(20); n.classList.remove('down'); }
    else c.classList.remove('down');
    SFX.flip(); await sleep(280);
  }
  highlight(cards) { // mark the cards that make a hand
    const keys = new Set(cards.map(cardName)); const used = new Set();
    this.cards.forEach(c => {
      const k = c.dataset.card;
      if (keys.has(k) && !used.has(k)) { used.add(k); c.classList.add('hl'); } else c.classList.add('dim');
    });
  }
  clear() { this.el.innerHTML = ''; this.cards = []; }
}
UI.CardRow = CardRow;

/* ---------- Chips ---------- */
const CHIP_DENOMS = [1, 5, 25, 100, 500, 1000, 5000, 25000, 100000];
const chipLabel = v => v >= 1000 ? (v / 1000) + 'K' : String(v);
UI.chip = (v, extra = '') => h('div.chip.c' + v + extra, h('span', chipLabel(v)));
UI.chipsFor = function (amount, limit = 10) { // greedy decomposition for stack display
  const out = []; let left = Math.round(amount);
  for (let i = CHIP_DENOMS.length - 1; i >= 0 && out.length < limit; i--) {
    while (left >= CHIP_DENOMS[i] && out.length < limit) { out.push(CHIP_DENOMS[i]); left -= CHIP_DENOMS[i]; }
  }
  if (!out.length && amount > 0) out.push(1);
  return out.reverse();
};
UI.stack = function (amount) {
  const st = h('div.stack');
  UI.chipsFor(amount, 9).forEach((v, i) => { const c = UI.chip(v, '.mini'); c.style.bottom = (i * 4) + 'px'; st.append(c); });
  return st;
};

/* ---------- Betting spot ---------- */
class BetSpot {
  // opts: key, label, sub, cls, min, max, fixed (exact amount toggle), table (Table), locked
  constructor(opts) {
    this.o = opts; this.key = opts.key; this.amount = 0; this.history = []; this.locked = false;
    this.el = h('div.spot' + (opts.cls ? '.' + opts.cls.split(' ').filter(Boolean).join('.') : ''),
      { title: opts.title || '', onclick: e => this.click(e), oncontextmenu: e => { e.preventDefault(); this.undo(); } },
      h('div.spot-label', opts.label), opts.sub ? h('div.spot-sub', opts.sub) : null,
      this.stackEl = h('div.spot-stack'), this.amtEl = h('div.spot-amt'));
    this.el.dataset.key = opts.key;
    if (opts.passive) this.el.classList.add('passive');
    let t; // long-press removes a chip on touch screens
    this.el.addEventListener('touchstart', () => { t = setTimeout(() => { this.undo(); t = 'done'; }, 550); }, { passive: true });
    this.el.addEventListener('touchend', e => { if (t === 'done') e.preventDefault(); clearTimeout(t); });
    this.render();
  }
  get table() { return this.o.table; }
  click(e) {
    if (this.locked || this.o.passive) { if (this.o.onLockedClick) this.o.onLockedClick(); return; }
    if (e.shiftKey || e.altKey) return this.undo();
    if (this.o.fixed) { this.amount ? this.clear() : this.place(this.o.fixed); return; }
    this.place(this.table.chip);
  }
  place(v) {
    const max = typeof this.o.max === 'function' ? this.o.max() : this.o.max;
    if (max != null && this.amount + v > max + 1e-9) {
      v = Math.max(0, max - this.amount);
      if (v <= 0) { UI.toast(`${this.o.label}: table max is ${fmt(max)}`, 'warn'); return false; }
    }
    if (!App.debit(v)) { UI.toast('Not enough bankroll for that chip', 'warn'); return false; }
    this.amount = round2(this.amount + v); this.history.push(v);
    SFX.chip(); this.render(); this.o.onChange && this.o.onChange(this);
    return true;
  }
  undo() {
    if (this.locked || !this.history.length) return;
    const v = this.history.pop(); this.amount = round2(this.amount - v); App.credit(v);
    SFX.chip(); this.render(); this.o.onChange && this.o.onChange(this);
  }
  clear() { // refund everything on the spot
    if (this.amount > 0) App.credit(this.amount);
    this.amount = 0; this.history = []; this.render(); this.o.onChange && this.o.onChange(this);
  }
  // put money down programmatically (blind, play, double...). Returns false if bankroll short.
  force(v) {
    if (!App.debit(v)) return false;
    this.amount = round2(this.amount + v); this.history.push(v); SFX.chip(); this.render(); return true;
  }
  setLocked(l) { this.locked = l; this.el.classList.toggle('locked', l); }
  render() {
    this.stackEl.innerHTML = '';
    if (this.amount > 0) this.stackEl.append(UI.stack(this.amount));
    this.amtEl.textContent = this.amount > 0 ? fmt(this.amount, { short: true }) : '';
    this.el.classList.toggle('has-bet', this.amount > 0);
    this.el.classList.remove('won', 'lost', 'pushed');
  }
  // settlement helpers: return the amount credited back to the bankroll
  settle(back, cls, text, note) {
    const wager = this.amount;
    if (back > 0) App.credit(back);
    this.table && this.table.addResult(wager, back);
    this.amount = 0; this.history = [];
    this.flash(cls, text, note, back);
    return back;
  }
  win(mult, note) { return this.settle(round2(this.amount * (1 + mult)), 'won', '+' + fmt(round2(this.amount * mult)), note); }
  payFixed(amount, note) { return this.settle(amount, 'won', '+' + fmt(amount), note); } // progressive: stake taken, flat amount paid
  lose(note) { return this.amount > 0 ? this.settle(0, 'lost', '-' + fmt(this.amount), note) : 0; }
  push(note) { return this.amount > 0 ? this.settle(this.amount, 'pushed', 'Push', note) : 0; }
  refund(back, label) { return this.settle(back, 'pushed', label || ('+' + fmt(back))); } // surrender, la partage, pull back
  flash(cls, text, note, back = 0) {
    this.render(); this.el.classList.add(cls);
    if (back > 0 && cls === 'won') { // winnings slide off the spot toward the rack
      const st = UI.stack(back); st.classList.add('payout'); this.stackEl.append(st);
      setTimeout(() => st.remove(), 1100 * App.speedFactor());
    }
    clearTimeout(this._mark); this._mark = setTimeout(() => this.el.classList.remove('won', 'lost', 'pushed'), 2600 * App.speedFactor());
    const f = h('div.float.' + cls, text, note ? h('small', note) : null);
    this.el.appendChild(f); setTimeout(() => f.remove(), 2200 * App.speedFactor());
  }
}
UI.BetSpot = BetSpot;

/* ---------- Table scaffold ---------- */
class Table {
  constructor(root, game, ctx) {
    this.game = game; this.ctx = ctx; this.spots = {}; this.chip = ctx.chips[1] || ctx.chips[0];
    this.round = { wagered: 0, returned: 0 };
    const felt = App.state.equipped.felt || 'green';
    this.el = h('div.table-screen',
      h('div.table-top',
        h('button.btn.ghost.sm', { onclick: () => Router.leaveTable() }, '← Leave table'),
        h('div.tt-title', h('b', game.name), h('span', `${ctx.venue.name} · ${fmt(ctx.limits.min)}–${fmt(ctx.limits.max, { short: true })}`)),
        h('div.tt-right',
          this.extraEl = h('div.tt-extra'),
          h('button.btn.ghost.sm', { onclick: () => this.showInfo() }, 'Paytables'))),
      this.felt = h('div.felt.felt-' + felt,
        h('div.felt-brand', ctx.venue.name),
        this.shoe = h('div.shoe', h('div.shoe-card')),
        this.body = h('div.felt-body'),
        this.banner = h('div.banner')),
      h('div.controls',
        this.msgEl = h('div.msg'),
        h('div.ctl-row',
          this.rack = h('div.rack'),
          this.actionsEl = h('div.actions'))));
    root.appendChild(this.el);
    UI.shoeEl = this.shoe;
    this.renderRack();
  }
  renderRack() {
    this.rack.innerHTML = '';
    for (const v of this.ctx.chips) {
      const c = UI.chip(v, v === this.chip ? '.sel' : '');
      c.onclick = () => { this.chip = v; SFX.click(); this.renderRack(); };
      this.rack.append(c);
    }
  }
  spot(opts) { const s = new BetSpot({ ...opts, table: this }); this.spots[opts.key] = s; return s; }
  msg(t) { this.msgEl.innerHTML = ''; this.msgEl.append(typeof t === 'string' ? document.createTextNode(t) : t); }
  setActions(list) {
    this.actions = list;
    this.actionsEl.innerHTML = '';
    for (const a of list) {
      if (!a) continue;
      // the deal/spin/roll button is held back when you're starving, parched or exhausted
      const run = () => {
        if (a.key === ' ') {
          const why = Career.canPlay(), stuck = this.game.canLeave && this.game.canLeave();
          if (why && !stuck) { UI.toast(why, 'warn'); return; }
        }
        SFX.click(); a.on();
      };
      const b = h('button.btn' + (a.cls ? '.' + a.cls : ''), { disabled: a.disabled, onclick: () => { if (!b.disabled) run(); } },
        a.label, a.key ? h('kbd', a.key === ' ' ? 'Space' : a.key.toUpperCase()) : null);
      if (a.hint) b.classList.add('hint');
      a.btn = b; this.actionsEl.append(b);
    }
  }
  key(e) {
    if (!this.actions) return false;
    const k = e.key === 'Enter' ? ' ' : e.key.toLowerCase();
    const a = this.actions.find(a => a && a.key === k && !a.disabled);
    if (a) { e.preventDefault(); a.btn.click(); return true; }
    return false;
  }
  showBanner(text, cls = '', ms = 1800) {
    this.banner.className = 'banner show ' + cls; this.banner.textContent = text;
    clearTimeout(this._bt); this._bt = setTimeout(() => this.banner.classList.remove('show'), ms * App.speedFactor());
  }
  addResult(wager, back) { this.round.wagered += wager; this.round.returned += back; }
  // called by games when every bet is settled
  finishRound(extra = {}) {
    const r = this.round; this.round = { wagered: 0, returned: 0 };
    const net = round2(r.returned - r.wagered);
    if (r.wagered > 0) {
      if (net > 0) { this.showBanner('WIN ' + fmt(net), 'win'); net >= 20 * this.ctx.limits.min ? SFX.big() : SFX.win(); }
      else if (net < 0) { this.showBanner('LOSE ' + fmt(-net), 'lose', 1200); SFX.lose(); }
      else this.showBanner('PUSH', 'push', 1000);
    }
    App.roundDone(this.game.id, { wagered: r.wagered, returned: r.returned, net, ...extra });
    return net;
  }
  saveBets(keys) {
    const b = {}; for (const k of keys) if (this.spots[k] && this.spots[k].amount) b[k] = this.spots[k].amount;
    if (Object.keys(b).length) App.state.lastBets[this.game.id] = b;
  }
  rebet() {
    const b = App.state.lastBets[this.game.id]; if (!b) return UI.toast('No previous bet', 'warn');
    for (const k in b) { const s = this.spots[k]; if (s && !s.locked && !s.amount) { if (!s.force(b[k])) { UI.toast('Not enough for full rebet', 'warn'); break; } s.o.onChange && s.o.onChange(s); } }
  }
  clearBets(keys) { for (const k of keys || Object.keys(this.spots)) this.spots[k] && !this.spots[k].locked && this.spots[k].clear(); }
  totalOn(keys) { return (keys || Object.keys(this.spots)).reduce((a, k) => a + (this.spots[k] ? this.spots[k].amount : 0), 0); }
  // returns bets still on the layout (used when leaving mid-round)
  // Leaving the table: bets not yet in play go back to the bankroll. Mid-round (only possible by
  // closing the page) the bets in action are forfeited, so reloading can't undo a bad hand.
  refundAll() {
    const forfeit = this.busy || (this.game.canLeave && this.game.canLeave());
    for (const k in this.spots) { const s = this.spots[k]; if (s.amount > 0 && !forfeit) App.credit(s.amount); s.amount = 0; }
    (this.extraSpots || []).forEach(s => { s.amount = 0; });
  }
  showInfo() {
    const body = h('div.info');
    for (const sec of this.game.info(this.ctx)) {
      body.append(h('h3', sec.title));
      if (sec.text) body.append(h('p', sec.text));
      if (sec.rows) {
        const t = h('table.paytable');
        for (const row of sec.rows) t.append(h('tr', h('td', row[0]), h('td.num', row[1])));
        body.append(t);
      }
      if (sec.rtp != null) body.append(UI.rtpBadge(sec.rtp));
    }
    UI.modal({ title: this.game.name + ' — Rules & Paytables', body, wide: true });
  }
  destroy() { this.el.remove(); }
}
UI.Table = Table;

// RTP shown only once the player owns the Odds Book (or in free play)
UI.rtpBadge = function (rtp) {
  if (!App.perk('odds')) return h('p.muted.small', '🔒 Buy the Pit Boss Odds Book to see the exact return.');
  const edge = 1 - rtp;
  const cls = rtp >= 1 ? 'good' : rtp >= 0.98 ? 'ok' : 'bad';
  return h('p.rtp.' + cls, `Return to player ${pctStr(rtp)} · ${edge > 0 ? 'house edge ' + pctStr(edge) : 'player edge ' + pctStr(-edge)}`);
};
UI.payRows = (table, suffix = ' to 1') => table.map(t => [t.name, (t.pays === 0 ? 'Push' : t.pays + suffix)]);

/* ---------- Progressive meter ---------- */
UI.meter = function (key, label) {
  const el = h('div.meter', h('div.meter-l', label), h('div.meter-v'), h('div.meter-ev'));
  el.update = () => {
    const prog = Progressives.def(key), m = App.state.progressives[key];
    el.querySelector('.meter-v').textContent = fmt(Math.floor(m));
    const evEl = el.querySelector('.meter-ev');
    if (App.perk('tracker')) {
      const r = Progressives.rtp(key);
      evEl.textContent = 'RTP ' + pctStr(r, 1); evEl.className = 'meter-ev ' + (r >= 1 ? 'good' : r > 0.97 ? 'ok' : 'bad');
    } else evEl.textContent = '';
  };
  el.update();
  return el;
};

/* ---------- Toasts and modals ---------- */
UI.toast = function (msg, type = '') {
  let box = $('#toasts'); if (!box) { box = h('div#toasts'); document.body.append(box); }
  const t = h('div.toast.' + (type || 'info'), msg); box.append(t);
  setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100);
};

UI.modal = function ({ title, body, buttons, wide, closable = true, cls }) {
  let closer;
  const p = new Promise(resolve => {
    const close = v => { bg.remove(); document.removeEventListener('keydown', esc); resolve(v); };
    const esc = e => { if (e.key === 'Escape' && closable) close(null); };
    const box = h('div.modal' + (wide ? '.wide' : '') + (cls ? '.' + cls : ''),
      title ? h('div.modal-h', h('h2', title), closable ? h('button.x', { onclick: () => close(null), 'aria-label': 'Close' }, '×') : null) : null,
      h('div.modal-b', typeof body === 'string' ? h('p', body) : body),
      buttons ? h('div.modal-f', buttons.map(b => h('button.btn' + (b.cls ? '.' + b.cls : ''), { disabled: b.disabled, onclick: () => close(b.value !== undefined ? b.value : b.label) }, b.label))) : null);
    const bg = h('div.modal-bg', { onclick: e => { if (e.target === bg && closable) close(null); } }, box);
    document.body.append(bg); document.addEventListener('keydown', esc);
    closer = close;
    const first = box.querySelector('.modal-f .btn.primary') || box.querySelector('.modal-f .btn');
    first && setTimeout(() => first.focus(), 30);
  });
  p.close = v => closer && closer(v);
  return p;
};

/* Story dialogue: lines = [{who, text}] ; optional choices at the end. */
UI.dialog = async function (lines, choices) {
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i], ch = CHARACTERS[L.who] || CHARACTERS.narrator;
    const last = i === lines.length - 1;
    const text = typeof L.text === 'function' ? L.text() : L.text;
    const body = h('div.dialog',
      h('div.portrait', { style: { background: ch.color } }, ch.face),
      h('div.d-text', h('div.d-name', ch.name), h('p', { html: text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>') })));
    const btns = last && choices ? choices.map(c => ({ label: c.label, value: c.value, cls: c.cls || 'primary' })) : [{ label: last ? 'Okay' : 'Next ›', cls: 'primary', value: 'next' }];
    const v = await UI.modal({ body, buttons: btns, closable: false, cls: 'dlg' });
    if (last && choices) return v;
  }
  return 'next';
};

UI.confirm = (title, text, yes = 'Yes', no = 'Cancel') =>
  UI.modal({ title, body: text, buttons: [{ label: no, value: false, cls: 'ghost' }, { label: yes, value: true, cls: 'primary' }] });
