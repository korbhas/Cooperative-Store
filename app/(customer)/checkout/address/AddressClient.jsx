'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { IconMapPin, IconChevronRight } from '@tabler/icons-react'
import { useUser } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { useCheckoutStore } from '@/store/checkout'
import CartEmptyState from '../CartEmptyState'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Field, FieldDescription, FieldError, FieldGroup, FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const addressSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number.'),
  address: z.string().trim().min(10, 'Enter your complete delivery address.'),
})

export default function AddressClient() {
  const router = useRouter()
  const { user } = useUser()
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)
  const setAddress = useCheckoutStore((s) => s.setAddress)

  const form = useForm({
    defaultValues: { name: '', phone: '', address: '' },
    validators: { onSubmit: addressSchema },
    onSubmit: async ({ value }) => {
      setAddress(value)
      router.push('/checkout/payment')
    },
  })

  useEffect(() => { setMounted(true) }, [])

  // Returning to edit — restore the saved address
  useEffect(() => {
    const saved = useCheckoutStore.getState().address
    if (saved) form.reset(saved)
  }, [form])

  useEffect(() => {
    if (user && !form.state.values.name) {
      form.setFieldValue('name', user.fullName || user.firstName || '')
    }
  }, [user, form])

  if (!mounted) return null

  if (items.length === 0) return <CartEmptyState />

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMapPin className="size-4 text-primary" /> Delivery Details
        </CardTitle>
        <CardDescription>Tell us where to deliver your order.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="address-form"
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
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="address-form" size="lg" className="w-full">
          Continue to Payment <IconChevronRight className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
