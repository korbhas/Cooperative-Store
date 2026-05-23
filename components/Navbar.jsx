'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ShoppingCart, ClipboardList, Shield, LogOut, User, Home, Tag, Settings } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { createClient } from '@/lib/supabase/client'

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

  const [user, setUser] = useState(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Supabase auth state
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isAdmin = pathname.startsWith('/admin')
  if (isAdmin) return null

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

      {/* Search — only on /products, client-only */}
      <NavSearch />

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {user ? (
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

            {user.user_metadata?.role === 'admin' && (
              <Link href="/admin" className="hidden sm:flex" style={{
                alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 7,
                background: pathname.startsWith('/admin') ? 'var(--color-fm-green-soft)' : 'transparent',
                color: pathname.startsWith('/admin') ? 'var(--color-fm-green-ink)' : 'var(--color-fm-ink2)',
                fontFamily: 'var(--font-sans)', fontSize: 13, textDecoration: 'none',
              }}>
                <Shield size={14} />Admin
              </Link>
            )}

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
                {user.user_metadata?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
                  {user.user_metadata?.name || user.email}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--color-fm-ink3)' }}>
                  {user.email}
                </span>
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
