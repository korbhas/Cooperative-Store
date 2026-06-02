import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

export async function POST(request) {
  if (!WEBHOOK_SECRET) {
    console.error('[razorpay webhook] RAZORPAY_WEBHOOK_SECRET not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  const expectedSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (expectedSig !== signature) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity
    await handleCaptured(payment.order_id, payment.id)
  }

  if (event.event === 'payment.failed') {
    const payment = event.payload.payment.entity
    await handleFailed(payment.order_id)
  }

  return new Response('OK', { status: 200 })
}

async function handleCaptured(razorpayOrderId, razorpayPaymentId) {
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
    select: { id: true, status: true },
  })

  if (!order || order.status !== 'pending') return

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'processing' },
    }),
    prisma.payment.update({
      where: { orderId: order.id },
      data: { razorpayPaymentId, status: 'captured', paidAt: new Date() },
    }),
  ])
}

async function handleFailed(razorpayOrderId) {
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
    select: { id: true, status: true },
  })

  if (!order || order.status !== 'pending') return

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' },
    }),
    prisma.payment.update({
      where: { orderId: order.id },
      data: { status: 'failed' },
    }),
  ])
}
