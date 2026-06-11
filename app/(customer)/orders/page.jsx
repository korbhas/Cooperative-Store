import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IconShoppingBag } from '@tabler/icons-react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import OrderCardSheet from './OrderCardSheet'

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
            include: { product: { select: { name: true, imageUrl: true } } },
          },
          user: { select: { name: true, phone: true, email: true } },
        },
      })
    : []

  const orders = rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    totalAmount: o.totalAmount.toNumber(),
    discountAmount: o.discountAmount.toNumber(),
    createdAt: o.createdAt.toISOString(),
    deliveryAddress: o.deliveryAddress,
    customerName: o.user?.name ?? o.guestName ?? null,
    customerPhone: o.user?.phone ?? o.guestPhone ?? null,
    customerEmail: o.user?.email ?? o.guestEmail ?? null,
    itemCount: o.items.length,
    thumbUrl: o.items[0]?.product?.imageUrl ?? null,
    items: o.items.map((i) => ({
      id: i.id,
      name: i.product?.name ?? 'Product',
      variantName: i.variantName,
      quantity: i.quantity,
      unitPrice: i.unitPrice.toNumber(),
    })),
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
            <IconShoppingBag size={48} color="var(--color-fm-ink3)" />
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
              <OrderCardSheet key={order.id} order={order} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
