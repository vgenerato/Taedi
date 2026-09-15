import type { AppState } from './types.ts'
import { bestStreak, currentStreak, monthStats, totals, type Totals } from './selectors.ts'
import { currentMonth } from './selectors.ts'

/** Níveis com nomes de crescimento — o mesmo vocabulário do verde da marca. */
export const LEVELS = [
  { name: 'Semente', at: 0 },
  { name: 'Broto', at: 300 },
  { name: 'Muda', at: 750 },
  { name: 'Folha', at: 1400 },
  { name: 'Ramo', at: 2300 },
  { name: 'Copa', at: 3500 },
  { name: 'Árvore', at: 5000 },
  { name: 'Pomar', at: 7000 },
  { name: 'Colheita', at: 9500 },
  { name: 'Estação inteira', at: 12500 },
]

const STEP_AFTER_LAST = 4000

export type LevelInfo = {
  level: number
  name: string
  floor: number
  ceiling: number
  into: number
  span: number
  pct: number
  toNext: number
}

export function levelInfo(xp: number): LevelInfo {
  let index = 0
  while (index + 1 < LEVELS.length && xp >= LEVELS[index + 1].at) index++

  const isLast = index === LEVELS.length - 1
  if (!isLast) {
    const floor = LEVELS[index].at
    const ceiling = LEVELS[index + 1].at
    const into = xp - floor
    const span = ceiling - floor
    return {
      level: index + 1,
      name: LEVELS[index].name,
      floor,
      ceiling,
      into,
      span,
      pct: Math.min(100, Math.round((into / span) * 100)),
      toNext: Math.max(0, ceiling - xp),
    }
  }

  const last = LEVELS[LEVELS.length - 1].at
  const extra = Math.floor((xp - last) / STEP_AFTER_LAST)
  const floor = last + extra * STEP_AFTER_LAST
  const ceiling = floor + STEP_AFTER_LAST
  const into = xp - floor
  return {
    level: LEVELS.length + extra,
    name: extra === 0 ? LEVELS[LEVELS.length - 1].name : `Estação ${extra + 1}`,
    floor,
    ceiling,
    into,
    span: STEP_AFTER_LAST,
    pct: Math.round((into / STEP_AFTER_LAST) * 100),
    toNext: ceiling - xp,
  }
}

export type Snapshot = Totals & {
  streak: number
  best: number
  level: LevelInfo
  monthPerfect: number
  monthAdherence: number
}

export function snapshot(state: AppState): Snapshot {
  const t = totals(state)
  const month = monthStats(state, currentMonth())
  return {
    ...t,
    streak: currentStreak(state),
    best: bestStreak(state),
    level: levelInfo(t.xp),
    monthPerfect: month.perfectDays,
    monthAdherence: month.adherence,
  }
}

export type BadgeDef = {
  id: string
  name: string
  hint: string
  /** 0 a 1 — quanto falta para destravar. */
  progress: (s: Snapshot, state: AppState) => number
}

export const BADGES: BadgeDef[] = [
  {
    id: 'primeiro-passo',
    name: 'Primeiro passo',
    hint: 'Registre a primeira refeição',
    progress: (s) => Math.min(1, s.mealsDone / 1),
  },
  {
    id: 'dia-cheio',
    name: 'Dia cheio',
    hint: 'Complete todas as refeições de um dia',
    progress: (s) => Math.min(1, s.perfectDays / 1),
  },
  {
    id: 'semana-firme',
    name: 'Semana firme',
    hint: '7 dias completos seguidos',
    progress: (s) => Math.min(1, s.best / 7),
  },
  {
    id: 'quinzena',
    name: 'Quinzena',
    hint: '14 dias completos seguidos',
    progress: (s) => Math.min(1, s.best / 14),
  },
  {
    id: 'mes-redondo',
    name: 'Mês redondo',
    hint: '30 dias completos seguidos',
    progress: (s) => Math.min(1, s.best / 30),
  },
  {
    id: 'centena',
    name: 'Centena',
    hint: '100 refeições registradas',
    progress: (s) => Math.min(1, s.mealsDone / 100),
  },
  {
    id: 'pontual',
    name: 'Pontual',
    hint: '25 refeições no horário combinado',
    progress: (s) => Math.min(1, s.onTime / 25),
  },
  {
    id: 'meta-do-mes',
    name: 'Meta do mês',
    hint: 'Alcance sua meta de dias completos',
    progress: (s, state) => Math.min(1, s.monthPerfect / Math.max(1, state.goals.perfectDays)),
  },
  {
    id: 'na-balanca',
    name: 'Na balança',
    hint: '10 pesagens registradas',
    progress: (s) => Math.min(1, s.weighIns / 10),
  },
]

export type BadgeState = BadgeDef & { unlocked: boolean; pct: number }

export function badgeStates(state: AppState, snap: Snapshot): BadgeState[] {
  return BADGES.map((b) => {
    const pct = b.progress(snap, state)
    return { ...b, pct, unlocked: pct >= 1 }
  })
}

export function unlockedBadgeIds(state: AppState, snap: Snapshot): string[] {
  return badgeStates(state, snap)
    .filter((b) => b.unlocked)
    .map((b) => b.id)
}
