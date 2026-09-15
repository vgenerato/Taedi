import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initialState } from '../src/lib/seed.ts'
import type { AppState, DayLog } from '../src/lib/types.ts'
import {
  bestStreak,
  currentStreak,
  dayStatus,
  expectedForDate,
  monthStats,
  totals,
} from '../src/lib/selectors.ts'
import { badgeStates, levelInfo, snapshot } from '../src/lib/progress.ts'
import { addDays, monthKey, today } from '../src/lib/date.ts'

const base = initialState()
const ids = base.plan.meals.map((m) => m.id)
const t = today()

function log(date: string, done: string[], partial: Record<string, string[]> = {}): DayLog {
  const meals: DayLog['meals'] = {}
  for (const id of done) {
    const meal = base.plan.meals.find((m) => m.id === id)!
    meals[id] = { status: 'done', at: `${date}T08:00:00`, items: meal.items.map((i) => i.id) }
  }
  for (const [id, items] of Object.entries(partial)) {
    meals[id] = { status: 'partial', at: `${date}T08:00:00`, items }
  }
  return { date, meals, expected: ids }
}

const complete: AppState = { ...base, logs: { [t]: log(t, ids) } }

const partial: AppState = {
  ...base,
  logs: { [t]: log(t, ids.slice(1), { [ids[0]]: [base.plan.meals[0].items[0].id] }) },
}

const threeDays: AppState = {
  ...base,
  logs: {
    [addDays(t, -1)]: log(addDays(t, -1), ids),
    [addDays(t, -2)]: log(addDays(t, -2), ids),
    [addDays(t, -3)]: log(addDays(t, -3), ids),
  },
}

test('o dia fecha quando todas as refeições previstas são marcadas', () => {
  assert.equal(dayStatus(complete, t).complete, true)
  assert.equal(currentStreak(complete), 1)
})

test('refeição só com alguns itens não conta como concluída', () => {
  assert.equal(dayStatus(partial, t).complete, false)
  assert.equal(dayStatus(partial, t).done, ids.length - 1)
  assert.equal(totals(partial).mealsDone, ids.length - 1)
})

test('o dia de hoje em aberto não interrompe a sequência', () => {
  assert.equal(currentStreak(threeDays), 3)
  assert.equal(bestStreak(threeDays), 3)
})

test('um dia incompleto interrompe a sequência', () => {
  const comBuraco: AppState = {
    ...threeDays,
    logs: { ...threeDays.logs, [addDays(t, -2)]: log(addDays(t, -2), ids.slice(1)) },
  }
  assert.equal(currentStreak(comBuraco), 1)
})

test('o mês só conta a partir do primeiro registro', () => {
  const stats = monthStats(threeDays, monthKey(t))
  assert.equal(stats.plannedMeals, ids.length * 4)
  assert.equal(stats.adherence, 75)
})

test('xp e níveis', () => {
  assert.equal(totals(threeDays).xp, ids.length * 3 * 12 + 3 * 50)
  assert.equal(levelInfo(0).level, 1)
  assert.equal(levelInfo(300).level, 2)
  assert.equal(levelInfo(16500).level, 11)
})

test('conquistas acompanham o progresso real', () => {
  const badges = badgeStates(threeDays, snapshot(threeDays))
  assert.equal(badges.find((b) => b.id === 'primeiro-passo')?.unlocked, true)
  assert.equal(badges.find((b) => b.id === 'quinzena')?.unlocked, false)
})

test('trocar o plano não reescreve o passado nem trava o presente', () => {
  const novo = initialState().plan.meals.slice(0, 2)
  const trocado: AppState = {
    ...threeDays,
    plan: { ...base.plan, meals: [...base.plan.meals.slice(0, 2), ...novo] },
  }
  assert.equal(expectedForDate(trocado, t).length, 4)
  assert.equal(expectedForDate(trocado, addDays(t, -1)).length, 2)
  assert.equal(dayStatus(trocado, addDays(t, -1)).complete, true)
})
