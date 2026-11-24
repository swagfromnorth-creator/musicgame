import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
})
const g = globalThis as any
g.window = dom.window
g.document = dom.window.document
Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true })
g.HTMLElement = dom.window.HTMLElement
g.Element = dom.window.Element
g.Node = dom.window.Node
g.Event = dom.window.Event
g.MouseEvent = dom.window.MouseEvent
g.getComputedStyle = dom.window.getComputedStyle
Object.defineProperty(g, 'localStorage', { value: dom.window.localStorage, configurable: true })
g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 16)
g.cancelAnimationFrame = (id: any) => clearTimeout(id)
g.IS_REACT_ACT_ENVIRONMENT = true

const errors: string[] = []
const origError = console.error
console.error = (...args: any[]) => {
  const msg = args.map(String).join(' ')
  errors.push(msg)
  origError('CONSOLE.ERROR:', msg.slice(0, 400))
}

async function main() {
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const { act } = await import('react-dom/test-utils')
  const { initialState, advance, fameOf } = await import('../src/game/engine')
  const App = (await import('../src/App')).default

  let s = initialState({
    artistName: 'Nova Vale',
    genre: 'pop',
    origin: 'Bedroom producer in a shared flat',
    hue: 330,
    portrait: { skin: 2, hair: 0, hairColor: 3, eyes: 1, outfit: 0, accessory: 2, hairStyle: 1 },
  })
  s = advance(s, 400)
  // give a catalog + album + assets + offers + awards for coverage
  s.money = 5_000_000
  s.followers = 240_000
  s.listeners = 300_000
  // seed a catalog
  const mk = (t: string, q: number, rel: boolean, i: number) => ({
    id: 'song' + i, title: t, genre: s.genre, mood: 'anthem' as const, style: 'hooky' as const,
    quality: q, released: rel, releaseHour: rel ? s.hour - 100 : null, releaseWeek: rel ? s.week - 1 : null,
    albumId: null, isDiss: i === 2, targetRivalId: null, streams: rel ? 120000 * (i + 1) : 0,
    streamsThisWeek: rel ? 40000 * (i + 1) : 0, streamsLastHour: rel ? 300 * (i + 1) : 0, hype: 20, peak: rel ? 5 + i : 0,
    video: (i === 0 ? 'concept' : 'none') as any, playlistTier: i === 1 ? 2 : 0, dead: false, hue: 330 + i * 12,
    producer: 'Self-Produced', writeCost: 0, featureId: null,
  })
  s.songs = [mk('Neon Halo', 78, true, 0), mk('Slow Weather', 64, true, 1), mk('Facts Only', 55, true, 2), mk('Unreleased Demo', 41, false, 3), mk('Vault Two', 67, false, 4), mk('Vault Three', 51, false, 5)]
  s.albums = [{ id: 'alb1', title: 'Paper Kingdom', songIds: ['song0', 'song1'], released: true, releaseWeek: s.week - 2, quality: 71, streams: 900000, streamsThisWeek: 210000, peak: 12, hue: 300 },
              { id: 'alb2', title: 'Draft Record', songIds: ['song4', 'song5', 'song3'], released: false, releaseWeek: null, quality: 55, streams: 0, streamsThisWeek: 0, peak: 0, hue: 20 }]
  s.offers = [{ id: 'off1', name: 'Vanta Group', advance: 240000, royalty: 0.44, albums: 2, weeks: 104, prestige: 3, push: 1.55 }]
  s.awards = [{ id: 'aw1', week: 13, category: 'Single of the Season', won: true, songTitle: 'Neon Halo', rivalName: null, year: 1 },
              { id: 'aw2', week: 26, category: 'Best Song', won: false, songTitle: 'Neon Halo', rivalName: 'Rook Sato', year: 1 }]
  s.label = { labelId: 'l1', name: 'Rosewood Records', advance: 90000, royalty: 0.42, albumsRemaining: 2, albumsDelivered: 1, weeksLeft: 88, push: 1.3, prestige: 2, signedWeek: 4, mastersOwned: false }
  s.assets = ['chain', 'watch']
  s.videos = [{ songId: 'song0', kind: 'lyric', hoursLeft: 12, totalHours: 24, cost: 900 }]
  s.tour = { name: 'Theatre Run', city: 'Tokyo', nightsLeft: 6, totalNight: undefined as any, totalNights: 14, payoutPerNight: 4000, fansPerNight: 600, energyPerNight: 2.2, nextNightHour: s.hour + 5 } as any
  s.pending = { title: 'Gold Fever', genre: s.genre, mood: 'club', style: 'vibe', quality: 83, producer: 'Elite Producer', cost: 8000, featureId: null, isDiss: false, targetRivalId: null }
  s.skills = { songwriting: 62, vocals: 55, performance: 44, production: 51, charisma: 70 }
  dom.window.localStorage.setItem('starmaker.save.v1', JSON.stringify(s))

  const root = createRoot(document.getElementById('root')!)
  await act(async () => {
    root.render(React.createElement(App))
  })
  await new Promise((r) => setTimeout(r, 300))
  await act(async () => {})
  const text = document.body.textContent || ''
  console.log('MOUNT TEXT LEN', text.length)
  console.log('has artist?', text.includes('Nova Vale'))
  console.log('has whispers?', /This Week|Hot 100/.test(text))

  // click every nav button
  const buttons = Array.from(document.querySelectorAll('nav button')) as any[]
  console.log('nav buttons', buttons.length)
  for (const b of buttons) {
    await act(async () => {
      b.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    await new Promise((r) => setTimeout(r, 30))
    await act(async () => {})
    const t = document.body.textContent || ''
    console.log('tab', (b.textContent || '').trim(), '→', t.length, 'chars')
  }

  // open a song detail sheet from the Studio tab
  const tabBtns = Array.from(document.querySelectorAll('nav button')) as any[]
  const studio = tabBtns.find((b) => (b.textContent || '').includes('Studio'))
  await act(async () => { studio.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
  await new Promise((r) => setTimeout(r, 30))
  const rows = Array.from(document.querySelectorAll('.list-row.tap')) as any[]
  console.log('studio rows', rows.length)
  if (rows[0]) {
    await act(async () => { rows[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
    await new Promise((r) => setTimeout(r, 30))
    console.log('sheet open?', !!document.querySelector('.sheet'), (document.querySelector('.sheet')?.textContent || '').slice(0, 80))
  }
  // open the write sheet
  const newSong = Array.from(document.querySelectorAll('button')).find((b: any) => (b.textContent || '').includes('New Song')) as any
  if (newSong) {
    await act(async () => { newSong.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })) })
    await new Promise((r) => setTimeout(r, 30))
    console.log('write sheet?', (document.querySelector('.sheet')?.textContent || '').slice(0, 100))
    // click the record button
    const rec = Array.from(document.querySelectorAll('button')).find((b: any) => (b.textContent || '').includes('Record the session')) as any
    console.log('record btn?', !!rec, rec?.disabled)
  }
  console.log('ERRORS:', errors.length)
  process.exit(0)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
