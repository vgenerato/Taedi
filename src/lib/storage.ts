import type { AppState } from './types.ts'
import { initialState } from './seed.ts'

const KEY = 'taedi.state.v1'

/** Aceita estado parcial (versões antigas, export editado à mão) sem quebrar a tela. */
function hydrate(raw: unknown): AppState {
  const base = initialState()
  if (!raw || typeof raw !== 'object') return base
  const s = raw as Partial<AppState>
  return {
    version: base.version,
    plan: {
      meals: Array.isArray(s.plan?.meals) ? s.plan.meals : base.plan.meals,
      source: s.plan?.source ?? base.plan.source,
      updatedAt: s.plan?.updatedAt ?? base.plan.updatedAt,
    },
    logs: s.logs && typeof s.logs === 'object' ? s.logs : {},
    goals: { ...base.goals, ...(s.goals ?? {}) },
    settings: { ...base.settings, ...(s.settings ?? {}) },
    seenBadges: Array.isArray(s.seenBadges) ? s.seenBadges : [],
    celebrated: Array.isArray(s.celebrated) ? s.celebrated : [],
  }
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initialState()
    return hydrate(JSON.parse(raw))
  } catch {
    return initialState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* modo privado ou cota cheia: a sessão segue em memória */
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignora */
  }
}

export function parseImportedState(json: string): AppState {
  return hydrate(JSON.parse(json))
}
