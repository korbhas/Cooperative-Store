'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconMinus, IconPlus, IconShoppingCart, IconTag, IconX } from '@tabler/icons-react'
import { useCartStore } from '@/store/cart'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/config'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

// Right-side cart drawer. Wrap the trigger element: <CartDrawer><button>…</button></CartDrawer>
export default function CartDrawer({ children }) {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const count = useCartStore((s) => s.totalItems())
  const subtotal = useCartStore((s) => s.totalAmount())

  useEffect(() => { setMounted(true) }, [])

  const cartItems = mounted ? items : []
  const itemCount = mounted ? count : 0
  const delivery = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const total = subtotal + delivery

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Shopping Cart</DrawerTitle>
          <DrawerDescription>
            {itemCount === 0
              ? 'Your cart is empty'
              : `${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`}
          </DrawerDescription>
        </DrawerHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
            <div
              className="flex size-20 items-center justify-center rounded-full"
              style={{ background: 'var(--color-fm-green-soft)' }}
            >
              <IconShoppingCart size={36} color="var(--color-fm-green)" />
            </div>
            <p className="text-sm text-muted-foreground">Add items from the store to get started</p>
            <DrawerClose asChild>
              <Link
                href="/products"
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white"
                style={{ background: 'var(--color-fm-green)' }}
              >
                Browse Products
              </Link>
            </DrawerClose>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b pb-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
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
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="truncate text-sm font-medium">{item.name}</h4>
                        <Button
                          className="h-6 w-6 shrink-0 text-muted-foreground"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <IconX className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.variantName ? `${item.variantName} · ` : ''}₹{item.price} / {item.unit}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="size-6"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            <IconMinus className="size-3" />
                          </Button>
                          <span className="min-w-5 text-center text-sm font-medium tabular-nums">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            className="size-6"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <IconPlus className="size-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery</span>
                  <span style={delivery === 0 ? { color: 'var(--color-fm-green-ink)' } : undefined}>
                    {delivery === 0 ? 'Free' : `₹${delivery}`}
                  </span>
                </div>
                {subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD && (
                  <div
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs"
                    style={{ background: 'var(--color-fm-accent-soft)', color: 'var(--color-fm-accent)' }}
                  >
                    <IconTag size={12} />
                    Add ₹{(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(0)} more for free delivery
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Link
                  href="/checkout/address"
                  className="flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ background: 'var(--color-fm-green)' }}
                >
                  Checkout
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link
                  href="/cart"
                  className="flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  View Full Cart
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Button variant="ghost" className="text-muted-foreground">
                  Continue Shopping
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
