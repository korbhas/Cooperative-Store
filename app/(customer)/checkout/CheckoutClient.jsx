'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { IconMapPin, IconChevronRight, IconShoppingBag, IconCircleCheck } from '@tabler/icons-react'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { RAZORPAY_CURRENCY, RAZORPAY_THEME_COLOR } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
} from '@/components/ui/input-group'

const checkoutSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number.'),
  address: z.string().trim().min(10, 'Enter your complete delivery address.'),
})

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(window.Razorpay)
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = () => resolve(window.Razorpay)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
}

export default function CheckoutClient({ deliveryFee: deliveryFeeConfig, freeDeliveryThreshold }) {
  const router = useRouter()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [coupon, setCoupon] = useState(null)

  const items = useCartStore((s) => s.items)
  const totalAmount = useCartStore((s) => s.totalAmount)
  const clearCart = useCartStore((s) => s.clearCart)

  const form = useForm({
    defaultValues: { name: '', phone: '', address: '' },
    validators: { onSubmit: checkoutSchema },
    onSubmit: async ({ value }) => placeOrder(value),
  })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (user && !form.state.values.name) {
      form.setFieldValue('name', user.fullName || user.firstName || '')
    }
  }, [user, form])

  async function applyCoupon() {
    if (!couponInput.trim()) return
    setCouponLoading(true)
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponInput.trim())}&amount=${subtotal}`)
      const data = await res.json()
      if (data.valid) {
        setCoupon(data.coupon)
        toast.success('Coupon applied!')
      } else {
        toast.error(data.error || 'Invalid coupon')
        setCoupon(null)
      }
    } catch {
      toast.error('Failed to validate coupon')
    } finally {
      setCouponLoading(false)
    }
  }

  async function placeOrder({ name, phone, address }) {
    setSubmitting(true)
    const addressStr = address

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: addressStr,
          phone,
          couponId: coupon?.id ?? null,
          discountAmount: discount,
          totalAmount: total,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId ?? null,
            variantName: i.variantName ?? null,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        // Server found cart items whose products no longer exist — prune them
        if (data.missingProductIds?.length) {
          const removeItem = useCartStore.getState().removeItem
          items
            .filter((i) => data.missingProductIds.includes(i.productId))
            .forEach((i) => removeItem(i.id))
        }
        throw new Error(data.error || 'Failed to create order')
      }

      if (!data.razorpayOrderId) {
        clearCart()
        router.push(`/orders/${data.orderId}`)
        return
      }

      const RazorpayClass = await loadRazorpayScript()
      if (!RazorpayClass) {
        toast.error('Payment gateway failed to load')
        setSubmitting(false)
        return
      }

      const rzp = new RazorpayClass({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(total * 100),
        currency: RAZORPAY_CURRENCY,
        name: 'FreshMart',
        description: `Order #${data.orderId}`,
        order_id: data.razorpayOrderId,
        prefill: { name, contact: phone, email: user?.primaryEmailAddress?.emailAddress || '' },
        theme: { color: RAZORPAY_THEME_COLOR },
        handler: async (response) => {
          try {
            const vRes = await fetch('/api/orders/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            if (vRes.ok) {
              clearCart()
              router.push(`/orders/${data.orderId}?paid=1`)
            } else {
              toast.error('Payment verification failed. Contact support.')
            }
          } catch {
            toast.error('Verification error. Contact support.')
          }
        },
        modal: { ondismiss: () => setSubmitting(false) },
      })
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <IconShoppingBag size={48} color="var(--color-fm-ink3)" />
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
          Your cart is empty
        </div>
        <Link href="/products" style={{
          padding: '10px 24px', borderRadius: 8,
          background: 'var(--color-fm-green)', color: '#fff',
          fontFamily: 'var(--font-sans)', fontSize: 14, textDecoration: 'none',
        }}>Browse Products</Link>
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
    <div style={{ flex: 1, background: 'var(--color-fm-paper)' }}>
      <div className="pb-20 md:pb-8" style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-fm-ink)', marginBottom: 20 }}>
          Checkout
        </div>

        <div className="flex flex-col md:flex-row gap-5">

          {/* Left — delivery + coupon, one block */}
          <Card className="min-w-0 flex-1 md:self-start">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="size-4 text-primary" /> Delivery Details
              </CardTitle>
              <CardDescription>
                Tell us where to deliver your order.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                id="checkout-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
              >
                <FieldGroup>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <form.Field name="name">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="John Doe"
                              autoComplete="name"
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                    <form.Field name="phone">
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                            <Input
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="9876543210"
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              autoComplete="tel-national"
                            />
                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <form.Field name="address">
                    {(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Address</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="House no, Street, Locality"
                            autoComplete="street-address"
                          />
                          <FieldDescription>
                            Include house number, street, and locality.
                          </FieldDescription>
                          {isInvalid && <FieldError errors={field.state.meta.errors} />}
                        </Field>
                      )
                    }}
                  </form.Field>

                  <FieldSeparator className="[&_[data-slot=field-separator-content]]:bg-card">
                    Coupon
                  </FieldSeparator>

                  {coupon ? (
                    <div className="flex items-center justify-between rounded-md border border-dashed border-secondary-foreground/60 bg-secondary px-3.5 py-2.5">
                      <div className="flex items-center gap-2 text-secondary-foreground">
                        <IconCircleCheck className="size-4 shrink-0" />
                        <div>
                          <p className="font-mono text-xs font-bold tracking-widest">{coupon.code}</p>
                          <p className="text-xs">
                            {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                            {coupon.description ? ` · ${coupon.description}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => { setCoupon(null); setCouponInput('') }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Field>
                      <FieldLabel htmlFor="coupon-code">Coupon Code</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id="coupon-code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              applyCoupon()
                            }
                          }}
                          placeholder="ENTER CODE"
                          className="font-mono text-sm tracking-widest"
                          autoComplete="off"
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupButton
                            type="button"
                            onClick={applyCoupon}
                            disabled={couponLoading}
                          >
                            {couponLoading ? 'Checking…' : 'Apply'}
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldDescription>Have a promo code? Apply it here.</FieldDescription>
                    </Field>
                  )}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* Right — order summary */}
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

              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%', marginTop: 20, padding: '13px', borderRadius: 8, border: 'none',
                  background: submitting ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)',
                  color: submitting ? 'var(--color-fm-green-ink)' : '#fff',
                  fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
                  cursor: submitting ? 'default' : 'pointer',
                }}
              >
                {submitting ? 'Processing…' : <> Pay ₹{total.toFixed(2)} <IconChevronRight size={15} /></>}
              </button>

              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)',
                textAlign: 'center', marginTop: 10,
              }}>
                Secured by Razorpay
              </div>
            </div>
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
