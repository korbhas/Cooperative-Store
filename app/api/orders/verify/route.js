import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

export async function POST(request) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new ApiError('Unauthorized', 401)

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await request.json()

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new ApiError('Missing payment verification fields', 400)
    }

    // Verify signature
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
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
