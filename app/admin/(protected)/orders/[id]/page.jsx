import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderActions from './OrderActions'

const STATUS_COLORS = {
  pending:          { bg: '#fef9c3', color: '#854d0e' },
  processing:       { bg: '#dbeafe', color: '#1e40af' },
  out_for_delivery: { bg: '#ede9fe', color: '#5b21b6' },
  delivered:        { bg: '#dcfce7', color: '#166534' },
  cancelled:        { bg: '#fee2e2', color: '#991b1b' },
  refunded:         { bg: '#fee2e2', color: '#991b1b' },
}

const PAYMENT_COLORS = {
  created:  { bg: '#fef9c3', color: '#854d0e' },
  captured: { bg: '#dcfce7', color: '#166534' },
  failed:   { bg: '#fee2e2', color: '#991b1b' },
}

function Badge({ label, colors }) {
  return (
    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: colors.bg, color: colors.color, textTransform: 'capitalize' }}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  )
}

async function getOrder(id) {
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      items: { include: { product: { select: { name: true, imageUrl: true } }, variant: { select: { name: true } } } },
      payment: true,
      coupon: { select: { code: true, discountType: true, discountValue: true } },
      deliveryAgent: { select: { id: true, name: true } },
    },
  })
  if (!order) return null

  const agents = await prisma.deliveryAgent.findMany({ where: { isActive: true }, select: { id: true, name: true } })

  return {
    order: {
      id: order.id, status: order.status,
      totalAmount: order.totalAmount.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      deliveryAddress: order.deliveryAddress,
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      razorpayOrderId: order.razorpayOrderId,
      createdAt: order.createdAt.toISOString(),
      customer: { name: order.user?.name ?? order.guestName, email: order.user?.email ?? order.guestEmail, phone: order.user?.phone ?? order.guestPhone },
      coupon: order.coupon ? { ...order.coupon, discountValue: order.coupon.discountValue.toNumber() } : null,
      deliveryAgent: order.deliveryAgent,
      payment: order.payment ? {
        id: order.payment.id, status: order.payment.status,
        amount: order.payment.amount.toNumber(),
        razorpayPaymentId: order.payment.razorpayPaymentId,
        paidAt: order.payment.paidAt?.toISOString() ?? null,
      } : null,
      items: order.items.map(item => ({
        id: item.id, quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        productName: item.product?.name ?? 'Deleted product',
        variantName: item.variant?.name ?? item.variantName ?? null,
      })),
    },
    agents,
  }
}

export default async function OrderDetailPage({ params }) {
  const { id } = await params
  const data = await getOrder(id)
  if (!data) notFound()
  const { order, agents } = data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/admin/orders" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', textDecoration: 'none' }}>← Orders</Link>
        <span style={{ color: 'var(--color-fm-line-soft)' }}>/</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 600 }}>#{order.id}</span>
        <Badge label={order.status} colors={STATUS_COLORS[order.status] ?? { bg: '#f1f5f9', color: '#475569' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Order info */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 4 }}>Order Info</div>
          <InfoRow label="Customer" value={order.customer.name} />
          <InfoRow label="Email" value={order.customer.email} />
          <InfoRow label="Phone" value={order.customer.phone} />
          <InfoRow label="Delivery address" value={order.deliveryAddress} />
          <InfoRow label="Placed" value={new Date(order.createdAt).toLocaleString('en-IN')} />
          <InfoRow label="Est. delivery" value={order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN') : null} />
          {order.coupon && <InfoRow label="Coupon" value={`${order.coupon.code} (−₹${order.discountAmount.toFixed(2)})`} />}
          <InfoRow label="Total" value={`₹${order.totalAmount.toFixed(2)}`} />
        </div>

        {/* Payment info */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 4 }}>Payment</div>
          {order.payment ? (
            <>
              <InfoRow label="Status" value={<Badge label={order.payment.status} colors={PAYMENT_COLORS[order.payment.status]} />} />
              <InfoRow label="Amount" value={`₹${order.payment.amount.toFixed(2)}`} />
              <InfoRow label="Razorpay Order ID" value={order.razorpayOrderId} />
              <InfoRow label="Razorpay Payment ID" value={order.payment.razorpayPaymentId} />
              <InfoRow label="Paid at" value={order.payment.paidAt ? new Date(order.payment.paidAt).toLocaleString('en-IN') : null} />
            </>
          ) : (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No payment record</p>
          )}
        </div>
      </div>

      {/* Status + Agent actions */}
      <OrderActions orderId={order.id} currentStatus={order.status} currentAgentId={order.deliveryAgent?.id ?? null} agents={agents} />

      {/* Items */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1.5px solid var(--color-fm-line-soft)', fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Items</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Product', 'Variant', 'Qty', 'Unit Price', 'Total'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={item.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{item.productName}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{item.variantName ?? '—'}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>{item.quantity}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>₹{item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
