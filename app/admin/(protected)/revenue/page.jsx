import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { RevenueBarChart, CategoryBars } from './RevenueCharts'

// ── Period helpers ────────────────────────────────────────────────────────────

function getPeriodStart(period) {
  const now = new Date()
  switch (period) {
    case '7d':   return new Date(now - 7 * 86400000)
    case '30d':  return new Date(now - 30 * 86400000)
    case 'year': return new Date(now.getFullYear(), 0, 1)
    case 'all':  return null
    case 'month':
    default:     return new Date(now.getFullYear(), now.getMonth(), 1)
  }
}

function periodWhere(period) {
  const start = getPeriodStart(period)
  return start ? { createdAt: { gte: start } } : {}
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getRevenueData(period) {
  const pw = periodWhere(period)
  const activeStatuses = { notIn: ['cancelled', 'refunded'] }

  const [grossAgg, netAgg, orderItems, couponOrders] = await Promise.all([
    // Gross stats: all non-cancelled orders
    prisma.order.aggregate({
      where: { ...pw, status: activeStatuses },
      _sum: { totalAmount: true, discountAmount: true },
      _count: true,
    }),
    // Net: delivered only
    prisma.order.aggregate({
      where: { ...pw, status: 'delivered' },
      _sum: { totalAmount: true, discountAmount: true },
    }),
    // Line items for product + category breakdown
    prisma.orderItem.findMany({
      where: { order: { ...pw, status: activeStatuses } },
      select: {
        quantity: true,
        unitPrice: true,
        product: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
        order: { select: { createdAt: true } },
      },
    }),
    // Coupon usage
    prisma.order.findMany({
      where: { ...pw, couponId: { not: null } },
      select: {
        discountAmount: true,
        coupon: { select: { code: true } },
      },
    }),
  ])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const gross = grossAgg._sum.totalAmount?.toNumber() ?? 0
  const discounts = grossAgg._sum.discountAmount?.toNumber() ?? 0
  const orderCount = grossAgg._count ?? 0
  const netDelivered = (netAgg._sum.totalAmount?.toNumber() ?? 0) - (netAgg._sum.discountAmount?.toNumber() ?? 0)
  const aov = orderCount > 0 ? gross / orderCount : 0

  // ── Time buckets ──────────────────────────────────────────────────────────
  // All active orders for the time series (need createdAt + totalAmount)
  const timeOrders = await prisma.order.findMany({
    where: { ...pw, status: activeStatuses },
    select: { createdAt: true, totalAmount: true },
  })

  const chartBuckets = buildTimeBuckets(timeOrders, period)

  // ── Category breakdown ────────────────────────────────────────────────────
  const categoryMap = {}
  for (const item of orderItems) {
    const cat = item.product?.category?.name ?? 'Uncategorised'
    const rev = item.quantity * item.unitPrice.toNumber()
    categoryMap[cat] = (categoryMap[cat] ?? 0) + rev
  }
  const categoryRows = Object.entries(categoryMap)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)

  // ── Top products ──────────────────────────────────────────────────────────
  const productMap = {}
  for (const item of orderItems) {
    if (!item.product) continue
    const key = item.product.id
    if (!productMap[key]) productMap[key] = { id: key, name: item.product.name, units: 0, revenue: 0 }
    productMap[key].units += item.quantity
    productMap[key].revenue += item.quantity * item.unitPrice.toNumber()
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // ── Coupon impact ─────────────────────────────────────────────────────────
  const couponMap = {}
  for (const o of couponOrders) {
    const code = o.coupon?.code ?? 'Unknown'
    if (!couponMap[code]) couponMap[code] = { code, uses: 0, total: 0 }
    couponMap[code].uses += 1
    couponMap[code].total += o.discountAmount.toNumber()
  }
  const couponRows = Object.values(couponMap).sort((a, b) => b.total - a.total)

  return {
    kpis: { gross, netDelivered, orderCount, aov, discounts },
    chartBuckets,
    categoryRows,
    topProducts: topProducts.map(p => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 })),
    couponRows: couponRows.map(r => ({ ...r, total: Math.round(r.total * 100) / 100, avg: r.uses > 0 ? Math.round((r.total / r.uses) * 100) / 100 : 0 })),
    totalRevenue: gross,
  }
}

function buildTimeBuckets(orders, period) {
  const now = new Date()

  if (period === 'year' || period === 'all') {
    // Monthly buckets for last 12 months
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const buckets = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      return { label: months[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), revenue: 0 }
    })
    for (const o of orders) {
      const d = new Date(o.createdAt)
      const bucket = buckets.find(b => b.year === d.getFullYear() && b.month === d.getMonth())
      if (bucket) bucket.revenue += o.totalAmount.toNumber()
    }
    return buckets.map(({ label, revenue }) => ({ label, revenue: Math.round(revenue) }))
  }

  // Daily buckets
  const days = period === '7d' ? 7 : period === '30d' ? 30 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const startDate = getPeriodStart(period)
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return { label: String(d.getDate()), revenue: 0 }
  })
  for (const o of orders) {
    const d = new Date(o.createdAt)
    const idx = Math.floor((d - startDate) / 86400000)
    if (idx >= 0 && idx < buckets.length) buckets[idx].revenue += o.totalAmount.toNumber()
  }
  return buckets.map(b => ({ ...b, revenue: Math.round(b.revenue) }))
}

// ── UI helpers ────────────────────────────────────────────────────────────────

const card = {
  background: '#fff',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.06)',
}

function fmt(n) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

const PERIODS = [
  { key: 'month', label: 'This Month' },
  { key: '7d',    label: '7 Days'     },
  { key: '30d',   label: '30 Days'    },
  { key: 'year',  label: 'This Year'  },
  { key: 'all',   label: 'All Time'   },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RevenuePage({ searchParams }) {
  const { period: rawPeriod } = await searchParams
  const period = PERIODS.find(p => p.key === rawPeriod) ? rawPeriod : 'month'
  const periodLabel = PERIODS.find(p => p.key === period).label

  const { kpis, chartBuckets, categoryRows, topProducts, couponRows, totalRevenue } = await getRevenueData(period)

  const kpiCards = [
    { label: 'Gross Revenue',   value: fmt(kpis.gross),        sub: 'non-cancelled orders' },
    { label: 'Net Revenue',     value: fmt(kpis.netDelivered), sub: 'delivered, after discounts' },
    { label: 'Orders',          value: kpis.orderCount.toLocaleString(), sub: 'in period' },
    { label: 'Avg Order Value', value: fmt(kpis.aov),          sub: 'gross ÷ orders' },
    { label: 'Discounts Given', value: fmt(kpis.discounts),    sub: 'coupon savings', accent: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>
          Revenue
        </h1>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: 3 }}>
          {PERIODS.map(({ key, label }) => (
            <Link
              key={key}
              href={`?period=${key}`}
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                fontWeight: period === key ? 600 : 400,
                color: period === key ? 'var(--color-fm-ink)' : 'var(--color-fm-ink3)',
                background: period === key ? '#fff' : 'transparent',
                borderRadius: 6,
                padding: '5px 12px',
                textDecoration: 'none',
                boxShadow: period === key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {kpiCards.map(({ label, value, sub, accent }, i, arr) => (
          <div key={label} style={{
            padding: '18px 20px',
            borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
          }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: accent ? '#d97706' : 'var(--color-fm-ink)', lineHeight: 1 }}>
              {value}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)', marginTop: 4 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue over time */}
      <div style={card}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Revenue — {periodLabel}
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <RevenueBarChart buckets={chartBuckets} />
        </div>
      </div>

      {/* Category + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Category breakdown */}
        <div style={card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Revenue by Category
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            {categoryRows.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No data</div>
            ) : (
              <CategoryBars rows={categoryRows} />
            )}
          </div>
        </div>

        {/* Top products */}
        <div style={card}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Top Products
            </div>
          </div>
          {topProducts.length === 0 ? (
            <div style={{ padding: '14px 18px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No data</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['#', 'Product', 'Units', 'Revenue', '%'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: h === '#' ? 'center' : 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                    <td style={{ padding: '9px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>{i + 1}</td>
                    <td style={{ padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</td>
                    <td style={{ padding: '9px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-ink2)' }}>{p.units}</td>
                    <td style={{ padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{fmt(p.revenue)}</td>
                    <td style={{ padding: '9px 14px', fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>
                      {totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Coupon impact */}
      {couponRows.length > 0 && (
        <div style={card}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Coupon Impact
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Code', 'Uses', 'Total Discount', 'Avg Discount'].map(h => (
                  <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {couponRows.map((r, i) => (
                <tr key={r.code} style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-green-ink)', background: 'var(--color-fm-green-soft)', padding: '2px 7px', borderRadius: 5 }}>{r.code}</span>
                  </td>
                  <td style={{ padding: '10px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>{r.uses}</td>
                  <td style={{ padding: '10px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: '#d97706', fontWeight: 500 }}>{fmt(r.total)}</td>
                  <td style={{ padding: '10px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink2)' }}>{fmt(r.avg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
