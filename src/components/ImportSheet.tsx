import { useRef, useState } from 'react'
import { AlertTriangle, ClipboardType, FileText, Loader2, RefreshCw, Upload } from 'lucide-react'
import { Sheet } from './Sheet.tsx'
import { parseDietText, type ParsedMeal } from '../lib/parsePlan.ts'
import { uid } from '../lib/id.ts'
import type { Meal, PlanSource } from '../lib/types.ts'

type Props = {
  onImport: (meals: Meal[], source: PlanSource, mode: 'replace' | 'append') => void
  onClose: () => void
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'reading'; name: string }
  | { kind: 'review'; name: string; text: string; meals: ParsedMeal[] }
  | { kind: 'error'; message: string }

function toMeals(parsed: ParsedMeal[], picked: boolean[]): Meal[] {
  return parsed
    .filter((_, index) => picked[index])
    .map((meal) => ({
      id: uid('m'),
      name: meal.name,
      time: meal.time,
      note: meal.note,
      days: [0, 1, 2, 3, 4, 5, 6],
      active: true,
      items: meal.items.map((item) => ({
        id: uid('i'),
        text: item.text,
        qty: item.qty,
        alts: item.alts,
      })),
    }))
}

export function ImportSheet({ onImport, onClose }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  const [picked, setPicked] = useState<boolean[]>([])
  const [mode, setMode] = useState<'replace' | 'append'>('replace')
  const [pasting, setPasting] = useState(false)
  const [pasted, setPasted] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const review = (name: string, text: string) => {
    const meals = parseDietText(text)
    setPicked(meals.map(() => true))
    setStage({ kind: 'review', name, text, meals })
  }

  const readFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setStage({ kind: 'error', message: 'Esse arquivo não é um PDF. Tente outro ou cole o texto.' })
      return
    }
    setStage({ kind: 'reading', name: file.name })
    try {
      const { extractPdfLines } = await import('../lib/pdf')
      const lines = await extractPdfLines(file)
      if (lines.length === 0) {
        setStage({
          kind: 'error',
          message:
            'Não encontramos texto nesse PDF — ele pode ser uma imagem escaneada. Cole o texto do plano para continuar.',
        })
        return
      }
      review(file.name, lines.join('\n'))
    } catch {
      setStage({ kind: 'error', message: 'Não consegui ler esse PDF. Tente colar o texto do plano.' })
    }
  }

  const confirm = () => {
    if (stage.kind !== 'review') return
    const meals = toMeals(stage.meals, picked)
    if (!meals.length) return
    onImport(meals, { kind: 'pdf', name: stage.name, at: new Date().toISOString() }, mode)
  }

  const chosen = picked.filter(Boolean).length

  return (
    <Sheet
      title="Importar plano"
      onClose={onClose}
      footer={
        stage.kind === 'review' ? (
          <>
            <button className="btn btn--outline" onClick={() => setStage({ kind: 'idle' })}>
              Voltar
            </button>
            <button className="btn btn--primary" onClick={confirm} disabled={chosen === 0}>
              Importar {chosen} {chosen === 1 ? 'refeição' : 'refeições'}
            </button>
          </>
        ) : undefined
      }
    >
      {stage.kind === 'idle' && (
        <div className="stack">
          {!pasting ? (
            <>
              <div
                className={`drop ${dragging ? 'drop--over' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  const file = event.dataTransfer.files[0]
                  if (file) void readFile(file)
                }}
              >
                <FileText size={26} strokeWidth={1.5} />
                <div>
                  <p style={{ fontWeight: 600 }}>Solte aqui o PDF da sua dieta</p>
                  <p className="hint">Lemos o arquivo no seu aparelho — nada é enviado para fora.</p>
                </div>
                <button
                  className="btn btn--primary"
                  data-autofocus
                  onClick={() => fileInput.current?.click()}
                >
                  <Upload size={16} /> Escolher arquivo
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/pdf,.pdf"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void readFile(file)
                    event.target.value = ''
                  }}
                />
              </div>
              <button className="btn btn--sm btn--ghost" onClick={() => setPasting(true)}>
                <ClipboardType size={15} /> ou colar o texto do plano
              </button>
            </>
          ) : (
            <div className="stack">
              <label className="field">
                <span className="field__label">Cole o plano alimentar</span>
                <textarea
                  className="textarea"
                  data-autofocus
                  style={{ minHeight: 220 }}
                  placeholder={'Café da manhã - 7h\n2 ovos mexidos\n1 fatia de pão integral\n\nAlmoço - 12h30\n...'}
                  value={pasted}
                  onChange={(event) => setPasted(event.target.value)}
                />
              </label>
              <div className="row">
                <button className="btn btn--outline" onClick={() => setPasting(false)}>
                  Voltar
                </button>
                <button
                  className="btn btn--primary"
                  disabled={pasted.trim().length < 10}
                  onClick={() => review('texto colado', pasted)}
                >
                  Analisar texto
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {stage.kind === 'reading' && (
        <div className="empty">
          <span className="empty__icon">
            <Loader2 size={22} className="spin" />
          </span>
          <p className="muted">Lendo {stage.name}…</p>
        </div>
      )}

      {stage.kind === 'error' && (
        <div className="stack">
          <div className="empty">
            <span className="empty__icon">
              <AlertTriangle size={22} />
            </span>
            <h3 className="empty__title">Não deu para ler</h3>
            <p className="hint">{stage.message}</p>
          </div>
          <div className="row">
            <button
              className="btn btn--outline"
              onClick={() => {
                setPasting(false)
                setStage({ kind: 'idle' })
              }}
            >
              Tentar outro PDF
            </button>
            <button
              className="btn btn--primary"
              onClick={() => {
                setPasting(true)
                setStage({ kind: 'idle' })
              }}
            >
              Colar texto
            </button>
          </div>
        </div>
      )}

      {stage.kind === 'review' && (
        <div className="stack">
          {stage.meals.length === 0 ? (
            <div className="empty">
              <span className="empty__icon">
                <AlertTriangle size={22} />
              </span>
              <h3 className="empty__title">Nenhuma refeição reconhecida</h3>
              <p className="hint">
                Ajuste o texto abaixo — cada refeição começa com um nome ou horário, e os alimentos
                vêm nas linhas seguintes.
              </p>
            </div>
          ) : (
            <>
              <p className="hint">
                Encontramos {stage.meals.length}{' '}
                {stage.meals.length === 1 ? 'refeição' : 'refeições'} em <strong>{stage.name}</strong>.
                Revise antes de importar — dá para editar tudo depois.
              </p>
              <ul className="stack stack--tight">
                {stage.meals.map((meal, index) => (
                  <li
                    key={index}
                    className={`review__meal ${picked[index] ? '' : 'review__meal--off'}`}
                  >
                    <label className="review__top">
                      <input
                        type="checkbox"
                        checked={picked[index]}
                        onChange={() =>
                          setPicked((current) =>
                            current.map((value, i) => (i === index ? !value : value)),
                          )
                        }
                      />
                      <span className="meal__time tnum">{meal.time}</span>
                      <span style={{ fontWeight: 600, flex: 1 }}>{meal.name}</span>
                      <span className="hint">
                        {meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </label>
                    <p className="hint" style={{ marginTop: 6 }}>
                      {meal.items
                        .map((item) => [item.qty, item.text].filter(Boolean).join(' '))
                        .join(' · ')}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="field">
                <span className="field__label">Como aplicar</span>
                <div className="seg">
                  <button
                    className="seg__btn"
                    aria-pressed={mode === 'replace'}
                    onClick={() => setMode('replace')}
                  >
                    Substituir plano
                  </button>
                  <button
                    className="seg__btn"
                    aria-pressed={mode === 'append'}
                    onClick={() => setMode('append')}
                  >
                    Adicionar ao atual
                  </button>
                </div>
              </div>
            </>
          )}

          <details>
            <summary className="hint" style={{ cursor: 'pointer' }}>
              Ver e ajustar o texto extraído
            </summary>
            <div className="stack" style={{ marginTop: 12 }}>
              <textarea
                className="textarea"
                style={{ minHeight: 200 }}
                value={stage.text}
                onChange={(event) =>
                  setStage({ ...stage, text: event.target.value })
                }
              />
              <button
                className="btn btn--sm btn--outline"
                onClick={() => review(stage.name, stage.text)}
              >
                <RefreshCw size={14} /> Analisar de novo
              </button>
            </div>
          </details>
        </div>
      )}
    </Sheet>
  )
}
