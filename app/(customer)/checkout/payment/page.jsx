import { getSettings } from '@/lib/settings'
import PaymentClient from './PaymentClient'

export const revalidate = 300 // re-fetch settings at most every 5 minutes

export const metadata = { title: 'Checkout — Payment' }

export default async function PaymentPage() {
  const { deliveryFee, freeDeliveryThreshold } = await getSettings()
  return (
    <PaymentClient
      deliveryFee={deliveryFee}
      freeDeliveryThreshold={freeDeliveryThreshold}
    />
  )
}
