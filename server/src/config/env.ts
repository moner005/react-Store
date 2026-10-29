import dotenv from 'dotenv'

dotenv.config()

function parsePort(value: string | undefined): number {
  if (value === undefined || value === '') return 5001
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535')
  }
  return port
}

function parseOrigin(value: string | undefined): string {
  const origin = value || 'http://localhost:5173'
  let url: URL
  try { url = new URL(origin) } catch { throw new Error('CLIENT_ORIGIN must be a valid origin URL') }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin.replace(/\/$/, '')) {
    throw new Error('CLIENT_ORIGIN must contain only a scheme, host, and optional port')
  }
  return url.origin
}

export const config = { port: parsePort(process.env.PORT), clientOrigin: parseOrigin(process.env.CLIENT_ORIGIN) }
