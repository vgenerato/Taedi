import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Flame, NotebookPen, Scale, UtensilsCrossed } from 'lucide-react'
import { Ring, type SegmentState } from '../components/Ring.tsx'
import { MealCard } from '../components/MealCard.tsx'
import { Celebration } from '../components/Celebration.tsx'
import { useAppState } from '../lib/store.ts'
import { dayStatus, mealsForDate, XP_PER_DAY, XP_PER_MEAL } from '../lib/selectors.ts'
import { currentStreak } from '../lib/selectors.ts'
import {
  markCelebrated,
  setDayNote,
  setMealStatus,
  setWeight,
  toggleItem,
  toggleMeal,
} from '../lib/actions.ts'
import {
  addDays,
  dayLabel,
  greeting,
  minutesNow,
  relativeDayLabel,
  timeToMinutes,
  today,
} from '../lib/date.ts'

type Props = {
  date: string
  onDateChange: (date: string) => void
  onGoToPlan: () => void
}

export function TodayScreen({ date, onDateChange, onGoToPlan }: Props) {
  const state = useAppState()
  const meals = useMemo(() => mealsForDate(state, date), [state, date])
  const log = state.logs[date]
  const status = dayStatus(state, date)
  const streak = currentStreak(state)
  const isToday = date === today()

  const [weightDraft, setWeightDraft] = useState('')
  const [noteDraft, setNoteDraft] = useState('')

  useEffect(() => {
    setWeightDraft(log?.weight != null ? String(log.weight) : '')
    setNoteDraft(log?.note ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  const showIntro =
    state.plan.source.kind === 'exemplo' && Object.keys(state.logs).length === 0

  const celebrate = status.complete && !state.celebrated.includes(date)

  /** A refeição "agora" é a próxima em aberto mais perto do relógio. */
  const nowId = useMemo(() => {
    if (!isToday) return null
    const minutes = minutesNow()
    const pending = meals.filter((m) => log?.meals[m.id]?.status !== 'done')
    const upcoming = pending.find((m) => timeToMinutes(m.time) >= minutes - 45)
    return (upcoming ?? pending[pending.length - 1])?.id ?? null
  }, [meals, log, isToday])

  const segments: SegmentState[] = meals.map((meal) => {
    const entry = log?.meals[meal.id]
    if (entry?.status === 'done') return 'done'
    if (entry?.status === 'skipped') return 'skipped'
    return 'pending'
  })

  const commitWeight = () => {
    const normalized = weightDraft.replace(',', '.').trim()
    if (!normalized) {
      setWeight(date, null)
      return
    }
    const value = Number(normalized)
    if (Number.isFinite(value) && value > 20 && value < 400) setWeight(date, Number(value.toFixed(1)))
  }

  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">{isToday ? greeting() : 'Registro'}</p>
          <h1 className="page__title">{relativeDayLabel(date)}</h1>
          {isToday && <p className="page__sub">{dayLabel(date)}</p>}
        </div>
        <div className="row" style={{ gap: 4, alignItems: 'center' }}>
          <button
            className="btn btn--icon"
            onClick={() => onDateChange(addDays(date, -1))}
            aria-label="Dia anterior"
          >
            <ChevronLeft size={18} />
          </button>
          {!isToday && (
            <button className="btn btn--sm btn--outline" onClick={() => onDateChange(today())}>
              <CalendarDays size={14} /> hoje
            </button>
          )}
          <button
            className="btn btn--icon"
            onClick={() => onDateChange(addDays(date, 1))}
            aria-label="Próximo dia"
            disabled={date >= today()}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {showIntro && (
        <section className="notice">
          <div>
            <p className="notice__title">Este é um plano de exemplo</p>
            <p className="hint">
              Importe o PDF da sua dieta e o Taedi monta as refeições, horários e quantidades.
            </p>
          </div>
          <button className="btn btn--primary" onClick={onGoToPlan}>
            Importar meu plano
          </button>
        </section>
      )}

      <section className="daycard">
        <div className="ringwrap">
          <Ring segments={segments} size={116} stroke={10} />
          <div className="ringwrap__center">
            <span className="ringwrap__value tnum" style={{ fontSize: 'var(--step-3)' }}>
              {status.expected ? Math.round(status.ratio * 100) : 0}%
            </span>
            <span className="ringwrap__label">do dia</span>
          </div>
        </div>
        <div className="daycard__body">
          <h2 className="daycard__title">
            {status.expected === 0
              ? 'Nenhuma refeição para hoje'
              : status.complete
                ? 'Dia completo, tudo em ordem'
                : `${status.done} de ${status.expected} refeições`}
          </h2>
          <div className="daycard__meta">
            {streak > 0 && (
              <span className="chip chip--ember">
                <Flame size={13} /> {streak} {streak === 1 ? 'dia seguido' : 'dias seguidos'}
              </span>
            )}
            {status.done > 0 && (
              <span className="chip">
                +{status.done * XP_PER_MEAL + (status.complete ? XP_PER_DAY : 0)} XP no dia
              </span>
            )}
            {status.skipped > 0 && (
              <span className="chip chip--clay">
                {status.skipped} {status.skipped === 1 ? 'pulada' : 'puladas'}
              </span>
            )}
          </div>
          <div className="daycard__line">
            <div className="bar">
              <div className="bar__fill" style={{ width: `${Math.round(status.ratio * 100)}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="split">
        <div>
          {meals.length === 0 ? (
            <div className="card">
              <div className="empty">
                <span className="empty__icon">
                  <UtensilsCrossed size={22} />
                </span>
                <h3 className="empty__title">Sem refeições neste dia</h3>
                <p className="hint">
                  Monte seu plano ou importe o PDF da nutricionista para começar a marcar.
                </p>
                <button className="btn btn--primary" onClick={onGoToPlan}>
                  Abrir meu plano
                </button>
              </div>
            </div>
          ) : (
            <ul
              className="timeline"
              style={{ ['--done' as string]: `${Math.round(status.ratio * 100)}%` }}
            >
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  entry={log?.meals[meal.id]}
                  isNow={meal.id === nowId}
                  onToggleMeal={() => toggleMeal(date, meal.id)}
                  onToggleItem={(itemId) => toggleItem(date, meal.id, itemId)}
                  onSkip={() => setMealStatus(date, meal.id, 'skipped')}
                  onUndo={() => setMealStatus(date, meal.id, null)}
                />
              ))}
            </ul>
          )}
        </div>

        <aside className="stack">
          <section className="card">
            <header className="card__head">
              <h2 className="card__title">Registro do dia</h2>
            </header>
            <div className="card__body stack">
              <label className="field">
                <span className="field__label">
                  <Scale size={13} style={{ verticalAlign: '-2px' }} /> Peso de hoje (kg)
                </span>
                <input
                  className="input tnum"
                  inputMode="decimal"
                  placeholder="ex.: 72,4"
                  value={weightDraft}
                  onChange={(event) => setWeightDraft(event.target.value)}
                  onBlur={commitWeight}
                />
              </label>
              <label className="field">
                <span className="field__label">
                  <NotebookPen size={13} style={{ verticalAlign: '-2px' }} /> Como foi o dia
                </span>
                <textarea
                  className="textarea"
                  placeholder="Fome à tarde, treino pesado, comi fora…"
                  value={noteDraft}
                  onChange={(event) => setNoteDraft(event.target.value)}
                  onBlur={() => setDayNote(date, noteDraft.trim())}
                />
              </label>
            </div>
          </section>

          <p className="hint">
            Marque item por item ou use o botão da refeição inteira. Cada refeição vale{' '}
            {XP_PER_MEAL} XP e fechar o dia vale {XP_PER_DAY} XP.
          </p>
        </aside>
      </div>

      {celebrate && <Celebration date={date} onClose={() => markCelebrated(date)} />}
    </>
  )
}
