import 'dotenv/config'
import { createApp } from '../app.js'
import { AuthService } from '../auth/auth.service.js'
import { credentials } from '../auth/auth.input.js'
import { loadConfig } from '../config/app-config.js'

async function createOwner() {
  const input = credentials({
    name: process.env.OWNER_NAME,
    email: process.env.OWNER_EMAIL,
    password: process.env.OWNER_PASSWORD,
  })
  const app = await createApp(loadConfig())
  try {
    await app.get(AuthService).bootstrapOwner(input)
    console.log('Owner account is ready.')
  } finally {
    await app.close()
  }
}

createOwner().catch(() => {
  console.error('Could not create the owner. Check OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD, MongoDB, and existing accounts.')
  process.exitCode = 1
})
