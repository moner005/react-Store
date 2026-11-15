import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { validateCatalogSnapshot } from '../dist/catalog/snapshot-validator.js'

const snapshotUrl = new URL('../seed/dials-rolex.json', import.meta.url)
const originalSnapshot = JSON.parse(await readFile(snapshotUrl, 'utf8'))

test('accepts the complete captured Dials snapshot and preserves its source order', () => {
  const validated = validateCatalogSnapshot(originalSnapshot)
  assert.equal(validated.total, 4025)
  assert.equal(validated.records.length, 4025)
  assert.equal(validated.records[0].slug, originalSnapshot.records[0].slug)
  assert.equal(validated.records[4024].slug, originalSnapshot.records[4024].slug)
})

test('rejects wrong snapshot provenance, count, duplicate IDs/slugs, and unsafe source links', () => {
  const wrongProvenance = { ...originalSnapshot, source: 'unknown' }
  assert.throws(() => validateCatalogSnapshot(wrongProvenance))

  const wrongCount = { ...originalSnapshot, total: 4024 }
  assert.throws(() => validateCatalogSnapshot(wrongCount))

  const updatedValidSnapshot = { ...originalSnapshot, total: 1, records: [originalSnapshot.records[0]] }
  assert.equal(validateCatalogSnapshot(updatedValidSnapshot).records.length, 1)

  const duplicateRecord = { ...originalSnapshot.records[1], slug: originalSnapshot.records[0].slug }
  const duplicateSlug = { ...originalSnapshot, records: [originalSnapshot.records[0], duplicateRecord, ...originalSnapshot.records.slice(2)] }
  assert.throws(() => validateCatalogSnapshot(duplicateSlug))

  const unsafeSource = { ...originalSnapshot.records[0], sourceUrl: 'https://example.test/watch' }
  const unsafeUrl = { ...originalSnapshot, records: [unsafeSource, ...originalSnapshot.records.slice(1)] }
  assert.throws(() => validateCatalogSnapshot(unsafeUrl))

  const credentialSource = { ...originalSnapshot.records[0], sourceUrl: 'https://user@dials.co/watches/rolex/yacht-master/126680-0001' }
  const credentialUrl = { ...originalSnapshot, records: [credentialSource, ...originalSnapshot.records.slice(1)] }
  assert.throws(() => validateCatalogSnapshot(credentialUrl))
})
