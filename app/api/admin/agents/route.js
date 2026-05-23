import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const agents = await prisma.deliveryAgent.findMany({ orderBy: { name: 'asc' } })
    return apiResponse(agents.map(a => ({ ...a, createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString() })))
  } catch (e) { return apiError(e) }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const { name, phone, vehicleType, isActive } = await request.json()
    const agent = await prisma.deliveryAgent.create({ data: { name, phone, vehicleType: vehicleType || 'bike', isActive: isActive ?? true } })
    return apiResponse({ id: agent.id, name: agent.name }, 201)
  } catch (e) { return apiError(e) }
}
