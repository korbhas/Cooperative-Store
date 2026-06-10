'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const SORT_OPTIONS = [
  { value: '__default', label: 'Sort: Name A–Z' },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'newest',     label: 'Newest first' },
]

export default function SortSelect({ currentSort }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(val) {
    const urlVal = val === '__default' ? '' : val
    const next = new URLSearchParams(searchParams)
    if (urlVal) next.set('sort', urlVal)
    else next.delete('sort')
    router.replace(`/products?${next.toString()}`)
  }

  return (
    <Select value={currentSort === '' ? '__default' : currentSort} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-40 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
