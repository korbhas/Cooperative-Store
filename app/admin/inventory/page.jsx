'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const FILTERS = [
  { label: 'All', value: '' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
]

function filterProducts(products, filter) {
  if (filter === 'in_stock') return products.filter(p => p.stockQty > 10)
  if (filter === 'low_stock') return products.filter(p => p.stockQty > 0 && p.stockQty <= 10)
  if (filter === 'out_of_stock') return products.filter(p => p.stockQty === 0)
  return products
}

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [filter, setFilter] = useState('')
  const [editing, setEditing] = useState({})

  useEffect(() => {
    fetch('/api/admin/products?status=active').then(r => r.json()).then(setProducts)
  }, [])

  async function handleStockChange(id, val) {
    const qty = Number(val)
    if (isNaN(qty) || qty < 0) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stockQty: qty }) })
    if (res.ok) {
      setProducts(ps => ps.map(p => p.id === id ? { ...p, stockQty: qty } : p))
      setEditing(e => { const n = { ...e }; delete n[id]; return n })
      toast.success('Stock updated')
    } else toast.error('Failed to update stock')
  }

  const visible = filterProducts(products, filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Inventory</h1>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>Inline stock management</p>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{ padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: filter === f.value ? 600 : 400, fontFamily: 'var(--font-sans)', cursor: 'pointer', background: filter === f.value ? 'var(--color-fm-green)' : '#fff', color: filter === f.value ? '#fff' : 'var(--color-fm-ink2)', border: '1.5px solid', borderColor: filter === f.value ? 'var(--color-fm-green)' : 'var(--color-fm-line-soft)' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Product', 'Category', 'Price', 'Stock Qty', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No products</td></tr>
            ) : visible.map((p, i) => {
              const rowBg = p.stockQty === 0 ? '#fff5f5' : p.stockQty <= 10 ? '#fffbeb' : 'transparent'
              const currentVal = editing[p.id] !== undefined ? editing[p.id] : p.stockQty
              return (
                <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined, background: rowBg }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{p.category?.name ?? '—'}</td>
                  <td style={{ padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)' }}>₹{p.price.toFixed(2)}</td>
                  <td style={{ padding: '8px 16px' }}>
                    <input
                      type="number" min="0" value={currentVal}
                      onChange={e => setEditing(ed => ({ ...ed, [p.id]: e.target.value }))}
                      onBlur={e => { if (editing[p.id] !== undefined) handleStockChange(p.id, e.target.value) }}
                      onKeyDown={e => { if (e.key === 'Enter') handleStockChange(p.id, e.target.value) }}
                      style={{ width: 80, padding: '6px 10px', borderRadius: 7, border: '1.5px solid var(--color-fm-line-soft)', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', outline: 'none', background: '#fff' }}
                    />
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: p.stockQty === 0 ? '#fee2e2' : p.stockQty <= 10 ? '#fef9c3' : '#dcfce7', color: p.stockQty === 0 ? '#991b1b' : p.stockQty <= 10 ? '#854d0e' : '#166534' }}>
                      {p.stockQty === 0 ? 'Out of stock' : p.stockQty <= 10 ? 'Low stock' : 'In stock'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
