'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Tag, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Tag, label: 'Offers', href: '/products' },
  { icon: Settings, label: 'Settings', href: '/settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex h-14 items-stretch border-t bg-white"
      style={{ borderColor: 'var(--color-fm-line-soft)' }}
    >
      {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={label}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors"
            style={{ color: active ? 'var(--color-fm-green)' : 'var(--color-fm-ink3)' }}
          >
            <Icon size={18} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
