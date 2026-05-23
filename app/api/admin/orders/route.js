import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET(request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()

    const where = {}
    if (status) where.status = status
    if (q) {
      where.OR = [
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { guestName: { contains: q, mode: 'insensitive' } },
        { guestEmail: { contains: q, mode: 'insensitive' } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { items: true } },
      },
    })

    return apiResponse(orders.map(o => ({
      id: o.id,
      customer: { name: o.user?.name ?? o.guestName, email: o.user?.email ?? o.guestEmail, phone: o.user?.phone ?? o.guestPhone },
      status: o.status,
      totalAmount: o.totalAmount.toNumber(),
      itemCount: o._count.items,
      createdAt: o.createdAt.toISOString(),
    })))
  } catch (e) { return apiError(e) }
}
