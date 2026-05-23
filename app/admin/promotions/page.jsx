'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', background: '#fff', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }

const EMPTY = { code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: '', maxUses: '', startsAt: '', expiresAt: '', isActive: true }

function CouponDialog({ open, onClose, coupon, onSaved }) {
  const isEdit = !!coupon
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (coupon) setForm({ code: coupon.code, description: coupon.description ?? '', discountType: coupon.discountType, discountValue: coupon.discountValue, minOrderAmount: coupon.minOrderAmount, maxUses: coupon.maxUses ?? '', startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '', expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '', isActive: coupon.isActive })
    else setForm(EMPTY)
  }, [coupon, open])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.code || !form.discountValue) { toast.error('Code and discount value required'); return }
    setSaving(true)
    const url = isEdit ? `/api/admin/promotions/${coupon.id}` : '/api/admin/promotions'
    const res = await fetch(url, { method: isEdit ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    if (res.ok) { toast.success(isEdit ? 'Coupon updated' : 'Coupon created'); onSaved(); onClose() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--color-fm-line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>{isEdit ? 'Edit Coupon' : 'Add Coupon'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Code</label>
              <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }} value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="SAVE20" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelStyle}>Description</label>
              <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description" />
            </div>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select style={inputStyle} value={form.discountType} onChange={e => set('discountType', e.target.value)}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Discount Value</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} placeholder={form.discountType === 'percentage' ? '20' : '50'} />
            </div>
            <div>
              <label style={labelStyle}>Min Order (₹)</label>
              <input style={inputStyle} type="number" min="0" value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label style={labelStyle}>Max Uses</label>
              <input style={inputStyle} type="number" min="1" value={form.maxUses} onChange={e => set('maxUses', e.target.value)} placeholder="Unlimited" />
            </div>
            <div>
              <label style={labelStyle}>Starts At</label>
              <input style={inputStyle} type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Expires At</label>
              <input style={inputStyle} type="datetime-local" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" id="couponActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-fm-green)' }} />
              <label htmlFor="couponActive" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', cursor: 'pointer' }}>Active</label>
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--color-fm-line-soft)', display: 'flex', justifyContent: 'flex-end', gap: 10, position: 'sticky', bottom: 0, background: '#fff' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', background: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-fm-green)', color: '#fff', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Saving…' : isEdit ? 'Save' : 'Add'}</button>
        </div>
      </div>
    </div>
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
          <Plus size={15} /> Add Coupon
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
                      <button onClick={() => { setEditCoupon(c); setDialogOpen(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', display: 'flex', padding: 4 }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(c.id, c.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', display: 'flex', padding: 4 }}><Trash2 size={14} /></button>
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
