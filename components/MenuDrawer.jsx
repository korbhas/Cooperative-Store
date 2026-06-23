'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IconChevronRight, IconHome, IconTag, IconClipboardList,
  IconSettings, IconPhone, IconUser, IconLogout,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'

const itemClass =
  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted'
const subItemClass =
  'flex w-full items-center rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

// Left-side mobile menu drawer with expandable sections.
// Wrap the trigger element: <MenuDrawer …><button>…</button></MenuDrawer>
export default function MenuDrawer({
  open,
  onOpenChange,
  categories = [],
  signedIn,
  onOpenSettings,
  onOpenOrders,
  onSignOut,
  phone,
  phoneTel,
  children,
}) {
  const [expandedSections, setExpandedSections] = useState([])

  const toggleSection = (section) =>
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    )

  const close = () => onOpenChange(false)

  return (
    <Drawer direction="left" open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle style={{ color: 'var(--color-fm-green)', fontFamily: 'var(--font-heading)' }}>
            TU Cooperative Store
          </DrawerTitle>
        </DrawerHeader>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 pt-0">
          <Link href="/" className={itemClass} onClick={close}>
            <IconHome className="size-4" /> Home
          </Link>

          {/* Products — expands into categories */}
          <div>
            <button
              type="button"
              className={cn(itemClass, 'cursor-pointer justify-between')}
              onClick={() => toggleSection('products')}
            >
              <span className="flex items-center gap-2">
                <IconTag className="size-4" /> Products
              </span>
              <IconChevronRight
                className={cn(
                  'size-4 transition-transform',
                  expandedSections.includes('products') && 'rotate-90'
                )}
              />
            </button>
            {expandedSections.includes('products') && (
              <div className="mt-1 ml-4 space-y-1">
                <Link href="/products" className={subItemClass} onClick={close}>
                  All Products
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.slug}`}
                    className={subItemClass}
                    onClick={close}
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {signedIn && (
            <button
              type="button"
              className={cn(itemClass, 'cursor-pointer')}
              onClick={() => {
                close()
                onOpenOrders()
              }}
            >
              <IconClipboardList className="size-4" /> Orders
            </button>
          )}

          {signedIn && (
            <button
              type="button"
              className={cn(itemClass, 'cursor-pointer')}
              onClick={() => {
                close()
                onOpenSettings()
              }}
            >
              <IconSettings className="size-4" /> Settings
            </button>
          )}

          <a href={`tel:${phoneTel}`} className={itemClass}>
            <IconPhone className="size-4" /> {phone}
          </a>
        </nav>

        <div className="border-t p-4">
          {signedIn ? (
            <button
              type="button"
              className={cn(itemClass, 'cursor-pointer text-destructive hover:text-destructive')}
              onClick={() => {
                close()
                onSignOut()
              }}
            >
              <IconLogout className="size-4" /> Sign out
            </button>
          ) : (
            <Link href="/login" className={itemClass} onClick={close}>
              <IconUser className="size-4" /> Sign In
            </Link>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
