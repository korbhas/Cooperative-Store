'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cart'

const DELIVERY_FEE = 40
const FREE_DELIVERY_THRESHOLD = 499

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
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-fm-green)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
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
          <ShoppingCart size={36} color="var(--color-fm-green)" />
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
          Browse Products <ArrowRight size={15} />
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
            <Trash2 size={13} /> Clear all
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
          <div style={{ width: '100%', maxWidth: 320 }} className="md:w-80 md:flex-none">
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
                    <Tag size={11} />
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

              <Link href="/checkout" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 20, padding: '12px', borderRadius: 8,
                background: 'var(--color-fm-green)', color: '#fff',
                fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                textDecoration: 'none',
              }}>
                Proceed to Checkout <ArrowRight size={15} />
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
    <div style={{
      display: 'flex', gap: 12, padding: '14px',
      background: '#fff', borderRadius: 10,
      border: '1.5px solid var(--color-fm-line-soft)',
      alignItems: 'center',
    }}>
      {/* Image */}
      <div style={{
        width: 60, height: 60, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        background: item.imageUrl ? 'var(--color-fm-paper)' : 'var(--color-fm-green-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 24 }}>🛒</span>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
          color: 'var(--color-fm-ink)', lineHeight: 1.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.name}
        </div>
        {item.variantName && (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
            {item.variantName}
          </div>
        )}
        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', marginTop: 2 }}>
          ₹{item.price} / {item.unit}
        </div>
      </div>

      {/* Qty stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button onClick={onDec} style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--color-fm-green-soft)',
          border: '1.5px solid var(--color-fm-green-ink)',
          color: 'var(--color-fm-green-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }}>
          <Minus size={12} />
        </button>
        <span style={{
          fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700,
          color: 'var(--color-fm-ink)', minWidth: 24, textAlign: 'center',
        }}>
          {item.quantity}
        </span>
        <button onClick={onInc} style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'var(--color-fm-green)', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }}>
          <Plus size={12} />
        </button>
      </div>

      {/* Subtotal + remove */}
      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
          ₹{subtotal % 1 === 0 ? subtotal : subtotal.toFixed(2)}
        </div>
        <button onClick={onRemove} style={{
          background: 'none', border: 'none', padding: 0,
          color: 'var(--color-fm-ink3)', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}>
          <Trash2 size={13} />
        </button>
      </div>
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
