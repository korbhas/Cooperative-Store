import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { pointsEarnedFor } from '@/lib/loyalty'

// Award points for a paid/delivered order. Idempotent: the order's
// pointsEarned field doubles as the "already awarded" guard, so the verify
// route, the Razorpay webhook, and the admin delivered-transition can all
// call this safely.
export async function awardOrderPoints(orderId) {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, totalAmount: true, pointsEarned: true },
      })
      if (!order || !order.userId || order.pointsEarned > 0) return

      const points = pointsEarnedFor(order.totalAmount.toNumber())
      if (points <= 0) return

      await tx.order.update({ where: { id: order.id }, data: { pointsEarned: points } })
      await tx.user.update({
        where: { id: order.userId },
        data: { loyaltyPoints: { increment: points } },
      })
    })
  } catch (err) {
    // Points are best-effort — never fail the payment flow over them.
    logger.error('loyalty_award_failed', { orderId, message: err.message })
  }
}

// Reverse loyalty effects when an order is cancelled/refunded:
// claw back earned points (never below 0) and restore redeemed ones.
// Caller must ensure this runs only on a transition INTO cancelled/refunded.
export async function revokeOrderPoints(orderId) {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, pointsEarned: true, pointsRedeemed: true },
      })
      if (!order || !order.userId) return

      const delta = order.pointsRedeemed - order.pointsEarned
      if (delta === 0) return

      const user = await tx.user.findUnique({
        where: { id: order.userId },
        select: { loyaltyPoints: true },
      })
      const next = Math.max(0, user.loyaltyPoints + delta)
      await tx.user.update({ where: { id: order.userId }, data: { loyaltyPoints: next } })
      await tx.order.update({
        where: { id: order.id },
        data: { pointsEarned: 0, pointsRedeemed: 0 },
      })
    })
  } catch (err) {
    logger.error('loyalty_revoke_failed', { orderId, message: err.message })
  }
}
