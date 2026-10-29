import { create } from 'zustand'
import type { CartItem } from '@/types/cart'

interface CartStore {
  items: CartItem[]
  selectedBranchId: string | null
  clear: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  selectedBranchId: null,
  clear: () => set({ items: [] }),
}))
