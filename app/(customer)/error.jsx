'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'var(--font-sans)',
      color: 'var(--color-fm-ink)',
    }}>
      <div style={{ fontSize: 32 }}>⚠️</div>
      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: 14, color: 'var(--color-fm-ink3)', textAlign: 'center', maxWidth: 320 }}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '8px 20px',
          borderRadius: 8,
          background: 'var(--color-fm-green)',
          color: '#fff',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
        }}
      >
        Try again
      </button>
    </div>
  )
}
