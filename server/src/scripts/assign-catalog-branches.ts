import 'dotenv/config'
import { MongoClient } from 'mongodb'
import { assignStoredCatalogMemberships } from '../catalog/catalog-assignment.js'
import { CATALOG_COLLECTION } from '../catalog/catalog.constants.js'
import type { CatalogDocument } from '../catalog/catalog.types.js'
import { loadConfig } from '../config/app-config.js'

const OPERATION_TIMEOUT_MS = 180_000

async function assignCatalog(): Promise<void> {
  const config = loadConfig()
  const client = new MongoClient(config.mongoUri, {
    serverSelectionTimeoutMS: 10_000,
    connectTimeoutMS: 10_000,
    socketTimeoutMS: OPERATION_TIMEOUT_MS,
    maxPoolSize: 5,
  })
  try {
    await client.connect()
    const collection = client.db(config.mongoDatabase).collection<CatalogDocument>(CATALOG_COLLECTION)
    const count = await assignStoredCatalogMemberships(collection, OPERATION_TIMEOUT_MS)
    process.stdout.write(`Assigned branch and gender membership for ${count} catalog models.\n`)
  } finally {
    await client.close()
  }
}

assignCatalog().catch(() => {
  process.stderr.write('Catalog membership assignment failed. Check MongoDB configuration and catalog data.\n')
  process.exitCode = 1
})
