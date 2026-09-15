import { useMemo, useState } from 'react'
import { Eye, EyeOff, FileDown, FilePlus2, Pencil, Sparkle, UtensilsCrossed } from 'lucide-react'
import { MealEditor } from '../components/MealEditor.tsx'
import { ImportSheet } from '../components/ImportSheet.tsx'
import { useToast } from '../components/Toast.tsx'
import { useAppState } from '../lib/store.ts'
import { addMeals, removeMeal, replacePlan, restoreExamplePlan, saveMeal, setMealActive } from '../lib/actions.ts'
import type { Meal } from '../lib/types.ts'
import { WEEKDAY_LABEL, timeToMinutes } from '../lib/date.ts'

function daysLabel(days: number[]): string {
  if (days.length === 7) return 'todos os dias'
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'dias de semana'
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'fim de semana'
  if (days.length === 0) return 'nenhum dia'
  return days.map((d) => WEEKDAY_LABEL[d]).join(', ')
}

export function PlanScreen() {
  const state = useAppState()
  const toast = useToast()
  const [editing, setEditing] = useState<Meal | null | undefined>(undefined)
  const [importing, setImporting] = useState(false)

  const meals = useMemo(
    () => [...state.plan.meals].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)),
    [state.plan.meals],
  )

  const source = state.plan.source
  const sourceLabel =
    source.kind === 'pdf'
      ? `importado de ${source.name ?? 'PDF'}`
      : source.kind === 'exemplo'
        ? 'plano de exemplo'
        : 'plano montado por você'

  const totalItems = meals.reduce((sum, meal) => sum + meal.items.length, 0)

  return (
    <>
      <div className="page__head page__head--actions">
        <div>
          <p className="eyebrow">Plano alimentar</p>
          <h1 className="page__title">Meu plano</h1>
          <p className="page__sub">
            {meals.length} {meals.length === 1 ? 'refeição' : 'refeições'} · {totalItems} itens ·{' '}
            {sourceLabel}
          </p>
        </div>
        <div className="row row--wrap">
          <button className="btn btn--outline" onClick={() => setImporting(true)}>
            <FileDown size={16} /> Importar PDF
          </button>
          <button className="btn btn--primary" onClick={() => setEditing(null)}>
            <FilePlus2 size={16} /> Nova refeição
          </button>
        </div>
      </div>

      {meals.length === 0 ? (
        <div className="card">
          <div className="empty">
            <span className="empty__icon">
              <UtensilsCrossed size={22} />
            </span>
            <h3 className="empty__title">Seu plano está vazio</h3>
            <p className="hint">
              Importe o PDF da nutricionista ou crie as refeições uma a uma, com horário e itens.
            </p>
            <div className="row">
              <button className="btn btn--outline" onClick={restoreExamplePlan}>
                <Sparkle size={15} /> Usar exemplo
              </button>
              <button className="btn btn--primary" onClick={() => setImporting(true)}>
                <FileDown size={16} /> Importar PDF
              </button>
            </div>
          </div>
        </div>
      ) : (
        <section className="card card--flat">
          <ul>
            {meals.map((meal) => (
              <li key={meal.id} className={`planmeal ${meal.active ? '' : 'planmeal--off'}`}>
                <span className="planmeal__time tnum">{meal.time}</span>
                <div className="planmeal__body">
                  <p className="planmeal__name">{meal.name}</p>
                  <p className="planmeal__sub">
                    {meal.items.length} {meal.items.length === 1 ? 'item' : 'itens'} ·{' '}
                    {daysLabel(meal.days)}
                    {meal.active ? '' : ' · pausada'}
                  </p>
                </div>
                <div className="planmeal__actions">
                  <button
                    className="btn btn--icon"
                    aria-label={meal.active ? 'Pausar refeição' : 'Reativar refeição'}
                    title={meal.active ? 'Pausar' : 'Reativar'}
                    onClick={() => setMealActive(meal.id, !meal.active)}
                  >
                    {meal.active ? <Eye size={17} /> : <EyeOff size={17} />}
                  </button>
                  <button
                    className="btn btn--icon"
                    aria-label={`Editar ${meal.name}`}
                    onClick={() => setEditing(meal)}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="hint" style={{ marginTop: 'var(--s-4)' }}>
        Refeições pausadas somem da lista do dia e deixam de contar nas metas — útil para dias de
        treino, jejum ou uma fase diferente do plano.
      </p>

      {editing !== undefined && (
        <MealEditor
          meal={editing}
          onClose={() => setEditing(undefined)}
          onSave={(meal) => {
            saveMeal(meal)
            setEditing(undefined)
            toast('Refeição salva')
          }}
          onDelete={(id) => {
            removeMeal(id)
            setEditing(undefined)
            toast('Refeição removida')
          }}
        />
      )}

      {importing && (
        <ImportSheet
          onClose={() => setImporting(false)}
          onImport={(imported, planSource, mode) => {
            if (mode === 'replace') replacePlan(imported, planSource)
            else addMeals(imported, planSource)
            setImporting(false)
            toast(`${imported.length} refeições importadas`)
          }}
        />
      )}
    </>
  )
}
