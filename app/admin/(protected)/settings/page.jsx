'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const SETTINGS_SCHEMA = [
  { key: 'store_name',              label: 'Store Name',               type: 'text',   placeholder: 'FreshMart' },
  { key: 'store_phone',             label: 'Store Phone',              type: 'text',   placeholder: '+91 98765 43210' },
  { key: 'delivery_fee',            label: 'Delivery Fee (₹)',         type: 'number', placeholder: '40' },
  { key: 'free_delivery_threshold', label: 'Free Delivery Above (₹)',  type: 'number', placeholder: '499' },
  { key: 'low_stock_threshold',     label: 'Low Stock Alert Below',    type: 'number', placeholder: '10' },
]

const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid var(--color-fm-line-soft)', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', background: '#fff', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }

export default function SettingsPage() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(data => { setValues(data); setLoading(false) })
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) })
    setSaving(false)
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save settings')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Settings</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>Global store configuration</p>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', padding: 24 }}>
        {loading ? (
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {SETTINGS_SCHEMA.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type={type}
                  style={inputStyle}
                  value={values[key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: saving ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)', color: saving ? 'var(--color-fm-green-ink)' : '#fff', fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}
    </div>
  )
}
