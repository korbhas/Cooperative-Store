'use client'

import { useSearchParams, useRouter } from 'next/navigation'

const SORT_OPTIONS = [
  { value: '', label: 'Sort: Name A–Z' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest', label: 'Newest first' },
]

export default function SortSelect({ currentSort }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('sort', value)
    else next.delete('sort')
    router.replace(`/products?${next.toString()}`)
  }

  return (
    <select
      value={currentSort}
      onChange={(e) => handleChange(e.target.value)}
      style={{
        fontFamily: 'var(--font-sans)', fontSize: 12,
        color: 'var(--color-fm-ink2)', background: '#fff',
        border: '1.5px solid var(--color-fm-line-soft)', borderRadius: 7,
        padding: '5px 10px', cursor: 'pointer', outline: 'none',
        flexShrink: 0, height: 32,
      }}
    >
      {SORT_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}
