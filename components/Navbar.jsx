'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, ClipboardList, LogOut, User, Home, Tag, Settings } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useUser, useClerk } from '@clerk/nextjs'

const NavSearch = dynamic(() => import('@/components/NavSearch'), {
  ssr: false,
  loading: () => <div style={{ flex: 1 }} />,
})

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Tag, label: 'Products', href: '/products' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const totalItems = useCartStore((s) => s.totalItems())
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  const isAdmin = pathname.startsWith('/admin')
  if (isAdmin) return null

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User'
  const displayInitial = displayName.charAt(0).toUpperCase()
  const displayEmail = user?.primaryEmailAddress?.emailAddress

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '0 20px', height: 48,
      background: 'var(--color-fm-paper2)',
      borderBottom: '1.5px solid var(--color-fm-line-soft)',
      flexShrink: 0, position: 'sticky', top: 0, zIndex: 50,
    }}>
      {/* Brand */}
      <Link href="/" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700,
        color: 'var(--color-fm-green)', marginRight: 12, textDecoration: 'none',
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'var(--color-fm-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, color: '#fff',
          fontFamily: 'var(--font-heading)', flexShrink: 0,
        }}>FM</div>
        <span className="hidden sm:inline">FreshMart</span>
      </Link>

      <div className="hidden md:block" style={{ width: 1, height: 20, background: 'var(--color-fm-line-soft)', margin: '0 8px' }} />

      {/* Nav links */}
      <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 2 }}>
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = href === '/' ? pathname === '/' : pathname === href
          return (
            <Link key={label} href={href} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 7,
              background: active ? 'var(--color-fm-green-soft)' : 'transparent',
              color: active ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink2)',
              fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: active ? 600 : 400, textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            }}>
              <Icon size={14} />{label}
            </Link>
          )
        })}
      </nav>

      {/* Search */}
      <NavSearch />

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isLoaded && isSignedIn ? (
          <>
            <Link href="/orders" className="hidden sm:flex" style={{
              alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7,
              background: pathname === '/orders' ? 'var(--color-fm-green-soft)' : 'transparent',
              color: pathname === '/orders' ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink2)',
              fontFamily: 'var(--font-sans)', fontSize: 13,
              fontWeight: pathname === '/orders' ? 600 : 400, textDecoration: 'none',
            }}>
              <ClipboardList size={14} />Orders
            </Link>

            <Link href="/cart" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7,
              background: pathname === '/cart' ? 'var(--color-fm-green-soft)' : 'transparent',
              color: pathname === '/cart' ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink2)',
              textDecoration: 'none', position: 'relative',
            }}>
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={16} />
                {mounted && totalItems > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 15, height: 15, borderRadius: '50%',
                    background: 'var(--color-fm-accent)', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                  }}>{totalItems}</span>
                )}
              </div>
              <span className="hidden sm:inline" style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}>Cart</span>
            </Link>

            <div style={{ width: 1, height: 20, background: 'var(--color-fm-line-soft)', margin: '0 4px' }} />

            <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--color-fm-green-soft)',
                border: '1.5px solid var(--color-fm-green-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--color-fm-green-ink)',
              }}>
                {displayInitial}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
                  {displayName}
                </span>
                {displayEmail && (
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)' }}>
                    {displayEmail}
                  </span>
                )}
              </div>
            </div>

            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 7,
              background: 'transparent', border: 'none',
              color: 'var(--color-fm-ink3)', cursor: 'pointer',
            }}>
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link href="/cart" style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
              borderRadius: 7, background: 'transparent',
              color: 'var(--color-fm-ink2)', textDecoration: 'none', position: 'relative',
            }}>
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={16} />
                {mounted && totalItems > 0 && (
                  <span style={{
                    position: 'absolute', top: -6, right: -6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 15, height: 15, borderRadius: '50%',
                    background: 'var(--color-fm-accent)', color: '#fff',
                    fontSize: 9, fontWeight: 700,
                  }}>{totalItems}</span>
                )}
              </div>
            </Link>
            <Link href="/login" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 7,
              background: 'var(--color-fm-green)', color: '#fff',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
            }}>
              <User size={13} />Sign In
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
