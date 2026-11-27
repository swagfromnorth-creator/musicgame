import React from 'react'
import { GIGS, JOB_TIERS, duration, money, num } from '../game/data'
import { gigReady, unlockedTiers } from '../game/engine'
import { useGame } from '../game/store'
import { Bar, Btn } from '../ui/parts'

export function Work() {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const job = state.activeJob
  const jobLeft = job ? Math.max(0, job.startedAt + job.durationMs - now) : 0
  const jobPct = job ? 100 - (jobLeft / job.durationMs) * 100 : 0
  const refreshIn = Math.max(0, state.jobsRefreshAt - now)
  const tiers = unlockedTiers(state.fans)
  const nextTier = JOB_TIERS[tiers]

  return (
    <div className="stack">
      <section className="card">
        <div className="row between">
          <h3>Work</h3>
          <span className="dim tiny">{job ? 'on shift' : `new in ${duration(refreshIn)}`}</span>
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

        {state.jobQueue && (
          <div className="job queued">
            <div className="grow">
              <div className="row gap-sm">
                <span>{state.jobQueue.emoji}</span>
                <span>{state.jobQueue.title}</span>
                <span className="pill">up next</span>
              </div>
              <span className="dim tiny">
                {money(state.jobQueue.pay)} · starts when this shift ends
              </span>
            </div>
            <Btn small variant="ghost" onClick={() => dispatch({ type: 'CLEAR_QUEUE' })}>
              Drop
            </Btn>
          </div>
        )}

        {state.jobs.map((j) => {
          const full = !!job && !!state.jobQueue
          return (
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
              <Btn small disabled={full} onClick={() => dispatch({ type: 'TAKE_JOB', id: j.id })}>
                {job ? 'Queue' : 'Take'}
              </Btn>
            </div>
          )
        })}

        <p className="dim tiny">
          {nextTier
            ? `At ${num(nextTier.fansNeeded)} fans the work gets better than this.`
            : 'This is as good as the work gets. You should be past needing it.'}
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
