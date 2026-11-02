import { create } from 'zustand'
import type { CartItem } from '@/types/cart'

interface CartStore {
  items: CartItem[]
  selectedBranchId: string | null
  clear: () => void
  updateQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  selectedBranchId: null,
  clear: () => set({ items: [] }),
  updateQuantity: (productId, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return
    set((state) => ({ items: state.items.map((item) => item.productId === productId ? { ...item, quantity } : item) }))
  },
  remove: (productId) => set((state) => ({ items: state.items.filter((item) => item.productId !== productId) })),
}))
