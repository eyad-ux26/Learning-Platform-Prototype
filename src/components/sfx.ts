/** Tiny WebAudio cues. Off until the learner's `sound` preference allows it; never plays before a user gesture. */
type Kind = "tap" | "pick" | "apply" | "undo" | "ship" | "reopen";

const SETS: Record<Kind, [number, number, number][]> = {
  tap: [[740, 0.04, 0]],
  pick: [[880, 0.05, 0], [1320, 0.07, 0.04]],
  apply: [[660, 0.06, 0], [880, 0.06, 0.06], [1320, 0.1, 0.12]],
  undo: [[880, 0.05, 0], [587, 0.08, 0.05]],
  ship: [[523, 0.08, 0], [784, 0.08, 0.08], [1047, 0.08, 0.16], [1568, 0.2, 0.24]],
  reopen: [[440, 0.08, 0], [330, 0.14, 0.08]],
};

let enabled = true;
let ctx: AudioContext | undefined;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function playSfx(kind: Kind) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const A = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx ?? new A();
    const t0 = ctx.currentTime;
    for (const [freq, dur, at] of SETS[kind]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0 + at);
      gain.gain.exponentialRampToValueAtTime(0.1, t0 + at + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0 + at);
      osc.stop(t0 + at + dur + 0.03);
    }
  } catch {
    /* audio is optional */
  }
}
