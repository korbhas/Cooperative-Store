import PageLoader from '@/components/PageLoader'

// Streamed fallback while admin server pages fetch.
export default function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <PageLoader />
    </div>
  )
}
