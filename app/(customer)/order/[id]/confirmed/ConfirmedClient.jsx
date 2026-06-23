'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconCircleCheck, IconMapPin, IconClock, IconStar, IconShoppingBag } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import OrdersDrawer from '@/components/OrdersDrawer'

function fmt(n) {
  return `₹${Number(n).toFixed(2)}`
}

export default function ConfirmedClient({ order, deliveryEstimate }) {
  const [ordersOpen, setOrdersOpen] = useState(false)

  const subtotal = order.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)

  if (order.status === 'pending') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-12 h-12 rounded-full border-4 border-[var(--color-fm-green)] border-t-transparent animate-spin" />
        <p className="text-[var(--color-fm-ink)] font-medium">Payment processing…</p>
        <p className="text-sm text-[var(--color-fm-ink3)]">This page will update once confirmed.</p>
      </div>
    )
  }

  return (
    <>
      <OrdersDrawer open={ordersOpen} onOpenChange={setOrdersOpen} />

      <div className="min-h-screen bg-[var(--color-fm-paper)] py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col items-center gap-2 text-center">
            <IconCircleCheck size={56} className="text-[var(--color-fm-green)]" strokeWidth={1.5} />
            <h1 className="text-2xl font-heading font-semibold text-[var(--color-fm-ink)]">Order Confirmed!</h1>
            <p className="text-sm text-[var(--color-fm-ink3)]">Order <span className="font-medium text-[var(--color-fm-ink)]">#{order.id}</span></p>
          </div>

          {/* Delivery info */}
          <div className="bg-[var(--color-fm-green-soft)] rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <IconClock size={18} className="text-[var(--color-fm-green-ink)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--color-fm-ink)]">Estimated delivery</p>
                <p className="text-sm text-[var(--color-fm-ink2)]">Within {deliveryEstimate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconMapPin size={18} className="text-[var(--color-fm-green-ink)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-[var(--color-fm-ink)]">Delivering to</p>
                <p className="text-sm text-[var(--color-fm-ink2)] whitespace-pre-line">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-[var(--color-fm-card,#fff)] rounded-xl border border-[var(--color-fm-line-soft)] overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-fm-line-soft)]">
              <p className="text-sm font-medium text-[var(--color-fm-ink)]">Items ordered</p>
            </div>
            <ul className="divide-y divide-[var(--color-fm-line-soft)]">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[var(--color-fm-paper2)] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-fm-ink)] truncate">{item.name}</p>
                    {item.variantName && (
                      <p className="text-xs text-[var(--color-fm-ink3)]">{item.variantName}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-[var(--color-fm-ink)]">{fmt(item.unitPrice * item.quantity)}</p>
                    <p className="text-xs text-[var(--color-fm-ink3)]">×{item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Totals */}
          <div className="bg-[var(--color-fm-card,#fff)] rounded-xl border border-[var(--color-fm-line-soft)] px-4 py-3 space-y-2 text-sm">
            <div className="flex justify-between text-[var(--color-fm-ink2)]">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {order.deliveryFee > 0 ? (
              <div className="flex justify-between text-[var(--color-fm-ink2)]">
                <span>Delivery</span>
                <span>{fmt(order.deliveryFee)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-[var(--color-fm-green-ink)]">
                <span>Delivery</span>
                <span>Free</span>
              </div>
            )}
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-[var(--color-fm-green-ink)]">
                <span>Coupon {order.couponCode && <span className="font-mono text-xs">({order.couponCode})</span>}</span>
                <span>−{fmt(order.couponDiscount)}</span>
              </div>
            )}
            {order.pointsDiscount > 0 && (
              <div className="flex justify-between text-[var(--color-fm-green-ink)]">
                <span>Points redeemed</span>
                <span>−{fmt(order.pointsDiscount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-[var(--color-fm-ink)]">
              <span>Total paid</span>
              <span>{fmt(order.total)}</span>
            </div>
          </div>

          {/* Points earned */}
          {order.pointsEarned > 0 && (
            <div className="flex items-center gap-2 bg-[var(--color-fm-accent-soft)] rounded-xl px-4 py-3">
              <IconStar size={16} className="text-[var(--color-fm-accent)] shrink-0" />
              <p className="text-sm text-[var(--color-fm-ink)]">
                You earned <span className="font-semibold">{order.pointsEarned} loyalty points</span> on this order.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOrdersOpen(true)}
            >
              <IconShoppingBag size={16} className="mr-1.5" />
              View Orders
            </Button>
            <Button asChild className="flex-1 bg-[var(--color-fm-green)] hover:bg-[var(--color-fm-green-ink)] text-white">
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>

        </div>
      </div>
    </>
  )
}
