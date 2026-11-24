import { ACTIVITIES, SKILL_INFO, money, ui } from '../game/data'
import { activityCooldownLeft, activityFollowersGain, activityPay, fameOf, skillUpCost } from '../game/engine'
import type { GameState, SkillKey } from '../game/types'
import { Bar, Btn } from '../components/Shared'
import { useGame } from '../game/store'

const ORDER: SkillKey[] = ['songwriting', 'vocals', 'performance', 'production', 'charisma']

export function Career({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const fame = fameOf(s)

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1">The Grind</h1>
          <div className="tiny muted">Skills compound. Energy is the real currency.</div>
        </div>
        <Btn sm variant="flat" onClick={() => dispatch({ type: 'REST' })}>
          🛌 Skip to tomorrow
        </Btn>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 7 }}>
          <div className="h2">Energy</div>
          <div className="tiny" style={{ fontWeight: 700 }}>
            {Math.floor(s.energy)} / {s.maxEnergy}
          </div>
        </div>
        <Bar
          value={s.energy}
          max={s.maxEnergy}
          color={
            s.energy > 55
              ? 'linear-gradient(90deg,#facc15,#4ade80)'
              : s.energy > 22
                ? 'linear-gradient(90deg,#fb923c,#facc15)'
                : 'linear-gradient(90deg,#ef4444,#fb923c)'
          }
        />
        <div className="row" style={{ marginTop: 11, gap: 8 }}>
          <Meter label="Health" value={s.health} color="linear-gradient(90deg,#f43f5e,#4ade80)" />
          <Meter label="Exposure" value={s.exposure} color="linear-gradient(90deg,#8b5cf6,#22d3ee)" />
          <Meter label="Controversy" value={s.controversy} color="linear-gradient(90deg,#f43f5e,#f59e0b)" />
        </div>
        <div className="tiny muted" style={{ marginTop: 9 }}>
          Age {s.age} · health {Math.round(s.health)} · {fame > 60 ? 'the schedule is brutal at this level' : 'the schedule is survivable'}
        </div>
      </div>

      <div className="section-title">
        <h2>Skills</h2>
        <div className="line" />
      </div>

      <div className="card tight">
        {ORDER.map((k) => {
          const info = SKILL_INFO[k]
          const cost = skillUpCost(s.skills[k])
          const disabled = s.money < cost || s.energy < 10
          return (
            <div key={k} style={{ padding: '9px 2px', borderBottom: '1px solid rgba(255,255,255,.055)' }}>
              <div className="row between" style={{ marginBottom: 5 }}>
                <div className="row" style={{ gap: 7 }}>
                  <span style={{ fontSize: 14 }}>{info.emoji}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>{info.name}</span>
                  <span className="tiny muted">{info.blurb}</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, color: info.color, fontVariantNumeric: 'tabular-nums' }}>
                  {s.skills[k].toFixed(1)}
                </span>
              </div>
              <div className="row" style={{ gap: 9 }}>
                <div className="grow">
                  <Bar value={s.skills[k]} color={`linear-gradient(90deg,${info.color}88,${info.color})`} height={5} />
                </div>
                <button
                  className="btn sm flat"
                  style={{ padding: '5px 9px', fontSize: 11, opacity: disabled ? 0.4 : 1 }}
                  disabled={disabled}
                  onClick={() => dispatch({ type: 'TRAIN', skill: k })}
                >
                  Train {money(cost)}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-title">
        <h2>How you spend the day</h2>
        <div className="line" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ACTIVITIES.map((a) => {
          const locked = a.minFame !== undefined && fame < a.minFame
          const fg = activityFollowersGain(s, a.id)
          const cdLeft = activityCooldownLeft(s, a)
          const disabled = locked || cdLeft > 0 || s.money < a.cost || (a.energy < 0 && s.energy < -a.energy)
          const parts: string[] = []
          if (cdLeft > 0) parts.push(`ready in ${Math.ceil(cdLeft)}h`)
          if (fg > 0) parts.push(`+${ui(fg)} followers`)
          if (a.money) parts.push(`~${money(activityPay(s, a.id))}`)
          if (a.skill && a.xp) parts.push(`+${SKILL_INFO[a.skill].name.toLowerCase()}`)
          if (a.hype) parts.push(`+${a.hype} hype`)
          if (a.health) parts.push(`${a.health > 0 ? '+' : ''}${a.health} health`)
          if (a.energy > 0) parts.push(`+${a.energy} energy`)
          return (
            <button
              key={a.id}
              className="card tight"
              disabled={disabled}
              onClick={() => dispatch({ type: 'ACTIVITY', id: a.id })}
              style={{
                textAlign: 'left',
                opacity: disabled ? 0.42 : 1,
                display: 'flex',
                gap: 11,
                alignItems: 'center',
                width: '100%',
              }}
            >
              <span style={{ fontSize: 20, flex: 'none', width: 26, textAlign: 'center' }}>{a.emoji}</span>
              <div className="grow">
                <div className="row" style={{ gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{a.name}</span>
                  {locked && <span className="chip" style={{ fontSize: 9 }}>fame {a.minFame}</span>}
                </div>
                <div className="tiny muted">{a.blurb}</div>
                <div className="tiny" style={{ color: '#a5b4fc', marginTop: 2 }}>
                  {parts.join(' · ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                {a.cost > 0 && <div className="tiny" style={{ color: '#f8d98b', fontWeight: 700 }}>{money(a.cost)}</div>}
                {a.energy < 0 && <div className="tiny" style={{ color: '#ff9ec4', fontWeight: 700 }}>{a.energy}⚡</div>}
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="grow">
      <div className="tiny" style={{ color: 'var(--dim)', marginBottom: 3, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 700 }}>
        {label}
      </div>
      <Bar value={value} color={color} height={4} />
    </div>
  )
}
