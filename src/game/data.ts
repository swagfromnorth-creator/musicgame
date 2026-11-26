import type { GigDef, PromoTier, SkillId, StudioDef } from './types'

// ---------------------------------------------------------------------------
// Tunables — one place, so balancing is not a scavenger hunt.
// ---------------------------------------------------------------------------
export const TUNE = {
  writeBaseMs: 90_000, // 1:30 with no skills at all
  rhythmSpeedCut: 0.5, // rhythm 100 → half the writing time
  songwritingSpeedCut: 0.2, // songwriting 100 → another 20% off
  qualityBase: 14,
  qualityPerSkill: 0.62,
  qualityPerStudio: 8,
  trainBaseMs: 10_000,
  trainGrowth: 1.045, // level 50 ≈ 1:30, level 90 ≈ 6 min
  maxSkill: 100,
  fanPerStream: 0.045,
  dollarsPerStream: 0.006,
  jobRefreshMs: 80_000,
  jobSlots: 3,
  jobQueueSlots: 1,
  offlineCapMs: 8 * 60 * 60 * 1000,
  promoMs: 5 * 60 * 1000,
  promoCostBase: 400,
  promoMult: 2,
  boostMs: 120_000,
  boostMult: 1.6,
}

export const SKILLS: { id: SkillId; name: string; emoji: string; blurb: string }[] = [
  { id: 'songwriting', name: 'Songwriting', emoji: '✍️', blurb: 'Better numbers on every song you finish.' },
  { id: 'rhythm', name: 'Rhythm', emoji: '🥁', blurb: 'You finish songs faster.' },
  { id: 'virality', name: 'Virality', emoji: '📡', blurb: 'Every release reaches further and lasts longer.' },
]

/** Rooms are rented by the session. The fee comes out of your pocket every time. */
export const STUDIOS: StudioDef[] = [
  { name: 'Bedroom', cost: 0, quality: 0, blurb: 'A laptop and a duvet over the mic. Free, forever.' },
  { name: 'Rehearsal Room', cost: 80, quality: 8, blurb: 'Moved the dryer out. It echoes less.' },
  { name: 'Project Studio', cost: 300, quality: 16, blurb: 'Real monitors, an engineer who cares.' },
  { name: 'Pro Room', cost: 1_000, quality: 26, blurb: 'Outboard gear older than you are.' },
  { name: 'Iconic Room', cost: 4_000, quality: 38, blurb: 'Gold records on the wall of the bathroom.' },
  { name: 'The Big One', cost: 15_000, quality: 52, blurb: 'They schedule you six months out.' },
]

/** Paying creators to put a record in front of more people. Charged on release. */
export const PROMO_TIERS: PromoTier[] = [
  { name: 'No push', cost: 0, reach: 0, blurb: 'It goes out as it is.' },
  { name: 'Local push', cost: 150, reach: 8, blurb: 'A few blogs, a couple of playlists.' },
  { name: 'Regional push', cost: 1_200, reach: 24, blurb: 'Radio pluggers and a playlist run.' },
  { name: 'National push', cost: 9_000, reach: 60, blurb: 'Billboards, a TV slot, a press day.' },
  { name: 'Global blitz', cost: 75_000, reach: 150, blurb: 'Everywhere at once, all at the same time.' },
]

export const GIGS: GigDef[] = [
  { id: 'open-mic', name: 'Open Mic', emoji: '🎤', fansNeeded: 0, pay: 15, fans: 3, cooldownMs: 20_000, blurb: 'Ten minutes, six people, two of them your friends.' },
  { id: 'club', name: 'Club Night', emoji: '🍸', fansNeeded: 40, pay: 70, fans: 10, cooldownMs: 30_000, blurb: 'A proper slot. The door takes the bar money.' },
  { id: 'support', name: 'Support Slot', emoji: '🎫', fansNeeded: 400, pay: 350, fans: 45, cooldownMs: 45_000, blurb: 'You open for someone with a bus.' },
  { id: 'theatre', name: 'Theatre Show', emoji: '🎭', fansNeeded: 4_000, pay: 1_800, fans: 220, cooldownMs: 60_000, blurb: 'Seated, lit, and people paid attention.' },
  { id: 'festival', name: 'Festival', emoji: '🎪', fansNeeded: 40_000, pay: 9_000, fans: 900, cooldownMs: 90_000, blurb: 'Afternoon slot, 4pm sun, 30,000 strangers.' },
  { id: 'arena', name: 'Arena Night', emoji: '🏟️', fansNeeded: 400_000, pay: 60_000, fans: 4_000, cooldownMs: 120_000, blurb: 'The roof is closed and it is still loud.' },
]

/**
 * Work is tiered by audience. Nobody hands a session gig to an unknown, and
 * nobody offers a sync licence to somebody with forty followers.
 */
export interface JobTier {
  fansNeeded: number
  pay: [number, number]
  seconds: [number, number]
  pool: { title: string; emoji: string }[]
}

export const JOB_TIERS: JobTier[] = [
  {
    fansNeeded: 0,
    pay: [14, 60],
    seconds: [20, 45],
    pool: [
      { title: 'Barista', emoji: '☕' },
      { title: 'Courier', emoji: '🚲' },
      { title: 'Retail Floor', emoji: '🛍️' },
      { title: 'Warehouse', emoji: '📦' },
      { title: 'Flyer Handout', emoji: '📄' },
    ],
  },
  {
    fansNeeded: 500,
    pay: [70, 260],
    seconds: [30, 65],
    pool: [
      { title: 'Session Player', emoji: '🎸' },
      { title: 'Wedding Band', emoji: '💒' },
      { title: 'Bar Shift', emoji: '🍺' },
      { title: 'Rideshare', emoji: '🚗' },
      { title: 'Music Tutor', emoji: '📚' },
    ],
  },
  {
    fansNeeded: 5_000,
    pay: [400, 1_400],
    seconds: [45, 95],
    pool: [
      { title: 'Studio Session', emoji: '🎛️' },
      { title: 'Ad Jingle', emoji: '🎵' },
      { title: 'Club Residency', emoji: '🎧' },
      { title: 'Corporate Gig', emoji: '💼' },
    ],
  },
  {
    fansNeeded: 50_000,
    pay: [2_500, 9_000],
    seconds: [60, 150],
    pool: [
      { title: 'Brand Deal', emoji: '🤝' },
      { title: 'Sync Licence', emoji: '🎬' },
      { title: 'Feature Verse', emoji: '🎤' },
      { title: 'Appearance Fee', emoji: '🎪' },
    ],
  },
]

const A = ['Neon', 'Static', 'Golden', 'Broken', 'Slow', 'Paper', 'Midnight', 'Ultra', 'Silver', 'Hollow', 'Electric', 'Loose', 'Cheap', 'Vacant', 'Summer', 'Fever', 'Glass', 'Bad']
const B = ['Halo', 'Weather', 'Motion', 'Hours', 'Signal', 'Machine', 'Habit', 'Rooftop', 'Promise', 'Getaway', 'Lullaby', 'Frequency', 'Borrowed Time', 'Ghost', 'Holiday', 'Sundown', 'Riot', 'Lover']

export function randomTitle(): string {
  return `${A[(Math.random() * A.length) | 0]} ${B[(Math.random() * B.length) | 0]}`
}

export function money(n: number): string {
  const v = Math.round(n)
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
  if (v >= 10_000) return `$${(v / 1_000).toFixed(1)}k`
  return `$${v.toLocaleString('en-US')}`
}

export function num(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`
  return Math.round(n).toLocaleString('en-US')
}

export function duration(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
