import { redirect } from 'next/navigation'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, POINTS_PER_RUPEE } from '@/lib/config'
import ConfirmedClient from './ConfirmedClient'

export default async function OrderConfirmedPage({ params }) {
  const { id } = await params
  const orderId = parseInt(id)
  if (isNaN(orderId)) redirect('/')

  const { userId } = await auth()
  if (!userId) redirect('/login')

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress
  if (!email) redirect('/')

  const [dbUser, etaMin, etaMax] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.setting.findUnique({ where: { key: 'delivery_eta_min' } }),
    prisma.setting.findUnique({ where: { key: 'delivery_eta_max' } }),
  ])
  if (!dbUser) redirect('/')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      totalAmount: true,
      discountAmount: true,
      pointsEarned: true,
      pointsRedeemed: true,
      deliveryAddress: true,
      createdAt: true,
      coupon: { select: { code: true } },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          variantName: true,
          product: { select: { name: true, imageUrl: true } },
        },
      },
    },
  })

  if (!order || order.userId !== dbUser.id) redirect('/')

  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.unitPrice.toNumber(), 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const pointsDiscount = order.pointsRedeemed / POINTS_PER_RUPEE
  const minMins = parseInt(etaMin?.value ?? '30')
  const maxMins = parseInt(etaMax?.value ?? '60')
  const deliveryEstimate = `${minMins}–${maxMins} minutes`

  return (
    <ConfirmedClient
      order={{
        id: order.id,
        status: order.status,
        total: order.totalAmount.toNumber(),
        couponDiscount: order.discountAmount.toNumber(),
        pointsDiscount,
        pointsEarned: order.pointsEarned,
        pointsRedeemed: order.pointsRedeemed,
        deliveryAddress: order.deliveryAddress,
        couponCode: order.coupon?.code ?? null,
        createdAt: order.createdAt.toISOString(),
        deliveryFee,
        items: order.items.map((i) => ({
          id: i.id,
          name: i.product?.name ?? 'Product',
          imageUrl: i.product?.imageUrl ?? null,
          variantName: i.variantName ?? null,
          quantity: i.quantity,
          unitPrice: i.unitPrice.toNumber(),
        })),
      }}
      deliveryEstimate={deliveryEstimate}
    />
  )
}
