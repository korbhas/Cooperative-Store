import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const areas = await prisma.deliveryArea.findMany({ orderBy: { pincode: 'asc' } })
    return apiResponse(areas.map(a => ({ ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString() })))
  } catch (e) { return apiError(e) }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const { pincode, areaName, isActive } = await request.json()
    const area = await prisma.deliveryArea.create({ data: { pincode, areaName, isActive: isActive ?? true } })
    return apiResponse({ id: area.id }, 201)
  } catch (e) { return apiError(e) }
}
