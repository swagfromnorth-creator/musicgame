import type { GigDef, StudioDef } from './types'

// ---------------------------------------------------------------------------
// Tunables — one place, so balancing is not a scavenger hunt.
// ---------------------------------------------------------------------------
export const TUNE = {
  writeBaseMs: 90_000, // 1:30 at zero skill
  writeSpeedCut: 0.55, // max skill → writing takes 45% of base (1:30 → 0:40)
  qualityBase: 16,
  qualityPerSkill: 0.55,
  qualityPerStudio: 8,
  fanPerStream: 0.045,
  dollarsPerStream: 0.006,
  jobRefreshMs: 80_000,
  jobSlots: 3,
  offlineCapMs: 8 * 60 * 60 * 1000,
  promoCappedMs: 5 * 60 * 1000,
  promoMs: 5 * 60 * 1000,
  promoCostBase: 400,
  boostMs: 120_000,
  boostMult: 1.6,
  promoMult: 2,
}

export const STUDIOS: StudioDef[] = [
  { name: 'Bedroom', cost: 0, quality: 0, blurb: 'A laptop and a duvet over the mic.' },
  { name: 'Rehearsal Room', cost: 300, quality: 8, blurb: 'Moved the dryer out. It echoes less.' },
  { name: 'Project Studio', cost: 2_000, quality: 16, blurb: 'Real monitors, an engineer who cares.' },
  { name: 'Pro Room', cost: 12_000, quality: 24, blurb: 'Outboard gear older than you are.' },
  { name: 'Iconic Room', cost: 60_000, quality: 32, blurb: 'Gold records on the wall of the bathroom.' },
  { name: 'The Big One', cost: 250_000, quality: 40, blurb: 'They schedule you six months out.' },
]

export const GIGS: GigDef[] = [
  { id: 'open-mic', name: 'Open Mic', emoji: '🎤', fansNeeded: 0, pay: 15, fans: 3, cooldownMs: 20_000, blurb: 'Ten minutes, six people, two of them your friends.' },
  { id: 'club', name: 'Club Night', emoji: '🍸', fansNeeded: 40, pay: 70, fans: 10, cooldownMs: 30_000, blurb: 'A proper slot. The door takes the bar money.' },
  { id: 'support', name: 'Support Slot', emoji: '🎫', fansNeeded: 400, pay: 350, fans: 45, cooldownMs: 45_000, blurb: 'You open for someone with a bus.' },
  { id: 'theatre', name: 'Theatre Show', emoji: '🎭', fansNeeded: 4_000, pay: 1_800, fans: 220, cooldownMs: 60_000, blurb: 'Seated, lit, and people paid attention.' },
  { id: 'festival', name: 'Festival', emoji: '🎪', fansNeeded: 40_000, pay: 9_000, fans: 900, cooldownMs: 90_000, blurb: 'Afternoon slot, 4pm sun, 30,000 strangers.' },
  { id: 'arena', name: 'Arena Night', emoji: '🏟️', fansNeeded: 400_000, pay: 60_000, fans: 4_000, cooldownMs: 120_000, blurb: 'The roof is closed and it is still loud.' },
]

export const JOBS: { title: string; emoji: string }[] = [
  { title: 'Barista', emoji: '☕' },
  { title: 'Bar Back', emoji: '🍺' },
  { title: 'Warehouse', emoji: '📦' },
  { title: 'Courier', emoji: '🚲' },
  { title: 'Line Cook', emoji: '🍳' },
  { title: 'Retail Floor', emoji: '🛍️' },
  { title: 'Security', emoji: '🦺' },
  { title: 'Tutor', emoji: '📚' },
  { title: 'Cleaner', emoji: '🧽' },
  { title: 'Studio Intern', emoji: '🎛️' },
  { title: 'Rideshare', emoji: '🚗' },
  { title: 'Flyer Handout', emoji: '📄' },
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
