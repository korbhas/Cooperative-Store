import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { name, price, stockQty, isDefault, sortOrder } = await request.json()
    const data = {}
    if (name !== undefined) data.name = name
    if (price !== undefined) data.price = Number(price)
    if (stockQty !== undefined) data.stockQty = Number(stockQty)
    if (isDefault !== undefined) data.isDefault = isDefault
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    const variant = await prisma.productVariant.update({ where: { id: Number(id) }, data })
    return apiResponse({ ...variant, price: variant.price.toNumber() })
  } catch (e) { return apiError(e) }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    await prisma.productVariant.delete({ where: { id: Number(id) } })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
