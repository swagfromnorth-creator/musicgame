import type {
  ActivityId,
  GenreId,
  MoodId,
  SkillKey,
  StyleId,
} from './types'

export interface GenreDef {
  id: GenreId
  name: string
  emoji: string
  hue: number
  /** baseline mainstream appeal 0.85 - 1.15 */
  reach: number
  /** how much chart success compounds */
  volatility: number
  blurb: string
}

export const GENRES: GenreDef[] = [
  { id: 'pop', name: 'Pop', emoji: '✨', hue: 330, reach: 1.15, volatility: 1.0, blurb: 'Maximum reach, maximum pressure. The whole world is watching.' },
  { id: 'hiphop', name: 'Hip-Hop', emoji: '🎤', hue: 24, reach: 1.12, volatility: 1.25, blurb: 'Streaming giants. Beef sells records here more than anywhere.' },
  { id: 'rnb', name: 'R&B', emoji: '🌙', hue: 268, reach: 1.0, volatility: 0.9, blurb: 'Slow burns and long careers. Loyal listeners, deep catalogs.' },
  { id: 'rock', name: 'Rock', emoji: '🎸', hue: 8, reach: 1.02, volatility: 1.15, blurb: 'Sell the tickets, not just the streams. Festivals love you.' },
  { id: 'country', name: 'Country', emoji: '🤠', hue: 40, reach: 0.98, volatility: 0.85, blurb: 'Enormous radio loyalty. Play the long game and never leave.' },
  { id: 'edm', name: 'EDM', emoji: '🔊', hue: 190, reach: 1.05, volatility: 1.2, blurb: 'Festival main stages and playlist ubiquity. Huge spikes.' },
  { id: 'latin', name: 'Latin', emoji: '💃', hue: 350, reach: 1.1, volatility: 1.1, blurb: 'Global crossover potential. A hit here travels everywhere.' },
  { id: 'kpop', name: 'K-Pop', emoji: '🌸', hue: 310, reach: 1.08, volatility: 1.3, blurb: 'Devoted fandoms that stream on loop. Fragile public image.' },
  { id: 'metal', name: 'Metal', emoji: '🤘', hue: 220, reach: 0.88, volatility: 1.0, blurb: 'Smaller numbers, ferocious loyalty. Nobody buys more merch.' },
  { id: 'jazz', name: 'Jazz', emoji: '🎷', hue: 168, reach: 0.85, volatility: 0.7, blurb: 'Critics adore you. Critics do not buy private jets.' },
]

export const MOODS: { id: MoodId; name: string; emoji: string; blurb: string }[] = [
  { id: 'anthem', name: 'Anthem', emoji: '🔥', blurb: 'Stadium-sized, crowd-sung, designed for the big moment.' },
  { id: 'heartbreak', name: 'Heartbreak', emoji: '💔', blurb: 'The most-streamed emotion in music. Sells forever.' },
  { id: 'club', name: 'Club', emoji: '🪩', blurb: 'Playlist bait. Spikes hard, works the radio dial.' },
  { id: 'introspective', name: 'Introspective', emoji: '🕯️', blurb: 'Critic bait. Lower ceiling, deeper respect.' },
  { id: 'rebel', name: 'Rebel', emoji: '⚡', blurb: 'Controversy in a can. Great for beef, risky for brands.' },
]

export const STYLES: { id: StyleId; name: string; emoji: string; blurb: string; uses: SkillKey[] }[] = [
  { id: 'hooky', name: 'Hook-First', emoji: '🪝', blurb: 'Trim the fat, repeat the chorus. Charisma carries it.', uses: ['charisma', 'vocals'] },
  { id: 'deep', name: 'Deep Cut', emoji: '📖', blurb: 'Structure, story, craft. Songwriting carries it.', uses: ['songwriting', 'production'] },
  { id: 'vibe', name: 'Vibe', emoji: '🌊', blurb: 'Texture and groove over lyrics. Production carries it.', uses: ['production', 'vocals'] },
]

export interface ProducerDef {
  id: string
  name: string
  cost: number
  bonus: number
  blurb: string
}

export const PRODUCERS: ProducerDef[] = [
  { id: 'self', name: 'Self-Produced', cost: 0, bonus: 2, blurb: 'Just you and a laptop at 3am.' },
  { id: 'local', name: 'Local Sessions', cost: 120, bonus: 8, blurb: 'Cheap room, solid engineer, no opinions.' },
  { id: 'mid', name: 'Hired Gun', cost: 900, bonus: 16, blurb: 'Has three platinum plaques and no small talk.' },
  { id: 'elite', name: 'Elite Producer', cost: 6500, bonus: 24, blurb: 'Every label wants their name on the credits.' },
  { id: 'legend', name: 'Legendary Producer', cost: 40000, bonus: 32, blurb: 'One phone call. Retired. Comes back for you.' },
]

export interface AssetDef {
  id: string
  name: string
  cost: number
  type: 'watch' | 'car' | 'home' | 'jet' | 'yacht' | 'lifestyle'
  fame: number
  blurb: string
  emoji: string
}

export const ASSETS: AssetDef[] = [
  { id: 'chain', name: 'Diamond Chain', cost: 8500, type: 'lifestyle', fame: 2, blurb: 'Sits heavy. Photographs well.', emoji: '💎' },
  { id: 'watch', name: 'Rare Watch', cost: 26000, type: 'watch', fame: 4, blurb: 'Appreciates in value and in conversation.', emoji: '⌚' },
  { id: 'coupe', name: 'German Coupe', cost: 90000, type: 'car', fame: 7, blurb: 'The first purchase that scares your accountant.', emoji: '🏎️' },
  { id: 'condo', name: 'Downtown Condo', cost: 320000, type: 'home', fame: 10, blurb: 'Floor-to-ceiling windows. Zero storage.', emoji: '🏙️' },
  { id: 'gallery', name: 'Art Collection', cost: 700000, type: 'lifestyle', fame: 12, blurb: 'Culture capital. Critics start calling you serious.', emoji: '🖼️' },
  { id: 'hillhouse', name: 'Hillside Estate', cost: 1600000, type: 'home', fame: 16, blurb: 'Gate code. Guest wing. Staff that never gossip.', emoji: '🏡' },
  { id: 'label', name: 'Boutique Label', cost: 2800000, type: 'lifestyle', fame: 20, blurb: 'Sign other artists. Collect a slice of their run.', emoji: '🏢' },
  { id: 'supercar', name: 'Hypercar', cost: 4500000, type: 'car', fame: 22, blurb: 'Loud in every sense. The algorithm loves it.', emoji: '🚗' },
  { id: 'jet', name: 'Private Jet', cost: 18000000, type: 'jet', fame: 30, blurb: 'Never claim a bag again. Tour logistics solved.', emoji: '✈️' },
  { id: 'yacht', name: 'Superyacht', cost: 42000000, type: 'yacht', fame: 34, blurb: 'Floats, costs money daily, photographs like a postcard.', emoji: '🛥️' },
  { id: 'island', name: 'Private Island', cost: 120000000, type: 'home', fame: 45, blurb: 'A dot on a map with your name on the deed.', emoji: '🏝️' },
  { id: 'estate', name: 'Royal Estate', cost: 400000000, type: 'home', fame: 60, blurb: 'Generational wealth. Literally: it has a museum wing.', emoji: '🏰' },
]

export interface ActivityDef {
  id: ActivityId
  name: string
  emoji: string
  cost: number
  energy: number
  skill?: SkillKey
  xp?: number
  followers?: number
  hype?: number
  health?: number
  money?: number
  blurb: string
  minFame?: number
  /** Hours before you can do this again. Real life has a calendar. */
  cooldown?: number
}

export const ACTIVITIES: ActivityDef[] = [
  { id: 'rest', name: 'Rest Day', emoji: '🛌', cost: 0, energy: 45, health: 6, blurb: 'Eat, sleep, silence the phone. Worth more than you think.' },
  { id: 'local-show', name: 'Local Show', emoji: '🎪', cost: 0, energy: -15, hype: 2, money: 120, blurb: 'A club, a cover charge, and a cut of the door. The oldest way to get paid.', cooldown: 26 },
  { id: 'gym', name: 'Trainer Session', emoji: '🏋️', cost: 150, energy: -8, health: 9, blurb: 'Looks good on camera. Adds years to the career.', cooldown: 20, skill: 'performance', xp: 3 },
  { id: 'vocal-coach', name: 'Vocal Coach', emoji: '🎙️', cost: 200, energy: -12, skill: 'vocals', xp: 11, blurb: 'Range, breath, stamina. Nobody hears the work, everybody hears the result.', cooldown: 16 },
  { id: 'writing-room', name: 'Writing Room', emoji: '✍️', cost: 180, energy: -12, skill: 'songwriting', xp: 11, blurb: 'Four hours, three notebooks, one great line.', cooldown: 16 },
  { id: 'producer-collab', name: 'Studio Time', emoji: '🎛️', cost: 350, energy: -14, skill: 'production', xp: 11, blurb: 'Learning the boards. Every engineer beams you something.', cooldown: 16 },
  { id: 'dance', name: 'Choreography', emoji: '💃', cost: 220, energy: -15, skill: 'performance', xp: 10, followers: 40, blurb: 'Clip it, post it, let the algorithm do the rest.', cooldown: 12 },
  { id: 'club-appearance', name: 'Club Appearance', emoji: '🍾', cost: 1250, energy: -18, hype: 5, followers: 500, health: -4, blurb: 'Paid to stand near a bottle. Somehow still networking.', cooldown: 40, minFame: 8 },
  { id: 'post-clip', name: 'Post a Clip', emoji: '📱', cost: 0, energy: -5, hype: 2, blurb: 'Fifteen seconds of the hook. The algorithm decides the rest.', cooldown: 8 },
  { id: 'go-live', name: 'Go Live', emoji: '🔴', cost: 0, energy: -12, hype: 4, blurb: 'Unfiltered, unedited, three hours of talking to your fans.', cooldown: 30, minFame: 3 },
]

export interface TourTier {
  tier: number
  name: string
  cities: number
  upfront: number
  payout: number
  fans: number
  fameNeeded: number
  blurb: string
  emoji: string
}

export const TOURS: TourTier[] = [
  { tier: 0, name: 'Van Tour', emoji: '🚐', cities: 8, upfront: 400, payout: 900, fans: 700, fameNeeded: 0, blurb: 'Eight clubs, one van, everybody shares the driving.' },
  { tier: 1, name: 'Theatre Run', emoji: '🎭', cities: 14, upfront: 3000, payout: 6200, fans: 5200, fameNeeded: 12, blurb: 'Seated rooms with actual dressing rooms.' },
  { tier: 2, name: 'Arena Tour', emoji: '🏟️', cities: 22, upfront: 24000, payout: 41000, fans: 38000, fameNeeded: 32, blurb: 'Load-in at 6am, 15,000 people at 9pm.' },
  { tier: 3, name: 'Stadium Tour', emoji: '🌍', cities: 30, upfront: 180000, payout: 360000, fans: 220000, fameNeeded: 55, blurb: 'The tour that defines a decade of your career.' },
  { tier: 4, name: 'Global Residency', emoji: '👑', cities: 40, upfront: 900000, payout: 2200000, fans: 900000, fameNeeded: 75, blurb: 'Every continent. Your own stage built in each city.' },
]

export const RADIO_TIERS = [
  { name: 'Off the Dial', cost: 0, mult: 1.0 },
  { name: 'College Radio', cost: 2500, mult: 1.18 },
  { name: 'Regional Top 40', cost: 22000, mult: 1.42 },
  { name: 'National Pop', cost: 140000, mult: 1.72 },
  { name: 'Satellite Rotation', cost: 800000, mult: 2.15 },
  { name: 'Cultural Monopoly', cost: 4200000, mult: 2.8 },
]

export const PLAYLIST_TIERS = [
  { name: 'Fresh Finds', cost: 900, mult: 1.2, blurb: 'A shot in the algorithm dark.' },
  { name: 'Genre Pulse', cost: 7000, mult: 1.5, blurb: 'Front page of your lane for a month.' },
  { name: 'Global Rotation', cost: 60000, mult: 2.0, blurb: 'Every gym, every car, every queue.' },
  { name: 'Cultural Moment', cost: 500000, mult: 2.8, blurb: 'You are no longer on playlists. You are the playlist.' },
]

export interface LabelDef {
  name: string
  prestige: number
  minFame: number
  push: number
  hue: number
  style: string
}

export const LABELS: LabelDef[] = [
  { name: 'Static Sound', prestige: 1, minFame: 4, push: 1.15, hue: 200, style: 'Indie distributor. Everything is "a conversation".' },
  { name: 'Rosewood Records', prestige: 2, minFame: 11, push: 1.3, hue: 340, style: 'Mid-tier pop shop with real radio relationships.' },
  { name: 'Vanta Group', prestige: 3, minFame: 24, push: 1.55, hue: 265, style: 'Data-first. They know your numbers before you do.' },
  { name: 'Crown Atlantic', prestige: 4, minFame: 40, push: 1.85, hue: 45, style: 'The biggest machine in the business. Read the fine print.' },
  { name: 'Meridian Music', prestige: 5, minFame: 62, push: 2.2, hue: 160, style: 'Legacy label. You do not sign with them; they acquire you.' },
]

export const SKILL_INFO: Record<SkillKey, { name: string; emoji: string; blurb: string; color: string }> = {
  songwriting: { name: 'Songwriting', emoji: '✍️', blurb: 'Raises the ceiling on song quality.', color: '#f5c451' },
  vocals: { name: 'Vocals', emoji: '🎙️', blurb: 'Sells the emotion. Adds streams on release.', color: '#ff5c8a' },
  performance: { name: 'Performance', emoji: '🎭', blurb: 'Tours, live shows, videos, stage presence.', color: '#8b5cf6' },
  production: { name: 'Production', emoji: '🎛️', blurb: 'Keeps you competitive without a producer.', color: '#38bdf8' },
  charisma: { name: 'Charisma', emoji: '🌟', blurb: 'Fans convert faster. Beef lands harder.', color: '#4ade80' },
}

export const ORIGINS = [
  'Bedroom producer in a shared flat',
  'Church choir, then nowhere, then everywhere',
  'Mall karaoke champion turned local legend',
  'Dropped out at 17 to chase it',
  'Session musician tired of other people’s hits',
  'TikTok fame that somehow refused to die',
  'Music school dropout with the best ear in the building',
  'Came up in the underground, all word of mouth',
  'Family band that outgrew the garage',
  'Radio intern who kept stealing studio hours',
]

// ---------------------------------------------------------------------------
// name + title generators
// ---------------------------------------------------------------------------

const FIRST = ['Nova', 'Kai', 'Rue', 'Juno', 'Ari', 'Sol', 'Mila', 'Zane', 'Ivy', 'Dez', 'Lux', 'Remy', 'Sage', 'Nico', 'Wren', 'Onyx', 'Cleo', 'Mars', 'Tia', 'Koa', 'Eli', 'Rin', 'Dax', 'Vera', 'Jules', 'Mick', 'Sana', 'Rook']
const LAST = ['Vale', 'Cross', 'Hale', 'Mercer', 'Rowe', 'Bright', 'Sloane', 'Kade', 'Renner', 'Okafor', 'Moreau', 'Sato', 'Delgado', 'Vance', 'Ashby', 'Nakamura', 'Rhodes', 'Bell', 'Cortez', 'Winter']
const TITLE_A = ['Neon', 'Gold', 'Static', 'Velvet', 'Concrete', 'Midnight', 'Paper', 'Silver', 'Electric', 'Hollow', 'Sugar', 'Crimson', 'Glass', 'Lucky', 'Wild', 'Last', 'Slow', 'Cold', 'Sweet', 'Bad']
const TITLE_B = ['Halo', 'Fever', 'Lie', 'Season', 'Mirage', 'Heart', 'Skyline', 'Riot', 'Promise', 'Weather', 'Diamond', 'Runaway', 'Slowdance', 'Afterglow', 'Saints', 'Machine', 'Garden', 'Speakers', 'Sunday', 'Vandal']
const RIVAL_TAGS = ['the hitmaker', 'the prodigy', 'the machine', 'the wildcard', 'the veteran', 'the new face', 'the internet’s own', 'the critic’s darling', 'the chart bully', 'the comeback']

export function randomName(): string {
  return `${pick(FIRST)} ${pick(LAST)}`
}

export function randomTitle(): string {
  const r = Math.random()
  if (r < 0.45) return `${pick(TITLE_A)} ${pick(TITLE_B)}`
  if (r < 0.7) return pick(TITLE_B)
  if (r < 0.85) return `${pick(TITLE_A)}${pick(['s', ''])}`
  return `${pick(TITLE_A)} ${pick(TITLE_B)} (${pick(['Reprise', 'Interlude', 'Pt. II', 'Extended'])}`
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function randomTag(): string {
  return pick(RIVAL_TAGS)
}

export const SKIN_TONES = ['#f5d6c3', '#e8bfa3', '#d6a17b', '#b87d52', '#8d5a35', '#63391f', '#3f2416']
export const HAIR_COLORS = ['#0c0c0e', '#2b1c14', '#6b3f21', '#a8692c', '#d9b26a', '#b83b5e', '#5b3fa8', '#1f8a70', '#d8d8dc', '#ff7ab8']
export const OUTFIT_COLORS = ['#ff2d78', '#8b5cf6', '#38bdf8', '#f5c451', '#4ade80', '#f87171', '#e5e7eb', '#111827']

export function ui(
  n: number,
  digits = 0,
): string {
  const abs = Math.abs(n)
  if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return (n / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (abs >= 1e4) return (n / 1e3).toFixed(1) + 'K'
  if (abs >= 1000) return (n / 1e3).toFixed(2) + 'K'
  return n.toFixed(digits).replace(/\.0+$/, '')
}

export function money(n: number): string {
  const abs = Math.abs(n)
  const s = abs >= 1e9 ? '$' + (abs / 1e9).toFixed(2) + 'B'
    : abs >= 1e6 ? '$' + (abs / 1e6).toFixed(2) + 'M'
    : abs >= 1e4 ? '$' + (abs / 1e3).toFixed(1) + 'K'
    : '$' + Math.round(abs).toLocaleString('en-US')
  return n < 0 ? '-' + s : s
}

export const FAME_TIERS = [
  { min: 0, name: 'Nobody' },
  { min: 5, name: 'Local Buzz' },
  { min: 14, name: 'Rising Star' },
  { min: 25, name: 'Breakout Act' },
  { min: 38, name: 'Chart Regular' },
  { min: 52, name: 'Superstar' },
  { min: 68, name: 'Global Icon' },
  { min: 84, name: 'Living Legend' },
]

export function fameTier(fame: number) {
  let out = FAME_TIERS[0]
  for (const t of FAME_TIERS) if (fame >= t.min) out = t
  const idx = FAME_TIERS.indexOf(out)
  const next = FAME_TIERS[idx + 1] ?? null
  return { name: out.name, next, progress: next ? (fame - out.min) / (next.min - out.min) : 1 }
}

export function moodNameOf(id: string): string {
  return MOODS.find((m) => m.id === id)?.name ?? id
}

export function styleNameOf(id: string): string {
  return STYLES.find((s) => s.id === id)?.name ?? id
}

export function genreNameOf(id: string): string {
  return GENRES.find((g) => g.id === id)?.name ?? id
}
