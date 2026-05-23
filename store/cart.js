import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCartStore = create()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === product.productId && i.variantId === product.variantId
          )
          if (existing) {
            const newQty = existing.quantity + quantity
            if (newQty > product.stockQty) return state
            return {
              items: state.items.map((i) =>
                i.productId === product.productId && i.variantId === product.variantId
                  ? { ...i, quantity: newQty }
                  : i
              ),
            }
          }
          if (quantity > product.stockQty) return state
          return {
            items: [...state.items, { ...product, id: Date.now(), quantity }],
          }
        })
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id !== id) return i
            if (quantity > i.stockQty) return i
            return { ...i, quantity }
          }),
        }))
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [] }),

      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'freshmart_cart' }
  )
)
