'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  IconHome, IconTag, IconClipboardList, IconSettings,
  IconShoppingCart, IconUser, IconLogout, IconPhone, IconMenu2,
  IconChevronDown,
} from '@tabler/icons-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useCartStore } from '@/store/cart'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Placeholder store phone — wire to getSettings().storePhone later.
const STORE_PHONE = '+91 98765 43210'
const STORE_PHONE_TEL = '+919876543210'

// authOnly links only render when signed in.
const NAV_ITEMS = [
  { icon: IconHome, label: 'Home', href: '/' },
  { icon: IconTag, label: 'Products', href: '/products' },
  { icon: IconClipboardList, label: 'Orders', href: '/orders', authOnly: true },
  { icon: IconSettings, label: 'Settings', href: '/settings', authOnly: true },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const totalItems = useCartStore((s) => s.totalItems())
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()

  const [mounted, setMounted] = useState(false)
  const [sticky, setSticky] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let active = true
    fetch('/api/products/categories')
      .then((r) => r.json())
      .then((d) => { if (active) setCategories(Array.isArray(d) ? d : []) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  const handleScroll = useCallback(() => setSticky(window.scrollY >= 50), [])
  const handleResize = useCallback(() => {
    if (window.innerWidth >= 1024) setMenuOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [handleScroll, handleResize])

  // Navbar is customer-only.
  if (pathname.startsWith('/admin')) return null

  const signedIn = isLoaded && isSignedIn
  const links = NAV_ITEMS.filter((i) => !i.authOnly || signedIn)
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const displayName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User'

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <nav
          className={cn(
            'flex items-center justify-between gap-3 border transition-all duration-500',
            sticky
              ? 'rounded-full border-border/40 bg-background/70 p-2 shadow-xl shadow-primary/5 backdrop-blur-lg'
              : 'border-transparent bg-transparent p-1'
          )}
        >
          {/* Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2 ps-1">
            <span
              className="flex size-7 items-center justify-center rounded-lg text-[10px] font-extrabold text-white"
              style={{ background: 'var(--color-fm-accent)', fontFamily: 'var(--font-heading)' }}
            >
              FM
            </span>
            <span
              className="hidden text-[15px] font-bold sm:inline"
              style={{ color: 'var(--color-fm-green)', fontFamily: 'var(--font-heading)' }}
            >
              FreshMart
            </span>
          </Link>

          {/* Center nav */}
          <NavigationMenu className="max-lg:hidden rounded-full bg-muted p-0.5">
            <NavigationMenuList className="gap-0">
              {links.map(({ label, href }) => {
                const active = isActive(href)
                return (
                  <NavigationMenuItem key={href}>
                    <NavigationMenuLink
                      active={active}
                      render={<Link href={href} />}
                      className={cn(
                        'rounded-full px-4 py-1.5 text-sm font-medium transition',
                        active
                          ? 'bg-background text-foreground shadow-xs'
                          : 'text-muted-foreground hover:bg-background hover:text-foreground'
                      )}
                    >
                      {label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              })}

              {/* Categories dropdown */}
              {categories.length > 0 && (
                <NavigationMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground outline-none transition hover:bg-background hover:text-foreground aria-expanded:bg-background aria-expanded:text-foreground">
                      Categories
                      <IconChevronDown className="size-3.5 transition-transform aria-expanded:rotate-180" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="max-h-80 w-52 overflow-y-auto">
                      {categories.map((c) => (
                        <DropdownMenuItem key={c.id} render={<Link href={`/products?category=${c.slug}`} />}>
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Orders — mobile top bar only (desktop has it in the center nav).
                Always shown; /orders is auth-gated by middleware (redirects to login). */}
            <Link
              href="/orders"
              aria-label="Orders"
              className="lg:hidden flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
            >
              <IconClipboardList className="size-4" />
            </Link>

            {/* Store phone */}
            <a
              href={`tel:${STORE_PHONE_TEL}`}
              className="hidden items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted md:inline-flex"
            >
              <IconPhone className="size-4" style={{ color: 'var(--color-fm-green)' }} />
              {STORE_PHONE}
            </a>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-muted"
            >
              <IconShoppingCart className="size-4" />
              {mounted && totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ background: 'var(--color-fm-accent)' }}
                >
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Auth — desktop */}
            {signedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className="max-lg:hidden flex items-center rounded-full outline-none"
                >
                  <Avatar className="size-9">
                    <AvatarImage src={user?.imageUrl} alt={displayName} />
                    <AvatarFallback>
                      <IconUser className="size-4 opacity-60" aria-hidden="true" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem render={<Link href="/orders" />}>
                    <IconClipboardList className="size-4" /> Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/settings" />}>
                    <IconSettings className="size-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <IconLogout className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="max-lg:hidden inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ background: 'var(--color-fm-green)' }}
              >
                <IconUser className="size-4" /> Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger
                aria-label="Menu"
                className="lg:hidden flex size-9 items-center justify-center rounded-full border border-border bg-background outline-none"
              >
                <IconMenu2 className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {links.map(({ icon: Icon, label, href }) => (
                  <DropdownMenuItem key={href} render={<Link href={href} />}>
                    <Icon className="size-4" /> {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<a href={`tel:${STORE_PHONE_TEL}`} />}>
                  <IconPhone className="size-4" /> {STORE_PHONE}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {signedIn ? (
                  <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                    <IconLogout className="size-4" /> Sign out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem render={<Link href="/login" />}>
                    <IconUser className="size-4" /> Sign In
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  )
}
