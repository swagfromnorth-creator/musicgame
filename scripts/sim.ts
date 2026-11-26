// Headless pacing check. Drives the real reducer with a virtual clock and a
// simple "always be busy" player, then prints the curve.
import { GIGS, PROMO_TIERS, SKILLS, STUDIOS, duration, money, num } from '../src/game/data'
import { gigReady, initialState, promoCost, reachStats, totalStreamsPerHour } from '../src/game/engine'
import { reducer } from '../src/game/reducer'
import type { GameState } from '../src/game/types'

const START = Date.UTC(2026, 0, 1)
let clock = START
Date.now = () => clock

const MINUTES = Number(process.env.MINUTES ?? 30)
let s: GameState = initialState(clock)
const step = 500
const total = MINUTES * 60 * 1000
let nextReport = 60_000

function act(a: Parameters<typeof reducer>[1]) {
  s = reducer(s, a)
}

// A player who is never idle: writing, working, releasing, gigging.
function play() {
  const bestJob = [...s.jobs].sort((a, b) => b.pay / b.durationMs - a.pay / a.durationMs)[0]
  if (bestJob && !s.activeJob) act({ type: 'TAKE_JOB', id: bestJob.id })
  else if (bestJob && !s.jobQueue && s.cash < 2000) act({ type: 'TAKE_JOB', id: bestJob.id })

  // rent the best room you can comfortably afford each session
  let level = 0
  for (let i = STUDIOS.length - 1; i >= 0; i--) {
    if (STUDIOS[i].cost <= s.cash * 0.25) { level = i; break }
  }
  if (level !== s.studioLevel) act({ type: 'SELECT_STUDIO', level })
  if (s.writingStartedAt === null) act({ type: 'WRITE' })
  if (!s.training) {
    const next = [...SKILLS].sort((a, b) => s.skills[a.id] - s.skills[b.id]).find((k) => s.skills[k.id] < 100)?.id
    if (next) act({ type: 'TRAIN', skill: next })
  }

  const draft = s.songs.filter((x) => !x.releasedAt && !x.albumId)
  if (draft.length) {
    const best = draft.sort((a, b) => b.quality - a.quality)[0]
    if (best.quality >= 35 || draft.length >= 3) {
      // spend on a push if there is comfortable cash for it
      let tier = 0
      for (let i = PROMO_TIERS.length - 1; i >= 0; i--) {
        if (PROMO_TIERS[i].cost <= s.cash * 0.35) { tier = i; break }
      }
      if (tier > 0) act({ type: 'SET_SONG_PROMO', id: best.id, tier })
      act({ type: 'RELEASE_SONG', id: best.id })
    }
  }
  for (const g of [...GIGS].reverse()) {
    if (s.fans >= g.fansNeeded && gigReady(s, g.id, clock) <= 0) {
      act({ type: 'DO_GIG', id: g.id })
      break
    }
  }
}

console.log(
  `${'time'.padEnd(6)} ${'cash'.padStart(10)} ${'fans'.padStart(9)} ${'streams/hr'.padStart(11)} ${'reach'.padStart(6)} ${'life'.padStart(5)} songs`,
)
for (let t = 0; t < total; t += step) {
  clock += step
  act({ type: 'TICK', now: clock })
  play()
  if (clock - START >= nextReport) {
    nextReport += 60_000
    const r = reachStats(s)
    const out = s.songs.filter((x) => x.releasedAt).length
    console.log(
      `${duration(clock - START).padEnd(6)} ${money(s.cash).padStart(10)} ${num(s.fans).padStart(9)} ${num(totalStreamsPerHour(s, clock)).padStart(11)} ${String(r.reach).padStart(6)} ${String(r.lifespanH + 'h').padStart(5)} ${out}/${s.songs.length}  sw${Math.round(s.skills.songwriting)} rh${Math.round(s.skills.rhythm)} vi${Math.round(s.skills.virality)}`,
    )
  }
}
