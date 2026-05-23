import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET(request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim()
    const category = searchParams.get('category')
    const status = searchParams.get('status')

    const where = {}
    if (q) where.name = { contains: q, mode: 'insensitive' }
    if (category) where.categoryId = Number(category)
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { variants: true } },
      },
    })

    return apiResponse(products.map(p => ({
      id: p.id, name: p.name, description: p.description,
      price: p.price.toNumber(), unit: p.unit, stockQty: p.stockQty,
      imageUrl: p.imageUrl, isActive: p.isActive,
      category: p.category, variantCount: p._count.variants,
      createdAt: p.createdAt.toISOString(),
    })))
  } catch (e) { return apiError(e) }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { name, description, categoryId, price, unit, stockQty, imageUrl, isActive } = body

    const product = await prisma.product.create({
      data: {
        name, description,
        categoryId: categoryId ? Number(categoryId) : null,
        price: Number(price), unit: unit || 'piece',
        stockQty: Number(stockQty) || 0,
        imageUrl, isActive: isActive ?? true,
      },
    })
    return apiResponse({ id: product.id, name: product.name }, 201)
  } catch (e) { return apiError(e) }
}
