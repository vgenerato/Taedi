/** Datas são sempre "YYYY-MM-DD" no fuso local — nada de UTC silencioso. */
export type ISODate = string

export function toISODate(d: Date): ISODate {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function fromISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today(): ISODate {
  return toISODate(new Date())
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function weekday(s: ISODate): number {
  return fromISODate(s).getDay()
}

export function monthKey(s: ISODate): string {
  return s.slice(0, 7)
}

export function monthDays(key: string): ISODate[] {
  const [y, m] = key.split('-').map(Number)
  const total = new Date(y, m, 0).getDate()
  return Array.from({ length: total }, (_, i) => `${key}-${String(i + 1).padStart(2, '0')}`)
}

export function shiftMonth(key: string, n: number): string {
  const [y, m] = key.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

const WEEKDAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

export const WEEKDAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
export const WEEKDAY_LABEL = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const name = MONTHS[m - 1]
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${y}`
}

export function dayLabel(s: ISODate): string {
  const d = fromISODate(s)
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`
}

export function shortDayLabel(s: ISODate): string {
  const d = fromISODate(s)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function relativeDayLabel(s: ISODate): string {
  const t = today()
  if (s === t) return 'Hoje'
  if (s === addDays(t, -1)) return 'Ontem'
  if (s === addDays(t, 1)) return 'Amanhã'
  return dayLabel(s)
}

/** "07:30" → 450 minutos. Aceita horários malformados sem quebrar. */
export function timeToMinutes(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!m) return 0
  return Math.min(23, Number(m[1])) * 60 + Math.min(59, Number(m[2]))
}

export function minutesNow(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
