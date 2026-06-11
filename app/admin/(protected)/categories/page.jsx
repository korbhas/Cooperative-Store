'use client'

import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { IconPlus, IconPencil, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

function slugify(str) { return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required.'),
  slug: z.string().trim().min(1, 'Slug is required.')
    .regex(/^[a-z0-9-]+$/, 'Use only lowercase letters, numbers, and hyphens.'),
  sortOrder: z.string().refine(
    (v) => v === '' || Number.isInteger(Number(v)),
    'Sort order must be a whole number.'
  ),
})

const EMPTY = { name: '', slug: '', sortOrder: '0' }

function CategoryDialog({ open, onClose, category, onSaved }) {
  const isEdit = !!category
  const [saving, setSaving] = useState(false)

  const form = useForm({
    defaultValues: EMPTY,
    validators: { onSubmit: categorySchema },
    onSubmit: async ({ value }) => save(value),
  })

  useEffect(() => {
    if (category) form.reset({ name: category.name, slug: category.slug, sortOrder: String(category.sortOrder) })
    else form.reset(EMPTY)
  }, [category, open, form])

  async function save(value) {
    setSaving(true)
    try {
      const url = isEdit ? `/api/admin/categories/${category.id}` : '/api/admin/categories'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...value, sortOrder: Number(value.sortOrder || 0) }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(isEdit ? 'Category updated' : 'Category created')
      onSaved(); onClose()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>

        <form
          id="category-form"
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
                    <FieldLabel htmlFor="category-name">Name</FieldLabel>
                    <Input
                      id="category-name"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        form.setFieldValue('slug', slugify(e.target.value))
                      }}
                      aria-invalid={isInvalid}
                      placeholder="Category name"
                      autoComplete="off"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="slug">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
                    <Input
                      id="category-slug"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="category-slug"
                      className="font-mono"
                      autoComplete="off"
                    />
                    <FieldDescription>Used in URLs. Auto-generated from the name.</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            <form.Field name="sortOrder">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="category-sortOrder">Sort Order</FieldLabel>
                    <Input
                      id="category-sortOrder"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      type="number"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="category-form" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editCat, setEditCat] = useState(null)

  const fetch_ = () => fetch('/api/admin/categories').then(r => r.json()).then(setCategories)
  useEffect(() => { fetch_() }, [])

  async function handleDelete(id, name, count) {
    if (count > 0) { toast.error(`Cannot delete — ${count} product(s) in this category`); return }
    if (!confirm(`Delete "${name}"?`)) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Category deleted'); fetch_() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  async function handleReorder(id, direction) {
    const idx = categories.findIndex(c => c.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= categories.length) return
    const a = categories[idx], b = categories[swapIdx]
    await Promise.all([
      fetch(`/api/admin/categories/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: b.sortOrder }) }),
      fetch(`/api/admin/categories/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sortOrder: a.sortOrder }) }),
    ])
    fetch_()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Categories</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>{categories.length} categories</p>
        </div>
        <button onClick={() => { setEditCat(null); setDialogOpen(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <IconPlus size={15} /> Add Category
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Order', 'Name', 'Slug', 'Products', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No categories yet</td></tr>
            ) : categories.map((c, i) => (
              <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button onClick={() => handleReorder(c.id, 'up')} disabled={i === 0} aria-label={`Move ${c.name} up`} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? 'var(--color-fm-line-soft)' : 'var(--color-fm-ink3)', padding: 2, display: 'flex' }}><IconChevronUp size={14} /></button>
                    <button onClick={() => handleReorder(c.id, 'down')} disabled={i === categories.length - 1} aria-label={`Move ${c.name} down`} style={{ background: 'none', border: 'none', cursor: i === categories.length - 1 ? 'default' : 'pointer', color: i === categories.length - 1 ? 'var(--color-fm-line-soft)' : 'var(--color-fm-ink3)', padding: 2, display: 'flex' }}><IconChevronDown size={14} /></button>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{c.slug}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: 'var(--color-fm-green-soft)', color: 'var(--color-fm-green-ink)' }}>{c.productCount}</span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setEditCat(c); setDialogOpen(true) }} aria-label={`Edit category ${c.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', padding: 4, display: 'flex' }}><IconPencil size={14} /></button>
                    <button onClick={() => handleDelete(c.id, c.name, c.productCount)} aria-label={`Delete category ${c.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex' }}><IconTrash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CategoryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} category={editCat} onSaved={fetch_} />
    </div>
  )
}
