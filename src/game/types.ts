// ---------------------------------------------------------------------------
// STARMAKER v1 — core types
//
// Four numbers matter: cash, fans, streams and reach. Three skills bend them.
// Everything that takes time runs off a wall-clock timestamp so it keeps
// running whether or not the tab is open.
// ---------------------------------------------------------------------------

export type SongId = string
export type AlbumId = string
export type SkillId = 'songwriting' | 'rhythm' | 'virality'

export interface Song {
  id: SongId
  title: string
  /** 1..100, shown to the player as a plain number */
  quality: number
  createdAt: number
  /** null while it sits in the vault */
  releasedAt: number | null
  /** when the decay clock started — reset by an album */
  lifeAnchor: number | null
  /** how far this record travels, fixed at release */
  reach: number
  /** how long it keeps travelling, in hours */
  lifespanH: number
  streams: number
  albumId: AlbumId | null
  /** index into PROMO_TIERS, chosen before release and paid on release */
  promoTier: number
}

export interface Album {
  id: AlbumId
  title: string
  songIds: SongId[]
  /** the album's own reach figure */
  reach: number
  createdAt: number
  releasedAt: number | null
  promoTier: number
}

export interface JobListing {
  id: string
  title: string
  emoji: string
  pay: number
  durationMs: number
  tier: number
}

export interface ActiveJob {
  title: string
  emoji: string
  pay: number
  startedAt: number
  durationMs: number
}

export interface ActiveTraining {
  skill: SkillId
  startedAt: number
  durationMs: number
}

export interface GigDef {
  id: string
  name: string
  emoji: string
  fansNeeded: number
  pay: number
  fans: number
  cooldownMs: number
  blurb: string
}

export interface StudioDef {
  name: string
  cost: number
  quality: number
  blurb: string
}

export interface PromoTier {
  name: string
  cost: number
  reach: number
  blurb: string
}

export interface LogEntry {
  id: string
  at: number
  text: string
  kind: 'money' | 'fan' | 'song' | 'reach' | 'info'
}

export interface GameState {
  version: number
  artistName: string

  cash: number
  fans: number
  totalStreams: number
  gigsPlayed: number

  skills: Record<SkillId, number>
  studioLevel: number

  songs: Song[]
  albums: Album[]

  jobs: JobListing[]
  jobsRefreshAt: number
  activeJob: ActiveJob | null

  training: ActiveTraining | null
  writingStartedAt: number | null
  writingDurationMs: number

  promoUntil: number
  boostUntil: number
  gigReadyAt: Record<string, number>

  lastTick: number
  startedAt: number
  log: LogEntry[]
}

export type Action =
  | { type: 'TICK'; now: number }
  | { type: 'WRITE' }
  | { type: 'CANCEL_WRITE' }
  | { type: 'TRAIN'; skill: SkillId }
  | { type: 'STOP_TRAIN' }
  | { type: 'RENAME_SONG'; id: SongId; title: string }
  | { type: 'SET_SONG_PROMO'; id: SongId; tier: number }
  | { type: 'RELEASE_SONG'; id: SongId }
  | { type: 'CREATE_ALBUM'; title: string; songIds: SongId[] }
  | { type: 'RENAME_ALBUM'; id: AlbumId; title: string }
  | { type: 'SET_ALBUM_PROMO'; id: AlbumId; tier: number }
  | { type: 'RELEASE_ALBUM'; id: AlbumId }
  | { type: 'DISSOLVE_ALBUM'; id: AlbumId }
  | { type: 'TAKE_JOB'; id: string }
  | { type: 'DO_GIG'; id: string }
  | { type: 'BUY_STUDIO' }
  | { type: 'BUY_PROMO' }
  | { type: 'SET_NAME'; name: string }
  | { type: 'RESET' }
