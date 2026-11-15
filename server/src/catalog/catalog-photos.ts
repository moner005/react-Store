import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const catalogPhotoDirectory = fileURLToPath(new URL('../../assets/catalog/rolex/', import.meta.url))
export const catalogPhotoPrefix = '/catalog-images/rolex/'

export function localThumbnailUrl(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return ''
  const filename = slug + '.png'
  return existsSync(join(catalogPhotoDirectory, filename)) ? catalogPhotoPrefix + filename : ''
}
