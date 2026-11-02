export interface CartItem {
  productId: string
  quantity: number
  product?: { name: string; priceMinor: number; currency: 'USD'; imageUrl?: string }
}

export interface CartState {
  items: CartItem[]
  selectedBranchId: string | null
}
