import { createHash } from 'node:crypto'
import type { Collection } from 'mongodb'
import type { CatalogDocument, CatalogGender } from './catalog.types.js'

export type CatalogBranchId = 'damascus' | 'latakia'
export interface CatalogMembershipInput {
  id: string
  seriesSlug: string
  branchId?: unknown
}
export interface CatalogMembership {
  id: string
  branchId: CatalogBranchId
  gender: CatalogGender
}

const WOMEN_SERIES = new Set([
  'lady-datejust', 'datejust-31', 'pearlmaster', 'oyster-perpetual-26', 'oyster-perpetual-28', 'oyster-perpetual-31',
])
const MEN_SERIES = new Set([
  'datejust-41', 'datejust-ii', 'day-date-40', 'day-date-ii', 'oyster-perpetual-39', 'oyster-perpetual-41',
  'sea-dweller', 'sky-dweller', 'submariner', 'gmt-master', 'explorer-ii', 'milgauss', 'air-king', 'daytona',
])

export function classifyCatalogGender(seriesSlug: string): CatalogGender {
  if (WOMEN_SERIES.has(seriesSlug)) return 'women'
  if (MEN_SERIES.has(seriesSlug)) return 'men'
  return 'unisex'
}

function rank(id: string): string { return createHash('sha256').update(id, 'utf8').digest('hex') }

export function assignCatalogMemberships(records: CatalogMembershipInput[]): CatalogMembership[] {
  const seen = new Set<string>()
  for (const record of records) {
    if (!record.id || !record.seriesSlug || seen.has(record.id)) throw new Error('Catalog membership records must have unique IDs and series slugs.')
    seen.add(record.id)
  }

  const targetDamascus = Math.ceil(records.length / 2)
  const assigned = new Map<string, CatalogBranchId>()
  let damascus = 0
  for (const record of records) {
    if (record.branchId === 'damascus' || record.branchId === 'latakia') {
      assigned.set(record.id, record.branchId)
      if (record.branchId === 'damascus') damascus += 1
    }
  }

  const unassigned = records.filter((record) => !assigned.has(record.id))
    .map((record) => ({ record, rank: rank(record.id) }))
    .sort((a, b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : a.record.id < b.record.id ? -1 : a.record.id > b.record.id ? 1 : 0)
  const damascusDeficit = Math.max(targetDamascus - damascus, 0)

  for (const [{ record }, index] of unassigned.map((entry, index) => [entry, index] as const)) {
    const branch: CatalogBranchId = index < damascusDeficit ? 'damascus' : 'latakia'
    assigned.set(record.id, branch)
    if (branch === 'damascus') damascus += 1
  }

  return records.map((record) => ({
    id: record.id,
    branchId: assigned.get(record.id)!,
    gender: classifyCatalogGender(record.seriesSlug),
  }))
}

export async function assignStoredCatalogMemberships(collection: Collection<CatalogDocument>, timeoutMS: number): Promise<number> {
  const stored = await collection.find({}, {
    projection: { _id: 0, id: 1, branchId: 1, gender: 1, 'series.slug': 1 },
    timeoutMS,
  }).toArray()
  const memberships = assignCatalogMemberships(stored.map((record) => ({
    id: record.id,
    seriesSlug: record.series.slug,
    branchId: record.branchId,
  })))
  const storedBranches = new Map(stored.map((record) => [record.id, record.branchId]))
  const storedGenders = new Map(stored.map((record) => [record.id, record.gender]))
  const branchWrites = memberships
    .filter((membership) => storedBranches.get(membership.id) !== 'damascus' && storedBranches.get(membership.id) !== 'latakia')
    .map(({ id, branchId }) => ({
      updateOne: {
        filter: { id, branchId: { $nin: ['damascus', 'latakia'] as const } },
        update: { $set: { branchId } },
        upsert: false,
      },
    }))
  if (branchWrites.length) await collection.bulkWrite(branchWrites, { ordered: false, timeoutMS })

  const genderWrites = memberships.filter(({ id, gender }) => storedGenders.get(id) !== gender).map(({ id, gender }) => ({
    updateOne: { filter: { id }, update: { $set: { gender } }, upsert: false },
  }))
  if (genderWrites.length) await collection.bulkWrite(genderWrites, { ordered: false, timeoutMS })
  return memberships.length
}
