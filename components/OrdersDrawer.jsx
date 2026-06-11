'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { IconPackage, IconChevronRight, IconShoppingBag } from '@tabler/icons-react'
import AddressCard from '@/components/AddressCard'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'
import PageLoader from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

const STATUS_STYLES = {
  pending:          { bg: 'var(--color-fm-paper2)',      text: 'var(--color-fm-ink3)',      label: 'Pending' },
  processing:       { bg: 'var(--color-fm-accent-soft)', text: 'var(--color-fm-accent)',    label: 'Processing' },
  out_for_delivery: { bg: 'var(--color-fm-accent-soft)', text: 'var(--color-fm-accent)',    label: 'Out for Delivery' },
  delivered:        { bg: 'var(--color-fm-green-soft)',  text: 'var(--color-fm-green-ink)', label: 'Delivered' },
  cancelled:        { bg: '#fdecea',                    text: '#c0392b',                   label: 'Cancelled' },
  refunded:         { bg: '#fdecea',                    text: '#c0392b',                   label: 'Refunded' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

// Right-side order history drawer: list of orders → per-order detail view.
// Controlled by the Navbar: <OrdersDrawer open={open} onOpenChange={setOpen} />
export default function OrdersDrawer({ open, onOpenChange }) {
  const [orders, setOrders] = useState(null) // null = loading
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setOrders(null)
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => { if (active) setOrders(Array.isArray(d) ? d : []) })
      .catch(() => { if (active) setOrders([]) })
    return () => { active = false }
  }, [open])

  function handleOpenChange(next) {
    onOpenChange(next)
    if (!next) setSelected(null)
  }

  const subtotal = selected
    ? selected.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
    : 0
  const delivery = selected ? selected.totalAmount - subtotal + selected.discountAmount : 0

  return (
    <Drawer direction="right" open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{selected ? `Order #${selected.id}` : 'My Orders'}</DrawerTitle>
          <DrawerDescription>
            {selected
              ? `Placed on ${new Date(selected.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : orders === null
                ? 'Loading your orders…'
                : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
          </DrawerDescription>
        </DrawerHeader>

        {selected ? (
          /* ── Detail view ─────────────────────────────────────────── */
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <OrderStatusTimeline
                status={selected.status}
                createdAt={selected.createdAt}
                defaultOpen
              />

              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold">Items</h4>
                {selected.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">
                      {item.name}
                      {item.variantName ? ` (${item.variantName})` : ''} ×{item.quantity}
                    </span>
                    <span className="shrink-0">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span style={delivery <= 0 ? { color: 'var(--color-fm-green-ink)' } : undefined}>
                    {delivery <= 0 ? 'Free' : `₹${delivery.toFixed(2)}`}
                  </span>
                </div>
                {selected.discountAmount > 0 && (
                  <div className="flex justify-between text-sm" style={{ color: 'var(--color-fm-green-ink)' }}>
                    <span>Discount</span>
                    <span>−₹{selected.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span>₹{selected.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <AddressCard
                title="Delivery Address"
                value={{
                  name: selected.customerName,
                  address: selected.deliveryAddress,
                  phone: selected.customerPhone,
                  email: selected.customerEmail,
                }}
              />
            </div>

            <DrawerFooter>
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => setSelected(null)}
              >
                Back to Orders
              </Button>
            </DrawerFooter>
          </>
        ) : orders === null ? (
          /* ── Loading ─────────────────────────────────────────────── */
          <div className="flex flex-1 items-center justify-center p-4">
            <PageLoader label="Loading orders…" />
          </div>
        ) : orders.length === 0 ? (
          /* ── Empty state ─────────────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
            <IconShoppingBag size={48} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">No orders yet</p>
              <p className="text-xs text-muted-foreground">Your completed orders will appear here</p>
            </div>
            <DrawerClose asChild>
              <Link
                href="/products"
                className="rounded-lg px-6 py-2.5 text-sm font-medium text-white"
                style={{ background: 'var(--color-fm-green)' }}
              >
                Browse Products
              </Link>
            </DrawerClose>
          </div>
        ) : (
          /* ── List view ───────────────────────────────────────────── */
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
                onClick={() => setSelected(order)}
              >
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {order.thumbUrl ? (
                    <Image src={order.thumbUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center">
                      <IconPackage size={20} className="text-muted-foreground" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">Order #{order.id}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-bold">₹{order.totalAmount.toFixed(2)}</span>
                  <IconChevronRight size={16} className="text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}
