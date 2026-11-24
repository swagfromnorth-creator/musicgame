// Headless smoke test: mount the real app in jsdom, poke every tab, and click
// the two things the game is built around (write a song, take a job).
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
  const App = (await import('../src/App')).default

  const root = createRoot(document.getElementById('root')!)
  await act(async () => {
    root.render(React.createElement(App))
  })

  const text = () => document.body.textContent || ''
  const clickByText = async (label: string) => {
    const btn = [...document.querySelectorAll('button')].find((b) =>
      (b.textContent || '').includes(label),
    )
    if (!btn) throw new Error(`no button matching "${label}"`)
    await act(async () => {
      btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }))
    })
    return btn
  }

  console.log('mounted:', text().includes('Fans'), '| stats row:', text().includes('Reach'))

  await clickByText('Start writing')
  console.log('writing started:', text().includes('Writing'))

  await clickByText('Work')
  const jobs = document.querySelectorAll('.job').length
  console.log('job cards:', jobs)
  await clickByText('Take')
  console.log('job taken:', text().includes('working'))

  await clickByText('Vault')
  console.log('vault tab:', text().includes('unreleased'))
  await clickByText('Biz')
  console.log('biz tab:', text().includes('Promotion'))

  console.log('ERRORS:', errors.length, errors.slice(0, 2))
  process.exit(errors.length ? 1 : 0)
}

main().catch((e) => {
  console.error('FAILED', e)
  process.exitCode = 1
})
