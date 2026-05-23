'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        fontFamily: 'Helvetica, sans-serif',
        background: '#fafaf6',
        color: '#1f2520',
      }}>
        <div style={{ fontSize: 32 }}>💥</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>FreshMart is unavailable</h1>
        <p style={{ fontSize: 14, color: '#8a948c', textAlign: 'center', maxWidth: 320, margin: 0 }}>
          A critical error occurred. Please refresh the page.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '8px 20px',
            borderRadius: 8,
            background: '#1f4d34',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </body>
    </html>
  )
}
