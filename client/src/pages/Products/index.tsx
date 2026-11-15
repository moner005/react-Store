import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { WatchPhoto } from '@/components/common/WatchPhoto'
import { useQuery } from '@tanstack/react-query'
import { getCatalogCategories, getRolexWatches, type WatchesResponse } from '@/services/api/products'
import { formatUsd } from '@/utils/money'
import { isStoreBranch, routes, storeBranches, type StoreBranch } from '@/constants/routes'
import './index.css'

const FILTER_KEYS = ['category', 'q', 'gender', 'sort'] as const

export default function Products() {
  const { branchId } = useParams()
  if (!isStoreBranch(branchId)) return <Navigate to={routes.store} replace />
  return <BranchCatalog key={branchId} branch={branchId} />
}

function BranchCatalog({ branch }: { branch: StoreBranch }) {
  const [params, setParams] = useSearchParams()
  const selectedCategory = params.get('category') ?? ''
  const appliedQuery = (params.get('q') ?? '').replaceAll('\0', '').trim().slice(0, 100)
  const rawGender = params.get('gender') ?? ''
  const gender = rawGender === 'men' || rawGender === 'women' || rawGender === 'unisex' ? rawGender : ''
  const rawSort = params.get('sort') ?? ''
  const sort = rawSort === 'price-asc' || rawSort === 'price-desc' ? rawSort : ''
  const requestedPage = Number(params.get('page') ?? '1')
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ key: string; catalog?: WatchesResponse }>()
  const key = [branch, selectedCategory, appliedQuery, gender, sort, page, attempt].join(':')
  const branchPath = routes.store + '/' + branch
  const { data: categories } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: ({ signal }) => getCatalogCategories(signal),
  })

  useEffect(() => {
    const request = new AbortController()
    void getRolexWatches(page, request.signal, selectedCategory || undefined, branch, {
      q: appliedQuery || undefined,
      gender: gender === 'men' || gender === 'women' || gender === 'unisex' ? gender : undefined,
      sort: sort === 'price-asc' || sort === 'price-desc' ? sort : undefined,
    })
      .then((catalog) => { if (!request.signal.aborted) setResult({ key, catalog }) })
      .catch(() => { if (!request.signal.aborted) setResult({ key }) })
    return () => request.abort()
  }, [branch, page, key, selectedCategory, appliedQuery, gender, sort])

  function updateFilters(values: Record<string, string>) {
    const next = new URLSearchParams()
    for (const filter of FILTER_KEYS) {
      const value = values[filter]
      if (value) next.set(filter, value)
    }
    setParams(next)
  }

  function currentFilters(): Record<string, string> {
    return Object.fromEntries(FILTER_KEYS.map((filter) => [filter,
      filter === 'q' ? appliedQuery : filter === 'gender' ? gender : filter === 'sort' ? sort : params.get(filter) ?? '',
    ]))
  }

  function pageLink(nextPage: number) {
    const search = new URLSearchParams()
    for (const filter of FILTER_KEYS) {
      const value = filter === 'q' ? appliedQuery : params.get(filter)
      if (value) search.set(filter, value)
    }
    if (nextPage !== 1) search.set('page', String(nextPage))
    return { pathname: branchPath, search: search.toString() }
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const current = currentFilters()
    const submitted = new FormData(event.currentTarget).get('q')
    const search = typeof submitted === 'string' ? submitted.replaceAll('\0', '').trim() : ''
    updateFilters({ ...current, q: search })
  }

  function resetFilters() {
    setParams({})
  }

  const detailSearch = new URLSearchParams(pageLink(page).search)
  detailSearch.set('branch', branch)
  const catalog = result?.key === key ? result.catalog : undefined
  return (
    <section className="catalog-page">
      <section className="products-intro">
        <h1>{storeBranches[branch]} Store</h1>
        <Link to={routes.store}>Change branch</Link>
        <form className="catalog-filters" onSubmit={applySearch} role="search">
          <label className="catalog-search-filter" htmlFor="catalog-search">
            Search
            <input id="catalog-search" name="q" type="search" key={appliedQuery} defaultValue={appliedQuery} maxLength={100}
              placeholder="Search watches" />
          </label>
          <label className="catalog-select-filter" htmlFor="catalog-collection">Collection
            <select id="catalog-collection" value={selectedCategory} onChange={(event) => {
              updateFilters({ ...currentFilters(), category: event.currentTarget.value })
            }}>
              <option value="">All collections</option>
              {selectedCategory && !categories?.some(({ slug }) => slug === selectedCategory) && <option value={selectedCategory}>Unknown collection</option>}
              {categories?.map(({ slug, name }) => <option key={slug} value={slug}>{name}</option>)}
            </select>
          </label>
          <label className="catalog-select-filter" htmlFor="catalog-gender">Gender
            <select id="catalog-gender" value={gender} onChange={(event) => {
              updateFilters({ ...currentFilters(), gender: event.currentTarget.value })
            }}>
              <option value="">All</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <label className="catalog-select-filter" htmlFor="catalog-sort">Sort by
            <select id="catalog-sort" value={sort} onChange={(event) => {
              updateFilters({ ...currentFilters(), sort: event.currentTarget.value })
            }}>
              <option value="">Default</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
            </select>
          </label>
          <button className="catalog-search-button" type="submit">Search</button>
        </form>
      </section>

      {result?.key !== key && <p className="products-message" role="status">Loading watches…</p>}
      {result?.key === key && !catalog && (
        <div className="products-message" role="alert">
          <p>Could not load the catalog.</p>
          <button className="details-button" type="button" onClick={() => setAttempt(attempt + 1)}>Retry</button>
        </div>
      )}
      {catalog && catalog.data.length > 0 && (
        <>
          <section className="products-grid">
            {catalog.data.map((watch) => (
              <article className="product-card" key={watch.id}>
                <div className="product-image-wrapper"><WatchPhoto path={watch.thumbnailUrl} name={watch.name} className="product-image" /></div>
                <p className="product-series">{watch.series.name}</p>
                <h2>{watch.name}</h2>
                <p className="catalog-price">{formatUsd(watch.priceCents)}</p>
                <Link className="details-button" to={{ pathname: routes.products + '/' + watch.slug, search: detailSearch.toString() }}>View Details <span>→</span></Link>
                <a className="catalog-source" href={watch.sourceUrl} target="_blank" rel="noreferrer">Source: Dials</a>
              </article>
            ))}
          </section>
          {catalog.totalPages > 0 && (
            <nav aria-label="Catalog pages" className="catalog-pagination">
              {page > catalog.totalPages
                ? <Link to={pageLink(1)}>First page</Link>
                : <>
                    {page > 1 && <Link to={pageLink(page - 1)}>Previous</Link>}
                    <span>Page {page} of {catalog.totalPages}</span>
                    {page < catalog.totalPages && <Link to={pageLink(page + 1)}>Next</Link>}
                  </>}
            </nav>
          )}
        </>
      )}
      {catalog && catalog.data.length === 0 && <div className="products-message">
        <p>{catalog.total === 0 ? 'No matching watches.' : 'No watches on this page.'}</p>
        <button className="details-button" type="button" onClick={resetFilters}>Reset filters</button>
        {catalog.total > 0 && <Link to={pageLink(1)}>Go to first page</Link>}
      </div>}
    </section>
  )
}
