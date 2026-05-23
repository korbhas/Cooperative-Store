import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-fm-ink)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 64,
        fontWeight: 700,
        color: 'var(--color-fm-line-soft)',
        lineHeight: 1,
      }}>
        404
      </div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, margin: 0 }}>
        Page not found
      </h2>
      <p style={{ fontSize: 14, color: 'var(--color-fm-ink3)', textAlign: 'center', maxWidth: 320, margin: 0 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          background: 'var(--color-fm-green)',
          color: '#fff',
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
        }}
      >
        Back to Home
      </Link>
    </div>
  )
}
