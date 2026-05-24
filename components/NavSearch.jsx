'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function NavSearch() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isProducts = pathname === '/products'
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '')
  const debounceRef = useRef(null)

  useEffect(() => {
    setInputVal(isProducts ? (searchParams.get('q') || '') : '')
  }, [pathname, isProducts, searchParams])

  if (!isProducts) return <div style={{ flex: 1 }} />

  function handleSearch(val) {
    setInputVal(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams)
      if (val) next.set('q', val)
      else next.delete('q')
      router.replace(`/products?${next.toString()}`)
    }, 350)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: '#fff', border: '1.5px solid var(--color-fm-line-soft)',
        borderRadius: 8, padding: '0 10px', height: 32, width: '100%', maxWidth: 280,
      }}>
        <Search size={13} style={{ color: 'var(--color-fm-ink3)', flexShrink: 0 }} />
        <input
          value={inputVal}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search groceries…"
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--color-fm-ink)', background: 'transparent', minWidth: 0,
          }}
        />
        {inputVal && (
          <button onClick={() => handleSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-fm-ink3)', padding: 0, display: 'flex' }}>
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
