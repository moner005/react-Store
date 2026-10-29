import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import type { AddressInfo } from 'node:net'
import { app } from '../src/app.js'

let baseUrl: string
let server: ReturnType<typeof app.listen>
before(async () => {
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})
after(async () => { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())) })

test('GET /health returns the API health payload', async () => {
  const response = await fetch(`${baseUrl}/health`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', service: 'react-store-api' })
})

test('unknown paths return a JSON 404', async () => {
  const response = await fetch(`${baseUrl}/no-such-route`)
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: { message: 'Not found' } })
})

test('CORS allows the configured client origin', async () => {
  const response = await fetch(`${baseUrl}/health`, { headers: { Origin: 'http://localhost:5173' } })
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
})
