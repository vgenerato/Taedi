import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'

type ToastContext = (message: string) => void

const Ctx = createContext<ToastContext>(() => {})

export function useToast(): ToastContext {
  return useContext(Ctx)
}

export function ToastHost({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null)

  const show = useCallback((text: string) => setMessage(text), [])

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(() => setMessage(null), 2600)
    return () => window.clearTimeout(timer)
  }, [message])

  const value = useMemo(() => show, [show])

  return (
    <Ctx.Provider value={value}>
      {children}
      {message && (
        <div className="toast" role="status">
          <Check size={15} />
          {message}
        </div>
      )}
    </Ctx.Provider>
  )
}
