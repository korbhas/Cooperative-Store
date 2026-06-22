import { POINTS_PER_100, POINTS_PER_RUPEE } from '@/lib/config'

// Pure loyalty math, shared by checkout UI and API routes.

// Points earned for an order total: POINTS_PER_100 per full ₹100.
export function pointsEarnedFor(total) {
  return Math.floor(Number(total) / 100) * POINTS_PER_100
}

// How much of a balance can be redeemed against an order.
// Returns { rupees, points }: rupee discount and the points it consumes.
// Whole rupees only; capped at maxRupees (order total after coupon).
export function pointsRedemption(balance, maxRupees) {
  const rupees = Math.max(
    0,
    Math.min(Math.floor(Number(balance) / POINTS_PER_RUPEE), Math.floor(Number(maxRupees)))
  )
  return { rupees, points: rupees * POINTS_PER_RUPEE }
}

// Display helper: ₹ value of a points balance.
export function pointsValue(balance) {
  return Math.floor(Number(balance) / POINTS_PER_RUPEE)
}
