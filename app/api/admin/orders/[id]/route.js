import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'
import { awardOrderPoints, revokeOrderPoints } from '@/lib/loyalty-server'

export async function GET(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true } }, variant: { select: { name: true } } } },
        payment: true,
        coupon: { select: { code: true, discountType: true, discountValue: true } },
        deliveryAgent: { select: { id: true, name: true } },
      },
    })
    if (!order) throw new ApiError('Order not found', 404)

    return apiResponse({
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      estimatedDelivery: order.estimatedDelivery?.toISOString() ?? null,
      payment: order.payment ? {
        ...order.payment,
        amount: order.payment.amount.toNumber(),
        createdAt: order.payment.createdAt.toISOString(),
        updatedAt: order.payment.updatedAt.toISOString(),
        paidAt: order.payment.paidAt?.toISOString() ?? null,
      } : null,
      items: order.items.map(item => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
      })),
      coupon: order.coupon ? { ...order.coupon, discountValue: order.coupon.discountValue.toNumber() } : null,
    })
  } catch (e) { return apiError(e) }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { status, deliveryAgentId } = body

    const data = {}
    if (status) data.status = status
    if (deliveryAgentId !== undefined) data.deliveryAgentId = deliveryAgentId ? Number(deliveryAgentId) : null

    const previous = status
      ? await prisma.order.findUnique({ where: { id: Number(id) }, select: { status: true } })
      : null

    const order = await prisma.order.update({ where: { id: Number(id) }, data })

    // Loyalty side effects on status transitions (idempotent helpers).
    if (status && previous && previous.status !== status) {
      if (status === 'delivered') {
        await awardOrderPoints(order.id) // covers COD orders that never hit payment capture
      } else if (status === 'cancelled' || status === 'refunded') {
        if (previous.status !== 'cancelled' && previous.status !== 'refunded') {
          await revokeOrderPoints(order.id)
        }
      }
    }

    return apiResponse({ id: order.id, status: order.status })
  } catch (e) { return apiError(e) }
}
