import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'
import { RAZORPAY_CURRENCY } from '@/lib/config'
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '@/lib/env'
import { checkCouponRules, computeDiscount } from '@/lib/coupon'

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new ApiError('Unauthorized', 401)

    const clerkUser = await currentUser()
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) throw new ApiError('No email on account', 400)

    const body = await request.json()
    const { deliveryAddress, items, totalAmount, couponId } = body

    if (!deliveryAddress || !items?.length) {
      throw new ApiError('Missing required fields', 400)
    }

    // Re-validate coupon server-side — client preview can go stale
    let validatedCoupon = null
    let discountAmount = 0
    if (couponId) {
      validatedCoupon = await prisma.coupon.findUnique({ where: { id: couponId } })
      if (!validatedCoupon) throw new ApiError('Coupon not found', 400)
      const { valid, error } = checkCouponRules(validatedCoupon, { amount: Number(totalAmount) })
      if (!valid) throw new ApiError(error, 400)
      discountAmount = computeDiscount(validatedCoupon, Number(totalAmount))
    }

    // Find or create the DB user
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: clerkUser.fullName ?? clerkUser.firstName ?? null,
        role: 'customer',
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
          discountAmount,
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
    if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      const { default: Razorpay } = await import('razorpay')
      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID,
        key_secret: RAZORPAY_KEY_SECRET,
      })
      const rzpOrder = await razorpay.orders.create({
        amount: Math.round(Number(totalAmount) * 100),
        currency: RAZORPAY_CURRENCY,
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
