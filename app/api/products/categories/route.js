import { prisma } from '@/lib/prisma'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return apiResponse(categories)
  } catch (err) {
    return apiError(err)
  }
}
