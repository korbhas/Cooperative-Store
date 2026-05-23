import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()
    const { name, description, categoryId, price, unit, stockQty, imageUrl, isActive } = body

    const data = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (categoryId !== undefined) data.categoryId = categoryId ? Number(categoryId) : null
    if (price !== undefined) data.price = Number(price)
    if (unit !== undefined) data.unit = unit
    if (stockQty !== undefined) data.stockQty = Number(stockQty)
    if (imageUrl !== undefined) data.imageUrl = imageUrl
    if (isActive !== undefined) data.isActive = isActive

    const product = await prisma.product.update({ where: { id: Number(id) }, data })
    return apiResponse({ id: product.id })
  } catch (e) { return apiError(e) }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.product.delete({ where: { id: Number(id) } })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
