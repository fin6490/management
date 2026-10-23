/* Voice chat: speak to characters with the microphone and hear them answer. Uses the browser's
   built-in speech recognition and speech synthesis, so it needs no extra keys. Settings live in this
   browser only. */
const VOICE_KEY = 'highroller.voice';
// how each character sounds: v = 'f' or 'm' voice pool, accent = preferred language tag, pitch and rate
const VOICES = {
  dolores: { v: 'f', pitch: .95, rate: .95, accent: 'en-US' }, doc: { v: 'm', pitch: .8, rate: .85 }, lou: { v: 'm', pitch: 1.1, rate: 1.1, accent: 'en-US' },
  vinnie: { v: 'm', pitch: .75, rate: 1, accent: 'en-US' }, nico: { v: 'm', pitch: .6, rate: .9 }, margot: { v: 'f', pitch: 1.1, rate: 1, accent: 'en-GB' },
  kessler: { v: 'm', pitch: .7, rate: .85, accent: 'en-GB' }, sal: { v: 'm', pitch: .75, rate: .9, accent: 'en-US' }, mick: { v: 'm', pitch: 1, rate: 1.05, accent: 'en-IE' },
  sparky: { v: 'm', pitch: 1.15, rate: 1.15, accent: 'en-US' },
  tex: { v: 'm', pitch: .85, rate: 1, accent: 'en-US' }, mei: { v: 'f', pitch: 1.05, rate: 1.1 }, baron: { v: 'm', pitch: .8, rate: .9, accent: 'en-GB' }, rico: { v: 'm', pitch: 1, rate: 1.1 },
  mel: { v: 'f', pitch: .85, rate: 1 }, raj: { v: 'm', pitch: 1, rate: 1, accent: 'en-IN' }, philippe: { v: 'm', pitch: 1.05, rate: .95, accent: 'fr' },
  skip: { v: 'm', pitch: .9, rate: 1 }, vivienne: { v: 'f', pitch: 1.1, rate: 1 }, ash: { v: 'm', pitch: .7, rate: .85, accent: 'en-GB' },
  darlene: { v: 'f', pitch: .8, rate: .95 }, pemberton: { v: 'm', pitch: .9, rate: .9, accent: 'en-GB' }, rosa: { v: 'f', pitch: 1.05, rate: 1.15 },
};
// the voice pool for the other characters, keyed by their display name
const VOICE_BY_NAME = {
  f: ['Marge Pettibone', 'Dot Kowalski', 'Priya Shah', 'Rhonda Biggs', 'Fanny Mae Dupree', 'Agnes Pruitt', 'Madame Zora', 'Barbara Glass', 'The Countess', 'Lady Ashcombe', 'Shotgun Sheila', 'Lady Bullseye',
    'Bonnie', 'Lupe', 'Delia', 'Junebug', 'Mae', 'Odette', 'Celeste', 'Ines', 'Yvette', 'Anouk', 'Ivory', 'Lark', 'Wren', 'Mirelle', 'Grandma Rose', 'Jenny Jacks', 'Nadia'],
};
const Voice = {
  prefs() { try { return Object.assign({ speak: false, handsFree: false }, JSON.parse(localStorage.getItem(VOICE_KEY) || '{}')); } catch (e) { return { speak: false, handsFree: false }; } },
  save(p) { try { localStorage.setItem(VOICE_KEY, JSON.stringify(p)); } catch (e) { } },
  canSpeak: () => 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined',
  canListen: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),

  /* ---------- speaking ---------- */
  voices() {
    if (!this.canSpeak()) return [];
    const all = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang) || /^fr/i.test(v.lang));
    return all;
  },
  // sort the installed voices into rough pools by their names
  pool(kind) {
    const F = /female|woman|samantha|victoria|karen|moira|tessa|fiona|serena|zira|hazel|susan|allison|ava|kate|veena|catherine|joanna|salli|kimberly|libby|sonia|jenny|aria|emma|amy|olivia|natasha|amelie|aurelie|marie|google us english$|google uk english female/i;
    const M = /male|daniel|alex|fred|arthur|rishi|aaron|gordon|tom|david|mark|george|james|oliver|thomas|ryan|guy|brian|matthew|joey|justin|liam|william|eric|christopher|google uk english male/i;
    const vs = this.voices();
    const f = vs.filter(v => F.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/i, ''))), m = vs.filter(v => M.test(v.name) && !F.test(v.name));
    return kind === 'f' ? (f.length ? f : vs) : (m.length ? m : vs);
  },
  profile(sp) {
    const base = VOICES[sp.id] || VOICES[(sp.id || '').replace(/^staff:/, '')];
    if (base) return base;
    const name = (sp.name || '').replace(/^.*"(.+)".*$/, '$1');
    const dealer = (sp.id || '').startsWith('dealer:');
    const v = VOICE_BY_NAME.f.some(n => sp.name === n || name === n || (dealer && sp.name === n)) ? 'f' : 'm';
    const hsh = [...(sp.id || sp.name || '')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    return { v, pitch: .85 + (hsh % 30) / 100, rate: .92 + (hsh % 17) / 100 };
  },
  pick(sp) {
    const p = this.profile(sp), pool = this.pool(p.v);
    if (!pool.length) return { p, voice: null };
    // closest accent first: an Irish voice, else a British one, and so on
    const chain = p.accent ? { 'en-IE': ['en-IE', 'en-GB'], 'en-IN': ['en-IN', 'en-GB'], 'en-GB': ['en-GB', 'en-AU'], fr: ['fr', 'en-GB'] }[p.accent] || [p.accent] : [];
    let accent = null;
    for (const a of chain) { const m = pool.filter(v => v.lang.toLowerCase().startsWith(a.toLowerCase())); if (m.length) { accent = m; break; } }
    const en = pool.filter(v => /^en/i.test(v.lang));
    const list = accent && accent.length ? accent : en.length ? en : pool;
    const hsh = [...(sp.id || sp.name || '')].reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5);
    return { p, voice: list[hsh % list.length] };
  },
  // drop stage directions and emoji so the voice reads only what they say
  clean: t => String(t || '').replace(/\*[^*]*\*/g, ' ').replace(/\([^)]*\)/g, ' ').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s+/g, ' ').trim(),
  say(sp, text, onEnd) {
    if (!this.canSpeak() || !this.prefs().speak) { onEnd && onEnd(); return; }
    const words = this.clean(text); if (!words) { onEnd && onEnd(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(words), { p, voice } = this.pick(sp);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    u.pitch = p.pitch; u.rate = p.rate;
    u.onend = u.onerror = () => onEnd && onEnd();
    speechSynthesis.speak(u);
  },
  stop() { if (this.canSpeak()) speechSynthesis.cancel(); },

  /* ---------- listening ---------- */
  // resolves with what you said ('' if nothing); onPartial shows words as they're recognised
  listen(onPartial) {
    return new Promise((resolve, reject) => {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return reject({ code: 'unsupported' });
      this.stop();
      const rec = new R(); this._rec = rec;
      rec.lang = navigator.language || 'en-US'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      let final = '', partial = '';
      rec.onresult = e => {
        partial = '';
        for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) final += r[0].transcript; else partial += r[0].transcript; }
        onPartial && onPartial((final + ' ' + partial).trim());
      };
      rec.onerror = e => { this._rec = null; if (e.error === 'no-speech' || e.error === 'aborted') resolve(''); else reject({ code: e.error }); };
      rec.onend = () => { this._rec = null; resolve((final || partial).trim()); };
      try { rec.start(); } catch (e) { reject({ code: 'start' }); }
    });
  },
  stopListening() { if (this._rec) try { this._rec.stop(); } catch (e) { } },
  errorText(e) {
    const c = e && e.code;
    if (c === 'unsupported') return 'This browser can\'t do speech recognition. Try Chrome, Edge or Safari.';
    if (c === 'not-allowed' || c === 'service-not-allowed') return 'Microphone access is blocked. Allow it in your browser\'s site settings (inside claude.ai, the installed app works better for voice).';
    if (c === 'network') return 'Speech recognition needs an internet connection.';
    if (c === 'audio-capture') return 'No microphone found.';
    return 'Didn\'t catch that. Try again.';
  },

  /* ---------- settings rows (shown in ☰ → AI chat) ---------- */
  settingsRows() {
    const p = this.prefs();
    const row = (key, label, sub, ok) => h('label.vrow', h('input', { type: 'checkbox', checked: !!p[key], disabled: !ok, onchange: e => { p[key] = e.target.checked; this.save(p); if (key === 'speak' && e.target.checked) this.say({ id: 'dolores', name: 'Dolores' }, 'Well hey there, sugar. Now you can hear me.'); } }),
      h('span', h('b', label), h('small.muted', ok ? sub : 'Not supported in this browser')));
    return h('div.vrows', h('h4', '🎙️ Voice'),
      row('speak', 'Read replies aloud', 'Each character has their own voice, from the voices on this device.', this.canSpeak()),
      row('handsFree', 'Hands-free conversation', 'After they finish talking, the mic opens again so you can just keep chatting.', this.canListen() && this.canSpeak()),
      h('p.muted.small', this.canListen() ? 'Tap 🎤 in any chat to speak instead of typing.' : 'Voice input isn\'t available in this browser; you can still hear replies.'));
  },
};
if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices(); } catch (e) { } }
