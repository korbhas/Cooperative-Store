import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Package, ChevronRight } from 'lucide-react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export default async function OrdersPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login?returnTo=/orders')
  }

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress
  if (!email) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })

  const rawOrders = dbUser
    ? await prisma.order.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            take: 1,
            include: { product: { select: { imageUrl: true } } },
          },
          _count: { select: { items: true } },
          payment: { select: { status: true } },
        },
      })
    : []

  const orders = rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.totalAmount.toNumber(),
    createdAt: o.createdAt.toISOString(),
    itemCount: o._count.items,
    thumbUrl: o.items[0]?.product?.imageUrl ?? null,
  }))

  return (
    <div style={{ flex: 1, background: 'var(--color-fm-paper)' }}>
      <div style={{ maxWidth: 720, width: '100%', margin: '0 auto', padding: '24px 16px 48px' }}>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 20 }}>
          My Orders
        </div>

        {orders.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '40vh', gap: 16, textAlign: 'center',
          }}>
            <ShoppingBag size={48} color="var(--color-fm-ink3)" />
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
              No orders yet
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>
              Your completed orders will appear here
            </div>
            <Link href="/products" style={{
              padding: '10px 24px', borderRadius: 8,
              background: 'var(--color-fm-green)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
            }}>
              Browse Products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_STYLES = {
  pending:          { bg: 'var(--color-fm-paper2)',      text: 'var(--color-fm-ink3)',      label: 'Pending' },
  processing:       { bg: 'var(--color-fm-accent-soft)', text: 'var(--color-fm-accent)',    label: 'Processing' },
  out_for_delivery: { bg: 'var(--color-fm-accent-soft)', text: 'var(--color-fm-accent)',    label: 'Out for Delivery' },
  delivered:        { bg: 'var(--color-fm-green-soft)',  text: 'var(--color-fm-green-ink)', label: 'Delivered' },
  cancelled:        { bg: '#fdecea',                    text: '#c0392b',                   label: 'Cancelled' },
  refunded:         { bg: '#fdecea',                    text: '#c0392b',                   label: 'Refunded' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      background: s.bg,
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
      color: s.text, flexShrink: 0,
    }}>
      {s.label}
    </div>
  )
}

function OrderCard({ order }) {
  return (
    <Link href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#fff', borderRadius: 12,
        border: '1.5px solid var(--color-fm-line-soft)',
        padding: '16px',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color 0.15s',
      }}>
        {/* Thumbnail */}
        <div style={{
          width: 56, height: 56, borderRadius: 10, flexShrink: 0,
          background: 'var(--color-fm-paper2)', overflow: 'hidden', position: 'relative',
        }}>
          {order.thumbUrl ? (
            <Image src={order.thumbUrl} alt="" fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={22} color="var(--color-fm-ink3)" />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
              Order #{order.id}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Amount + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
            ₹{order.totalAmount.toFixed(2)}
          </div>
          <ChevronRight size={16} color="var(--color-fm-ink3)" />
        </div>
      </div>
    </Link>
  )
}
