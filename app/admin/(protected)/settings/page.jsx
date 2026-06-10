'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import PageLoader from '@/components/PageLoader'

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

const inputBase = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1.5px solid var(--color-fm-line-soft)',
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  color: 'var(--color-fm-ink)',
  background: '#fff',
  boxSizing: 'border-box',
}
const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-sans)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-fm-ink3)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: 5,
}

function Field({ field, value, onChange }) {
  const { key, label, type, placeholder, prefix, hint } = field

  const inputEl = type === 'textarea' ? (
    <textarea
      rows={3}
      style={{ ...inputBase, resize: 'vertical' }}
      value={value ?? ''}
      onChange={e => onChange(key, e.target.value)}
      placeholder={placeholder}
    />
  ) : prefix ? (
    <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid var(--color-fm-line-soft)', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
      <span style={{ padding: '9px 10px 9px 12px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', borderRight: '1.5px solid var(--color-fm-line-soft)', background: '#f8fafc' }}>{prefix}</span>
      <input
        type={type}
        style={{ ...inputBase, border: 'none', borderRadius: 0, flex: 1 }}
        value={value ?? ''}
        onChange={e => onChange(key, e.target.value)}
        placeholder={placeholder}
      />
    </div>
  ) : (
    <input
      type={type}
      style={inputBase}
      value={value ?? ''}
      onChange={e => onChange(key, e.target.value)}
      placeholder={placeholder}
    />
  )

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {inputEl}
      {hint && <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>{hint}</p>}
    </div>
  )
}

export default function SettingsPage() {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const savedRef = useRef({})

  const isDirty = JSON.stringify(values) !== JSON.stringify(savedRef.current)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setValues(data)
        savedRef.current = data
        setLoading(false)
      })
  }, [])

  function handleChange(key, val) {
    setValues(v => ({ ...v, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error()
      savedRef.current = { ...values }
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Settings</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>Global store configuration</p>
        </div>
        {!loading && (
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: !isDirty ? 'var(--color-fm-green-soft)' : saving ? 'var(--color-fm-green-soft)' : 'var(--color-fm-green)',
              color: !isDirty ? 'var(--color-fm-ink3)' : saving ? 'var(--color-fm-green-ink)' : '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isDirty && !saving ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {saving ? 'Saving…' : isDirty ? 'Save Changes' : 'Saved'}
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', padding: 32 }}>
          <PageLoader label="Loading settings…" className="py-0" />
        </div>
      ) : (
        SECTIONS.map(section => (
          <div key={section.key} style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1.5px solid var(--color-fm-line-soft)', background: '#f8fafc' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-fm-ink)' }}>{section.title}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)', marginTop: 2 }}>{section.description}</div>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {section.fields.map(field => (
                <Field key={field.key} field={field} value={values[field.key]} onChange={handleChange} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
