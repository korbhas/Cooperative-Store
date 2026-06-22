import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCheckoutStore = create()(
  persist(
    (set) => ({
      address: null, // { name, phone, address }
      coupon: null, // validated coupon object from /api/coupons/validate
      redeemPoints: false, // apply loyalty points balance at payment

      setAddress: (address) => set({ address }),
      setCoupon: (coupon) => set({ coupon }),
      setRedeemPoints: (redeemPoints) => set({ redeemPoints }),
      clear: () => set({ address: null, coupon: null, redeemPoints: false }),
    }),
    { name: 'freshmart_checkout' }
  )
)
