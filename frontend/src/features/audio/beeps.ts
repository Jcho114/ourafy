let ctx: AudioContext | null = null

const DEFAULT_COACH_ID = "jasonchen"

type CoachQuipUrls = { on?: string; off?: string; done?: string; tryit?: string }

const MP3_URLS = import.meta.glob("../../assets/*/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>

const COACH_QUIP_URLS: Record<string, CoachQuipUrls> = (() => {
  const map: Record<string, CoachQuipUrls> = {}

  for (const [p, url] of Object.entries(MP3_URLS)) {
    const cleaned = p.split("?")[0]
    const parts = cleaned.split("/")
    const coach = parts[parts.length - 2]
    const file = parts[parts.length - 1]
    const base = file.replace(/\.mp3$/i, "").toLowerCase()

    if (!coach) continue
    if (!map[coach]) map[coach] = {}

    if (base === "on" || base.startsWith("onmode") || base.startsWith("on_mod") || base.startsWith("on-")) {
      map[coach].on = url
      continue
    }
    if (base === "off" || base.startsWith("offmode") || base.startsWith("off_mod") || base.startsWith("off-")) {
      map[coach].off = url
      continue
    }

    if (base === "tryit" || base === "try" || base.startsWith("tryit") || base.startsWith("try-")) {
      map[coach].tryit = url
      continue
    }

    if (base === "done" || base.startsWith("done") || base.startsWith("done-")) {
      map[coach].done = url
      continue
    }

    // Back-compat with older filenames
    if (base.includes("on") && base.includes("start")) map[coach].on = url
    if (base.includes("off") && base.includes("start")) map[coach].off = url
  }

  return map
})()

let onModeStartQuip: AudioBuffer | null = null
let offModeStartQuip: AudioBuffer | null = null
let doneQuip: AudioBuffer | null = null
let quipLoadPromise: Promise<void> | null = null
let pendingCueToken = 0
let loadedCoachId: string | null = null

const tryItByCoach = new Map<string, AudioBuffer>()

function normalizeCoachId(raw: string) {
  const cleaned = raw.trim().toLowerCase()
  if (!cleaned) return null
  if (!/^[a-z0-9_-]{1,48}$/.test(cleaned)) return null
  return cleaned
}

function getActiveCoachId() {
  if (typeof window === "undefined") return DEFAULT_COACH_ID

  try {
    const sp = new URLSearchParams(window.location.search)
    const fromUrl = normalizeCoachId(sp.get("coach") ?? "")
    if (fromUrl) return fromUrl
  } catch {
    // ignore
  }

  try {
    const fromStorage = normalizeCoachId(window.localStorage.getItem("ourafy.coach") ?? "")
    if (fromStorage) return fromStorage
  } catch {
    // ignore
  }

  return DEFAULT_COACH_ID
}

function resolveCoachId(coachId: string) {
  const normalized = normalizeCoachId(coachId) ?? DEFAULT_COACH_ID
  if (COACH_QUIP_URLS[normalized]) return normalized
  if (COACH_QUIP_URLS[DEFAULT_COACH_ID]) return DEFAULT_COACH_ID
  return normalized
}

function getCoachUrls(coachId: string) {
  return COACH_QUIP_URLS[resolveCoachId(coachId)] ?? {}
}

async function ensureCtxRunning() {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state !== "running") {
    await ctx.resume()
  }
}

async function decodeMp3(url: string) {
  if (!ctx) return null
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`)
  const buf = await res.arrayBuffer()
  return await ctx.decodeAudioData(buf)
}

function warmQuips(coachId: string) {
  if (!ctx || ctx.state !== "running") return
  if (loadedCoachId !== coachId) {
    onModeStartQuip = null
    offModeStartQuip = null
    doneQuip = null
    quipLoadPromise = null
    loadedCoachId = coachId
  }
  if (onModeStartQuip && offModeStartQuip && doneQuip) return
  if (quipLoadPromise) return

  const urls = getCoachUrls(coachId)

  quipLoadPromise = (async () => {
    try {
      const [onBuf, offBuf, doneBuf] = await Promise.all([
        onModeStartQuip
          ? Promise.resolve(onModeStartQuip)
          : urls.on
            ? decodeMp3(urls.on)
            : Promise.resolve(null),
        offModeStartQuip
          ? Promise.resolve(offModeStartQuip)
          : urls.off
            ? decodeMp3(urls.off)
            : Promise.resolve(null),
        doneQuip
          ? Promise.resolve(doneQuip)
          : urls.done
            ? decodeMp3(urls.done)
            : Promise.resolve(null),
      ])
      if (onBuf) onModeStartQuip = onBuf
      if (offBuf) offModeStartQuip = offBuf
      if (doneBuf) doneQuip = doneBuf
    } catch {
      // ignore
    }
  })().finally(() => {
    quipLoadPromise = null
  })
}

function whenQuipsReady() {
  warmQuips(getActiveCoachId())
  return quipLoadPromise ?? Promise.resolve()
}

function playBuffer(buffer: AudioBuffer, gain = 0.7) {
  if (!ctx || ctx.state !== "running") return
  const src = ctx.createBufferSource()
  const amp = ctx.createGain()
  src.buffer = buffer
  amp.gain.value = gain
  src.connect(amp)
  amp.connect(ctx.destination)
  src.start()
}

export function unlockAudio() {
  return ensureCtxRunning()
    .then(() => {
      warmQuips(getActiveCoachId())
    })
    .catch(() => {
      // ignore
    })
}

export function playCoachTryIt(coachId: string) {
  const resolved = resolveCoachId(coachId)

  return ensureCtxRunning()
    .then(async () => {
      const cached = tryItByCoach.get(resolved)
      if (cached) {
        playBuffer(cached)
        return
      }

      const urls = getCoachUrls(resolved)
      const url = urls.tryit
      if (!url) return
      const buf = await decodeMp3(url)
      if (!buf) return
      tryItByCoach.set(resolved, buf)
      playBuffer(buf)
    })
    .catch(() => {
      // ignore
    })
}

export function playPhaseCue(phase: "focus" | "shortBreak" | "done") {
  if (!ctx || ctx.state !== "running") return

  void whenQuipsReady()

  if (phase === "focus") {
    if (onModeStartQuip) {
      playBuffer(onModeStartQuip)
      return
    }

    // If we're still decoding, play once ready (avoid initial fallback beeps).
    const token = ++pendingCueToken
    void whenQuipsReady().then(() => {
      if (token !== pendingCueToken) return
      if (onModeStartQuip) playBuffer(onModeStartQuip)
    })
    return
  }

  if (phase === "shortBreak") {
    if (offModeStartQuip) {
      playBuffer(offModeStartQuip)
      return
    }

    const token = ++pendingCueToken
    void whenQuipsReady().then(() => {
      if (token !== pendingCueToken) return
      if (offModeStartQuip) playBuffer(offModeStartQuip)
    })
    return
  }

  // "done": prefer coach done quip; fall back to off cue.
  if (doneQuip) {
    playBuffer(doneQuip)
    return
  }

  const token = ++pendingCueToken
  void whenQuipsReady().then(() => {
    if (token !== pendingCueToken) return
    if (doneQuip) {
      playBuffer(doneQuip)
      return
    }
    if (offModeStartQuip) playBuffer(offModeStartQuip)
  })
}
