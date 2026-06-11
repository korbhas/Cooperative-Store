'use client'

import Link from 'next/link'
import Image from 'next/image'
import { IconPackage, IconChevronRight } from '@tabler/icons-react'
import AddressCard from '@/components/AddressCard'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

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
    <div style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20,
      background: s.bg,
      fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600,
      color: s.text, flexShrink: 0,
    }}>
      {s.label}
    </div>
  )
}

// Order list card that opens a right-side details sheet on click.
export default function OrderCardSheet({ order }) {
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const delivery = order.totalAmount - subtotal + order.discountAmount

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            className="w-full cursor-pointer text-left"
            style={{
              background: '#fff', borderRadius: 12,
              border: '1.5px solid var(--color-fm-line-soft)',
              padding: '16px',
              display: 'flex', alignItems: 'center', gap: 14,
              transition: 'border-color 0.15s',
            }}
          />
        }
      >
        {/* Thumbnail */}
        <div style={{
          width: 56, height: 56, borderRadius: 10, flexShrink: 0,
          background: 'var(--color-fm-paper2)', overflow: 'hidden', position: 'relative',
        }}>
          {order.thumbUrl ? (
            <Image src={order.thumbUrl} alt="" fill style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPackage size={22} color="var(--color-fm-ink3)" />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: 'var(--color-fm-ink)' }}>
              Order #{order.id}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-fm-ink3)' }}>
            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
          </div>
        </div>

        {/* Amount + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-fm-ink)' }}>
            ₹{order.totalAmount.toFixed(2)}
          </div>
          <IconChevronRight size={16} color="var(--color-fm-ink3)" />
        </div>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Order #{order.id}</SheetTitle>
          <SheetDescription>
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          <OrderStatusTimeline status={order.status} createdAt={order.createdAt} defaultOpen />

          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-semibold">Items</h4>
            {order.items.map((item) => (
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
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm" style={{ color: 'var(--color-fm-green-ink)' }}>
                <span>Discount</span>
                <span>−₹{order.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-semibold">
              <span>Total</span>
              <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <AddressCard
            title="Delivery Address"
            value={{
              name: order.customerName,
              address: order.deliveryAddress,
              phone: order.customerPhone,
              email: order.customerEmail,
            }}
          />

          <Link
            href={`/orders/${order.id}`}
            className="mt-2 flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            View Full Details
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
