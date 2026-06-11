'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from '@tanstack/react-form'
import toast from 'react-hot-toast'
import PageLoader from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field, FieldDescription, FieldGroup, FieldLabel, FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  InputGroup, InputGroupAddon, InputGroupInput, InputGroupText,
} from '@/components/ui/input-group'

const SECTIONS = [
  {
    key: 'store',
    title: 'Store Info',
    description: 'Basic details shown to customers',
    fields: [
      { key: 'store_name',    label: 'Store Name',    type: 'text',     placeholder: 'FreshMart' },
      { key: 'store_phone',   label: 'Phone Number',  type: 'text',     placeholder: '+91 98765 43210' },
      { key: 'store_email',   label: 'Email Address', type: 'text',     placeholder: 'hello@freshmart.in' },
      { key: 'store_address', label: 'Store Address', type: 'textarea', placeholder: '123 Market Street, Bengaluru' },
    ],
  },
  {
    key: 'delivery',
    title: 'Delivery',
    description: 'Fees and thresholds applied at checkout',
    fields: [
      { key: 'delivery_fee',              label: 'Delivery Fee',              type: 'number', placeholder: '40',  prefix: '₹', hint: 'Charged when order is below the free delivery threshold' },
      { key: 'free_delivery_threshold',   label: 'Free Delivery Above',       type: 'number', placeholder: '499', prefix: '₹', hint: 'Orders at or above this amount get free delivery' },
      { key: 'min_order_amount',          label: 'Minimum Order Amount',      type: 'number', placeholder: '0',   prefix: '₹', hint: 'Leave 0 to allow any order size' },
      { key: 'estimated_delivery_time',   label: 'Estimated Delivery Time',   type: 'text',   placeholder: '30–45 mins', hint: 'Shown on the order confirmation page' },
    ],
  },
  {
    key: 'inventory',
    title: 'Inventory',
    description: 'Thresholds for alerts and display',
    fields: [
      { key: 'low_stock_threshold', label: 'Low Stock Alert Below', type: 'number', placeholder: '10', hint: 'Products below this quantity are flagged in the admin' },
    ],
  },
]

function SettingInput({ field, def }) {
  const { key, type, placeholder, prefix } = def
  const value = field.state.value ?? ''

  if (type === 'textarea') {
    return (
      <Textarea
        id={`setting-${key}`}
        name={field.name}
        rows={3}
        className="resize-y"
        value={value}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  }

  if (prefix) {
    return (
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={`setting-${key}`}
          name={field.name}
          type={type}
          value={value}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder={placeholder}
        />
      </InputGroup>
    )
  }

  return (
    <Input
      id={`setting-${key}`}
      name={field.name}
      type={type}
      value={value}
      onChange={(e) => field.handleChange(e.target.value)}
      placeholder={placeholder}
    />
  )
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const savedRef = useRef({})

  const form = useForm({
    defaultValues: {},
    onSubmit: async ({ value }) => save(value),
  })

  const values = form.useStore((s) => s.values)
  const isDirty = JSON.stringify(values) !== JSON.stringify(savedRef.current)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        savedRef.current = data
        form.reset(data)
        setLoading(false)
      })
  }, [form])

  async function save(value) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      })
      if (!res.ok) throw new Error()
      savedRef.current = { ...value }
      form.reset(value)
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[22px] font-bold">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Global store configuration</p>
        </div>
        {!loading && (
          <Button
            type="submit"
            form="settings-form"
            disabled={saving || !isDirty}
            className="shrink-0"
          >
            {saving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent>
            <PageLoader label="Loading settings…" className="py-0" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <form
              id="settings-form"
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup className="gap-5">
                {SECTIONS.map((section, si) => (
                  <div key={section.key} className="flex flex-col gap-5">
                    {si > 0 && <FieldSeparator className="[&_[data-slot=field-separator-content]]:bg-card" />}
                    <div>
                      <h2 className="text-sm font-semibold">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    {section.fields.map((def) => (
                      <form.Field key={def.key} name={def.key}>
                        {(field) => (
                          <Field>
                            <FieldLabel htmlFor={`setting-${def.key}`}>{def.label}</FieldLabel>
                            <SettingInput field={field} def={def} />
                            {def.hint && <FieldDescription>{def.hint}</FieldDescription>}
                          </Field>
                        )}
                      </form.Field>
                    ))}
                  </div>
                ))}
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
