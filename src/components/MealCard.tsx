import { Check, CircleDashed, Info, Undo2 } from 'lucide-react'
import type { Meal, MealEntry } from '../lib/types.ts'

type Props = {
  meal: Meal
  entry?: MealEntry
  isNow?: boolean
  onToggleMeal: () => void
  onToggleItem: (itemId: string) => void
  onSkip: () => void
  onUndo: () => void
}

function clockOf(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function MealCard({ meal, entry, isNow, onToggleMeal, onToggleItem, onSkip, onUndo }: Props) {
  const done = entry?.status === 'done'
  const skipped = entry?.status === 'skipped'
  const marked = new Set(entry?.items ?? [])

  const className = [
    'meal',
    done ? 'meal--done' : '',
    skipped ? 'meal--skipped' : '',
    isNow && !done && !skipped ? 'meal--now' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={className}>
      <article className="meal__card">
        <div className="meal__top">
          <span className="meal__time tnum">{meal.time}</span>
          <h3 className="meal__name">{meal.name}</h3>
          {isNow && !done && !skipped && <span className="chip chip--leaf">agora</span>}
          <button
            className="btn btn--icon"
            onClick={onToggleMeal}
            aria-pressed={done}
            aria-label={done ? `Desfazer ${meal.name}` : `Concluir ${meal.name}`}
            title={done ? 'Desfazer' : 'Concluir refeição'}
          >
            {done ? <Check size={20} /> : <CircleDashed size={20} />}
          </button>
        </div>

        {meal.items.length > 0 && (
          <ul className="meal__items">
            {meal.items.map((item) => {
              const on = marked.has(item.id)
              return (
                <li key={item.id}>
                  <button
                    className={`item ${on ? 'item--on' : ''}`}
                    onClick={() => onToggleItem(item.id)}
                    aria-pressed={on}
                  >
                    <span className="item__box">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    <span className="item__text">
                      {item.qty && <span className="item__qty">{item.qty} </span>}
                      {item.text}
                      {item.alts && item.alts.length > 0 && (
                        <span className="item__alt">ou {item.alts.join(' · ')}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {meal.note && (
          <p className="meal__note">
            <Info size={14} style={{ flex: 'none', marginTop: 2 }} />
            {meal.note}
          </p>
        )}

        <div className="meal__foot">
          {done && (
            <span className="chip chip--leaf">
              <Check size={13} /> concluída {entry?.at ? `às ${clockOf(entry.at)}` : ''}
            </span>
          )}
          {skipped && <span className="chip chip--clay">refeição pulada</span>}
          {!done && !skipped && (
            <button className="btn btn--sm btn--ghost" onClick={onSkip}>
              Pulei essa
            </button>
          )}
          {(done || skipped) && (
            <button className="btn btn--sm btn--ghost" onClick={onUndo}>
              <Undo2 size={14} /> desfazer
            </button>
          )}
        </div>
      </article>
    </li>
  )
}
