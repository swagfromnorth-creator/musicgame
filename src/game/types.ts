// ---------------------------------------------------------------------------
// STARMAKER v1 — core types
//
// Everything that matters is measured in four numbers: cash, fans, streams and
// reach. Skills bend those numbers; timers decide when you get to touch them.
// ---------------------------------------------------------------------------

export type SongId = string
export type AlbumId = string

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
}

export interface Album {
  id: AlbumId
  title: string
  songIds: SongId[]
  /** the album's own reach figure, shown in the vault */
  reach: number
  createdAt: number
}

export interface JobListing {
  id: string
  title: string
  emoji: string
  pay: number
  durationMs: number
}

export interface ActiveJob {
  listingId: string
  title: string
  emoji: string
  pay: number
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

  songwriting: number
  virality: number
  studioLevel: number

  songs: Song[]
  albums: Album[]

  jobs: JobListing[]
  jobsRefreshAt: number
  activeJob: ActiveJob | null

  writingStartedAt: number | null
  writingDurationMs: number

  /** temporary multipliers */
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
  | { type: 'RENAME_SONG'; id: SongId; title: string }
  | { type: 'RELEASE_SONG'; id: SongId }
  | { type: 'RELEASE_ALBUM'; title: string; songIds: SongId[] }
  | { type: 'TAKE_JOB'; id: string }
  | { type: 'DO_GIG'; id: string }
  | { type: 'BUY_STUDIO' }
  | { type: 'BUY_PROMO' }
  | { type: 'SET_NAME'; name: string }
  | { type: 'RESET' }
