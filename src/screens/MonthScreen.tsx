import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Scale, SlidersHorizontal, Target } from 'lucide-react'
import { Ring } from '../components/Ring.tsx'
import { WeightChart } from '../components/WeightChart.tsx'
import { GoalsSheet } from '../components/GoalsSheet.tsx'
import { useToast } from '../components/Toast.tsx'
import { useAppState } from '../lib/store.ts'
import { currentMonth, dayStatus, monthStats } from '../lib/selectors.ts'
import { setGoals } from '../lib/actions.ts'
import { WEEKDAY_SHORT, fromISODate, monthLabel, shiftMonth, shortDayLabel, today } from '../lib/date.ts'

export function MonthScreen({ onPickDate }: { onPickDate: (date: string) => void }) {
  const state = useAppState()
  const toast = useToast()
  const [month, setMonth] = useState(currentMonth())
  const [editingGoals, setEditingGoals] = useState(false)

  const stats = useMemo(() => monthStats(state, month), [state, month])
  const t = today()
  const leadingBlanks = fromISODate(stats.days[0]).getDay()

  const goalDaysPct = Math.min(100, Math.round((stats.perfectDays / Math.max(1, state.goals.perfectDays)) * 100))
  const goalRatePct = Math.min(100, Math.round((stats.adherence / Math.max(1, state.goals.adherence)) * 100))

  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">Acompanhamento</p>
          <h1 className="page__title">{monthLabel(month)}</h1>
        </div>
        <div className="row" style={{ gap: 4, alignItems: 'center' }}>
          <button
            className="btn btn--icon"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="btn btn--icon"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="Próximo mês"
            disabled={month >= currentMonth()}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="stack">
        <section className="card">
          <div className="card__body grid4">
            <div className="stat">
              <span className="stat__value">{stats.perfectDays}</span>
              <span className="stat__label">dias completos</span>
            </div>
            <div className="stat">
              <span className="stat__value">
                {stats.adherence}
                <span className="stat__unit">%</span>
              </span>
              <span className="stat__label">aderência</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.bestRun}</span>
              <span className="stat__label">melhor sequência</span>
            </div>
            <div className="stat">
              <span className="stat__value">{stats.doneMeals}</span>
              <span className="stat__label">refeições feitas</span>
            </div>
          </div>
          {stats.countingFrom && (
            <p className="hint" style={{ padding: '0 var(--s-5) var(--s-5)' }}>
              A contagem do mês começa em {shortDayLabel(stats.countingFrom)}, seu primeiro
              registro — os dias anteriores não pesam na aderência.
            </p>
          )}
        </section>

        <div className="split">
          <section className="card">
            <header className="card__head">
              <h2 className="card__title">Calendário</h2>
              <span className="hint">toque num dia para registrar</span>
            </header>
            <div className="card__body">
              <div className="cal">
                <div className="cal__grid" aria-hidden="true">
                  {WEEKDAY_SHORT.map((letter, index) => (
                    <span key={index} className="cal__dow">
                      {letter}
                    </span>
                  ))}
                </div>
                <div className="cal__grid">
                  {Array.from({ length: leadingBlanks }, (_, index) => (
                    <span key={`void-${index}`} className="cal__cell cal__cell--void" />
                  ))}
                  {stats.days.map((date) => {
                    const status = dayStatus(state, date)
                    const future = date > t
                    const className = [
                      'cal__cell',
                      status.complete ? 'cal__cell--full' : '',
                      date === t ? 'cal__cell--today' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <button
                        key={date}
                        className={className}
                        disabled={future}
                        onClick={() => onPickDate(date)}
                        aria-label={`${Number(date.slice(-2))} — ${status.done} de ${status.expected} refeições`}
                        title={`${status.done}/${status.expected} refeições`}
                      >
                        <Ring
                          value={future ? 0 : status.ratio}
                          size={38}
                          stroke={3.5}
                          className={future ? 'cal__future' : ''}
                        />
                        <span className="cal__num tnum">{Number(date.slice(-2))}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <div className="stack">
            <section className="card">
              <header className="card__head">
                <h2 className="card__title">
                  <Target size={16} style={{ verticalAlign: '-3px' }} /> Metas do mês
                </h2>
                <button
                  className="btn btn--icon"
                  onClick={() => setEditingGoals(true)}
                  aria-label="Ajustar metas"
                >
                  <SlidersHorizontal size={16} />
                </button>
              </header>
              <div className="card__body stack">
                <div className="stack stack--tight">
                  <div className="row row--between">
                    <span className="list__label">Dias completos</span>
                    <span className="hint tnum">
                      {stats.perfectDays} / {state.goals.perfectDays}
                    </span>
                  </div>
                  <div className="bar">
                    <div className="bar__fill" style={{ width: `${goalDaysPct}%` }} />
                  </div>
                </div>
                <div className="stack stack--tight">
                  <div className="row row--between">
                    <span className="list__label">Aderência</span>
                    <span className="hint tnum">
                      {stats.adherence}% / {state.goals.adherence}%
                    </span>
                  </div>
                  <div className="bar">
                    <div className="bar__fill bar__fill--gold" style={{ width: `${goalRatePct}%` }} />
                  </div>
                </div>
                <p className="hint">
                  {stats.perfectDays >= state.goals.perfectDays
                    ? 'Meta de dias completos alcançada neste mês.'
                    : `Faltam ${state.goals.perfectDays - stats.perfectDays} dias completos para bater a meta.`}
                </p>
              </div>
            </section>

            <section className="card">
              <header className="card__head">
                <h2 className="card__title">
                  <Scale size={16} style={{ verticalAlign: '-3px' }} /> Peso
                </h2>
                {stats.weights.length > 1 && (
                  <span className="hint tnum">
                    {(stats.weights[stats.weights.length - 1].value - stats.weights[0].value >= 0 ? '+' : '') +
                      (stats.weights[stats.weights.length - 1].value - stats.weights[0].value).toFixed(1)}{' '}
                    kg no mês
                  </span>
                )}
              </header>
              <div className="card__body">
                {stats.weights.length === 0 ? (
                  <p className="hint">
                    Registre seu peso na tela de hoje para ver a curva do mês aqui.
                  </p>
                ) : (
                  <WeightChart points={stats.weights} target={state.goals.weightTarget} />
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {editingGoals && (
        <GoalsSheet
          goals={state.goals}
          onClose={() => setEditingGoals(false)}
          onSave={(goals) => {
            setGoals(goals)
            setEditingGoals(false)
            toast('Metas atualizadas')
          }}
        />
      )}
    </>
  )
}
