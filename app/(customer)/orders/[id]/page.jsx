import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { IconCircleCheck, IconCreditCard, IconPackage, IconShoppingBag } from '@tabler/icons-react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import AddressCard from '@/components/AddressCard'
import OrderStatusTimeline from './OrderStatusTimeline'

export default async function OrderDetailPage({ params, searchParams }) {
  const { userId } = await auth()
  const { id } = await params
  const { paid } = await searchParams

  if (!userId) {
    redirect(`/login?returnTo=/orders/${id}`)
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress
  if (!email) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!dbUser) notFound()

  const orderId = parseInt(id)
  if (isNaN(orderId)) notFound()

  const raw = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { name: true, imageUrl: true } } },
      },
      payment: true,
      user: { select: { name: true, phone: true, email: true } },
    },
  })

  if (!raw || raw.userId !== dbUser.id) notFound()

  const order = {
    id: raw.id,
    status: raw.status,
    deliveryAddress: raw.deliveryAddress,
    customerName: raw.user?.name ?? raw.guestName ?? null,
    customerPhone: raw.user?.phone ?? raw.guestPhone ?? null,
    customerEmail: raw.user?.email ?? raw.guestEmail ?? null,
    totalAmount: raw.totalAmount.toNumber(),
    discountAmount: raw.discountAmount.toNumber(),
    estimatedDelivery: raw.estimatedDelivery?.toISOString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    payment: raw.payment
      ? {
          status: raw.payment.status,
          amount: raw.payment.amount.toNumber(),
          razorpayPaymentId: raw.payment.razorpayPaymentId,
          paidAt: raw.payment.paidAt?.toISOString() ?? null,
        }
      : null,
    items: raw.items.map((i) => ({
      id: i.id,
      productName: i.product?.name ?? 'Product',
      imageUrl: i.product?.imageUrl ?? null,
      variantName: i.variantName,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
    })),
  }

  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const deliveryFee = order.totalAmount - subtotal + order.discountAmount

  const justPaid = paid === '1' && order.payment?.status === 'captured'

  return (
    <div style={{ flex: 1, background: 'var(--color-fm-paper)' }}>
      <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '24px 16px 48px' }}>

        {justPaid && (
          <Alert
            className="mb-5"
            style={{
              background: 'var(--color-fm-green-soft)',
              borderColor: 'var(--color-fm-green-ink)',
              color: 'var(--color-fm-green-ink)',
            }}
          >
            <IconCircleCheck />
            <AlertTitle>Payment successful</AlertTitle>
            <AlertDescription style={{ color: 'var(--color-fm-ink2)' }}>
              Your payment of ₹{order.totalAmount.toFixed(2)} has been processed and your order is confirmed.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 12, marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconCircleCheck size={28} color="var(--color-fm-green-ink)" />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
                Order #{order.id}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
                Placed {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <OrderStatusTimeline status={order.status} createdAt={order.createdAt} />

        <div className="flex flex-col md:flex-row gap-5">

          {/* Left — items */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Section title="Items" icon={<IconPackage size={14} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {order.items.map((item, i) => (
                  <ItemRow key={item.id} item={item} last={i === order.items.length - 1} />
                ))}
              </div>
            </Section>
          </div>

          {/* Right — summary + address + payment */}
          <div style={{ width: '100%', maxWidth: 320 }} className="md:w-80 md:flex-none">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Order summary */}
              <Section title="Order Summary" icon={null}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <SummaryRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
                  <SummaryRow
                    label="Delivery"
                    value={deliveryFee <= 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}
                    green={deliveryFee <= 0}
                  />
                  {order.discountAmount > 0 && (
                    <SummaryRow label="Discount" value={`−₹${order.discountAmount.toFixed(2)}`} green />
                  )}
                  <div style={{ height: 1, background: 'var(--color-fm-line-soft)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Total</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </Section>

              {/* Delivery address */}
              <AddressCard
                title="Delivery Address"
                value={{
                  name: order.customerName,
                  address: order.deliveryAddress,
                  phone: order.customerPhone,
                  email: order.customerEmail,
                }}
              >
                {order.estimatedDelivery && (
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-green-ink)' }}>
                    Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                )}
              </AddressCard>

              {/* Payment */}
              {order.payment && (
                <Section title="Payment" icon={<IconCreditCard size={14} />}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <SummaryRow
                      label="Status"
                      value={order.payment.status === 'captured' ? 'Paid' : order.payment.status}
                      green={order.payment.status === 'captured'}
                    />
                    {order.payment.paidAt && (
                      <SummaryRow
                        label="Paid on"
                        value={new Date(order.payment.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      />
                    )}
                    {order.payment.razorpayPaymentId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', flexShrink: 0 }}>Txn ID</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-fm-ink2)', wordBreak: 'break-all', textAlign: 'right' }}>
                          {order.payment.razorpayPaymentId}
                        </span>
                      </div>
                    )}
                  </div>
                </Section>
              )}

            </div>
          </div>
        </div>

        {/* Footer links */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
          <Link href="/products" style={{
            padding: '10px 20px', borderRadius: 8,
            background: 'var(--color-fm-green)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <IconShoppingBag size={14} /> Continue Shopping
          </Link>
          <Link href="/orders" style={{
            padding: '10px 20px', borderRadius: 8,
            border: '1.5px solid var(--color-fm-line-soft)',
            background: '#fff', color: 'var(--color-fm-ink)',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            textDecoration: 'none',
          }}>
            All Orders
          </Link>
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1.5px solid var(--color-fm-line-soft)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-fm-line-soft)',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
        color: 'var(--color-fm-ink)',
      }}>
        {icon && <span style={{ color: 'var(--color-fm-green)' }}>{icon}</span>}
        {title}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  )
}

function ItemRow({ item, last }) {
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-start',
      padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid var(--color-fm-line-soft)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 8, flexShrink: 0,
        background: 'var(--color-fm-paper2)',
        overflow: 'hidden', position: 'relative',
      }}>
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.productName} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPackage size={20} color="var(--color-fm-ink3)" />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink)' }}>
          {item.productName}
        </div>
        {item.variantName && (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
            {item.variantName}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
          {item.quantity} × ₹{item.unitPrice.toFixed(2)}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--color-fm-ink)', flexShrink: 0 }}>
        ₹{(item.unitPrice * item.quantity).toFixed(2)}
      </div>
    </div>
  )
}

function SummaryRow({ label, value, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500,
        color: green ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink)',
      }}>{value}</span>
    </div>
  )
}
