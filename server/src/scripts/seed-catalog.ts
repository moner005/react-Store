import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { MongoClient } from 'mongodb'
import { loadConfig } from '../config/app-config.js'
import { validateCatalogSnapshot } from '../catalog/snapshot-validator.js'
import { CATALOG_COLLECTION } from '../catalog/catalog.constants.js'
import { assignStoredCatalogMemberships } from '../catalog/catalog-assignment.js'
import type { CatalogDocument } from '../catalog/catalog.types.js'

const SELECTION_TIMEOUT_MS = 10_000
const CONNECT_TIMEOUT_MS = 10_000
const BULK_TIMEOUT_MS = 180_000

function demoPriceCents(id: string): number {
  let hash = 2_166_136_261
  for (const character of id) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16_777_619) >>> 0
  }
  return 500_000 + (hash % 201) * 10_000
}

async function seedCatalog(): Promise<void> {
  const snapshotPath = fileURLToPath(new URL('../../seed/dials-rolex.json', import.meta.url))
  const rawSnapshot = JSON.parse(await readFile(snapshotPath, 'utf8')) as unknown
  const snapshot = validateCatalogSnapshot(rawSnapshot)
  const config = loadConfig()
  const client = new MongoClient(config.mongoUri, {
    serverSelectionTimeoutMS: SELECTION_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
    socketTimeoutMS: BULK_TIMEOUT_MS,
    maxPoolSize: 5,
  })

  try {
    await client.connect()
    const collection = client.db(config.mongoDatabase).collection<CatalogDocument>(CATALOG_COLLECTION)
    await collection.createIndexes([
      {
        key: { slug: 1 },
        name: 'catalog_slug_unique',
        unique: true,
      },
      {
        key: { id: 1 },
        name: 'catalog_id_unique',
        unique: true,
      },
      {
        key: { position: 1, slug: 1 },
        name: 'catalog_position',
      },
      {
        key: { 'series.slug': 1, position: 1, slug: 1 },
        name: 'catalog_series_position',
      },
    ])

    const operations = snapshot.records.map((record, position) => ({
      updateOne: {
        filter: { slug: record.slug },
        update: {
          $set: {
            id: record.id,
            name: record.name,
            slug: record.slug,
            series: { name: record.series.name, slug: record.series.slug },
            sourceUrl: record.sourceUrl,
            position,
          },
          $setOnInsert: { priceCents: demoPriceCents(record.id) },
          $unset: {
            referenceNumber: '', thumbnailUrl: '', brand: '', brandSlug: '', description: '',
            priceSource: '',
          } as const,
        },
        upsert: true,
      },
    }))
    await collection.bulkWrite(operations, { ordered: false, timeoutMS: BULK_TIMEOUT_MS })
    const missingPrice = { $or: [{ priceCents: { $exists: false } }, { priceCents: { $type: 'null' as const } }] }
    const legacyWithoutPrice = await collection.find(
      missingPrice,
      { projection: { id: 1, slug: 1 }, timeoutMS: BULK_TIMEOUT_MS },
    ).toArray()
    if (legacyWithoutPrice.length > 0) {
      await collection.bulkWrite(legacyWithoutPrice.map((record) => ({
        updateOne: {
          filter: { slug: record.slug, ...missingPrice },
          update: { $set: { priceCents: demoPriceCents(record.id) } },
          upsert: false,
        },
      })), { ordered: false, timeoutMS: BULK_TIMEOUT_MS })
    }
    await assignStoredCatalogMemberships(collection, BULK_TIMEOUT_MS)
    process.stdout.write(`Seeded ${snapshot.total} validated Rolex catalog records.\n`)
  } finally {
    await client.close()
  }
}

seedCatalog().catch(() => {
  process.stderr.write('Catalog seed failed. Check the snapshot and MongoDB configuration.\n')
  process.exitCode = 1
})
