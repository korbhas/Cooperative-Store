'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { MapPin, Tag, ChevronRight, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, RAZORPAY_CURRENCY, RAZORPAY_THEME_COLOR } from '@/lib/config'

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

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', pincode: '' })
  const [pincodeState, setPincodeState] = useState({ status: null, areaName: '' })

  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [coupon, setCoupon] = useState(null)

  const items = useCartStore((s) => s.items)
  const totalAmount = useCartStore((s) => s.totalAmount)
  const clearCart = useCartStore((s) => s.clearCart)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: f.name || user.fullName || user.firstName || '' }))
    }
  }, [user])

  const checkPincode = useCallback(async (pin) => {
    if (!/^\d{6}$/.test(pin)) { setPincodeState({ status: null, areaName: '' }); return }
    setPincodeState({ status: 'checking', areaName: '' })
    try {
      const res = await fetch(`/api/delivery/check?pincode=${pin}`)
      const data = await res.json()
      setPincodeState(data.available
        ? { status: 'valid', areaName: data.areaName }
        : { status: 'invalid', areaName: '' }
      )
    } catch {
      setPincodeState({ status: 'invalid', areaName: '' })
    }
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (name === 'pincode') checkPincode(value)
  }

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

  async function handlePlaceOrder() {
    const { name, phone, address, city, pincode } = form
    if (!name || !phone || !address || !pincode) {
      toast.error('Please fill in all delivery details')
      return
    }
    if (pincodeState.status !== 'valid') {
      toast.error('Delivery not available at this pincode')
      return
    }

    setSubmitting(true)
    const addressStr = [address, city, pincodeState.areaName, pincode].filter(Boolean).join(', ')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress: addressStr,
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
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

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
              router.push(`/orders/${data.orderId}`)
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
        <ShoppingBag size={48} color="var(--color-fm-ink3)" />
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
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
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

          {/* Left — delivery + coupon */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

            <Card title="Delivery Details" icon={<MapPin size={14} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full Name" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" />
                  <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="9876543210" type="tel" />
                </div>
                <Field label="Address" name="address" value={form.address} onChange={handleChange} placeholder="House no, Street, Locality" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" />
                  <div>
                    <Field label="Pincode" name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" maxLength={6} />
                    <PincodeHint state={pincodeState} />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Coupon Code" icon={<Tag size={14} />}>
              {coupon ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--color-fm-green-soft)',
                  border: '1.5px dashed var(--color-fm-green-ink)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={15} color="var(--color-fm-green-ink)" />
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-fm-green-ink)', letterSpacing: 1 }}>
                        {coupon.code}
                      </div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-green-ink)', marginTop: 1 }}>
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                        {coupon.description ? ` · ${coupon.description}` : ''}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setCoupon(null); setCouponInput('') }} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)',
                  }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    placeholder="ENTER CODE"
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 7, outline: 'none',
                      border: '1.5px solid var(--color-fm-line-soft)',
                      fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 1.5,
                      background: '#fff', color: 'var(--color-fm-ink)',
                    }}
                  />
                  <button onClick={applyCoupon} disabled={couponLoading} style={{
                    padding: '9px 18px', borderRadius: 7, border: 'none', flexShrink: 0,
                    background: 'var(--color-fm-accent)', color: '#fff',
                    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                    cursor: couponLoading ? 'default' : 'pointer',
                  }}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </Card>
          </div>

          {/* Right — order summary */}
          <div style={{ width: '100%', maxWidth: 320 }} className="md:w-80 md:flex-none">
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
                onClick={handlePlaceOrder}
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
                {submitting ? 'Processing…' : <> Pay ₹{total.toFixed(2)} <ChevronRight size={15} /></>}
              </button>

              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)',
                textAlign: 'center', marginTop: 10,
              }}>
                🔒 Secured by Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ title, icon, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12,
      border: '1.5px solid var(--color-fm-line-soft)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 16px',
        borderBottom: '1px solid var(--color-fm-line-soft)',
        fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
        color: 'var(--color-fm-ink)',
      }}>
        <span style={{ color: 'var(--color-fm-green)' }}>{icon}</span>
        {title}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = 'text', maxLength }) {
  return (
    <div>
      <label style={{
        display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11,
        fontWeight: 600, color: 'var(--color-fm-ink3)',
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
      }}>
        {label}
      </label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        maxLength={maxLength}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 7, outline: 'none',
          border: '1.5px solid var(--color-fm-line-soft)',
          fontFamily: 'var(--font-sans)', fontSize: 13, background: '#fff',
          color: 'var(--color-fm-ink)',
        }}
      />
    </div>
  )
}

function PincodeHint({ state }) {
  if (!state.status || state.status === 'checking') {
    return (
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)', marginTop: 4, minHeight: 16 }}>
        {state.status === 'checking' ? 'Checking availability…' : ''}
      </div>
    )
  }
  if (state.status === 'valid') {
    return (
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-green-ink)', marginTop: 4 }}>
        ✓ Delivery available · {state.areaName}
      </div>
    )
  }
  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#dc2626', marginTop: 4 }}>
      ✗ We don't deliver here yet
    </div>
  )
}

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
