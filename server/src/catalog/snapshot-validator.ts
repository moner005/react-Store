import type { CatalogRecord, CatalogTaxonomy } from './catalog.types.js'

export interface CatalogSnapshot {
  version: 1
  source: 'Dials'
  sourceEndpoint: string
  capturedAt: string
  brand: 'rolex'
  total: number
  records: CatalogRecord[]
}

const ID_PATTERN = /^[a-f0-9]{28}$/
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const SOURCE_ENDPOINT = 'https://api.dials.co/v1/models?brand=rolex&pageSize=100&sort=newest'

export function validateCatalogSnapshot(input: unknown): CatalogSnapshot {
  if (!isRecord(input)
    || input.version !== 1
    || input.source !== 'Dials'
    || input.sourceEndpoint !== SOURCE_ENDPOINT
    || input.brand !== 'rolex'
    || !Number.isSafeInteger(input.total)
    || (input.total as number) <= 0
    || !isValidTimestamp(input.capturedAt)
    || !Array.isArray(input.records)
    || input.records.length !== input.total) {
    throw new Error('Catalog snapshot metadata or total is invalid')
  }

  const ids = new Set<string>()
  const slugs = new Set<string>()
  const records = input.records.map((rawRecord) => validateModel(rawRecord, ids, slugs))
  return {
    version: 1,
    source: 'Dials',
    sourceEndpoint: SOURCE_ENDPOINT,
    capturedAt: input.capturedAt,
    brand: 'rolex',
    total: input.total as number,
    records,
  }
}

function validateModel(input: unknown, ids: Set<string>, slugs: Set<string>): CatalogRecord {
  if (!isRecord(input)) throw new Error('Catalog record is invalid')
  const record = input
  const brand = validateTaxonomy(record.brand)
  const series = validateTaxonomy(record.series)
  const fields = ['id', 'name', 'referenceNumber', 'slug', 'thumbnailUrl', 'sourceUrl']
  if (fields.some((field) => typeof record[field] !== 'string')) {
    throw new Error('Catalog record is missing a required text field')
  }

  const model = record as unknown as CatalogRecord
  if (!ID_PATTERN.test(model.id)
    || ids.has(model.id)
    || !isSafeText(model.name, 240)
    || !isSafeText(model.referenceNumber, 100)
    || !isSafeSlug(model.slug, 160)
    || slugs.has(model.slug)
    || model.thumbnailUrl !== ''
    || brand.slug !== 'rolex'
    || brand.name !== 'Rolex'
    || !isSafeDialsSourceUrl(model.sourceUrl, series.slug, model.slug)) {
    throw new Error('Catalog record violates the snapshot shape or source constraints')
  }
  ids.add(model.id)
  slugs.add(model.slug)
  return {
    id: model.id,
    name: model.name,
    referenceNumber: model.referenceNumber,
    slug: model.slug,
    thumbnailUrl: model.thumbnailUrl,
    brand,
    series,
    sourceUrl: model.sourceUrl,
  }
}

function validateTaxonomy(input: unknown): CatalogTaxonomy {
  if (!isRecord(input)
    || typeof input.id !== 'string'
    || !ID_PATTERN.test(input.id)
    || typeof input.name !== 'string'
    || !isSafeText(input.name, 120)
    || typeof input.slug !== 'string'
    || !isSafeSlug(input.slug, 120)) {
    throw new Error('Catalog taxonomy is invalid')
  }
  return { id: input.id, name: input.name, slug: input.slug }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSafeText(value: string, maxLength: number): boolean {
  return value.trim().length > 0 && value.length <= maxLength && !/[\u0000-\u001f\u007f]/.test(value)
}

function isSafeSlug(value: string, maxLength: number): boolean {
  return value.length <= maxLength && SLUG_PATTERN.test(value)
}

function isValidTimestamp(value: unknown): value is string {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value)
    && Number.isFinite(Date.parse(value))
}

function isSafeDialsSourceUrl(value: string, seriesSlug: string, slug: string): boolean {
  return value === `https://dials.co/watches/rolex/${seriesSlug}/${slug}`
}
