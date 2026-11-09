
export interface CartProduct {
  id: string
  name: string
  price: number | null
  image?: string
  referenceNumber?: string
}

export interface CartItem {
  productId: string
  quantity: number
  product: CartProduct
}

export interface CartState {
  items: CartItem[]
  selectedBranchId: string | null
}
