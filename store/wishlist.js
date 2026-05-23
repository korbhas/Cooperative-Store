import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlistStore = create()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),

      isWishlisted: (productId) => get().productIds.includes(productId),

      clear: () => set({ productIds: [] }),
    }),
    { name: 'freshmart_wishlist' }
  )
)
