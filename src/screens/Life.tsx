import { useState } from 'react'
import { ASSETS, GENRES, money, ui } from '../game/data'
import { assetFame, fameOf, totalStreamsPerHour } from '../game/engine'
import type { GameState } from '../game/types'
import { Art, Bar, Btn, Sheet } from '../components/Shared'
import { useGame } from '../game/store'

export function Life({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const [confirmRetire, setConfirmRetire] = useState(false)
  const fame = fameOf(s)
  const owned = s.assets.length
  const totalStreams = s.songs.reduce((a, b) => a + b.streams, 0)
  const earnings = s.songs.reduce((a, b) => a + b.streams * 0.0034, 0)
  const awardsWon = s.awards.filter((a) => a.won).length

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <h1 className="h1">The Life</h1>
        <div className="tiny muted">You made it this far. Now make it look like it.</div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <div>
            <div className="h2">Lifestyle</div>
            <div className="tiny muted">
              {owned} of {ASSETS.length} owned · +{assetFame(s)} influence
            </div>
          </div>
          <span className="chip gold">{money(s.money)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ASSETS.map((a) => {
            const has = s.assets.includes(a.id)
            const can = s.money >= a.cost
            return (
              <div
                key={a.id}
                className="row"
                style={{
                  gap: 10,
                  padding: 9,
                  borderRadius: 12,
                  border: `1px solid ${has ? 'rgba(245,196,81,.32)' : 'var(--line)'}`,
                  background: has ? 'rgba(245,196,81,.06)' : 'rgba(255,255,255,.025)',
                  opacity: has || can ? 1 : 0.55,
                }}
              >
                <span style={{ fontSize: 20, flex: 'none', width: 24, textAlign: 'center' }}>{a.emoji}</span>
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>{a.name}</span>
                    <span className="chip" style={{ fontSize: 8.5, padding: '2px 6px' }}>
                      +{a.fame} inf
                    </span>
                  </div>
                  <div className="tiny muted">{a.blurb}</div>
                </div>
                {has ? (
                  <span className="chip gold" style={{ flex: 'none' }}>Owned</span>
                ) : (
                  <Btn
                    sm
                    variant={can ? 'flat' : 'ghost'}
                    disabled={!can}
                    onClick={() => dispatch({ type: 'BUY_ASSET', assetId: a.id })}
                    style={{ flex: 'none' }}
                  >
                    {money(a.cost)}
                  </Btn>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="section-title">
        <h2>Career record</h2>
        <div className="line" />
      </div>
      <div className="card">
        <div className="grid2" style={{ gap: 8 }}>
          <Row k="Total streams" v={ui(totalStreams)} />
          <Row k="Lifetime royalties" v={money(earnings)} />
          <Row k="Awards won" v={`${awardsWon} / ${s.awards.length}`} />
          <Row k="Peak fame" v={String(Math.round(fame))} />
          <Row k="Songs released" v={String(s.songs.filter((x) => x.released).length)} />
          <Row k="Albums out" v={String(s.albums.filter((a) => a.released).length)} />
          <Row k="Followers" v={ui(s.followers)} />
          <Row k="Streams / hr" v={ui(totalStreamsPerHour(s))} />
        </div>
      </div>

      {s.awards.length > 0 && (
        <>
          <div className="section-title">
            <h2>The cabinet</h2>
            <div className="line" />
          </div>
          <div className="card tight">
            <div className="list">
              {s.awards.slice(0, 10).map((a) => (
                <div key={a.id} className="list-row">
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center', opacity: a.won ? 1 : 0.35 }}>
                    {a.won ? '🏆' : '🎗️'}
                  </span>
                  <div className="grow">
                    <div className="truncate" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {a.category}
                    </div>
                    <div className="tiny muted">
                      Year {a.year} · {a.won ? `"${a.songTitle}"` : `lost to ${a.rivalName}`}
                    </div>
                  </div>
                  <span className="tiny" style={{ color: a.won ? '#f8d98b' : 'var(--dim2)' }}>
                    {a.won ? 'WON' : 'nominated'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {s.hallOfFame.length > 0 && (
        <>
          <div className="section-title">
            <h2>The family name</h2>
            <div className="line" />
            <span className="tiny muted">legacy ×{s.legacyLevel}</span>
          </div>
          <div className="card tight">
            <div className="list">
              {s.hallOfFame.map((h, i) => (
                <div key={i} className="list-row">
                  <Art hue={h.hue} label={h.name} size={34} />
                  <div className="grow">
                    <div className="truncate" style={{ fontSize: 12.5, fontWeight: 700 }}>
                      {h.name}
                    </div>
                    <div className="tiny muted">
                      {GENRES.find((g) => g.id === h.genre)?.name} · {h.years}y · best: “{h.bestSong}”
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="tiny" style={{ color: '#f8d98b', fontWeight: 700 }}>
                      {h.awards} 🏆
                    </div>
                    <div className="tiny muted" style={{ fontSize: 9 }}>
                      fame {Math.round(h.peakFame)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="section-title">
        <h2>The end (eventually)</h2>
        <div className="line" />
      </div>
      <div className="card">
        <div className="row between">
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Retire and pass the name on</div>
            <div className="tiny muted">
              Your career goes in the record books. A new artist starts with a legacy head start.
            </div>
          </div>
          <Btn sm variant="danger" onClick={() => setConfirmRetire(true)}>
            Retire
          </Btn>
        </div>
        <div className="divider" />
        <div className="row between">
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 13 }}>New game</div>
            <div className="tiny muted">Erases this save entirely. No takesies backsies.</div>
          </div>
          <Btn
            sm
            variant="ghost"
            onClick={() => {
              if (confirm('Erase this career and start over?')) dispatch({ type: 'RESET' })
            }}
          >
            Wipe
          </Btn>
        </div>
      </div>

      <div className="tiny muted" style={{ textAlign: 'center', marginTop: 16, fontSize: 10 }}>
        Progress saves automatically. Close the tab — your streams keep running.
      </div>

      <Sheet open={confirmRetire} onClose={() => setConfirmRetire(false)} title="Walk away?">
        <div className="card" style={{ background: 'rgba(255,255,255,.03)' }}>
          <div className="row between" style={{ marginBottom: 6 }}>
            <span className="tiny muted">Final fame</span>
            <span style={{ fontWeight: 700 }}>{Math.round(fame)}</span>
          </div>
          <div className="row between" style={{ marginBottom: 6 }}>
            <span className="tiny muted">Awards</span>
            <span style={{ fontWeight: 700 }}>{awardsWon}</span>
          </div>
          <div className="row between">
            <span className="tiny muted">Legacy bonus for your next artist</span>
            <span style={{ fontWeight: 700, color: '#f8d98b' }}>×{s.legacyLevel + 1}</span>
          </div>
        </div>
        <Btn
          block
          variant="danger"
          style={{ marginTop: 12 }}
          onClick={() => {
            dispatch({ type: 'RETIRE' })
            setConfirmRetire(false)
          }}
        >
          Retire as {s.artistName}
        </Btn>
        <div className="tiny muted" style={{ textAlign: 'center', marginTop: 8 }}>
          The Hall of Fame keeps every artist you retire.
        </div>
      </Sheet>
    </>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="row between" style={{ padding: '5px 0' }}>
      <span className="tiny muted">{k}</span>
      <span style={{ fontWeight: 700, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>{v}</span>
    </div>
  )
}
