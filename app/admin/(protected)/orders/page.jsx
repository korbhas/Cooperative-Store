import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const STATUS_COLORS = {
  pending:          { bg: '#fef9c3', color: '#854d0e' },
  processing:       { bg: '#dbeafe', color: '#1e40af' },
  out_for_delivery: { bg: '#ede9fe', color: '#5b21b6' },
  delivered:        { bg: '#dcfce7', color: '#166534' },
  cancelled:        { bg: '#fee2e2', color: '#991b1b' },
  refunded:         { bg: '#fee2e2', color: '#991b1b' },
}

const STATUSES = ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled', 'refunded']

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? { bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: s.bg, color: s.color, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

async function getOrders(status, q) {
  const where = {}
  if (status) where.status = status
  if (q) {
    where.OR = [
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { guestName: { contains: q, mode: 'insensitive' } },
    ]
  }
  const orders = await prisma.order.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true, phone: true } } },
  })
  return orders.map(o => ({
    id: o.id,
    customer: { name: o.user?.name ?? o.guestName ?? 'Guest', email: o.user?.email ?? o.guestEmail ?? '', phone: o.user?.phone ?? o.guestPhone ?? '' },
    status: o.status,
    totalAmount: o.totalAmount.toNumber(),
    createdAt: o.createdAt.toISOString(),
  }))
}

export default async function OrdersPage({ searchParams }) {
  const { status, q } = await searchParams
  const orders = await getOrders(status, q)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Orders</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {[null, ...STATUSES].map(s => {
          const active = (s ?? '') === (status ?? '')
          return (
            <Link key={s ?? 'all'} href={s ? `/admin/orders?status=${s}` : '/admin/orders'} style={{
              padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: active ? 600 : 400,
              fontFamily: 'var(--font-sans)', textDecoration: 'none',
              background: active ? 'var(--color-fm-green)' : '#fff',
              color: active ? '#fff' : 'var(--color-fm-ink2)',
              border: '1.5px solid', borderColor: active ? 'var(--color-fm-green)' : 'var(--color-fm-line-soft)',
            }}>
              {s ? s.replace(/_/g, ' ') : 'All'}
            </Link>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Order', 'Customer', 'Email', 'Phone', 'Status', 'Total', 'Date', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No orders found</td></tr>
            ) : orders.map((o, i) => (
              <tr key={o.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-green-ink)' }}>#{o.id}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{o.customer.name}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{o.customer.email}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{o.customer.phone || '—'}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink)' }}>₹{o.totalAmount.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', whiteSpace: 'nowrap' }}>
                  {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-green-ink)', textDecoration: 'none', fontWeight: 500 }}>View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
