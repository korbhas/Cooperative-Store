import crypto from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { awardOrderPoints } from '@/lib/loyalty-server'
import { notifyAdminOrderConfirmed } from '@/lib/whatsapp'

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET

export async function POST(request) {
  if (!WEBHOOK_SECRET) {
    logger.error('webhook_secret_missing', {})
    return new Response('Webhook secret not configured', { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  const expectedSig = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  if (expectedSig !== signature) {
    logger.warn('webhook_signature_invalid', { signature: signature?.slice(0, 8) })
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)

  try {
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      await handleCaptured(payment.order_id, payment.id, payment.amount)
    } else if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      await handleFailed(payment.order_id)
    } else {
      logger.info('webhook_event_ignored', { event: event.event })
    }
  } catch (err) {
    logger.error('webhook_processing_failed', { event: event.event, message: err.message })
    Sentry.captureException(err, { extra: { razorpayEvent: event.event } })
    return new Response('Processing error', { status: 500 })
  }

  return new Response('OK', { status: 200 })
}

async function handleCaptured(razorpayOrderId, razorpayPaymentId, amountPaise) {
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
    select: {
      id: true,
      status: true,
      totalAmount: true,
      deliveryAddress: true,
      user: { select: { name: true, phone: true } },
    },
  })

  if (!order) {
    logger.warn('webhook_order_not_found', { razorpayOrderId })
    return
  }
  if (order.status !== 'pending') {
    logger.info('webhook_order_already_processed', { orderId: order.id, status: order.status })
    return
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'processing' },
    }),
    prisma.payment.create({
      data: {
        orderId: order.id,
        razorpayPaymentId,
        amount: amountPaise / 100,
        status: 'captured',
        paidAt: new Date(),
      },
    }),
  ])

  logger.info('payment_captured', {
    orderId: order.id,
    razorpayPaymentId,
    amountRupees: amountPaise / 100,
  })

  await awardOrderPoints(order.id)

  notifyAdminOrderConfirmed(
    order.id,
    order.user?.name,
    order.user?.phone,
    Number(order.totalAmount),
    order.deliveryAddress,
  ).catch(() => {})
}

async function handleFailed(razorpayOrderId) {
  const order = await prisma.order.findFirst({
    where: { razorpayOrderId },
    select: { id: true, status: true },
  })

  if (!order) {
    logger.warn('webhook_order_not_found', { razorpayOrderId })
    return
  }
  if (order.status !== 'pending') {
    logger.info('webhook_order_already_processed', { orderId: order.id, status: order.status })
    return
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'cancelled' },
  })

  logger.warn('payment_failed', { orderId: order.id, razorpayOrderId })
}
