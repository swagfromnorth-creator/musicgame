import { GIGS, STUDIOS, TUNE, randomTitle } from './data'
import { advance, clamp, log, promoCost, rollQuality, songLifespan, songReach, writeDurationMs } from './engine'
import type { Action, GameState } from './types'
import { initialState } from './engine'

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

    case 'WRITE': {
      if (s.writingStartedAt !== null) break
      s.writingStartedAt = now
      s.writingDurationMs = writeDurationMs(s.songwriting)
      break
    }

    case 'CANCEL_WRITE': {
      if (s.writingStartedAt === null) break
      s.writingStartedAt = null
      log(s, 'You scrapped the session.', 'info', now)
      break
    }

    case 'RENAME_SONG': {
      const song = s.songs.find((x) => x.id === action.id)
      if (!song || song.releasedAt) break
      const clean = action.title.trim().slice(0, 40)
      if (clean) song.title = clean
      break
    }

    case 'RELEASE_SONG': {
      const song = s.songs.find((x) => x.id === action.id)
      if (!song || song.releasedAt) break
      song.releasedAt = now
      song.lifeAnchor = now
      song.reach = songReach(s.virality, song.quality)
      song.lifespanH = songLifespan(s.virality)
      s.virality = clamp(s.virality + 1.6 * (1 - s.virality / 130), 0, 100)
      log(s, `"${song.title}" is out. Reach ${song.reach} · lasts ${song.lifespanH}h.`, 'reach', now)
      break
    }

    case 'RELEASE_ALBUM': {
      const ids = action.songIds.filter((id) => {
        const song = s.songs.find((x) => x.id === id)
        return !!song
      })
      if (!ids.length) break
      const chosen = s.songs.filter((x) => ids.includes(x.id))
      // An album re-promotes everything on it: fresh clock, wider reach.
      for (const song of chosen) {
        if (!song.releasedAt) {
          song.releasedAt = now
          song.reach = songReach(s.virality, song.quality)
          song.lifespanH = songLifespan(s.virality)
        }
      }
      const avgReach = chosen.reduce((a, b) => a + songReach(s.virality, b.quality), 0) / chosen.length
      const albumReach = Math.round(avgReach * (1.2 + s.virality / 400) * 10) / 10
      const albumId = uid()
      s.albums.unshift({
        id: albumId,
        title: action.title.trim().slice(0, 40) || randomTitle(),
        songIds: ids,
        reach: albumReach,
        createdAt: now,
      })
      for (const song of chosen) {
        song.albumId = albumId
        song.lifeAnchor = now
        song.reach = Math.max(song.reach, albumReach)
        song.lifespanH = Math.max(song.lifespanH, songLifespan(s.virality) * 1.2)
      }
      s.virality = clamp(s.virality + 3.5 * (1 - s.virality / 130), 0, 100)
      log(s, `Album "${s.albums[0].title}" is out — ${ids.length} track${ids.length === 1 ? '' : 's'}, reach ${albumReach}.`, 'reach', now)
      break
    }

    case 'TAKE_JOB': {
      if (s.activeJob) break
      const job = s.jobs.find((x) => x.id === action.id)
      if (!job) break
      s.activeJob = {
        listingId: job.id,
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
      s.virality = clamp(s.virality + 0.4 * (1 - s.virality / 130), 0, 100)
      log(s, `Played ${gig.name}. +$${gig.pay.toLocaleString('en-US')} · +${gig.fans.toLocaleString('en-US')} fans.`, 'fan', now)
      break
    }

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
