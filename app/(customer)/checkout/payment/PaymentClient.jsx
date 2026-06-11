'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { IconMapPin, IconChevronRight, IconPencil } from '@tabler/icons-react'
import { useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'
import { usePlaceOrder } from '@/hooks/use-place-order'
import CartEmptyState from '../CartEmptyState'
import CouponField from '@/components/checkout/CouponField'
import PageLoader from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import {
  Card, CardAction, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { FieldSeparator } from '@/components/ui/field'

export default function PaymentClient({ deliveryFee: deliveryFeeConfig, freeDeliveryThreshold }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const items = useCartStore((s) => s.items)
  const totalAmount = useCartStore((s) => s.totalAmount)

  const address = useCheckoutStore((s) => s.address)
  const coupon = useCheckoutStore((s) => s.coupon)

  const { placeOrder, submitting } = usePlaceOrder()

  useEffect(() => { setMounted(true) }, [])

  // No address yet (deep link / cleared store) — back to step 1
  useEffect(() => {
    if (mounted && items.length > 0 && !address) {
      router.replace('/checkout/address')
    }
  }, [mounted, items.length, address, router])

  if (!mounted) return null

  if (items.length === 0) return <CartEmptyState />

  if (!address) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageLoader label="Redirecting…" />
      </div>
    )
  }

  const subtotal = totalAmount()
  const deliveryFee = subtotal >= freeDeliveryThreshold ? 0 : deliveryFeeConfig
  let discount = 0
  if (coupon) {
    discount = coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue
    discount = Math.min(discount, subtotal)
  }
  const total = subtotal + deliveryFee - discount

  return (
    <div className="flex flex-col gap-5 md:flex-row">

      {/* Left — address summary + coupon, one block */}
      <Card className="min-w-0 flex-1 md:self-start">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMapPin className="size-4 text-primary" /> Delivery Address
          </CardTitle>
          <CardAction>
            <Link
              href="/checkout/address"
              className="flex items-center gap-1 text-sm font-medium text-secondary-foreground hover:opacity-80"
            >
              <IconPencil className="size-3.5" /> Edit
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold">{address.name}</p>
              <p className="text-sm text-muted-foreground">{address.phone}</p>
              <p className="mt-1 text-sm">{address.address}</p>
            </div>

            <FieldSeparator className="[&_[data-slot=field-separator-content]]:bg-card">
              Coupon
            </FieldSeparator>

            <CouponField subtotal={subtotal} />
          </div>
        </CardContent>
      </Card>

      {/* Right — order summary + pay */}
      <div className="w-full md:w-80 md:flex-none">
        <div style={{
          background: '#fff', borderRadius: 12,
          border: '1.5px solid var(--color-fm-line-soft)',
          padding: '20px', position: 'sticky', top: 64,
        }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 14 }}>
            Order Summary
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', marginBottom: 14 }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.name}</div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>
                    {item.quantity} × ₹{item.price}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink)', flexShrink: 0 }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--color-fm-line-soft)', marginBottom: 12 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
            <Row
              label="Delivery"
              value={deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
              green={deliveryFee === 0}
            />
            {discount > 0 && (
              <Row label={`Coupon (${coupon.code})`} value={`−₹${discount.toFixed(2)}`} green />
            )}
            <div style={{ height: 1, background: 'var(--color-fm-line-soft)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
                ₹{total.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            className="mt-5 w-full"
            disabled={submitting}
            onClick={() => placeOrder({ items, address, coupon, discount, total })}
          >
            {submitting ? 'Processing…' : <>Pay ₹{total.toFixed(2)} <IconChevronRight className="size-4" /></>}
          </Button>

          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)',
            textAlign: 'center', marginTop: 10,
          }}>
            Secured by Razorpay
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Row({ label, value, green }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
        color: green ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink)',
      }}>{value}</span>
    </div>
  )
}
