'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClerk } from '@clerk/nextjs'
import { IconLayoutDashboard, IconPackage, IconLayoutGrid, IconBuildingWarehouse, IconShoppingBag, IconUsers, IconTruck, IconTag, IconCreditCard, IconTrendingUp, IconSettings, IconLogout, IconChevronDown } from '@tabler/icons-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const NAV = [
  { label: 'Dashboard',  icon: IconLayoutDashboard, href: '/admin/dashboard' },
  { label: 'Products',   icon: IconPackage,         href: '/admin/products' },
  { label: 'Categories', icon: IconLayoutGrid,      href: '/admin/categories' },
  { label: 'Inventory',  icon: IconBuildingWarehouse,       href: '/admin/inventory' },
  { label: 'Orders',     icon: IconShoppingBag,     href: '/admin/orders' },
  { label: 'Customers',  icon: IconUsers,           href: '/admin/users' },
  { label: 'Delivery',   icon: IconTruck,           href: '/admin/delivery' },
  { label: 'Promotions', icon: IconTag,             href: '/admin/promotions' },
  { label: 'Payments',   icon: IconCreditCard,      href: '/admin/payments' },
  { label: 'Revenue',    icon: IconTrendingUp,      href: '/admin/revenue' },
  { label: 'Settings',   icon: IconSettings,        href: '/admin/settings' },
]

// FreshMart palette for the (admin-only) sidebar, scoped to this provider so
// the shadcn defaults in globals.css stay untouched for any future sidebar.
const SIDEBAR_THEME = {
  '--sidebar': 'var(--color-fm-green)',
  '--sidebar-foreground': 'rgba(255,255,255,0.7)',
  '--sidebar-accent': 'rgba(255,255,255,0.15)',
  '--sidebar-accent-foreground': '#ffffff',
  '--sidebar-primary': 'var(--color-fm-accent)',
  '--sidebar-primary-foreground': '#ffffff',
  '--sidebar-border': 'rgba(255,255,255,0.1)',
  '--sidebar-ring': 'var(--color-fm-accent)',
}

export default function AdminShell({ children, displayName, email, initials }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useClerk()

  async function handleLogout() {
    await signOut()
    router.push('/admin/login')
  }

  return (
    <SidebarProvider style={SIDEBAR_THEME}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-14 justify-center border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 overflow-hidden px-1">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-white"
              style={{ background: 'var(--color-fm-accent)', fontFamily: 'var(--font-heading)' }}
            >
              FM
            </div>
            <div className="grid leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                TU Cooperative Store
              </span>
              <span className="truncate text-[10px] uppercase tracking-widest text-white/50" style={{ fontFamily: 'var(--font-mono)' }}>
                Admin
              </span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ label, icon: Icon, href }) => {
                  const active = pathname === href || pathname.startsWith(href + '/')
                  return (
                    <SidebarMenuItem key={href}>
                      <SidebarMenuButton
                        render={<Link href={href} />}
                        isActive={active}
                        tooltip={label}
                      >
                        <Icon />
                        <span>{label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header
          className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-white px-4"
          style={{ borderBottom: '1.5px solid var(--color-fm-line-soft)' }}
        >
          <SidebarTrigger className="-ml-1" />

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-black/5">
              <div
                className="flex size-[30px] items-center justify-center rounded-full text-[11px] font-bold"
                style={{ background: 'var(--color-fm-green-soft)', color: 'var(--color-fm-green)' }}
              >
                {initials}
              </div>
              <span className="max-w-[140px] truncate text-[13px] font-medium" style={{ color: 'var(--color-fm-ink)' }}>
                {displayName}
              </span>
              <IconChevronDown size={14} color="var(--color-fm-ink3)" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[180px]">
              <DropdownMenuLabel>
                <div className="text-[11px] font-normal" style={{ color: 'var(--color-fm-ink3)' }}>Signed in as</div>
                <div className="truncate text-[13px] font-semibold" style={{ color: 'var(--color-fm-ink)' }}>{email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <IconLogout size={14} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6" style={{ background: '#f8fafc' }}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
