'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { IconPlus, IconTrash, IconPhotoPlus } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import PageLoader from '@/components/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Field, FieldError, FieldGroup, FieldLabel, FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required.'),
  description: z.string(),
  categoryId: z.string(),
  price: z.string().refine((v) => v !== '' && Number(v) > 0, 'Enter a price greater than 0.'),
  unit: z.string(),
  stockQty: z.string().refine(
    (v) => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0),
    'Stock must be a non-negative whole number.'
  ),
  imageUrl: z.string(),
  isActive: z.boolean(),
})

const EMPTY_VALUES = {
  name: '', description: '', categoryId: '', price: '',
  unit: 'piece', stockQty: '', imageUrl: '', isActive: true,
}

const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen']

export default function ProductDialog({ open, onClose, product, categories, onSaved }) {
  const isEdit = !!product
  const [variants, setVariants] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newVariant, setNewVariant] = useState({ name: '', price: '', stockQty: '', isDefault: false })
  const fileInputRef = useRef(null)

  const form = useForm({
    defaultValues: EMPTY_VALUES,
    validators: { onSubmit: productSchema },
    onSubmit: async ({ value }) => save(value),
  })

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description ?? '',
        categoryId: product.category?.id != null ? String(product.category.id) : '',
        price: String(product.price),
        unit: product.unit,
        stockQty: String(product.stockQty),
        imageUrl: product.imageUrl ?? '',
        isActive: product.isActive,
      })
      fetch(`/api/admin/products/${product.id}/variants`).then(r => r.json()).then(setVariants)
    } else {
      form.reset(EMPTY_VALUES)
      setVariants([])
    }
    setNewVariant({ name: '', price: '', stockQty: '', isDefault: false })
  }, [product, open, form])

  async function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      form.setFieldValue('imageUrl', url)
    } catch { toast.error('Image upload failed') }
    finally { setUploading(false); e.target.value = '' }
  }

  async function save(value) {
    setSaving(true)
    try {
      const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...value, categoryId: value.categoryId || null }),
      })
      if (!res.ok) throw new Error()
      toast.success(isEdit ? 'Product updated' : 'Product created')
      onSaved(); onClose()
    } catch { toast.error('Failed to save product') }
    finally { setSaving(false) }
  }

  async function addVariant() {
    if (!newVariant.name || !newVariant.price) { toast.error('Variant name and price required'); return }
    const res = await fetch(`/api/admin/products/${product.id}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newVariant) })
    if (res.ok) {
      const v = await res.json()
      setVariants(vs => [...vs, v])
      setNewVariant({ name: '', price: '', stockQty: '', isDefault: false })
      toast.success('Variant added')
    } else toast.error('Failed to add variant')
  }

  async function deleteVariant(id) {
    const res = await fetch(`/api/admin/variants/${id}`, { method: 'DELETE' })
    if (res.ok) { setVariants(vs => vs.filter(v => v.id !== id)); toast.success('Variant removed') }
    else toast.error('Failed to remove variant')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add Product'}</DialogTitle>
        </DialogHeader>

        <form
          id="product-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4">
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Product name"
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional description"
                    className="min-h-18 resize-y"
                  />
                </Field>
              )}
            </form.Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="categoryId">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="product-category">Category</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value === '' ? '__none' : field.state.value}
                      onValueChange={(val) => field.handleChange(val === '__none' ? '' : val)}
                    >
                      <SelectTrigger id="product-category" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">No category</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="unit">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor="product-unit">Unit</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="product-unit" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="price">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Price (₹)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field name="stockQty">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Stock Qty</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="number"
                        min="0"
                        placeholder="0"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </form.Field>
            </div>

            <form.Field name="imageUrl">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="product-image">Product Image</FieldLabel>
                  <input
                    ref={fileInputRef}
                    id="product-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  {field.state.value ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={field.state.value}
                        alt=""
                        className="size-18 shrink-0 rounded-md border object-cover"
                      />
                      <div className="flex flex-col items-start gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? 'Uploading…' : 'Change image'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => field.handleChange('')}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed bg-muted/40 px-3 py-5 text-muted-foreground transition-colors hover:bg-muted disabled:cursor-default"
                    >
                      {uploading ? (
                        <PageLoader label="Uploading…" className="py-0" />
                      ) : (
                        <>
                          <IconPhotoPlus className="size-5" stroke={1.5} />
                          <span className="text-xs">Click to upload image</span>
                        </>
                      )}
                    </button>
                  )}
                </Field>
              )}
            </form.Field>

            <form.Field name="isActive">
              {(field) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="product-active"
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                  <FieldLabel htmlFor="product-active" className="font-normal">
                    Active
                  </FieldLabel>
                </Field>
              )}
            </form.Field>

            {/* Variants (edit mode only) */}
            {isEdit && (
              <>
                <FieldSeparator>Variants</FieldSeparator>
                <div>
                  {variants.map(v => (
                    <div key={v.id} className="mb-1.5 flex items-center gap-2">
                      <span className="flex-1 truncate text-sm">{v.name}</span>
                      <span className="text-sm text-muted-foreground">₹{v.price.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">Qty: {v.stockQty}</span>
                      {v.isDefault && <Badge variant="secondary">Default</Badge>}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteVariant(v.id)}
                        aria-label={`Delete variant ${v.name}`}
                      >
                        <IconTrash className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Input
                      className="min-w-25 flex-2"
                      value={newVariant.name}
                      onChange={e => setNewVariant(v => ({ ...v, name: e.target.value }))}
                      placeholder="Variant name"
                    />
                    <Input
                      className="w-20"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newVariant.price}
                      onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))}
                      placeholder="Price"
                    />
                    <Input
                      className="w-18"
                      type="number"
                      min="0"
                      value={newVariant.stockQty}
                      onChange={e => setNewVariant(v => ({ ...v, stockQty: e.target.value }))}
                      placeholder="Qty"
                    />
                    <Button type="button" variant="secondary" onClick={addVariant}>
                      <IconPlus className="size-3.5" /> Add
                    </Button>
                  </div>
                </div>
              </>
            )}
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
