import { MongoClient } from 'mongodb'

export interface AppConfig {
  port: number
  host: string
  clientOrigin: string
  mongoUri: string
  mongoDatabase: string
}

function parsePort(value: string | undefined): number {
  if (!value) return 5001
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }
  return port
}

function parseHost(value: string | undefined): string {
  const host = value || '127.0.0.1'
  if (!host.trim() || /\s/.test(host)) throw new Error('HOST must be a valid host name or IP address')
  return host
}

function parseOrigin(value: string | undefined): string {
  const origin = value || 'http://localhost:5173'
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    throw new Error('CLIENT_ORIGIN must be a valid origin URL')
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin.replace(/\/$/, '')) {
    throw new Error('CLIENT_ORIGIN must contain only a scheme, host, and optional port')
  }
  return url.origin
}

function parseMongoUri(value: string | undefined): string {
  const uri = value || 'mongodb://127.0.0.1:27017'
  try {
    // MongoDB's own parser handles supported URI forms, including seed lists.
    // Constructing the client validates syntax without opening a connection.
    new MongoClient(uri, {
      serverSelectionTimeoutMS: 1_500,
      connectTimeoutMS: 1_500,
    })
  } catch {
    throw new Error('MONGO_URI must be a valid MongoDB connection URI')
  }
  return uri
}

function parseDatabase(value: string | undefined): string {
  const database = value || 'react_store'
  if (!database.trim() || /[.\\/$*<>:"|?\s]/.test(database)) {
    throw new Error('MONGO_DATABASE must be a valid database name')
  }
  return database
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    port: parsePort(env.PORT),
    host: parseHost(env.HOST),
    clientOrigin: parseOrigin(env.CLIENT_ORIGIN),
    mongoUri: parseMongoUri(env.MONGO_URI),
    mongoDatabase: parseDatabase(env.MONGO_DATABASE),
  }
}
