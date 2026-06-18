'use client'

import Link from 'next/link'
import Image from 'next/image'
import { IconPlus, IconMinus } from '@tabler/icons-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useShallow } from 'zustand/react/shallow'
import { useCartStore } from '@/store/cart'

const CARD_COLORS = [
  '#e6efe6', '#fef3e2', '#e8effe', '#fce7f3',
  '#f0fdf4', '#fef9c3', '#f5f3ff', '#fff0eb',
]

export default function ProductCard({ product }) {
  const { addToCart, updateQuantity, removeItem } = useCartStore(
    useShallow((s) => ({ addToCart: s.addToCart, updateQuantity: s.updateQuantity, removeItem: s.removeItem }))
  )
  const cartItem = useCartStore((s) => s.items.find((i) => i.productId === product.id && !i.variantId))
  const qty = cartItem?.quantity ?? 0
  const outOfStock = product.stockQty === 0
  const price = product.price
  const bgColor = CARD_COLORS[product.id % CARD_COLORS.length]

  function handleAdd() {
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

  function handleInc() {
    if (cartItem) updateQuantity(cartItem.id, qty + 1)
  }

  function handleDec() {
    if (!cartItem) return
    if (qty <= 1) removeItem(cartItem.id)
    else updateQuantity(cartItem.id, qty - 1)
  }

  return (
    <Card size="sm" className="group h-full gap-0 overflow-hidden py-0">
      {/* Image */}
      <div className="relative">
        <Link href={`/products/${product.id}`} className="block">
          <div
            className="relative aspect-square overflow-hidden rounded-t-[var(--radius)]"
            style={{ background: product.imageUrl ? 'var(--muted)' : `var(--product-tint, ${bgColor})` }}
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 192px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-4xl">🛒</span>
            )}
          </div>
        </Link>

        {/* Out of stock */}
        {outOfStock && (
          <Badge className="absolute bottom-2 left-2 border-transparent bg-foreground/70 text-background">
            Out of stock
          </Badge>
        )}
      </div>

      {/* Info */}
      <CardContent className="flex flex-1 flex-col gap-0.5 px-2 pt-2 pb-0">
        {product.category && (
          <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            {product.category.name}
          </span>
        )}

        <Link
          href={`/products/${product.id}`}
          className="line-clamp-2 text-[13px] leading-snug font-semibold hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-auto flex items-baseline gap-1 pt-1">
          <span className="font-heading text-base font-bold">
            ₹{price % 1 === 0 ? price : price.toFixed(2)}
          </span>
          <span className="text-[11px] text-muted-foreground">/{product.unit}</span>
        </div>
      </CardContent>

      <Separator className="mt-2" />

      {/* Action */}
      <div className="p-2">
        {qty === 0 ? (
          <Button
            size="sm"
            className="w-full"
            disabled={outOfStock}
            onClick={handleAdd}
          >
            <IconPlus className="size-4" /> Add to cart
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-1 rounded-lg bg-secondary p-1">
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={handleDec}
              aria-label="Decrease quantity"
              className="bg-card text-secondary-foreground hover:bg-card"
            >
              <IconMinus className="size-4" />
            </Button>
            <span className="text-sm font-bold tabular-nums text-secondary-foreground">{qty}</span>
            <Button
              size="icon-sm"
              onClick={handleInc}
              aria-label="Increase quantity"
            >
              <IconPlus className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
