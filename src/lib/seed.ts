import type { AppState, Meal } from './types.ts'
import { uid } from './id.ts'

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

function meal(name: string, time: string, items: [string, string][], note?: string): Meal {
  return {
    id: uid('m'),
    name,
    time,
    note,
    days: ALL_DAYS,
    active: true,
    items: items.map(([qty, text]) => ({ id: uid('i'), qty, text })),
  }
}

/** Plano de exemplo — serve de rascunho até a pessoa importar o PDF dela. */
export function seedPlan(): Meal[] {
  return [
    meal('Café da manhã', '07:30', [
      ['2 un.', 'Ovos mexidos'],
      ['1 fatia', 'Pão integral'],
      ['200 ml', 'Café sem açúcar'],
    ]),
    meal('Lanche da manhã', '10:00', [
      ['1 un.', 'Banana'],
      ['30 g', 'Castanhas'],
    ]),
    meal('Almoço', '12:30', [
      ['120 g', 'Frango grelhado'],
      ['4 col. sopa', 'Arroz integral'],
      ['1 concha', 'Feijão'],
      ['à vontade', 'Salada crua'],
    ]),
    meal('Lanche da tarde', '16:00', [
      ['1 pote', 'Iogurte natural'],
      ['1 col. sopa', 'Aveia em flocos'],
    ]),
    meal('Jantar', '19:30', [
      ['120 g', 'Peixe assado'],
      ['1 un. média', 'Batata-doce'],
      ['à vontade', 'Legumes refogados'],
    ]),
  ]
}

export function initialState(): AppState {
  return {
    version: 1,
    plan: {
      meals: seedPlan(),
      source: { kind: 'exemplo' },
      updatedAt: new Date().toISOString(),
    },
    logs: {},
    goals: { perfectDays: 20, adherence: 85 },
    settings: { name: '', theme: 'auto' },
    seenBadges: [],
    celebrated: [],
  }
}
