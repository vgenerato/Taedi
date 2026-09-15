export type MealItem = {
  id: string
  /** O alimento em si: "Ovos mexidos". */
  text: string
  /** Quantidade separada do alimento: "2 unidades". */
  qty?: string
  /** Substituições sugeridas pelo plano. */
  alts?: string[]
}

export type Meal = {
  id: string
  name: string
  /** HH:MM, 24h. */
  time: string
  items: MealItem[]
  note?: string
  /** Dias da semana em que a refeição vale (0 = domingo). */
  days: number[]
  active: boolean
}

export type PlanSource = {
  kind: 'exemplo' | 'manual' | 'pdf'
  name?: string
  at?: string
}

export type Plan = {
  meals: Meal[]
  source: PlanSource
  updatedAt: string
}

/** 'partial' = alguns itens marcados; só 'done' fecha a refeição. */
export type MealStatus = 'done' | 'partial' | 'skipped'

export type MealEntry = {
  status: MealStatus
  /** ISO de quando foi registrado. */
  at: string
  /** Itens marcados dentro da refeição. */
  items: string[]
}

export type DayLog = {
  date: string
  meals: Record<string, MealEntry>
  /** Refeições previstas no dia, congeladas no primeiro registro. */
  expected: string[]
  weight?: number
  note?: string
}

export type Goals = {
  /** Dias completos desejados por mês. */
  perfectDays: number
  /** Aderência mínima (% de refeições concluídas no mês). */
  adherence: number
  weightTarget?: number
}

export type Settings = {
  name: string
  theme: 'auto' | 'light' | 'dark'
}

export type AppState = {
  version: number
  plan: Plan
  logs: Record<string, DayLog>
  goals: Goals
  settings: Settings
  /** Conquistas já mostradas ao usuário — evita recomemorar. */
  seenBadges: string[]
  /** Dias já comemorados na tela. */
  celebrated: string[]
}
