'use client'

import { useEffect } from 'react'
import { IconAlertCircle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

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
      padding: 16,
      fontFamily: 'var(--font-sans)',
    }}>
      <Alert variant="destructive" className="max-w-md bg-white">
        <IconAlertCircle />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </AlertDescription>
      </Alert>
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
