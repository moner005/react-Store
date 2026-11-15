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
  revision: string
  latestOrder: StoredOrder | null
}

export interface OrderReceipt {
  id: string
  createdAt: string
  items: Array<{ productId: string; name: string; quantity: number; unitPriceCents: number; lineTotalCents: number }>
  totalCents: number
}

export interface StoredOrder extends OrderReceipt {
  branchId: 'damascus' | 'latakia'
  reviewedRevision: string
}
