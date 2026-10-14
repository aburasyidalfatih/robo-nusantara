/**
 * Efek suara dan musik latar disintesis dengan Web Audio,
 * jadi belum ada file audio yang perlu diunduh.
 * Nanti bisa diganti rekaman dari penata suara tanpa mengubah pemanggilnya.
 */
let ctx: AudioContext | null = null;
let sfxOn = true;
let musicOn = true;

function audio(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = "triangle", when = 0, vol = 0.08, force = false): void {
  if (!sfxOn && !force) return;
  const a = audio();
  if (!a) return;
  try {
    const t0 = a.currentTime + when;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch {
    /* audio gagal: abaikan, game tetap jalan */
  }
}

export const sfx = {
  click: () => tone(700, 0.04, "sine", 0, 0.04),
  pick: () => tone(520, 0.07, "sine"),
  drop: () => {
    tone(660, 0.06, "sine");
    tone(880, 0.08, "sine", 0.05);
  },
  remove: () => tone(260, 0.12, "sine"),
  step: () => tone(440, 0.07, "square", 0, 0.025),
  turn: () => {
    tone(330, 0.06);
    tone(392, 0.06, "triangle", 0.05);
  },
  harvest: () => {
    tone(784, 0.1, "sine");
    tone(1046, 0.16, "sine", 0.09);
  },
  bump: () => {
    tone(150, 0.18, "sawtooth", 0, 0.06);
    tone(98, 0.22, "sawtooth", 0.08, 0.05);
  },
  win: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, "triangle", i * 0.1, 0.09)),
  miss: () => {
    tone(392, 0.12);
    tone(330, 0.2, "triangle", 0.12);
  },
};

/** Musik latar pentatonik yang lembut (nuansa gamelan sederhana). */
const SCALE = [293.66, 329.63, 392, 440, 493.88, 587.33, 659.25];
let musicTimer: number | null = null;
let beat = 0;
let note = 2;

function musicTick(): void {
  if (!ctx || document.hidden) return;
  beat++;
  if (beat % 2 === 0) {
    const moves = [-2, -1, -1, 0, 1, 1, 2];
    note = Math.max(0, Math.min(SCALE.length - 1, note + (moves[Math.floor(Math.random() * moves.length)] ?? 0)));
    tone(SCALE[note] ?? 392, 0.55, "sine", 0, 0.022, true);
  }
  if (beat % 8 === 0) tone(beat % 16 === 0 ? 146.83 : 110, 1.1, "triangle", 0, 0.03, true);
  if (beat % 8 === 4) tone((SCALE[(note + 2) % SCALE.length] ?? 440) * 2, 0.25, "sine", 0, 0.012, true);
}

export const music = {
  /** Harus dipanggil dari ketukan/klik pengguna (aturan autoplay peramban). */
  start(): void {
    if (musicTimer !== null || !musicOn) return;
    if (!audio()) return;
    musicTimer = window.setInterval(musicTick, 340);
  },
  stop(): void {
    if (musicTimer !== null) window.clearInterval(musicTimer);
    musicTimer = null;
  },
};

export function configureSound(opts: { sfx: boolean; music: boolean }): void {
  sfxOn = opts.sfx;
  musicOn = opts.music;
  if (!musicOn) music.stop();
}
