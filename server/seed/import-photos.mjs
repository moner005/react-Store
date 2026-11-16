import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

const source = 'https://images.dials.co'
const maxImageBytes = 4 * 1024 * 1024
const photoRequestTimeoutMs = Number(process.env.PHOTO_REQUEST_TIMEOUT_MS ?? '12000')
if (!Number.isSafeInteger(photoRequestTimeoutMs) || photoRequestTimeoutMs < 1_000 || photoRequestTimeoutMs > 600_000) {
  throw new Error('PHOTO_REQUEST_TIMEOUT_MS must be an integer from 1000 to 600000.')
}
const pngSignature = Buffer.from('89504e470d0a1a0a', 'hex')
const modelSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const photoPath = /^\/rolex\/[a-z0-9-]+\/[a-z0-9-]+\.png$/
const folder = fileURLToPath(new URL('../assets/catalog/rolex/', import.meta.url))
const manifest = JSON.parse(await readFile(new URL('./dials-rolex-images.json', import.meta.url), 'utf8'))
const args = process.argv.slice(2)
const limit = args.length ? Number(args[0].match(/^--limit=([1-9]\d*)$/)?.[1]) : manifest.length
if (args.length > 1 || !Number.isSafeInteger(limit)) throw new Error('Use --limit=N with a positive integer.')

const seen = new Set()
for (const [slug, path] of manifest) {
  if (!modelSlug.test(slug) || !photoPath.test(path) || seen.has(slug)) throw new Error('Invalid photo manifest.')
  seen.add(slug)
}

await mkdir(folder, { recursive: true })
const photos = manifest.slice(0, limit)
let index = 0
let started = 0
let complete = 0
let failed = 0
let nextStart = 0

async function download(path) {
  const startAt = Math.max(nextStart, Date.now())
  nextStart = startAt + 125
  await delay(Math.max(0, startAt - Date.now()))
  const response = await fetch(source + path, { redirect: 'error', signal: AbortSignal.timeout(photoRequestTimeoutMs) })
  if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'image/png' || !response.body) {
    await response.body?.cancel()
    throw new Error('Source did not return a PNG.')
  }
  const chunks = []
  let size = 0
  for await (const chunk of response.body) {
    size += chunk.length
    if (size > maxImageBytes) throw new Error('Photo exceeds the maximum size.')
    chunks.push(chunk)
  }
  const image = Buffer.concat(chunks, size)
  if (!image.subarray(0, pngSignature.length).equals(pngSignature)) throw new Error('Photo signature is invalid.')
  return image
}

async function savePhoto(slug, path) {
  const destination = join(folder, slug + '.png')
  const existing = await stat(destination).catch((error) => {
    if (error.code !== 'ENOENT') throw error
  })
  if (existing?.isFile() && existing.size > pngSignature.length) return
  const image = await download(path).catch(() => download(path))
  const partial = destination + '.' + randomUUID() + '.tmp'
  try {
    await writeFile(partial, image, { flag: 'wx' })
    await rename(partial, destination)
  } finally {
    await rm(partial, { force: true })
  }
}

async function worker() {
  while (index < photos.length) {
    const [slug, path] = photos[index++]
    try {
      await savePhoto(slug, path)
      complete++
    } catch (error) {
      if (failed < 10) console.error(slug + ': ' + error.message)
      failed++
    }
    if (++started % 100 === 0) console.log(complete + ' ready, ' + failed + ' failed, ' + photos.length + ' requested.')
  }
}

await Promise.all(Array.from({ length: 8 }, worker))
console.log(complete + ' photos ready; ' + failed + ' failed.')
if (failed > 0) process.exitCode = 1
