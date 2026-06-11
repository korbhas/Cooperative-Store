'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'
import { RAZORPAY_CURRENCY, RAZORPAY_THEME_COLOR } from '@/lib/config'

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

// Shared order placement: create order, open Razorpay, verify, redirect.
// onExit fires right before the Razorpay modal opens or before redirecting,
// so containers like the cart drawer can close themselves.
export function usePlaceOrder({ onExit } = {}) {
  const router = useRouter()
  const { user } = useUser()
  const [submitting, setSubmitting] = useState(false)

  function finishOrder() {
    useCartStore.getState().clearCart()
    useCheckoutStore.getState().clear()
  }

  async function placeOrder({ items, address, coupon, discount, total }) {
    const { name, phone, address: deliveryAddress } = address
    setSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress,
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
        finishOrder()
        onExit?.()
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
              finishOrder()
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
      onExit?.()
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
      setSubmitting(false)
    }
  }

  return { placeOrder, submitting }
}
