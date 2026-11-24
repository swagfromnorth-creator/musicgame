import React from 'react'
import { STUDIOS, duration } from '../game/data'
import { writeDurationMs } from '../game/engine'
import { useGame } from '../game/store'
import { Bar, Btn } from '../ui/parts'

export function Studio() {
  const { state, dispatch } = useGame()
  const now = Date.now()
  const writing = state.writingStartedAt !== null
  const left = writing ? Math.max(0, state.writingStartedAt! + state.writingDurationMs - now) : 0
  const pct = writing ? 100 - (left / state.writingDurationMs) * 100 : 0
  const nextTime = writeDurationMs(state.songwriting)
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
              It lands in the vault on its own. Songwriting {Math.round(state.songwriting)} speeds
              this up and lifts the number it lands with.
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
        <h3>Skills</h3>
        <Skill
          name="Songwriting"
          value={state.songwriting}
          note="Writes faster, lands better numbers."
        />
        <Skill
          name="Virality"
          value={state.virality}
          note="Reach goes wider and records last longer."
        />
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
          <span className="small">{state.songs.filter((s) => !s.releasedAt).length}</span>
        </div>
      </section>
    </div>
  )
}

function Skill({ name, value, note }: { name: string; value: number; note: string }) {
  return (
    <div className="skill">
      <div className="row between">
        <span>{name}</span>
        <span className="mono">{Math.round(value)}</span>
      </div>
      <Bar value={value} tone="violet" height={5} />
      <span className="dim tiny">{note}</span>
    </div>
  )
}
