import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, type To } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { WatchPhoto } from '@/components/common/WatchPhoto'
import { getRolexWatch, type Watch } from '@/services/api/products'
import { useCartStore } from '@/stores/cartStore'
import { formatUsd } from '@/utils/money'
import { isStoreBranch, routes } from '@/constants/routes'
import './ProductDetails.css'

function WatchDetails({ watch, backTo }: { watch: Watch; backTo: To }) {
  const addItem = useCartStore((state) => state.addItem)
  const revision = useCartStore((state) => state.revision)
  const [feedback, setFeedback] = useState('')
  const [switchPrompt, setSwitchPrompt] = useState<{ revision: string; branchId: Watch['branchId'] } | null>(null)

  async function addToCart() {
    const result = await addItem({
      id: watch.slug,
      name: watch.name,
      price: watch.priceCents / 100,
      image: watch.thumbnailUrl,
    }, watch.branchId, revision)
    if (result.ok) { setFeedback('Added to your cart.'); setSwitchPrompt(null); return }
    if (result.reason === 'branch-switch-required' || result.reason === 'branch-required') {
      setSwitchPrompt({ revision: result.revision ?? revision, branchId: watch.branchId })
      setFeedback('Your cart contains items from another or unselected branch.')
      return
    }
    setFeedback(result.reason === 'stale' ? 'Your cart changed in another tab. Review it and try again.' : 'Could not save your cart change.')
  }

  async function clearAndSwitch() {
    if (!switchPrompt) return
    const result = await useCartStore.getState().switchBranchWithItem(switchPrompt.branchId,
      { id: watch.slug, name: watch.name, price: watch.priceCents / 100, image: watch.thumbnailUrl }, switchPrompt.revision)
    setFeedback(result.ok ? 'Added to your cart.' : 'Your cart changed; refresh and try again.')
    setSwitchPrompt(null)
  }

  return (
    <section className="details-page">
      <div className="details-container">
        <div className="details-image-section">
          <div className="details-image-wrapper">
            <WatchPhoto path={watch.thumbnailUrl} name={watch.name} className="details-image" />
          </div>
        </div>
        <div className="details-info">
          <h1>{watch.name}</h1>
          <div className="details-line" />
          <div className="watch-info">
            <div><span>Collection</span><p>{watch.series.name}</p></div>
          </div>
          <p className="catalog-price">{formatUsd(watch.priceCents)}</p>
          <a className="catalog-source" href={watch.sourceUrl} target="_blank" rel="noreferrer">Source: Dials</a>
          {!watch.thumbnailUrl && watch.slug === '116659sabr-0001' && (
            <a
              className="catalog-source"
              href="https://www.harrods.com/en-gb/rolex-certified-pre-owned/watches/submariner-date-000000000000100047"
              target="_blank"
              rel="noreferrer"
            >
              See this model’s photo at Harrods
            </a>
          )}
          <div className="details-buttons">
            <button type="button" className="add-cart-button" onClick={() => void addToCart()}>Add to Cart</button>
            <Link to={backTo} className="back-button">← Back to Store</Link>
          </div>
          {switchPrompt && <div className="details-buttons" role="group" aria-label="Change cart branch">
            <p>Changing branch clears the current cart.</p>
            <button type="button" className="add-cart-button" onClick={() => void clearAndSwitch()}>Clear cart and switch</button>
            <button type="button" className="back-button" onClick={() => { setSwitchPrompt(null); setFeedback('') }}>Cancel</button>
          </div>}
          {feedback === 'Added to your cart.' && <Link to="/cart">View Cart</Link>}
          <p role="status">{feedback}</p>
        </div>
      </div>
    </section>
  )
}

export default function ProductDetails() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const branch = params.get('branch')
  const [result, setResult] = useState<{ slug: string; watch?: Watch; error?: string }>()

  useEffect(() => {
    if (!slug) return
    const request = new AbortController()
    void getRolexWatch(slug, request.signal).then((watch) => {
      if (!request.signal.aborted) setResult({ slug, watch })
    }).catch((error: unknown) => {
      if (!request.signal.aborted) {
        const status = isAxiosError(error) ? error.response?.status : undefined
        setResult({ slug, error: status === 400 || status === 404 ? 'Watch not found.' : 'Could not load watch details.' })
      }
    })
    return () => request.abort()
  }, [slug])

  if (slug && result?.slug !== slug) return <p className="details-message" role="status">Loading watch details…</p>
  if (!result?.watch) {
    const fallback = isStoreBranch(branch) ? routes.store + '/' + branch : routes.store
    return <p className="details-message">{result?.error ?? 'Watch not found.'} <Link to={fallback}>Back to Store</Link></p>
  }
  const staleBranch = branch !== null && branch !== result.watch.branchId
  const storeSearch = new URLSearchParams()
  if (!staleBranch) {
    for (const key of ['category', 'q', 'gender', 'sort', 'page']) {
      const value = params.get(key)
      if (value) storeSearch.set(key, key === 'q' ? value.replaceAll('\0', '').trim().slice(0, 100) : value)
    }
  }
  const backTo = {
    pathname: routes.store + '/' + result.watch.branchId,
    search: storeSearch.toString(),
  }
  return <WatchDetails key={slug} watch={result.watch} backTo={backTo} />
}
