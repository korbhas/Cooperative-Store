import { auth, currentUser } from '@clerk/nextjs/server'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'
import { logger } from '@/lib/logger'
import { RAZORPAY_CURRENCY } from '@/lib/config'
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '@/lib/env'
import { checkCouponRules, computeDiscount } from '@/lib/coupon'
import { pointsRedemption } from '@/lib/loyalty'
import { notifyAdminOrderConfirmed } from '@/lib/whatsapp'

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new ApiError('Unauthorized', 401)

    const clerkUser = await currentUser()
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) throw new ApiError('No email on account', 400)

    const body = await request.json()
    const { deliveryAddress, phone, items, totalAmount, couponId, redeemPoints, pointsDiscount } = body

    if (!deliveryAddress || !items?.length) {
      throw new ApiError('Missing required fields', 400)
    }

    // The cart is persisted client-side, so it can reference products that
    // have since been deleted — reject with a clear message instead of
    // letting order.create() fail on the foreign key.
    const productIds = [...new Set(items.map((i) => i.productId))]
    const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))]
    const [existingProducts, existingVariants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } }),
      variantIds.length
        ? prisma.productVariant.findMany({ where: { id: { in: variantIds } }, select: { id: true } })
        : Promise.resolve([]),
    ])
    if (existingProducts.length !== productIds.length || existingVariants.length !== variantIds.length) {
      const foundProducts = new Set(existingProducts.map((p) => p.id))
      const missingProductIds = productIds.filter((id) => !foundProducts.has(id))
      logger.warn('order_stale_cart_items', { userId, missingProductIds })
      return Response.json(
        {
          error: 'Some items in your cart are no longer available. They have been removed — please review your cart and try again.',
          missingProductIds,
        },
        { status: 400 }
      )
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

    // Find or create the DB user (store phone so webhook can read it later)
    const customerName = clerkUser.fullName ?? clerkUser.firstName ?? null
    const dbUser = await prisma.user.upsert({
      where: { email },
      update: { phone: phone ?? undefined },
      create: {
        email,
        name: customerName,
        phone: phone ?? null,
        role: 'customer',
      },
      select: { id: true, loyaltyPoints: true },
    })

    // Re-validate points redemption server-side — client preview can go stale.
    // Client sends totalAmount net of its points discount; reconstruct the
    // pre-points total and recompute from the actual balance.
    let pointsRedeemed = 0
    let finalTotal = Number(totalAmount)
    if (redeemPoints) {
      const preTotal = Number(totalAmount) + Number(pointsDiscount ?? 0)
      const { rupees, points } = pointsRedemption(dbUser.loyaltyPoints, preTotal)
      pointsRedeemed = points
      finalTotal = preTotal - rupees
    }

    // Create DB order + items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      if (pointsRedeemed > 0) {
        const debit = await tx.user.updateMany({
          where: { id: dbUser.id, loyaltyPoints: { gte: pointsRedeemed } },
          data: { loyaltyPoints: { decrement: pointsRedeemed } },
        })
        if (debit.count === 0) {
          throw new ApiError('Your points balance changed — please review and try again', 409)
        }
      }

      const newOrder = await tx.order.create({
        data: {
          userId: dbUser.id,
          deliveryAddress,
          totalAmount: finalTotal,
          discountAmount,
          pointsRedeemed,
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
        amount: Math.round(finalTotal * 100),
        currency: RAZORPAY_CURRENCY,
        receipt: `order_${order.id}`,
      })
      razorpayOrderId = rzpOrder.id

      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId },
      })
    }

    logger.info('order_created', {
      orderId: order.id,
      userId: dbUser.id,
      totalAmount: finalTotal,
      itemCount: items.length,
      couponId: couponId ?? null,
      pointsRedeemed,
      razorpayOrderId,
    })

    // For COD (no Razorpay), notify admin immediately — paid orders are handled by the webhook
    if (!razorpayOrderId) {
      notifyAdminOrderConfirmed(order.id, customerName, phone, finalTotal, deliveryAddress).catch(() => {})
    }

    return apiResponse({ orderId: order.id, razorpayOrderId })
  } catch (err) {
    if (!(err instanceof ApiError)) {
      logger.error('order_creation_failed', { message: err.message })
      Sentry.captureException(err)
    }
    return apiError(err)
  }
}

// Signed-in customer's order history (consumed by OrdersDrawer)
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) throw new ApiError('Unauthorized', 401)

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress
    if (!email) throw new ApiError('No email on account', 400)

    const dbUser = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    if (!dbUser) return apiResponse([])

    const rawOrders = await prisma.order.findMany({
      where: { userId: dbUser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true } } },
        },
        user: { select: { name: true, phone: true, email: true } },
      },
    })

    return apiResponse(
      rawOrders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: o.totalAmount.toNumber(),
        discountAmount: o.discountAmount.toNumber(),
        pointsEarned: o.pointsEarned,
        pointsRedeemed: o.pointsRedeemed,
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
    )
  } catch (err) {
    return apiError(err)
  }
}
