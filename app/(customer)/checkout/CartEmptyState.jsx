'use client'

import Link from 'next/link'
import { IconShoppingBag } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export default function CartEmptyState() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6">
      <IconShoppingBag size={48} className="text-muted-foreground" />
      <p className="font-heading text-lg font-bold">Your cart is empty</p>
      <Button render={<Link href="/products" />}>Browse Products</Button>
    </div>
  )
}
