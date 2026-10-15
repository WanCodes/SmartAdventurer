let audio: AudioContext | null = null;

function context(): AudioContext {
  if (!audio) audio = new AudioContext();
  return audio;
}

export function tone(frequency: number, duration = 0.12, type: OscillatorType = "sine"): void {
  const ctx = context();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playCorrect(): void {
  tone(520, 0.08);
  window.setTimeout(() => tone(680, 0.12), 90);
}

export function playWrong(): void {
  tone(180, 0.18, "triangle");
}

export function playLevel(): void {
  [523, 659, 784].forEach((freq, index) => {
    window.setTimeout(() => tone(freq, 0.16), index * 120);
  });
}
