import React, { useEffect } from 'react'
import { HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, money, ui } from '../game/data'
import { gradeFor } from '../game/engine'
import type { Portrait } from '../game/types'

export function Art({
  hue,
  label,
  size = 44,
  radius,
}: {
  hue: number
  label: string
  size?: number
  radius?: number
}) {
  const h = ((hue % 360) + 360) % 360
  return (
    <div
      className="art"
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? Math.max(8, size * 0.22),
        background: `radial-gradient(120% 130% at 18% 8%, hsl(${h} 95% 64% / 0.95), transparent 55%),
                     radial-gradient(110% 100% at 88% 92%, hsl(${(h + 62) % 360} 88% 52% / 0.92), transparent 62%),
                     linear-gradient(165deg, #101018, #22222f)`,
      }}
    >
      {size >= 40 && <span className="art-label">{label}</span>}
    </div>
  )
}

export function Grade({ grade }: { grade: string }) {
  const g = gradeFor({ S: 95, A: 82, B: 70, C: 55, D: 40, F: 20 }[grade] ?? 50)
  return (
    <span className="grade" style={{ background: `${g.color}22`, color: g.color, border: `1px solid ${g.color}44` }}>
      {grade}
    </span>
  )
}

export function Btn({
  children,
  onClick,
  variant = 'flat',
  disabled,
  block,
  sm,
  style,
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  variant?: 'primary' | 'gold' | 'ghost' | 'danger' | 'flat'
  disabled?: boolean
  block?: boolean
  sm?: boolean
  style?: React.CSSProperties
}) {
  return (
    <button
      className={`btn ${variant} ${block ? 'block' : ''} ${sm ? 'sm' : ''}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  )
}

export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title && (
          <div className="card-h" style={{ marginBottom: 12 }}>
            <h2 className="h1" style={{ fontSize: 22 }}>
              {title}
            </h2>
            <button onClick={onClose} className="chip" style={{ cursor: 'pointer' }}>
              Close
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Bar({ value, max = 100, color = 'linear-gradient(90deg,#ff2d78,#a855f7)', height }: {
  value: number
  max?: number
  color?: string
  height?: number
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="bar" style={height ? { height } : undefined}>
      <i style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Stat({ k, v, color }: { k: string; v: React.ReactNode; color?: string }) {
  return (
    <div className="stat-tile">
      <div className="k">{k}</div>
      <div className="v" style={color ? { color } : undefined}>
        {v}
      </div>
    </div>
  )
}

export function Money({ n, plus }: { n: number; plus?: boolean }) {
  return (
    <span style={{ color: n < 0 ? '#fda4af' : '#f8d98b', fontVariantNumeric: 'tabular-nums' }}>
      {plus && n > 0 ? '+' : ''}
      {money(n)}
    </span>
  )
}

export function PortraitArt({
  p,
  size = 64,
  hue = 330,
}: {
  p: Portrait
  size?: number
  hue?: number
}) {
  const skin = SKIN_TONES[p.skin % SKIN_TONES.length]
  const hair = HAIR_COLORS[p.hairColor % HAIR_COLORS.length]
  const outfit = OUTFIT_COLORS[p.outfit % OUTFIT_COLORS.length]
  const style = p.hairStyle % 5
  const acc = p.accessory % 4
  const eye = ['#2b2b33', '#3f6f5a', '#4a5f8a', '#6b4a2a'][p.eyes % 4]

  return (
    <svg
      className="portrait"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ background: `radial-gradient(120% 120% at 30% 0%, hsl(${hue} 80% 42% / .55), #14141d 70%)` }}
    >
      <defs>
        <linearGradient id={`sk${p.skin}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skin} />
          <stop offset="100%" stopColor={skin} stopOpacity="0.82" />
        </linearGradient>
      </defs>
      {/* shoulders */}
      <path d={`M8 100 C14 78 32 70 50 70 C68 70 86 78 92 100 Z`} fill={outfit} />
      <path d={`M42 66 h16 v10 c0 4 -16 4 -16 0 z`} fill={skin} opacity="0.9" />
      {/* neck */}
      <rect x="43" y="58" width="14" height="12" rx="4" fill={skin} />
      {/* ears */}
      <ellipse cx="32" cy="47" rx="4" ry="5.5" fill={skin} />
      <ellipse cx="68" cy="47" rx="4" ry="5.5" fill={skin} />
      {/* head */}
      <ellipse cx="50" cy="44" rx="18.5" ry="21" fill={`url(#sk${p.skin})`} />
      {/* hair */}
      {style === 0 && (
        <path d="M31 42 C31 22 69 22 69 42 C69 34 62 30 50 30 C38 30 31 34 31 42 Z" fill={hair} />
      )}
      {style === 1 && (
        <>
          <path d="M29 46 C29 20 71 20 71 46 L71 56 C71 52 66 44 50 44 C34 44 29 52 29 56 Z" fill={hair} />
          <path d="M29 44 C26 56 27 66 30 70 L34 70 C31 60 31 50 33 44 Z" fill={hair} />
          <path d="M71 44 C74 56 73 66 70 70 L66 70 C69 60 69 50 67 44 Z" fill={hair} />
        </>
      )}
      {style === 2 && (
        <>
          <path d="M28 44 C28 18 72 18 72 44 L72 74 C66 66 62 50 50 48 C38 50 34 66 28 74 Z" fill={hair} />
        </>
      )}
      {style === 3 && (
        <>
          <circle cx="34" cy="30" r="8" fill={hair} />
          <circle cx="50" cy="25" r="9" fill={hair} />
          <circle cx="66" cy="30" r="8" fill={hair} />
          <circle cx="28" cy="42" r="7" fill={hair} />
          <circle cx="72" cy="42" r="7" fill={hair} />
          <path d="M33 40 C33 26 67 26 67 40 C67 32 60 28 50 28 C40 28 33 32 33 40 Z" fill={hair} />
        </>
      )}
      {style === 4 && (
        <>
          <path d="M31 40 C31 21 69 21 69 40 C69 33 60 29 50 29 C40 29 31 33 31 40 Z" fill={hair} />
          <circle cx="50" cy="20" r="6.5" fill={hair} />
        </>
      )}
      {/* brows */}
      <path d="M39 39.5 q4 -2.4 8 -0.4" stroke={hair} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
      <path d="M53 39.1 q4 -2 8 0.4" stroke={hair} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.8" />
      {/* eyes */}
      <ellipse cx="43" cy="46" rx="2.3" ry="2.6" fill={eye} />
      <ellipse cx="57" cy="46" rx="2.3" ry="2.6" fill={eye} />
      {acc === 1 && (
        <>
          <rect x="35" y="42" width="13" height="8" rx="2" fill="#0b0b10" opacity="0.92" />
          <rect x="52" y="42" width="13" height="8" rx="2" fill="#0b0b10" opacity="0.92" />
          <rect x="48" y="45" width="4" height="1.6" fill="#0b0b10" opacity="0.92" />
        </>
      )}
      {/* nose + mouth */}
      <path d="M50 48 v4" stroke={skin} strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />
      <path d="M46 55 q4 3.4 8 0" stroke="#7a3b3b" strokeWidth="1.9" fill="none" strokeLinecap="round" opacity="0.75" />
      {acc === 2 && (
        <>
          <circle cx="32" cy="53" r="2.2" fill="#f5c451" />
          <circle cx="68" cy="53" r="2.2" fill="#f5c451" />
        </>
      )}
      {acc === 3 && (
        <path d="M36 72 q14 12 28 0" stroke="#f5c451" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
        </path>
      )}
    </svg>
  )
}

export function Sparkline({ data, color }: { data: number[]; color?: string }) {
  const max = Math.max(1, ...data)
  return (
    <div className="spark">
      {data.map((d, i) => (
        <i
          key={i}
          style={{
            height: `${Math.max(4, (d / max) * 100)}%`,
            background: color ?? undefined,
            opacity: 0.45 + (i / Math.max(1, data.length - 1)) * 0.55,
          }}
        />
      ))}
    </div>
  )
}

export function Formatted({ value, kind }: { value: number; kind?: 'money' | 'num' }) {
  return <>{kind === 'money' ? money(value) : ui(value)}</>
}
