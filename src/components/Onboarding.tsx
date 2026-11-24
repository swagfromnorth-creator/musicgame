import React, { useMemo, useState } from 'react'
import { GENRES, ORIGINS, randomName, pick } from '../game/data'
import { PortraitArt } from './Shared'
import { useGame } from '../game/store'
import type { Portrait } from '../game/types'

const swatches = (n: number) => Array.from({ length: n }, (_, i) => i)

export function Onboarding({ legacy = 0, onStart }: { legacy?: number; onStart?: () => void }) {
  const { dispatch, state } = useGame()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(randomName())
  const [genreIdx, setGenreIdx] = useState(1)
  const [origin, setOrigin] = useState(ORIGINS[0])
  const [portrait, setPortrait] = useState<Portrait>({
    skin: 2,
    hair: 0,
    hairColor: 0,
    eyes: 0,
    outfit: 0,
    accessory: 0,
    hairStyle: 2,
  })

  const genre = GENRES[genreIdx]
  const hue = genre.hue

  const randomize = () => {
    setPortrait({
      skin: Math.floor(Math.random() * 7),
      hair: 0,
      hairColor: Math.floor(Math.random() * 10),
      eyes: Math.floor(Math.random() * 4),
      outfit: Math.floor(Math.random() * 8),
      accessory: Math.floor(Math.random() * 4),
      hairStyle: Math.floor(Math.random() * 5),
    })
    setName(randomName())
  }

  const start = () => {
    const payload = {
      artistName: name.trim() || randomName(),
      genre: genre.id,
      origin,
      portrait,
      hue,
    }
    if (onStart) {
      dispatch({ type: 'NEW_ARTIST', payload })
      onStart()
    } else {
      dispatch({ type: 'START', payload })
    }
  }

  const content = useMemo(() => {
    if (step === 0) {
      return (
        <>
          <div className="section-title">
            <h2>The Name</h2>
            <div className="line" />
            <button className="chip" onClick={() => setName(randomName())}>
              🎲 Roll
            </button>
          </div>
          <input
            value={name}
            maxLength={26}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stage name"
            style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}
          />

          <div className="section-title">
            <h2>Your Sound</h2>
            <div className="line" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {GENRES.map((g, i) => (
              <button
                key={g.id}
                className={`opt ${i === genreIdx ? 'on' : ''}`}
                onClick={() => setGenreIdx(i)}
              >
                <span style={{ fontSize: 17 }}>{g.emoji}</span>
                <span className="grow">
                  <div className="opt-title">{g.name}</div>
                  <div className="opt-sub">{g.blurb}</div>
                </span>
              </button>
            ))}
          </div>

          <div className="section-title">
            <h2>Where You Came From</h2>
            <div className="line" />
          </div>
          <select value={origin} onChange={(e) => setOrigin(e.target.value)}>
            {ORIGINS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </>
      )
    }

    if (step === 1) {
      return (
        <>
          <div className="row" style={{ gap: 14, marginBottom: 4 }}>
            <PortraitArt p={portrait} size={108} hue={hue} />
            <div className="grow">
              <div className="h1" style={{ fontSize: 24 }}>
                {name || 'No Name'}
              </div>
              <div className="muted tiny" style={{ marginTop: 2 }}>
                {genre.emoji} {genre.name} · {origin}
              </div>
              <button className="btn sm flat" style={{ marginTop: 10 }} onClick={randomize}>
                🎲 Randomize look
              </button>
            </div>
          </div>

          <SwatchRow
            label="Skin"
            value={portrait.skin}
            onPick={(v) => setPortrait({ ...portrait, skin: v })}
            items={['#f5d6c3', '#e8bfa3', '#d6a17b', '#b87d52', '#8d5a35', '#63391f', '#3f2416'].map((c) => (
              <SwatchDot color={c} />
            ))}
          />
          <SwatchRow
            label="Hair Style"
            value={portrait.hairStyle}
            onPick={(v) => setPortrait({ ...portrait, hairStyle: v })}
            items={['Short', 'Bob', 'Long', 'Curls', 'Topknot'].map((t) => (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#cfcedd' }}>{t}</span>
            ))}
          />
          <SwatchRow
            label="Hair Colour"
            value={portrait.hairColor}
            onPick={(v) => setPortrait({ ...portrait, hairColor: v })}
            items={['#0c0c0e', '#2b1c14', '#6b3f21', '#a8692c', '#d9b26a', '#b83b5e', '#5b3fa8', '#1f8a70', '#d8d8dc', '#ff7ab8'].map((c) => (
              <SwatchDot color={c} />
            ))}
          />
          <SwatchRow
            label="Eyes"
            value={portrait.eyes}
            onPick={(v) => setPortrait({ ...portrait, eyes: v })}
            items={['#2b2b33', '#3f6f5a', '#4a5f8a', '#6b4a2a'].map((c) => (
              <SwatchDot color={c} round />
            ))}
          />
          <SwatchRow
            label="Outfit"
            value={portrait.outfit}
            onPick={(v) => setPortrait({ ...portrait, outfit: v })}
            items={['#ff2d78', '#8b5cf6', '#38bdf8', '#f5c451', '#4ade80', '#f87171', '#e5e7eb', '#111827'].map((c) => (
              <SwatchDot color={c} />
            ))}
          />
          <SwatchRow
            label="Accessory"
            value={portrait.accessory}
            onPick={(v) => setPortrait({ ...portrait, accessory: v })}
            items={['—', '🕶️', '💎', '📿'].map((t) => <span style={{ fontSize: 13 }}>{t}</span>)}
          />
        </>
      )
    }

    return (
      <>
        <div className="card glow" style={{ textAlign: 'center', padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PortraitArt p={portrait} size={126} hue={hue} />
          </div>
          <div className="h1" style={{ fontSize: 30, marginTop: 12 }}>
            {name || 'No Name'}
          </div>
          <div className="muted tiny" style={{ marginTop: 4 }}>
            {origin}
          </div>
          <div className="row" style={{ justifyContent: 'center', marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
            <span className="chip pink">
              {genre.emoji} {genre.name}
            </span>
            <span className="chip">Age 19</span>
            <span className="chip">$750 to your name</span>
            <span className="chip">32 followers</span>
          </div>
        </div>

        <div className="card" style={{ marginTop: 12 }}>
          <div className="h2" style={{ marginBottom: 8 }}>
            How it works
          </div>
          <Rules />
        </div>

        {legacy > 0 && (
          <div className="card" style={{ marginTop: 12, borderColor: 'rgba(245,196,81,.35)' }}>
            <div className="row between">
              <div>
                <div className="opt-title" style={{ color: '#f8d98b' }}>
                  Legacy ×{legacy}
                </div>
                <div className="opt-sub">The industry remembers the name. Head start applied.</div>
              </div>
              <span style={{ fontSize: 22 }}>👑</span>
            </div>
          </div>
        )}
      </>
    )
  }, [step, name, genreIdx, origin, portrait, hue, genre, legacy])

  return (
    <div className="onboard">
      <div style={{ marginBottom: 20 }}>
        <h1 className="logo">STARMAKER</h1>
        <div className="logo-sub">From a bedroom to the whole world</div>
      </div>

      <div className="row" style={{ gap: 5, marginBottom: 16 }}>
        {['Identity', 'The Look', 'Confirm'].map((s, i) => (
          <div key={s} className="grow">
            <div className="bar" style={{ height: 3 }}>
              <i
                style={{
                  width: i <= step ? '100%' : '0%',
                  background: 'linear-gradient(90deg,#ff2d78,#a855f7)',
                }}
              />
            </div>
            <div
              className="tiny"
              style={{ marginTop: 5, fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color: i <= step ? '#fff' : 'var(--dim2)' }}
            >
              {s}
            </div>
          </div>
        ))}
      </div>

      <div className="grow">{content}</div>

      <div className="row" style={{ gap: 8, marginTop: 22 }}>
        {step > 0 && (
          <button className="btn ghost" onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 2 ? (
          <button className="btn primary grow" onClick={() => setStep(step + 1)} disabled={step === 0 && !name.trim()}>
            {step === 0 ? 'Design the look →' : 'Almost there →'}
          </button>
        ) : (
          <button className="btn primary grow" onClick={start}>
            Start the career 🎤
          </button>
        )}
      </div>
    </div>
  )
}

function Rules() {
  return (
    <ul style={{ margin: 0, paddingLeft: 17, color: '#c9c8d8', fontSize: 12.5, lineHeight: 1.7 }}>
      <li>Write and record songs, then release singles or build an album.</li>
      <li>Streams, royalties and fans keep ticking even while you're away.</li>
      <li>Train skills and energy — better songs come from better artists.</li>
      <li>Climb the weekly Hot 100, sign a label, tour, beef, win awards.</li>
      <li>Then spend it all on cars, jets and an island. Retire a legend.</li>
    </ul>
  )
}

function SwatchDot({ color, round }: { color: string; round?: boolean }) {
  return (
    <span
      style={{
        display: 'block',
        width: 18,
        height: 18,
        borderRadius: round ? '50%' : 5,
        background: color,
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.35)',
      }}
    />
  )
}

function SwatchRow({
  label,
  items,
  value,
  onPick,
}: {
  label: string
  items: React.ReactNode[]
  value: number
  onPick: (v: number) => void
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="h2" style={{ fontSize: 10.5, marginBottom: 7 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onPick(i)}
            style={{
              minWidth: 32,
              height: 32,
              padding: '0 5px',
              borderRadius: 10,
              border: `2px solid ${i === value ? '#fff' : 'rgba(255,255,255,.1)'}`,
              background: i === value ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .15s',
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  )
}
