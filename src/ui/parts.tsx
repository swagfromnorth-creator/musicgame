import React from 'react'

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
