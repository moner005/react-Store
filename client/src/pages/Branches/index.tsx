import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { routes, storeBranches } from '@/constants/routes'
import { getPublicBranches } from '@/services/api/accounts'
import { useCartStore } from '@/stores/cartStore'
import '@/pages/Products/index.css'

export default function Branches() {
  const navigate = useNavigate()
  const items = useCartStore((state) => state.items)
  const selectedBranch = useCartStore((state) => state.selectedBranchId)
  const revision = useCartStore((state) => state.revision)
  const switchBranch = useCartStore((state) => state.switchBranch)
  const [pendingBranch, setPendingBranch] = useState<{ branchId: 'damascus' | 'latakia'; revision: string } | null>(null)
  const [error, setError] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['public-branches'],
    queryFn: ({ signal }) => getPublicBranches(signal),
  })
  return (
    <section className="store-chooser">
      <header>
        <h1>Store</h1>
        <p>Choose a branch to browse its watches.</p>
      </header>
      <nav className="store-branches" aria-label="Choose a store branch">
        {Object.entries(storeBranches).map(([id, name]) => {
          const branch = data?.find((item) => item.id === id)
          const phone = branch?.phone?.trim()
          const hasPhone = Boolean(phone && /[1-9]/.test(phone))
          const branchId = id as 'damascus' | 'latakia'
          return <Link className="store-branch" key={id} to={`${routes.store}/${id}`} onClick={(event) => {
            if (selectedBranch === branchId || items.length === 0) return
            event.preventDefault()
            setPendingBranch({ branchId, revision })
            setError('')
          }}>
            <strong>{name}</strong>
            {isLoading ? <span>Loading branch details…</span> : branch?.address ? <span>{branch.address}</span> : null}
            {hasPhone && <span>{phone}</span>}
            {branch?.openingHours && <span>Hours · {branch.openingHours}</span>}
          </Link>
        })}
      </nav>
      {pendingBranch && <div className="store-branch-confirm" role="group" aria-label="Confirm branch switch">
        <p>Switching branch clears the current cart.</p>
        <button className="review-button" type="button" onClick={() => {
          void switchBranch(pendingBranch.branchId, pendingBranch.revision).then((result) => {
            if (result.ok) navigate(routes.store + '/' + pendingBranch.branchId)
            else setError(result.reason === 'stale' ? 'Your cart changed in another tab. Nothing was cleared; choose the branch again.' : 'The cart could not be saved. Nothing was cleared; try again.')
            setPendingBranch(null)
          })
        }}>Clear cart and switch</button>
        <button className="review-button review-secondary" type="button" onClick={() => setPendingBranch(null)}>Cancel</button>
      </div>}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
