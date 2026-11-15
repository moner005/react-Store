import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  createWarehouseReceipt,
  getWarehouseOverview,
  searchWarehouseProducts,
  type WarehouseOverview,
  type WarehouseProduct,
} from '@/services/api/warehouse'
import './Warehouse.css'

interface PendingReceipt { requestId: string; productId: string; product: WarehouseProduct; quantity: number }

export default function WarehousePage() {
  const ownerId = useAuthStore((state) => state.user?.id ?? '')
  const { data: overview, isPending: loading, isFetching: refreshing, isError, refetch } = useQuery<WarehouseOverview>({
    queryKey: ['warehouse', ownerId],
    queryFn: ({ signal }) => getWarehouseOverview(signal),
    enabled: Boolean(ownerId),
    staleTime: 0,
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<{ query: string; results?: WarehouseProduct[] }>()
  const [selected, setSelected] = useState<WarehouseProduct | null>(null)
  const [quantity, setQuantity] = useState('1')
  const pendingKey = ownerId ? `warehouse-pending-receipt:${ownerId}` : ''
  const [pending, setPending] = useState(() => loadPendingReceipt(pendingKey))
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const searchText = query.trim()
  const currentSearch = search?.query === searchText ? search : undefined
  const results = currentSearch?.results ?? []
  const totalUnits = overview?.balances.reduce((sum, row) => sum + row.quantity, 0)

  useEffect(() => {
    if (selected || pending || searchText.length < 2) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      searchWarehouseProducts(searchText, controller.signal)
        .then((results) => { if (!controller.signal.aborted) setSearch({ query: searchText, results }) })
        .catch(() => { if (!controller.signal.aborted) setSearch({ query: searchText }) })
    }, 250)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [searchText, selected, pending])

  function clearAttempt() {
    try { if (pendingKey) sessionStorage.removeItem(pendingKey) } catch { /* A saved retry still uses the same receipt ID. */ }
    setPending(null)
  }

  async function submitReceipt(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setError(''); setNotice('')
    const quantityValue = Number(quantity)
    if (pending) {
      await sendReceipt(pending)
      return
    }
    if (!selected || !Number.isInteger(quantityValue) || quantityValue < 1 || quantityValue > 10_000 || !pendingKey) {
      setError('Choose a catalog product and enter a whole quantity from 1 to 10,000.')
      return
    }
    const attempt = { requestId: crypto.randomUUID(), productId: selected.id, product: selected, quantity: quantityValue }
    try { sessionStorage.setItem(pendingKey, JSON.stringify(attempt)) }
    catch { setError('This browser could not save a safe retry key. Enable session storage and try again.'); return }
    setPending(attempt)
    await sendReceipt(attempt)
  }

  async function sendReceipt(attempt: PendingReceipt) {
    submittingRef.current = true
    setSubmitting(true)
    try {
      await createWarehouseReceipt(attempt.requestId, attempt.productId, attempt.quantity)
      clearAttempt()
      setSelected(null); setQuery(''); setQuantity('1')
      setNotice('Receipt recorded.')
      const result = await refetch()
      if (result.isError) {
        setNotice('Receipt recorded. Warehouse balances could not refresh; use Refresh to check the saved receipt.')
      }
    } catch (cause) {
      const status = isAxiosError(cause) ? cause.response?.status : undefined
      if (status === 400 || status === 404 || status === 409) {
        clearAttempt()
        setError(status === 404 ? 'The selected catalog product was not found.' : status === 409
          ? 'This request ID conflicts with a different receipt. Start a new receipt.'
          : 'Receipt details were rejected. Check the product and quantity, then try again.')
      } else {
        setError('The receipt result is unknown. Keep this receipt unchanged and retry with the same request ID to safely confirm it.')
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return <section className="warehouse-page">
    <header className="warehouse-heading">
      <div><h1>Warehouse</h1>
        {overview && <p>{overview.balances.length.toLocaleString()} models · {totalUnits?.toLocaleString()} units in stock</p>}</div>
      <button type="button" onClick={() => void refetch()} disabled={refreshing || submitting}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
    </header>

    {error && <p className="warehouse-feedback warehouse-error" role="alert">{error}</p>}
    {notice && <p className="warehouse-feedback" role="status">{notice}</p>}
    {isError && <p className="warehouse-feedback warehouse-error" role="alert">Warehouse balances could not be refreshed.</p>}

    <section className="warehouse-section">
      <h2>Receive stock</h2>
      <form className="warehouse-form" onSubmit={submitReceipt}>
        <div><label htmlFor="warehouse-product">Catalog product</label>
          {pending ? <div className="warehouse-selected">{pending.product.name}</div> : selected ?
            <div className="warehouse-selected">{selected.name}
              <button type="button" onClick={() => setSelected(null)}>Change product</button></div> :
            <input id="warehouse-product" aria-label="Search catalog product" value={query} onChange={(event) => {
              const value = event.target.value
              if (value.trim() !== searchText) setSearch(undefined)
              setQuery(value)
            }}
              maxLength={100} placeholder="Search product name" autoComplete="off" />}
        </div>
        {!pending && !selected && results.length > 0 && <ul className="warehouse-search-results">
          {results.map((product) => <li key={product.id}><button type="button" onClick={() => setSelected(product)}>
            {product.name}</button></li>)}
        </ul>}
        {!pending && !selected && searchText.length >= 2 && results.length === 0 && <p className="warehouse-hint" role="status">
          {currentSearch ? (currentSearch.results ? 'No matching models.' : 'Search unavailable. Edit the search to try again.') : 'Searching…'}
        </p>}
        <label><span>Quantity (1–10,000)</span><input type="number" min="1" max="10000" step="1" value={pending?.quantity ?? quantity}
          disabled={Boolean(pending)} onChange={(event) => setQuantity(event.target.value)} required /></label>
        <button type="submit" disabled={submitting || loading || (!selected && !pending)}>
          {submitting ? 'Saving…' : pending ? 'Retry receipt' : 'Receive stock'}
        </button>
      </form>
      {pending && !submitting && <p className="warehouse-hint">Retry this receipt to confirm whether it was saved.</p>}
    </section>

    <section className="warehouse-section">
      <h2>Current warehouse balances</h2>
      {loading ? <p role="status">Loading balances…</p> : !overview ? null : overview.balances.length === 0 ?
        <p>No receipts have been recorded, so there are no warehouse balances yet.</p> :
        <div className="warehouse-table-wrap"><table><thead><tr><th>Model</th><th>Quantity</th></tr></thead>
          <tbody>{overview.balances.map((item) => <tr key={item.product.id}><td><Link to={`/products/${item.product.slug}`}>{item.product.name}</Link></td>
            <td>{item.quantity}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="warehouse-section">
      <h2>Recent receipts</h2>
      {loading ? <p role="status">Loading receipt history…</p> : !overview ? null : overview.receipts.length === 0 ? <p>No receipts recorded yet.</p> :
        <div className="warehouse-table-wrap"><table><thead><tr><th>Received</th><th>Model</th><th>Quantity</th><th>Request ID</th></tr></thead>
          <tbody>{overview.receipts.map((receipt) => <tr key={receipt.requestId}><td>{new Date(receipt.receivedAt).toLocaleString()}</td>
            <td>{receipt.product.name}</td><td>{receipt.quantity}</td><td className="warehouse-request-id">{receipt.requestId}</td></tr>)}</tbody></table></div>}
    </section>
  </section>
}

function loadPendingReceipt(key: string): PendingReceipt | null {
  if (!key) return null
  try {
    const stored = sessionStorage.getItem(key)
    const parsed: unknown = stored ? JSON.parse(stored) : null
    return isPendingReceipt(parsed) ? parsed : null
  } catch {
    return null
  }
}

function isPendingReceipt(value: unknown): value is PendingReceipt {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Partial<PendingReceipt>
  return typeof item.requestId === 'string' && /^[a-f0-9-]{36}$/i.test(item.requestId)
    && typeof item.productId === 'string' && /^[a-f0-9]{28}$/.test(item.productId)
    && typeof item.quantity === 'number' && Number.isInteger(item.quantity)
    && item.quantity >= 1 && item.quantity <= 10_000 && typeof item.product === 'object' && item.product !== null
    && item.product.id === item.productId && typeof item.product.name === 'string'
    && typeof item.product.slug === 'string'
}
