import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { pincode, areaName, isActive } = await request.json()
    const data = {}
    if (pincode !== undefined) data.pincode = pincode
    if (areaName !== undefined) data.areaName = areaName
    if (isActive !== undefined) data.isActive = isActive
    await prisma.deliveryArea.update({ where: { id: Number(id) }, data })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.deliveryArea.delete({ where: { id: Number(id) } })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
