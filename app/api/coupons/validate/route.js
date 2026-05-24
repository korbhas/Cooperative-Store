import { prisma } from '@/lib/prisma'
import { apiResponse, apiError, ApiError } from '@/lib/api-error'
import { checkCouponRules, serializeCoupon } from '@/lib/coupon'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')?.trim().toUpperCase()
    const amount = parseFloat(searchParams.get('amount') || '0')

    if (!code) throw new ApiError('Coupon code required', 400)

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    if (!coupon) return apiResponse({ valid: false, error: 'Invalid or expired coupon' })

    const { valid, error } = checkCouponRules(coupon, { amount })
    if (!valid) return apiResponse({ valid: false, error })

    return apiResponse({ valid: true, coupon: serializeCoupon(coupon) })
  } catch (err) {
    return apiError(err)
  }
}
