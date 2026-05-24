/**
 * @param {object} coupon - Prisma Coupon record
 * @param {{ amount: number }} context - order subtotal before discount
 * @returns {{ valid: boolean, error?: string }}
 */
export function checkCouponRules(coupon, { amount }) {
  if (!coupon.isActive) return { valid: false, error: 'Invalid or expired coupon' }

  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) return { valid: false, error: 'Coupon is not yet active' }
  if (coupon.expiresAt && coupon.expiresAt < now) return { valid: false, error: 'Coupon has expired' }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return { valid: false, error: 'Coupon usage limit reached' }
  if (amount < Number(coupon.minOrderAmount)) {
    return { valid: false, error: `Minimum order amount ₹${coupon.minOrderAmount} required` }
  }

  return { valid: true }
}

/**
 * @param {object} coupon - Prisma Coupon record
 * @param {number} subtotal
 * @returns {number}
 */
export function computeDiscount(coupon, subtotal) {
  const raw = coupon.discountType === 'percentage'
    ? (subtotal * Number(coupon.discountValue)) / 100
    : Number(coupon.discountValue)
  return Math.min(raw, subtotal)
}

/**
 * Strips Prisma types for API responses (Decimal → number).
 * @param {object} coupon - Prisma Coupon record
 */
export function serializeCoupon(coupon) {
  return {
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    description: coupon.description,
  }
}
