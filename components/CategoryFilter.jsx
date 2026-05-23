import Link from 'next/link'

export default function CategoryFilter({ categories, activeCategory, currentQ, currentSort }) {
  function buildHref(slug) {
    const params = new URLSearchParams()
    if (slug) params.set('category', slug)
    if (currentQ) params.set('q', currentQ)
    if (currentSort) params.set('sort', currentSort)
    const qs = params.toString()
    return `/products${qs ? `?${qs}` : ''}`
  }

  const all = [{ id: 'all', name: 'All', slug: null }, ...categories]

  return (
    <div style={{
      display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
      scrollbarWidth: 'none', marginBottom: 4,
    }}>
      {all.map(({ id, name, slug }) => {
        const active = slug === activeCategory
        return (
          <Link
            key={id}
            href={buildHref(slug)}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '5px 14px', borderRadius: 20, flexShrink: 0,
              background: active ? 'var(--color-fm-green)' : '#fff',
              color: active ? '#fff' : 'var(--color-fm-ink2)',
              border: active ? '1.5px solid var(--color-fm-green)' : '1.5px solid var(--color-fm-line-soft)',
              fontFamily: 'var(--font-sans)', fontSize: 12,
              fontWeight: active ? 600 : 400,
              textDecoration: 'none', whiteSpace: 'nowrap',
            }}
          >
            {name}
          </Link>
        )
      })}
    </div>
  )
}
