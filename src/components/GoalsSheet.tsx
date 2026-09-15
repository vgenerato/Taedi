import { useState } from 'react'
import { Sheet } from './Sheet.tsx'
import type { Goals } from '../lib/types.ts'

type Props = {
  goals: Goals
  onSave: (goals: Goals) => void
  onClose: () => void
}

export function GoalsSheet({ goals, onSave, onClose }: Props) {
  const [perfectDays, setPerfectDays] = useState(String(goals.perfectDays))
  const [adherence, setAdherence] = useState(String(goals.adherence))
  const [weight, setWeight] = useState(goals.weightTarget != null ? String(goals.weightTarget) : '')

  const save = () => {
    const days = Math.max(1, Math.min(31, Number(perfectDays) || goals.perfectDays))
    const rate = Math.max(10, Math.min(100, Number(adherence) || goals.adherence))
    const target = Number(weight.replace(',', '.'))
    onSave({
      perfectDays: days,
      adherence: rate,
      weightTarget: Number.isFinite(target) && target > 20 && target < 400 ? target : undefined,
    })
  }

  return (
    <Sheet
      title="Metas do mês"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--outline" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={save}>
            Salvar metas
          </button>
        </>
      }
    >
      <div className="stack">
        <label className="field">
          <span className="field__label">Dias completos por mês</span>
          <input
            className="input tnum"
            data-autofocus
            inputMode="numeric"
            value={perfectDays}
            onChange={(event) => setPerfectDays(event.target.value)}
          />
          <span className="hint">Um dia conta como completo quando todas as refeições previstas são marcadas.</span>
        </label>
        <label className="field">
          <span className="field__label">Aderência mínima (%)</span>
          <input
            className="input tnum"
            inputMode="numeric"
            value={adherence}
            onChange={(event) => setAdherence(event.target.value)}
          />
          <span className="hint">Proporção de refeições concluídas sobre as previstas no mês.</span>
        </label>
        <label className="field">
          <span className="field__label">Peso desejado (kg) — opcional</span>
          <input
            className="input tnum"
            inputMode="decimal"
            placeholder="ex.: 70"
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </label>
      </div>
    </Sheet>
  )
}
