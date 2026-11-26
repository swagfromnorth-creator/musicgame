import { JOB_TIERS, PROMO_TIERS, SKILLS, STUDIOS, TUNE, randomTitle } from './data'
import type { GameState, JobListing, Song } from './types'

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const uid = () => Math.random().toString(36).slice(2, 9)

export function skillName(id: keyof GameState['skills']): string {
  return SKILLS.find((s) => s.id === id)?.name ?? id
}

// ---------------------------------------------------------------------------
// Training: one skill at a time, and every level takes longer than the last.
// ---------------------------------------------------------------------------
export function trainDurationMs(level: number): number {
  return Math.round(TUNE.trainBaseMs * Math.pow(TUNE.trainGrowth, Math.max(0, level)))
}

export function studioFee(s: GameState): number {
  return STUDIOS[s.studioLevel]?.cost ?? 0
}

// ---------------------------------------------------------------------------
// Work. The work on offer is decided by how many people know your name.
// ---------------------------------------------------------------------------
export function unlockedTiers(fans: number): number {
  let n = 1
  for (let i = 0; i < JOB_TIERS.length; i++) if (fans >= JOB_TIERS[i].fansNeeded) n = i + 1
  return n
}

export function rollJobs(now: number, fans: number): JobListing[] {
  const count = unlockedTiers(fans)
  const out: JobListing[] = []
  for (let i = 0; i < TUNE.jobSlots; i++) {
    // mostly the best tier you qualify for, sometimes one below for variety
    const tierIdx = i === 0 || Math.random() < 0.65 ? count - 1 : (Math.random() * count) | 0
    const tier = JOB_TIERS[tierIdx]
    const job = tier.pool[(Math.random() * tier.pool.length) | 0]
    const [lo, hi] = tier.pay
    const [slo, shi] = tier.seconds
    out.push({
      id: uid(),
      title: job.title,
      emoji: job.emoji,
      pay: Math.round(lo + Math.random() * (hi - lo)),
      durationMs: Math.round((slo + Math.random() * (shi - slo)) * 1000),
      tier: tierIdx,
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Songs
// ---------------------------------------------------------------------------
export function writeDurationMs(skills: GameState['skills']): number {
  const cut =
    (clamp(skills.rhythm, 0, 100) / 100) * TUNE.rhythmSpeedCut +
    (clamp(skills.songwriting, 0, 100) / 100) * TUNE.songwritingSpeedCut
  return Math.round(TUNE.writeBaseMs * (1 - cut))
}

export function rollQuality(s: GameState): number {
  const studio = STUDIOS[s.studioLevel]?.quality ?? 0
  const base = TUNE.qualityBase + s.skills.songwriting * TUNE.qualityPerSkill + studio
  return clamp(Math.round(base + (Math.random() * 14 - 6)), 1, 100)
}

export function baseSongReach(virality: number, quality: number): number {
  return Math.round((6 + virality * 0.55 + quality * 0.22) * 10) / 10
}

export function promoOf(tier: number) {
  return PROMO_TIERS[clamp(tier, 0, PROMO_TIERS.length - 1)]
}

export function songReachWithPromo(virality: number, quality: number, promoTier: number): number {
  return Math.round((baseSongReach(virality, quality) + promoOf(promoTier).reach) * 10) / 10
}

export function songLifespan(virality: number): number {
  return Math.round(40 + virality * 1.1)
}

export function albumReachFor(s: GameState, songIds: string[], promoTier: number): number {
  const songs = s.songs.filter((x) => songIds.includes(x.id))
  if (!songs.length) return 0
  const avg = songs.reduce((a, b) => a + baseSongReach(s.skills.virality, b.quality), 0) / songs.length
  const reach = avg * (1.2 + s.skills.virality / 400) + promoOf(promoTier).reach
  return Math.round(reach * 10) / 10
}

/** How many plays per hour one record is doing right now. */
export function songRate(s: GameState, song: Song, now: number): number {
  if (!song.releasedAt || song.lifeAnchor === null) return 0
  const ageH = Math.max(0, (now - song.lifeAnchor) / 3_600_000)
  const decay = Math.exp(-ageH / Math.max(1, song.lifespanH))
  const reachMul = 0.25 + song.reach / 45
  const audience = 1 + Math.sqrt(Math.max(0, s.fans)) / 60
  const promo = now < s.promoUntil ? TUNE.promoMult : 1
  const boost = now < s.boostUntil ? TUNE.boostMult : 1
  return song.quality * 0.85 * reachMul * Math.max(0.02, decay) * audience * promo * boost
}

export function totalStreamsPerHour(s: GameState, now: number): number {
  let t = 0
  for (const song of s.songs) if (song.releasedAt) t += songRate(s, song, now)
  return t
}

/** The headline figure: what your catalogue averages, and how long it lasts. */
export function reachStats(s: GameState): { reach: number; lifespanH: number } {
  const released = s.songs.filter((x) => x.releasedAt)
  if (!released.length) return { reach: 0, lifespanH: 0 }
  const reach = released.reduce((a, b) => a + b.reach, 0) / released.length
  const lifespanH = released.reduce((a, b) => a + b.lifespanH, 0) / released.length
  return { reach: Math.round(reach * 10) / 10, lifespanH: Math.round(lifespanH) }
}

export function gigReady(s: GameState, id: string, now: number): number {
  return Math.max(0, (s.gigReadyAt[id] ?? 0) - now)
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
    skills: { songwriting: 0, rhythm: 0, virality: 0 },
    studioLevel: 0,
    songs: [],
    albums: [],
    jobs: rollJobs(now, 0),
    jobsRefreshAt: now + TUNE.jobRefreshMs,
    activeJob: null,
    jobQueue: null,
    training: null,
    writingStartedAt: null,
    writingDurationMs: writeDurationMs({ songwriting: 0, rhythm: 0, virality: 0 }),
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
    const avg = (songRate(s, song, from) + songRate(s, song, now)) / 2
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
      promoTier: 0,
    })
    s.writingStartedAt = null
    log(s, `Finished a new song — ${quality}/100. It is in the vault.`, 'song', now)
  }

  // training never stops on its own: each level rolls straight into the next
  let guard = 0
  while (s.training && now >= s.training.startedAt + s.training.durationMs && guard++ < 500) {
    const finishedAt = s.training.startedAt + s.training.durationMs
    const id = s.training.skill
    if (s.skills[id] >= TUNE.maxSkill) {
      s.training = null
      break
    }
    s.skills[id] = clamp(s.skills[id] + 1, 0, TUNE.maxSkill)
    if (s.skills[id] >= TUNE.maxSkill) {
      s.training = null
      log(s, `${skillName(id)} is maxed out at ${TUNE.maxSkill}.`, 'info', now)
      break
    }
    s.training = {
      skill: id,
      startedAt: finishedAt,
      durationMs: trainDurationMs(s.skills[id]),
    }
  }

  // a finished shift pays out
  if (s.activeJob && now >= s.activeJob.startedAt + s.activeJob.durationMs) {
    const finishedAt = s.activeJob.startedAt + s.activeJob.durationMs
    s.cash += s.activeJob.pay
    log(s, `${s.activeJob.title} paid out.`, 'money', now)
    const next = s.jobQueue
    s.activeJob = null
    s.jobQueue = null
    if (next) {
      s.activeJob = { ...next, startedAt: Math.min(finishedAt, now) }
      log(s, `${next.title} starts straight away.`, 'info', now)
    }
  }

  // work is re-rolled on a timer, and improves as your audience grows
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
