import { useMemo, useRef, useState } from 'react'
import { Download, Flame, Trophy, Upload, Trash2, Check } from 'lucide-react'
import { useAppState } from '../lib/store.ts'
import { useToast } from '../components/Toast.tsx'
import { badgeStates, snapshot } from '../lib/progress.ts'
import { importState, resetEverything, setSettings } from '../lib/actions.ts'
import { parseImportedState } from '../lib/storage.ts'
import { XP_PER_DAY, XP_PER_MEAL } from '../lib/selectors.ts'
import { shortDayLabel } from '../lib/date.ts'

const THEMES = [
  { id: 'auto', label: 'Sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
] as const

export function ProfileScreen() {
  const state = useAppState()
  const toast = useToast()
  const snap = useMemo(() => snapshot(state), [state])
  const badges = useMemo(() => badgeStates(state, snap), [state, snap])
  const fileInput = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `taedi-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast('Backup salvo')
  }

  const unlocked = badges.filter((badge) => badge.unlocked).length

  return (
    <>
      <div className="page__head">
        <div>
          <p className="eyebrow">Progresso</p>
          <h1 className="page__title">{state.settings.name ? state.settings.name : 'Sua jornada'}</h1>
          <p className="page__sub">
            {snap.firstDate ? `registrando desde ${shortDayLabel(snap.firstDate)}` : 'comece marcando a primeira refeição'}
          </p>
        </div>
      </div>

      <div className="stack">
        <section className="card">
          <div className="card__body stack">
            <div className="level">
              <span className="level__mark tnum">{snap.level.level}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="card__title">{snap.level.name}</h2>
                <p className="hint">
                  {snap.xp} XP · faltam {snap.level.toNext} para o próximo nível
                </p>
              </div>
            </div>
            <div className="bar">
              <div className="bar__fill" style={{ width: `${snap.level.pct}%` }} />
            </div>
            <div className="grid4">
              <div className="stat">
                <span className="stat__value">{snap.streak}</span>
                <span className="stat__label">
                  <Flame size={11} style={{ verticalAlign: '-1px' }} /> sequência atual
                </span>
              </div>
              <div className="stat">
                <span className="stat__value">{snap.best}</span>
                <span className="stat__label">melhor sequência</span>
              </div>
              <div className="stat">
                <span className="stat__value">{snap.perfectDays}</span>
                <span className="stat__label">dias completos</span>
              </div>
              <div className="stat">
                <span className="stat__value">{snap.mealsDone}</span>
                <span className="stat__label">refeições</span>
              </div>
            </div>
            <p className="hint">
              Cada refeição marcada vale {XP_PER_MEAL} XP e fechar o dia inteiro soma mais{' '}
              {XP_PER_DAY} XP.
            </p>
          </div>
        </section>

        <section className="card">
          <header className="card__head">
            <h2 className="card__title">
              <Trophy size={16} style={{ verticalAlign: '-3px' }} /> Conquistas
            </h2>
            <span className="hint tnum">
              {unlocked} de {badges.length}
            </span>
          </header>
          <div className="card__body">
            <div className="badges">
              {badges.map((badge) => (
                <div key={badge.id} className={`badge ${badge.unlocked ? '' : 'badge--locked'}`}>
                  <span className="badge__seal">
                    {badge.unlocked ? <Check size={20} strokeWidth={2.4} /> : <Trophy size={18} />}
                  </span>
                  <span className="badge__name">{badge.name}</span>
                  <span className="badge__hint">
                    {badge.unlocked ? 'conquistado' : badge.hint}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <header className="card__head">
            <h2 className="card__title">Ajustes</h2>
          </header>
          <div className="list">
            <div className="list__row">
              <span className="list__label">Seu nome</span>
              <input
                className="input"
                style={{ maxWidth: 200 }}
                value={state.settings.name}
                placeholder="opcional"
                onChange={(event) => setSettings({ name: event.target.value })}
              />
            </div>
            <div className="list__row">
              <span className="list__label">Tema</span>
              <div className="seg">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    className="seg__btn"
                    aria-pressed={state.settings.theme === theme.id}
                    onClick={() => setSettings({ theme: theme.id })}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="list__row">
              <div>
                <p className="list__label">Seus dados</p>
                <p className="hint">Ficam só neste aparelho. Guarde uma cópia se trocar de celular.</p>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn--sm btn--outline" onClick={exportData}>
                  <Download size={14} /> Exportar
                </button>
                <button className="btn btn--sm btn--outline" onClick={() => fileInput.current?.click()}>
                  <Upload size={14} /> Importar
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="application/json,.json"
                  hidden
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (!file) return
                    try {
                      importState(parseImportedState(await file.text()))
                      toast('Dados restaurados')
                    } catch {
                      toast('Arquivo inválido')
                    }
                  }}
                />
              </div>
            </div>
            <div className="list__row">
              <div>
                <p className="list__label">Recomeçar</p>
                <p className="hint">Apaga plano, registros e conquistas deste aparelho.</p>
              </div>
              {confirmReset ? (
                <div className="row" style={{ gap: 6 }}>
                  <button className="btn btn--sm btn--ghost" onClick={() => setConfirmReset(false)}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn--sm btn--danger"
                    onClick={() => {
                      resetEverything()
                      setConfirmReset(false)
                      toast('Tudo apagado')
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button className="btn btn--sm btn--danger" onClick={() => setConfirmReset(true)}>
                  <Trash2 size={14} /> Apagar
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
