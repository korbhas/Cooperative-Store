'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconCheck } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

const STEPS = [
  { href: '/checkout/address', label: 'Address' },
  { href: '/checkout/payment', label: 'Payment' },
]

export default function CheckoutSteps() {
  const pathname = usePathname()
  const activeIndex = STEPS.findIndex((s) => pathname.startsWith(s.href))

  return (
    <ol className="mb-6 flex items-center gap-3">
      {STEPS.map((step, i) => {
        const isActive = i === activeIndex
        const isDone = i < activeIndex

        const marker = (
          <span
            className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
              isActive && 'bg-primary text-primary-foreground',
              isDone && 'bg-secondary text-secondary-foreground',
              !isActive && !isDone && 'border border-border text-muted-foreground'
            )}
          >
            {isDone ? <IconCheck className="size-3.5" /> : i + 1}
          </span>
        )

        const label = (
          <span
            className={cn(
              'text-sm font-medium',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            {step.label}
          </span>
        )

        return (
          <li key={step.href} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden className="h-px w-8 bg-border" />}
            {isDone ? (
              // Completed steps link back for editing
              <Link href={step.href} className="flex items-center gap-2 hover:opacity-80">
                {marker}
                {label}
              </Link>
            ) : (
              <span
                className="flex items-center gap-2"
                aria-current={isActive ? 'step' : undefined}
              >
                {marker}
                {label}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
