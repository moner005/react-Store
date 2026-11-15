import assert from 'node:assert/strict'
import test from 'node:test'
import { BadRequestException } from '@nestjs/common'
import { parseCatalogListQuery, validateBrandAndSlug } from '../dist/catalog/catalog-query.js'

test('catalog query defaults and accepts a capped page size', () => {
  assert.deepEqual(parseCatalogListQuery({}), { brand: 'rolex', page: 1, pageSize: 24 })
  assert.deepEqual(parseCatalogListQuery({ brand: 'other-brand', page: '2', pageSize: '100' }), {
    brand: 'other-brand',
    page: 2,
    pageSize: 100,
  })
  assert.deepEqual(parseCatalogListQuery({ branch: 'latakia' }), {
    brand: 'rolex', page: 1, pageSize: 24, branch: 'latakia',
  })
  assert.deepEqual(parseCatalogListQuery({ q: '  date.just?  ', sort: 'price-desc', gender: 'women', branch: 'damascus', category: 'datejust-31' }), {
    brand: 'rolex', page: 1, pageSize: 24, category: 'datejust-31', branch: 'damascus',
    q: 'date.just?', sort: 'price-desc', gender: 'women',
  })
})

test('catalog query rejects invalid integers, unsafe offsets, extra keys, and malformed slugs', () => {
  for (const query of [
    { page: '0' },
    { page: '1.5' },
    { page: '9007199254740991', pageSize: '100' },
    { pageSize: '101' },
    { brand: 'Rolex' },
    { ignored: 'value' },
    { page: ['1', '2'] },
    { branch: 'beirut' },
    { q: 'x'.repeat(101) },
    { q: 'watch\0name' },
    { sort: 'price-high' },
    { gender: 'all' },
    { gender: ['men', 'women'] },
  ]) {
    assert.throws(() => parseCatalogListQuery(query), BadRequestException)
  }
  assert.throws(() => validateBrandAndSlug('rolex', '../model'), BadRequestException)
})
