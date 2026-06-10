'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// Illustrations are server-rendered and passed in as React nodes so the SVG
// markup stays out of the client JS bundle.
const SLIDES = [
  {
    headline: 'Welcome to FreshMart!',
    subtext: 'Everything you need, from pantry staples to fresh picks — in one place.',
    cardBg: 'var(--color-fm-green-soft)',
  },
  {
    headline: 'Delivered in a flash',
    subtext: 'Lightning-fast doorstep delivery from your neighbourhood store.',
    cardBg: 'var(--color-fm-accent-soft)',
  },
  {
    headline: 'Farm-fresh, always',
    subtext: 'Fruits & veggies hand-picked and checked for freshness every morning.',
    cardBg: 'var(--color-fm-paper2)',
  },
]

const AUTO_ADVANCE_MS = 4000

export default function WelcomeScreen({ illustrations, onDismiss }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const touchStartX = useRef(null)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    if (reducedMotion) return
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SLIDES.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [activeIndex, reducedMotion])

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (delta < -40) setActiveIndex((i) => Math.min(i + 1, SLIDES.length - 1))
    else if (delta > 40) setActiveIndex((i) => Math.max(i - 1, 0))
  }

  const slide = SLIDES[activeIndex]

  return (
    <div style={{
      flex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: 'var(--color-fm-paper)', padding: '20px 20px 28px',
    }}>
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        flex: 1, display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--color-fm-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)',
            }}>FM</div>
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800,
              color: 'var(--color-fm-ink)', letterSpacing: '-0.3px',
            }}>FreshMart</span>
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink2)',
            border: '1.5px solid var(--color-fm-line-soft)', borderRadius: 999,
            padding: '7px 14px', background: '#fff',
          }}>English</span>
        </header>

        {/* Carousel */}
        <section
          role="region"
          aria-roledescription="carousel"
          aria-label="FreshMart highlights"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            marginTop: 'auto', overflow: 'hidden', borderRadius: 24,
          }}
        >
          <div style={{
            display: 'flex',
            transform: `translateX(-${activeIndex * 100}%)`,
            transition: reducedMotion ? 'none' : 'transform 450ms ease',
          }}>
            {SLIDES.map(({ cardBg }, i) => (
              <div
                key={i}
                aria-hidden={i !== activeIndex}
                style={{
                  flex: '0 0 100%', background: cardBg, borderRadius: 24,
                  padding: '28px 24px',
                }}
              >
                {illustrations[i]}
              </div>
            ))}
          </div>
        </section>

        {/* Headline + subtext */}
        <div aria-live="polite" style={{ textAlign: 'center', marginTop: 28, minHeight: 92 }}>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700,
            color: 'var(--color-fm-ink)', margin: 0,
          }}>{slide.headline}</h1>
          <p style={{
            fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-fm-ink3)',
            margin: '8px auto 0', maxWidth: 360, lineHeight: 1.5,
          }}>{slide.subtext}</p>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14, marginBottom: 'auto' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === activeIndex}
              onClick={() => setActiveIndex(i)}
              style={{
                width: i === activeIndex ? 22 : 9, height: 9, borderRadius: 999,
                border: 'none', padding: 0, cursor: 'pointer',
                background: i === activeIndex ? 'var(--color-fm-green)' : 'var(--color-fm-line-soft)',
                transition: reducedMotion ? 'none' : 'width 250ms ease, background 250ms ease',
              }}
            />
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 28 }}>
          <Link href="/login" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 48, borderRadius: 999, background: 'var(--color-fm-green)',
            color: '#fff', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700,
            textDecoration: 'none',
          }}>Log in</Link>
          <Link href="/register" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 48, borderRadius: 999, background: 'transparent',
            border: '1.5px solid var(--color-fm-green)',
            color: 'var(--color-fm-green)', fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700,
            textDecoration: 'none',
          }}>I&apos;m new, sign me up</Link>
          {onDismiss && (
            <button type="button" onClick={onDismiss} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600,
              color: 'var(--color-fm-ink2)', padding: '8px 0', textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}>Skip — browse as guest</button>
          )}
        </div>

        {/* Terms footer */}
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)',
          textAlign: 'center', margin: '18px auto 0', maxWidth: 320, lineHeight: 1.6,
        }}>
          By logging in or registering, you agree to our{' '}
          <span style={{ color: 'var(--color-fm-green-ink)', fontWeight: 600 }}>Terms of service</span> and{' '}
          <span style={{ color: 'var(--color-fm-green-ink)', fontWeight: 600 }}>Privacy policy</span>.
        </p>

      </div>
    </div>
  )
}
