import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { apiResponse, apiError } from '@/lib/api-error'

export async function GET() {
  try {
    await requireAdmin()
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } })
    return apiResponse(coupons.map(c => ({
      ...c,
      discountValue: c.discountValue.toNumber(),
      minOrderAmount: c.minOrderAmount.toNumber(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      startsAt: c.startsAt?.toISOString() ?? null,
      expiresAt: c.expiresAt?.toISOString() ?? null,
    })))
  } catch (e) { return apiError(e) }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const body = await request.json()
    const { code, description, discountType, discountValue, minOrderAmount, maxUses, startsAt, expiresAt, isActive } = body
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(), description,
        discountType, discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxUses: maxUses ? Number(maxUses) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive ?? true,
      },
    })
    return apiResponse({ id: coupon.id }, 201)
  } catch (e) { return apiError(e) }
}
