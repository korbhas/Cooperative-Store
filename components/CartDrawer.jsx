'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  IconMinus, IconPlus, IconShoppingCart, IconTag, IconX, IconPencil, IconMapPin,
} from '@tabler/icons-react'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'
import { usePlaceOrder } from '@/hooks/use-place-order'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '@/lib/config'
import AddressForm from '@/components/checkout/AddressForm'
import CouponField from '@/components/checkout/CouponField'
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

const STEP_COPY = {
  cart: { title: 'Shopping Cart' },
  address: { title: 'Delivery Details', description: 'Tell us where to deliver your order.' },
  payment: { title: 'Payment', description: 'Review your order and pay securely.' },
}

// Right-side cart drawer with in-drawer checkout (cart → address → payment).
// Wrap the trigger element: <CartDrawer><button>…</button></CartDrawer>
export default function CartDrawer({ children }) {
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('cart')

  const items = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const count = useCartStore((s) => s.totalItems())
  const subtotal = useCartStore((s) => s.totalAmount())

  const address = useCheckoutStore((s) => s.address)
  const coupon = useCheckoutStore((s) => s.coupon)

  const { placeOrder, submitting } = usePlaceOrder({ onExit: () => setOpen(false) })

  useEffect(() => { setMounted(true) }, [])

  const cartItems = mounted ? items : []
  const itemCount = mounted ? count : 0

  const delivery = subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  let discount = 0
  if (coupon) {
    discount = coupon.discountType === 'percentage'
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue
    discount = Math.min(discount, subtotal)
  }
  const total = subtotal + delivery - (step === 'payment' ? discount : 0)

  function handleOpenChange(next) {
    setOpen(next)
    if (!next) setStep('cart')
  }

  function startCheckout() {
    if (!isSignedIn) {
      setOpen(false)
      router.push('/login?returnTo=/checkout/address')
      return
    }
    setStep('address')
  }

  const copy = STEP_COPY[step]

  return (
    <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{copy.title}</DrawerTitle>
          <DrawerDescription>
            {copy.description ??
              (itemCount === 0
                ? 'Your cart is empty'
                : `${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart`)}
          </DrawerDescription>
        </DrawerHeader>

        {step === 'cart' && (
          cartItems.length === 0 ? (
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
                    <CartLine
                      key={item.id}
                      item={item}
                      onInc={() => updateQuantity(item.id, item.quantity + 1)}
                      onDec={() => updateQuantity(item.id, item.quantity - 1)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <SummaryRows
                    subtotal={subtotal}
                    delivery={delivery}
                    total={subtotal + delivery}
                  />
                </div>
              </div>

              <DrawerFooter>
                <Button
                  className="w-full py-2.5 text-sm font-semibold"
                  onClick={startCheckout}
                >
                  Checkout
                </Button>
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
          )
        )}

        {step === 'address' && (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <AddressForm
                formId="drawer-address-form"
                onSubmitted={() => setStep('payment')}
              />
            </div>
            <DrawerFooter>
              <Button type="submit" form="drawer-address-form" className="w-full">
                Continue to Payment
              </Button>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setStep('cart')}
              >
                Back to Cart
              </Button>
            </DrawerFooter>
          </>
        )}

        {step === 'payment' && address && (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {/* Address summary */}
              <div className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <IconMapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">{address.name}</p>
                      <p className="text-xs text-muted-foreground">{address.phone}</p>
                      <p className="mt-1 text-sm">{address.address}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-secondary-foreground"
                    onClick={() => setStep('address')}
                  >
                    <IconPencil className="size-3.5" /> Edit
                  </Button>
                </div>
              </div>

              <CouponField subtotal={subtotal} inputId="drawer-coupon-code" />

              {/* Items recap */}
              <div className="space-y-2 border-t pt-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} × ₹{item.price}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-3">
                <SummaryRows
                  subtotal={subtotal}
                  delivery={delivery}
                  discount={discount}
                  couponCode={coupon?.code}
                  total={total}
                />
              </div>
            </div>

            <DrawerFooter>
              <Button
                className="w-full"
                disabled={submitting}
                onClick={() => placeOrder({ items: cartItems, address, coupon, discount, total })}
              >
                {submitting ? 'Processing…' : `Pay ₹${total.toFixed(2)}`}
              </Button>
              <p className="text-center text-[10px] text-muted-foreground">Secured by Razorpay</p>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setStep('cart')}
              >
                Back to Cart
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CartLine({ item, onInc, onDec, onRemove }) {
  return (
    <div className="flex gap-4 border-b pb-4">
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
            onClick={onRemove}
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
              onClick={onDec}
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
              onClick={onInc}
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
  )
}

function SummaryRows({ subtotal, delivery, discount = 0, couponCode, total }) {
  return (
    <>
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
      {discount > 0 && (
        <div className="flex justify-between text-sm" style={{ color: 'var(--color-fm-green-ink)' }}>
          <span>Coupon{couponCode ? ` (${couponCode})` : ''}</span>
          <span>−₹{discount.toFixed(2)}</span>
        </div>
      )}
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
    </>
  )
}
