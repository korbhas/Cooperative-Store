'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { IconCircleCheck } from '@tabler/icons-react'
import { useCheckoutStore } from '@/store/checkout'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput,
} from '@/components/ui/input-group'

// Coupon apply/remove block bound to the checkout store.
export default function CouponField({ subtotal, inputId = 'coupon-code' }) {
  const [couponInput, setCouponInput] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const coupon = useCheckoutStore((s) => s.coupon)
  const setCoupon = useCheckoutStore((s) => s.setCoupon)

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

  if (coupon) {
    return (
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
    )
  }

  return (
    <Field>
      <FieldLabel htmlFor={inputId}>Coupon Code</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={inputId}
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
  )
}
