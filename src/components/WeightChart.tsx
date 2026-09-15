import { useEffect, useRef, useState } from 'react'
import { shortDayLabel } from '../lib/date.ts'

export type WeightPoint = { date: string; value: number }

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * Uma série só: linha fina, eixo discreto e rótulo direto no último ponto.
 * Sem legenda — o título do cartão já diz o que é.
 */
export function WeightChart({ points, target }: { points: WeightPoint[]; target?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const height = 140
  const pad = { top: 16, right: 44, bottom: 22, left: 8 }
  const w = Math.max(width, 240)
  const innerW = w - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom

  const values = points.map((p) => p.value)
  if (target != null) values.push(target)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const span = Math.max(1, rawMax - rawMin)
  const min = rawMin - span * 0.2
  const max = rawMax + span * 0.2

  const x = (index: number) =>
    points.length === 1 ? pad.left + innerW / 2 : pad.left + (index * innerW) / (points.length - 1)
  const y = (value: number) => pad.top + innerH - ((value - min) / (max - min)) * innerH

  const line = points.map((point, index) => `${x(index)},${y(point.value)}`).join(' L ')
  const area =
    points.length > 1
      ? `M ${x(0)},${pad.top + innerH} L ${line} L ${x(points.length - 1)},${pad.top + innerH} Z`
      : ''

  const active = hover != null ? points[hover] : points[points.length - 1]
  const activeIndex = hover ?? points.length - 1

  return (
    <div ref={ref}>
      <svg
        className="chart"
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        role="img"
        aria-label={`Peso registrado: de ${points[0]?.value} a ${points[points.length - 1]?.value} quilos`}
        onMouseLeave={() => setHover(null)}
      >
        <line className="chart__grid" x1={pad.left} y1={pad.top + innerH} x2={pad.left + innerW} y2={pad.top + innerH} />

        {target != null && (
          <>
            <line
              x1={pad.left}
              y1={y(target)}
              x2={pad.left + innerW}
              y2={y(target)}
              stroke="var(--ink-3)"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <text className="chart__label" x={pad.left + innerW + 6} y={y(target) + 3}>
              meta {target}
            </text>
          </>
        )}

        {points.length > 1 && <path className="chart__area" d={area} opacity="0.7" />}
        {points.length > 1 && <path className="chart__line" d={`M ${line}`} />}

        {points.map((point, index) => (
          <circle
            key={point.date}
            className="chart__dot"
            cx={x(index)}
            cy={y(point.value)}
            r={index === activeIndex ? 4.5 : 2.5}
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}

        {active && (
          <>
            <text
              className="chart__label"
              x={Math.min(x(activeIndex) + 8, pad.left + innerW + 4)}
              y={Math.max(y(active.value) - 9, 12)}
              style={{ fill: 'var(--ink)', fontWeight: 600, fontSize: 11 }}
            >
              {active.value} kg
            </text>
            <text className="chart__label" x={x(activeIndex)} y={height - 6} textAnchor="middle">
              {shortDayLabel(active.date)}
            </text>
          </>
        )}

        {points.map((point, index) => (
          <rect
            key={`hit-${point.date}`}
            x={x(index) - Math.max(10, innerW / points.length / 2)}
            y={0}
            width={Math.max(20, innerW / points.length)}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHover(index)}
            onFocus={() => setHover(index)}
            tabIndex={-1}
          />
        ))}
      </svg>
    </div>
  )
}
