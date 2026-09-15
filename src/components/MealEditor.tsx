import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Sheet } from './Sheet.tsx'
import type { Meal, MealItem } from '../lib/types.ts'
import { uid } from '../lib/id.ts'
import { WEEKDAY_LABEL, WEEKDAY_SHORT } from '../lib/date.ts'

type Props = {
  meal: Meal | null
  onSave: (meal: Meal) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export function emptyMeal(): Meal {
  return {
    id: uid('m'),
    name: '',
    time: '12:00',
    items: [{ id: uid('i'), text: '' }],
    days: [0, 1, 2, 3, 4, 5, 6],
    active: true,
  }
}

export function MealEditor({ meal, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Meal>(meal ?? emptyMeal())
  const isNew = !meal

  const patch = (changes: Partial<Meal>) => setDraft((current) => ({ ...current, ...changes }))

  const patchItem = (id: string, changes: Partial<MealItem>) =>
    patch({ items: draft.items.map((item) => (item.id === id ? { ...item, ...changes } : item)) })

  const addItem = () => patch({ items: [...draft.items, { id: uid('i'), text: '' }] })

  const removeItem = (id: string) => patch({ items: draft.items.filter((item) => item.id !== id) })

  const toggleDay = (day: number) =>
    patch({
      days: draft.days.includes(day)
        ? draft.days.filter((d) => d !== day)
        : [...draft.days, day].sort(),
    })

  const save = () => {
    const items = draft.items
      .map((item) => ({ ...item, text: item.text.trim(), qty: item.qty?.trim() || undefined }))
      .filter((item) => item.text)
    onSave({
      ...draft,
      name: draft.name.trim() || 'Refeição',
      note: draft.note?.trim() || undefined,
      days: draft.days.length ? draft.days : [0, 1, 2, 3, 4, 5, 6],
      items,
    })
  }

  return (
    <Sheet
      title={isNew ? 'Nova refeição' : 'Editar refeição'}
      onClose={onClose}
      footer={
        <>
          {!isNew && onDelete && (
            <button
              className="btn btn--danger"
              style={{ flex: '0 0 auto' }}
              onClick={() => onDelete(draft.id)}
              aria-label="Excluir refeição"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={save}>
            Salvar
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="row">
          <label className="field" style={{ flex: 1 }}>
            <span className="field__label">Nome</span>
            <input
              className="input"
              data-autofocus
              value={draft.name}
              placeholder="Café da manhã"
              onChange={(event) => patch({ name: event.target.value })}
            />
          </label>
          <label className="field" style={{ width: 120, flex: 'none' }}>
            <span className="field__label">Horário</span>
            <input
              className="input input--time"
              type="time"
              value={draft.time}
              onChange={(event) => patch({ time: event.target.value })}
            />
          </label>
        </div>

        <div className="field">
          <span className="field__label">Dias da semana</span>
          <div className="dayspick">
            {WEEKDAY_SHORT.map((letter, day) => (
              <button
                key={day}
                className="dayspick__day"
                aria-pressed={draft.days.includes(day)}
                aria-label={WEEKDAY_LABEL[day]}
                onClick={() => toggleDay(day)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Itens</span>
          <div className="stack stack--tight">
            {draft.items.map((item) => (
              <div key={item.id} className="itemedit">
                <input
                  className="input"
                  style={{ flex: '0 0 96px' }}
                  value={item.qty ?? ''}
                  placeholder="100 g"
                  aria-label="Quantidade"
                  onChange={(event) => patchItem(item.id, { qty: event.target.value })}
                />
                <input
                  className="input"
                  value={item.text}
                  placeholder="Alimento"
                  aria-label="Alimento"
                  onChange={(event) => patchItem(item.id, { text: event.target.value })}
                />
                <button
                  className="btn btn--icon"
                  onClick={() => removeItem(item.id)}
                  aria-label="Remover item"
                  disabled={draft.items.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn--sm btn--ghost" style={{ marginTop: 8 }} onClick={addItem}>
            <Plus size={15} /> adicionar item
          </button>
        </div>

        <label className="field">
          <span className="field__label">Observação (opcional)</span>
          <textarea
            className="textarea"
            style={{ minHeight: 64 }}
            value={draft.note ?? ''}
            placeholder="Beber 300 ml de água junto"
            onChange={(event) => patch({ note: event.target.value })}
          />
        </label>
      </div>
    </Sheet>
  )
}
