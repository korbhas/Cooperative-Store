'use client'

export default function RevenueChart({ data }) {
  const { current, previous } = data

  const W = 700
  const H = 160
  const PAD = { top: 12, right: 8, bottom: 24, left: 48 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const allValues = [...current, ...previous].map(d => d.revenue)
  const maxVal = Math.max(...allValues, 1)

  function toX(i, total) { return PAD.left + (i / Math.max(total - 1, 1)) * chartW }
  function toY(val) { return PAD.top + chartH - (val / maxVal) * chartH }
  function pts(arr) { return arr.map((d, i) => [toX(i, arr.length), toY(d.revenue)]) }
  function line(points) { return points.map(([x, y]) => `${x},${y}`).join(' ') }

  const currPts = pts(current)
  const prevPts = pts(previous)

  const ticks = [0, 0.5, 1].map(f => ({ val: maxVal * f, y: PAD.top + chartH - f * chartH }))
  const xLabels = current
    .map((d, i) => ({ day: d.day, x: toX(i, current.length) }))
    .filter(d => d.day === 1 || d.day % 7 === 0)

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const now = new Date()
  const curr = months[now.getMonth()]
  const prev = months[(now.getMonth() + 11) % 12]

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        {[{ label: curr, solid: true }, { label: prev, solid: false }].map(({ label, solid }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width={16} height={2}><line x1={0} y1={1} x2={16} y2={1} stroke={solid ? 'var(--color-fm-green)' : 'rgba(0,0,0,0.18)'} strokeWidth={solid ? 1.5 : 1} strokeDasharray={solid ? 'none' : '3 2'} /></svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>{label}</span>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Grid */}
        {ticks.map(({ val, y }) => (
          <g key={y}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={9} fontFamily="var(--font-sans)" fill="rgba(0,0,0,0.3)">
              {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val.toFixed(0)}`}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map(({ day, x }) => (
          <text key={day} x={x} y={H - 4} textAnchor="middle" fontSize={9} fontFamily="var(--font-sans)" fill="rgba(0,0,0,0.3)">{day}</text>
        ))}

        {/* Previous month — dashed, muted */}
        {prevPts.length > 1 && (
          <polyline points={line(prevPts)} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1} strokeDasharray="3 2" />
        )}

        {/* Current month — solid green */}
        {currPts.length > 1 && (
          <polyline points={line(currPts)} fill="none" stroke="var(--color-fm-green)" strokeWidth={1.5} />
        )}
      </svg>
    </div>
  )
}
