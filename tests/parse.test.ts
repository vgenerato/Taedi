import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDietText } from '../src/lib/parsePlan.ts'

const plano = `
PLANO ALIMENTAR
Paciente: Maria Silva
Nutricionista Ana Souza - CRN3 12345
Página 1

CAFÉ DA MANHÃ - 7h00
- 2 ovos mexidos
- 1 fatia de pão integral
Ou 2 torradas integrais
- 200ml de café sem açúcar
Obs: usar azeite para preparar

LANCHE DA MANHÃ (10:00)
• Banana 1 unidade
• 30g de castanha de caju

ALMOÇO — 12h30
120 g de frango grelhado
Arroz integral 4 colheres de sopa
1 concha de feijão
Salada crua à vontade

REFEIÇÃO 4 - 16:00
1 pote de iogurte natural
1 colher de sopa de aveia

JANTAR
150g de peixe assado
Legumes refogados
`

const meals = parseDietText(plano)

test('reconhece as refeições na ordem do relógio', () => {
  assert.deepEqual(
    meals.map((m) => `${m.time} ${m.name}`),
    [
      '07:00 Café da manhã',
      '10:00 Lanche da manhã',
      '12:30 Almoço',
      '16:00 Refeição 4',
      '19:30 Jantar',
    ],
  )
})

test('separa quantidade do alimento', () => {
  assert.deepEqual(meals[0].items[1], {
    qty: '1 fatia',
    text: 'Pão integral',
    alts: ['2 torradas integrais'],
  })
  assert.deepEqual(meals[2].items[1], { qty: '4 colheres de sopa', text: 'Arroz integral' })
  assert.deepEqual(meals[3].items[1], { qty: '1 colher de sopa', text: 'Aveia' })
})

test('guarda observações fora da lista de itens', () => {
  assert.equal(meals[0].note, 'usar azeite para preparar')
  assert.equal(meals[0].items.length, 3)
})

test('ignora cabeçalho, rodapé e dados do documento', () => {
  const textos = meals.flatMap((m) => m.items.map((i) => i.text.toLowerCase()))
  assert.ok(!textos.some((t) => t.includes('crn')))
  assert.ok(!textos.some((t) => t.includes('página')))
})

test('refeição sem horário no papel recebe um horário plausível', () => {
  assert.equal(meals[4].time, '19:30')
})

test('texto sem refeições não inventa nada', () => {
  assert.deepEqual(parseDietText('apenas um texto solto\nsem estrutura de plano'), [])
})
