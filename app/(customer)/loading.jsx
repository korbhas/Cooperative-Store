import PageLoader from '@/components/PageLoader'

// Streamed fallback while server pages fetch (cache misses on home/products).
export default function Loading() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--color-fm-paper)',
    }}>
      <main style={{ padding: '24px 16px', maxWidth: 960, width: '100%', margin: '0 auto' }}>
        <PageLoader className="py-2" />
        <div className="animate-pulse">
          <div style={{ height: 120, borderRadius: 14, background: 'var(--color-fm-paper2)', marginBottom: 24 }} />
          <div style={{ height: 14, width: 160, borderRadius: 6, background: 'var(--color-fm-paper2)', marginBottom: 10 }} />
          <div style={{ height: 22, width: 220, borderRadius: 6, background: 'var(--color-fm-paper2)', marginBottom: 20 }} />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                aspectRatio: '128 / 188', borderRadius: 8,
                background: 'var(--color-fm-paper2)',
              }} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
