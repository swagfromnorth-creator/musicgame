// Headless pacing check. Drives the real reducer with a virtual clock and a
// simple "always be busy" player, then prints the curve.
import { GIGS, STUDIOS, duration, money, num } from '../src/game/data'
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
  if (!s.activeJob) {
    const best = [...s.jobs].sort((a, b) => b.pay / b.durationMs - a.pay / a.durationMs)[0]
    if (best) act({ type: 'TAKE_JOB', id: best.id })
  }
  if (s.writingStartedAt === null) act({ type: 'WRITE' })

  const draft = s.songs.filter((x) => !x.releasedAt)
  if (draft.length) {
    // hold singles until they are worth releasing, then drop the best one
    const best = draft.sort((a, b) => b.quality - a.quality)[0]
    if (best.quality >= 35 || draft.length >= 3) act({ type: 'RELEASE_SONG', id: best.id })
  }
  if (s.cash >= promoCost(s) * 1.5) act({ type: 'BUY_PROMO' })
  const nextStudio = STUDIOS[s.studioLevel + 1]
  if (nextStudio && s.cash >= nextStudio.cost * 1.2) act({ type: 'BUY_STUDIO' })
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
      `${duration(clock - START).padEnd(6)} ${money(s.cash).padStart(10)} ${num(s.fans).padStart(9)} ${num(totalStreamsPerHour(s, clock)).padStart(11)} ${String(r.reach).padStart(6)} ${String(r.lifespanH + 'h').padStart(5)} ${out}/${s.songs.length}`,
    )
  }
}
