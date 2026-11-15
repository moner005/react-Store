import assert from 'node:assert/strict'
import test from 'node:test'
import { loadConfig } from '../dist/config/app-config.js'

test('uses local development defaults', () => {
  assert.deepEqual(loadConfig({}), {
    port: 5001,
    host: '127.0.0.1',
    clientOrigin: 'http://localhost:5173',
    mongoUri: 'mongodb://127.0.0.1:27017',
    mongoDatabase: 'react_store',
  })
})

test('accepts MongoDB replica-set seed lists', () => {
  const uri = 'mongodb://db-a.example.test:27017,db-b.example.test:27017/react_store?replicaSet=rs0'
  assert.equal(loadConfig({ MONGO_URI: uri }).mongoUri, uri)
})

test('rejects invalid ports, origins, database names, and Mongo URIs without echoing secrets', () => {
  assert.throws(() => loadConfig({ PORT: '70000' }), /PORT must be an integer/)
  assert.throws(() => loadConfig({ CLIENT_ORIGIN: 'file:///tmp/page' }), /CLIENT_ORIGIN/)
  assert.throws(() => loadConfig({ MONGO_DATABASE: 'invalid/name' }), /MONGO_DATABASE/)

  const secretUri = 'https://user:do-not-print@example.test/db'
  assert.throws(() => loadConfig({ MONGO_URI: secretUri }), (error) => {
    assert.match(error.message, /MONGO_URI must be a valid MongoDB/)
    assert.equal(error.message.includes('do-not-print'), false)
    return true
  })
})
