import { useState } from 'react'
import { GENRES, money, ui } from '../game/data'
import { fameOf } from '../game/engine'
import type { GameState, Rival } from '../game/types'
import { Bar, Btn, Sheet } from '../components/Shared'
import { useGame } from '../game/store'

function beefLabel(b: number) {
  if (b < -60) return { label: 'Family', color: '#4ade80' }
  if (b < -20) return { label: 'Close ally', color: '#86efac' }
  if (b < 15) return { label: 'Cordial', color: '#a5b4fc' }
  if (b < 40) return { label: 'Tense', color: '#fbbf24' }
  if (b < 70) return { label: 'Beef', color: '#fb7185' }
  return { label: 'Mortal enemy', color: '#f43f5e' }
}

export function Social({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const [open, setOpen] = useState<Rival | null>(null)
  const [sort, setSort] = useState<'beef' | 'fame'>('fame')
  const fame = fameOf(s)
  const rivals = [...s.rivals].sort((a, b) => (sort === 'beef' ? b.beef - a.beef : b.fame - a.fame))
  const hotBeef = s.rivals.filter((r) => r.beef > 45)
  const allies = s.rivals.filter((r) => r.beef < -20)

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <h1 className="h1">The Industry</h1>
        <div className="tiny muted">
          {allies.length} allies · {hotBeef.length} active beefs · {ui(s.followers)} followers
        </div>
      </div>

      <div className="grid3" style={{ marginBottom: 12 }}>
        <div className="stat-tile">
          <div className="k">Followers</div>
          <div className="v" style={{ color: '#7dd3fc' }}>{ui(s.followers)}</div>
        </div>
        <div className="stat-tile">
          <div className="k">Hype</div>
          <div className="v" style={{ color: '#f8d98b' }}>{Math.round(s.hype)}</div>
        </div>
        <div className="stat-tile">
          <div className="k">Heat</div>
          <div className="v" style={{ color: '#fb7185' }}>{Math.round(s.controversy)}</div>
        </div>
      </div>

      <div className="card tight" style={{ marginBottom: 12 }}>
        <div className="row between">
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>📱 Post a clip</div>
            <div className="tiny muted">Fifteen seconds of the hook. Free, fast, and it works.</div>
          </div>
          <Btn sm variant="flat" onClick={() => dispatch({ type: 'ACTIVITY', id: 'post-clip' })} disabled={s.energy < 5}>
            Post
          </Btn>
        </div>
        <div className="divider" />
        <div className="row between">
          <div className="grow">
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>🔴 Go live</div>
            <div className="tiny muted">Talk to the fans unfiltered. Some of them stay.</div>
          </div>
          <Btn
            sm
            variant="flat"
            onClick={() => dispatch({ type: 'ACTIVITY', id: 'go-live' })}
            disabled={s.energy < 12 || fame < 3}
          >
            Stream
          </Btn>
        </div>
      </div>

      <div className="row between" style={{ margin: '0 2px 8px' }}>
        <h2 className="h2">Artists</h2>
        <div className="row" style={{ gap: 4 }}>
          <button
            className="chip"
            onClick={() => setSort('fame')}
            style={sort === 'fame' ? { borderColor: 'rgba(255,45,120,.5)', color: '#ffb3cf' } : undefined}
          >
            By fame
          </button>
          <button
            className="chip"
            onClick={() => setSort('beef')}
            style={sort === 'beef' ? { borderColor: 'rgba(255,45,120,.5)', color: '#ffb3cf' } : undefined}
          >
            By beef
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rivals.map((r) => {
          const bl = beefLabel(r.beef)
          const genre = GENRES.find((g) => g.id === r.genre)
          return (
            <button key={r.id} className="card tight" onClick={() => setOpen(r)} style={{ textAlign: 'left', width: '100%' }}>
              <div className="row" style={{ gap: 10 }}>
                <div
                  className="art"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 99,
                    background: `radial-gradient(circle at 30% 25%, hsl(${r.hue} 92% 62%), hsl(${(r.hue + 50) % 360} 70% 26%))`,
                  }}
                />
                <div className="grow">
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</span>
                    <span className="tiny muted">
                      {genre?.emoji} {genre?.name}
                    </span>
                  </div>
                  <div className="tiny muted">{r.tag} · {ui(r.followers)} followers</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {Math.round(r.fame)}
                  </div>
                  <div className="tiny" style={{ color: 'var(--dim2)', fontSize: 8.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    fame
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 9 }}>
                <div className="grow">
                  <Bar
                    value={r.beef + 100}
                    max={200}
                    color={r.beef > 0 ? 'linear-gradient(90deg,#f59e0b,#f43f5e)' : 'linear-gradient(90deg,#22d3ee,#4ade80)'}
                    height={4}
                  />
                </div>
                <span className="tiny" style={{ color: bl.color, fontWeight: 700, flex: 'none' }}>
                  {bl.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <RivalSheet rival={open} onClose={() => setOpen(null)} s={s} />
    </>
  )
}

function RivalSheet({ rival, onClose, s }: { rival: Rival | null; onClose: () => void; s: GameState }) {
  const { dispatch } = useGame()
  if (!rival) return null
  const live = s.rivals.find((r) => r.id === rival.id) ?? rival
  const bl = beefLabel(live.beef)
  const collabGain = Math.round(40 + live.followers * 0.006 * (1 + s.skills.charisma / 80))
  const featureCost = Math.round(400 + live.followers * 0.018)
  const canCollab = live.beef < 45

  return (
    <Sheet open={!!rival} onClose={onClose}>
      <div className="row" style={{ gap: 12, marginBottom: 12 }}>
        <div
          className="art"
          style={{
            width: 60,
            height: 60,
            borderRadius: 99,
            background: `radial-gradient(circle at 30% 25%, hsl(${live.hue} 92% 62%), hsl(${(live.hue + 50) % 360} 70% 26%))`,
          }}
        />
        <div className="grow">
          <div className="h1" style={{ fontSize: 23, lineHeight: 1 }}>
            {live.name}
          </div>
          <div className="tiny muted">
            {live.tag} · fame {Math.round(live.fame)} · {ui(live.followers)} followers
          </div>
          <div className="row" style={{ gap: 5, marginTop: 6 }}>
            <span className="chip" style={{ color: bl.color, borderColor: `${bl.color}55` }}>
              {bl.label}
            </span>
            <span className="chip">current single {Math.round(live.hit)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Action
          emoji="💬"
          title="Show love"
          sub="A compliment in public. Cheap, friendly, occasionally pays off."
          cost="2⚡"
          onClick={() => {
            dispatch({ type: 'SOCIAL', rivalId: live.id, kind: 'compliment' })
          }}
          disabled={s.energy < 2}
        />
        <Action
          emoji="🤝"
          title="Studio session"
          sub={
            canCollab
              ? `Cut a record together. +${ui(collabGain)} followers, big hype.`
              : 'They will not get in a room with you. Fix the beef first.'
          }
          cost="14⚡"
          onClick={() => {
            dispatch({ type: 'SOCIAL', rivalId: live.id, kind: 'collab' })
          }}
          disabled={s.energy < 14 || !canCollab}
        />
        <Action
          emoji="📝"
          title="Put them on a record"
          sub={`Book ${live.name} as a feature. Costs real money, moves real numbers.`}
          cost={money(featureCost)}
          onClick={onClose}
          disabled={s.money < featureCost || !canCollab}
          badge="via Studio → Feature"
        />
        <Action
          emoji="😏"
          title="Subtweet"
          sub="Vague. Deniable. Starts something."
          cost="4⚡"
          onClick={() => {
            dispatch({ type: 'SOCIAL', rivalId: live.id, kind: 'subtweet' })
          }}
          disabled={s.energy < 4}
        />
        <Action
          emoji="🔥"
          title="Drop a diss track"
          sub="Auto-releases a beef record tonight. Huge hype, huge risk. They may answer."
          cost="22⚡"
          danger
          onClick={() => {
            dispatch({ type: 'SOCIAL', rivalId: live.id, kind: 'diss' })
            onClose()
          }}
          disabled={s.energy < 22}
        />
      </div>

      <div className="tiny muted" style={{ marginTop: 12, textAlign: 'center' }}>
        Beef tracks get 30% more streams but raise your controversy.
      </div>
    </Sheet>
  )
}

function Action({
  emoji,
  title,
  sub,
  cost,
  onClick,
  disabled,
  danger,
  badge,
}: {
  emoji: string
  title: string
  sub: string
  cost: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  badge?: string
}) {
  return (
    <button
      className="opt"
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.42 : 1,
        borderColor: danger ? 'rgba(244,63,94,.35)' : undefined,
        background: danger ? 'rgba(244,63,94,.07)' : undefined,
      }}
    >
      <span style={{ fontSize: 17 }}>{emoji}</span>
      <span className="grow">
        <div className="opt-title">
          {title}
          {badge && (
            <span className="muted tiny" style={{ fontWeight: 500 }}>
              {' '}
              · {badge}
            </span>
          )}
        </div>
        <div className="opt-sub">{sub}</div>
      </span>
      <span className="tiny" style={{ color: danger ? '#fda4af' : 'var(--dim)', fontWeight: 700, flex: 'none' }}>
        {cost}
      </span>
    </button>
  )
}
