import React from 'react'
import { STUDIOS, money, num } from '../game/data'
import { TUNE } from '../game/data'
import { promoCost } from '../game/engine'
import { useGame } from '../game/store'
import { Btn } from '../ui/parts'

export function Biz() {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const studio = STUDIOS[state.studioLevel]
  const promoOn = Math.max(0, state.promoUntil - now)
  const cost = promoCost(state)

  return (
    <div className="stack">
      <section className="card">
        <div className="row between">
          <h3>Studio</h3>
          <span className="dim tiny">{studio.cost > 0 ? `${money(studio.cost)} a session` : 'free'}</span>
        </div>
        <p className="dim small">
          Rooms are rented by the session. The fee comes out of your pocket every time you write.
        </p>
        {STUDIOS.map((s2, i) => {
          const on = i === state.studioLevel
          const tooPoor = state.cash < s2.cost
          return (
            <button
              key={s2.name}
              className={`job pick-row${on ? ' on' : ''}${tooPoor && !on ? ' locked' : ''}`}
              onClick={() => dispatch({ type: 'SELECT_STUDIO', level: i })}
            >
              <div className="grow">
                <div>{s2.name}</div>
                <span className="dim tiny">quality +{s2.quality} · {s2.blurb}</span>
              </div>
              <span className="mono small">{s2.cost === 0 ? 'free' : money(s2.cost)}</span>
            </button>
          )
        })}
      </section>

      <section className="card">
        <div className="row between">
          <h3>Ad campaign</h3>
          <span className="dim tiny">{promoOn > 0 ? `${Math.ceil(promoOn / 1000)}s left` : 'idle'}</span>
        </div>
        <p className="dim small">
          Five minutes of blanket spend. Everything you already have out reaches {TUNE.promoMult}×
          further while it runs. For reach that sticks to one record, book a push before you release
          it.
        </p>
        <Btn block variant={promoOn > 0 ? 'ghost' : 'primary'} disabled={state.cash < cost} onClick={() => dispatch({ type: 'BUY_PROMO' })}>
          {promoOn > 0 ? `Extend · ${money(cost)}` : `Start campaign · ${money(cost)}`}
        </Btn>
      </section>

      <section className="card flat">
        <h3>Numbers</h3>
        <Line label="Cash" value={money(state.cash)} />
        <Line label="Fans" value={num(state.fans)} />
        <Line label="Total streams" value={num(state.totalStreams)} />
        <Line label="Songs written" value={String(state.songs.length)} />
        <Line label="Gigs played" value={String(state.gigsPlayed ?? 0)} />
      </section>

      <section className="card flat">
        <div className="row between">
          <span className="dim small">Start over</span>
          <Btn
            small
            variant="danger"
            onClick={() => {
              if (confirm('Delete this career and start again?')) dispatch({ type: 'RESET' })
            }}
          >
            Reset
          </Btn>
        </div>
      </section>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="row between num-line">
      <span className="dim small">{label}</span>
      <span className="mono small">{value}</span>
    </div>
  )
}
