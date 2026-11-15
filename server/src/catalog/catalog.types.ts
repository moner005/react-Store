export interface CatalogTaxonomy {
  id: string
  name: string
  slug: string
}

export interface CatalogRecord {
  id: string
  name: string
  referenceNumber: string
  slug: string
  thumbnailUrl: string
  brand: CatalogTaxonomy
  series: CatalogTaxonomy
  sourceUrl: string
}

export interface CatalogModel {
  id: string
  name: string
  slug: string
  series: Pick<CatalogTaxonomy, 'name' | 'slug'>
  sourceUrl: string
  thumbnailUrl: string
  priceCents: number
  branchId: 'damascus' | 'latakia'
  gender: CatalogGender
}

export type CatalogGender = 'men' | 'women' | 'unisex'

export interface CatalogDocument extends Omit<CatalogModel, 'thumbnailUrl'> {
  _id?: unknown
  position: number
}

export interface CatalogPage {
  data: CatalogModel[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
