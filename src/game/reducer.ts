import { GIGS, STUDIOS, TUNE, randomTitle } from './data'
import {
  advance,
  albumReachFor,
  clamp,
  initialState,
  log,
  promoCost,
  promoOf,
  rollQuality,
  songLifespan,
  songReachWithPromo,
  trainDurationMs,
  writeDurationMs,
} from './engine'
import type { Action, GameState } from './types'

const uid = () => Math.random().toString(36).slice(2, 9)

export function reducer(state: GameState, action: Action): GameState {
  const now = Date.now()
  if (action.type === 'RESET') {
    const fresh = initialState(now)
    fresh.artistName = state.artistName
    return fresh
  }
  // The world always moves before the player's choice lands.
  const s: GameState = JSON.parse(JSON.stringify(state))
  advance(s, now)

  switch (action.type) {
    case 'TICK':
      break

    // ---------------------------------------------------------------- studio
    case 'WRITE': {
      if (s.writingStartedAt !== null) break
      s.writingStartedAt = now
      s.writingDurationMs = writeDurationMs(s.skills)
      break
    }

    case 'CANCEL_WRITE': {
      if (s.writingStartedAt === null) break
      s.writingStartedAt = null
      log(s, 'You scrapped the session.', 'info', now)
      break
    }

    // ------------------------------------------------------------- training
    case 'TRAIN': {
      if (s.training) break
      if (s.skills[action.skill] >= TUNE.maxSkill) break
      s.training = {
        skill: action.skill,
        startedAt: now,
        durationMs: trainDurationMs(s.skills[action.skill]),
      }
      break
    }

    case 'STOP_TRAIN': {
      if (!s.training) break
      s.training = null
      break
    }

    // ----------------------------------------------------------------- songs
    case 'RENAME_SONG': {
      const song = s.songs.find((x) => x.id === action.id)
      if (!song || song.releasedAt) break
      const clean = action.title.trim().slice(0, 40)
      if (clean) song.title = clean
      break
    }

    case 'SET_SONG_PROMO': {
      const song = s.songs.find((x) => x.id === action.id)
      if (!song || song.releasedAt) break
      song.promoTier = clamp(action.tier, 0, 4)
      break
    }

    case 'RELEASE_SONG': {
      const song = s.songs.find((x) => x.id === action.id)
      if (!song || song.releasedAt || song.albumId) break
      const promo = promoOf(song.promoTier)
      if (s.cash < promo.cost) break
      s.cash -= promo.cost
      song.releasedAt = now
      song.lifeAnchor = now
      song.reach = songReachWithPromo(s.skills.virality, song.quality, song.promoTier)
      song.lifespanH = songLifespan(s.skills.virality)
      log(
        s,
        `"${song.title}" is out. Reach ${song.reach}${promo.cost ? ` · paid $${promo.cost.toLocaleString('en-US')} for the push` : ''}.`,
        'reach',
        now,
      )
      break
    }

    // ---------------------------------------------------------------- albums
    case 'CREATE_ALBUM': {
      const ids = (action.songIds || []).filter((id) => {
        const song = s.songs.find((x) => x.id === id)
        return !!song && !song.releasedAt && !song.albumId
      })
      if (!ids.length) break
      const albumId = uid()
      s.albums.unshift({
        id: albumId,
        title: action.title.trim().slice(0, 40) || randomTitle(),
        songIds: ids,
        reach: 0,
        createdAt: now,
        releasedAt: null,
        promoTier: 0,
      })
      for (const id of ids) {
        const song = s.songs.find((x) => x.id === id)!
        song.albumId = albumId
      }
      break
    }

    case 'RENAME_ALBUM': {
      const album = s.albums.find((x) => x.id === action.id)
      if (!album || album.releasedAt) break
      const clean = action.title.trim().slice(0, 40)
      if (clean) album.title = clean
      break
    }

    case 'SET_ALBUM_PROMO': {
      const album = s.albums.find((x) => x.id === action.id)
      if (!album || album.releasedAt) break
      album.promoTier = clamp(action.tier, 0, 4)
      break
    }

    case 'RELEASE_ALBUM': {
      const album = s.albums.find((x) => x.id === action.id)
      if (!album || album.releasedAt) break
      const promo = promoOf(album.promoTier)
      if (s.cash < promo.cost) break
      const songs = s.songs.filter((x) => album.songIds.includes(x.id))
      if (!songs.length) break
      s.cash -= promo.cost
      album.reach = albumReachFor(s, album.songIds, album.promoTier)
      album.releasedAt = now
      for (const song of songs) {
        song.releasedAt = now
        song.lifeAnchor = now
        song.reach = Math.max(songReachWithPromo(s.skills.virality, song.quality, 0), album.reach)
        song.lifespanH = songLifespan(s.skills.virality) * 1.2
      }
      log(
        s,
        `Album "${album.title}" is out — ${songs.length} track${songs.length === 1 ? '' : 's'}, reach ${album.reach}.`,
        'reach',
        now,
      )
      break
    }

    case 'DISSOLVE_ALBUM': {
      const album = s.albums.find((x) => x.id === action.id)
      if (!album || album.releasedAt) break
      for (const song of s.songs) if (song.albumId === album.id) song.albumId = null
      s.albums = s.albums.filter((x) => x.id !== album.id)
      log(s, `Broke up "${album.title}". The tracks are back in the vault.`, 'info', now)
      break
    }

    // ------------------------------------------------------------------ work
    case 'TAKE_JOB': {
      if (s.activeJob) break
      const job = s.jobs.find((x) => x.id === action.id)
      if (!job) break
      s.activeJob = {
        title: job.title,
        emoji: job.emoji,
        pay: job.pay,
        startedAt: now,
        durationMs: job.durationMs,
      }
      break
    }

    case 'DO_GIG': {
      const gig = GIGS.find((g) => g.id === action.id)
      if (!gig) break
      if (s.fans < gig.fansNeeded) break
      if ((s.gigReadyAt[gig.id] ?? 0) > now) break
      s.cash += gig.pay
      s.fans += gig.fans
      s.boostUntil = now + TUNE.boostMs
      s.gigReadyAt[gig.id] = now + gig.cooldownMs
      s.gigsPlayed = (s.gigsPlayed ?? 0) + 1
      log(s, `Played ${gig.name}. +$${gig.pay.toLocaleString('en-US')} · +${gig.fans.toLocaleString('en-US')} fans.`, 'fan', now)
      break
    }

    // ------------------------------------------------------------------- biz
    case 'BUY_STUDIO': {
      const next = STUDIOS[s.studioLevel + 1]
      if (!next || s.cash < next.cost) break
      s.cash -= next.cost
      s.studioLevel += 1
      log(s, `Moved up to ${next.name}.`, 'info', now)
      break
    }

    case 'BUY_PROMO': {
      const cost = promoCost(s)
      if (s.cash < cost) break
      s.cash -= cost
      s.promoUntil = Math.max(now, s.promoUntil) + TUNE.promoMs
      log(s, 'Promotion is running. Everything is reaching further.', 'reach', now)
      break
    }

    case 'SET_NAME': {
      const clean = action.name.trim().slice(0, 24)
      if (clean) s.artistName = clean
      break
    }
  }

  return s
}
