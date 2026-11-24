import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { advance, initialState } from './engine'
import { reducer } from './reducer'
import type { Action, GameState } from './types'

const SAVE_KEY = 'starmaker.v1.save'

function load(): GameState {
  const now = Date.now()
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SAVE_KEY) : null
    if (raw) {
      const parsed = JSON.parse(raw) as GameState
      if (parsed && parsed.version === 1 && Array.isArray(parsed.songs)) {
        // reopen the world: everything that happened while away still happens
        const s: GameState = { ...parsed }
        advance(s, now)
        return s
      }
    }
  } catch {
    /* a corrupt save is just a new game */
  }
  return initialState(now)
}

interface Ctx {
  state: GameState
  dispatch: React.Dispatch<Action>
}
const GameCtx = createContext<Ctx | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const savedAt = useRef(0)

  // the heartbeat: four ticks a second is plenty for this game
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 250)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const now = Date.now()
    if (now - savedAt.current < 1500) return
    savedAt.current = now
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked — the game keeps running */
    }
  }, [state])

  useEffect(() => {
    const onHide = () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state))
      } catch {
        /* ignore */
      }
    }
    window.addEventListener('beforeunload', onHide)
    return () => window.removeEventListener('beforeunload', onHide)
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>
}

export function useGame() {
  const ctx = useContext(GameCtx)
  if (!ctx) throw new Error('useGame outside GameProvider')
  return ctx
}

