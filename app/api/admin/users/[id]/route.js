import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { name, phone, role, isBanned } = await request.json()
    const data = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (role !== undefined) data.role = role
    if (isBanned !== undefined) data.isBanned = isBanned
    const user = await prisma.user.update({ where: { id: Number(id) }, data })
    return apiResponse({ id: user.id })
  } catch (e) { return apiError(e) }
}
