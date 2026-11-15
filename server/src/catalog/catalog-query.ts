import { BadRequestException } from '@nestjs/common'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const ALLOWED_QUERY_KEYS = new Set(['brand', 'page', 'pageSize', 'category', 'branch', 'q', 'sort', 'gender'])

export type CatalogGender = 'men' | 'women' | 'unisex'
export type CatalogSort = 'price-asc' | 'price-desc'

export interface CatalogListQuery {
  brand: string
  page: number
  pageSize: number
  category?: string
  branch?: 'damascus' | 'latakia'
  q?: string
  sort?: CatalogSort
  gender?: CatalogGender
}

function readQueryString(query: Record<string, unknown>, key: string): string | undefined {
  const value = query[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') throw new BadRequestException()
  return value
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback
  if (!/^[1-9]\d*$/.test(value)) throw new BadRequestException()
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed)) throw new BadRequestException()
  return parsed
}

export function parseCatalogListQuery(query: Record<string, unknown>): CatalogListQuery {
  if (Object.keys(query).some((key) => !ALLOWED_QUERY_KEYS.has(key))) {
    throw new BadRequestException()
  }

  const brand = readQueryString(query, 'brand') ?? 'rolex'
  if (!SLUG_PATTERN.test(brand) || brand.length > 80) throw new BadRequestException()

  const page = parsePositiveInteger(readQueryString(query, 'page'), 1)
  const pageSize = parsePositiveInteger(readQueryString(query, 'pageSize'), 24)
  if (pageSize > 100 || !Number.isSafeInteger((page - 1) * pageSize)) {
    throw new BadRequestException()
  }

  const category = readQueryString(query, 'category')
  if (category !== undefined && (!SLUG_PATTERN.test(category) || category.length > 120)) {
    throw new BadRequestException()
  }
  const branch = readQueryString(query, 'branch')
  if (branch !== undefined && branch !== 'damascus' && branch !== 'latakia') throw new BadRequestException()
  const rawSearch = readQueryString(query, 'q')
  if (rawSearch !== undefined && (rawSearch.length > 100 || rawSearch.includes('\0'))) throw new BadRequestException()
  const search = rawSearch?.trim()
  const sort = readQueryString(query, 'sort')
  if (sort !== undefined && sort !== 'price-asc' && sort !== 'price-desc') throw new BadRequestException()
  const gender = readQueryString(query, 'gender')
  if (gender !== undefined && gender !== 'men' && gender !== 'women' && gender !== 'unisex') throw new BadRequestException()
  return {
    brand,
    page,
    pageSize,
    ...(category === undefined ? {} : { category }),
    ...(branch === undefined ? {} : { branch }),
    ...(search ? { q: search } : {}),
    ...(sort === undefined ? {} : { sort }),
    ...(gender === undefined ? {} : { gender }),
  }
}

export function validateBrandAndSlug(brand: string, slug: string): void {
  if (!SLUG_PATTERN.test(brand) || brand.length > 80 || !SLUG_PATTERN.test(slug) || slug.length > 160) {
    throw new BadRequestException()
  }
}
