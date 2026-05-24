import crypto from 'crypto'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'
import { RAZORPAY_KEY_SECRET } from '@/lib/env'

export async function POST(request) {
  try {
    const { userId } = await auth()
    if (!userId) throw new ApiError('Unauthorized', 401)
    if (!RAZORPAY_KEY_SECRET) throw new ApiError('Payment verification not configured', 503)

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json()

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError('Missing payment verification fields', 400)
    }

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expectedSig !== razorpaySignature) {
      throw new ApiError('Payment signature verification failed', 400)
    }

    // Update order + payment
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'processing' },
      }),
      prisma.payment.update({
        where: { orderId },
        data: {
          razorpayPaymentId,
          status: 'captured',
          paidAt: new Date(),
        },
      }),
    ])

    return apiResponse({ success: true })
  } catch (err) {
    return apiError(err)
  }
}
