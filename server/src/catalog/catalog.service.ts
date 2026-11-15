import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { MongoService } from '../database/mongo.service.js'
import { CATALOG_COLLECTION, CATALOG_OPERATION_TIMEOUT_MS } from './catalog.constants.js'
import type { CatalogDocument, CatalogModel, CatalogPage } from './catalog.types.js'
import type { CatalogListQuery } from './catalog-query.js'
import { localThumbnailUrl } from './catalog-photos.js'

@Injectable()
export class CatalogService {
  constructor(@Inject(MongoService) private readonly mongo: MongoService) {}

  async list(query: CatalogListQuery): Promise<CatalogPage> {
    if (query.brand !== 'rolex') {
      return { data: [], page: query.page, pageSize: query.pageSize, total: 0, totalPages: 0 }
    }
    const database = await this.mongo.getDatabase()
    const collection = database.collection<CatalogDocument>(CATALOG_COLLECTION)
    const filter: Record<string, unknown> = {}
    if (query.category) filter['series.slug'] = query.category
    if (query.branch) filter.branchId = query.branch
    if (query.gender) filter.gender = query.gender
    if (query.q) filter.name = { $regex: escapeRegex(query.q), $options: 'i' }
    const sort: Record<string, 1 | -1> = query.sort === 'price-asc'
      ? { priceCents: 1, position: 1, slug: 1 }
      : query.sort === 'price-desc'
        ? { priceCents: -1, position: 1, slug: 1 }
        : { position: 1, slug: 1 }
    const [total, documents] = await Promise.all([
      collection.countDocuments(filter, { timeoutMS: CATALOG_OPERATION_TIMEOUT_MS }),
      collection.find(filter, { timeoutMS: CATALOG_OPERATION_TIMEOUT_MS })
        .sort(sort)
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .toArray(),
    ])
    return {
      data: documents.map(toPublicModel),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    }
  }

  async categories(): Promise<CatalogModel['series'][]> {
    const database = await this.mongo.getDatabase()
    const collection = database.collection<CatalogDocument>(CATALOG_COLLECTION)
    return collection.aggregate<CatalogModel['series']>([
      { $group: { _id: '$series.slug', series: { $first: '$series' } } },
      { $project: { _id: 0, name: '$series.name', slug: '$series.slug' } },
      { $sort: { name: 1, slug: 1 } },
    ], { timeoutMS: CATALOG_OPERATION_TIMEOUT_MS }).toArray()
  }

  async findOne(brand: string, slug: string): Promise<CatalogModel> {
    if (brand !== 'rolex') throw new NotFoundException()
    const database = await this.mongo.getDatabase()
    const collection = database.collection<CatalogDocument>(CATALOG_COLLECTION)
    const document = await collection.findOne(
      { slug },
      { timeoutMS: CATALOG_OPERATION_TIMEOUT_MS },
    )
    if (!document) throw new NotFoundException()
    return toPublicModel(document)
  }
}
function toPublicModel(document: CatalogDocument): CatalogModel {
  return {
    id: document.id,
    name: document.name,
    slug: document.slug,
    thumbnailUrl: localThumbnailUrl(document.slug),
    series: { name: document.series.name, slug: document.series.slug },
    sourceUrl: document.sourceUrl,
    priceCents: document.priceCents,
    branchId: document.branchId,
    gender: document.gender,
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
