import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

export async function PATCH(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { name, slug, sortOrder } = await request.json()
    const data = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    const cat = await prisma.category.update({ where: { id: Number(id) }, data })
    return apiResponse({ id: cat.id })
  } catch (e) { return apiError(e) }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const count = await prisma.product.count({ where: { categoryId: Number(id) } })
    if (count > 0) throw new ApiError('Cannot delete category with products', 400)
    await prisma.category.delete({ where: { id: Number(id) } })
    return apiResponse({ ok: true })
  } catch (e) { return apiError(e) }
}
