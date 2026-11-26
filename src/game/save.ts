import { initialState } from './engine'
import type { Album, GameState, JobListing, LogEntry, SkillId, Song } from './types'

export const SAVE_KEY = 'starmaker.save'
export const SAVE_VERSION = 2

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function cleanSong(raw: any, now: number): Song | null {
  if (!raw || typeof raw.id !== 'string') return null
  return {
    id: raw.id,
    title: str(raw.title, 'Untitled'),
    quality: Math.max(1, Math.min(100, Math.round(num(raw.quality, 30)))),
    createdAt: num(raw.createdAt, now),
    releasedAt: typeof raw.releasedAt === 'number' ? raw.releasedAt : null,
    lifeAnchor: typeof raw.lifeAnchor === 'number' ? raw.lifeAnchor : null,
    reach: num(raw.reach),
    lifespanH: num(raw.lifespanH),
    streams: num(raw.streams),
    albumId: typeof raw.albumId === 'string' ? raw.albumId : null,
    promoTier: Math.max(0, Math.min(4, Math.round(num(raw.promoTier)))),
  }
}

function cleanAlbum(raw: any, now: number): Album | null {
  if (!raw || typeof raw.id !== 'string') return null
  return {
    id: raw.id,
    title: str(raw.title, 'Untitled'),
    songIds: arr<string>(raw.songIds).filter((x) => typeof x === 'string'),
    reach: num(raw.reach),
    createdAt: num(raw.createdAt, now),
    releasedAt: typeof raw.releasedAt === 'number' ? raw.releasedAt : null,
    promoTier: Math.max(0, Math.min(4, Math.round(num(raw.promoTier)))),
  }
}

function cleanJob(raw: any): JobListing | null {
  if (!raw || typeof raw.id !== 'string') return null
  return {
    id: raw.id,
    title: str(raw.title, 'Shift'),
    emoji: str(raw.emoji, '💼'),
    pay: Math.max(1, Math.round(num(raw.pay, 20))),
    durationMs: Math.max(2000, num(raw.durationMs, 15000)),
    tier: Math.max(0, Math.round(num(raw.tier))),
  }
}

/**
 * A save is a promise you cannot break. Anything the current build does not
 * understand gets filled in from a fresh state; anything genuinely unusable
 * gets thrown away rather than crashing the app into a black screen.
 */
export function sanitizeSave(raw: unknown): GameState | null {
  if (!raw || typeof raw !== 'object') return null
  const now = Date.now()
  const r = raw as any
  const base = initialState(now)

  const skillsRaw = r.skills && typeof r.skills === 'object' ? r.skills : {}
  const skills: Record<SkillId, number> = {
    // v1 stored songwriting and virality as flat numbers at the top level
    songwriting: clampSkill(skillsRaw.songwriting ?? r.songwriting),
    rhythm: clampSkill(skillsRaw.rhythm),
    virality: clampSkill(skillsRaw.virality ?? r.virality),
  }

  const songs = arr<any>(r.songs).map((x) => cleanSong(x, now)).filter((x): x is Song => !!x)
  const albums = arr<any>(r.albums).map((x) => cleanAlbum(x, now)).filter((x): x is Album => !!x)
  const known = new Set(songs.map((s) => s.id))
  for (const a of albums) a.songIds = a.songIds.filter((id) => known.has(id))

  const jobs = arr<any>(r.jobs).map(cleanJob).filter((x): x is JobListing => !!x)

  const trainingRaw = r.training
  const training =
    trainingRaw &&
    typeof trainingRaw.skill === 'string' &&
    (['songwriting', 'rhythm', 'virality'] as string[]).includes(trainingRaw.skill) &&
    typeof trainingRaw.startedAt === 'number'
      ? {
          skill: trainingRaw.skill as SkillId,
          startedAt: trainingRaw.startedAt,
          durationMs: Math.max(1000, num(trainingRaw.durationMs, 10000)),
        }
      : null

  const activeRaw = r.activeJob
  const activeJob =
    activeRaw && typeof activeRaw.title === 'string' && typeof activeRaw.startedAt === 'number'
      ? {
          title: activeRaw.title,
          emoji: str(activeRaw.emoji, '💼'),
          pay: num(activeRaw.pay, 20),
          startedAt: activeRaw.startedAt,
          durationMs: Math.max(2000, num(activeRaw.durationMs, 15000)),
        }
      : null

  const log: LogEntry[] = arr<any>(r.log)
    .filter((e) => e && typeof e.text === 'string')
    .slice(0, 40)
    .map((e) => ({
      id: str(e.id, Math.random().toString(36).slice(2, 9)),
      at: num(e.at, now),
      text: String(e.text).slice(0, 140),
      kind: ['money', 'fan', 'song', 'reach', 'info'].includes(e.kind) ? e.kind : 'info',
    }))

  const gigReadyAt: Record<string, number> = {}
  if (r.gigReadyAt && typeof r.gigReadyAt === 'object') {
    for (const [k, v] of Object.entries(r.gigReadyAt)) if (typeof v === 'number') gigReadyAt[k] = v
  }

  return {
    ...base,
    version: SAVE_VERSION,
    artistName: str(r.artistName, base.artistName) || base.artistName,
    cash: Math.max(0, num(r.cash, base.cash)),
    fans: Math.max(0, num(r.fans)),
    totalStreams: Math.max(0, num(r.totalStreams)),
    gigsPlayed: Math.max(0, num(r.gigsPlayed)),
    skills,
    studioLevel: Math.max(0, Math.min(5, Math.round(num(r.studioLevel)))),
    songs,
    albums,
    jobs: jobs.length ? jobs : base.jobs,
    jobsRefreshAt: num(r.jobsRefreshAt, base.jobsRefreshAt),
    activeJob,
    training,
    writingStartedAt: typeof r.writingStartedAt === 'number' ? r.writingStartedAt : null,
    writingDurationMs: Math.max(5000, num(r.writingDurationMs, base.writingDurationMs)),
    promoUntil: num(r.promoUntil),
    boostUntil: num(r.boostUntil),
    gigReadyAt,
    lastTick: num(r.lastTick, now),
    startedAt: num(r.startedAt, now),
    log: log.length ? log : base.log,
  }
}

function clampSkill(v: unknown): number {
  const n = num(v)
  return Math.max(0, Math.min(100, n))
}

export function readSave(): GameState | null {
  try {
    if (typeof localStorage === 'undefined') return null
    // current key first, then the v1 key so old careers survive the upgrade
    for (const key of [SAVE_KEY, 'starmaker.v1.save']) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      const clean = sanitizeSave(parsed)
      if (clean) return clean
    }
  } catch {
    /* unreadable save is no save */
  }
  return null
}

export function writeSave(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked — the game keeps running */
  }
}

export function clearSaves(): void {
  try {
    localStorage.removeItem(SAVE_KEY)
    localStorage.removeItem('starmaker.v1.save')
  } catch {
    /* ignore */
  }
}
