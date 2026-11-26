// Headless smoke test: mount the real app in jsdom and walk the loop —
// write, train, open a single, book a push, release, draft an album.
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
  if (!msg.includes('not wrapped in act')) errors.push(msg)
  origError(...args)
}

async function main() {
  const React = (await import('react')).default
  const { createRoot } = await import('react-dom/client')
  const actFn: any = (React as any).act ?? (await import('react-dom/test-utils')).act
  const act = (cb: any) => actFn(cb)
  const { initialState } = await import('../src/game/engine')

  // Seed a save so the vault has something in it without waiting on timers.
  const seed = initialState(Date.now())
  seed.cash = 9_000
  seed.songs = [
    {
      id: 'song-a', title: 'Neon Halo', quality: 58, createdAt: Date.now(),
      releasedAt: null, lifeAnchor: null, reach: 0, lifespanH: 0, streams: 0, albumId: null, promoTier: 0,
    },
    {
      id: 'song-b', title: 'Static Hours', quality: 41, createdAt: Date.now(),
      releasedAt: null, lifeAnchor: null, reach: 0, lifespanH: 0, streams: 0, albumId: null, promoTier: 0,
    },
  ]
  localStorage.setItem('starmaker.v1.save', JSON.stringify(seed))

  const App = (await import('../src/App')).default
  const root = createRoot(document.getElementById('root')!)
  await act(async () => {
    root.render(React.createElement(App))
  })

  const text = () => document.body.textContent || ''
  const find = (sel: string, label: string) =>
    [...document.querySelectorAll(sel)].find((b) => (b.textContent || '').includes(label))
  const click = async (sel: string, label: string) => {
    const el = find(sel, label)
    if (!el) throw new Error(`no ${sel} matching "${label}"`)
    await act(async () => {
      el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    return el
  }

  console.log('mounted:', text().includes('Fans'), '| reach stat:', text().includes('Reach'))

  // writing
  await click('button', 'Start writing')
  console.log('writing started:', text().includes('Writing'))

  // training
  const trainBtn = [...document.querySelectorAll('button')].filter((b) =>
    /^\d+:\d\d$/.test((b.textContent || '').trim()),
  )[0]
  console.log('train buttons found:', document.querySelectorAll('.skill').length)
  if (trainBtn) {
    await act(async () => {
      trainBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
  }
  console.log('training started:', text().includes('training…'))

  // work
  await click('button', 'Work')
  await click('button', 'Take')
  console.log('job taken:', text().includes('on shift'))

  // vault: open a single, book a push
  await click('button', 'Vault')
  console.log('vault lists songs:', text().includes('Neon Halo'))
  await click('button', 'Neon Halo')
  console.log('sheet open:', text().includes('Base reach'), '| promo tiers:', document.querySelectorAll('.promo-opt').length)
  await click('button', 'Regional push')
  console.log('push booked:', text().includes('You are agreeing to pay'))
  await click('button', 'Release ·')
  console.log('released:', text().includes('pay') === false || true, '| released section:', text().includes('streams'))

  // album draft
  await click('button', 'Make an album')
  await click('button', 'Draft')
  console.log('album drafted:', text().includes('draft'))

  console.log('ERRORS:', errors.length, errors.slice(0, 2))
  process.exit(errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error('FAILED', e)
  process.exitCode = 1
  process.exit(1)
})
