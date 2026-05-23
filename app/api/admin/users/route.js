import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET(request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const role = searchParams.get('role')

    const where = {}
    if (role) where.role = role
    if (q) where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ]

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true }, where: { status: 'delivered' } },
      },
    })

    return apiResponse(users.map(u => ({
      id: u.id, name: u.name, email: u.email, phone: u.phone,
      role: u.role, isBanned: u.isBanned, emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      orderCount: u._count.orders,
      totalSpent: u.orders.reduce((sum, o) => sum + o.totalAmount.toNumber(), 0),
    })))
  } catch (e) { return apiError(e) }
}
