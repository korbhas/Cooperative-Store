'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconMapPin, IconChevronRight } from '@tabler/icons-react'
import { useCartStore } from '@/store/cart'
import CartEmptyState from '../CartEmptyState'
import AddressForm from '@/components/checkout/AddressForm'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'

export default function AddressClient() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s) => s.items)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  if (items.length === 0) return <CartEmptyState />

  return (
    <Card className="mx-auto w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMapPin className="size-4 text-primary" /> Delivery Details
        </CardTitle>
        <CardDescription>Tell us where to deliver your order.</CardDescription>
      </CardHeader>
      <CardContent>
        <AddressForm
          formId="address-form"
          onSubmitted={() => router.push('/checkout/payment')}
        />
      </CardContent>
      <CardFooter>
        <Button type="submit" form="address-form" size="lg" className="w-full">
          Continue to Payment <IconChevronRight className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
