import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import RevenueChart from './RevenueChart'

const STATUS_DOT = {
  pending:          '#f59e0b',
  processing:       '#3b82f6',
  out_for_delivery: '#8b5cf6',
  delivered:        '#22c55e',
  cancelled:        '#ef4444',
  refunded:         '#ef4444',
}

function StatusDot({ status }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[status] ?? '#94a3b8', flexShrink: 0, display: 'inline-block' }} />
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink2)', textTransform: 'capitalize' }}>
        {status.replace(/_/g, ' ')}
      </span>
    </span>
  )
}

async function getDashboardData() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    revenueAgg,
    prevRevenueAgg,
    totalOrders,
    prevMonthOrderCount,
    activeProducts,
    lowStockCount,
    recentOrders,
    pendingOrders,
    lowStockItems,
    currentMonthOrders,
    prevMonthOrders,
  ] = await Promise.all([
    prisma.order.aggregate({ where: { status: 'delivered' }, _sum: { totalAmount: true } }),
    prisma.order.aggregate({ where: { status: 'delivered', createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } }, _sum: { totalAmount: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, stockQty: { lte: 10 } } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { status: 'pending' },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
    prisma.product.findMany({
      where: { isActive: true, stockQty: { lte: 10 } },
      take: 6,
      orderBy: { stockQty: 'asc' },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      select: { createdAt: true, totalAmount: true },
    }),
  ])

  function buildDailyBuckets(orders, referenceDate) {
    const daysInMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()
    const buckets = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, revenue: 0 }))
    for (const o of orders) {
      const day = new Date(o.createdAt).getDate() - 1
      buckets[day].revenue += Number(o.totalAmount)
    }
    return buckets
  }

  const revenue = revenueAgg._sum.totalAmount?.toNumber() ?? 0
  const prevRevenue = prevRevenueAgg._sum.totalAmount?.toNumber() ?? 0
  const thisMonthOrderCount = currentMonthOrders.length

  return {
    stats: {
      revenue,
      revenueDelta: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : null,
      orders: totalOrders,
      ordersDelta: prevMonthOrderCount > 0 ? thisMonthOrderCount - prevMonthOrderCount : null,
      products: activeProducts,
      lowStock: lowStockCount,
    },
    recentOrders: recentOrders.map(o => ({
      id: o.id,
      customer: o.user?.name ?? o.guestName ?? 'Guest',
      status: o.status,
      total: o.totalAmount.toNumber(),
      date: o.createdAt.toISOString(),
    })),
    pendingOrders: pendingOrders.map(o => ({
      id: o.id,
      customer: o.user?.name ?? o.guestName ?? 'Guest',
      total: o.totalAmount.toNumber(),
    })),
    lowStockItems: lowStockItems.map(p => ({
      id: p.id,
      name: p.name,
      stockQty: p.stockQty,
    })),
    chartData: {
      current: buildDailyBuckets(currentMonthOrders, now),
      previous: buildDailyBuckets(prevMonthOrders, startOfPrevMonth),
    },
  }
}

function Delta({ value, unit = '' }) {
  if (value === null) return null
  const pos = value >= 0
  return (
    <span style={{
      fontFamily: 'var(--font-sans)', fontSize: 11,
      color: pos ? '#16a34a' : '#dc2626',
      marginLeft: 6,
    }}>
      {pos ? '↑' : '↓'} {Math.abs(value).toFixed(unit === '%' ? 1 : 0)}{unit} vs last mo
    </span>
  )
}

const card = { background: '#fff', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)' }

export default async function DashboardPage() {
  const { stats, recentOrders, pendingOrders, lowStockItems, chartData } = await getDashboardData()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1100 }}>

      {/* Heading */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>
          Dashboard
        </h1>
      </div>

      {/* Stats — single card, 4 items */}
      <div style={{ ...card, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          {
            label: 'Total Revenue',
            value: `₹${stats.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            delta: <Delta value={stats.revenueDelta} unit="%" />,
          },
          {
            label: 'Total Orders',
            value: stats.orders.toLocaleString(),
            delta: <Delta value={stats.ordersDelta} />,
          },
          {
            label: 'Active Products',
            value: stats.products.toLocaleString(),
            delta: null,
          },
          {
            label: 'Low Stock',
            value: stats.lowStock.toLocaleString(),
            delta: stats.lowStock > 0
              ? <Link href="/admin/inventory" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#dc2626', marginLeft: 6, textDecoration: 'none' }}>view →</Link>
              : <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#16a34a', marginLeft: 6 }}>all good</span>,
            valueColor: stats.lowStock > 0 ? '#dc2626' : 'var(--color-fm-ink)',
          },
        ].map(({ label, value, delta, valueColor }, i, arr) => (
          <div key={label} style={{
            padding: '20px 24px',
            borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
          }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, color: valueColor ?? 'var(--color-fm-ink)', lineHeight: 1 }}>
                {value}
              </span>
              {delta}
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Needs attention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Revenue chart */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 16 }}>
            Revenue this month
          </div>
          <RevenueChart data={chartData} />
        </div>

        {/* Needs attention */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Pending orders */}
          <div style={card}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
                  Pending ({pendingOrders.length})
                </span>
              </div>
              <Link href="/admin/orders?status=pending" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}>all →</Link>
            </div>
            {pendingOrders.length === 0 ? (
              <div style={{ padding: '14px 18px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>None</div>
            ) : (
              <div>
                {pendingOrders.map((o, i) => (
                  <div key={o.id} style={{ padding: '10px 18px', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/admin/orders/${o.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-fm-green-ink)', textDecoration: 'none', fontWeight: 600 }}>#{o.id}</Link>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{o.customer}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', fontWeight: 500, flexShrink: 0 }}>₹{o.total.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low stock */}
          <div style={card}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
                  Low Stock ({lowStockItems.length})
                </span>
              </div>
              <Link href="/admin/inventory" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}>all →</Link>
            </div>
            {lowStockItems.length === 0 ? (
              <div style={{ padding: '14px 18px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>All stocked</div>
            ) : (
              <div>
                {lowStockItems.map((p, i) => (
                  <div key={p.id} style={{ padding: '10px 18px', borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, flexShrink: 0, color: p.stockQty === 0 ? '#dc2626' : '#d97706' }}>
                      {p.stockQty === 0 ? '0' : p.stockQty}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Recent orders */}
      <div style={card}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Recent Orders</span>
          <Link href="/admin/orders" style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}>all →</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Order', 'Customer', 'Status', 'Amount', 'Date'].map(h => (
                <th key={h} style={{ padding: '8px 20px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.6, borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No orders yet</td></tr>
            ) : recentOrders.map((o, i) => (
              <tr key={o.id} style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                <td style={{ padding: '11px 20px' }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-green-ink)', textDecoration: 'none', fontWeight: 600 }}>#{o.id}</Link>
                </td>
                <td style={{ padding: '11px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>{o.customer}</td>
                <td style={{ padding: '11px 20px' }}><StatusDot status={o.status} /></td>
                <td style={{ padding: '11px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>₹{o.total.toFixed(0)}</td>
                <td style={{ padding: '11px 20px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>
                  {new Date(o.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
