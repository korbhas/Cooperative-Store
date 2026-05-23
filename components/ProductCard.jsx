'use client'

import Link from 'next/link'
import { Heart, Plus, Minus } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'

const CARD_COLORS = [
  '#e6efe6', '#fef3e2', '#e8effe', '#fce7f3',
  '#f0fdf4', '#fef9c3', '#f5f3ff', '#fff0eb',
]

export default function ProductCard({ product }) {
  const addToCart = useCartStore((s) => s.addToCart)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const toggle = useWishlistStore((s) => s.toggle)
  const wishlisted = useWishlistStore((s) => s.isWishlisted(product.id))

  const cartItem = items.find((i) => i.productId === product.id && !i.variantId)
  const qty = cartItem?.quantity ?? 0
  const outOfStock = product.stockQty === 0
  const price = product.price
  const bgColor = CARD_COLORS[product.id % CARD_COLORS.length]

  function handleAdd(e) {
    e.preventDefault()
    if (outOfStock) return
    addToCart({
      productId: product.id,
      variantId: null,
      name: product.name,
      price,
      unit: product.unit,
      imageUrl: product.imageUrl,
      stockQty: product.stockQty,
    })
  }

  function handleInc(e) {
    e.preventDefault()
    if (cartItem) updateQuantity(cartItem.id, qty + 1)
  }

  function handleDec(e) {
    e.preventDefault()
    if (!cartItem) return
    if (qty <= 1) removeItem(cartItem.id)
    else updateQuantity(cartItem.id, qty - 1)
  }

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden',
      border: '1.5px solid var(--color-fm-line-soft)',
      background: '#fff', display: 'flex', flexDirection: 'column',
    }}>
      {/* Image */}
      <div style={{ position: 'relative' }}>
        <Link href={`/products/${product.id}`} style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{
            aspectRatio: '1 / 1', overflow: 'hidden',
            background: product.imageUrl ? 'var(--color-fm-paper)' : bgColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 34 }}>🛒</span>
            )}
          </div>
        </Link>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); toggle(product.id) }}
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Heart
            size={13}
            fill={wishlisted ? 'var(--color-fm-accent)' : 'none'}
            color={wishlisted ? 'var(--color-fm-accent)' : 'var(--color-fm-ink3)'}
          />
        </button>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.48)', color: '#fff',
            fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600,
            textAlign: 'center', padding: '4px 0', letterSpacing: 0.3,
          }}>
            Out of Stock
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {product.category && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--color-fm-ink3)', letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>
            {product.category.name}
          </div>
        )}

        <Link href={`/products/${product.id}`} style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
          color: 'var(--color-fm-ink)', textDecoration: 'none', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          flex: 1,
        }}>
          {product.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          {/* Price */}
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)', fontSize: 15,
              fontWeight: 700, color: 'var(--color-fm-ink)',
            }}>
              ₹{price % 1 === 0 ? price : price.toFixed(2)}
            </div>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)' }}>
              /{product.unit}
            </div>
          </div>

          {/* Cart control */}
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: outOfStock ? 'var(--color-fm-line-soft)' : 'var(--color-fm-green)',
                border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: outOfStock ? 'default' : 'pointer', flexShrink: 0,
              }}
            >
              <Plus size={16} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={handleDec} style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'var(--color-fm-green-soft)',
                border: '1.5px solid var(--color-fm-green-ink)',
                color: 'var(--color-fm-green-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}>
                <Minus size={12} />
              </button>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700,
                color: 'var(--color-fm-ink)', minWidth: 20, textAlign: 'center',
              }}>
                {qty}
              </span>
              <button onClick={handleInc} style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'var(--color-fm-green)', border: 'none', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}>
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
