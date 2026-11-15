import { useState } from 'react'
import { productPhotoUrl } from '@/services/api/products'

interface WatchPhotoProps {
  path?: string
  name: string
  className: string
}

export function WatchPhoto({ path, name, className }: WatchPhotoProps) {
  const src = productPhotoUrl(path)
  const [failedSrc, setFailedSrc] = useState('')
  return src && src !== failedSrc
    ? <img src={src} alt={name} className={className} loading="lazy" onError={() => setFailedSrc(src)} />
    : <span className="watch-photo-placeholder">Photo unavailable</span>
}
