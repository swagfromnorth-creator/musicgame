import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type {
  Action,
  Album,
  GameState,
  SkillKey,
  Song,
} from './types'
import {
  ACTIVITIES,
  ASSETS,
  PRODUCERS,
  RADIO_TIERS,
  SKILL_INFO,
  TOURS,
  pick,
  randomName,
} from './data'
import {
  WEEK_HOURS,
  activityFollowersGain,
  advance,
  clamp,
  computeCharts,
  fameOf,
  gradeFor,
  makeLog,
  maybeOffers,
  skillUpCost,
  tourPreview,
  uid,
  weekOf,
  writeQuality,
  initialState,
  rand,
} from './engine'

const SAVE_KEY = 'starmaker.save.v1'
const OFFLINE_CAP_HOURS = 2000
const OFFLINE_RATE = 1.0

// ---------------------------------------------------------------------------
// persistence
// ---------------------------------------------------------------------------

const FALLBACK_SINGLES = ['Afterglow', 'No Signal', 'Golden Hour', 'Bad Weather', 'Static Love', 'Rooftop', 'Slow Burn', 'Wildfire']

export function migrate(s: GameState): GameState {
  s.videos = s.videos ?? []
  s.assets = s.assets ?? []
  s.offers = s.offers ?? []
  s.awards = s.awards ?? []
  s.hallOfFame = s.hallOfFame ?? []
  s.milestones = s.milestones ?? []
  s.rivals = (s.rivals ?? []).map((r, i) => ({
    ...r,
    single: r.single ?? FALLBACK_SINGLES[i % FALLBACK_SINGLES.length],
    tag: r.tag ?? 'the new face',
  }))
  s.songs = (s.songs ?? []).map((x) => ({ ...x, playlistTier: x.playlistTier ?? 0, video: x.video ?? 'none' }))
  return s
}

export function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GameState
    if (!parsed || typeof parsed.hour !== 'number') return null
    return migrate(parsed)
  } catch {
    return null
  }
}

export function writeSave(s: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ ...s, lastSaved: Date.now() }))
  } catch {
    /* storage full / disabled */
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* noop */
  }
}

/** validate + repair a save that came from a file or another device */
export function readSaveFile(text: string): GameState | null {
  try {
    const parsed = JSON.parse(text) as GameState
    if (!parsed || typeof parsed.hour !== 'number' || typeof parsed.artistName !== 'string') return null
    return migrate(parsed)
  } catch {
    return null
  }
}

export function offlineHours(s: GameState): number {
  const elapsedMs = Date.now() - (s.lastSaved || Date.now())
  return Math.min((elapsedMs / 1000) * OFFLINE_RATE, OFFLINE_CAP_HOURS)
}

// ---------------------------------------------------------------------------
// reducer
// ---------------------------------------------------------------------------

function neg(s: GameState, n: number) {
  s.energy = clamp(s.energy - n, 0, s.maxEnergy)
}

function addLog(s: GameState, text: string, kind: 'good' | 'bad' | 'neutral' | 'money' | 'music' = 'neutral') {
  s.log.unshift(makeLog(text, kind, s.hour))
  if (s.log.length > 70) s.log.length = 70
}

function trainSkill(s: GameState, skill: SkillKey): string | null {
  const cost = skillUpCost(s.skills[skill])
  if (s.money < cost) return 'Not enough cash'
  if (s.energy < 10) return 'Not enough energy'
  s.money -= cost
  neg(s, 10)
  const decay = clamp(1.55 - s.skills[skill] / 72, 0.22, 1.55)
  const gain = decay * rand(0.75, 1.3) * (1 + s.health / 300)
  s.skills[skill] = clamp(s.skills[skill] + gain, 0, 100)
  return null
}

function releaseSong(s: GameState, song: Song, viaAlbum: string | null) {
  song.released = true
  song.releaseHour = s.hour
  song.releaseWeek = s.week
  song.albumId = viaAlbum
  const burst = (song.quality / 100) ** 2 * s.followers * 0.45 + song.quality * 12
  song.streams += burst
  song.streamsThisWeek += burst
  song.hype = clamp(song.hype + 8 + song.quality * 0.22 + (song.isDiss ? 26 : 0) + (song.featureId ? 10 : 0), 0, 100)
  s.hype = clamp(s.hype + 4 + song.quality * 0.14, 0, 100)
  s.charts = computeCharts(s)
}

function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.type) {
    case 'HYDRATE':
      return action.state
    case 'START':
      return initialState(action.payload)
    case 'NEW_ARTIST': {
      if (!state) return initialState(action.payload)
      const fresh = initialState(action.payload)
      fresh.legacyLevel = state.legacyLevel
      fresh.hallOfFame = state.hallOfFame
      fresh.money += state.legacyLevel * 6000
      fresh.followers += state.legacyLevel * 900
      fresh.listeners += state.legacyLevel * 1200
      const bonus = Math.min(14, state.legacyLevel * 3)
      for (const k of Object.keys(fresh.skills) as SkillKey[]) {
        fresh.skills[k] = clamp(fresh.skills[k] + bonus, 0, 100)
      }
      fresh.log = [
        {
          ...makeLog(
            `You are ${action.payload.artistName}, and the family name still sells. Legacy ×${state.legacyLevel}.`,
            'good',
            fresh.hour,
          ),
        },
      ]
      return fresh
    }
    case 'RESET':
      clearSave()
      return null
    case 'TICK':
      if (!state || !state.playing || state.retired) return state
      return advance(state, action.hours * state.speed)
    default:
      break
  }
  if (!state) return state
  const s: GameState = structuredClone(state)

  switch (action.type) {
    case 'TOGGLE_PLAY':
      s.playing = !s.playing
      break
    case 'SET_SPEED':
      s.speed = action.speed
      break

    case 'TRAIN': {
      const err = trainSkill(s, action.skill)
      if (err) return state
      break
    }

    case 'ACTIVITY': {
      const def = ACTIVITIES.find((a) => a.id === action.id)
      if (!def) return state
      if (def.cost > 0 && s.money < def.cost) return state
      if (def.energy < 0 && s.energy < -def.energy) return state
      s.money = Math.max(0, s.money - def.cost)
      s.energy = clamp(s.energy + def.energy, 0, s.maxEnergy)
      if (def.skill && def.xp) {
        const gain = (def.xp / 100) * clamp(2.1 - s.skills[def.skill] / 62, 0.15, 2.1) * rand(0.8, 1.25)
        s.skills[def.skill] = clamp(s.skills[def.skill] + gain, 0, 100)
      }
      if (def.money) {
        const pay = Math.round(def.money * (1 + fameOf(s) / 18))
        s.money += pay
        addLog(s, `🎪 Played a show, took home ${pay.toLocaleString('en-US')} dollars.`, 'money')
      }
      const fg = activityFollowersGain(s, def.id)
      if (fg) s.followers += fg
      if (def.hype) s.hype = clamp(s.hype + def.hype, 0, 100)
      if (def.health) s.health = clamp(s.health + def.health, 0, 100)
      if (def.id === 'club-appearance') s.exposure = clamp(s.exposure + 3, 0, 100)
      if (def.id === 'go-live' && Math.random() < 0.35) {
        s.hype = clamp(s.hype + 5, 0, 100)
        addLog(s, 'Your live stream peaked at thousands of viewers. The clip is everywhere.', 'good')
      }
      break
    }

    case 'WRITE_SONG': {
      const p = action.payload
      const prod = PRODUCERS.find((x) => x.id === p.producerId) ?? PRODUCERS[0]
      const cost = prod.cost + 30
      if (s.money < cost || s.energy < 18) return state
      s.money -= cost
      neg(s, 18)
      const quality = writeQuality(s, { genre: p.genre, style: p.style, producerId: p.producerId, title: p.title })
      s.pending = {
        title: p.title,
        genre: p.genre,
        mood: p.mood,
        style: p.style,
        quality,
        producer: prod.name,
        cost,
        featureId: p.featureId,
        isDiss: false,
        targetRivalId: null,
      }
      s.skills.songwriting = clamp(s.skills.songwriting + 0.16, 0, 100)
      s.hype = clamp(s.hype + 1, 0, 100)
      break
    }

    case 'DISCARD_PENDING':
      s.pending = null
      break

    case 'HOLD_PENDING': {
      if (!s.pending) return state
      const p = s.pending
      s.songs.unshift({
        id: uid('song'),
        title: p.title,
        genre: p.genre,
        mood: p.mood,
        style: p.style,
        quality: p.quality,
        released: false,
        releaseHour: null,
        releaseWeek: null,
        albumId: null,
        isDiss: p.isDiss,
        targetRivalId: p.targetRivalId,
        streams: 0,
        streamsThisWeek: 0,
        streamsLastHour: 0,
        hype: 0,
        peak: 0,
        video: 'none',
        playlistTier: 0,
        dead: false,
        hue: (s.hue + rand(-60, 60) + 360) % 360,
        producer: p.producer,
        writeCost: p.cost,
        featureId: p.featureId,
      })
      s.pending = null
      addLog(s, `📼 "${p.title}" goes in the vault. Save it for the album.`, 'music')
      break
    }

    case 'RELEASE_PENDING': {
      if (!s.pending) return state
      const p = s.pending
      const song: Song = {
        id: uid('song'),
        title: p.title,
        genre: p.genre,
        mood: p.mood,
        style: p.style,
        quality: p.quality,
        released: true,
        releaseHour: s.hour,
        releaseWeek: s.week,
        albumId: action.albumId ?? null,
        isDiss: p.isDiss,
        targetRivalId: p.targetRivalId,
        streams: 0,
        streamsThisWeek: 0,
        streamsLastHour: 0,
        hype: 0,
        peak: 0,
        video: 'none',
        playlistTier: 0,
        dead: false,
        hue: (s.hue + rand(-60, 60) + 360) % 360,
        producer: p.producer,
        writeCost: p.cost,
        featureId: p.featureId,
      }
      releaseSong(s, song, action.albumId ?? null)
      s.songs.unshift(song)
      s.pending = null
      addLog(s, `🎧 "${song.title}" is out. ${gradeFor(song.quality).label}-grade. Go watch the numbers.`, 'music')
      break
    }

    case 'RELEASE_VAULT': {
      const song = s.songs.find((x) => x.id === action.songId)
      if (!song || song.released) return state
      releaseSong(s, song, action.albumId ?? null)
      addLog(s, `🎧 You release "${song.title}".`, 'music')
      break
    }

    case 'SHOOT_VIDEO': {
      const song = s.songs.find((x) => x.id === action.songId)
      if (!song || song.video !== 'none') return state
      const cost = action.kind === 'concept' ? 4200 + s.followers * 0.02 : 650 + s.followers * 0.004
      if (s.money < cost) return state
      s.money -= cost
      s.videos.push({
        songId: song.id,
        kind: action.kind,
        hoursLeft: action.kind === 'concept' ? 72 : 24,
        totalHours: action.kind === 'concept' ? 72 : 24,
        cost,
      })
      song.hype = clamp(song.hype + 10, 0, 100)
      break
    }

    case 'BUY_PLAYLIST': {
      const song = s.songs.find((x) => x.id === action.songId)
      if (!song) return state
      const tierDef = [
        { cost: 900, mult: 1.2 },
        { cost: 7000, mult: 1.5 },
        { cost: 60000, mult: 2.0 },
        { cost: 500000, mult: 2.8 },
      ][action.tier]
      if (!tierDef || s.money < tierDef.cost) return state
      if (song.playlistTier >= action.tier + 1) return state
      s.money -= tierDef.cost
      song.playlistTier = action.tier + 1
      song.hype = clamp(song.hype + 12, 0, 100)
      addLog(s, `📻 "${song.title}" is added to a major playlist.`, 'good')
      break
    }

    case 'MAKE_ALBUM': {
      if (action.songIds.length < 3) return state
      const tracks = s.songs.filter((x) => action.songIds.includes(x.id))
      if (tracks.length < 3) return state
      const avg = tracks.reduce((a, b) => a + b.quality, 0) / tracks.length
      const album: Album = {
        id: uid('album'),
        title: action.title,
        songIds: tracks.map((t) => t.id),
        released: false,
        releaseWeek: null,
        quality: Math.round(avg),
        streams: 0,
        streamsThisWeek: 0,
        peak: 0,
        hue: (s.hue + rand(-40, 40) + 360) % 360,
      }
      s.albums.unshift(album)
      break
    }

    case 'RELEASE_ALBUM': {
      const album = s.albums.find((a) => a.id === action.albumId)
      if (!album || album.released) return state
      album.released = true
      album.releaseWeek = s.week
      const tracks = s.songs.filter((x) => album.songIds.includes(x.id))
      for (const t of tracks) {
        if (!t.released) releaseSong(s, t, album.id)
        else {
          t.albumId = album.id
          t.releaseWeek = s.week
        }
      }
      const burst = (album.quality / 100) ** 2 * s.followers * 1.2 + album.quality * 40
      album.streams += burst
      album.streamsThisWeek += burst
      s.hype = clamp(s.hype + 14, 0, 100)
      s.followers += s.followers * 0.02
      s.charts = computeCharts(s)
      addLog(s, `💿 "${album.title}" is out — ${album.songIds.length} tracks.`, 'music')
      if (s.label) {
        s.label.albumsDelivered += 1
        s.label.albumsRemaining -= 1
        if (s.label.albumsRemaining <= 0) {
          addLog(s, `✅ You fulfilled your album commitment to ${s.label.name}. Renegotiate or walk.`, 'good')
          s.label.push += 0.25
        }
      }
      break
    }

    case 'SIGN_OFFER': {
      const offer = s.offers.find((o) => o.id === action.offerId)
      if (!offer) return state
      s.money += offer.advance
      s.label = {
        labelId: offer.id,
        name: offer.name,
        advance: offer.advance,
        royalty: offer.royalty,
        albumsRemaining: offer.albums,
        albumsDelivered: 0,
        weeksLeft: offer.weeks,
        push: offer.push,
        prestige: offer.prestige,
        signedWeek: s.week,
        mastersOwned: false,
      }
      s.offers = s.offers.filter((o) => o.id !== offer.id)
      s.hype = clamp(s.hype + 12, 0, 100)
      s.followers *= 1.05
      addLog(s, `🖊️ Signed to ${offer.name}. ${Math.round(offer.royalty * 100)}% of streams for ${offer.albums} album(s).`, 'money')
      break
    }

    case 'DECLINE_OFFER':
      s.offers = s.offers.filter((o) => o.id !== action.offerId)
      break

    case 'BUY_MASTERS': {
      if (!s.label || s.label.mastersOwned) return state
      const cost = Math.round(s.label.advance * 2.2 + fameOf(s) * 24000)
      if (s.money < cost) return state
      s.money -= cost
      s.label.mastersOwned = true
      s.label.royalty = 0.05
      addLog(s, `📀 You bought your masters back for ${Math.round(cost).toLocaleString('en-US')} dollars. Yours forever.`, 'money')
      break
    }

    case 'BUY_ASSET': {
      const asset = ASSETS.find((a) => a.id === action.assetId)
      if (!asset || s.assets.includes(asset.id) || s.money < asset.cost) return state
      s.money -= asset.cost
      s.assets.push(asset.id)
      s.followers *= 1 + asset.fame / 220
      s.hype = clamp(s.hype + 3, 0, 100)
      addLog(s, `${asset.emoji} ${asset.name}. Bought outright.`, 'money')
      break
    }

    case 'UPGRADE_STUDIO': {
      const costs = [1800, 8500, 38000, 175000, 900000]
      if (s.studioLevel >= 5) return state
      const cost = costs[s.studioLevel]
      if (s.money < cost) return state
      s.money -= cost
      s.studioLevel += 1
      s.skills.production = clamp(s.skills.production + 1.5, 0, 100)
      addLog(s, `🎛️ Studio upgraded to tier ${s.studioLevel}.`, 'good')
      break
    }

    case 'RADIO_PROMO': {
      if (s.radioTier >= RADIO_TIERS.length - 1) return state
      const next = RADIO_TIERS[s.radioTier + 1]
      if (s.money < next.cost) return state
      s.money -= next.cost
      s.radioTier += 1
      addLog(s, `📡 You buy into ${next.name}. Streaming multiplier up.`, 'money')
      break
    }

    case 'SOCIAL': {
      const r = s.rivals.find((x) => x.id === action.rivalId)
      if (!r) return state
      if (action.kind === 'compliment') {
        if (s.energy < 2) return state
        neg(s, 2)
        r.beef = clamp(r.beef - 14, -100, 100)
        s.followers += 8 + r.followers * 0.0004
        if (Math.random() < 0.4) addLog(s, `${r.name} liked your post. The fans noticed.`, 'good')
      } else if (action.kind === 'subtweet') {
        if (s.energy < 4) return state
        neg(s, 4)
        r.beef = clamp(r.beef + 9, -100, 100)
        s.hype = clamp(s.hype + 3, 0, 100)
        s.controversy = clamp(s.controversy + 4, 0, 100)
        s.exposure = clamp(s.exposure + 2, 0, 100)
      } else if (action.kind === 'collab') {
        if (s.energy < 14) return state
        if (r.beef > 45) return state
        neg(s, 14)
        r.beef = clamp(r.beef - 10, -100, 100)
        const gain = 40 + r.followers * 0.006 * (1 + s.skills.charisma / 80)
        s.followers += gain
        s.hype = clamp(s.hype + 10, 0, 100)
        s.skills.charisma = clamp(s.skills.charisma + 0.4, 0, 100)
        addLog(s, `🤝 You and ${r.name} cut a record together. +${Math.round(gain).toLocaleString('en-US')} followers.`, 'good')
      } else if (action.kind === 'diss') {
        if (s.energy < 22) return state
        neg(s, 22)
        const quality = Math.round(
          clamp(
            s.skills.songwriting * 0.34 + s.skills.charisma * 0.3 + s.skills.vocals * 0.16 +
              r.fame * 0.22 + rand(-8, 10),
            5,
            100,
          ),
        )
        const song: Song = {
          id: uid('song'),
          title: `${pick(['Hit Back', 'Reply All', 'Sincerely Yours', 'No Comment', 'Facts Only', 'Kind Regards'])} (${pick(['Freestyle', 'Diss', 'Response', 'Warning'])} ${Math.floor(rand(1, 4))})`,
          genre: s.genre,
          mood: 'rebel',
          style: 'hooky',
          quality,
          released: true,
          releaseHour: s.hour,
          releaseWeek: s.week,
          albumId: null,
          isDiss: true,
          targetRivalId: r.id,
          streams: 0,
          streamsThisWeek: 0,
          streamsLastHour: 0,
          hype: 0,
          peak: 0,
          video: 'none',
          playlistTier: 0,
          dead: false,
          hue: (r.hue + 180) % 360,
          producer: 'Self-Produced',
          writeCost: 0,
          featureId: null,
        }
        releaseSong(s, song, null)
        s.songs.unshift(song)
        r.beef = clamp(r.beef + 45, -100, 100)
        s.controversy = clamp(s.controversy + 12, 0, 100)
        s.hype = clamp(s.hype + 18, 0, 100)
        s.exposure = clamp(s.exposure + 10, 0, 100)
        addLog(s, `🔥 You drop "${song.title}" aimed at ${r.name}. The internet loses its mind.`, 'bad')
        if (Math.random() < 0.55 + s.skills.charisma / 400) {
          r.hit = clamp(r.hit + 10, 5, 99)
          r.heat = clamp(r.heat + 0.2, 0.5, 1.6)
          addLog(s, `${r.name} responds within the hour. This is a whole thing now.`, 'bad')
          s.hype = clamp(s.hype + 8, 0, 100)
        }
      }
      break
    }

    case 'BOOK_TOUR': {
      const def = TOURS[action.tier]
      if (!def) return state
      if (fameOf(s) < def.fameNeeded) return state
      if (s.money < def.upfront) return state
      if (s.tour) return state
      s.money -= def.upfront
      const tour = tourPreview(s, action.tier)
      if (!tour) return state
      s.tour = tour
      s.hype = clamp(s.hype + 8, 0, 100)
      addLog(s, `🚐 ${def.name} booked. First night in ${tour.city}.`, 'music')
      break
    }

    case 'REST': {
      const next = advance(s, 8)
      next.energy = next.maxEnergy
      next.health = clamp(next.health + 3, 0, 100)
      next.hour += 8
      const w = weekOf(next.hour)
      if (w !== next.week) next.charts = computeCharts(next)
      return next
    }

    case 'RETIRE': {
      const best = s.songs.reduce((a, b) => (b.streams > a.streams ? b : a), s.songs[0])
      s.hallOfFame.unshift({
        name: s.artistName,
        genre: s.genre,
        years: Math.max(1, Math.round(s.hour / (WEEK_HOURS * 52))),
        peakFame: fameOf(s),
        bestSong: best ? best.title : '—',
        earnings: s.money,
        awards: s.awards.filter((a) => a.won).length,
        hue: s.hue,
      })
      s.retired = true
      s.playing = false
      s.legacyLevel = s.legacyLevel + 1
      break
    }

    default:
      break
  }
  return s
}

// ---------------------------------------------------------------------------
// context
// ---------------------------------------------------------------------------

interface Ctx {
  state: GameState | null
  dispatch: React.Dispatch<Action>
  started: boolean
  welcome: { hours: number; fans: number; money: number } | null
  dismissWelcome: () => void
}

const GameCtx = createContext<Ctx | null>(null)

const HOURS_PER_SECOND = 1.0

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null as GameState | null)
  const [welcome, setWelcome] = useState<{ hours: number; fans: number; money: number } | null>(null)
  const booted = useRef(false)
  const stateRef = useRef<GameState | null>(null)
  stateRef.current = state

  // boot
  useEffect(() => {
    if (booted.current) return
    booted.current = true
    const saved = loadSave()
    if (!saved) return
    saved.charts = computeCharts(saved)
    const goneMs = Date.now() - (saved.lastSaved || Date.now())
    const off = offlineHours(saved)
    if (off > 1.5) {
      const before = { fans: saved.followers, money: saved.money }
      const next = advance(saved, off)
      dispatch({ type: 'HYDRATE', state: next })
      if (goneMs > 90_000) {
        setWelcome({
          hours: off,
          fans: next.followers - before.fans,
          money: next.money - before.money,
        })
      }
    } else {
      dispatch({ type: 'HYDRATE', state: saved })
    }
  }, [])

  // clock — uses real elapsed time so throttled/background tabs still keep pace
  useEffect(() => {
    if (!state || state.retired) return
    const tickMs = 400
    let last = Date.now()
    const id = window.setInterval(() => {
      const now = Date.now()
      const dtSec = Math.min((now - last) / 1000, 100)
      last = now
      if (dtSec <= 0) return
      const idleFactor = document.hidden ? 0.5 : 1
      dispatch({ type: 'TICK', hours: dtSec * HOURS_PER_SECOND * idleFactor })
    }, tickMs)
    return () => window.clearInterval(id)
  }, [!!state, state?.retired])

  // autosave — single interval, reads the live state through a ref
  useEffect(() => {
    const id = window.setInterval(() => {
      if (stateRef.current) writeSave(stateRef.current)
    }, 4000)
    const onHide = () => {
      if (stateRef.current) writeSave(stateRef.current)
    }
    window.addEventListener('beforeunload', onHide)
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('beforeunload', onHide)
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
      if (stateRef.current) writeSave(stateRef.current)
    }
  }, [])

  const dismissWelcome = useCallback(() => setWelcome(null), [])

  const value = useMemo<Ctx>(
    () => ({ state, dispatch, started: !!state, welcome, dismissWelcome }),
    [state, welcome, dismissWelcome],
  )

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>
}

export function useGame(): Ctx {
  const ctx = useContext(GameCtx)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

export function useGameState(): GameState {
  const { state } = useGame()
  if (!state) throw new Error('no state')
  return state
}
