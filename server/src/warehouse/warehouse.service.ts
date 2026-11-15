import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { MongoService } from '../database/mongo.service.js'
import { CATALOG_COLLECTION } from '../catalog/catalog.constants.js'
import type { CatalogDocument } from '../catalog/catalog.types.js'
import type { PublicAccount } from '../auth/auth.types.js'

const RECEIPTS = 'warehouse_receipts'
const TIMEOUT_MS = 4_000
const RECEIPT_LIMIT = 25

interface ReceiptDocument {
  _id: string
  productId: string
  product: { id: string; name: string; slug: string }
  quantity: number
  receivedAt: Date
  receivedBy: string
}

@Injectable()
export class WarehouseService {
  constructor(@Inject(MongoService) private readonly mongo: MongoService) {}

  async searchProducts(query: string) {
    const q = query.trim()
    if (q.length < 2) return []
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const db = await this.mongo.getDatabase()
    return db.collection<CatalogDocument>(CATALOG_COLLECTION)
      .find({ $or: [
        { name: { $regex: escaped, $options: 'i' } },
        { slug: { $regex: escaped, $options: 'i' } },
      ] }, { projection: { _id: 0, id: 1, name: 1, slug: 1 }, timeoutMS: TIMEOUT_MS })
      .limit(20).toArray()
  }

  async overview() {
    const db = await this.mongo.getDatabase()
    const receipts = db.collection<ReceiptDocument>(RECEIPTS)
    const view = await receipts.aggregate<{
      balances: { product: ReceiptDocument['product']; quantity: number }[]
      receipts: ReturnType<typeof toReceipt>[]
    }>([
      {
        $facet: {
          balances: [
            { $group: {
              _id: '$productId',
              product: { $top: { sortBy: { receivedAt: -1, _id: -1 }, output: '$product' } },
              quantity: { $sum: '$quantity' },
            } },
            { $sort: { 'product.name': 1, _id: 1 } },
            { $project: { _id: 0, product: { id: '$product.id', name: '$product.name', slug: '$product.slug' }, quantity: 1 } },
          ],
          receipts: [
            { $sort: { receivedAt: -1, _id: -1 } },
            { $limit: RECEIPT_LIMIT },
            { $project: {
              _id: 0,
              requestId: '$_id',
              product: { id: '$product.id', name: '$product.name', slug: '$product.slug' },
              quantity: 1,
              receivedAt: 1,
            } },
          ],
        },
      },
    ], { maxTimeMS: TIMEOUT_MS }).next()
    return view ?? { balances: [], receipts: [] }
  }

  async receive(requestId: string, productId: string, quantity: number, owner: PublicAccount) {
    const db = await this.mongo.getDatabase()
    const receipts = db.collection<ReceiptDocument>(RECEIPTS)
    const saved = await receipts.findOne({ _id: requestId })
    if (saved) return matchReceipt(saved, productId, quantity)
    const product = await db.collection<CatalogDocument>(CATALOG_COLLECTION).findOne(
      { id: productId },
      { projection: { _id: 0, id: 1, name: 1, slug: 1 }, timeoutMS: TIMEOUT_MS },
    )
    if (!product) throw new NotFoundException()
    const receipt: ReceiptDocument = {
      _id: requestId,
      productId,
      product,
      quantity,
      receivedAt: new Date(),
      receivedBy: owner.id,
    }
    try {
      await receipts.insertOne(receipt, { writeConcern: { w: 'majority' } })
      return toReceipt(receipt)
    } catch (error) {
      if (!isDuplicateKey(error)) throw error
      const existing = await receipts.findOne({ _id: requestId })
      if (existing) return matchReceipt(existing, productId, quantity)
      throw error
    }
  }
}

function matchReceipt(receipt: ReceiptDocument, productId: string, quantity: number) {
  if (receipt.productId === productId && receipt.quantity === quantity) return toReceipt(receipt)
  throw new ConflictException({ code: 'warehouse_receipt_conflict' })
}

function toReceipt(receipt: ReceiptDocument) {
  const product = { id: receipt.product.id, name: receipt.product.name, slug: receipt.product.slug }
  return { requestId: receipt._id, product, quantity: receipt.quantity, receivedAt: receipt.receivedAt }
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000
}
