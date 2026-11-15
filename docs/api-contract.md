# API contract

## Implemented

### `GET /health`

Returns HTTP 200 with JSON:

```json
{ "status": "ok", "service": "react-store-api" }
```

Unknown routes return HTTP 404 with `{ "error": { "message": "Not found" } }`. Unexpected server errors return HTTP 500 with `{ "error": { "message": "Internal server error" } }`; internal details are not exposed. CORS permits the configured `CLIENT_ORIGIN`.

### `GET /ready`

Pings MongoDB. Returns HTTP 200 when the connection works and 503 when it does not. A ready database can still have an empty catalog before seeding. `/health` continues to report API liveness during a database outage.

### `GET /api/v1/models`

Reads the captured Rolex catalog from MongoDB. Query parameters are `brand` (default `rolex`), `page` (positive integer, default 1), `pageSize` (1–100, default 24), and these optional values.

- `branch` is `damascus` or `latakia` and matches the model's stored branch.
- `category` is a collection slug. `gender` is `men`, `women`, or `unisex`.
- `q` searches for a literal substring of the model name without regard to case. It accepts up to 100 characters.
- `sort` is `price-asc` or `price-desc`. Ties use snapshot position, then slug. Omitting the sort uses snapshot order.

The response is `{ data, page, pageSize, total, totalPages }`. Filters apply before counting, sorting, and pagination. A page past the end returns an empty `data` array.

### `GET /api/v1/models/categories`

Lists the collections in MongoDB as `{ name, slug }` records, sorted by name. Use `slug` in the list endpoint's `category` filter.

### `GET /api/v1/models/:brand/:slug`

Reads a single model from the same collection. List and detail models include `id`, `name`, `slug`, `thumbnailUrl`, `series` (name and slug), `sourceUrl`, `priceCents` (integer USD cents), `branchId`, and `gender`. The API derives the photo URL from the file on disk using the model slug and returns an empty string if the file is missing. `sourceUrl` credits the original Dials model. A valid slug without a matching model returns 404. Invalid inputs return 400, and database outages return 503.

## Catalog data and consumers

The [Dials Rolex snapshot](../server/seed/dials-rolex.json) contains 4,025 models captured on 12 November 2026. Import it with `npm run seed:catalog` from `server/`. The seed upserts by slug, writes the catalog fields the store uses, and fills missing prices with stable demo values. The source snapshot is an archive. Run `npm run seed:photos` from `server/` to download photos into the folder that NestJS serves.

The seed assigns an unassigned catalog to both branches using a repeatable shuffle with a nearly even split. It keeps valid existing assignments when it runs again. To backfill existing records separately, run `npm run catalog:assign-branches` from `server/` against the target database. The catalog archive lacks gender metadata, so the store assigns browsing classifications by collection and uses Unisex for ambiguous or unmatched collections. Warehouse receipts track physical inventory separately.

The Store asks shoppers to choose Damascus or Latakia before browsing. Cards and product details display metadata, USD prices, and source links. Adding a product uses its stored price and branch in the browser cart and order review. The owner dashboard uses the full catalog total and collection counts for the loaded page.

## Accounts and branch settings

`POST /api/v1/auth/register` creates a customer. `POST /api/v1/auth/login` sets the session cookie. `GET /api/v1/auth/me` returns the active account, and `POST /api/v1/auth/logout` ends the session. Browser writes use the configured client origin.

The owner can read `/api/v1/management/dashboard` and manage admin accounts under `/api/v1/management/admins`. `GET` and `PATCH /api/v1/management/branches/:id` allow the owner to access either branch and an administrator to access their assigned branch. The editable settings are address, phone, and opening hours.

## Central warehouse

All routes below require an active owner session. Unauthenticated requests return 401, and admins and customers receive 403. Receipt writes also require the configured client origin.

- `GET /api/v1/management/warehouse` returns `{ balances, receipts }`. Each balance contains `product` and `quantity`. The `receipts` list contains the latest 25 entries and each entry has `requestId`, `product`, `quantity` and `receivedAt`. The stock calculation uses all saved receipts.
- `GET /api/v1/management/warehouse/products?q=...` finds up to 20 catalog products by name or slug. The search uses literal text and accepts up to 100 characters. Fewer than two characters return an empty list. A product contains `id`, `name` and `slug`.
- `PUT /api/v1/management/warehouse/receipts/:requestId` accepts a UUID and `{ productId, quantity }`. The quantity must be a whole number from 1 to 10,000. MongoDB stores one receipt per UUID. Retrying the same UUID and payload returns the saved receipt. Reusing a UUID for a different payload returns 409. After a timeout, retry the original UUID and payload to confirm the result.

## Browser checkout

Both `/checkout` and `/check-order` use the prices already saved in the cart. The app calculates line totals and the order total in integer USD cents. Confirmation requires a nonempty cart with a branch and a valid total.

Cart changes and checkout use the same Web Lock and read the latest stored cart inside the lock. Confirmation saves the branch, receipt ID, timestamp, order lines, total, and emptied cart in one `localStorage` write. A failed write preserves the cart. Reconfirming the same cart revision opens the existing receipt at `/checkout/confirmation/:id`. If the cart changed, the shopper must review it again before confirming.

Checkout runs in the browser without an API request. It skips stock checks, taxes, delivery charges, and payment. MongoDB continues to supply the catalog and store warehouse receipts.

## Future API work

Server-side order creation and history, authoritative checkout pricing, branch stock, and warehouse transfers are pending. The contact form validates locally and prepares an email draft addressed to the store.
