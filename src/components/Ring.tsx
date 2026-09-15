/**
 * O anel é o vocabulário visual do app: um dia vira um círculo dividido em
 * refeições; um mês vira uma grade de círculos menores.
 */
export type SegmentState = 'done' | 'skipped' | 'pending'

const COLORS: Record<SegmentState, string> = {
  done: 'var(--leaf)',
  skipped: 'var(--clay)',
  pending: 'var(--line-strong)',
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const [x1, y1] = polar(cx, cy, r, from)
  const [x2, y2] = polar(cx, cy, r, to)
  const large = to - from > 180 ? 1 : 0
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`
}

type Props = {
  size?: number
  stroke?: number
  /** Um traço por refeição. */
  segments?: SegmentState[]
  /** Alternativa contínua (0 a 1), usada no calendário. */
  value?: number
  className?: string
  title?: string
}

export function Ring({ size = 112, stroke = 9, segments, value, className, title }: Props) {
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2

  const body = () => {
    if (segments && segments.length > 0) {
      if (segments.length === 1) {
        return (
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={COLORS[segments[0]]}
            strokeWidth={stroke}
            className="ring__seg"
          />
        )
      }
      /* A ponta arredondada come o vão; o cálculo devolve o respiro em graus. */
      const step = 360 / segments.length
      const capDeg = ((stroke / 2 / r) * 180) / Math.PI
      const gap = Math.min(step * 0.35, capDeg * 2 + 4)
      return segments.map((state, index) => (
        <path
          key={index}
          className="ring__seg"
          d={arc(cx, cy, r, index * step + gap / 2, (index + 1) * step - gap / 2)}
          fill="none"
          stroke={COLORS[state]}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ))
    }

    const ratio = Math.max(0, Math.min(1, value ?? 0))
    return (
      <>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        {ratio >= 1 ? (
          <circle
            className="ring__seg"
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--leaf)"
            strokeWidth={stroke}
          />
        ) : (
          ratio > 0 && (
            <path
              className="ring__seg"
              d={arc(cx, cy, r, 0, ratio * 360)}
              fill="none"
              stroke="var(--leaf)"
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )
        )}
      </>
    )
  }

  return (
    <svg
      className={['ring', className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
    >
      {(!segments || segments.length === 0) && value === undefined && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
          strokeDasharray="3 7"
          strokeLinecap="round"
        />
      )}
      {body()}
    </svg>
  )
}
