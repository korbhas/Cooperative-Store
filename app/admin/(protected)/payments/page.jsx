import { prisma } from '@/lib/prisma'
import Link from 'next/link'

const PAYMENT_COLORS = {
  created:  { bg: '#fef9c3', color: '#854d0e' },
  captured: { bg: '#dcfce7', color: '#166534' },
  failed:   { bg: '#fee2e2', color: '#991b1b' },
}

async function getPayments() {
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { id: true, guestName: true, user: { select: { name: true } } } } },
  })
  return payments.map(p => ({
    id: p.id,
    orderId: p.orderId,
    status: p.status,
    amount: p.amount.toNumber(),
    razorpayPaymentId: p.razorpayPaymentId,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
    customer: p.order.user?.name ?? p.order.guestName ?? 'Guest',
  }))
}

export default async function PaymentsPage() {
  const payments = await getPayments()

  const totals = {
    captured: payments.filter(p => p.status === 'captured').reduce((s, p) => s + p.amount, 0),
    count: payments.length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Payments</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>{totals.count} transactions · ₹{totals.captured.toFixed(2)} captured</p>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Payment ID', 'Order', 'Customer', 'Status', 'Amount', 'Razorpay ID', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No payments yet</td></tr>
            ) : payments.map((p, i) => {
              const sc = PAYMENT_COLORS[p.status] ?? { bg: '#f1f5f9', color: '#475569' }
              return (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>#{p.id}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <Link href={`/admin/orders/${p.orderId}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-green-ink)', textDecoration: 'none', fontWeight: 600 }}>#{p.orderId}</Link>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>{p.customer}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: sc.bg, color: sc.color }}>{p.status}</span>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink)' }}>₹{p.amount.toFixed(2)}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-fm-ink3)', maxWidth: 160 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.razorpayPaymentId ?? '—'}</div>
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', whiteSpace: 'nowrap' }}>
                    {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
