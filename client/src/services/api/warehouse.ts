import { apiClient } from '@/services/apiClient'

export interface WarehouseProduct {
  id: string
  name: string
  slug: string
}

export interface WarehouseBalance {
  product: WarehouseProduct
  quantity: number
}

export interface WarehouseReceipt {
  requestId: string
  product: WarehouseProduct
  quantity: number
  receivedAt: string
}

export interface WarehouseOverview {
  balances: WarehouseBalance[]
  receipts: WarehouseReceipt[]
}

const managementUrl = '/api/v1/management/warehouse'
const requestOptions = { withCredentials: true }

export async function getWarehouseOverview(signal?: AbortSignal): Promise<WarehouseOverview> {
  const response = await apiClient.get<WarehouseOverview>(managementUrl, { ...requestOptions, signal })
  return response.data
}

export async function searchWarehouseProducts(query: string, signal?: AbortSignal): Promise<WarehouseProduct[]> {
  const response = await apiClient.get<WarehouseProduct[]>(managementUrl + '/products', {
    ...requestOptions,
    params: { q: query },
    signal,
  })
  return response.data
}

export async function createWarehouseReceipt(requestId: string, productId: string, quantity: number): Promise<WarehouseReceipt> {
  const response = await apiClient.put<WarehouseReceipt>(
    `${managementUrl}/receipts/${encodeURIComponent(requestId)}`,
    { productId, quantity },
    requestOptions,
  )
  const receipt = response.data
  if (receipt?.requestId !== requestId || receipt.product?.id !== productId
    || receipt.quantity !== quantity || !Number.isFinite(Date.parse(receipt.receivedAt))) {
    throw new Error('The server did not confirm this receipt.')
  }
  return receipt
}
