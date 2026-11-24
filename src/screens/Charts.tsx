import { useState } from 'react'
import { money, ui } from '../game/data'
import { weekOf } from '../game/engine'
import type { GameState } from '../game/types'
import { Art, Bar } from '../components/Shared'

type Tab = 'songs' | 'albums' | 'artists'

export function Charts({ s }: { s: GameState }) {
  const [tab, setTab] = useState<Tab>('songs')
  const list = tab === 'songs' ? s.charts.songs : tab === 'albums' ? s.charts.albums : s.charts.artists
  const until = Math.ceil(weekOf(s.hour) * 168 - s.hour)
  const myArtist = s.charts.artists.find((a) => a.mine)
  const myRank = myArtist ? s.charts.artists.findIndex((a) => a.mine) + 1 : 0

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1">The Charts</h1>
          <div className="tiny muted">Week {s.week} · resets in {until}h</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="chip pink" style={{ fontSize: 10 }}>
            {myRank ? `Artist #${myRank}` : 'Unranked'}
          </div>
        </div>
      </div>

      <div className="card tight" style={{ marginBottom: 12, padding: '10px 12px' }}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="tiny muted">Weekly cycle</span>
          <span className="tiny" style={{ fontWeight: 700 }}>
            {168 - (s.hour % 168) > 0 ? `${Math.round(168 - (s.hour % 168))}h left` : 'rolling'}
          </span>
        </div>
        <Bar
          value={((s.hour % 168) / 168) * 100}
          color="linear-gradient(90deg,#22d3ee,#8b5cf6)"
          height={4}
        />
        <div className="tiny muted" style={{ marginTop: 7, fontSize: 10.5 }}>
          Charts are re-cut every Sunday at midnight. Streams this week decide your position.
        </div>
      </div>

      <div className="row" style={{ gap: 5, marginBottom: 10 }}>
        {(
          [
            ['songs', 'Hot 100'],
            ['albums', 'Albums'],
            ['artists', 'Artists'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            className="btn sm"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              background: tab === id ? 'rgba(255,45,120,.16)' : 'rgba(255,255,255,.04)',
              borderColor: tab === id ? 'rgba(255,45,120,.45)' : 'var(--line)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="card tight">
        {list.length === 0 ? (
          <div className="empty">Nobody on the chart yet. Release something.</div>
        ) : (
          <div className="list">
            {list.map((e, i) => {
              const rank = i + 1
              return (
                <div
                  key={e.key}
                  className="list-row"
                  style={e.mine ? { background: 'rgba(255,45,120,.07)', borderRadius: 10, paddingLeft: 6, paddingRight: 6 } : undefined}
                >
                  <div className={`rank ${rank === 1 ? 'top1' : rank <= 10 ? 'top10' : ''}`}>{rank}</div>
                  {tab !== 'artists' ? (
                    <Art hue={e.hue} label={e.mine ? 'YOU' : e.title} size={36} />
                  ) : (
                    <div
                      className="art"
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 99,
                        background: `radial-gradient(circle at 30% 25%, hsl(${e.hue} 90% 60%), hsl(${(e.hue + 60) % 360} 70% 30%))`,
                      }}
                    />
                  )}
                  <div className="grow">
                    <div
                      className="truncate"
                      style={{ fontWeight: e.mine ? 800 : 600, fontSize: 12.5, color: e.mine ? '#ffb3cf' : undefined }}
                    >
                      {e.title}
                    </div>
                    <div className="tiny muted truncate">
                      {tab === 'artists' ? e.artist : e.artist}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flex: 'none' }}>
                    <div className="tiny" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {ui(e.score)}
                    </div>
                    <div className="tiny" style={{ color: 'var(--dim2)', fontSize: 9 }}>
                      streams
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="section-title">
        <h2>Your peak positions</h2>
        <div className="line" />
      </div>
      <div className="card tight">
        {s.songs.filter((x) => x.peak).length === 0 ? (
          <div className="empty">No chart history yet.</div>
        ) : (
          <div className="list">
            {s.songs
              .filter((x) => x.peak)
              .sort((a, b) => a.peak - b.peak)
              .slice(0, 8)
              .map((x) => (
                <div key={x.id} className="list-row">
                  <span
                    className={`rank ${x.peak === 1 ? 'top1' : ''}`}
                    style={{ fontSize: 15 }}
                  >
                    {x.peak}
                  </span>
                  <div className="grow">
                    <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {x.title}
                    </div>
                    <div className="tiny muted">
                      {ui(x.streams)} streams · {money(x.streams * 0.0034)}
                    </div>
                  </div>
                  {x.peak === 1 && <span className="chip gold">#1</span>}
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  )
}
