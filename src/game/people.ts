// ---------------------------------------------------------------------------
// The Scene — people, rooms, and what they can do for you
// ---------------------------------------------------------------------------
import type { Person, RoleId, RoomId, TraitId, TopicId } from './types'
import { pick } from './data'

export interface RoleDef {
  id: RoleId
  name: string
  emoji: string
  hook: string
  favor: string
  favorDesc: string
  color: string
}

export const ROLES: RoleDef[] = [
  {
    id: 'producer',
    name: 'Producer',
    emoji: '🎛️',
    hook: 'Makes records. Owns the sound everyone is chasing.',
    favor: 'Studio session',
    favorDesc: 'Books you into their room at a fraction of the rate. Big quality bump.',
    color: '#38bdf8',
  },
  {
    id: 'songwriter',
    name: 'Songwriter',
    emoji: '✍️',
    hook: 'Writes for other people. Has a drawer full of hits.',
    favor: 'Hand you a top line',
    favorDesc: 'Slides you a hook they could not sell. Your next song writes itself.',
    color: '#f5c451',
  },
  {
    id: 'dj',
    name: 'Radio',
    emoji: '📡',
    hook: 'Programs a night slot. One spin changes your week.',
    favor: 'Put you in rotation',
    favorDesc: 'Moves you up a radio tier. Streams go up permanently.',
    color: '#22d3ee',
  },
  {
    id: 'curator',
    name: 'Curator',
    emoji: '🎧',
    hook: 'Runs playlists with more reach than most labels.',
    favor: 'Playlist add',
    favorDesc: 'Adds one of your records to a list people actually listen to.',
    color: '#a78bfa',
  },
  {
    id: 'journalist',
    name: 'Journalist',
    emoji: '📰',
    hook: 'Decides whether the story about you is kind.',
    favor: 'Write you up',
    favorDesc: 'A feature brings new ears. Cross them and it becomes a hit piece.',
    color: '#f87171',
  },
  {
    id: 'ar',
    name: 'A&R',
    emoji: '💼',
    hook: 'Signs artists. Sits in a building you cannot get into yet.',
    favor: 'Get you a meeting',
    favorDesc: 'Puts a label offer on the table. Terms depend on how they feel about you.',
    color: '#fbbf24',
  },
  {
    id: 'promoter',
    name: 'Promoter',
    emoji: '🎪',
    hook: 'Books the rooms. Can put your name on a poster tonight.',
    favor: 'Book you a show',
    favorDesc: 'A paying gig with a real crowd — no upfront cost to you.',
    color: '#fb923c',
  },
  {
    id: 'manager',
    name: 'Manager',
    emoji: '📱',
    hook: 'Answers your phone, takes a cut, opens doors.',
    favor: 'Take you on',
    favorDesc: 'A manager permanently boosts your reach — for 12% of everything you earn.',
    color: '#4ade80',
  },
  {
    id: 'artist',
    name: 'Artist',
    emoji: '🎤',
    hook: 'Another act. Friend, rival, or both by Thursday.',
    favor: 'Jump on your record',
    favorDesc: 'A feature that borrows their audience. Cheaper than booking them cold.',
    color: '#ff2d78',
  },
  {
    id: 'director',
    name: 'Director',
    emoji: '🎬',
    hook: 'Shoots the videos that make a song feel like an event.',
    favor: 'Shoot your video',
    favorDesc: 'A video at a fraction of the price, with a bigger impact.',
    color: '#e2e8f0',
  },
]

export function roleOf(id: RoleId): RoleDef {
  return ROLES.find((r) => r.id === id) ?? ROLES[0]
}

export interface TraitDef {
  id: TraitId
  name: string
  blurb: string
  tell: string
}

export const TRAITS: TraitDef[] = [
  { id: 'snob', name: 'Snob', blurb: 'Only respects craft. Hates small talk.', tell: 'checks their phone while you talk' },
  { id: 'gossip', name: 'Gossip', blurb: 'Lives for information. Will trade it.', tell: 'knows something about everyone in the room' },
  { id: 'flirt', name: 'Flirt', blurb: 'Warmer than professional. Dangerous to misread.', tell: 'holds eye contact a beat too long' },
  { id: 'ruthless', name: 'Ruthless', blurb: 'Respects nerve. Reads politeness as weakness.', tell: 'says exactly what they think' },
  { id: 'loyal', name: 'Loyal', blurb: 'Slow to warm, slower to leave.', tell: 'remembers your name and your last record' },
  { id: 'volatile', name: 'Volatile', blurb: 'Great nights, catastrophic nights.', tell: 'is three drinks in at 6pm' },
  { id: 'greedy', name: 'Greedy', blurb: 'Every favour has a price and it is rising.', tell: 'asks what the budget is before hello' },
]

export interface RoomDef {
  id: RoomId
  name: string
  emoji: string
  blurb: string
  cover: number
  energy: number
  opens: number
  closes: number
  hue: number
  gateFame: number
  scene: string
}

export const ROOMS: RoomDef[] = [
  {
    id: 'studio8',
    name: 'Studio 8',
    emoji: '🎛️',
    blurb: 'Four rooms, one corridor, everybody pretending they are not listening through the door.',
    cover: 40,
    energy: 6,
    opens: 10,
    closes: 23,
    hue: 200,
    gateFame: 0,
    scene: 'engineers, producers, session players',
  },
  {
    id: 'blue',
    name: 'The Blue Room',
    emoji: '🍸',
    blurb: 'The industry drinks here. Everything that gets decided gets decided at this bar.',
    cover: 120,
    energy: 8,
    opens: 20,
    closes: 26,
    hue: 265,
    gateFame: 0,
    scene: 'A&Rs, managers, the press',
  },
  {
    id: 'radio',
    name: 'Radio Row',
    emoji: '📡',
    blurb: 'Fluorescent lights, free coffee, and a corridor of people who decide what the city hears.',
    cover: 0,
    energy: 6,
    opens: 9,
    closes: 18,
    hue: 190,
    gateFame: 0,
    scene: 'DJs, programmers, pluggers',
  },
  {
    id: 'paper',
    name: 'The Paper',
    emoji: '📰',
    blurb: 'A newsroom with a bar in it. Both are busy.',
    cover: 25,
    energy: 6,
    opens: 12,
    closes: 22,
    hue: 8,
    gateFame: 0,
    scene: 'journalists, photographers, editors',
  },
  {
    id: 'roxy',
    name: 'Backstage at the Roxy',
    emoji: '🎤',
    blurb: 'A 600-cap room with a 6,000-cap ego. Everyone backstage is somebody, allegedly.',
    cover: 60,
    energy: 7,
    opens: 19,
    closes: 25,
    hue: 330,
    gateFame: 3,
    scene: 'artists, promoters, hangers-on',
  },
  {
    id: 'labelrow',
    name: 'Label Row',
    emoji: '🏢',
    blurb: 'Glass, carpet, and a receptionist who has already decided you are nobody.',
    cover: 0,
    energy: 9,
    opens: 10,
    closes: 18,
    hue: 45,
    gateFame: 12,
    scene: 'A&Rs, executives, lawyers',
  },
  {
    id: 'after',
    name: 'The Afterparty',
    emoji: '🌃',
    blurb: 'No address. You need to know someone, and you need to know the someone who knows the address.',
    cover: 200,
    energy: 10,
    opens: 23,
    closes: 30,
    hue: 300,
    gateFame: 25,
    scene: 'everyone who matters, and three people who do not',
  },
]

export function roomOf(id: RoomId): RoomDef {
  return ROOMS.find((r) => r.id === id) ?? ROOMS[0]
}

// ---------------------------------------------------------------------------
// characters
// ---------------------------------------------------------------------------

const FIRST = ['Denny', 'Mona', 'Curtis', 'Yara', 'Raf', 'Simone', 'Ott', 'Priya', 'Bram', 'Lila', 'Kofi', 'Sasha', 'Emeka', 'Ruth', 'Tobias', 'Nia', 'Gus', 'Delphine', 'Ike', 'Wanda', 'Marcus', 'Zadie', 'Hugo', 'Tess', 'Ali', 'Bea', 'Sonny', 'Noor']
const LAST = ['Ostrowski', 'Bellandi', 'Ngata', 'Reyes', 'Feldman', 'Kowal', 'Bassett', 'Duarte', 'Mercer', 'Osei', 'Halloran', 'Petrov', 'Vance', 'Adeyemi', 'Roth', 'Delacroix', 'Sandoval', 'Kirk', 'Ibarra', 'Tran']

const ROLE_NAMES: Record<RoleId, string[]> = {
  producer: ['Producer', 'Producer', 'Mix Engineer'],
  songwriter: ['Songwriter', 'Topliner'],
  dj: ['Programming Director', 'Night DJ', 'Plugger'],
  curator: ['Playlist Curator'],
  journalist: ['Staff Writer', 'Critic', 'Editor'],
  ar: ['A&R Scout', 'A&R Director', 'Label Exec'],
  promoter: ['Promoter', 'Talent Buyer'],
  manager: ['Manager'],
  artist: ['Artist', 'New Artist', 'Internet Artist'],
  director: ['Video Director'],
}

const BLURBS: Record<RoleId, string[]> = {
  producer: [
    'Made two platinum records and speaks about them in the past tense.',
    'Runs a room that smells like tape saturation and cold coffee.',
    'Gets a sound out of cheap gear that should not be possible.',
  ],
  songwriter: [
    'Writes in the morning, disappears at night, hands you a hook at 3am.',
    'Has fourteen songs in a drawer that other people sang.',
    'Says the bridge is where you can tell if a person is serious.',
  ],
  dj: [
    'Has a night slot and a very specific idea of what fits it.',
    'Decides the playlist for a hundred thousand commutes.',
    'Can make a record happen with one sentence in a programming meeting.',
  ],
  curator: [
    'Runs a list with a suspiciously high number of followers and no photos.',
    'Adds two songs a week. Takes no submissions. Takes favours.',
    'Reads every comment on every song they add.',
  ],
  journalist: [
    'Has ended two careers and started one, all in the same month.',
    'Writes the profile that everyone screenshots.',
    'Keeps a list of artists who lied to them.',
  ],
  ar: [
    'Signs one act a year. Is reminded of that daily.',
    'Has a budget and a boss and very little patience.',
    'Once passed on the biggest act of the decade. It is going well.',
  ],
  promoter: [
    'Books the rooms and counts the door.',
    'Will put you on a bill if the bill still makes money.',
    'Has a venue, a van, and a very direct manner.',
  ],
  manager: [
    'Answers every call before the second ring.',
    'Managed a band through a breakup and kept both halves.',
    'Wants fifteen percent and a future.',
  ],
  artist: [
    'Three hundred thousand monthly listeners and a bad attitude.',
    'Is having the year you want to have.',
    'Came up on the same circuit, and got out first.',
  ],
  director: [
    'Shoots everything on film and charges accordingly.',
    'Made a video for a song that was not even good and it went to twelve million.',
    'Has opinions about your visual identity. Is usually right.',
  ],
}

const HOOKS: Record<RoleId, string[]> = {
  producer: ['their room, their sound', 'the mix on your last record was flat'],
  songwriter: ['a hook they could not place', 'the bridge they would rewrite'],
  dj: ['one spin on a Tuesday', 'rotation, if it fits'],
  curator: ['one add, then the algorithm', 'their list has teeth'],
  journalist: ['a feature, or a hatchet job', 'the story that defines you'],
  ar: ['a meeting, then a number', 'a deal with a name on it'],
  promoter: ['a paying gig tonight', 'a door split worth arguing about'],
  manager: ['doors you cannot knock on yourself', 'twelve percent of everything'],
  artist: ['their audience, borrowed', 'a verse worth more than yours'],
  director: ['a video that travels', 'a budget that does not'],
}

export const PERSON_HUES = [8, 24, 40, 120, 168, 190, 210, 265, 300, 330]

const ROLES_PER_WORLD: { role: RoleId; tier: number; room: RoomId; hours: [number, number] }[] = [
  { role: 'producer', tier: 3, room: 'studio8', hours: [10, 20] },
  { role: 'producer', tier: 5, room: 'studio8', hours: [14, 23] },
  { role: 'producer', tier: 1, room: 'studio8', hours: [10, 16] },
  { role: 'songwriter', tier: 2, room: 'studio8', hours: [11, 19] },
  { role: 'songwriter', tier: 4, room: 'paper', hours: [13, 21] },
  { role: 'dj', tier: 2, room: 'radio', hours: [9, 17] },
  { role: 'dj', tier: 4, room: 'radio', hours: [10, 18] },
  { role: 'dj', tier: 5, room: 'blue', hours: [21, 26] },
  { role: 'curator', tier: 2, room: 'radio', hours: [9, 15] },
  { role: 'curator', tier: 4, room: 'after', hours: [23, 30] },
  { role: 'journalist', tier: 2, room: 'paper', hours: [12, 20] },
  { role: 'journalist', tier: 4, room: 'blue', hours: [20, 26] },
  { role: 'ar', tier: 2, room: 'blue', hours: [20, 26] },
  { role: 'ar', tier: 5, room: 'labelrow', hours: [10, 18] },
  { role: 'promoter', tier: 2, room: 'roxy', hours: [18, 24] },
  { role: 'promoter', tier: 4, room: 'after', hours: [23, 30] },
  { role: 'manager', tier: 3, room: 'blue', hours: [19, 25] },
  { role: 'manager', tier: 5, room: 'labelrow', hours: [10, 17] },
  { role: 'artist', tier: 2, room: 'roxy', hours: [19, 25] },
  { role: 'artist', tier: 4, room: 'blue', hours: [21, 27] },
  { role: 'artist', tier: 3, room: 'studio8', hours: [12, 20] },
  { role: 'artist', tier: 5, room: 'after', hours: [23, 30] },
  { role: 'director', tier: 3, room: 'roxy', hours: [18, 23] },
  { role: 'director', tier: 4, room: 'after', hours: [24, 30] },
]

const TRAIT_POOL: TraitId[] = ['snob', 'gossip', 'flirt', 'ruthless', 'loyal', 'volatile', 'greedy']

export function createPeople(seed = 0): Person[] {
  const used = new Set<string>()
  return ROLES_PER_WORLD.map((spec, i) => {
    let name = `${pick(FIRST)} ${pick(LAST)}`
    let guard = 0
    while (used.has(name) && guard++ < 60) name = `${pick(FIRST)} ${pick(LAST)}`
    used.add(name)
    const role = spec.role
    const traits: TraitId[] = [pick(TRAIT_POOL)]
    if (Math.random() < 0.4) {
      const t = pick(TRAIT_POOL)
      if (!traits.includes(t)) traits.push(t)
    }
    return {
      id: `p${i}`,
      name,
      role,
      title: pick(ROLE_NAMES[role]),
      tier: spec.tier,
      affinity: 0,
      respect: 0,
      trust: 0,
      patience: 100,
      traits,
      room: spec.room,
      hours: spec.hours,
      met: false,
      lastSeenHour: seed,
      favors: 0,
      favorsThisWeek: 0,
      hue: PERSON_HUES[i % PERSON_HUES.length],
      blurb: pick(BLURBS[role]),
      hook: pick(HOOKS[role]),
      rivalId: role === 'artist' ? `rival_${i % 6}` : null,
      grudge: 0,
    }
  })
}

// ---------------------------------------------------------------------------
// who is where, right now
// ---------------------------------------------------------------------------

export function hourOfDay(hour: number): number {
  return ((hour % 24) + 24) % 24
}

export function isRoomOpen(def: RoomDef, hour: number): boolean {
  const h = hourOfDay(hour)
  const close = def.closes
  if (close <= 24) return h >= def.opens && h < close
  return h >= def.opens || h < close - 24
}

export function roomStatus(def: RoomDef, hour: number): { open: boolean; inHours: number } {
  const h = hourOfDay(hour)
  const open = isRoomOpen(def, hour)
  if (open) {
    const closeToday = def.closes > 24 ? def.closes - 24 : def.closes
    let inHours = closeToday - h
    if (inHours < 0) inHours += 24
    return { open, inHours: Math.max(1, Math.round(inHours)) }
  }
  let wait = def.opens - h
  if (wait < 0) wait += 24
  return { open, inHours: Math.max(1, Math.round(wait)) }
}

/** deterministic per-day attendance so the room feels stable while you are in it */
export function attendsToday(p: Person, week: number, day: number): boolean {
  const n = Math.sin((p.id.charCodeAt(1) * 13.37 + week * 7.1 + day * 3.3) * 12.9898) * 43758.5453
  return n - Math.floor(n) > 0.22
}

export function peopleInRoom(people: Person[], room: RoomId, hour: number, week: number): Person[] {
  const day = Math.floor(hour / 24)
  const h = hourOfDay(hour)
  return people.filter((p) => {
    if (p.room !== room) return false
    const [from, to] = p.hours
    const inWindow = to <= 24 ? h >= from && h < to : h >= from || h < to - 24
    return inWindow && attendsToday(p, week, day)
  })
}

// ---------------------------------------------------------------------------
// anything useful a person might say
// ---------------------------------------------------------------------------

export function npcLine(p: Person, topic: TopicId): string {
  const role = p.role
  const r = (arr: string[]) => pick(arr)

  if (topic === 'small') {
    return r([
      `"You are ${role === 'artist' ? 'the one who has been in the studio' : 'around a lot lately, right?'} I have seen your name."`,
      `"Slow night. Everyone is at the thing on the other side of town."`,
      `"I heard your last one. Twice, actually. That is not nothing."`,
      `"You look like you have been sleeping in a car."`,
      `"How long have you been doing this? Be honest."`,
    ])
  }
  if (topic === 'work') {
    return r([
      `"The bottom end on your record is a mess. Nobody told you that, clearly."`,
      `"What is the plan here? Not the dream. The plan."`,
      `"If you cannot say what your record is in one sentence, neither can I."`,
      `"Everyone wants a feature until it is time to pay for the room."`,
      `"You have got ${role === 'producer' ? 'taste' : 'a voice'}. That is the cheap part."`,
    ])
  }
  if (topic === 'scene') {
    return r([
      `"That deal everyone is posting about? Two of the three signatures are fake."`,
      `"${p.name.split(' ')[0]} — no, not me. The other one. He is not returning calls."`,
      `"There is a meeting on Thursday that will decide three careers. None of them are yours yet."`,
      `"Half this room is being paid to be here. Guess which half."`,
      `"I know what the label is going to do. I will tell you when I know what you are worth."`,
    ])
  }
  if (topic === 'personal') {
    return r([
      `"I have been doing this eighteen years and I still get nervous before a first listen."`,
      `"My father thinks I am a booking agent. I have not corrected him."`,
      `"I do not sleep. I do not recommend it, but it does free up the schedule."`,
      `"You know what nobody tells you? It does not get easier. It gets quieter."`,
      `"I had a band. We were good. Then we were not."`,
    ])
  }
  if (topic === 'flirt') {
    return r([
      `"You are doing that thing where you talk to me like I am a door."`,
      `"Careful. I am a lot more fun when I am not being professional."`,
      `"...is this how you get everyone to play on your records?"`,
      `"You are either very charming or very broke. I have not decided."`,
    ])
  }
  return r([
    `"So. What is it you actually want from me?"`,
    `"You have got thirty seconds before I have to be somewhere."`,
    `"Go on then. Sell me the thing."`,
    `"I say no to forty of these a week. Make it forty-one."`,
  ])
}

export interface Reply {
  id: string
  label: string
  tone: 'warm' | 'sharp' | 'bold'
  aff: number
  resp: number
  trust: number
  risk: number
  energy: number
  money?: number
  win: string
  lose: string
}

export const REPLIES: Record<TopicId, Reply[]> = {
  small: [
    {
      id: 'a',
      label: '“Yeah — still figuring it out. How long have you been here?”',
      tone: 'warm',
      aff: 6,
      resp: 1,
      trust: 2,
      risk: 0.04,
      energy: 0,
      win: 'They laugh, actually laugh, and tell you a story that takes four minutes.',
      lose: 'They answer the first half of the question and let the rest die.',
    },
    {
      id: 'b',
      label: '“Long enough to know the drinks are overpriced.”',
      tone: 'sharp',
      aff: 3,
      resp: 4,
      trust: 1,
      risk: 0.14,
      energy: 0,
      win: 'A dry nod. “You will fit in fine.”',
      lose: 'The joke lands wrong. They check their phone.',
    },
    {
      id: 'c',
      label: '“I know who you are. I did not want to say it weirdly.”',
      tone: 'bold',
      aff: 4,
      resp: 3,
      trust: 3,
      risk: 0.22,
      energy: 0,
      win: '“Better that than another person pretending they found me by accident.”',
      lose: '“That is a strange thing to open with.”',
    },
  ],
  work: [
    {
      id: 'a',
      label: '“The low end is flat because I mixed it myself at three in the morning.”',
      tone: 'warm',
      aff: 4,
      resp: 9,
      trust: 4,
      risk: 0.06,
      energy: 0,
      win: 'They respect the honesty and start actually teaching you something.',
      lose: '“Then stop doing that.” The conversation is over.',
    },
    {
      id: 'b',
      label: '“Tell me what you would do to it. I will do it.”',
      tone: 'sharp',
      aff: 2,
      resp: 11,
      trust: 5,
      risk: 0.18,
      energy: 0,
      win: 'They pull out a phone and play you three references. You take notes.',
      lose: '“You want a free lesson? Everybody does.”',
    },
    {
      id: 'c',
      label: '“The record is the record. I am not changing it for a room like this.”',
      tone: 'bold',
      aff: -2,
      resp: 12,
      trust: -1,
      risk: 0.34,
      energy: 0,
      win: '“Arrogant. Correct, maybe. Arrogant.” They are still talking to you.',
      lose: '“Right. Good luck with that.” They turn away mid-sentence.',
    },
  ],
  scene: [
    {
      id: 'a',
      label: '“Who else is going to get burned in that deal?”',
      tone: 'sharp',
      aff: 5,
      resp: 2,
      trust: 3,
      risk: 0.16,
      energy: 2,
      win: 'They trade you something real. You now know where the money is going.',
      lose: '“That is not a question you ask someone you just met.”',
    },
    {
      id: 'b',
      label: 'Swap a rumour of your own for one of theirs.',
      tone: 'warm',
      aff: 7,
      resp: 1,
      trust: -3,
      risk: 0.26,
      energy: 2,
      win: 'They lean in. You are now a source. Sources hear things.',
      lose: 'Whatever you said gets retold tonight with your name attached.',
    },
    {
      id: 'c',
      label: '“I do not trade gossip. I listen.”',
      tone: 'bold',
      aff: 1,
      resp: 6,
      trust: 7,
      risk: 0.08,
      energy: 1,
      win: '“Smart. People talk to people who can keep their mouth shut.”',
      lose: '“Suit yourself.” The booth empties out and you are in it alone.',
    },
  ],
  personal: [
    {
      id: 'a',
      label: '“Mine thinks I am unemployed. It is going great.”',
      tone: 'warm',
      aff: 8,
      resp: 1,
      trust: 6,
      risk: 0.06,
      energy: 1,
      win: 'They tell you something they clearly do not tell people. The room gets quieter.',
      lose: 'A polite laugh. The wall goes back up.',
    },
    {
      id: 'b',
      label: '“Why do you still do it, then?”',
      tone: 'sharp',
      aff: 5,
      resp: 5,
      trust: 8,
      risk: 0.18,
      energy: 1,
      win: 'A long pause, then an answer that is honest. You gained something.',
      lose: '“That is a big question for a Tuesday.” They leave it there.',
    },
    {
      id: 'c',
      label: 'Tell them the truth about your own year.',
      tone: 'warm',
      aff: 11,
      resp: 0,
      trust: 9,
      risk: 0.3,
      energy: 2,
      win: 'They recognise it. Whatever this becomes, it is not nothing.',
      lose: 'You said too much to somebody who did not ask.',
    },
  ],
  flirt: [
    {
      id: 'a',
      label: 'Hold the eye contact. Say nothing for a second.',
      tone: 'bold',
      aff: 10,
      resp: 0,
      trust: 2,
      risk: 0.3,
      energy: 1,
      win: '“Okay. That was smoother than it had any right to be.”',
      lose: '“Right. I am going to go get a drink.”',
    },
    {
      id: 'b',
      label: '“I am told I am trouble. It may have been me telling people.”',
      tone: 'warm',
      aff: 7,
      resp: 1,
      trust: 1,
      risk: 0.16,
      energy: 0,
      win: 'They smile into their glass. “At least you are honest about it.”',
      lose: '“I have heard that line from four people this month.”',
    },
    {
      id: 'c',
      label: '“This is the part where I ask if you are seeing anyone.”',
      tone: 'bold',
      aff: 6,
      resp: -2,
      trust: 0,
      risk: 0.42,
      energy: 1,
      win: '“Bold. I will allow it.”',
      lose: '“And this is the part where I say I am working.”',
    },
  ],
  pitch: [
    {
      id: 'a',
      label: 'Give them the numbers. Streams, rooms, the plan.',
      tone: 'sharp',
      aff: 2,
      resp: 9,
      trust: 5,
      risk: 0.1,
      energy: 2,
      win: 'They write something down. “Send it Monday.”',
      lose: '“Your numbers are not numbers yet.”',
    },
    {
      id: 'b',
      label: 'Play them the record, right here, no context.',
      tone: 'warm',
      aff: 6,
      resp: 7,
      trust: 4,
      risk: 0.24,
      energy: 3,
      win: 'They listen to the whole thing. All the way through. That never happens.',
      lose: 'They listen to forty seconds and hand the phone back.',
    },
    {
      id: 'c',
      label: '“I am not asking for a favour. I am asking what it would take.”',
      tone: 'bold',
      aff: 1,
      resp: 12,
      trust: 4,
      risk: 0.28,
      energy: 2,
      win: '“Finally, somebody who understands how this works.”',
      lose: '“What it would take is somebody more established.”',
    },
  ],
}

export const TOPIC_INFO: Record<TopicId, { name: string; emoji: string; blurb: string }> = {
  small: { name: 'Small talk', emoji: '💬', blurb: 'Safe. Warms nothing but the surface.' },
  work: { name: 'Talk shop', emoji: '🎚️', blurb: 'Builds respect. Craft, opinions, arguments.' },
  scene: { name: 'Work the room', emoji: '👂', blurb: 'Gossip and information. Risky for your name.' },
  personal: { name: 'Get personal', emoji: '🫱', blurb: 'Real conversation. Big trust, big risk.' },
  flirt: { name: 'Flirt', emoji: '🔥', blurb: 'Only if they have given you something to work with.' },
  pitch: { name: 'Pitch them', emoji: '📋', blurb: 'Ask for something concrete. Respect does the talking.' },
}

export function favorRequirements(p: Person) {
  const role = p.role
  const base: Record<RoleId, { aff: number; resp: number; trust: number }> = {
    producer: { aff: 32, resp: 26, trust: 14 },
    songwriter: { aff: 36, resp: 22, trust: 16 },
    dj: { aff: 40, resp: 30, trust: 18 },
    curator: { aff: 40, resp: 26, trust: 20 },
    journalist: { aff: 28, resp: 22, trust: 28 },
    ar: { aff: 38, resp: 40, trust: 22 },
    promoter: { aff: 28, resp: 22, trust: 16 },
    manager: { aff: 50, resp: 36, trust: 34 },
    artist: { aff: 26, resp: 16, trust: 12 },
    director: { aff: 32, resp: 22, trust: 16 },
  }
  const r = base[role]
  return {
    aff: r.aff + p.tier * 2,
    resp: r.resp + p.tier * 1.5,
    trust: r.trust + p.tier * 1.5,
  }
}

const FAVOR_REQS: Record<RoleId, { aff: number; resp: number; trust: number }> = {
  producer: { aff: 32, resp: 26, trust: 14 },
  songwriter: { aff: 36, resp: 22, trust: 16 },
  dj: { aff: 40, resp: 30, trust: 18 },
  curator: { aff: 40, resp: 26, trust: 20 },
  journalist: { aff: 28, resp: 22, trust: 28 },
  ar: { aff: 38, resp: 40, trust: 22 },
  promoter: { aff: 28, resp: 22, trust: 16 },
  manager: { aff: 50, resp: 36, trust: 34 },
  artist: { aff: 26, resp: 16, trust: 12 },
  director: { aff: 32, resp: 22, trust: 16 },
}

export function canAskFavor(p: Person): { ok: boolean; reason: string; req: { aff: number; resp: number; trust: number } } {
  const base = FAVOR_REQS[p.role]
  // every favour you have already called in makes the next one harder to ask for
  const req = {
    aff: base.aff + p.favors * 13 + p.tier * 2,
    resp: base.resp + p.favors * 7,
    trust: base.trust + p.favors * 9 + p.tier * 1.5,
  }
  if (p.affinity < req.aff) return { ok: false, reason: `needs ${Math.round(req.aff)} affinity`, req }
  if (p.respect < req.resp) return { ok: false, reason: `needs ${Math.round(req.resp)} respect`, req }
  if (p.trust < req.trust) return { ok: false, reason: `needs ${Math.round(req.trust)} trust`, req }
  if (p.patience < 20) return { ok: false, reason: 'they are out of patience with you', req }
  if (p.favorsThisWeek > 0) return { ok: false, reason: 'you already cashed in this week', req }
  if (p.grudge > 50) return { ok: false, reason: 'they have not forgiven you for something', req }
  return { ok: true, reason: '', req }
}

export function replyModifiers(p: Person, topic: TopicId, reply: Reply) {
  let affMul = 1
  let respMul = 1
  let trustMul = 1
  let riskAdd = 0
  if (p.traits.includes('snob')) {
    if (topic === 'small') {
      affMul *= 0.45
      respMul *= 0.5
    }
    if (topic === 'work') respMul *= 1.4
  }
  if (p.traits.includes('gossip') && topic === 'scene') affMul *= 1.35
  if (p.traits.includes('flirt') && (topic === 'flirt' || topic === 'personal')) affMul *= 1.3
  if (p.traits.includes('ruthless')) {
    if (reply.tone === 'bold') respMul *= 1.45
    if (reply.tone === 'warm') respMul *= 0.65
  }
  if (p.traits.includes('loyal') && topic === 'personal') trustMul *= 1.5
  if (p.traits.includes('volatile')) riskAdd += 0.13
  if (p.traits.includes('greedy') && topic === 'pitch') riskAdd += 0.1
  return { affMul, respMul, trustMul, riskAdd }
}

export function replyOdds(p: Person, topic: TopicId, reply: Reply, skill: number): number {
  const { riskAdd } = replyModifiers(p, topic, reply)
  const raw =
    0.6 + skill / 380 + p.affinity / 520 - reply.risk - riskAdd + (topic === 'pitch' ? p.respect / 400 : 0)
  return Math.max(0.07, Math.min(0.97, raw))
}

export function oddsLabel(pct: number): { label: string; color: string } {
  if (pct >= 0.78) return { label: 'Safe', color: '#4ade80' }
  if (pct >= 0.58) return { label: 'Fair', color: '#a3e635' }
  if (pct >= 0.38) return { label: 'Risky', color: '#fbbf24' }
  return { label: 'Long shot', color: '#f87171' }
}

export function topicUnlocked(p: Person, topic: TopicId): { ok: boolean; why: string } {
  switch (topic) {
    case 'flirt':
      return p.affinity >= 15
        ? { ok: true, why: '' }
        : { ok: false, why: 'needs 15 affinity' }
    case 'personal':
      return p.affinity >= 5 ? { ok: true, why: '' } : { ok: false, why: 'needs 5 affinity' }
    case 'pitch':
      return p.respect >= 20 || p.affinity >= 35
        ? { ok: true, why: '' }
        : { ok: false, why: 'needs 20 respect' }
    default:
      return { ok: true, why: '' }
  }
}

export function topTraits(p: Person, n = 2): TraitDef[] {
  return p.traits.slice(0, n).map((t) => TRAITS.find((x) => x.id === t)!).filter(Boolean)
}
