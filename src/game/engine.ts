import { GIGS, JOBS, STUDIOS, TUNE, randomTitle } from './data'
import type { GameState, JobListing, Song } from './types'

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const uid = () => Math.random().toString(36).slice(2, 9)

// ---------------------------------------------------------------------------
// Jobs: three random listings, thrown out and re-rolled every 80 seconds.
// ---------------------------------------------------------------------------
export function rollJobs(now: number, fans: number): JobListing[] {
  const out: JobListing[] = []
  const used = new Set<number>()
  while (out.length < TUNE.jobSlots) {
    const i = (Math.random() * JOBS.length) | 0
    if (used.has(i)) continue
    used.add(i)
    // a day job tops out: past a certain point it is pocket money
    const scale = Math.min(4, 1 + Math.sqrt(Math.max(0, fans)) / 140)
    const pay = Math.round((14 + Math.random() * 46) * scale)
    const seconds = 8 + Math.random() * 22
    out.push({
      id: uid(),
      title: JOBS[i].title,
      emoji: JOBS[i].emoji,
      pay,
      durationMs: Math.round(seconds * 1000),
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------
export function writeDurationMs(songwriting: number): number {
  // 1:30 at the start, 0:40 with songwriting maxed
  const speed = clamp(songwriting, 0, 100) / 100
  return Math.round(TUNE.writeBaseMs * (1 - speed * TUNE.writeSpeedCut))
}

export function rollQuality(state: GameState): number {
  const studio = STUDIOS[state.studioLevel]?.quality ?? 0
  const base = TUNE.qualityBase + state.songwriting * TUNE.qualityPerSkill + studio
  return clamp(Math.round(base + (Math.random() * 14 - 6)), 1, 100)
}

export function songReach(virality: number, quality: number): number {
  return Math.round((6 + virality * 0.55 + quality * 0.22) * 10) / 10
}

export function songLifespan(virality: number): number {
  return Math.round(40 + virality * 1.1)
}

/** How many plays per hour one record is doing right now. */
export function songRate(s: GameState, song: Song, now: number): number {
  if (!song.releasedAt || song.lifeAnchor === null || song.streams < 0) return 0
  const ageH = Math.max(0, (now - song.lifeAnchor) / 3_600_000)
  const decay = Math.exp(-ageH / Math.max(1, song.lifespanH))
  const decayFloor = 0.02
  const reachMul = 0.25 + song.reach / 45
  const audience = 1 + Math.sqrt(Math.max(0, s.fans)) / 60
  const promo = now < s.promoUntil ? TUNE.promoMult : 1
  const boost = now < s.boostUntil ? TUNE.boostMult : 1
  return song.quality * 0.85 * reachMul * Math.max(decayFloor, decay) * audience * promo * boost
}

export function totalStreamsPerHour(s: GameState, now: number): number {
  let t = 0
  for (const song of s.songs) if (song.releasedAt) t += songRate(s, song, now)
  return t
}

/** The headline reach figure: what your catalogue averages, and how long it lasts. */
export function reachStats(s: GameState): { reach: number; lifespanH: number } {
  const released = s.songs.filter((x) => x.releasedAt)
  if (!released.length) return { reach: 0, lifespanH: 0 }
  const reach = released.reduce((a, b) => a + b.reach, 0) / released.length
  const lifespanH = released.reduce((a, b) => a + b.lifespanH, 0) / released.length
  return { reach: Math.round(reach * 10) / 10, lifespanH: Math.round(lifespanH) }
}

export function gigReady(s: GameState, id: string, now: number): number {
  const at = s.gigReadyAt[id] ?? 0
  return Math.max(0, at - now)
}

// ---------------------------------------------------------------------------
// Creating / advancing the world
// ---------------------------------------------------------------------------
export function initialState(now: number): GameState {
  return {
    version: 1,
    artistName: 'You',
    cash: 40,
    fans: 0,
    totalStreams: 0,
    gigsPlayed: 0,
    songwriting: 0,
    virality: 0,
    studioLevel: 0,
    songs: [],
    albums: [],
    jobs: rollJobs(now, 0),
    jobsRefreshAt: now + TUNE.jobRefreshMs,
    activeJob: null,
    writingStartedAt: null,
    writingDurationMs: writeDurationMs(0),
    promoUntil: 0,
    boostUntil: 0,
    gigReadyAt: {},
    lastTick: now,
    startedAt: now,
    log: [{ id: uid(), at: now, text: 'You have $40 and a bedroom. Get to work.', kind: 'info' }],
  }
}

export function log(s: GameState, text: string, kind: GameState['log'][number]['kind'], now: number) {
  s.log = [{ id: uid(), at: now, text, kind }, ...s.log].slice(0, 40)
}

/**
 * The clock. Everything time-based happens here, driven by wall-clock
 * timestamps so closing the tab does not freeze the world.
 */
export function advance(s: GameState, now: number): void {
  const elapsed = clamp(now - s.lastTick, 0, TUNE.offlineCapMs)
  if (elapsed <= 0) {
    s.lastTick = now
    return
  }
  const from = s.lastTick
  s.lastTick = now

  // streams: average the rate over the window so long gaps stay honest
  let gained = 0
  for (const song of s.songs) {
    if (!song.releasedAt) continue
    const atStart = songRate(s, song, from)
    const atEnd = songRate(s, song, now)
    const avg = (atStart + atEnd) / 2
    const add = (avg * elapsed) / 3_600_000
    song.streams += add
    gained += add
  }
  if (gained > 0) {
    s.totalStreams += gained
    s.cash += gained * TUNE.dollarsPerStream
    s.fans += gained * TUNE.fanPerStream
  }

  // a finished session lands in the vault by itself
  if (s.writingStartedAt !== null && now >= s.writingStartedAt + s.writingDurationMs) {
    const quality = rollQuality(s)
    s.songs.unshift({
      id: uid(),
      title: randomTitle(),
      quality,
      createdAt: now,
      releasedAt: null,
      lifeAnchor: null,
      reach: 0,
      lifespanH: 0,
      streams: 0,
      albumId: null,
    })
    s.writingStartedAt = null
    s.songwriting = clamp(s.songwriting + 1.15 * (1 - s.songwriting / 130), 0, 100)
    log(s, `Finished a new song — ${quality}/100. It is in the vault.`, 'song', now)
  }

  // a finished shift pays out
  if (s.activeJob && now >= s.activeJob.startedAt + s.activeJob.durationMs) {
    const pay = s.activeJob.pay
    s.cash += pay
    log(s, `${s.activeJob.title} paid out.`, 'money', now)
    s.activeJob = null
  }

  // jobs are re-rolled on a timer
  if (now >= s.jobsRefreshAt) {
    s.jobs = rollJobs(now, s.fans)
    s.jobsRefreshAt = now + TUNE.jobRefreshMs
  }

  if (s.promoUntil > 0 && now > s.promoUntil) s.promoUntil = 0
  if (s.boostUntil > 0 && now > s.boostUntil) s.boostUntil = 0
}

export function promoCost(s: GameState): number {
  return Math.round(TUNE.promoCostBase * (1 + s.fans / 250_000))
}

export function availableGigs(s: GameState, now: number) {
  return GIGS.map((g) => ({
    def: g,
    unlocked: s.fans >= g.fansNeeded,
    readyIn: gigReady(s, g.id, now),
  }))
}
