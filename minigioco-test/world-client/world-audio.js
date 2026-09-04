export function makeAudio() {
  let ac = null, muted = false;
  const ensure = () => {
    if (muted) return null;
    if (!ac) {
      const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      try { ac = new AC(); } catch (e) { return null; }
    }
    if (ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  };
  const tone = ({ f = 440, f2 = 0, type = "sine", dur = 0.1, vol = 0.15, delay = 0 }) => {
    const c = ensure(); if (!c) return;
    try {
      const t = c.currentTime + delay;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.06);
    } catch (e) { /* noop */ }
  };
  const noise = ({ dur = 0.06, freq = 800, vol = 0.1, delay = 0 }) => {
    const c = ensure(); if (!c) return;
    try {
      const n = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, n, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = c.createBufferSource(); src.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 1.1;
      const g = c.createGain(); g.gain.value = vol;
      const t = c.currentTime + delay;
      src.connect(bp); bp.connect(g); g.connect(c.destination);
      src.start(t);
    } catch (e) { /* noop */ }
  };
  /* — musica chiptune: sequencer 16 step con lookahead — */
  const m2f = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const MTRK = [
    { name: "Pixel Sunset", bpm: 88, type: "triangle",
      lead: [69, 0, 72, 0, 76, 0, 72, 0, 67, 0, 71, 0, 74, 0, 71, 0],
      bass: [45, 0, 0, 0, 43, 0, 0, 0, 41, 0, 0, 0, 43, 0, 0, 0] },
    { name: "Mana Groove", bpm: 112, type: "square",
      lead: [64, 67, 71, 67, 72, 0, 71, 67, 64, 67, 69, 67, 71, 0, 69, 67],
      bass: [40, 0, 0, 40, 38, 0, 0, 38, 36, 0, 0, 36, 38, 0, 43, 0] },
    { name: "Night Drive", bpm: 76, type: "sawtooth",
      lead: [57, 0, 60, 64, 0, 60, 0, 64, 55, 0, 59, 62, 0, 59, 0, 62],
      bass: [33, 0, 0, 0, 31, 0, 0, 0, 29, 0, 0, 0, 31, 0, 0, 0] },
  ];
  /* traccia segreta Shadow Realm: synthwave oscura e rallentata */
  const DARK_TRK = {
    name: "Anomalia Temporale", bpm: 58, type: "sawtooth",
    lead: [45, 0, 0, 48, 0, 0, 44, 0, 45, 0, 0, 51, 0, 0, 50, 0],
    bass: [21, 0, 0, 0, 24, 0, 0, 0, 20, 0, 0, 0, 19, 0, 0, 0],
  };
  let mTimer = null, mNext = 0, mStep = 0, mIdx = -1, mDark = false;
  const stopTimer = () => { if (mTimer) { clearInterval(mTimer); mTimer = null; } };
  const musicStop = () => { mIdx = -1; if (!mDark) stopTimer(); };
  const startTimer = () => {
    const c = ensure(); if (!c || mTimer) return;
    mNext = c.currentTime + 0.1; mStep = 0;
    mTimer = setInterval(() => {
      if (muted || !ac || (mIdx < 0 && !mDark)) return;
      const tr = mDark ? DARK_TRK : MTRK[mIdx];
      const spb = 60 / tr.bpm / 4;
      while (mNext < ac.currentTime + 0.3) {
        const i = mStep % 16;
        const dl = Math.max(0, mNext - ac.currentTime);
        if (tr.lead[i]) tone({ f: m2f(tr.lead[i]), type: tr.type, dur: mDark ? 0.5 : 0.16, vol: tr.type === "sawtooth" ? 0.022 : 0.032, delay: dl });
        if (tr.bass[i]) tone({ f: m2f(tr.bass[i]), type: "triangle", dur: mDark ? 0.7 : 0.3, vol: 0.05, delay: dl });
        if (i % 4 === 2) noise({ dur: 0.025, freq: mDark ? 2400 : 6200, vol: 0.012, delay: dl });
        mNext += spb; mStep++;
      }
    }, 110);
  };
  const musicToggle = () => {
    if (muted || mDark) return null;
    const c = ensure(); if (!c) return null;
    mIdx++;
    if (mIdx >= MTRK.length) { musicStop(); return null; }
    startTimer();
    return MTRK[mIdx].name;
  };
  /* on=true: la chiptune si interrompe e parte la dark wave */
  const musicShadow = (on) => {
    if (on) { mDark = true; mIdx = -1; startTimer(); }
    else { mDark = false; if (mIdx < 0) stopTimer(); }
  };

  return {
    ensure,
    setMuted(v) { muted = v; if (v) musicStop(); },
    musicToggle,
    musicStop,
    musicOn: () => mIdx >= 0,
    step(i) { noise({ dur: 0.05, freq: i % 2 ? 640 : 540, vol: 0.045 }); },
    click() { tone({ f: 1250, type: "square", dur: 0.045, vol: 0.06 }); },
    open() { tone({ f: 330, f2: 740, type: "triangle", dur: 0.2, vol: 0.11 }); tone({ f: 990, dur: 0.08, vol: 0.05, delay: 0.16 }); },
    close() { tone({ f: 700, f2: 300, type: "triangle", dur: 0.18, vol: 0.09 }); },
    success() { tone({ f: 659, dur: 0.09, vol: 0.11 }); tone({ f: 880, dur: 0.14, vol: 0.11, delay: 0.09 }); },
    pin() { noise({ dur: 0.05, freq: 300, vol: 0.18 }); tone({ f: 170, type: "triangle", dur: 0.07, vol: 0.16 }); },
    error() { tone({ f: 240, f2: 160, type: "square", dur: 0.12, vol: 0.07 }); },
    musicShadow,
    /* — nuovi effetti — */
    interference() {
      for (let i = 0; i < 5; i++) noise({ dur: 0.09, freq: 900 + Math.random() * 2600, vol: 0.16, delay: i * 0.07 });
      tone({ f: 1800, f2: 120, type: "sawtooth", dur: 0.4, vol: 0.05, delay: 0.1 });
    },
    alarm() {
      tone({ f: 880, type: "square", dur: 0.14, vol: 0.07 });
      tone({ f: 660, type: "square", dur: 0.14, vol: 0.07, delay: 0.16 });
    },
    shuffle() { for (let i = 0; i < 3; i++) noise({ dur: 0.07, freq: 2400, vol: 0.12, delay: i * 0.09 }); },
    snap() { noise({ dur: 0.03, freq: 3200, vol: 0.14 }); tone({ f: 1600, type: "square", dur: 0.03, vol: 0.05 }); },
    riser(k) { tone({ f: 240 * Math.pow(2, k / 5), type: "triangle", dur: 0.12, vol: 0.08 }); },
    reveal(rarLevel) {
      /* jingle crescente: più la carta è rara, più note */
      const base = [659, 784, 988, 1319];
      for (let i = 0; i <= rarLevel; i++) tone({ f: base[i], type: "triangle", dur: 0.14, vol: 0.1, delay: i * 0.09 });
      if (rarLevel >= 3) tone({ f: 1760, dur: 0.5, vol: 0.08, delay: 0.4 });
    },
    whoosh() { noise({ dur: 0.3, freq: 600, vol: 0.14 }); tone({ f: 200, f2: 900, type: "sine", dur: 0.3, vol: 0.07 }); },
    purr() { for (let i = 0; i < 7; i++) tone({ f: 78 + (i % 2) * 8, type: "sawtooth", dur: 0.07, vol: 0.035, delay: i * 0.07 }); },
    meow() { tone({ f: 740, f2: 990, type: "triangle", dur: 0.13, vol: 0.06 }); tone({ f: 990, f2: 600, type: "triangle", dur: 0.22, vol: 0.055, delay: 0.12 }); },
    bark() {
      tone({ f: 380, f2: 480, type: "triangle", dur: 0.09, vol: 0.08 });
      tone({ f: 480, f2: 220, type: "triangle", dur: 0.14, vol: 0.07, delay: 0.07 });
      noise({ dur: 0.1, freq: 1100, vol: 0.08 });
    },
    pant() {
      for (let i = 0; i < 3; i++) {
        noise({ dur: 0.05, freq: 1500, vol: 0.02, delay: i * 0.12 });
      }
    },
    ding() { tone({ f: 784, type: "triangle", dur: 0.4, vol: 0.12 }); tone({ f: 659, type: "triangle", dur: 0.55, vol: 0.1, delay: 0.26 }); },
    dispose() { mDark = false; musicStop(); stopTimer(); try { ac && ac.close(); } catch (e) { /* noop */ } ac = null; },
  };
}

/* ========================== 7. GAME CORE =============================== */
