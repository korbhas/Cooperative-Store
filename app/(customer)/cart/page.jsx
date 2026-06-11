'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconMinus, IconPlus, IconTrash, IconShoppingCart, IconArrowRight, IconTag, IconX } from '@tabler/icons-react'
import { useCartStore } from '@/store/cart'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/config'
import PageLoader from '@/components/PageLoader'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clearCart = useCartStore((s) => s.clearCart)
  const totalAmount = useCartStore((s) => s.totalAmount)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <PageLoader label="Loading cart…" />
      </div>
    )
  }

  const subtotal = totalAmount()
  const delivery = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const total = subtotal + delivery

  if (items.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px', gap: 16 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'var(--color-fm-green-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <IconShoppingCart size={36} color="var(--color-fm-green)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 6 }}>
            Your cart is empty
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-fm-ink3)' }}>
            Add items from the store to get started
          </div>
        </div>
        <Link href="/products" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 24px', borderRadius: 8,
          background: 'var(--color-fm-green)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500,
          textDecoration: 'none',
        }}>
          Browse Products <IconArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, background: 'var(--color-fm-paper)' }}>
      <div className="pb-20 md:pb-8" style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '20px 16px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
              My Cart
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
              {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={clearCart}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 7,
              background: 'transparent',
              border: '1.5px solid var(--color-fm-line-soft)',
              color: 'var(--color-fm-ink3)',
              fontFamily: 'var(--font-sans)', fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <IconTrash size={13} /> Clear all
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-5">
          {/* Items list */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onInc={() => updateQuantity(item.id, item.quantity + 1)}
                onDec={() => updateQuantity(item.id, item.quantity - 1)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          {/* Order summary */}
          <div className="w-full md:w-80 md:flex-none">
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '1.5px solid var(--color-fm-line-soft)',
              padding: '20px', position: 'sticky', top: 64,
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 16 }}>
                Order Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <SummaryRow label="Subtotal" value={`₹${subtotal.toFixed(2)}`} />
                <SummaryRow
                  label="Delivery"
                  value={delivery === 0 ? 'Free' : `₹${delivery}`}
                  valueColor={delivery === 0 ? 'var(--color-fm-green-ink)' : undefined}
                />
                {subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 10px', borderRadius: 7,
                    background: 'var(--color-fm-accent-soft)',
                    fontFamily: 'var(--font-sans)', fontSize: 11,
                    color: 'var(--color-fm-accent)',
                  }}>
                    <IconTag size={11} />
                    Add ₹{(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(0)} more for free delivery
                  </div>
                )}

                <div style={{ height: 1, background: 'var(--color-fm-line-soft)', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)' }}>Total</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link href="/checkout/address" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 20, padding: '12px', borderRadius: 8,
                background: 'var(--color-fm-green)', color: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}>
                Proceed to Checkout <IconArrowRight size={15} />
              </Link>

              <Link href="/products" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 10, padding: '10px',
                fontFamily: 'var(--font-sans)', fontSize: 13,
                color: 'var(--color-fm-ink3)', textDecoration: 'none',
              }}>
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CartItemRow({ item, onInc, onDec, onRemove }) {
  const subtotal = item.price * item.quantity

  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
      {/* Image */}
      <div className="w-20 shrink-0">
        <AspectRatio ratio={1} className="overflow-hidden rounded-md bg-secondary">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-2xl">🛒</span>
          )}
        </AspectRatio>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-medium">{item.name}</h3>
        <p className="text-sm text-muted-foreground">
          {item.variantName ? `${item.variantName} · ` : ''}₹{item.price} / {item.unit}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onDec}
            aria-label="Decrease quantity"
          >
            <IconMinus className="size-3.5" />
          </Button>
          <span className="min-w-6 text-center text-sm font-medium tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onInc}
            aria-label="Increase quantity"
          >
            <IconPlus className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Line total */}
      <div className="text-right">
        <p className="font-semibold">₹{subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2)}</p>
      </div>

      {/* Remove */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground"
        onClick={onRemove}
        aria-label={`Remove ${item.name} from cart`}
      >
        <IconX className="size-4" />
      </Button>
    </div>
  )
}

function SummaryRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: valueColor ?? 'var(--color-fm-ink)' }}>
        {value}
      </span>
    </div>
  )
}
