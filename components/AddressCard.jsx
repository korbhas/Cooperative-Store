import { IconUser, IconMapPin, IconPhone, IconMail } from '@tabler/icons-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * Read-only address display card (adapted from stackzero Address_02).
 * value: { name?, address?, phone?, email? } — address may be multi-line.
 */
export default function AddressCard({ value, title = 'Address', badge, className, children }) {
  const hasData = value && (value.name || value.address)

  return (
    <Card className={cn('gap-0', className)}>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b pb-3 [.border-b]:pb-3">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {badge && (
          <Badge variant="secondary" className="text-xs">
            {badge}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {hasData ? (
          <div className="space-y-3">
            {value.name && (
              <div className="flex items-center gap-2">
                <IconUser className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">{value.name}</span>
              </div>
            )}

            {value.address && (
              <div className="flex items-start gap-2">
                <IconMapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="text-sm leading-relaxed whitespace-pre-line">{value.address}</div>
              </div>
            )}

            {value.phone && (
              <div className="flex items-center gap-2">
                <IconPhone className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{value.phone}</span>
              </div>
            )}

            {value.email && (
              <div className="flex items-center gap-2">
                <IconMail className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-sm">{value.email}</span>
              </div>
            )}

            {children}
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <IconMapPin className="mx-auto mb-2 size-8 opacity-50" />
            <p className="text-sm">No address information available</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
