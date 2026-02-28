let ctx: AudioContext | null = null

export function unlockAudio() {
  try {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state !== "running") {
      void ctx.resume()
    }
  } catch {
    // ignore
  }
}

function beep(
  frequency: number,
  durationMs: number,
  gain = 0.045,
  type: OscillatorType = "sine"
) {
  if (!ctx || ctx.state !== "running") return

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, now)
  amp.gain.setValueAtTime(0.0001, now)
  amp.gain.linearRampToValueAtTime(gain, now + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)

  osc.connect(amp)
  amp.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.02)
}

export function playPhaseCue(phase: "focus" | "shortBreak" | "done") {
  if (!ctx || ctx.state !== "running") return

  if (phase === "focus") {
    beep(880, 180, 0.05, "triangle")
    window.setTimeout(() => beep(1320, 110, 0.04, "triangle"), 210)
    return
  }

  if (phase === "shortBreak") {
    beep(520, 140, 0.05, "sine")
    window.setTimeout(() => beep(520, 140, 0.05, "sine"), 190)
    return
  }

  beep(1760, 160, 0.05, "square")
}
