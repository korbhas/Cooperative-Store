'use client'

import { useEffect, useState } from 'react'
import { IconCoin } from '@tabler/icons-react'
import { useCheckoutStore } from '@/store/checkout'
import { pointsRedemption, pointsValue } from '@/lib/loyalty'
import { Switch } from '@/components/ui/switch'

// Loyalty points redemption toggle for the payment step.
// Fetches the balance from /api/me; hidden until the balance is worth ≥ ₹1.
// onBalance reports the fetched balance up so totals can be recomputed.
export default function PointsField({ maxRupees, balance, onBalance }) {
  const redeemPoints = useCheckoutStore((s) => s.redeemPoints)
  const setRedeemPoints = useCheckoutStore((s) => s.setRedeemPoints)
  const [loaded, setLoaded] = useState(balance != null)

  useEffect(() => {
    if (balance != null) return
    let active = true
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => {
        if (!active) return
        onBalance?.(Number(d?.loyaltyPoints) || 0)
        setLoaded(true)
      })
      .catch(() => { if (active) setLoaded(true) })
    return () => { active = false }
  }, [balance, onBalance])

  if (!loaded || !balance || pointsValue(balance) < 1) return null

  const { rupees, points } = pointsRedemption(balance, maxRupees)

  return (
    <div className="flex items-center justify-between rounded-md border border-dashed border-secondary-foreground/60 bg-secondary px-3.5 py-2.5">
      <div className="flex items-center gap-2 text-secondary-foreground">
        <IconCoin className="size-4 shrink-0" />
        <div>
          <p className="text-xs font-bold">{balance} points available</p>
          <p className="text-xs">
            {redeemPoints
              ? `Using ${points} points for ₹${rupees} off`
              : `Redeem for up to ₹${pointsValue(balance)} off`}
          </p>
        </div>
      </div>
      <Switch
        checked={redeemPoints}
        onCheckedChange={setRedeemPoints}
        aria-label="Redeem loyalty points"
      />
    </div>
  )
}
