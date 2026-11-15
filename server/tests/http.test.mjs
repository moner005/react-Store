import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../dist/app.js'
import { loadConfig } from '../dist/config/app-config.js'

const config = loadConfig({ MONGO_URI: 'mongodb://127.0.0.1:1', MONGO_DATABASE: 'react_store' })
let app
let baseUrl

before(async () => {
  app = await createApp(config)
  await app.listen(0, '127.0.0.1')
  baseUrl = await app.getUrl()
})

after(async () => {
  if (app) await app.close()
})

test('GET /health returns the exact health payload without depending on MongoDB', async () => {
  const response = await fetch(`${baseUrl}/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', service: 'react-store-api' })
})

test('GET /ready returns a sanitized bounded 503 while MongoDB is unavailable', async () => {
  const startedAt = Date.now()
  const response = await fetch(`${baseUrl}/ready`)
  const elapsed = Date.now() - startedAt

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { message: 'Database unavailable' } })
  assert.ok(elapsed < 5_000, `readiness took ${elapsed}ms`)
})

test('unknown routes preserve the JSON 404 envelope', async () => {
  const response = await fetch(`${baseUrl}/unknown`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: { message: 'Not found' } })
})

test('catalog rejects malformed paging and slugs before querying MongoDB', async () => {
  const invalidPage = await fetch(`${baseUrl}/api/v1/models?page=1.5`)
  assert.equal(invalidPage.status, 400)
  assert.deepEqual(await invalidPage.json(), { error: { message: 'Bad request' } })

  const invalidSlug = await fetch(`${baseUrl}/api/v1/models/rolex/%2E%2E%2Fbad`)
  assert.equal(invalidSlug.status, 400)
  assert.deepEqual(await invalidSlug.json(), { error: { message: 'Bad request' } })
})

test('catalog database failures return the documented sanitized 503 envelope', async () => {
  const response = await fetch(`${baseUrl}/api/v1/models`)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: { message: 'Database unavailable' } })
})

test('guests can request public branch information while management stays protected', async () => {
  const publicBranches = await fetch(`${baseUrl}/api/v1/branches`)
  assert.equal(publicBranches.status, 503)
  assert.deepEqual(await publicBranches.json(), { error: { message: 'Database unavailable' } })

  const privateBranch = await fetch(`${baseUrl}/api/v1/management/branches/damascus`)
  assert.equal(privateBranch.status, 401)
})

test('CORS allows the configured client origin', async () => {
  const response = await fetch(`${baseUrl}/health`, {
    headers: { Origin: config.clientOrigin },
  })
  assert.equal(response.headers.get('access-control-allow-origin'), config.clientOrigin)
})

test('closing the Nest app closes its HTTP listener', async () => {
  const server = app.getHttpServer()
  await app.close()
  app = undefined
  assert.equal(server.listening, false)
})
