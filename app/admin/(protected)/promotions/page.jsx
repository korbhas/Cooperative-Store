'use client'

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { IconPlus, IconPencil, IconTrash } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const couponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required.'),
  description: z.string(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.string().refine((v) => v !== '' && Number(v) > 0, 'Enter a discount value greater than 0.'),
  minOrderAmount: z.string().refine((v) => v === '' || Number(v) >= 0, 'Must be 0 or more.'),
  maxUses: z.string().refine((v) => v === '' || Number(v) >= 1, 'Must be at least 1.'),
  startsAt: z.string(),
  expiresAt: z.string(),
  isActive: z.boolean(),
})

const EMPTY = { code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', startsAt: '', expiresAt: '', isActive: true }

function CouponDialog({ open, onClose, coupon, onSaved }) {
  const isEdit = !!coupon
  const [saving, setSaving] = useState(false)

  const form = useForm({
    defaultValues: EMPTY,
    validators: { onSubmit: couponSchema },
    onSubmit: async ({ value }) => save(value),
  })

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        description: coupon.description ?? '',
        discountType: coupon.discountType,
        discountValue: String(coupon.discountValue),
        minOrderAmount: coupon.minOrderAmount != null ? String(coupon.minOrderAmount) : '',
        maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
        startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
        expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
        isActive: coupon.isActive,
      })
    } else {
      form.reset(EMPTY)
    }
  }, [coupon, open, form])

  async function save(value) {
    setSaving(true)
    const url = isEdit ? `/api/admin/promotions/${coupon.id}` : '/api/admin/promotions'
    const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
    setSaving(false)
    if (res.ok) { toast.success(isEdit ? 'Coupon updated' : 'Coupon created'); onSaved(); onClose() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  function textField(name, label, inputProps = {}) {
    return (
      <form.Field name={name}>
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={`coupon-${name}`}>{label}</FieldLabel>
              <Input
                id={`coupon-${name}`}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(
                  inputProps.uppercase ? e.target.value.toUpperCase() : e.target.value
                )}
                aria-invalid={isInvalid}
                {...Object.fromEntries(Object.entries(inputProps).filter(([k]) => k !== 'uppercase'))}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
        </DialogHeader>

        <form
          id="coupon-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            {textField('code', 'Code', { placeholder: 'SAVE20', uppercase: true, autoComplete: 'off', className: 'font-mono uppercase tracking-widest' })}
            {textField('description', 'Description', { placeholder: 'Optional description', autoComplete: 'off' })}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="discountType">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="coupon-discountType">Discount Type</FieldLabel>
                    <Select name={field.name} value={field.state.value} onValueChange={field.handleChange}>
                      <SelectTrigger id="coupon-discountType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>
              {textField('discountValue', 'Discount Value', { type: 'number', min: '0', step: '0.01', placeholder: '20' })}
              {textField('minOrderAmount', 'Min Order (₹)', { type: 'number', min: '0', placeholder: '0' })}
              {textField('maxUses', 'Max Uses', { type: 'number', min: '1', placeholder: 'Unlimited' })}
              {textField('startsAt', 'Starts At', { type: 'datetime-local' })}
              {textField('expiresAt', 'Expires At', { type: 'datetime-local' })}
            </div>

            <form.Field name="isActive">
              {(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="coupon-active"
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                  <FieldLabel htmlFor="coupon-active" className="font-normal">
                    Active
                  </FieldLabel>
                </Field>
              )}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="coupon-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PromotionsPage() {
  const [coupons, setCoupons] = useState([])
  const [filter, setFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCoupon, setEditCoupon] = useState(null)

  const fetch_ = () => fetch('/api/admin/promotions').then(r => r.json()).then(setCoupons)
  useEffect(() => { fetch_() }, [])

  async function handleDelete(id, code) {
    if (!confirm(`Delete coupon "${code}"?`)) return
    const res = await fetch(`/api/admin/promotions/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Coupon deleted'); fetch_() }
    else toast.error('Failed')
  }

  const now = new Date()
  const visible = coupons.filter(c => {
    if (filter === 'active') return c.isActive && (!c.expiresAt || new Date(c.expiresAt) > now)
    if (filter === 'inactive') return !c.isActive || (c.expiresAt && new Date(c.expiresAt) <= now)
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Promotions</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>{coupons.length} coupons</p>
        </div>
        <button onClick={() => { setEditCoupon(null); setDialogOpen(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <IconPlus size={15} /> Add Coupon
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {['all', 'active', 'inactive'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: filter === f ? 600 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', background: filter === f ? 'var(--color-fm-green)' : '#fff', color: filter === f ? '#fff' : 'var(--color-fm-ink2)', border: '1.5px solid', borderColor: filter === f ? 'var(--color-fm-green)' : 'var(--color-fm-line-soft)' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Code', 'Description', 'Discount', 'Min Order', 'Usage', 'Expires', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No coupons</td></tr>
            ) : visible.map((c, i) => {
              const expired = c.expiresAt && new Date(c.expiresAt) <= now
              const isActive = c.isActive && !expired
              return (
                <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 700 }}>{c.code}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', maxWidth: 160 }}><div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</div></td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>{c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : '—'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{c.usedCount}/{c.maxUses ?? '∞'}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: expired ? '#dc2626' : 'var(--color-fm-ink3)', whiteSpace: 'nowrap' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#166534' : '#991b1b' }}>{isActive ? 'Active' : expired ? 'Expired' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditCoupon(c); setDialogOpen(true) }} aria-label={`Edit coupon ${c.code}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex', padding: 4 }}><IconPencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id, c.code)} aria-label={`Delete coupon ${c.code}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 4 }}><IconTrash size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <CouponDialog open={dialogOpen} onClose={() => setDialogOpen(false)} coupon={editCoupon} onSaved={fetch_} />
    </div>
  )
}
