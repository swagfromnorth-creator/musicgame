// Headless smoke test.
//  1. save loading must never throw, whatever is in localStorage
//  2. a crash must render a readable panel, not a black screen
//  3. the loop itself: write, train, work, open a single, book a push, release,
//     draft an album
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://local.test/',
  pretendToBeVisual: true,
})
const g = globalThis as any
g.window = dom.window
g.document = dom.window.document
Object.defineProperty(g, 'navigator', { value: dom.window.navigator, configurable: true })
g.HTMLElement = dom.window.HTMLElement
g.Node = dom.window.Node
g.Event = dom.window.Event
g.MouseEvent = dom.window.MouseEvent
g.localStorage = dom.window.localStorage
g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 0)
g.cancelAnimationFrame = (id: any) => clearTimeout(id)
g.IS_REACT_ACT_ENVIRONMENT = true

const errors: string[] = []
const origError = console.error
console.error = (...args: any[]) => {
  const msg = args.map(String).join(' ')
  if (!msg.includes('not wrapped in act') && !msg.includes('STARMAKER crashed')) errors.push(msg)
  origError(...args)
}

let failures = 0
const check = (label: string, ok: boolean, extra = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${extra ? ' — ' + extra : ''}`)
}

// The exact shape the previous build wrote: flat skills, no `skills` object.
const legacySave = {
  version: 1,
  artistName: 'You',
  cash: 3_000,
  fans: 250,
  totalStreams: 12000,
  gigsPlayed: 1,
  songwriting: 12,
  virality: 8,
  studioLevel: 1,
  songs: [
    {
      id: 'a', title: 'Neon Halo', quality: 44, createdAt: 1, releasedAt: 2,
      lifeAnchor: 2, reach: 20, lifespanH: 48, streams: 4000, albumId: null,
    },
    { id: 'b', title: 'Static Hours', quality: 41, createdAt: 3, releasedAt: null, lifeAnchor: null, reach: 0, lifespanH: 0, streams: 0, albumId: null },
    { id: 'c', title: 'Paper Weather', quality: 52, createdAt: 4, releasedAt: null, lifeAnchor: null, reach: 0, lifespanH: 0, streams: 0, albumId: null },
  ],
  albums: [],
  jobs: [],
  jobsRefreshAt: 9,
  activeJob: null,
  training: null,
  writingStartedAt: null,
  writingDurationMs: 90000,
  promoUntil: 0,
  boostUntil: 0,
  gigReadyAt: {},
  lastTick: 1,
  startedAt: 1,
  log: [],
}

async function main() {
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const actFn: any = (React as any).act ?? (await import('react-dom/test-utils')).act
  const act = (cb: any) => actFn(cb)
  const { sanitizeSave } = await import('../src/game/save')

  // ---------------------------------------------------------------- saves
  const hostile: [string, any][] = [
    ['legacy v1 save', legacySave],
    ['empty object', {}],
    ['null skills', { skills: null, songs: [] }],
    ['skills as strings', { skills: { songwriting: 'x', rhythm: null, virality: {} } }],
    ['songs not an array', { songs: 'nope', albums: 5, jobs: {} }],
    ['junk songs', { songs: [null, 1, 'x', { id: 'ok', quality: 900 }], skills: {} }],
    ['bad training', { training: { skill: 'nonsense', startedAt: 'soon' } }],
    ['bad active job', { activeJob: { title: 5 } }],
    ['negative numbers', { cash: -500, fans: -2, studioLevel: 99 }],
  ]
  for (const [label, raw] of hostile) {
    let ok = true
    let msg = ''
    try {
      const out = sanitizeSave(raw)
      ok = !!out && typeof out.cash === 'number' && !!out.skills && Array.isArray(out.songs)
    } catch (e: any) {
      ok = false
      msg = e.message
    }
    check(`save: ${label}`, ok, msg)
  }
  check('save: null is rejected', sanitizeSave(null) === null)
  const migrated = sanitizeSave(legacySave)!
  check(
    'save: flat skills migrate',
    migrated.skills.songwriting === 12 && migrated.skills.virality === 8 && migrated.skills.rhythm === 0,
    `${migrated.skills.songwriting}/${migrated.skills.virality}/${migrated.skills.rhythm}`,
  )
  check('save: quality clamped', migrated.songs[0].quality === 44)

  // ------------------------------------------------------- error boundary
  const { ErrorBoundary } = await import('../src/App')
  const bombRoot = document.createElement('div')
  document.body.appendChild(bombRoot)
  const Bomb = () => {
    throw new Error('kaboom')
  }
  await act(async () => {
    createRoot(bombRoot).render(
      React.createElement(ErrorBoundary, null, React.createElement(Bomb)),
    )
  })
  check('crash panel instead of black screen', (bombRoot.textContent || '').includes('Something broke'))
  bombRoot.remove()
  errors.length = 0 // React logs the deliberate bomb; that is the test working

  // ------------------------------------------------------------ the loop
  // Seed the *legacy* save: this is the case that used to black-screen.
  localStorage.setItem('starmaker.v1.save', JSON.stringify(legacySave))

  const App = (await import('../src/App')).default
  const root = createRoot(document.getElementById('root')!)
  await act(async () => {
    root.render(React.createElement(App))
  })

  const text = () => document.body.textContent || ''
  const click = async (label: string) => {
    const el = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent || '').includes(label),
    )
    if (!el) throw new Error(`no button matching "${label}"`)
    await act(async () => {
      el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    return el
  }

  check('mounted from an old save', text().includes('Fans') && text().includes('Write a song'))

  await click('Start writing')
  check('writing starts', text().includes('Writing'))

  const trainBtn = [...document.querySelectorAll('button')].find((b) =>
    /^\d+:\d\d$/.test((b.textContent || '').trim()),
  )
  await act(async () => {
    trainBtn!.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
  })
  check('training starts', text().includes('training…'))

  await click('Work')
  await click('Take')
  check('job taken', text().includes('on shift'))

  await click('Vault')
  check('vault lists drafts and releases', text().includes('Neon Halo') && text().includes('Static Hours'))

  await click('Static Hours')
  check('single sheet opens', text().includes('Base reach'))
  check('five promo tiers', document.querySelectorAll('.promo-opt').length === 5)
  await click('Regional push')
  check('push booked, charged later', text().includes('You are agreeing to pay'))
  await click('Release ·')
  // 3,000 − 1,200 regional push, charged at release (plus pennies of stream income)
  const cashNow = Number(((text().match(/\$([\d,\.]+)/) || [])[1] || '0').replace(/,/g, ''))
  check('promo charged on release', cashNow > 1750 && cashNow < 1900, `cash ${cashNow}`)
  await click('Static Hours')
  check('single now reads as out', text().includes('Out now'))
  await click('✕')

  await click('Make an album')
  await click('Draft')
  check('album drafted', text().includes('draft'))

  console.log('')
  console.log(failures ? `FAILURES: ${failures}` : 'ALL CHECKS PASSED')
  console.log('console errors:', errors.length, errors.slice(0, 2))
  process.exit(failures || errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error('FAILED', e)
  process.exit(1)
})
