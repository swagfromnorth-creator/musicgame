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
  SKILL_INFO,
  TOURS,
  money,
  pick,
  randomName,
  ui,
} from './data'
import {
  REPLIES,
  ROOMS,
  createPeople,
  canAskFavor,
  isRoomOpen,
  npcLine,
  peopleInRoom,
  replyModifiers,
  replyOdds,
  roleOf,
  roomOf,
} from '../game/people'
import type { Person, TopicId } from './types'
import {
  WEEK_HOURS,
  activityFollowersGain,
  activityPay,
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
  yearOf,
  reachConvOf,
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
  s.people = s.people && s.people.length ? s.people : createPeople(s.hour ?? 0)
  s.room = s.room ?? null
  s.dialogue = null
  s.beat = null
  s.boons = s.boons ?? { nextSongQuality: 0, nextSongDiscount: 0, videoDiscount: 0, studioVisitId: null }
  s.manager = s.manager ?? null
  s.press = s.press ?? { level: 0, lastPieceWeek: 0 }
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

/** Audience-scaled effects saturate: 10k real fans are worth more than 10k
 *  numbers, but a million followers must not multiply every action by a million. */
function sat(followers: number): number {
  return (followers * 22000) / (followers + 22000)
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
  const burst = (song.quality / 100) ** 2 * sat(s.followers) * 0.2 * Math.min(1.6, Math.max(0.3, reachConvOf(s) * 0.3)) + song.quality * 1.2
  song.streams += burst
  song.streamsThisWeek += burst
  song.hype = clamp(song.hype + 8 + song.quality * 0.22 + (song.isDiss ? 26 : 0) + (song.featureId ? 10 : 0), 0, 100)
  s.hype = clamp(s.hype + 4 + song.quality * 0.14, 0, 100)
  s.charts = computeCharts(s)
}

export function reducer(state: GameState | null, action: Action): GameState | null {
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
      const cd = def.cooldown ?? 0
      if (cd > 0 && s.hour < (s.cooldowns?.[def.id] ?? -999) + cd) return state
      s.money = Math.max(0, s.money - def.cost)
      s.energy = clamp(s.energy + def.energy, 0, s.maxEnergy)
      if (cd > 0) s.cooldowns[def.id] = s.hour
      if (def.skill && def.xp) {
        const gain = (def.xp / 100) * clamp(2.1 - s.skills[def.skill] / 62, 0.15, 2.1) * rand(0.8, 1.25)
        s.skills[def.skill] = clamp(s.skills[def.skill] + gain, 0, 100)
      }
      if (def.money) {
        const pay = activityPay(s, def.id)
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
      const feature = p.featureId ? s.people.find((x) => x.id === p.featureId) : null
      if (p.featureId && (!feature || !feature.met || feature.affinity < 20)) return state
      const featureCost = feature ? 300 + feature.tier * 1100 : 0
      const cost = Math.round((prod.cost + 30) * (1 - s.boons.nextSongDiscount)) + featureCost
      if (s.money < cost || s.energy < 18) return state
      s.money -= cost
      neg(s, 18)
      let quality = writeQuality(s, { genre: p.genre, style: p.style, producerId: p.producerId, title: p.title })
      quality = clamp(quality + s.boons.nextSongQuality + (feature ? feature.tier * 2.5 : 0), 3, 100)
      quality = Math.round(quality)
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
      if (s.boons.nextSongQuality > 0 || s.boons.nextSongDiscount > 0) {
        addLog(
          s,
          `✨ The room was better than you paid for (${s.boons.nextSongQuality > 0 ? `+${Math.round(s.boons.nextSongQuality)} quality` : 'discount applied'}).`,
          'good',
        )
      }
      if (feature) {
        s.followers += 120 + sat(s.followers) * 0.006 * feature.tier
        feature.affinity = clamp(feature.affinity - 3, -100, 100)
        feature.lastSeenHour = s.hour
      }
      s.boons.nextSongQuality = 0
      s.boons.nextSongDiscount = 0
      s.skills.songwriting = clamp(s.skills.songwriting + 0.16, 0, 100)
      s.hype = clamp(s.hype + 1, 0, 100)
      // Writing and cutting a record is a night in the studio, not a click.
      Object.assign(s, advance(s, 14))
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
      const burst = (album.quality / 100) ** 2 * sat(s.followers) * 0.42 + album.quality * 40
      album.streams += burst
      album.streamsThisWeek += burst
      s.hype = clamp(s.hype + 14, 0, 100)
      s.followers += sat(s.followers) * 0.02
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
        const gain = 40 + sat(r.followers) * 0.02 * (1 + s.skills.charisma / 80)
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


    // ---------------- the scene ----------------
    case 'ENTER_ROOM': {
      const def = roomOf(action.room)
      if (!isRoomOpen(def, s.hour)) return state
      if (fameOf(s) < def.gateFame) return state
      if (s.money < def.cover) return state
      if (s.energy < def.energy) return state
      s.money -= def.cover
      neg(s, def.energy)
      s.room = def.id
      s.roomEnteredHour = s.hour
      s.dialogue = null
      s.beat = null
      const who = peopleInRoom(s.people, def.id, s.hour, s.week)
      addLog(
        s,
        `${def.emoji} You walk into ${def.name}. ${who.length ? who.map((p) => p.name.split(' ')[0]).join(', ') + ' are here.' : 'It is dead in here.'}`,
        'neutral',
      )
      break
    }

    case 'LEAVE_ROOM':
      s.room = null
      s.dialogue = null
      s.beat = null
      break

    case 'TALK': {
      if (!s.room) return state
      const p = s.people.find((x) => x.id === action.personId)
      if (!p) return state
      if (!peopleInRoom(s.people, s.room, s.hour, s.week).some((x) => x.id === p.id)) return state
      if (p.affinity < -45) return state
      s.dialogue = { personId: p.id, topic: action.topic, line: npcLine(p, action.topic), hour: s.hour }
      s.beat = null
      if (!p.met) {
        p.met = true
        addLog(s, `🤝 You introduce yourself to ${p.name}, ${roleOf(p.role).name.toLowerCase()} at ${roomOf(p.room).name}.`, 'neutral')
      }
      p.lastSeenHour = s.hour
      break
    }

    case 'REPLY': {
      if (!s.dialogue) return state
      const p = s.people.find((x) => x.id === s.dialogue!.personId)
      if (!p) return state
      const topic = s.dialogue.topic
      const reply = REPLIES[topic].find((r) => r.id === action.replyId)
      if (!reply) return state
      if (s.energy < reply.energy) return state
      neg(s, reply.energy)

      const { affMul, respMul, trustMul } = replyModifiers(p, topic, reply)
      const skill = (s.skills.charisma + s.skills.performance) / 2
      const success = Math.random() < replyOdds(p, topic, reply, skill)
      const k = success ? 1 : 0.22
      const aff = success ? reply.aff * affMul : -1.6 + reply.aff * 0.12
      const resp = success ? reply.resp * respMul : -0.8 + reply.resp * 0.12
      const trust = success ? reply.trust * trustMul : reply.trust * 0.2

      p.affinity = clamp(p.affinity + aff, -100, 100)
      p.respect = clamp(p.respect + resp, 0, 100)
      p.trust = clamp(p.trust + trust, 0, 100)
      p.patience = clamp(p.patience - 0.5, 0, 100)
      p.lastSeenHour = s.hour
      s.energy = clamp(s.energy + (success ? 0 : -1), 0, s.maxEnergy)

      if (topic === 'scene' && success && p.traits.includes('gossip')) {
        s.skills.charisma = clamp(s.skills.charisma + 0.15, 0, 100)
      }
      if (topic === 'flirt' && success && p.traits.includes('flirt') && p.affinity > 60 && p.trust > 40) {
        if (!s.milestones.includes('romance:' + p.id)) {
          s.milestones.push('romance:' + p.id)
          addLog(s, `❤️ Something is going on with ${p.name}. It is going to complicate everything.`, 'good')
        }
      }
      if (p.affinity < -30 && Math.random() < 0.3) {
        addLog(s, `${p.name} has started telling people about you. Not kindly.`, 'bad')
        s.controversy = clamp(s.controversy + 4, 0, 100)
      }

      s.beat = {
        personId: p.id,
        topic,
        replyId: reply.id,
        success,
        text: success ? reply.win : reply.lose,
        aff: Math.round(aff),
        resp: Math.round(resp),
        trust: Math.round(trust),
        hour: s.hour,
      }
      s.dialogue = null
      break
    }

    case 'CLOSE_BEAT':
      s.beat = null
      break

    case 'BUY_ROUND': {
      const p = s.people.find((x) => x.id === action.personId)
      if (!p || !s.room) return state
      const price = Math.round(30 + (ROOMS.find((r) => r.id === s.room)?.cover ?? 0) * 0.4 + p.tier * 12)
      if (s.money < price || s.energy < 2) return state
      s.money -= price
      neg(s, 2)
      const gain = 5 + p.tier * 0.6 + (p.traits.includes('greedy') ? 2 : 0)
      p.affinity = clamp(p.affinity + gain, -100, 100)
      p.patience = clamp(p.patience + 9, 0, 100)
      p.lastSeenHour = s.hour
      addLog(s, `🍸 You get ${p.name} a drink. ${Math.round(price)} dollars well spent, probably.`, 'money')
      break
    }

    case 'HELP_OUT': {
      const p = s.people.find((x) => x.id === action.personId)
      if (!p) return state
      const cost = Math.round(120 + p.tier * 90)
      if (s.money < cost || s.energy < 10) return state
      s.money -= cost
      neg(s, 10)
      p.affinity = clamp(p.affinity + 9, -100, 100)
      p.trust = clamp(p.trust + 11, 0, 100)
      p.respect = clamp(p.respect + 4, 0, 100)
      p.patience = clamp(p.patience + 34, 0, 100)
      p.lastSeenHour = s.hour
      addLog(s, `🤲 You spend the day sorting out ${p.name}'s problem. It costs you ${cost} dollars and most of your afternoon.`, 'good')
      break
    }

    case 'BURN_BRIDGE': {
      const p = s.people.find((x) => x.id === action.personId)
      if (!p) return state
      p.affinity = -100
      p.trust = 0
      p.respect = clamp(p.respect - 25, 0, 100)
      p.grudge = 100
      p.patience = 0
      s.controversy = clamp(s.controversy + 12, 0, 100)
      s.hype = clamp(s.hype + 5, 0, 100)
      s.dialogue = null
      s.beat = null
      addLog(s, `💥 You tell ${p.name} exactly what you think of them, in front of the room. That door is closed.`, 'bad')
      break
    }

    case 'FAVOR': {
      const p = s.people.find((x) => x.id === action.personId)
      if (!p) return state
      if (s.energy < 4) return state
      const gate = canAskFavor(p)
      if (!gate.ok) {
        p.patience = clamp(p.patience - 10, 0, 100)
        addLog(s, `🚫 ${p.name} shuts it down before you finish the sentence. (${gate.reason})`, 'bad')
        return s
      }
      neg(s, 4)
      p.favors += 1
      p.favorsThisWeek += 1
      p.patience = clamp(p.patience - 30 - p.tier * 2, 0, 100)
      p.affinity = clamp(p.affinity - (4 + p.tier), -100, 100)
      p.lastSeenHour = s.hour
      const tier = p.tier
      switch (p.role) {
        case 'producer': {
          s.boons.nextSongQuality += 5 + tier * 3
          s.boons.nextSongDiscount = Math.max(s.boons.nextSongDiscount, 0.5)
          addLog(s, `🎛️ ${p.name} clears a room for you on Thursday. Half the usual rate, twice the sound.`, 'good')
          break
        }
        case 'songwriter': {
          s.boons.nextSongQuality += 7 + tier * 2
          addLog(s, `✍️ ${p.name} slides you a hook they could not place. "Do not embarrass me with it."`, 'good')
          break
        }
        case 'dj': {
          const ceiling = Math.min(5, p.tier)
          if (s.radioTier < ceiling) {
            s.radioTier += 1
            addLog(s, `📡 ${p.name} moves you up a rotation tier. The difference is immediate and terrifying.`, 'good')
          } else {
            s.boons.nextSongQuality += 3
            addLog(s, `📡 ${p.name} says their slot cannot carry you any further than this.`, 'neutral')
          }
          break
        }
        case 'curator': {
          const best = [...s.songs]
            .filter((x) => x.released && x.playlistTier < Math.min(4, p.tier))
            .sort((a, b) => b.streamsLastHour - a.streamsLastHour)[0]
          if (best) {
            best.playlistTier = Math.min(4, best.playlistTier + 1)
            best.hype = clamp(best.hype + 20, 0, 100)
            addLog(s, `🎧 ${p.name} adds "${best.title}" to a list with actual listeners on it.`, 'good')
          } else {
            s.hype = clamp(s.hype + 6, 0, 100)
            addLog(s, `🎧 ${p.name} says they will listen when you have something worth adding.`, 'neutral')
          }
          break
        }
        case 'journalist': {
          if (s.press.level >= p.tier) {
            s.hype = clamp(s.hype + 5, 0, 100)
            addLog(s, `📰 ${p.name} says they have already written you up as far as their desk allows.`, 'neutral')
            break
          }
          s.press.level = Math.min(5, s.press.level + 1)
          const gain = Math.round(180 + sat(s.followers) * 0.2 + fameOf(s) * 60)
          s.followers += gain
          s.press.lastPieceWeek = s.week
          addLog(s, `📰 ${p.name} files a piece on you. +${ui(gain)} followers, and the search traffic is real.`, 'good')
          break
        }
        case 'ar': {
          if (p.tier < 3 && fameOf(s) < 18) {
            s.hype = clamp(s.hype + 5, 0, 100)
            addLog(s, `💼 ${p.name} likes you but cannot get a deal past their own desk.`, 'neutral')
            break
          }
          const existing = s.offers.length
          maybeOffers(s)
          if (s.offers.length > existing) {
            addLog(s, `💼 ${p.name} walks your file into the room where offers get made.`, 'money')
          } else {
            s.hype = clamp(s.hype + 8, 0, 100)
            addLog(s, `💼 ${p.name} says the timing is wrong but keeps the file open.`, 'neutral')
          }
          break
        }
        case 'promoter': {
          const pay = Math.round(700 + sat(s.followers) * 1.6 + fameOf(s) * 60)
          const fans = Math.round(50 + fameOf(s) * 12)
          s.money += pay
          s.followers += fans
          s.hype = clamp(s.hype + 6, 0, 100)
          addLog(s, `🎪 ${p.name} puts you on the bill tonight. +${money(pay)} and ${ui(fans)} new faces.`, 'money')
          break
        }
        case 'manager': {
          if (s.manager) {
            addLog(s, `📱 ${p.name} says you already have a manager and asks who it is. It gets awkward.`, 'neutral')
            break
          }
          s.manager = { personId: p.id, name: p.name, cut: 0.12 }
          addLog(s, `📱 ${p.name} takes you on. Twelve percent of everything, and doors you could not knock on.`, 'money')
          break
        }
        case 'artist': {
          const gain = Math.round(260 + sat(s.followers) * 0.24 + p.tier * 40)
          s.followers += gain
          s.boons.nextSongQuality += 4 + tier
          if (p.rivalId) {
            const r = s.rivals.find((x) => x.id === p.rivalId)
            if (r) r.beef = clamp(r.beef - 8, -100, 100)
          }
          addLog(s, `🎤 ${p.name} posts about your record to their own audience. +${ui(gain)} followers.`, 'good')
          break
        }
        case 'director': {
          s.boons.videoDiscount = 0.5
          addLog(s, `🎬 ${p.name} agrees to shoot your next video at cost. "Because the song is good. Do not make me regret it."`, 'good')
          break
        }
      }
      if (p.patience <= 0) {
        addLog(s, `😐 ${p.name} is done doing you favours for a while.`, 'bad')
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
