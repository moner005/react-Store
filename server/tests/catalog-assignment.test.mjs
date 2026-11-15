import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { assignCatalogMemberships, classifyCatalogGender } from '../dist/catalog/catalog-assignment.js'

test('gender uses explicit collection groups and leaves ambiguous collections unisex', () => {
  assert.equal(classifyCatalogGender('lady-datejust'), 'women')
  assert.equal(classifyCatalogGender('oyster-perpetual-31'), 'women')
  assert.equal(classifyCatalogGender('datejust-ii'), 'men')
  assert.equal(classifyCatalogGender('sky-dweller'), 'men')
  assert.equal(classifyCatalogGender('datejust'), 'unisex')
  assert.equal(classifyCatalogGender('cellini'), 'unisex')
})

test('branch split is deterministic, balanced, and ranked by SHA-256', () => {
  const records = Array.from({ length: 11 }, (_, i) => ({ id: `watch-${i}`, seriesSlug: 'datejust' }))
  const assigned = assignCatalogMemberships(records)
  const again = assignCatalogMemberships([...records].reverse())
  assert.deepEqual(Object.fromEntries(assigned.map(({ id, branchId }) => [id, branchId])),
    Object.fromEntries(again.map(({ id, branchId }) => [id, branchId])))
  assert.equal(assigned.filter((row) => row.branchId === 'damascus').length, 6)
  assert.equal(assigned.filter((row) => row.branchId === 'latakia').length, 5)
  const rank = (id) => createHash('sha256').update(id).digest('hex')
  const firstDamascus = [...records].sort((a, b) => rank(a.id).localeCompare(rank(b.id)) || a.id.localeCompare(b.id)).slice(0, 6)
  const dams = new Set(assigned.filter((row) => row.branchId === 'damascus').map((row) => row.id))
  assert.deepEqual(dams, new Set(firstDamascus.map((row) => row.id)))
})

test('valid stored assignments stay fixed while unassigned rows fill the existing branch deficit', () => {
  const rows = [
    { id: 'fixed-a', seriesSlug: 'datejust', branchId: 'damascus' },
    { id: 'fixed-b', seriesSlug: 'datejust', branchId: 'damascus' },
    { id: 'new-a', seriesSlug: 'submariner' },
    { id: 'new-b', seriesSlug: 'lady-datejust' },
  ]
  const assigned = assignCatalogMemberships(rows)
  assert.deepEqual(assigned.filter((row) => row.branchId === 'damascus').map((row) => row.id), ['fixed-a', 'fixed-b'])
  assert.deepEqual(assigned.filter((row) => row.branchId === 'latakia').length, 2)
  assert.equal(assigned.find((row) => row.id === 'new-b')?.gender, 'women')
})

test('duplicate IDs are rejected before assignment', () => {
  assert.throws(() => assignCatalogMemberships([
    { id: 'same', seriesSlug: 'datejust' },
    { id: 'same', seriesSlug: 'submariner' },
  ]))
})
