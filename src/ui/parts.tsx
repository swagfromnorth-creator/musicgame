import React from 'react'
import { PROMO_TIERS, money } from '../game/data'

export function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled,
  block,
  small,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'good' | 'danger'
  disabled?: boolean
  block?: boolean
  small?: boolean
}) {
  return (
    <button
      className={`btn ${variant}${block ? ' block' : ''}${small ? ' sm' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Bar({ value, tone = 'accent', height = 6 }: { value: number; tone?: string; height?: number }) {
  return (
    <div className="bar" style={{ height }}>
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: `var(--${tone})` }} />
    </div>
  )
}

export function Rating({ value }: { value: number }) {
  const tone = value >= 80 ? 'good' : value >= 60 ? 'ok' : value >= 40 ? 'mid' : 'bad'
  return (
    <span className={`rating ${tone}`} title={`${value}/100`}>
      {value}
    </span>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Sheet({
  open,
  onClose,
  children,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-x" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {children}
      </div>
    </div>
  )
}

/**
 * What the player is buying: reach, at a price. Nothing is charged here —
 * the money leaves on release.
 */
export function PromoPicker({
  value,
  onChange,
  baseReach,
  cash,
}: {
  value: number
  onChange: (tier: number) => void
  baseReach: number
  cash: number
}) {
  const chosen = PROMO_TIERS[value] ?? PROMO_TIERS[0]
  return (
    <div className="promo">
      <div className="row between">
        <span className="dim tiny">Promotion</span>
        <span className="tiny">
          reach{' '}
          <b className="mono">{baseReach}</b>
          {chosen.reach > 0 && (
            <>
              {' '}
              + <b className="mono accent">{chosen.reach}</b> ={' '}
              <b className="mono">{Math.round((baseReach + chosen.reach) * 10) / 10}</b>
            </>
          )}
        </span>
      </div>
      {PROMO_TIERS.map((t, i) => {
        const affordable = t.cost <= cash
        return (
          <button
            key={t.name}
            className={`promo-opt${i === value ? ' on' : ''}${i > 0 && !affordable ? ' short' : ''}`}
            onClick={() => onChange(i)}
          >
            <span className="grow">
              <span className="promo-name">{t.name}</span>
              <span className="dim tiny">{t.blurb}</span>
            </span>
            <span className="promo-cost mono">
              {t.cost === 0 ? 'free' : money(t.cost)}
              {t.reach > 0 && <em>+{t.reach}</em>}
            </span>
          </button>
        )
      })}
      <p className="dim tiny">
        {chosen.cost > 0
          ? `You are agreeing to pay ${money(chosen.cost)} to creators — taken when it releases, not now.`
          : 'Nothing paid, nothing pushed.'}
      </p>
    </div>
  )
}
