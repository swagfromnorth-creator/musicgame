import { useEffect, useState } from 'react'
import { GameProvider, useGame } from './game/store'
import { Onboarding } from './components/Onboarding'
import { Home } from './screens/Home'
import { Studio } from './screens/Studio'
import { Career } from './screens/Career'
import { Charts } from './screens/Charts'
import { Social } from './screens/Social'
import { Business } from './screens/Business'
import { Life } from './screens/Life'
import { fameOf, totalStreamsPerHour, weekOf, yearOf } from './game/engine'
import { fameTier, money, ui } from './game/data'
import { Bar, Btn, PortraitArt } from './components/Shared'

type TabId = 'home' | 'studio' | 'career' | 'charts' | 'social' | 'biz' | 'life'

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'studio', icon: '🎵', label: 'Studio' },
  { id: 'career', icon: '💪', label: 'Grind' },
  { id: 'charts', icon: '📊', label: 'Charts' },
  { id: 'social', icon: '🔥', label: 'Scene' },
  { id: 'biz', icon: '💼', label: 'Biz' },
  { id: 'life', icon: '🏝️', label: 'Life' },
]

export default function App() {
  return (
    <GameProvider>
      <Root />
    </GameProvider>
  )
}

function Root() {
  const { state, dispatch, welcome, dismissWelcome } = useGame()
  const [tab, setTab] = useState<TabId>('home')

  useEffect(() => {
    if (state?.retired) setTab('home')
  }, [state?.retired])

  if (!state) return <Onboarding />

  if (state.retired) {
    return (
      <Retired
        onNext={() => {
          setTab('home')
        }}
      />
    )
  }

  const s = state
  const fame = fameOf(s)
  const tier = fameTier(fame)

  return (
    <div className="app">
      <header className="hud">
        <div className="hud-inner">
          <div className="hud-id">
            <PortraitArt p={s.portrait} size={34} hue={s.hue} />
            <div style={{ minWidth: 0 }}>
              <div className="hud-name">{s.artistName}</div>
              <div className="hud-sub">
                {tier.name} · W{s.week} Y{s.year}
              </div>
            </div>
          </div>

          <div className="hud-stats">
            <div className="hud-stat pill-money">
              <b>{money(s.money)}</b>
              <span>cash</span>
            </div>
            <div className="hud-stat pill-fans">
              <b>{ui(s.followers)}</b>
              <span>fans</span>
            </div>
            <div className="hud-stat pill-streams" style={{ display: 'none' }}>
              <b>{ui(totalStreamsPerHour(s))}</b>
              <span>per hr</span>
            </div>
          </div>

          <div className="speedbar">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_PLAY' })}
              className={s.playing ? 'on' : ''}
              title={s.playing ? 'Pause' : 'Play'}
            >
              {s.playing ? '❚❚' : '▶'}
            </button>
            {[1, 2, 4].map((sp) => (
              <button
                key={sp}
                className={s.speed === sp ? 'on' : ''}
                onClick={() => {
                  dispatch({ type: 'SET_SPEED', speed: sp })
                  if (!s.playing) dispatch({ type: 'TOGGLE_PLAY' })
                }}
              >
                {sp}×
              </button>
            ))}
          </div>
        </div>
        <div className="hud-energy">
          <div className="energy-mini" style={{ marginTop: 0 }}>
            <i
              style={{
                width: `${(s.energy / s.maxEnergy) * 100}%`,
                background:
                  s.energy > 50
                    ? 'linear-gradient(90deg,#facc15,#4ade80)'
                    : 'linear-gradient(90deg,#ef4444,#fb923c)',
              }}
            />
          </div>
        </div>
      </header>

      <main className="main" key={tab}>
        {tab === 'home' && <Home s={s} go={(t) => setTab(t as TabId)} />}
        {tab === 'studio' && <Studio s={s} />}
        {tab === 'career' && <Career s={s} />}
        {tab === 'charts' && <Charts s={s} />}
        {tab === 'social' && <Social s={s} />}
        {tab === 'biz' && <Business s={s} />}
        {tab === 'life' && <Life s={s} />}
      </main>

      <nav className="nav">
        <div className="nav-inner">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <span className="ico">{t.icon}</span>
              <span className="lbl">{t.label}</span>
              {t.id === 'studio' && s.pending && <span className="dot" />}
              {t.id === 'biz' && s.offers.length > 0 && <span className="dot" />}
            </button>
          ))}
        </div>
      </nav>

      {welcome && (
        <div className="sheet-wrap" onClick={dismissWelcome}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-grip" />
            <div className="h1" style={{ fontSize: 26, textAlign: 'center' }}>
              Welcome back
            </div>
            <div className="tiny muted" style={{ textAlign: 'center', marginBottom: 14 }}>
              You were away for {Math.round(welcome.hours / 24 * 10) / 10} days
            </div>
            <div className="grid3">
              <div className="stat-tile">
                <div className="k">Followers</div>
                <div className="v" style={{ color: welcome.fans >= 0 ? '#86efac' : '#fda4af' }}>
                  {welcome.fans >= 0 ? '+' : ''}
                  {ui(welcome.fans)}
                </div>
              </div>
              <div className="stat-tile">
                <div className="k">Royalties</div>
                <div className="v" style={{ color: '#f8d98b' }}>{money(welcome.money)}</div>
              </div>
              <div className="stat-tile">
                <div className="k">Fame</div>
                <div className="v">{Math.round(fame)}</div>
              </div>
            </div>
            <Btn block variant="primary" style={{ marginTop: 14 }} onClick={dismissWelcome}>
              Back to work
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

function Retired({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useGame()
  const [creating, setCreating] = useState(false)
  if (!state) return null
  if (creating) {
    return <Onboarding legacy={state.legacyLevel} onStart={onNext} />
  }
  const record = state.hallOfFame[0]
  const fame = fameOf(state)
  return (
    <div className="onboard">
      <div style={{ marginTop: 12, textAlign: 'center' }}>
        <div className="chip gold" style={{ marginBottom: 12 }}>
          Career complete
        </div>
        <h1 className="logo" style={{ fontSize: 38 }}>
          THE LEGEND
          <br />
          OF {state.artistName.toUpperCase()}
        </h1>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ gap: 12 }}>
          <PortraitArt p={state.portrait} size={64} hue={state.hue} />
          <div className="grow">
            <div style={{ fontWeight: 800, fontSize: 16 }}>{state.artistName}</div>
            <div className="tiny muted">
              {record ? `${record.years} year career` : 'one hell of a run'} · peak fame {Math.round(fame)}
            </div>
          </div>
        </div>
        <div className="divider" />
        <div className="grid2">
          <div className="stat-tile">
            <div className="k">Awards</div>
            <div className="v">{state.awards.filter((a) => a.won).length}</div>
          </div>
          <div className="stat-tile">
            <div className="k">Best song</div>
            <div className="v" style={{ fontSize: 12.5 }}>
              {record?.bestSong ?? '—'}
            </div>
          </div>
          <div className="stat-tile">
            <div className="k">Final fortune</div>
            <div className="v" style={{ color: '#f8d98b', fontSize: 13 }}>
              {money(state.money)}
            </div>
          </div>
          <div className="stat-tile">
            <div className="k">Legacy</div>
            <div className="v" style={{ color: '#c4b5fd' }}>×{state.legacyLevel}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <Btn block variant="primary" style={{ marginTop: 18 }} onClick={() => setCreating(true)}>
        Start the next generation →
      </Btn>
      <button
        className="btn ghost block"
        style={{ marginTop: 8 }}
        onClick={() => dispatch({ type: 'RESET' })}
      >
        Or begin an entirely new story
      </button>
      <div className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
        Your next artist inherits the name: more cash, more followers, better skills.
      </div>
    </div>
  )
}
