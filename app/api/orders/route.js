import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new ApiError('Unauthorized', 401)

    const body = await request.json()
    const { deliveryAddress, items, totalAmount, couponId, discountAmount } = body

    if (!deliveryAddress || !items?.length) {
      throw new ApiError('Missing required fields', 400)
    }

    // Find or create the DB user
    const dbUser = await prisma.user.upsert({
      where: { email: authUser.email },
      update: {},
      create: {
        email: authUser.email,
        name: authUser.user_metadata?.name ?? null,
        role: authUser.user_metadata?.role === 'admin' ? 'admin' : 'customer',
      },
      select: { id: true },
    })

    // Create DB order + items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: dbUser.id,
          deliveryAddress,
          totalAmount,
          discountAmount: discountAmount ?? 0,
          couponId: couponId ?? null,
          status: 'pending',
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId ?? null,
              variantName: i.variantName ?? null,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
      })

      await tx.payment.create({
        data: { orderId: newOrder.id, amount: totalAmount, status: 'created' },
      })

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        })
      }

      return newOrder
    })

    // Try to create Razorpay order
    let razorpayOrderId = null
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const { default: Razorpay } = await import('razorpay')
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(Number(totalAmount) * 100),
        currency: 'INR',
        receipt: `order_${order.id}`,
      })
      razorpayOrderId = rzpOrder.id

      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId },
      })
    }

    return apiResponse({ orderId: order.id, razorpayOrderId })
  } catch (err) {
    return apiError(err)
  }
}
