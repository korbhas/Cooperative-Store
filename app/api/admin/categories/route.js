import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const cats = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return apiResponse(cats.map(c => ({
      id: c.id, name: c.name, slug: c.slug, sortOrder: c.sortOrder,
      productCount: c._count.products,
    })))
  } catch (e) { return apiError(e) }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const { name, slug, sortOrder } = await request.json()
    const cat = await prisma.category.create({ data: { name, slug, sortOrder: sortOrder ?? 0 } })
    return apiResponse({ id: cat.id, name: cat.name, slug: cat.slug }, 201)
  } catch (e) { return apiError(e) }
}
