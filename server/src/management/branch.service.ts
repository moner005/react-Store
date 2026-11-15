import { Inject, Injectable } from '@nestjs/common'
import { MongoService } from '../database/mongo.service.js'
import type { BranchId } from '../auth/auth.types.js'

const branchNames = { damascus: 'Damascus', latakia: 'Latakia' } as const
const defaultSettings = { address: '', phone: '', openingHours: '' }
const timeoutMS = 4_000

interface BranchDocument {
  _id: BranchId
  address: string
  phone: string
  openingHours: string
}

@Injectable()
export class BranchService {
  constructor(@Inject(MongoService) private readonly mongo: MongoService) {}

  async list() {
    const database = await this.mongo.getDatabase()
    const saved = await database.collection<BranchDocument>('branch_settings').find({}, { timeoutMS }).toArray()
    return (Object.keys(branchNames) as BranchId[]).map((id) => this.details(id, saved.find((item) => item._id === id)))
  }

  async get(id: BranchId) {
    const database = await this.mongo.getDatabase()
    const saved = await database.collection<BranchDocument>('branch_settings').findOne({ _id: id }, { timeoutMS })
    return this.details(id, saved)
  }

  async update(id: BranchId, settings: Omit<BranchDocument, '_id'>) {
    const database = await this.mongo.getDatabase()
    await database.collection<BranchDocument>('branch_settings').updateOne(
      { _id: id }, { $set: settings }, { upsert: true, timeoutMS },
    )
    return this.details(id, settings)
  }

  private details(id: BranchId, saved: Omit<BranchDocument, '_id'> | BranchDocument | null | undefined) {
    const { address, phone, openingHours } = saved ?? defaultSettings
    return { id, name: branchNames[id], address, phone, openingHours }
  }
}
