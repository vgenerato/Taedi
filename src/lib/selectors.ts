import type { AppState, DayLog, Meal } from './types.ts'
import { addDays, monthDays, monthKey, timeToMinutes, today, weekday, type ISODate } from './date.ts'

/** Refeições previstas para a data, na ordem do relógio. */
export function mealsForDate(state: AppState, date: ISODate): Meal[] {
  const dow = weekday(date)
  return state.plan.meals
    .filter((m) => m.active && m.days.includes(dow))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
}

/**
 * Refeições que contam para a data.
 *
 * Hoje e o futuro seguem sempre o plano atual. Dias passados guardam a lista
 * congelada no primeiro registro — assim mudar o plano não reescreve o
 * histórico —, descartando refeições que foram apagadas do plano e somando as
 * que a pessoa de fato marcou naquele dia.
 */
export function expectedForDate(state: AppState, date: ISODate): string[] {
  const current = mealsForDate(state, date).map((m) => m.id)
  const log = state.logs[date]
  if (!log || log.expected.length === 0 || date >= today()) return current

  const known = new Set(state.plan.meals.map((m) => m.id))
  const merged = Array.from(
    new Set([...log.expected, ...Object.keys(log.meals)].filter((id) => known.has(id))),
  )
  return merged.length ? merged : current
}

export type DayStatus = {
  expected: number
  done: number
  skipped: number
  ratio: number
  complete: boolean
  touched: boolean
}

export function dayStatus(state: AppState, date: ISODate): DayStatus {
  const expected = expectedForDate(state, date)
  const log = state.logs[date]
  let done = 0
  let skipped = 0
  for (const id of expected) {
    const entry = log?.meals[id]
    if (entry?.status === 'done') done++
    else if (entry?.status === 'skipped') skipped++
  }
  const touched = Boolean(log && (Object.keys(log.meals).length > 0 || log.weight != null || log.note))
  return {
    expected: expected.length,
    done,
    skipped,
    ratio: expected.length ? done / expected.length : 0,
    complete: expected.length > 0 && done === expected.length,
    touched,
  }
}

export function isComplete(state: AppState, date: ISODate): boolean {
  return dayStatus(state, date).complete
}

/**
 * Sequência atual de dias completos. O dia de hoje ainda em aberto não
 * interrompe a contagem, e dias sem refeições previstas são neutros.
 */
export function currentStreak(state: AppState, ref: ISODate = today()): number {
  let cursor = ref
  if (!isComplete(state, cursor)) cursor = addDays(cursor, -1)
  let streak = 0
  let guard = 0
  while (guard++ < 1000) {
    const status = dayStatus(state, cursor)
    if (status.expected === 0) {
      cursor = addDays(cursor, -1)
      continue
    }
    if (!status.complete) break
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

function completedDates(state: AppState): ISODate[] {
  return Object.keys(state.logs)
    .filter((date) => isComplete(state, date))
    .sort()
}

export function bestStreak(state: AppState): number {
  const dates = completedDates(state)
  let best = 0
  let run = 0
  let prev: ISODate | null = null
  for (const date of dates) {
    run = prev && addDays(prev, 1) === date ? run + 1 : 1
    best = Math.max(best, run)
    prev = date
  }
  return Math.max(best, currentStreak(state))
}

export const XP_PER_MEAL = 12
export const XP_PER_DAY = 50

export type Totals = {
  mealsDone: number
  perfectDays: number
  weighIns: number
  onTime: number
  xp: number
  activeDays: number
  firstDate: ISODate | null
}

export function totals(state: AppState): Totals {
  const byId = new Map(state.plan.meals.map((m) => [m.id, m]))
  let mealsDone = 0
  let onTime = 0
  let weighIns = 0
  let activeDays = 0
  let firstDate: ISODate | null = null

  for (const [date, log] of Object.entries(state.logs)) {
    let touched = false
    for (const [mealId, entry] of Object.entries(log.meals)) {
      if (entry.status !== 'done') continue
      mealsDone++
      touched = true
      const meal = byId.get(mealId)
      if (meal && entry.at) {
        const at = new Date(entry.at)
        const minutes = at.getHours() * 60 + at.getMinutes()
        if (Math.abs(minutes - timeToMinutes(meal.time)) <= 30) onTime++
      }
    }
    if (log.weight != null) {
      weighIns++
      touched = true
    }
    if (touched) {
      activeDays++
      if (!firstDate || date < firstDate) firstDate = date
    }
  }

  const perfectDays = completedDates(state).length
  return {
    mealsDone,
    perfectDays,
    weighIns,
    onTime,
    activeDays,
    firstDate,
    xp: mealsDone * XP_PER_MEAL + perfectDays * XP_PER_DAY,
  }
}

/** Primeiro dia com qualquer registro — antes disso o app nem existia para a pessoa. */
export function firstTrackedDate(state: AppState): ISODate | null {
  let first: ISODate | null = null
  for (const [date, log] of Object.entries(state.logs)) {
    const used = Object.keys(log.meals).length > 0 || log.weight != null || Boolean(log.note)
    if (used && (!first || date < first)) first = date
  }
  return first
}

export type MonthStats = {
  key: string
  days: ISODate[]
  /** Dia em que a contagem do mês começa (primeiro registro da pessoa). */
  countingFrom: ISODate | null
  perfectDays: number
  plannedMeals: number
  doneMeals: number
  skippedMeals: number
  adherence: number
  bestRun: number
  activeDays: number
  weights: { date: ISODate; value: number }[]
}

/** Estatísticas do mês, contando só os dias já vividos. */
export function monthStats(state: AppState, key: string): MonthStats {
  const t = today()
  const days = monthDays(key)
  const since = firstTrackedDate(state)
  const past = days.filter((d) => d <= t && (!since || d >= since))
  let perfectDays = 0
  let plannedMeals = 0
  let doneMeals = 0
  let skippedMeals = 0
  let activeDays = 0
  let bestRun = 0
  let run = 0
  const weights: { date: ISODate; value: number }[] = []

  for (const date of past) {
    const status = dayStatus(state, date)
    plannedMeals += status.expected
    doneMeals += status.done
    skippedMeals += status.skipped
    if (status.touched) activeDays++
    if (status.complete) {
      perfectDays++
      run++
      bestRun = Math.max(bestRun, run)
    } else if (status.expected > 0) {
      run = 0
    }
    const weight = state.logs[date]?.weight
    if (weight != null) weights.push({ date, value: weight })
  }

  return {
    key,
    days,
    countingFrom: since && since > days[0] && since <= days[days.length - 1] ? since : null,
    perfectDays,
    plannedMeals,
    doneMeals,
    skippedMeals,
    adherence: plannedMeals ? Math.round((doneMeals / plannedMeals) * 100) : 0,
    bestRun,
    activeDays,
    weights,
  }
}

export function currentMonth(): string {
  return monthKey(today())
}

export function lastWeight(state: AppState): { date: ISODate; value: number } | null {
  const entries = Object.entries(state.logs)
    .filter(([, log]) => log.weight != null)
    .sort(([a], [b]) => (a < b ? 1 : -1))
  const first = entries[0]
  return first ? { date: first[0], value: first[1].weight as number } : null
}

export function emptyLog(date: ISODate, expected: string[]): DayLog {
  return { date, meals: {}, expected }
}
