import React, { useState } from 'react'
import { money, num } from './game/data'
import { reachStats, totalStreamsPerHour } from './game/engine'
import { GameProvider, useGame } from './game/store'
import { clearSaves } from './game/save'
import { Btn } from './ui/parts'
import { Biz } from './screens/Biz'
import { Studio } from './screens/Studio'
import { Vault } from './screens/Vault'
import { Work } from './screens/Work'

type Tab = 'studio' | 'vault' | 'work' | 'biz'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'studio', label: 'Studio', icon: '🎙️' },
  { id: 'vault', label: 'Vault', icon: '💽' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'biz', label: 'Biz', icon: '📈' },
]

function Shell() {
  const { state } = useGame()
  const [tab, setTab] = useState<Tab>('studio')
  const now = Date.now()
  const rate = totalStreamsPerHour(state, now)
  const { reach, lifespanH } = reachStats(state)
  const writing = state.writingStartedAt !== null
  const working = state.activeJob !== null

  return (
    <div className="app">
      <header className="top">
        <div className="row between baseline">
          <span className="artist">{state.artistName}</span>
          <span className="cash mono">{money(state.cash)}</span>
        </div>
        <div className="stats">
          <Stat label="Fans" value={num(state.fans)} />
          <Stat label="Streams / hr" value={num(rate)} />
          <Stat label="Reach / life" value={reach ? String(reach) : '—'} sub={lifespanH ? `${lifespanH}h` : ''} />
        </div>
      </header>

      <main>
        {tab === 'studio' && <Studio />}
        {tab === 'vault' && <Vault />}
        {tab === 'work' && <Work />}
        {tab === 'biz' && <Biz />}
      </main>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'on' : ''}
            onClick={() => setTab(t.id)}
          >
            <span className="ico">{t.icon}</span>
            <span>{t.label}</span>
            {((t.id === 'studio' && writing) || (t.id === 'work' && working)) && <i className="dot" />}
          </button>
        ))}
      </nav>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="stat">
      <span className="dim tiny">{label}</span>
      <span className="mono">
        {value}
        {sub && <em> {sub}</em>}
      </span>
    </div>
  )
}

/**
 * A crash should never be a black screen. If anything throws, say so and offer
 * the one thing that always fixes it.
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('STARMAKER crashed:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="app crash">
        <div className="stack">
          <section className="card">
            <h2>Something broke</h2>
            <p className="dim small">
              The game hit an error it could not recover from. Your save is probably from an older
              version of the game.
            </p>
            <p className="tiny mono crash-msg">{String(this.state.error.message || this.state.error)}</p>
            <Btn
              block
              onClick={() => {
                clearSaves()
                location.reload()
              }}
            >
              Start a new career
            </Btn>
            <Btn
              block
              variant="ghost"
              onClick={() => {
                location.reload()
              }}
            >
              Just reload
            </Btn>
          </section>
        </div>
      </div>
    )
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <Shell />
      </GameProvider>
    </ErrorBoundary>
  )
}
