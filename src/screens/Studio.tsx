import React from 'react'
import { SKILLS, STUDIOS, TUNE, duration } from '../game/data'
import { trainDurationMs, writeDurationMs } from '../game/engine'
import { useGame } from '../game/store'
import { Bar, Btn } from '../ui/parts'
import type { SkillId } from '../game/types'

export function Studio() {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const writing = state.writingStartedAt !== null
  const left = writing ? Math.max(0, state.writingStartedAt! + state.writingDurationMs - now) : 0
  const pct = writing ? 100 - (left / state.writingDurationMs) * 100 : 0
  const nextTime = writeDurationMs(state.skills)
  const studio = STUDIOS[state.studioLevel]

  return (
    <div className="stack">
      <section className="card hero">
        {writing ? (
          <>
            <div className="row between">
              <h2>Writing</h2>
              <span className="mono big">{duration(left)}</span>
            </div>
            <Bar value={pct} height={8} />
            <p className="dim small">
              It lands in the vault on its own. Songwriting decides the number, rhythm decides how
              long this takes.
            </p>
            <Btn variant="ghost" small onClick={() => dispatch({ type: 'CANCEL_WRITE' })}>
              Scrap it
            </Btn>
          </>
        ) : (
          <>
            <h2>Write a song</h2>
            <p className="dim small">
              {duration(nextTime)} in the {studio.name.toLowerCase()}. It finishes itself — you can
              go and earn while it cooks.
            </p>
            <Btn block onClick={() => dispatch({ type: 'WRITE' })}>
              Start writing · {duration(nextTime)}
            </Btn>
          </>
        )}
      </section>

      <section className="card">
        <div className="row between">
          <h3>Training</h3>
          <span className="dim tiny">{state.training ? 'one at a time' : 'pick one'}</span>
        </div>
        {SKILLS.map((skill) => {
          const level = state.skills[skill.id]
          const maxed = level >= TUNE.maxSkill
          const active = state.training?.skill === skill.id
          const tLeft = active
            ? Math.max(0, state.training!.startedAt + state.training!.durationMs - now)
            : 0
          const tPct = active ? 100 - (tLeft / state.training!.durationMs) * 100 : 0
          return (
            <div className="skill" key={skill.id}>
              <div className="row between">
                <span>
                  {skill.emoji} {skill.name}
                </span>
                <span className="mono">
                  {level}
                  <em className="dim"> / {TUNE.maxSkill}</em>
                </span>
              </div>
              {active ? (
                <>
                  <Bar value={tPct} tone="violet" height={5} />
                  <div className="row between">
                    <span className="dim tiny">training… {duration(tLeft)}</span>
                    <Btn small variant="ghost" onClick={() => dispatch({ type: 'STOP_TRAIN' })}>
                      Stop
                    </Btn>
                  </div>
                </>
              ) : (
                <>
                  <Bar value={level} tone="violet" height={5} />
                  <div className="row between">
                    <span className="dim tiny">{skill.blurb}</span>
                    <Btn
                      small
                      variant="ghost"
                      disabled={maxed || !!state.training}
                      onClick={() => dispatch({ type: 'TRAIN', skill: skill.id as SkillId })}
                    >
                      {maxed ? 'Maxed' : duration(trainDurationMs(level))}
                    </Btn>
                  </div>
                </>
              )}
            </div>
          )
        })}
        <p className="dim tiny">
          Each level takes longer than the last, and you can only train one thing at once.
        </p>
      </section>

      <section className="card">
        <h3>Recent</h3>
        {state.log.slice(0, 3).map((e) => (
          <div className="row between log-row" key={e.id}>
            <span className={`small log-${e.kind}`}>{e.text}</span>
            <span className="dim tiny">{Math.max(0, Math.round((now - e.at) / 1000))}s</span>
          </div>
        ))}
      </section>

      <section className="card flat">
        <div className="row between">
          <span className="dim small">Studio</span>
          <span className="small">{studio.name}</span>
        </div>
        <div className="row between">
          <span className="dim small">Quality bonus</span>
          <span className="small">+{studio.quality}</span>
        </div>
        <div className="row between">
          <span className="dim small">Songs in vault</span>
          <span className="small">{state.songs.filter((s) => !s.releasedAt && !s.albumId).length}</span>
        </div>
      </section>
    </div>
  )
}
