import type { AppState, DayLog, Goals, Meal, MealStatus, PlanSource, Settings } from './types.ts'
import { getState, replaceState, setState } from './store.ts'
import { expectedForDate } from './selectors.ts'
import { timeToMinutes, type ISODate } from './date.ts'
import { clearState } from './storage.ts'
import { initialState, seedPlan } from './seed.ts'

function withLog(state: AppState, date: ISODate, edit: (log: DayLog) => DayLog): AppState {
  const existing = state.logs[date]
  const base: DayLog = existing ?? { date, meals: {}, expected: expectedForDate(state, date) }
  const next = edit({ ...base, meals: { ...base.meals } })
  return { ...state, logs: { ...state.logs, [date]: next } }
}

function touchPlan(state: AppState, meals: Meal[], source?: PlanSource): AppState {
  return {
    ...state,
    plan: {
      meals: [...meals].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
      source: source ?? (state.plan.source.kind === 'exemplo' ? { kind: 'manual' } : state.plan.source),
      updatedAt: new Date().toISOString(),
    },
  }
}

export function setMealStatus(date: ISODate, mealId: string, status: MealStatus | null): void {
  setState((state) =>
    withLog(state, date, (log) => {
      if (status === null) {
        const meals = { ...log.meals }
        delete meals[mealId]
        return { ...log, meals }
      }
      const meal = state.plan.meals.find((m) => m.id === mealId)
      const items = status === 'done' ? (meal?.items.map((i) => i.id) ?? []) : []
      return {
        ...log,
        meals: { ...log.meals, [mealId]: { status, at: new Date().toISOString(), items } },
      }
    }),
  )
}

export function toggleMeal(date: ISODate, mealId: string): void {
  const current = getState().logs[date]?.meals[mealId]
  setMealStatus(date, mealId, current?.status === 'done' ? null : 'done')
}

/** Marca um item. Quando todos ficam marcados, a refeição se fecha sozinha. */
export function toggleItem(date: ISODate, mealId: string, itemId: string): void {
  setState((state) => {
    const meal = state.plan.meals.find((m) => m.id === mealId)
    if (!meal) return state
    return withLog(state, date, (log) => {
      const entry = log.meals[mealId]
      const marked = new Set(entry?.items ?? [])
      if (marked.has(itemId)) marked.delete(itemId)
      else marked.add(itemId)

      const items = meal.items.filter((i) => marked.has(i.id)).map((i) => i.id)
      if (items.length === 0) {
        const meals = { ...log.meals }
        delete meals[mealId]
        return { ...log, meals }
      }
      const complete = items.length === meal.items.length
      return {
        ...log,
        meals: {
          ...log.meals,
          [mealId]: {
            status: complete ? 'done' : 'partial',
            at: complete ? new Date().toISOString() : (entry?.at ?? new Date().toISOString()),
            items,
          },
        },
      }
    })
  })
}

export function setWeight(date: ISODate, value: number | null): void {
  setState((state) =>
    withLog(state, date, (log) => ({ ...log, weight: value ?? undefined })),
  )
}

export function setDayNote(date: ISODate, note: string): void {
  setState((state) => withLog(state, date, (log) => ({ ...log, note: note || undefined })))
}

export function saveMeal(meal: Meal): void {
  setState((state) => {
    const exists = state.plan.meals.some((m) => m.id === meal.id)
    const meals = exists
      ? state.plan.meals.map((m) => (m.id === meal.id ? meal : m))
      : [...state.plan.meals, meal]
    return touchPlan(state, meals)
  })
}

export function removeMeal(mealId: string): void {
  setState((state) => touchPlan(state, state.plan.meals.filter((m) => m.id !== mealId)))
}

export function setMealActive(mealId: string, active: boolean): void {
  setState((state) =>
    touchPlan(
      state,
      state.plan.meals.map((m) => (m.id === mealId ? { ...m, active } : m)),
    ),
  )
}

export function replacePlan(meals: Meal[], source: PlanSource): void {
  setState((state) => touchPlan(state, meals, source))
}

export function addMeals(meals: Meal[], source: PlanSource): void {
  setState((state) => touchPlan(state, [...state.plan.meals, ...meals], source))
}

export function restoreExamplePlan(): void {
  setState((state) => touchPlan(state, seedPlan(), { kind: 'exemplo' }))
}

export function setGoals(goals: Partial<Goals>): void {
  setState((state) => ({ ...state, goals: { ...state.goals, ...goals } }))
}

export function setSettings(settings: Partial<Settings>): void {
  setState((state) => ({ ...state, settings: { ...state.settings, ...settings } }))
}

export function markBadgesSeen(ids: string[]): void {
  setState((state) => {
    const merged = Array.from(new Set([...state.seenBadges, ...ids]))
    if (merged.length === state.seenBadges.length) return state
    return { ...state, seenBadges: merged }
  })
}

export function markCelebrated(date: ISODate): void {
  setState((state) =>
    state.celebrated.includes(date)
      ? state
      : { ...state, celebrated: [...state.celebrated.slice(-90), date] },
  )
}

export function importState(next: AppState): void {
  replaceState(next)
}

export function resetEverything(): void {
  clearState()
  replaceState(initialState())
}
