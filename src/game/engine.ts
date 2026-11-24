import type {
  Album,
  Award,
  ChartEntry,
  Charts,
  GameState,
  GenreId,
  LabelOffer,
  LogEntry,
  Rival,
  SignedDeal,
  SkillKey,
  Song,
  StartPayload,
  Tour,
} from './types'
import { createPeople, isRoomOpen as roomOpen, roomOf as roomOfRoom } from './people'
import {
  ACTIVITIES,
  ASSETS,
  GENRES,
  HAIR_COLORS,
  LABELS,
  MOODS,
  PLAYLIST_TIERS,
  PRODUCERS,
  RADIO_TIERS,
  SKIN_TONES,
  TOURS,
  money,
  pick,
  randomName,
  randomTag,
  ui,
} from './data'

export const WEEK_HOURS = 168
export const START_HOURS = 8

let idCounter = 0
export function uid(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${Math.floor(Math.random() * 9999)}`
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo)
}

/** stable pseudo-random 0..1 from a seed — keeps charts from flickering */
export function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function gradeFor(q: number): { label: string; color: string } {
  if (q >= 89) return { label: 'S', color: '#f5c451' }
  if (q >= 77) return { label: 'A', color: '#4ade80' }
  if (q >= 63) return { label: 'B', color: '#38bdf8' }
  if (q >= 48) return { label: 'C', color: '#a78bfa' }
  if (q >= 32) return { label: 'D', color: '#fbbf24' }
  return { label: 'F', color: '#f87171' }
}

export function genreOf(id: GenreId) {
  return GENRES.find((g) => g.id === id) ?? GENRES[0]
}

export function weekOf(hour: number): number {
  return Math.floor(hour / WEEK_HOURS) + 1
}

export function yearOf(hour: number): number {
  return Math.floor(hour / (WEEK_HOURS * 52)) + 1
}

// ---------------------------------------------------------------------------
// derived stats
// ---------------------------------------------------------------------------

export function fameOf(s: GameState): number {
  const follows = 16 * Math.log10(1 + s.followers / 2000)
  const listens = 5 * Math.log10(1 + s.listeners / 30000)
  const bestPeak = s.songs.reduce((acc, x) => Math.min(acc, x.peak || 999), 999)
  const chartBonus = bestPeak <= 1 ? 6 : bestPeak <= 3 ? 4.5 : bestPeak <= 10 ? 2.5 : bestPeak <= 25 ? 1 : 0
  const awards = Math.min(14, s.awards.filter((a) => a.won).length * 1.4)
  const lvl = s.legacyLevel * 2
  return clamp(1 + follows + listens + chartBonus + awards + lvl, 0, 100)
}

/**
 * Reach is the whole point of the social game: radio rotation, press and a manager
 * are the only things that turn a record into a wide audience.
 */
export function reachConvOf(s: GameState): number {
  return Math.pow(Math.max(reachOf(s), 0.2) / 0.55, TUNE.reachExp)
}

export function reachOf(s: GameState): number {
  const radio = [0.55, 0.75, 1.0, 1.3, 1.7, 2.1][clamp(s.radioTier, 0, 5)]
  const press = 1 + (s.press?.level ?? 0) * 0.16
  const mgr = s.manager ? 1.28 : 1
  return radio * press * mgr
}

/** Audience-scaled effects saturate (see store.sat). */
export function sat(followers: number): number {
  return (followers * 22000) / (followers + 22000)
}

/** Balance knobs, exported so the headless balance bot can probe the curve. */
export const TUNE = {
  streamBase: 40,
  fanExp: 0.6,
  catalogExp: 0.85,
  conv: 0.0011,
  reachExp: 2.6,
  churn: 0.0021,
  churnExp: 0.45,
}

// Attention is finite: a big catalogue does not multiply itself, it divides.
let catRef: unknown = null
let catN = 1
function releasedCount(s: GameState): number {
  if (catRef !== s.songs) {
    catRef = s.songs
    catN = Math.max(1, s.songs.reduce((a, b) => a + (b.released ? 1 : 0), 0))
  }
  return catN
}

export function streamsPerHour(s: GameState, song: Song): number {
  if (!song.released || song.releaseHour === null) return 0
  const fanF = Math.max(s.followers, 20) / 40
  const qF = Math.pow(Math.max(song.quality, 5) / 40, 2.4)
  const attention = 1 / Math.pow(releasedCount(s), TUNE.catalogExp)
  // old records fade; a catalogue earns a living, it does not compound
  const ageWeeks = Math.max(0, s.hour - song.releaseHour) / 168
  const ageF = Math.max(0.35, 1 / (1 + ageWeeks / 34))
  const base = TUNE.streamBase * Math.pow(fanF, TUNE.fanExp) * qF * attention * ageF
  const ageH = Math.max(0, s.hour - song.releaseHour)
  // launch spike, then a long streaming tail
  const spike = ageH < 60 ? 1 + 1.15 * (1 - ageH / 60) : 1
  const decay = 0.02 + 0.98 * Math.exp(-ageH / 900)
  const videoMult = song.video === 'concept' ? 1.22 : song.video === 'lyric' ? 1.1 : 1
  const hypeMult = 1 + song.hype * 0.011
  const playlistMult = 1 + song.playlistTier * 0.0 + (song.playlistTier > 0 ? PLAYLIST_TIERS[song.playlistTier - 1].mult - 1 : 0)
  const radioMult = reachOf(s)
  const labelPush = s.label ? s.label.push : 1
  const genre = genreOf(song.genre)
  const dissMult = song.isDiss ? 1.3 : 1
  const exposureMult = 1 + s.exposure * 0.004
  return (
    base *
    spike *
    decay *
    videoMult *
    hypeMult *
    (1 + playlistMult) *
    radioMult *
    labelPush *
    genre.reach *
    dissMult *
    exposureMult
  )
}

export function totalStreamsPerHour(s: GameState): number {
  let t = 0
  for (const song of s.songs) t += song.streamsLastHour
  for (const a of s.albums) if (a.released) t += albumStreamsPerHour(s, a)
  return t
}

export function albumStreamsPerHour(s: GameState, album: Album): number {
  const tracks = album.songIds
    .map((id) => s.songs.find((x) => x.id === id))
    .filter(Boolean) as Song[]
  if (!tracks.length) return 0
  const avgQ = tracks.reduce((a, b) => a + b.quality, 0) / tracks.length
  const fanF = Math.max(s.followers, 20) / 40
  const base = 9 * Math.pow(fanF, 0.5) * Math.pow(avgQ / 45, 2.2) * Math.min(tracks.length, 12) * 0.55
  const ageWeeks = album.releaseWeek ? s.week - album.releaseWeek : 0
  const decay = 0.25 + 0.75 * Math.exp(-Math.max(0, ageWeeks) / 22)
  const radioMult = RADIO_TIERS[s.radioTier]?.mult ?? 1
  return base * decay * radioMult * (s.label ? s.label.push : 1)
}

export function incomePerHour(s: GameState): number {
  const streams = totalStreamsPerHour(s)
  const cut = s.label && !s.label.mastersOwned ? s.label.royalty : 0.06
  const masterMult = s.label && s.label.mastersOwned ? 1.55 : 1
  return streams * 0.0034 * (1 - cut) * masterMult
}

export function bestSong(s: GameState): Song | null {
  let best: Song | null = null
  for (const x of s.songs) if (!best || x.streams > best.streams) best = x
  return best
}

// ---------------------------------------------------------------------------
// creation
// ---------------------------------------------------------------------------

export function createRivals(seedFame = 0): Rival[] {
  const tiers = [92, 84, 76, 68, 60, 52, 44, 36, 28, 21, 15, 10]
  const used = new Set<string>()
  return tiers.map((f, i) => {
    const genre = pick(GENRES).id
    const followers = Math.round(Math.pow(f / 4, 3.05) * 210)
    let name = randomName()
    let guard = 0
    while (used.has(name) && guard++ < 40) name = randomName()
    used.add(name)
    return {
      id: `rival_${i}`,
      name,
      genre,
      fame: clamp(f + (seedFame > 50 ? rand(-2, 2) : 0), 3, 99),
      followers,
      hit: clamp(40 + rand(-18, 32), 10, 99),
      heat: rand(0.7, 1.3),
      beef: Math.round(rand(-20, 10)),
      hue: pick(GENRES).hue + rand(-18, 18),
      tag: randomTag(),
      single: pick(['Afterglow', 'No Signal', 'Golden Hour', 'Bad Weather', 'Static Love', 'Rooftop', 'Hollow Crown', 'Slow Burn', 'Wildfire', 'Nightdrive', 'Paper Planes', 'Cold Coffee']),
      lastActionHour: 0,
    }
  })
}

export function initialState(payload: StartPayload): GameState {
  const s: GameState = {
    version: 1,
    createdAt: Date.now(),
    lastSaved: Date.now(),
    hour: START_HOURS,
    week: 1,
    year: 1,
    playing: true,
    speed: 1,
    artistName: payload.artistName,
    genre: payload.genre,
    origin: payload.origin,
    portrait: payload.portrait,
    hue: payload.hue,
    money: 750,
    energy: 100,
    maxEnergy: 100,
    health: 100,
    age: 19,
    followers: 32,
    listeners: 48,
    hype: 4,
    exposure: 12,
    controversy: 0,
    skills: { songwriting: 16, vocals: 18, performance: 14, production: 12, charisma: 20 },
    songs: [],
    albums: [],
    rivals: createRivals(),
    people: createPeople(START_HOURS),
    room: null,
    roomEnteredHour: 0,
    dialogue: null,
    beat: null,
    boons: { nextSongQuality: 0, nextSongDiscount: 0, videoDiscount: 0, studioVisitId: null },
    manager: null,
    press: { level: 0, lastPieceWeek: 0 },
    offers: [],
    label: null,
    charts: { week: 0, songs: [], albums: [], artists: [] },
    awards: [],
    log: [],
    tour: null,
    videos: [],
    pending: null,
    assets: [],
    studioLevel: 0,
    radioTier: 0,
    playlistPush: 0,
    promoSpend: 0,
  cooldowns: {},
    featuresBought: [],
    retired: false,
    legacyLevel: 0,
    hallOfFame: [],
    lastSeenWeekChart: 0,
    milestones: [],
  }
  s.log = [
    {
      id: uid('log'),
      hour: s.hour,
      text: `You are ${payload.artistName}. ${payload.origin}. $750, one demo, and no plan B.`,
      kind: 'neutral',
    },
  ]
  s.charts = computeCharts(s)
  return s
}

export function makeLog(text: string, kind: LogEntry['kind'], hour: number): LogEntry {
  return { id: uid('log'), hour, text, kind }
}

/** hype is a 0-100 resource and must never escape it — it multiplies every stream */
export function addHype(s: GameState, n: number) {
  s.hype = clamp(s.hype + n, 0, 100)
}

function log(s: GameState, text: string, kind: LogEntry['kind'] = 'neutral') {
  s.log.unshift(makeLog(text, kind, s.hour))
  if (s.log.length > 70) s.log.length = 70
}

// ---------------------------------------------------------------------------
// songwriting
// ---------------------------------------------------------------------------

export function studioBonus(level: number): number {
  return [0, 5, 11, 18, 26, 36][clamp(level, 0, 5)]
}

export function writeQuality(
  s: GameState,
  input: { genre: GenreId; style: string; producerId: string; title: string },
): number {
  const producer = PRODUCERS.find((p) => p.id === input.producerId) ?? PRODUCERS[0]
  const sk = s.skills
  const style = input.style === 'hooky' ? sk.charisma : input.style === 'deep' ? sk.songwriting : sk.production
  const weighted =
    sk.songwriting * 0.34 +
    sk.vocals * 0.22 +
    sk.production * 0.18 +
    sk.charisma * 0.1 +
    style * 0.16
  // 15 + 0.85x maps "total beginner" to a D-grade demo and "maxed skills" to a classic
  let base = 15 + weighted * 0.85
  base += producer.bonus * 0.55 + studioBonus(s.studioLevel) * 0.4
  if (input.genre === s.genre) base += 5
  else base -= 4
  // inspiration: a little randomness, weighted by charisma (a great artist is consistent)
  const swing = 11 - sk.charisma * 0.05
  base += rand(-swing, swing)
  if (s.health < 60) base -= (60 - s.health) * 0.16
  if (s.energy < 25) base -= (25 - s.energy) * 0.25
  // creativity flow — everything you learned compounds
  const totalSkills = sk.songwriting + sk.vocals + sk.production + sk.charisma + sk.performance
  base += (totalSkills / 500) * 7
  return Math.round(clamp(base, 3, 100))
}

// ---------------------------------------------------------------------------
// charts
// ---------------------------------------------------------------------------

function rivalWeek(s: GameState, r: Rival): number {
  const momentum = 0.72 + Math.sin((s.week + r.fame) / 5.5) * 0.3
  return r.followers * 0.31 * (r.hit / 55) * momentum * r.heat
}

export function computeCharts(s: GameState): Charts {
  const songs: ChartEntry[] = []
  const albums: ChartEntry[] = []
  const artists: ChartEntry[] = []

  for (const r of s.rivals) {
    if (r.fame < 6) continue
    songs.push({
      key: r.id,
      title: r.single,
      artist: r.name,
      score: rivalWeek(s, r),
      mine: false,
      hue: r.hue,
    })
    if (r.fame > 30) {
      albums.push({
        key: r.id + '_a',
        title: pick(['The Long Way Down', 'Neon Cathedral', 'Paper Kingdom', 'Second Nature', 'Everything At Once', 'Vice', 'Loud Quiet Loud']),
        artist: r.name,
        score: rivalWeek(s, r) * (0.7 + hash(r.fame * 2.3 + s.week) * 1.3),
        mine: false,
        hue: r.hue,
      })
    }
  }

  // The Hot 100 is a gatekeeping machine. A song only registers if radio,
  // curators or a label are already moving it. Unsigned and unpushed, you can
  // stream all day and never appear.
  const reach = reachOf(s)
  const pushed = reach >= 0.9 || s.hype >= 45 || s.press.level > 0 || !!s.label
  for (const song of s.songs) {
    if (!song.released || song.albumId) continue
    if (!pushed && song.playlistTier === 0 && song.quality < 62) continue
    songs.push({
      key: song.id,
      title: song.title,
      artist: s.artistName,
      score: song.streamsThisWeek,
      mine: true,
      hue: song.hue,
    })
  }
  for (const album of s.albums) {
    if (!album.released) continue
    if (!pushed) continue
    albums.push({
      key: album.id,
      title: album.title,
      artist: s.artistName,
      score: album.streamsThisWeek,
      mine: true,
      hue: album.hue,
    })
  }

  const rivalArtistScore = new Map<string, number>()
  for (const r of s.rivals) rivalArtistScore.set(r.id, rivalWeek(s, r) * (1.0 + hash(r.fame + s.week * 3.1) * 1.4))
  for (const r of s.rivals) {
    artists.push({ key: r.id + '_ar', title: r.name, artist: genreOf(r.genre).name, score: rivalArtistScore.get(r.id) ?? 0, mine: false, hue: r.hue })
  }
  const myTotal =
    s.songs.filter((x) => x.released).reduce((a, b) => a + b.streamsThisWeek, 0) +
    s.albums.filter((x) => x.released).reduce((a, b) => a + b.streamsThisWeek, 0)
  artists.push({ key: 'me', title: s.artistName, artist: 'You', score: myTotal, mine: true, hue: s.hue })

  const by = (a: ChartEntry, b: ChartEntry) => b.score - a.score
  songs.sort(by)
  albums.sort(by)
  artists.sort(by)
  return { week: s.week, songs: songs.slice(0, 100), albums: albums.slice(0, 60), artists: artists.slice(0, 40) }
}

function rollWeek(s: GameState) {
  s.week = weekOf(s.hour)
  s.year = yearOf(s.hour)
  s.charts = computeCharts(s)

  // record peaks
  for (const song of s.songs) {
    const idx = s.charts.songs.findIndex((e) => e.key === song.id)
    if (idx >= 0) {
      const rank = idx + 1
      if (rank <= 40) {
        // Charting only recruits if somebody is already carrying the record
        const chartReach = Math.min(1.6, Math.max(0.12, reachConvOf(s) * 0.22))
        const pull = song.streamsThisWeek * 0.0016 * (1 + (40 - rank) / 12) * chartReach
        s.followers += pull
        if (rank <= 10 && song.peak !== rank && Math.random() < 0.5) {
          log(s, `📈 "${song.title}" is at #${rank}. People who never listened are listening.`, 'good')
        }
      }
      song.peak = song.peak === 0 ? rank : Math.min(song.peak, rank)
      if (rank === 1 && !s.milestones.includes('no1')) {
        s.milestones.push('no1')
        log(s, `🏆 "${song.title}" hits #1 on the Hot 100. You are officially a chart-topper.`, 'good')
      }
    }
    song.streamsThisWeek = 0
  }
  for (const album of s.albums) {
    const idx = s.charts.albums.findIndex((e) => e.key === album.id)
    if (idx >= 0) album.peak = album.peak === 0 ? idx + 1 : Math.min(album.peak, idx + 1)
    album.streamsThisWeek = 0
  }
  const myFame = fameOf(s)
  for (const r of s.rivals) {
    const pull = Math.max(0, myFame - r.fame) * 0.07
    r.fame = clamp(r.fame + rand(-1.3, 1.4) + pull, 2, 99)
    r.followers = Math.round(Math.pow(r.fame / 4, 3.05) * 210 * (0.85 + hash(r.fame) * 0.3))
    r.hit = clamp(r.hit + rand(-6, 6), 8, 99)
    if (Math.random() < 0.34) {
      r.single = pick(['Afterglow', 'No Signal', 'Golden Hour', 'Bad Weather', 'Static Love', 'Rooftop', 'Hollow Crown', 'Slow Burn', 'Wildfire', 'Nightdrive', 'Paper Planes', 'Cold Coffee', 'Velvet Rope', 'Heathen', 'Sunday Static'])
    }
    r.heat = clamp(r.heat + rand(-0.12, 0.12), 0.55, 1.5)
  }

  // label clock
  if (s.label) {
    s.label.weeksLeft -= 1
    if (s.label.weeksLeft <= 0) {
      log(s, `📃 Your deal with ${s.label.name} has expired.`, 'neutral')
      s.label = null
    }
  }

  decayRelationships(s)
  maybeAwards(s)
  maybeOffers(s)
  // song fades
  for (const song of s.songs) {
    if (song.released && (s.hour - (song.releaseHour ?? 0)) > WEEK_HOURS * 90) song.dead = true
  }
}

function decayRelationships(s: GameState) {
  for (const p of s.people) {
    p.favorsThisWeek = 0
    p.patience = clamp(p.patience + 14, 0, 100)
    if (!p.met) continue
    const days = (s.hour - p.lastSeenHour) / 24
    if (days > 6) {
      const drift = (days - 6) * 0.42
      p.affinity = clamp(p.affinity - drift, -100, 100)
      if (p.traits.includes('loyal')) p.affinity = clamp(p.affinity + drift * 0.45, -100, 100)
    }
    // a burned contact does not stay quiet
    if (p.affinity < -25) {
      p.grudge = clamp(p.grudge + rand(1, 4), 0, 100)
      if (p.grudge > 25 && Math.random() < 0.24) {
        const trait = p.traits.find((t) => t === 'gossip' || t === 'ruthless' || t === 'volatile')
        if (trait) {
          log(s, `🗣️ ${p.name} is telling people you are difficult. It gets back to you by Friday.`, 'bad')
          s.hype = clamp(s.hype - 4, 0, 100)
          s.controversy = clamp(s.controversy + 6, 0, 100)
        }
      }
    }
    if (p.patience <= 0) {
      p.affinity = clamp(p.affinity - 6, -100, 100)
    }
  }
}

function maybeAwards(s: GameState) {
  if (s.week % 13 !== 0) return
  const seasonSongs = s.songs.filter((x) => x.released && x.releaseWeek !== null && s.week - x.releaseWeek <= 13)
  if (!seasonSongs.length) return
  const best = seasonSongs.reduce((a, b) => (b.quality > a.quality ? b : a))
  const rivalBest = s.rivals.reduce((a, b) => (b.hit > a.hit ? b : a))
  const myScore = best.quality + (best.peak === 1 ? 25 : best.peak > 0 && best.peak <= 10 ? 12 : 0) + fameOf(s) * 0.3
  const theirScore = rivalBest.hit + 14 + rivalBest.fame * 0.28
  const won = myScore > theirScore
  const category = pick(['Single of the Season', 'Best Song', 'Video of the Year', 'Artist of the Season', 'Fan Choice'])
  const award: Award = {
    id: uid('award'),
    week: s.week,
    category,
    won,
    songTitle: best.title,
    rivalName: won ? null : rivalBest.name,
    year: s.year,
  }
  s.awards.unshift(award)
  if (won) {
    log(s, `🏆 You win ${category} for "${best.title}". The room stands up.`, 'good')
    addHype(s, 10)
    s.followers *= 1.03 + Math.min(0.1, s.followers / 4e6)
  } else {
    log(s, `😐 ${category} goes to ${rivalBest.name}. You clap. Slowly.`, 'neutral')
    addHype(s, 2)
  }
}

function offerTemplate(s: GameState): LabelOffer {
  const f = fameOf(s)
  const eligible = LABELS.filter((l) => f >= l.minFame)
  const label = eligible.length ? eligible[eligible.length - 1] : LABELS[0]
  const prestige = label.prestige
  const advance = Math.round((2500 * Math.pow(4.1, prestige - 1) * (0.7 + f / 90)) / 100) * 100
  return {
    id: uid('offer'),
    name: label.name,
    advance,
    royalty: clamp(0.62 - prestige * 0.055, 0.24, 0.75),
    albums: Math.max(1, 4 - Math.floor(prestige / 2)),
    weeks: 52 + prestige * 26,
    prestige,
    push: label.push,
  }
}

export function maybeOffers(s: GameState) {
  if (s.label) return
  const f = fameOf(s)
  if (f < 4) return
  if (s.offers.length > 2) return
  if (Math.random() > 0.35) return
  if (s.offers.some((o) => o.name === offerTemplate(s).name)) return
  const t = offerTemplate(s)
  s.offers.push(t)
  log(s, `📬 ${t.name} sends an offer: ${money(t.advance)} advance, ${Math.round(t.royalty * 100)}% royalty.`, 'money')
}

// ---------------------------------------------------------------------------
// main tick
// ---------------------------------------------------------------------------

export function advance(prev: GameState, hours: number): GameState {
  if (hours <= 0 || prev.retired) return prev
  const s: GameState = structuredClone(prev)
  const steps = Math.min(Math.ceil(hours), 500)
  const per = hours / steps
  for (let i = 0; i < steps; i++) simulateHours(s, per)
  s.lastSaved = Date.now()
  return s
}

function simulateHours(s: GameState, dt: number) {
  const prevWeek = weekOf(s.hour)
  s.hour += dt
  const newWeek = weekOf(s.hour)
  if (newWeek !== prevWeek) {
    rollWeek(s)
    if (s.week % 4 === 0) maybeOffers(s)
  } else if (Math.floor(s.hour / 6) !== Math.floor((s.hour - dt) / 6)) {
    s.charts = computeCharts(s)
  }

  // energy + health
  s.energy = clamp(s.energy + 3.1 * dt, 0, s.maxEnergy)
  const lifestyle = s.assets.reduce((a, id) => a + (ASSETS.find((x) => x.id === id)?.fame ?? 0), 0)
  const healthDrift = (s.age > 30 ? -0.004 * (s.age - 30) : 0.006) + lifestyle * 0.0009
  s.health = clamp(s.health + healthDrift * dt, 0, 100)

  // songs
  let hourStreams = 0
  let moneyEarned = 0
  const cut = s.label && !s.label.mastersOwned ? s.label.royalty : 0.06
  const masterMult = s.label && s.label.mastersOwned ? 1.55 : 1
  for (const song of s.songs) {
    if (!song.released) continue
    const rate = streamsPerHour(s, song)
    song.streamsLastHour = rate
    const gained = rate * dt
    song.streams += gained
    song.streamsThisWeek += gained
    hourStreams += gained
    song.hype = clamp(song.hype - 0.02 * dt, 0, 100)
  }
  for (const album of s.albums) {
    if (!album.released) continue
    const rate = albumStreamsPerHour(s, album)
    album.streams += rate * dt
    album.streamsThisWeek += rate * dt
    hourStreams += rate * dt
  }

  moneyEarned = hourStreams * 0.0034 * (1 - cut) * masterMult
  s.money += moneyEarned
  s.promoSpend = Math.max(0, s.promoSpend - 1)

  // fans from streams
  // early novelty converts easily; once you are big you need real momentum to move the needle
  const novelty = 1 + 3.4 * Math.exp(-s.followers / 25000)
  // A stream is a listen. A fan is a decision — and people only decide when
  // somebody they trust puts you in front of them.
  // Nobody becomes a fan of a stranger. Reach is the measure of how many
  // people have actually been put in front of you by somebody else.
  const reachConv = reachConvOf(s)
  const conversion = TUNE.conv * novelty * reachConv * (1 + s.skills.charisma / 160) * (1 + s.hype / 320)
  let newFans = hourStreams * conversion
  // organic churn — the bigger you are, the more attention you have to keep earning
  const churn = s.followers * TUNE.churn * Math.pow(Math.max(1, s.followers) / 1e6, TUNE.churnExp) * dt
  s.followers = Math.max(20, s.followers + newFans - churn)

  // monthly listeners: smoothed toward a rolling estimate
  const est = Math.max(totalStreamsPerHour(s) * 720 / 22, s.followers * 0.55)
  s.listeners = s.listeners + (est - s.listeners) * Math.min(0.25, 0.05 * dt)

  s.hype = clamp(s.hype - 0.03 * dt, 0, 100)
  s.exposure = clamp(s.exposure + (s.hype > 45 ? 0.05 : -0.02) * dt, 0, 100)
  s.controversy = clamp(s.controversy - 0.02 * dt, 0, 100)

  // tour
  if (s.tour) {
    while (s.tour && s.hour >= s.tour.nextNightHour) {
      const t = s.tour
      s.money += t.payoutPerNight
      const fanGain = t.fansPerNight * (1 + s.skills.performance / 90) * rand(0.9, 1.15)
      s.followers += fanGain
      s.energy = clamp(s.energy - t.energyPerNight, 0, s.maxEnergy)
      addHype(s, 6)
      s.health = clamp(s.health - 0.8, 0, 100)
      t.nightsLeft -= 1
      t.nextNightHour += 24
      if (t.nightsLeft <= 0) s.tour = null
    }
  }

  // video production
  for (const v of s.videos) {
    v.hoursLeft -= dt
    if (v.hoursLeft <= 0) {
      const song = s.songs.find((x) => x.id === v.songId)
      if (song) {
        song.video = v.kind
        song.hype = clamp(song.hype + (v.kind === 'concept' ? 34 : 16), 0, 100)
        log(s, `🎬 "${song.title}" ${v.kind === 'concept' ? 'music video' : 'lyric video'} is live.`, 'music')
      }
    }
  }
  if (s.videos.some((v) => v.hoursLeft <= 0)) s.videos = s.videos.filter((v) => v.hoursLeft > 0)

  // the room closes and empties you out with it
  if (s.room) {
    const def = roomOfRoom(s.room)
    if (!roomOpen(def, s.hour)) {
      s.room = null
      s.dialogue = null
      s.beat = null
      log(s, `${def.emoji} ${def.name} is closing. The lights come up and everyone becomes an ordinary person.`, 'neutral')
    }
  }

  // rivals posting
  if (Math.random() < 0.02 * dt) rivalEvent(s)

  // viral / bad-news events
  if (Math.random() < 0.004 * dt) randomEvent(s)

  if (s.songs.length > 110) {
    const vault = s.songs.filter((x) => !x.released)
    const live = s.songs.filter((x) => x.released).sort((a, b) => b.streams - a.streams).slice(0, 90)
    s.songs = [...vault, ...live]
  }
}

function rivalEvent(s: GameState) {
  const rivals = [...s.rivals].sort((a, b) => b.beef - a.beef)
  const hot = rivals[0]
  if (!hot) return
  const roll = Math.random()
  if (hot.beef > 45 && roll < 0.5) {
    hot.hit = clamp(hot.hit + 4, 5, 99)
    log(s, `${hot.name} drops a snippet aimed at you. Comments are… engaged.`, 'bad')
    addHype(s, 2)
    s.controversy = clamp(s.controversy + 2, 0, 100)
  } else if (roll < 0.4) {
    log(s, `${hot.name} announces a surprise project. The timeline is theirs today.`, 'neutral')
    hot.heat = clamp(hot.heat + 0.05, 0.5, 1.6)
  } else if (roll < 0.7) {
    const friend = rivals[rivals.length - 1]
    friend.beef = clamp(friend.beef - 1, -100, 100)
  } else {
    log(s, `Industry chatter: ${pick(s.rivals).name} and their label are renegotiating.`, 'neutral')
  }
}

function randomEvent(s: GameState) {
  const fame = fameOf(s)
  const roll = Math.random()
  if (roll < 0.3 && fame > 12) {
    const gain = Math.round(s.followers * rand(0.01, 0.04))
    s.followers += gain
    log(s, `📈 A clip from your last session goes viral. +${ui(gain)} followers.`, 'good')
    addHype(s, 8)
  } else if (roll < 0.5 && fame > 20) {
    log(s, `📰 A tabloid runs a story on your personal life. Nothing true, all traffic.`, 'neutral')
    s.controversy = clamp(s.controversy + 9, 0, 100)
    s.exposure = clamp(s.exposure + 6, 0, 100)
    addHype(s, 4)
  } else if (roll < 0.68) {
    const b = Math.round(rand(120, 400) + fame * 40)
    s.money += b
    log(s, `🎟️ A licensing sync clears: +${money(b)}.`, 'money')
  } else if (roll < 0.8 && s.exposure > 78) {
    log(s, `🔥 You are overexposed. The internet turns on you for a week.`, 'bad')
    s.followers *= 0.97
    s.exposure = clamp(s.exposure - 18, 0, 100)
    addHype(s, -6)
  } else if (roll < 0.9) {
    s.energy = clamp(s.energy + 12, 0, s.maxEnergy)
    log(s, `😴 A rare full night of sleep. Energy restored.`, 'good')
  } else {
    log(s, `☕ A producer sends you an unfinished beat with no message.`, 'neutral')
    s.skills.production = clamp(s.skills.production + 0.3, 0, 100)
  }
}

// ---------------------------------------------------------------------------
// helpers used by the UI layer
// ---------------------------------------------------------------------------

export function nextWeekHour(s: GameState): number {
  return weekOf(s.hour) * WEEK_HOURS
}

export function skillUpCost(skill: number): number {
  return Math.round(55 + Math.pow(skill, 1.55) * 3.4)
}

export function activityPay(s: GameState, actId: string): number {
  const def = ACTIVITIES.find((a) => a.id === actId)
  if (!def?.money) return 0
  return Math.round(def.money + Math.sqrt(s.followers) * 26 + fameOf(s) * 24)
}

export function activityCooldownLeft(s: GameState, a: { id: string; cooldown?: number }): number {
  if (!a.cooldown) return 0
  return Math.max(0, (s.cooldowns?.[a.id] ?? -9999) + a.cooldown - s.hour)
}

export function activityFollowersGain(s: GameState, actId: string): number {
  const base = ACTIVITIES.find((a) => a.id === actId)?.followers ?? 0
  if (actId === 'post-clip') return Math.round(6 + sat(s.followers) * 0.05 * (1 + s.skills.charisma / 100))
  if (actId === 'go-live') return Math.round(20 + sat(s.followers) * 0.09 * (1 + s.skills.charisma / 100))
  if (actId === 'local-show') return Math.round(8 + Math.min(fameOf(s), 45) * 1.1)
  return base
}

export function tourPreview(s: GameState, tier: number): Tour | null {
  const def = TOURS[tier]
  if (!def) return null
  const fame = fameOf(s)
  const mult = 0.7 + fame / 100
  return {
    name: def.name,
    city: pick(['Los Angeles', 'London', 'Atlanta', 'Seoul', 'Berlin', 'São Paulo', 'Tokyo', 'Toronto', 'Paris', 'Lagos', 'Mexico City', 'Sydney']),
    nightsLeft: def.cities,
    totalNights: def.cities,
    payoutPerNight: Math.round((def.payout * mult) / def.cities),
    fansPerNight: Math.round((def.fans * mult) / def.cities),
    energyPerNight: 2.2,
    nextNightHour: s.hour + 18,
  }
}

export function bestPeakOf(s: GameState): number {
  return s.songs.reduce((acc, x) => (x.peak ? Math.min(acc, x.peak) : acc), 999)
}

export function assetFame(s: GameState): number {
  return s.assets.reduce((a, id) => a + (ASSETS.find((x) => x.id === id)?.fame ?? 0), 0)
}

export function portraitColors(p: { hairColor: number; outfit: number; skin: number }) {
  return {
    skin: SKIN_TONES[p.skin % SKIN_TONES.length],
    hair: HAIR_COLORS[p.hairColor % HAIR_COLORS.length],
  }
}

export function totalEarned(s: GameState): number {
  return s.songs.reduce((a, b) => a + b.streams * 0.0034, 0) + s.money
}

export function dealValue(s: GameState): SignedDeal | null {
  return s.label
}
