import { app } from './app.js'
import { config } from './config/env.js'

const server = app.listen(config.port, () => {
  process.stdout.write(`React Store API listening on port ${config.port}\n`)
})

function shutdown(signal: NodeJS.Signals): void {
  process.stdout.write(`\n${signal}: closing server\n`)
  server.close((error) => {
    if (error) {
      process.stderr.write(`${error.message}\n`)
      process.exitCode = 1
    }
  })
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
