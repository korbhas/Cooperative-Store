'use client'

import { useEffect, useState } from 'react'
import WelcomeScreen from './WelcomeScreen'

export const WELCOME_SEEN_COOKIE = 'fm_welcome_seen'

// Full-screen first-visit onboarding shown on top of the home page. The home
// page stays a 200 with real content underneath (crawlers index it), while
// new visitors see the carousel. Marked as seen on first render so it only
// ever appears once per browser.
export default function WelcomeOverlay({ illustrations }) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    document.cookie = `${WELCOME_SEEN_COOKIE}=1; max-age=31536000; path=/; samesite=lax`
  }, [])

  if (dismissed) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto', background: 'var(--color-fm-paper)' }}>
      <WelcomeScreen illustrations={illustrations} onDismiss={() => setDismissed(true)} />
    </div>
  )
}
