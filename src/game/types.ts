// ---------------------------------------------------------------------------
// STARMAKER — core type definitions
// ---------------------------------------------------------------------------

export type SkillKey =
  | 'songwriting'
  | 'vocals'
  | 'performance'
  | 'production'
  | 'charisma'

export type Skills = Record<SkillKey, number>

export type GenreId =
  | 'pop'
  | 'hiphop'
  | 'rnb'
  | 'rock'
  | 'country'
  | 'edm'
  | 'latin'
  | 'kpop'
  | 'metal'
  | 'jazz'

export type MoodId = 'anthem' | 'heartbreak' | 'club' | 'introspective' | 'rebel'

export type StyleId = 'hooky' | 'deep' | 'vibe'

export interface Song {
  id: string
  title: string
  genre: GenreId
  mood: MoodId
  style: StyleId
  quality: number // 1..100
  /** release state */
  released: boolean
  releaseHour: number | null
  releaseWeek: number | null
  albumId: string | null
  isDiss: boolean
  targetRivalId: string | null
  /** performance */
  streams: number
  streamsThisWeek: number
  streamsLastHour: number
  hype: number
  peak: number
  video: 'none' | 'lyric' | 'concept'
  playlistTier: number
  /** song is 'spent' — faded out */
  dead: boolean
  /** flavour */
  hue: number
  producer: string
  writeCost: number
  /** feature artist */
  featureId: string | null
}

export interface Album {
  id: string
  title: string
  songIds: string[]
  released: boolean
  releaseWeek: number | null
  quality: number
  streams: number
  streamsThisWeek: number
  peak: number
  hue: number
}

export interface Rival {
  id: string
  name: string
  genre: GenreId
  fame: number // 0..100 star power
  followers: number
  hit: number // current single strength 0..100
  heat: number // chart momentum
  beef: number // -100 (best friend) .. 100 (mortal enemy)
  hue: number
  tag: string
  single: string
  lastActionHour: number
}

export interface LabelOffer {
  id: string
  name: string
  advance: number
  royalty: number // fraction of streaming income the label keeps (0..0.85)
  albums: number
  weeks: number
  prestige: number
  push: number // streams multiplier
}

export interface SignedDeal {
  labelId: string
  name: string
  advance: number
  royalty: number
  albumsRemaining: number
  albumsDelivered: number
  weeksLeft: number
  push: number
  prestige: number
  signedWeek: number
  mastersOwned: boolean
}

export interface ChartEntry {
  key: string
  title: string
  artist: string
  score: number
  mine: boolean
  hue: number
}

export interface Charts {
  week: number
  songs: ChartEntry[]
  albums: ChartEntry[]
  artists: ChartEntry[]
}

export interface Award {
  id: string
  week: number
  category: string
  won: boolean
  songTitle: string | null
  rivalName: string | null
  year: number
}

export interface LogEntry {
  id: string
  hour: number
  text: string
  kind: 'good' | 'bad' | 'neutral' | 'money' | 'music'
}

export interface Tour {
  name: string
  city: string
  nightsLeft: number
  totalNights: number
  payoutPerNight: number
  fansPerNight: number
  energyPerNight: number
  nextNightHour: number
}

export type ActivityId =
  | 'rest'
  | 'gym'
  | 'studio-time'
  | 'vocal-coach'
  | 'writing-room'
  | 'dance'
  | 'producer-collab'
  | 'club-appearance'
  | 'local-show'
  | 'post-clip'
  | 'go-live'

export interface PendingSong {
  title: string
  genre: GenreId
  mood: MoodId
  style: StyleId
  quality: number
  producer: string
  cost: number
  featureId: string | null
  isDiss: boolean
  targetRivalId: string | null
}

export interface VideoJob {
  songId: string
  kind: 'lyric' | 'concept'
  hoursLeft: number
  totalHours: number
  cost: number
}

export interface GameState {
  version: number
  createdAt: number
  lastSaved: number
  /** clock — total elapsed game hours since career start */
  hour: number
  week: number
  year: number
  playing: boolean
  speed: number

  // identity
  artistName: string
  genre: GenreId
  origin: string
  portrait: Portrait
  hue: number

  // resources
  money: number
  energy: number
  maxEnergy: number
  health: number
  age: number
  followers: number
  listeners: number
  hype: number
  exposure: number
  controversy: number

  skills: Skills

  songs: Song[]
  albums: Album[]
  rivals: Rival[]
  offers: LabelOffer[]
  label: SignedDeal | null
  charts: Charts
  awards: Award[]
  log: LogEntry[]
  tour: Tour | null
  videos: VideoJob[]
  pending: PendingSong | null

  // purchases / progression
  assets: string[]
  studioLevel: number
  radioTier: number
  playlistPush: number
  promoSpend: number
  featuresBought: string[]

  // meta
  retired: boolean
  legacyLevel: number
  hallOfFame: CareerRecord[]
  lastSeenWeekChart: number
  milestones: string[]
}

export interface CareerRecord {
  name: string
  genre: GenreId
  years: number
  peakFame: number
  bestSong: string
  earnings: number
  awards: number
  hue: number
}

export interface Portrait {
  skin: number
  hair: number
  hairColor: number
  eyes: number
  outfit: number
  accessory: number
  hairStyle: number
}

export type Action =
  | { type: 'TICK'; hours: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'START'; payload: StartPayload }
  | { type: 'NEW_ARTIST'; payload: StartPayload }
  | { type: 'TRAIN'; skill: SkillKey }
  | { type: 'ACTIVITY'; id: ActivityId }
  | { type: 'WRITE_SONG'; payload: WritePayload }
  | { type: 'RELEASE_PENDING'; albumId?: string | null }
  | { type: 'DISCARD_PENDING' }
  | { type: 'HOLD_PENDING' }
  | { type: 'RELEASE_VAULT'; songId: string; albumId?: string | null }
  | { type: 'SHOOT_VIDEO'; songId: string; kind: 'lyric' | 'concept' }
  | { type: 'BUY_PLAYLIST'; songId: string; tier: number }
  | { type: 'MAKE_ALBUM'; title: string; songIds: string[] }
  | { type: 'RELEASE_ALBUM'; albumId: string }
  | { type: 'SIGN_OFFER'; offerId: string }
  | { type: 'DECLINE_OFFER'; offerId: string }
  | { type: 'BUY_MASTERS' }
  | { type: 'BUY_ASSET'; assetId: string }
  | { type: 'UPGRADE_STUDIO' }
  | { type: 'RADIO_PROMO' }
  | { type: 'SOCIAL'; rivalId: string; kind: 'compliment' | 'collab' | 'diss' | 'subtweet' }
  | { type: 'BOOK_TOUR'; tier: number }
  | { type: 'REST' }
  | { type: 'RETIRE' }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: GameState }

export interface StartPayload {
  artistName: string
  genre: GenreId
  origin: string
  portrait: Portrait
  hue: number
}

export interface WritePayload {
  title: string
  genre: GenreId
  mood: MoodId
  style: StyleId
  producerId: string
  featureId: string | null
}
