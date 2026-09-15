import { useSyncExternalStore } from 'react'
import type { AppState } from './types.ts'
import { loadState, saveState } from './storage.ts'

let state: AppState = loadState()
const listeners = new Set<() => void>()
let flush: number | undefined

export function getState(): AppState {
  return state
}

export function setState(update: (current: AppState) => AppState): void {
  const next = update(state)
  if (next === state) return
  state = next
  for (const listener of listeners) listener()
  if (flush) window.clearTimeout(flush)
  flush = window.setTimeout(() => saveState(state), 120)
}

export function replaceState(next: AppState): void {
  setState(() => next)
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState, getState)
}
