import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const data = {}
    if (body.code !== undefined) data.code = body.code.toUpperCase()
    if (body.description !== undefined) data.description = body.description
    if (body.discountType !== undefined) data.discountType = body.discountType
    if (body.discountValue !== undefined) data.discountValue = Number(body.discountValue)
    if (body.minOrderAmount !== undefined) data.minOrderAmount = Number(body.minOrderAmount)
    if (body.maxUses !== undefined) data.maxUses = body.maxUses ? Number(body.maxUses) : null
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
    if (body.isActive !== undefined) data.isActive = body.isActive
    await prisma.coupon.update({ where: { id: Number(id) }, data })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.coupon.delete({ where: { id: Number(id) } })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
