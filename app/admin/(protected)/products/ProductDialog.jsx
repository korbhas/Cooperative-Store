'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, ImagePlus } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1.5px solid var(--color-fm-line-soft)', outline: 'none',
  fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)',
  background: '#fff', boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
  color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
}

export default function ProductDialog({ open, onClose, product, categories, onSaved }) {
  const isEdit = !!product
  const [form, setForm] = useState({ name: '', description: '', categoryId: '', price: '', unit: 'piece', stockQty: '', imageUrl: '', isActive: true })
  const [variants, setVariants] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newVariant, setNewVariant] = useState({ name: '', price: '', stockQty: '', isDefault: false })
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (product) {
      setForm({ name: product.name, description: product.description ?? '', categoryId: product.category?.id ?? '', price: product.price, unit: product.unit, stockQty: product.stockQty, imageUrl: product.imageUrl ?? '', isActive: product.isActive })
      fetch(`/api/admin/products/${product.id}/variants`).then(r => r.json()).then(setVariants)
    } else {
      setForm({ name: '', description: '', categoryId: '', price: '', unit: 'piece', stockQty: '', imageUrl: '', isActive: true })
      setVariants([])
    }
    setNewVariant({ name: '', price: '', stockQty: '', isDefault: false })
  }, [product, open])

  function setField(key, val) { setForm(f => ({ ...f, [key]: val })) }

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
      setField('imageUrl', url)
    } catch { toast.error('Image upload failed') }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleSave() {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    setSaving(true)
    try {
      const url = isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, categoryId: form.categoryId || null }) })
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

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 580, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--color-fm-ink)' }}>{isEdit ? 'Edit Product' : 'Add Product'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Name</label>
              <input style={inputStyle} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Product name" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Optional description" />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.categoryId} onChange={e => setField('categoryId', e.target.value)}>
                <option value="">No category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unit</label>
              <select style={inputStyle} value={form.unit} onChange={e => setField('unit', e.target.value)}>
                {['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Price (₹)</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Stock Qty</label>
              <input style={inputStyle} type="number" min="0" value={form.stockQty} onChange={e => setField('stockQty', e.target.value)} placeholder="0" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Product Image</label>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              {form.imageUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={form.imageUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                      style={{ padding: '6px 14px', borderRadius: 7, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--color-fm-ink2)', cursor: uploading ? 'default' : 'pointer' }}>
                      {uploading ? 'Uploading…' : 'Change image'}
                    </button>
                    <button type="button" onClick={() => setField('imageUrl', '')}
                      style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: 'none', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#dc2626', cursor: 'pointer', textAlign: 'left' }}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ width: '100%', padding: '20px 12px', borderRadius: 8, border: '1.5px dashed var(--color-fm-line-soft)', background: uploading ? 'rgba(0,0,0,0.02)' : '#fafafa', cursor: uploading ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <ImagePlus size={20} color="var(--color-fm-ink3)" strokeWidth={1.5} />
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>
                    {uploading ? 'Uploading…' : 'Click to upload image'}
                  </span>
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setField('isActive', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-fm-green)' }} />
              <label htmlFor="isActive" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', cursor: 'pointer' }}>Active</label>
            </div>
          </div>

          {/* Variants (edit mode only) */}
          {isEdit && (
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Variants</div>
              {variants.map(v => (
                <div key={v.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ flex: 1, fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>{v.name}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>₹{v.price.toFixed(2)}</span>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>Qty: {v.stockQty}</span>
                  {v.isDefault && <span style={{ padding: '1px 6px', borderRadius: 99, background: 'var(--color-fm-green-soft)', color: 'var(--color-fm-green-ink)', fontSize: 10, fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Default</span>}
                  <button onClick={() => deleteVariant(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 4 }}><Trash2 size={13} /></button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <input style={{ ...inputStyle, flex: 2, minWidth: 100 }} value={newVariant.name} onChange={e => setNewVariant(v => ({ ...v, name: e.target.value }))} placeholder="Variant name" />
                <input style={{ ...inputStyle, width: 80 }} type="number" min="0" step="0.01" value={newVariant.price} onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))} placeholder="Price" />
                <input style={{ ...inputStyle, width: 70 }} type="number" min="0" value={newVariant.stockQty} onChange={e => setNewVariant(v => ({ ...v, stockQty: e.target.value }))} placeholder="Qty" />
                <button onClick={addVariant} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green-soft)', color: 'var(--color-fm-green-ink)', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: '#fff' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500, color: 'var(--color-fm-ink2)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: saving ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)', color: saving ? 'var(--color-fm-green-ink)' : '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}
