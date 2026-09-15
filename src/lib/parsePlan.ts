export type ParsedItem = { text: string; qty?: string; alts?: string[] }
export type ParsedMeal = { name: string; time: string; items: ParsedItem[]; note?: string }

const deburr = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Nomes usuais de refeição em planos brasileiros, com horário de reserva. */
const KNOWN: { re: RegExp; name: string; time: string }[] = [
  { re: /^(cafe\s*(da)?\s*manha|desjejum)/, name: 'Café da manhã', time: '07:30' },
  { re: /^(colacao)/, name: 'Colação', time: '09:30' },
  { re: /^(lanche\s*(da)?\s*manha)/, name: 'Lanche da manhã', time: '10:00' },
  { re: /^(almoco)/, name: 'Almoço', time: '12:30' },
  { re: /^(lanche\s*(da)?\s*tarde|cafe\s*(da)?\s*tarde)/, name: 'Lanche da tarde', time: '16:00' },
  { re: /^(pre[\s-]*treino)/, name: 'Pré-treino', time: '16:30' },
  { re: /^(pos[\s-]*treino)/, name: 'Pós-treino', time: '18:30' },
  { re: /^(jantar|janta)/, name: 'Jantar', time: '19:30' },
  { re: /^(ceia)/, name: 'Ceia', time: '21:30' },
]

const GENERIC = [
  /^refei[cç][aã]o\s*(\d+)/i,
  /^(\d+)\s*[ªaº°]?\s*refei[cç][aã]o/i,
  /^r\s*(\d+)\s*[-–—:]/i,
]

const NOISE = [
  /^p[áa]gina\s*\d+/i,
  /^\d+\s*[/de]+\s*\d+$/i,
  /^[\d\s.:/-]+$/,
  /(crn|cfn)\s*[-:\s]*\d/i,
  /@|https?:|www\./i,
  /^(plano|cardapio|card[áa]pio|dieta|paciente|nutricionista|data\b|nome\b|peso atual|altura)\s*[:]/i,
]

const UNIT =
  '(?:g|gr|gramas?|kg|mg|ml|l|litros?|un|und|unid(?:ade)?s?|fatias?|col(?:her(?:es)?|\\.)?(?:\\s*(?:de\\s*)?(?:sopa|ch[aá]|caf[ée]|sobremesa))?|x[ií]caras?|copos?|conchas?|por[cç][oõ]es|por[cç][aã]o|scoops?|doses?|peda[cç]os?|fil[ée]s?|d[uú]zias?|pratos?|potes?|bolas?|tabletes?|quadrados?|punhados?|ramos?|folhas?|latas?|sachês?|sach[eê]s?|cápsulas?|caps?)'

const LEADING_QTY = new RegExp(
  `^((?:\\d+[\\d.,/]*|meia|meio|um|uma|dois|duas|tr[eê]s)\\s*${UNIT}?\\.?)\\s*(?:de\\s+|do\\s+|da\\s+)?(.{2,})$`,
  'i',
)

const TRAILING_QTY = new RegExp(
  `^(.{2,}?)\\s*[-–—(]?\\s*((?:\\d+[\\d.,/]*)\\s*${UNIT}\\b\\.?)\\s*\\)?$`,
  'i',
)

const BULLET = /^[\s•▪●·*>▪●◦–—-]+/

function isNoise(line: string): boolean {
  if (line.length < 2) return true
  return NOISE.some((re) => re.test(line))
}

/** Tira o horário do cabeçalho: "Almoço — 12h30" vira nome + 12:30. */
function extractTime(line: string): { time?: string; rest: string } {
  const re = /(?:^|[\s(\-–—:])(\d{1,2})\s*(?::|h|hs|hrs)\s*(\d{2})?/i
  const match = re.exec(line)
  if (!match) return { rest: line }
  const hour = Number(match[1])
  if (hour > 23) return { rest: line }
  const minute = match[2] ? Math.min(59, Number(match[2])) : 0
  const rest = line.replace(match[0], ' ').replace(/\s+/g, ' ').trim()
  return { time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`, rest }
}

function cleanName(raw: string): string {
  const name = raw
    .replace(BULLET, '')
    .replace(/[\s:–—-]+$/, '')
    .replace(/^[\s:–—-]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (!name) return name
  if (name === name.toUpperCase() && name.length > 3) {
    return name.charAt(0) + name.slice(1).toLowerCase()
  }
  return name
}

type Header = { name: string; time?: string }

function asHeader(line: string): Header | null {
  const { time, rest } = extractTime(line)
  const bare = cleanName(rest)
  const flat = deburr(bare)

  for (const known of KNOWN) {
    if (known.re.test(flat)) return { name: known.name, time: time ?? known.time }
  }

  for (const re of GENERIC) {
    const match = re.exec(bare)
    if (match) return { name: `Refeição ${match[1]}`, time }
  }

  /* "08:00 — Shake" também abre uma refeição, desde que a linha seja curta. */
  if (time && bare.length <= 32 && !LEADING_QTY.test(bare)) {
    return { name: bare || 'Refeição', time }
  }

  return null
}

function splitQuantity(text: string): ParsedItem {
  const leading = LEADING_QTY.exec(text)
  if (leading) {
    const qty = leading[1].replace(/\s+/g, ' ').trim()
    const rest = leading[2].trim()
    if (/\d/.test(qty) || /\s/.test(qty)) return { qty, text: capitalize(rest) }
  }
  const trailing = TRAILING_QTY.exec(text)
  if (trailing) {
    return { qty: trailing[2].replace(/\s+/g, ' ').trim(), text: capitalize(trailing[1].trim()) }
  }
  return { text: capitalize(text) }
}

function capitalize(s: string): string {
  const clean = s.replace(/\s+/g, ' ').trim()
  if (!clean) return clean
  if (clean === clean.toUpperCase() && clean.length > 3) {
    const lower = clean.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

const DEFAULT_TIMES = ['07:30', '10:00', '12:30', '16:00', '19:30', '21:30']

/**
 * Lê o texto de um plano alimentar e devolve refeições com horário e itens.
 * É heurístico de propósito: o usuário confere tudo antes de importar.
 */
export function parseDietText(input: string | string[]): ParsedMeal[] {
  const lines = (Array.isArray(input) ? input : input.split(/\r?\n/))
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  const meals: ParsedMeal[] = []
  let current: ParsedMeal | null = null

  for (const line of lines) {
    const header = asHeader(line)
    if (header) {
      current = { name: header.name, time: header.time ?? '', items: [] }
      meals.push(current)
      continue
    }
    if (!current || isNoise(line)) continue

    const body = line.replace(BULLET, '').trim()
    if (!body) continue

    const noteMatch = /^(obs(erva[cç][aã]o|s)?|aten[cç][aã]o|importante|dica)\s*[:.\-]\s*(.+)$/i.exec(body)
    if (noteMatch) {
      current.note = current.note ? `${current.note} ${noteMatch[3]}` : noteMatch[3]
      continue
    }

    const altMatch = /^(?:ou|opc[aã]o|op[cç][aã]o|substitui[cç][aã]o|subst)\s*[:.\-]?\s+(.+)$/i.exec(body)
    const last = current.items[current.items.length - 1]
    if (altMatch && last) {
      last.alts = [...(last.alts ?? []), capitalize(altMatch[1])]
      continue
    }

    if (body.length > 160) {
      current.note = current.note ? `${current.note} ${body}` : body
      continue
    }

    current.items.push(splitQuantity(body))
  }

  const useful = meals.filter((m) => m.items.length > 0)

  /* Refeições sem horário no papel recebem um horário plausível pela ordem. */
  useful.forEach((meal, index) => {
    if (!meal.time) {
      meal.time = DEFAULT_TIMES[index] ?? nextHour(useful[index - 1]?.time ?? '07:30')
    }
  })

  return useful.sort((a, b) => a.time.localeCompare(b.time))
}

function nextHour(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + 150) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}
