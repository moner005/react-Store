import { apiClient } from '@/services/apiClient'
import type { StoreBranch } from '@/constants/routes'

export type CatalogGender = 'men' | 'women' | 'unisex'
export type CatalogSort = 'price-asc' | 'price-desc'

export interface CatalogFilters {
  category?: string
  branch?: StoreBranch
  q?: string
  gender?: CatalogGender
  sort?: CatalogSort
}

export interface CatalogCategory {
  name: string
  slug: string
}

export interface Watch {
  id: string
  name: string
  slug: string
  thumbnailUrl: string
  series: Pick<CatalogCategory, 'name' | 'slug'>
  sourceUrl: string
  priceCents: number
  branchId: StoreBranch
  gender: CatalogGender
}

export interface WatchesResponse {
  data: Watch[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export async function getRolexWatches(page = 1, signal?: AbortSignal, category?: string, branch?: StoreBranch, filters: Omit<CatalogFilters, 'category' | 'branch'> = {}): Promise<WatchesResponse> {
  const { data } = await apiClient.get<WatchesResponse>('/api/v1/models', {
    params: { brand: 'rolex', page, pageSize: 24, category, branch, q: filters.q, gender: filters.gender, sort: filters.sort },
    signal,
  })
  if (!Array.isArray(data?.data) || !Number.isSafeInteger(data.total) || !Number.isSafeInteger(data.totalPages)) {
    throw new Error('The catalog returned an invalid response.')
  }
  return data
}

export async function getCatalogCategories(signal?: AbortSignal): Promise<CatalogCategory[]> {
  const { data } = await apiClient.get<CatalogCategory[]>('/api/v1/models/categories', { signal })
  return data
}

export async function getRolexWatch(slug: string, signal?: AbortSignal): Promise<Watch> {
  const { data } = await apiClient.get<Watch>('/api/v1/models/rolex/' + encodeURIComponent(slug), { signal })
  return data
}

export function productPhotoUrl(path: string | undefined): string {
  if (!path) return ''
  if (/^\/catalog-images\/rolex\/[a-z0-9-]+\.png$/.test(path)) {
    return apiClient.getUri({ url: path })
  }
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : ''
}
