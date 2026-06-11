import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCheckoutStore = create()(
  persist(
    (set) => ({
      address: null, // { name, phone, address }
      coupon: null, // validated coupon object from /api/coupons/validate

      setAddress: (address) => set({ address }),
      setCoupon: (coupon) => set({ coupon }),
      clear: () => set({ address: null, coupon: null }),
    }),
    { name: 'freshmart_checkout' }
  )
)
