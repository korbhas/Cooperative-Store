'use client'

import { useState } from 'react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  IconClock, IconPackage, IconTruck, IconCircleCheck,
  IconChevronDown, IconAlertCircle,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'

// Happy-path progression. cancelled / refunded are terminal off-flow states.
const FLOW = [
  { key: 'pending', label: 'Order placed', icon: IconClock },
  { key: 'processing', label: 'Processing', icon: IconPackage },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: IconTruck },
  { key: 'delivered', label: 'Delivered', icon: IconCircleCheck },
]

const PILL = {
  pending:          { bg: 'var(--color-fm-paper2)',      text: 'var(--color-fm-ink3)',     label: 'Pending' },
  processing:       { bg: 'var(--color-fm-accent-soft)', text: 'var(--color-fm-accent)',   label: 'Processing' },
  out_for_delivery: { bg: 'var(--color-fm-accent-soft)', text: 'var(--color-fm-accent)',   label: 'Out for Delivery' },
  delivered:        { bg: 'var(--color-fm-green-soft)',  text: 'var(--color-fm-green-ink)', label: 'Delivered' },
  cancelled:        { bg: 'var(--color-fm-danger-soft)',  text: 'var(--color-fm-danger)',   label: 'Cancelled' },
  refunded:         { bg: 'var(--color-fm-danger-soft)',  text: 'var(--color-fm-danger)',   label: 'Refunded' },
}

function StatusPill({ status }) {
  const s = PILL[status] ?? PILL.pending
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  )
}

export default function OrderStatusTimeline({ status, createdAt, defaultOpen = false, className }) {
  const [open, setOpen] = useState(defaultOpen)
  const terminalBad = status === 'cancelled' || status === 'refunded'
  const currentIndex = FLOW.findIndex((s) => s.key === status)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}
    >
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-foreground">Order status</span>
          <StatusPill status={status} />
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {open ? 'Hide' : 'Track'}
          <IconChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-border px-4 py-4">
        {terminalBad ? (
          <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-fm-danger)' }}>
            <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>
              This order was {PILL[status].label.toLowerCase()}.
              {status === 'refunded' && ' Your refund has been processed.'}
            </span>
          </div>
        ) : (
          <ol className="flex flex-col">
            {FLOW.map((step, i) => {
              const done = i <= currentIndex
              const current = i === currentIndex
              const last = i === FLOW.length - 1
              const Icon = step.icon
              return (
                <li key={step.key} className="flex gap-3">
                  {/* Icon + connector */}
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full',
                        done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    {!last && (
                      <span
                        className={cn('w-0.5 flex-1', i < currentIndex ? 'bg-primary' : 'bg-border')}
                        style={{ minHeight: 18 }}
                      />
                    )}
                  </div>
                  {/* Label */}
                  <div className={cn('pb-4', last && 'pb-0')}>
                    <div
                      className={cn(
                        'text-sm',
                        current ? 'font-semibold text-foreground' : done ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </div>
                    {i === 0 && createdAt && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    {current && !last && (
                      <div className="text-xs" style={{ color: 'var(--color-fm-green-ink)' }}>In progress</div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
