import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { advance, initialState } from './engine'
import { reducer } from './reducer'
import { readSave, writeSave } from './save'
import type { Action, GameState } from './types'

function load(): GameState {
  const saved = readSave()
  if (saved) {
    // reopen the world: everything that happened while away still happens
    const s: GameState = { ...saved }
    advance(s, Date.now())
    return s
  }
  return initialState(Date.now())
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
    writeSave(state)
  }, [state])

  useEffect(() => {
    const onHide = () => writeSave(state)
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
