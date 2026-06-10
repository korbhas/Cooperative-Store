'use client'

import { useEffect, useState } from 'react'
import { Progress, ProgressLabel } from '@/components/ui/progress'

// Shared loading indicator: a progress bar that eases toward 90% while the
// real work is in flight (actual duration is unknown, so it never completes —
// it unmounts when the content arrives).
export default function PageLoader({ label = 'Loading…', className = '' }) {
  const [value, setValue] = useState(8)

  useEffect(() => {
    const timer = setInterval(() => {
      setValue((v) => v + (90 - v) * 0.12)
    }, 180)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`flex w-full flex-col items-center gap-3 py-10 ${className}`}>
      <Progress
        value={value}
        aria-label={label}
        className="w-full max-w-55"
        style={{ '--primary': 'var(--color-fm-green)' }}
      >
        <ProgressLabel
          className="w-full text-center text-xs font-normal"
          style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-fm-ink3)' }}
        >
          {label}
        </ProgressLabel>
      </Progress>
    </div>
  )
}
