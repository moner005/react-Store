import 'dotenv/config'
import { createApp } from './app.js'
import { loadConfig } from './config/app-config.js'

const config = loadConfig()
const app = await createApp(config)
await app.listen(config.port, config.host)
process.stdout.write(`React Store API listening on ${config.host}:${config.port}\n`)

let closing = false
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (closing) return
  closing = true
  process.stdout.write(`${signal}: closing server\n`)
  try {
    await app.close()
  } catch {
    process.exitCode = 1
  }
}

process.once('SIGINT', () => { void shutdown('SIGINT') })
process.once('SIGTERM', () => { void shutdown('SIGTERM') })
