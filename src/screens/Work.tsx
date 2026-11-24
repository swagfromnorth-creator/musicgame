import React from 'react'
import { GIGS, duration, money, num } from '../game/data'
import { gigReady } from '../game/engine'
import { useGame } from '../game/store'
import { Bar, Btn } from '../ui/parts'

export function Work() {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const job = state.activeJob
  const jobLeft = job ? Math.max(0, job.startedAt + job.durationMs - now) : 0
  const jobPct = job ? 100 - (jobLeft / job.durationMs) * 100 : 0
  const refreshIn = Math.max(0, state.jobsRefreshAt - now)

  return (
    <div className="stack">
      <section className="card">
        <div className="row between">
          <h3>Job</h3>
          <span className="dim tiny">
            {job ? 'working' : `new listings in ${duration(refreshIn)}`}
          </span>
        </div>

        {job && (
          <div className="job active">
            <div className="row between">
              <span>
                {job.emoji} {job.title}
              </span>
              <span className="mono">{duration(jobLeft)}</span>
            </div>
            <Bar value={jobPct} tone="money" height={7} />
            <span className="dim tiny">{money(job.pay)} on completion</span>
          </div>
        )}

        {state.jobs.map((j) => (
          <div className="job" key={j.id}>
            <div className="grow">
              <div className="row gap-sm">
                <span>{j.emoji}</span>
                <span>{j.title}</span>
              </div>
              <span className="dim tiny">
                {money(j.pay)} · takes {duration(j.durationMs)}
              </span>
            </div>
            <Btn small disabled={!!job} onClick={() => dispatch({ type: 'TAKE_JOB', id: j.id })}>
              Take
            </Btn>
          </div>
        ))}
        <p className="dim tiny">
          One shift at a time. Listings are thrown out every 80 seconds — finish one and you can
          take it again.
        </p>
      </section>

      <section className="card">
        <div className="row between">
          <h3>Gigs</h3>
          <span className="dim tiny">{num(state.fans)} fans</span>
        </div>
        {GIGS.map((g) => {
          const ready = gigReady(state, g.id, now)
          const locked = state.fans < g.fansNeeded
          return (
            <div className={`job${locked ? ' locked' : ''}`} key={g.id}>
              <div className="grow">
                <div className="row gap-sm">
                  <span>{g.emoji}</span>
                  <span>{g.name}</span>
                </div>
                <span className="dim tiny">
                  {locked
                    ? `needs ${num(g.fansNeeded)} fans`
                    : `${money(g.pay)} · +${num(g.fans)} fans · boost`}
                </span>
              </div>
              <Btn
                small
                variant={locked ? 'ghost' : 'good'}
                disabled={locked || ready > 0}
                onClick={() => dispatch({ type: 'DO_GIG', id: g.id })}
              >
                {locked ? 'Locked' : ready > 0 ? duration(ready) : 'Play'}
              </Btn>
            </div>
          )
        })}
        <p className="dim tiny">A gig pays, brings fans, and doubles your streaming for two minutes.</p>
      </section>
    </div>
  )
}
