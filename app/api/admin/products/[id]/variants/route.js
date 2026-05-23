import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const variants = await prisma.productVariant.findMany({
      where: { productId: Number(id) },
      orderBy: { sortOrder: 'asc' },
    })
    return apiResponse(variants.map(v => ({ ...v, price: v.price.toNumber() })))
  } catch (e) { return apiError(e) }
}

export async function POST(request, { params }) {
  try {
    await requireAdmin()
    const { id } = await params
    const { name, price, stockQty, isDefault, sortOrder } = await request.json()
    const variant = await prisma.productVariant.create({
      data: {
        productId: Number(id), name,
        price: Number(price), stockQty: Number(stockQty) || 0,
        isDefault: isDefault ?? false, sortOrder: sortOrder ?? 0,
      },
    })
    return apiResponse({ ...variant, price: variant.price.toNumber() }, 201)
  } catch (e) { return apiError(e) }
}
