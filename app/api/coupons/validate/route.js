import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()
    const amount = parseFloat(searchParams.get('amount') || '0')

    if (!code) throw new ApiError('Coupon code required', 400)

    const coupon = await prisma.coupon.findUnique({ where: { code } })

    if (!coupon || !coupon.isActive) {
      return apiResponse({ valid: false, error: 'Invalid or expired coupon' })
    }

    const now = new Date()
    if (coupon.startsAt && coupon.startsAt > now) {
      return apiResponse({ valid: false, error: 'Coupon is not yet active' })
    }
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return apiResponse({ valid: false, error: 'Coupon has expired' })
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return apiResponse({ valid: false, error: 'Coupon usage limit reached' })
    }
    if (amount < Number(coupon.minOrderAmount)) {
      return apiResponse({
        valid: false,
        error: `Minimum order amount ₹${coupon.minOrderAmount} required`,
      })
    }

    return apiResponse({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        description: coupon.description,
      },
    })
  } catch (err) {
    return apiError(err)
  }
}
