import { prisma } from '@/lib/prisma'
import UsersClient from './UsersClient'

async function getUsers(q, role) {
  const where = {}
  if (role) where.role = role
  if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }]
  const users = await prisma.user.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } }, orders: { select: { totalAmount: true }, where: { status: 'delivered' } } },
  })
  return users.map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    role: u.role, isBanned: u.isBanned,
    createdAt: u.createdAt.toISOString(),
    orderCount: u._count.orders,
    totalSpent: u.orders.reduce((s, o) => s + o.totalAmount.toNumber(), 0),
  }))
}

export default async function UsersPage({ searchParams }) {
  const { q, role } = await searchParams
  const users = await getUsers(q, role)
  return <UsersClient initialUsers={users} />
}
