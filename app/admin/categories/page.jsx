'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', background: '#fff', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }

function slugify(str) { return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }

function CategoryDialog({ open, onClose, category, onSaved }) {
  const isEdit = !!category
  const [form, setForm] = useState({ name: '', slug: '', sortOrder: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) setForm({ name: category.name, slug: category.slug, sortOrder: category.sortOrder })
    else setForm({ name: '', slug: '', sortOrder: 0 })
  }, [category, open])

  function handleNameChange(name) { setForm(f => ({ ...f, name, slug: slugify(name) })) }

  async function handleSave() {
    if (!form.name || !form.slug) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const url = isEdit ? `/api/admin/categories/${category.id}` : '/api/admin/categories'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(isEdit ? 'Category updated' : 'Category created')
      onSaved(); onClose()
    } catch (e) { toast.error(e.message || 'Failed to save') }
    finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>{isEdit ? 'Edit Category' : 'Add Category'}</div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelStyle}>Name</label><input style={inputStyle} value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Category name" /></div>
          <div><label style={labelStyle}>Slug</label><input style={inputStyle} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="category-slug" /></div>
          <div><label style={labelStyle}>Sort Order</label><input style={inputStyle} type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} /></div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink2)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
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
          <Plus size={15} /> Add Category
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
                    <button onClick={() => handleReorder(c.id, 'up')} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? 'var(--color-fm-line-soft)' : 'var(--color-fm-ink3)', padding: 2, display: 'flex' }}><ChevronUp size={14} /></button>
                    <button onClick={() => handleReorder(c.id, 'down')} disabled={i === categories.length - 1} style={{ background: 'none', border: 'none', cursor: i === categories.length - 1 ? 'default' : 'pointer', color: i === categories.length - 1 ? 'var(--color-fm-line-soft)' : 'var(--color-fm-ink3)', padding: 2, display: 'flex' }}><ChevronDown size={14} /></button>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{c.name}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{c.slug}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: 'var(--color-fm-green-soft)', color: 'var(--color-fm-green-ink)' }}>{c.productCount}</span>
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => { setEditCat(c); setDialogOpen(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', padding: 4, display: 'flex' }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(c.id, c.name, c.productCount)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 4, display: 'flex' }}><Trash2 size={14} /></button>
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
