import { useEffect, useMemo, useState } from 'react'
import { Flame, Sparkles, Trophy } from 'lucide-react'
import { useAppState } from '../lib/store.ts'
import { snapshot, badgeStates } from '../lib/progress.ts'
import { markBadgesSeen } from '../lib/actions.ts'
import { XP_PER_DAY, XP_PER_MEAL, dayStatus } from '../lib/selectors.ts'
import { relativeDayLabel } from '../lib/date.ts'

export function Celebration({ date, onClose }: { date: string; onClose: () => void }) {
  const state = useAppState()
  const snap = useMemo(() => snapshot(state), [state])
  const status = dayStatus(state, date)

  /* Congelado na abertura: marcar como vistas não pode apagar a lista da tela. */
  const [fresh] = useState(() =>
    badgeStates(state, snap).filter((b) => b.unlocked && !state.seenBadges.includes(b.id)),
  )

  useEffect(() => {
    if (fresh.length) markBadgesSeen(fresh.map((b) => b.id))
  }, [fresh])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const earned = status.done * XP_PER_MEAL + XP_PER_DAY

  return (
    <div className="cheer" role="dialog" aria-modal="true" aria-label="Dia completo">
      <div className="cheer__panel">
        <span className="cheer__seal">
          <Sparkles size={44} strokeWidth={1.4} />
        </span>
        <div>
          <h2 className="cheer__title">Dia completo</h2>
          <p className="hint" style={{ marginTop: 6 }}>
            {relativeDayLabel(date)} — {status.done}{' '}
            {status.done === 1 ? 'refeição registrada' : 'refeições registradas'}, nenhuma sobrando.
          </p>
        </div>
        <div className="cheer__rewards">
          <span className="chip chip--leaf">+{earned} XP</span>
          {snap.streak > 0 && (
            <span className="chip chip--ember">
              <Flame size={13} /> {snap.streak} {snap.streak === 1 ? 'dia' : 'dias'}
            </span>
          )}
          <span className="chip">
            {snap.level.name} · nível {snap.level.level}
          </span>
        </div>

        {fresh.length > 0 && (
          <div className="stack stack--tight" style={{ width: '100%' }}>
            {fresh.map((badge) => (
              <div key={badge.id} className="chip chip--gold" style={{ justifyContent: 'center' }}>
                <Trophy size={13} /> nova conquista: {badge.name}
              </div>
            ))}
          </div>
        )}

        <button className="btn btn--primary btn--block" onClick={onClose} data-autofocus>
          Seguir
        </button>
      </div>
    </div>
  )
}
