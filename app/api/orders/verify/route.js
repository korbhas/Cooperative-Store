import crypto from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'
import { RAZORPAY_KEY_SECRET } from '@/lib/env'
import { awardOrderPoints } from '@/lib/loyalty-server'
import { notifyAdminOrderConfirmed } from '@/lib/whatsapp'

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new ApiError('Unauthorized', 401)
    if (!RAZORPAY_KEY_SECRET) throw new ApiError('Payment verification not configured', 503)

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json()

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError('Missing payment verification fields', 400)
    }

    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSig !== razorpaySignature) {
      throw new ApiError('Payment signature verification failed', 400)
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true, totalAmount: true, deliveryAddress: true, user: { select: { name: true, phone: true } } },
    })

    if (!order) throw new ApiError('Order not found', 404)
    if (order.status !== 'pending') return apiResponse({ success: true })

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'processing' },
      }),
      prisma.payment.create({
        data: {
          orderId,
          razorpayPaymentId,
          amount: order.totalAmount,
          status: 'captured',
          paidAt: new Date(),
        },
      }),
    ])

    await awardOrderPoints(orderId)

    notifyAdminOrderConfirmed(
      orderId,
      order.user?.name,
      order.user?.phone,
      Number(order.totalAmount),
      order.deliveryAddress,
    ).catch(() => {})

    return apiResponse({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
