import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const pincode = searchParams.get('pincode')?.trim()

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      throw new ApiError('Invalid pincode', 400)
    }

    const area = await prisma.deliveryArea.findUnique({
      where: { pincode },
      select: { areaName: true, isActive: true },
    })

    if (area?.isActive) {
      return apiResponse({ available: true, areaName: area.areaName })
    }

    return apiResponse({ available: false })
  } catch (err) {
    return apiError(err)
  }
}
