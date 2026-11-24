import { reducer } from '../src/game/store'
import { fameOf, streamsPerHour, totalStreamsPerHour, incomePerHour, reachOf, TUNE } from '../src/game/engine'
import { ROOMS, peopleInRoom, isRoomOpen, canAskFavor, REPLIES, replyOdds, topicUnlocked } from '../src/game/people'
import { PRODUCERS, randomTitle, ACTIVITIES } from '../src/game/data'
import type { GameState, TopicId } from '../src/game/types'

const D = (s: GameState | null, a: any) => reducer(s as GameState, a) as GameState
const MODE = process.env.MODE ?? 'pro'
for (const [k, v] of Object.entries(TUNE)) {
  const env = process.env['T_' + k]
  if (env) (TUNE as any)[k] = Number(env)
}
const WEEKS = Number(process.env.WEEKS ?? 40)

function newGame(): GameState {
  return reducer(null, {
    type: 'START',
    payload: {
      artistName: 'Bot', genre: 'pop', origin: 'x', hue: 330,
      portrait: { skin: 1, hair: 0, hairColor: 0, eyes: 0, outfit: 0, accessory: 0, hairStyle: 1 },
    },
  }) as GameState
}

let s = newGame()
const stats = { favors: 0, refusals: 0, talks: 0, enters: 0, roomless: 0 }
const TOPICS: TopicId[] = ['small', 'work', 'scene', 'personal', 'flirt', 'pitch']
const trace: string[] = []

function bestReply(personId: string, topic: TopicId) {
  const p = s.people.find((x) => x.id === personId)!
  const skill = (s.skills.charisma + s.skills.performance) / 2
  let best: { id: string; v: number } | null = null
  for (const r of REPLIES[topic]) {
    const odds = replyOdds(p, topic, r, skill)
    const value = odds * (r.aff + r.resp * 0.8 + r.trust * 0.6) - (1 - odds) * 4
    if (!best || value > best.v) best = { id: r.id, v: value }
  }
  return best!.id
}

function activity(id: string) {
  const def = ACTIVITIES.find((a) => a.id === id)
  if (!def) return false
  if (def.cost > s.money) return false
  if (def.energy < 0 && s.energy < -def.energy) return false
  if (def.minFame && fameOf(s) < def.minFame) return false
  const before = s.money
  s = D(s, { type: 'ACTIVITY', id })
  return s.money !== before || def.energy > 0 || true
}

const ROLE_VALUE: Record<string, number> = {
  dj: 100, curator: 92, journalist: 86, manager: 84, ar: 78,
  promoter: 66, producer: 58, songwriter: 50, director: 34, artist: 40,
}

function progressOf(p: any) {
  // how far this contact is from being useful
  return Math.max(0, Math.min(100, p.affinity * 0.5 + p.trust * 0.3 + p.respect * 0.2))
}

let project: string | null = null

function projectPerson(): any | null {
  if (!project) return null
  const p = s.people.find((x) => x.id === project)
  if (!p) { project = null; return null }
  // give up on somebody who has turned on you or is used up
  if (p.affinity < -20) { project = null; return null }
  if (canAskFavor(p).ok) return p
  if (p.affinity >= 60 && p.trust >= 60 && p.respect >= 55 && p.favors >= 3) { project = null; return null }
  return p
}

function socialTurn(): boolean {
  const target0 = projectPerson()
  // where is the project right now?
  if (target0) {
    const roomsNow = ROOMS.filter((r) => isRoomOpen(r, s.hour) && fameOf(s) >= r.gateFame && s.money >= r.cover)
    const home = roomsNow.find((r) => peopleInRoom(s.people, r.id, s.hour, s.week).some((x) => x.id === target0.id))
    if (!home) return false // they are not out tonight
    if (s.room !== home.id) {
      if (s.room) { s = D(s, { type: 'LEAVE_ROOM' }); return true }
      if (s.energy < home.energy + 16) return false
      s = D(s, { type: 'ENTER_ROOM', room: home.id })
      return !!s.room
    }
    const here = peopleInRoom(s.people, s.room, s.hour, s.week)
    const p = here.find((x) => x.id === target0.id)
    if (!p) return false
    if (canAskFavor(p).ok && p.patience > 40 && s.energy > 20) {
      const before = p.favors
      s = D(s, { type: 'FAVOR', personId: p.id })
      const after = s.people.find((x) => x.id === p.id)!
      if (after.favors > before) { stats.favors++; project = null; return true }
      stats.refusals++
      return true
    }
    return converse(p)
  }

  // no project: find the best person who is out tonight
  const open = ROOMS.filter((r) => isRoomOpen(r, s.hour) && fameOf(s) >= r.gateFame && s.money >= r.cover && s.energy >= r.energy + 16)
  if (!open.length) return false
  let best: { p: any; room: string; v: number } | null = null
  for (const r of open) {
    for (const p of peopleInRoom(s.people, r.id, s.hour, s.week)) {
      if (p.affinity < -20) continue
      const base = ROLE_VALUE[p.role] ?? 30
      const v = base * (1 - progressOf(p) / 100) + (p.met ? 8 : 0)
      if (!best || v > best.v) best = { p, room: r.id, v }
    }
  }
  if (!best || best.v <= 0) return false
  project = best.p.id
  if (s.room !== best.room) {
    if (s.room) { s = D(s, { type: 'LEAVE_ROOM' }); return true }
    s = D(s, { type: 'ENTER_ROOM', room: best.room })
    return !!s.room
  }
  const fresh = s.people.find((x) => x.id === best!.p.id)!
  return converse(fresh)
}

function converse(p: any): boolean {
  if (s.energy < 14) return false
  let topic: TopicId = 'small'
  if (p.affinity < 34) topic = topicUnlocked(p, 'personal').ok ? 'personal' : 'small'
  else if (p.respect < 30) topic = topicUnlocked(p, 'work').ok ? 'work' : 'scene'
  else topic = p.trust < 30 ? 'personal' : 'scene'
  if (!topicUnlocked(p, topic).ok) topic = 'small'
  s = D(s, { type: 'TALK', personId: p.id, topic })
  if (!s.dialogue) return false
  s = D(s, { type: 'REPLY', replyId: bestReply(p.id, topic) })
  s = D(s, { type: 'CLOSE_BEAT' })
  stats.talks++
  return true
}

function workTurn(): boolean {
  if (s.pending) { s = D(s, { type: 'RELEASE_PENDING' }); return true }
  if (s.energy < 22 || s.money < 200) return false
  const prod = [...PRODUCERS].reverse().find((p) => p.cost + 30 < s.money * 0.4) ?? PRODUCERS[0]
  s = D(s, {
    type: 'WRITE_SONG',
    payload: { title: randomTitle(), genre: s.genre, mood: 'anthem', style: 'hooky', producerId: prod.id, featureId: null },
  })
  return true
}

let lastWk = -1
const HOURS = 168 * WEEKS
// A human cannot click once per game hour: at 2.5 game-hours/sec, one action
// every 5 game-hours is already ~2.5 clicks/sec sustained.
const STEP = Number(process.env.STEP ?? 5)
for (let h = 0; h < HOURS; h += STEP) {
  s = D(s, { type: 'TICK', hours: STEP })
  if (s.retired) break

  if (s.week !== lastWk && s.week % 5 === 0) {
    lastWk = s.week
    const met = s.people.filter((p) => p.met).length
    const allies = s.people.filter((p) => p.met && p.affinity > 40).length
    trace.push(
      `wk${String(s.week).padStart(3)} fans=${(s.followers / 1000).toFixed(1).padStart(7)}k fame=${fameOf(s).toFixed(1).padStart(4)} streams/hr=${Math.round(totalStreamsPerHour(s)).toString().padStart(7)} $/hr=${incomePerHour(s).toFixed(1).padStart(7)} cash=$${Math.round(s.money).toString().padStart(8)} reach=${reachOf(s).toFixed(2)} songs=${s.songs.length} met=${met} allies=${allies} radio=${s.radioTier} press=${s.press.level} mgr=${s.manager ? 'y' : 'n'} label=${s.label ? s.label.name.split(' ')[0] : '-'} aw=${s.awards.filter((a) => a.won).length}`,
    )
  }
  if (s.pending) { s = D(s, { type: 'RELEASE_PENDING' }); continue }
  if (s.energy < 26) { s = D(s, { type: 'REST' }); continue }

  if (MODE === 'pro') {
    // keep the lights on
    if (s.money < 500 && s.energy > 40) { activity('local-show'); continue }
    // promo when nothing is landing
    if (s.hype < 25 && s.energy > 55 && Math.random() < 0.12) {
      if (activity('post-clip') || activity('go-live')) continue
    }
    // social first, then work
    const roll = Math.random()
    if (roll < 0.55) { if (socialTurn()) continue }
    if (roll < 0.8) { if (workTurn()) continue }
    if (socialTurn()) continue
    if (workTurn()) continue
  } else if (MODE === 'social') {
    if (socialTurn()) continue
    if (workTurn()) continue
  } else {
    // idle: never talks to anyone, just releases
    if (workTurn()) continue
    if (!process.env.NOSHOW && s.money < 400 && s.energy > 40) { activity('local-show'); continue }
  }
  s = D(s, { type: 'REST' })
}
console.log(`MODE=${MODE}`)
console.log(trace.join('\n'))
console.log('stats', JSON.stringify(stats))
console.log('\nfinal: songs', s.songs.length, 'best peak', Math.min(...s.songs.map((x) => x.peak || 999)), 'energy', Math.round(s.energy), 'health', Math.round(s.health))
const best = [...s.people].filter((p) => p.met).sort((a, b) => b.affinity - a.affinity).slice(0, 4)
console.log('closest:', best.map((p) => `${p.name.split(' ')[0]}(${p.role} a${Math.round(p.affinity)} r${Math.round(p.respect)} t${Math.round(p.trust)})`).join(' | '))
