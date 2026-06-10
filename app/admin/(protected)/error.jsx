'use client'

import { useEffect } from 'react'
import { IconAlertCircle } from '@tabler/icons-react'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 16px' }}>
      <Alert variant="destructive" className="max-w-xl bg-white">
        <IconAlertCircle />
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          {error?.message || 'An unexpected error occurred while loading this page.'}
        </AlertDescription>
        <AlertAction>
          <button
            onClick={reset}
            style={{
              padding: '5px 12px',
              borderRadius: 7,
              border: '1.5px solid var(--color-fm-line-soft)',
              background: '#fff',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-fm-ink)',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </AlertAction>
      </Alert>
    </div>
  )
}
