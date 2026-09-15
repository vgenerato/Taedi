import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Flame, ListChecks, Sun, Trophy } from 'lucide-react'
import { Logo } from './components/Logo.tsx'
import { ToastHost, useToast } from './components/Toast.tsx'
import { TodayScreen } from './screens/TodayScreen.tsx'
import { PlanScreen } from './screens/PlanScreen.tsx'
import { MonthScreen } from './screens/MonthScreen.tsx'
import { ProfileScreen } from './screens/ProfileScreen.tsx'
import { useAppState } from './lib/store.ts'
import { markBadgesSeen } from './lib/actions.ts'
import { badgeStates, snapshot } from './lib/progress.ts'
import { dayStatus } from './lib/selectors.ts'
import { today } from './lib/date.ts'

type Tab = 'hoje' | 'plano' | 'mes' | 'progresso'

const TABS: { id: Tab; label: string; icon: typeof Sun }[] = [
  { id: 'hoje', label: 'Hoje', icon: Sun },
  { id: 'plano', label: 'Plano', icon: ListChecks },
  { id: 'mes', label: 'Mês', icon: CalendarDays },
  { id: 'progresso', label: 'Progresso', icon: Trophy },
]

function useTheme(preference: 'auto' | 'light' | 'dark') {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const resolved = preference === 'auto' ? (media.matches ? 'dark' : 'light') : preference
      document.documentElement.dataset.theme = resolved
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [preference])
}

function Shell() {
  const state = useAppState()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('hoje')
  const [date, setDate] = useState(today())

  useTheme(state.settings.theme)

  const snap = useMemo(() => snapshot(state), [state])
  const todayStatus = dayStatus(state, today())
  const celebrationPending = todayStatus.complete && !state.celebrated.includes(today())

  /* Conquistas fora do dia completo aparecem como aviso curto. */
  useEffect(() => {
    if (celebrationPending) return
    const fresh = badgeStates(state, snap).filter(
      (badge) => badge.unlocked && !state.seenBadges.includes(badge.id),
    )
    if (!fresh.length) return
    toast(`Nova conquista: ${fresh[0].name}`)
    markBadgesSeen(fresh.map((badge) => badge.id))
  }, [state, snap, celebrationPending, toast])

  const goToDate = (next: string) => {
    setDate(next)
    setTab('hoje')
  }

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <Logo />
          <div>
            <p className="brand__name">Taedi</p>
            <p className="brand__tag">sua dieta, dia após dia</p>
          </div>
        </div>
        <nav className="rail__nav" aria-label="Seções">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className="rail__item"
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => {
                if (id === 'hoje') setDate(today())
                setTab(id)
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="rail__foot">
          {snap.streak > 0 && (
            <span className="chip chip--ember">
              <Flame size={13} /> {snap.streak} {snap.streak === 1 ? 'dia seguido' : 'dias seguidos'}
            </span>
          )}
          <span className="chip">
            nível {snap.level.level} · {snap.level.name}
          </span>
        </div>
      </aside>

      <main className="shell__main">
        <div className="topbar topbar--mobile">
          <div className="brand">
            <Logo size={30} />
            <p className="brand__name">Taedi</p>
          </div>
          {snap.streak > 0 && (
            <span className="chip chip--ember">
              <Flame size={13} /> {snap.streak}
            </span>
          )}
        </div>

        {tab === 'hoje' && (
          <TodayScreen date={date} onDateChange={setDate} onGoToPlan={() => setTab('plano')} />
        )}
        {tab === 'plano' && <PlanScreen />}
        {tab === 'mes' && <MonthScreen onPickDate={goToDate} />}
        {tab === 'progresso' && <ProfileScreen />}
      </main>

      <nav className="nav" aria-label="Seções">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className="nav__item"
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => {
              if (id === 'hoje') setDate(today())
              setTab(id)
            }}
          >
            <span className="nav__icon">
              <Icon size={19} />
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <ToastHost>
      <Shell />
    </ToastHost>
  )
}
