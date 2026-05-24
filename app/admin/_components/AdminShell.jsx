'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { useClerk } from '@clerk/nextjs'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Package, LayoutGrid, Warehouse,
  ShoppingBag, Users, Truck, Tag, CreditCard, TrendingUp, Settings,
  LogOut, ChevronDown,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',  icon: LayoutDashboard, href: '/admin/dashboard' },
  { label: 'Products',   icon: Package,         href: '/admin/products' },
  { label: 'Categories', icon: LayoutGrid,      href: '/admin/categories' },
  { label: 'Inventory',  icon: Warehouse,       href: '/admin/inventory' },
  { label: 'Orders',     icon: ShoppingBag,     href: '/admin/orders' },
  { label: 'Customers',  icon: Users,           href: '/admin/users' },
  { label: 'Delivery',   icon: Truck,           href: '/admin/delivery' },
  { label: 'Promotions', icon: Tag,             href: '/admin/promotions' },
  { label: 'Payments',   icon: CreditCard,      href: '/admin/payments' },
  { label: 'Revenue',    icon: TrendingUp,      href: '/admin/revenue' },
  { label: 'Settings',   icon: Settings,        href: '/admin/settings' },
]

export default function AdminShell({ children, displayName, email, initials }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useClerk()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  async function handleLogout() {
    await signOut()
    router.push('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0, position: 'fixed', top: 0, left: 0,
        height: '100vh', background: 'var(--color-fm-green)',
        display: 'flex', flexDirection: 'column', zIndex: 40, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          height: 56, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--color-fm-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)',
          }}>FM</div>
          <div>
            <div style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
              FreshMart
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: 1, textTransform: 'uppercase' }}>
              Admin
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontFamily: 'var(--font-sans)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.65)',
                background: active ? 'rgba(255,255,255,0.15)' : 'transparent',
              }}>
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Header */}
        <header style={{
          height: 56, background: '#fff', borderBottom: '1.5px solid var(--color-fm-line-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 24px', position: 'sticky', top: 0, zIndex: 30, flexShrink: 0,
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 8px', borderRadius: 8,
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--color-fm-green-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'var(--color-fm-green)',
                fontFamily: 'var(--font-sans)',
              }}>
                {initials}
              </div>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-fm-ink)',
                fontWeight: 500, maxWidth: 140, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {displayName}
              </span>
              <ChevronDown size={14} color="var(--color-fm-ink3)" />
            </button>

            {userMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setUserMenuOpen(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 6,
                  background: '#fff', borderRadius: 10,
                  border: '1.5px solid var(--color-fm-line-soft)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: 160,
                  zIndex: 50, overflow: 'hidden',
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-fm-line-soft)' }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-fm-ink3)' }}>Signed in as</div>
                    <div style={{
                      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                      color: 'var(--color-fm-ink)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '10px 14px', background: 'none',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-sans)', fontSize: 13, color: '#dc2626',
                    }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: 24 }}>
          {children}
        </main>
      </div>

      <Toaster position="bottom-right" />
    </div>
  )
}
