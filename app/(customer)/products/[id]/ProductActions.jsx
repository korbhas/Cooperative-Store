'use client'

import { useState, useEffect } from 'react'
import { IconPlus, IconMinus, IconShoppingCart } from '@tabler/icons-react'
import { useCartStore } from '@/store/cart'

export default function ProductActions({ product, variants }) {
  const [mounted, setMounted] = useState(false)
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariant?.id ?? null)

  const addToCart = useCartStore((s) => s.addToCart)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  useEffect(() => { setMounted(true) }, [])

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null
  const effectivePrice = selectedVariant ? selectedVariant.price : product.price
  const effectiveStock = selectedVariant ? selectedVariant.stockQty : product.stockQty
  const outOfStock = effectiveStock === 0

  const cartItem = mounted
    ? items.find((i) => i.productId === product.id && i.variantId === (selectedVariantId ?? null))
    : null
  const qty = cartItem?.quantity ?? 0

  function handleAdd() {
    if (outOfStock) return
    addToCart({
      productId: product.id,
      variantId: selectedVariantId,
      variantName: selectedVariant?.name ?? null,
      name: product.name,
      price: effectivePrice,
      unit: product.unit,
      imageUrl: product.imageUrl,
      stockQty: effectiveStock,
    })
  }

  function handleInc() {
    if (cartItem) updateQuantity(cartItem.id, qty + 1)
  }

  function handleDec() {
    if (!cartItem) return
    if (qty <= 1) removeItem(cartItem.id)
    else updateQuantity(cartItem.id, qty - 1)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Variant selector */}
      {variants.length > 0 && (
        <div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Size / Pack
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {variants.map((v) => {
              const selected = v.id === selectedVariantId
              const oos = v.stockQty === 0
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  disabled={oos}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: selected
                      ? '2px solid var(--color-fm-green)'
                      : '1.5px solid var(--color-fm-line-soft)',
                    background: selected ? 'var(--color-fm-green-soft)' : 'var(--color-fm-card)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    color: oos
                      ? 'var(--color-fm-ink3)'
                      : selected
                        ? 'var(--color-fm-green-ink)'
                        : 'var(--color-fm-ink)',
                    cursor: oos ? 'not-allowed' : 'pointer',
                    opacity: oos ? 0.55 : 1,
                    textDecoration: oos ? 'line-through' : 'none',
                    position: 'relative',
                  }}
                >
                  {v.name}
                  {!oos && (
                    <span style={{ display: 'block', fontSize: 10, color: selected ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink3)', marginTop: 1 }}>
                      ₹{v.price % 1 === 0 ? v.price : Number(v.price).toFixed(2)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
          ₹{effectivePrice % 1 === 0 ? effectivePrice : Number(effectivePrice).toFixed(2)}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>
          / {product.unit}
        </span>
      </div>

      {/* Stock status */}
      <div>
        {outOfStock ? (
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'var(--color-fm-danger-soft)', color: 'var(--color-fm-danger)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}>
            Out of Stock
          </span>
        ) : effectiveStock <= 10 ? (
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'var(--color-fm-accent-soft)', color: 'var(--color-fm-accent)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}>
            Only {effectiveStock} left
          </span>
        ) : (
          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, background: 'var(--color-fm-green-soft)', color: 'var(--color-fm-green-ink)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600 }}>
            In Stock
          </span>
        )}
      </div>

      {/* Cart */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {!mounted || qty === 0 ? (
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            style={{
              flex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px 20px',
              borderRadius: 10,
              border: 'none',
              background: outOfStock ? 'var(--color-fm-line-soft)' : 'var(--color-fm-green)',
              color: outOfStock ? 'var(--color-fm-ink3)' : '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600,
              cursor: outOfStock ? 'not-allowed' : 'pointer',
            }}
          >
            <IconShoppingCart size={17} />
            {outOfStock ? 'Out of Stock' : 'Add to Cart'}
          </button>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: 10,
            border: '2px solid var(--color-fm-green)',
            background: 'var(--color-fm-green-soft)',
          }}>
            <button
              onClick={handleDec}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'var(--color-fm-card)', border: '1.5px solid var(--color-fm-green-ink)',
                color: 'var(--color-fm-green-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <IconMinus size={15} />
            </button>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-green-ink)', minWidth: 32, textAlign: 'center' }}>
              {qty}
            </span>
            <button
              onClick={handleInc}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'var(--color-fm-green)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <IconPlus size={15} />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
