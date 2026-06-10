import { getSettings } from '@/lib/settings'
import CheckoutClient from './CheckoutClient'

export const revalidate = 300 // re-fetch settings at most every 5 minutes

export default async function CheckoutPage() {
  const { deliveryFee, freeDeliveryThreshold } = await getSettings()
  return (
    <CheckoutClient
      deliveryFee={deliveryFee}
      freeDeliveryThreshold={freeDeliveryThreshold}
    />
  )
}
