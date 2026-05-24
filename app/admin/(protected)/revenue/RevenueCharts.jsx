'use client'

// ── Bar chart: revenue over time ──────────────────────────────────────────────

export function RevenueBarChart({ buckets, fmt }) {
  const W = 700
  const H = 180
  const PAD = { top: 14, right: 8, bottom: 28, left: 52 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const maxVal = Math.max(...buckets.map(b => b.revenue), 1)
  const barW = Math.max(2, chartW / buckets.length - 2)

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: maxVal * f,
    y: PAD.top + chartH - f * chartH,
  }))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {/* Grid lines */}
      {ticks.map(({ val, y }) => (
        <g key={y}>
          <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
          <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fontFamily="var(--font-sans)" fill="rgba(0,0,0,0.3)">
            {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val.toFixed(0)}`}
          </text>
        </g>
      ))}

      {/* Bars */}
      {buckets.map((b, i) => {
        const x = PAD.left + (i / buckets.length) * chartW + (chartW / buckets.length - barW) / 2
        const barH = (b.revenue / maxVal) * chartH
        const y = PAD.top + chartH - barH
        const showLabel = buckets.length <= 12 || i % Math.ceil(buckets.length / 12) === 0
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={Math.max(barH, 1)}
              fill={b.revenue > 0 ? 'var(--color-fm-green)' : 'rgba(0,0,0,0.06)'}
              rx={2}
            />
            {showLabel && (
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={8} fontFamily="var(--font-sans)" fill="rgba(0,0,0,0.3)">
                {b.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Horizontal bar: category breakdown ───────────────────────────────────────

export function CategoryBars({ rows }) {
  const max = Math.max(...rows.map(r => r.revenue), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map(r => (
        <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.name}
          </div>
          <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(r.revenue / max) * 100}%`, background: 'var(--color-fm-green)', borderRadius: 99 }} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', textAlign: 'right', fontWeight: 500 }}>
            ₹{r.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>
      ))}
    </div>
  )
}
