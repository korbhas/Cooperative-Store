'use client'

import { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { useUser } from '@clerk/nextjs'
import { useCheckoutStore } from '@/store/checkout'
import {
  Field, FieldDescription, FieldError, FieldGroup, FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

const addressSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.'),
  phone: z.string().trim().regex(/^[0-9]{10}$/, 'Enter a valid 10-digit phone number.'),
  address: z.string().trim().min(10, 'Enter your complete delivery address.'),
})

// Delivery details form. Saves to the checkout store on submit, then calls
// onSubmitted. Submit via an external button with form={formId}.
export default function AddressForm({ formId = 'address-form', onSubmitted }) {
  const { user } = useUser()
  const setAddress = useCheckoutStore((s) => s.setAddress)

  const form = useForm({
    defaultValues: { name: '', phone: '', address: '' },
    validators: { onSubmit: addressSchema },
    onSubmit: async ({ value }) => {
      setAddress(value)
      onSubmitted?.(value)
    },
  })

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

  return (
    <form
      id={formId}
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
                  <FieldLabel htmlFor={`${formId}-name`}>Full Name</FieldLabel>
                  <Input
                    id={`${formId}-name`}
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
                  <FieldLabel htmlFor={`${formId}-phone`}>Phone</FieldLabel>
                  <Input
                    id={`${formId}-phone`}
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
                <FieldLabel htmlFor={`${formId}-address`}>Address</FieldLabel>
                <Input
                  id={`${formId}-address`}
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
  )
}
