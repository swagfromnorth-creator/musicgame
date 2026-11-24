import { useState } from 'react'
import { money } from '../game/data'
import { fameOf } from '../game/engine'
import {
  REPLIES,
  ROOMS,
  TOPIC_INFO,
  TRAITS,
  canAskFavor,
  hourOfDay,
  oddsLabel,
  peopleInRoom,
  replyOdds,
  roleOf,
  roomOf,
  roomStatus,
  topicUnlocked,
} from '../game/people'
import type { GameState, Person, TopicId } from '../game/types'
import { Btn, Sheet } from '../components/Shared'
import { useGame } from '../game/store'

export function Scene({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const [openId, setOpenId] = useState<string | null>(null)
  const open = s.people.find((p) => p.id === openId) ?? null

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1">The Scene</h1>
          <div className="tiny muted">
            {clock(s.hour)} · {s.people.filter((p) => p.met).length}/{s.people.length} people know you
          </div>
        </div>
        {s.room && (
          <Btn sm variant="ghost" onClick={() => dispatch({ type: 'LEAVE_ROOM' })}>
            Leave
          </Btn>
        )}
      </div>

      {s.room ? <RoomView s={s} onPick={setOpenId} /> : <RoomPicker s={s} />}

      <PersonSheet person={open} onClose={() => setOpenId(null)} s={s} />
    </>
  )
}

function clock(hour: number): string {
  const h = hourOfDay(hour)
  const mm = Math.floor((hour % 1) * 60)
  const suffix = h < 12 ? 'am' : 'pm'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}:${String(mm).padStart(2, '0')}${suffix}`
}

// ---------------------------------------------------------------------------

function RoomPicker({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const fame = fameOf(s)

  return (
    <>
      <div className="card tight" style={{ marginBottom: 12 }}>
        <div className="row between" style={{ marginBottom: 6 }}>
          <span className="tiny muted">Rooms open and close on a schedule</span>
          <span className="chip" style={{ fontSize: 9.5 }}>
            {clock(s.hour)}
          </span>
        </div>
        <div className="tiny muted" style={{ fontSize: 10.5, lineHeight: 1.5 }}>
          Nobody gets famous alone. Go where the people who can help you are standing, and stay
          long enough to be worth remembering.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {ROOMS.map((r) => {
          const status = roomStatus(r, s.hour)
          const gated = fame < r.gateFame
          const broke = s.money < r.cover
          const tired = s.energy < r.energy
          const inside = peopleInRoom(s.people, r.id, s.hour, s.week)
          const known = inside.filter((p) => p.met)
          const strangers = inside.length - known.length
          const blocked = !status.open || gated || broke || tired

          return (
            <div className="card tight" key={r.id} style={{ opacity: blocked ? 0.6 : 1 }}>
              <div className="row between" style={{ marginBottom: 7 }}>
                <div className="row" style={{ gap: 9 }}>
                  <span style={{ fontSize: 19 }}>{r.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.name}</div>
                    <div className="tiny muted">{r.scene}</div>
                  </div>
                </div>
                <span
                  className={`chip ${status.open ? 'green' : ''}`}
                  style={{ fontSize: 9, flex: 'none' }}
                >
                  {status.open ? `open ${status.inHours}h` : `in ${status.inHours}h`}
                </span>
              </div>

              <div className="row" style={{ gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
                {known.slice(0, 4).map((p) => (
                  <span key={p.id} className="chip" style={{ fontSize: 9 }}>
                    {p.name.split(' ')[0]} · {roleOf(p.role).emoji}
                  </span>
                ))}
                {strangers > 0 && (
                  <span className="chip violet" style={{ fontSize: 9 }}>
                    {strangers} stranger{strangers === 1 ? '' : 's'}
                  </span>
                )}
                {inside.length === 0 && <span className="tiny muted">nobody worth knowing is in tonight</span>}
              </div>

              <div className="row between">
                <div className="tiny muted">
                  {r.cover > 0 ? `${money(r.cover)} cover` : 'free entry'} · {r.energy}⚡
                  {gated && <span style={{ color: '#fbbf24' }}> · needs fame {r.gateFame}</span>}
                </div>
                <Btn
                  sm
                  variant={blocked ? 'flat' : 'primary'}
                  disabled={blocked}
                  onClick={() => dispatch({ type: 'ENTER_ROOM', room: r.id })}
                >
                  {!status.open ? 'Closed' : gated ? 'Locked' : broke ? 'No cash' : tired ? 'Too tired' : 'Walk in'}
                </Btn>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------

function RoomView({ s, onPick }: { s: GameState; onPick: (id: string) => void }) {
  const def = roomOf(s.room!)
  const inside = peopleInRoom(s.people, s.room!, s.hour, s.week)
  const known = inside.filter((p) => p.met).length

  return (
    <>
      <div className="hero" style={{ padding: 14, marginBottom: 12 }}>
        <div className="row between">
          <div>
            <div className="chip pink" style={{ marginBottom: 6 }}>
              {def.emoji} you are here
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{def.name}</div>
            <div className="tiny muted" style={{ maxWidth: 260 }}>
              {def.blurb}
            </div>
          </div>
        </div>
        <div className="row" style={{ gap: 12, marginTop: 10 }}>
          <div className="tiny muted">
            <b style={{ color: '#fff' }}>{inside.length}</b> in the room
          </div>
          <div className="tiny muted">
            <b style={{ color: '#fff' }}>{known}</b> know your name
          </div>
          <div className="tiny muted">
            closes in <b style={{ color: '#fff' }}>{roomStatus(def, s.hour).inHours}h</b>
          </div>
        </div>
      </div>

      {inside.length === 0 ? (
        <div className="card">
          <div className="empty">
            The room is empty.
            <br />
            Wrong hour, wrong night. Come back when the lights are on.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {inside.map((p) => (
            <PersonCard key={p.id} p={p} onClick={() => onPick(p.id)} />
          ))}
        </div>
      )}

      <div className="tiny muted" style={{ textAlign: 'center', marginTop: 14, fontSize: 10.5 }}>
        Everyone in this room is doing something for someone. Find out what.
      </div>
    </>
  )
}

function PersonCard({ p, onClick }: { p: Person; onClick: () => void }) {
  const role = roleOf(p.role)
  const known = p.met
  const standing =
    p.affinity > 45 ? { label: 'close', color: '#4ade80' } :
    p.affinity > 15 ? { label: 'warm', color: '#a3e635' } :
    p.affinity > -10 ? { label: 'neutral', color: '#a5b4fc' } :
    p.affinity > -40 ? { label: 'cold', color: '#fbbf24' } :
    { label: 'enemy', color: '#f43f5e' }

  return (
    <button className="card tight" onClick={onClick} style={{ textAlign: 'left', width: '100%' }}>
      <div className="row" style={{ gap: 10 }}>
        <div
          className="art"
          style={{
            width: 42,
            height: 42,
            borderRadius: 99,
            fontSize: 17,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(circle at 32% 26%, hsl(${p.hue} 82% 58%), hsl(${(p.hue + 40) % 360} 60% 22%))`,
          }}
        >
          {role.emoji}
        </div>
        <div className="grow">
          <div className="row" style={{ gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{known ? p.name : 'Someone'}</span>
            <span className="tiny muted">{known ? p.title : role.name}</span>
            {p.grudge > 40 && <span className="chip red" style={{ fontSize: 8, padding: '1px 5px' }}>grudge</span>}
          </div>
          <div className="tiny muted truncate">
            {known ? p.hook : `a ${role.name.toLowerCase()} — you have not met`}
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: 'none' }}>
          {known ? (
            <>
              <div className="tiny" style={{ color: standing.color, fontWeight: 700 }}>
                {standing.label}
              </div>
              <div className="tiny" style={{ color: 'var(--dim2)', fontSize: 9 }}>
                aff {Math.round(p.affinity)}
              </div>
            </>
          ) : (
            <span className="chip">{'★'.repeat(p.tier)}</span>
          )}
        </div>
      </div>
      {known && (
        <div className="row" style={{ gap: 5, marginTop: 8 }}>
          <Meter value={p.respect} label="respect" color="#38bdf8" />
          <Meter value={p.trust} label="trust" color="#4ade80" />
          <Meter value={p.patience} label="patience" color="#fbbf24" />
        </div>
      )}
    </button>
  )
}

function Meter({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="grow">
      <div style={{ height: 3, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, value))}%`, background: color, borderRadius: 99 }} />
      </div>
      <div style={{ fontSize: 8, color: 'var(--dim2)', marginTop: 2, letterSpacing: '.04em' }}>{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function PersonSheet({ person, onClose, s }: { person: Person | null; onClose: () => void; s: GameState }) {
  const { dispatch } = useGame()
  const [tab, setTab] = useState<'talk' | 'favour'>('talk')
  if (!person) return null
  const p = s.people.find((x) => x.id === person.id) ?? person
  const role = roleOf(p.role)
  const gate = canAskFavor(p)
  const skill = (s.skills.charisma + s.skills.performance) / 2
  const dialogueHere = s.dialogue?.personId === p.id ? s.dialogue : null
  const beatHere = s.beat?.personId === p.id ? s.beat : null
  const price = Math.round(30 + (roomOf(p.room).cover ?? 0) * 0.4 + p.tier * 12)

  return (
    <Sheet open={!!person} onClose={onClose}>
      <div className="row" style={{ gap: 12, marginBottom: 10 }}>
        <div
          className="art"
          style={{
            width: 58,
            height: 58,
            borderRadius: 99,
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `radial-gradient(circle at 32% 26%, hsl(${p.hue} 82% 58%), hsl(${(p.hue + 40) % 360} 60% 22%))`,
          }}
        >
          {role.emoji}
        </div>
        <div className="grow">
          <div className="h1" style={{ fontSize: 22, lineHeight: 1 }}>
            {p.name}
          </div>
          <div className="tiny muted">
            {p.title} · tier {'★'.repeat(p.tier)}
          </div>
          <div className="row" style={{ gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
            {p.traits.map((t) => {
              const def = TRAITS.find((x) => x.id === t)
              return (
                <span key={t} className="chip" style={{ fontSize: 8.5, padding: '2px 6px' }}>
                  {def?.name}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <div className="tiny" style={{ color: '#c9c8d8', lineHeight: 1.5, marginBottom: 8 }}>
        {p.blurb}
      </div>
      <div className="tiny muted" style={{ marginBottom: 12 }}>
        {p.traits
          .map((t) => TRAITS.find((x) => x.id === t)?.tell)
          .filter(Boolean)
          .map((t) => `${t}.`)
          .join(' ')}
      </div>

      <div className="row" style={{ gap: 6, marginBottom: 12 }}>
        <StatSmall k="affinity" v={Math.round(p.affinity)} color="#ff2d78" />
        <StatSmall k="respect" v={Math.round(p.respect)} color="#38bdf8" />
        <StatSmall k="trust" v={Math.round(p.trust)} color="#4ade80" />
        <StatSmall k="patience" v={Math.round(p.patience)} color="#fbbf24" />
      </div>

      {beatHere ? (
        <div
          className="card"
          style={{
            borderColor: beatHere.success ? 'rgba(74,222,128,.4)' : 'rgba(244,63,94,.4)',
            background: beatHere.success ? 'rgba(74,222,128,.06)' : 'rgba(244,63,94,.06)',
            marginBottom: 12,
          }}
        >
          <div className="row between" style={{ marginBottom: 6 }}>
            <span className="chip" style={{ fontSize: 9, color: beatHere.success ? '#86efac' : '#fda4af' }}>
              {beatHere.success ? 'landed' : 'did not land'}
            </span>
            <span className="tiny muted">
              {beatHere.aff > 0 ? '+' : ''}
              {beatHere.aff} aff · {beatHere.resp > 0 ? '+' : ''}
              {beatHere.resp} resp · {beatHere.trust > 0 ? '+' : ''}
              {beatHere.trust} trust
            </span>
          </div>
          <div style={{ fontSize: 12.8, lineHeight: 1.5, color: '#e6e5f0' }}>{beatHere.text}</div>
          <Btn block sm variant="flat" style={{ marginTop: 10 }} onClick={() => dispatch({ type: 'CLOSE_BEAT' })}>
            Continue
          </Btn>
        </div>
      ) : dialogueHere ? (
        <>
          <div className="card" style={{ background: 'rgba(255,255,255,.04)', marginBottom: 10 }}>
            <div className="tiny muted" style={{ marginBottom: 4 }}>
              {p.name} says
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.5, fontStyle: 'italic', color: '#e6e5f0' }}>
              {dialogueHere.line}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {REPLIES[dialogueHere.topic].map((r) => {
              const odds = replyOdds(p, dialogueHere.topic, r, skill)
              const ol = oddsLabel(odds)
              const tooTired = s.energy < r.energy
              return (
                <button
                  key={r.id}
                  className="opt"
                  disabled={tooTired}
                  onClick={() => dispatch({ type: 'REPLY', replyId: r.id })}
                  style={{ opacity: tooTired ? 0.45 : 1, alignItems: 'flex-start' }}
                >
                  <span className="grow">
                    <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>{r.label}</div>
                  </span>
                  <span className="tiny" style={{ color: ol.color, fontWeight: 700, flex: 'none' }}>
                    {ol.label}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <>
          <div className="row" style={{ gap: 5, marginBottom: 10 }}>
            {(
              [
                ['talk', 'Talk'],
                ['favour', 'What they can do'],
              ] as ['talk' | 'favour', string][]
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

          {tab === 'talk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(Object.keys(TOPIC_INFO) as TopicId[]).map((t) => {
                const info = TOPIC_INFO[t]
                const open = topicUnlocked(p, t)
                return (
                  <button
                    key={t}
                    className="opt"
                    disabled={!open.ok}
                    onClick={() => dispatch({ type: 'TALK', personId: p.id, topic: t })}
                    style={{ opacity: open.ok ? 1 : 0.42 }}
                  >
                    <span style={{ fontSize: 16 }}>{info.emoji}</span>
                    <span className="grow">
                      <div className="opt-title">{info.name}</div>
                      <div className="opt-sub">{open.ok ? info.blurb : open.why}</div>
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {tab === 'favour' && (
            <>
              <div className="card" style={{ background: 'rgba(255,255,255,.03)', marginBottom: 10 }}>
                <div className="row between" style={{ marginBottom: 3 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5 }}>{role.favor}</div>
                  <span className="tiny" style={{ color: 'var(--dim2)' }}>
                    asked {p.favors}×
                  </span>
                </div>
                <div className="tiny muted" style={{ lineHeight: 1.45 }}>
                  {role.favorDesc}
                </div>
                <div className="divider" />
                <div className="row" style={{ gap: 10 }}>
                  <Req ok={p.affinity >= gate.req.aff} label={`affinity ${gate.req.aff}`} have={p.affinity} />
                  <Req ok={p.respect >= gate.req.resp} label={`respect ${gate.req.resp}`} have={p.respect} />
                  <Req ok={p.trust >= gate.req.trust} label={`trust ${gate.req.trust}`} have={p.trust} />
                </div>
              </div>
              <Btn
                block
                variant={gate.ok ? 'gold' : 'flat'}
                disabled={!gate.ok || s.energy < 4}
                onClick={() => dispatch({ type: 'FAVOR', personId: p.id })}
              >
                {gate.ok ? `Call in the favour (${4}⚡, costs goodwill)` : gate.reason}
              </Btn>
              <div className="tiny muted" style={{ textAlign: 'center', marginTop: 7, lineHeight: 1.5 }}>
                You get one ask a week, and every favour you have already called in makes the next
                one harder to ask for. People keep count.
              </div>
            </>
          )}
        </>
      )}

      <div className="divider" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <button
          className="opt"
          disabled={s.money < price || s.energy < 2}
          onClick={() => dispatch({ type: 'BUY_ROUND', personId: p.id })}
          style={{ opacity: s.money < price ? 0.45 : 1 }}
        >
          <span style={{ fontSize: 15 }}>🍸</span>
          <span className="grow">
            <div className="opt-title">Buy a round</div>
            <div className="opt-sub">Small, reliable warmth. And it buys back patience.</div>
          </span>
          <span className="tiny" style={{ color: '#f8d98b', fontWeight: 700 }}>
            {money(price)}
          </span>
        </button>

        <button
          className="opt"
          disabled={s.money < 120 + p.tier * 90 || s.energy < 10}
          onClick={() => dispatch({ type: 'HELP_OUT', personId: p.id })}
          style={{ opacity: s.money < 120 + p.tier * 90 ? 0.45 : 1 }}
        >
          <span style={{ fontSize: 15 }}>🤲</span>
          <span className="grow">
            <div className="opt-title">Help them out</div>
            <div className="opt-sub">Solve their problem today. Trust and patience, in bulk.</div>
          </span>
          <span className="tiny" style={{ color: '#f8d98b', fontWeight: 700 }}>
            {money(120 + p.tier * 90)}
          </span>
        </button>

        {p.rivalId && p.met && (
          <button
            className="opt"
            disabled={s.energy < 22}
            onClick={() => {
              dispatch({ type: 'SOCIAL', rivalId: p.rivalId!, kind: 'diss' })
              onClose()
            }}
            style={{ borderColor: 'rgba(244,63,94,.3)' }}
          >
            <span style={{ fontSize: 15 }}>🔥</span>
            <span className="grow">
              <div className="opt-title">Drop a diss track on them</div>
              <div className="opt-sub">Free streams, permanent enemy. This cannot be undone.</div>
            </span>
            <span className="tiny" style={{ color: '#fda4af', fontWeight: 700 }}>
              22⚡
            </span>
          </button>
        )}

        <button
          className="opt"
          onClick={() => {
            if (window.confirm(`Burn ${p.name}? They will never work with you again.`)) {
              dispatch({ type: 'BURN_BRIDGE', personId: p.id })
              onClose()
            }
          }}
          style={{ borderColor: 'rgba(244,63,94,.22)' }}
        >
          <span style={{ fontSize: 15 }}>💥</span>
          <span className="grow">
            <div className="opt-title" style={{ color: '#fda4af' }}>
              Burn the bridge
            </div>
            <div className="opt-sub">Say the thing you are thinking. Watch what it costs.</div>
          </span>
        </button>
      </div>
    </Sheet>
  )
}

function StatSmall({ k, v, color }: { k: string; v: number; color: string }) {
  return (
    <div className="grow" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
      <div style={{ fontSize: 8, color: 'var(--dim2)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{k}</div>
    </div>
  )
}

function Req({ ok, label, have }: { ok: boolean; label: string; have: number }) {
  return (
    <div className="row" style={{ gap: 3 }}>
      <span style={{ fontSize: 10, color: ok ? '#4ade80' : '#f87171' }}>{ok ? '✓' : '✕'}</span>
      <span className="tiny" style={{ color: ok ? 'var(--dim)' : '#fda4af', fontSize: 9.5 }}>
        {label}
        <span style={{ color: 'var(--dim2)' }}> ({Math.round(have)})</span>
      </span>
    </div>
  )
}
