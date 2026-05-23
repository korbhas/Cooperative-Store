import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { name, phone, vehicleType, isActive } = await request.json()
    const data = {}
    if (name !== undefined) data.name = name
    if (phone !== undefined) data.phone = phone
    if (vehicleType !== undefined) data.vehicleType = vehicleType
    if (isActive !== undefined) data.isActive = isActive
    const agent = await prisma.deliveryAgent.update({ where: { id: Number(id) }, data })
    return apiResponse({ id: agent.id })
  } catch (e) { return apiError(e) }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.deliveryAgent.delete({ where: { id: Number(id) } })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
