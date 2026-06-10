'use client'

import { useState, useEffect, useCallback } from 'react'
import { IconPlus, IconPencil, IconTrash, IconSearch, IconUpload } from '@tabler/icons-react'
import toast from 'react-hot-toast'
import ProductDialog from './ProductDialog'
import ImportCsvDialog from './ImportCsvDialog'
import PageLoader from '@/components/PageLoader'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const btnStyle = (variant = 'primary') => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 14px', borderRadius: 8,
  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
  cursor: 'pointer',
  ...(variant === 'primary'
    ? { background: 'var(--color-fm-green)', color: '#fff', border: 'none' }
    : variant === 'secondary'
    ? { background: '#fff', color: 'var(--color-fm-green)', border: '1.5px solid var(--color-fm-green)' }
    : variant === 'ghost'
    ? { background: 'transparent', color: 'var(--color-fm-ink3)', border: 'none', padding: '6px 8px' }
    : { background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 8px' }),
})

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (status) params.set('status', status)
    if (categoryFilter) params.set('category', categoryFilter)
    const res = await fetch(`/api/admin/products?${params}`)
    const data = await res.json()
    setProducts(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [q, status, categoryFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(Array.isArray(d) ? d : []))
  }, [])

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Product deleted'); fetchProducts() }
    else toast.error('Failed to delete product')
  }

  function openAdd() { setEditProduct(null); setDialogOpen(true) }
  function openEdit(p) { setEditProduct(p); setDialogOpen(true) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--color-fm-ink)', margin: 0 }}>Products</h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)', margin: '4px 0 0' }}>{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setImportOpen(true)} style={btnStyle('secondary')}><IconUpload size={15} /> Import CSV</button>
          <button onClick={openAdd} style={btnStyle('primary')}><IconPlus size={15} /> Add Product</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid var(--color-fm-line-soft)', borderRadius: 8, padding: '0 12px', background: '#fff', height: 38 }}>
          <IconSearch size={14} color="var(--color-fm-ink3)" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…" style={{ border: 'none', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', background: 'transparent', width: 200 }} />
        </div>
        <Select
          value={categoryFilter === '' ? '__all' : String(categoryFilter)}
          onValueChange={val => setCategoryFilter(val === '__all' ? '' : val)}
        >
          <SelectTrigger className="h-[38px] w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={status === '' ? '__all' : status}
          onValueChange={val => setStatus(val === '__all' ? '' : val)}
        >
          <SelectTrigger className="h-[38px] w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid var(--color-fm-line-soft)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Image', 'Name', 'Category', 'Price', 'Stock', 'Variants', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, color: 'var(--color-fm-ink3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 32 }}><PageLoader label="Loading products…" className="py-0" /></td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink3)' }}>No products found</td></tr>
            ) : products.map((p, i) => (
              <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid var(--color-fm-line-soft)' : undefined }}>
                <td style={{ padding: '10px 14px' }}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--color-fm-green-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📦</div>}
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500, maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{p.category?.name ?? '—'}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)', fontWeight: 500 }}>₹{p.price.toFixed(2)}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: p.stockQty === 0 ? '#fee2e2' : p.stockQty <= 10 ? '#fef9c3' : '#dcfce7', color: p.stockQty === 0 ? '#991b1b' : p.stockQty <= 10 ? '#854d0e' : '#166534' }}>
                    {p.stockQty === 0 ? 'Out of stock' : p.stockQty}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>{p.variantCount}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-sans)', background: p.isActive ? '#dcfce7' : '#f1f5f9', color: p.isActive ? '#166534' : '#64748b' }}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => openEdit(p)} style={btnStyle('ghost')} title="Edit" aria-label={`Edit ${p.name}`}><IconPencil size={14} /></button>
                    <button onClick={() => handleDelete(p.id, p.name)} style={btnStyle('danger')} title="Delete" aria-label={`Delete ${p.name}`}><IconTrash size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={editProduct}
        categories={categories}
        onSaved={fetchProducts}
      />
      <ImportCsvDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={fetchProducts}
      />
    </div>
  )
}
