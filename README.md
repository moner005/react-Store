# ROLX

See [README.TXT](README.TXT) for a complete fresh-install and run guide.
On Windows, run `START.exe` from the extracted repository to install
and start the local store with progress and prerequisite checks.

ROLX includes a storefront, watch catalog, browser cart, checkout, and contact page. NestJS serves the catalog from MongoDB. See the [project plan](docs/project-analysis.md) for integration and remaining work.

Main color scheme: [ROLX color palette](docs/rolex_store_color_palette.pdf).

## Current pages

- `/` shows the storefront and featured items. `/store` lets shoppers choose Damascus or Latakia before browsing. `/store/:branchId` shows the models assigned to that branch in MongoDB, and `/products/:slug` opens an individual model.
- Each branch supports name search, collection and gender filters, and price sorting in either direction.
- `/cart` shows a **Checkout** button in the order summary when it has items. On screens 900 px wide or narrower, the button also appears at the top of the cart.
- `/dashboard` shows the catalog total, counts and collections for the loaded page, and catalog connection status. Refresh Data repeats the catalog read. Sales, order and inventory reporting are pending.
- The legacy `/products` and `/branches` listing links open Store. Staff branch settings are under `/management/branches`.
- The owner can open `/management/warehouse` from the dashboard to see central stock, receive catalog watches, and review recent receipts. Stock starts empty and updates as receipts are saved.
- `/contact` shows the store email address and prepares a draft in the visitor’s email app. It also includes manufacturer, retailer locator, and social links.
- `/login` and `/register` use MongoDB accounts and server sessions. Registration creates a customer account. To create the local owner, set `OWNER_NAME`, `OWNER_EMAIL`, and `OWNER_PASSWORD` as shown in `server/.env.example` and run `npm run owner:create`. The owner can manage administrator accounts under `/management/admins`.

## Try checkout

1. Open **Store**, choose a branch, and add a watch to your cart.
2. Open the cart and select **Checkout**. The review is available at `/checkout` and `/check-order`. You can change quantities or remove items and see the USD total update.
3. Select **Confirm order**. The app saves the receipt and clears the cart together, then opens `/checkout/confirmation/:id`. Tabs on the same browser origin share the latest confirmation.

A populated cart belongs to one branch. Choosing the other branch asks whether to clear the cart and switch. If an older cart has no branch, clear it and add watches from a branch before confirming. Use localhost or HTTPS in a browser that supports Web Locks for cart changes and checkout. Reload any tabs still running an older version before using checkout across tabs.

Guests can complete checkout. The total covers products only. The browser saves the receipt without collecting payment, checking stock, or sending an order to the server. See the [API contract](docs/api-contract.md#browser-checkout) for storage and retry behavior.

## Requirements

Node.js 24.14.1, npm, and Docker with Compose for local MongoDB. Install each app independently; there is no root workspace.

## Client

```sh
cd client
npm ci
npm run dev
```

Open http://localhost:5173. Client checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Copy `.env.example` to `.env` only when changing the API origin. The default API base is `http://localhost:5001`.

The client calls the NestJS API directly. For a separate frontend host, set `VITE_API_URL` at build time, configure `CLIENT_ORIGIN` on the API, and enable the SPA route fallback on the frontend host.

## Server

```sh
cd server
npm ci
docker compose up -d mongo
npm run seed:catalog
npm run seed:photos
npm run dev
```

The API listens on loopback port 5001 by default. `GET /health` checks that the API is running and `GET /ready` checks MongoDB connectivity. See `server/.env.example` for local settings. If the seed cannot connect while MongoDB starts, wait for MongoDB to become available and rerun it. Server checks: `npm run typecheck`, `npm run build`, `npm test`.

The [seed snapshot](server/seed/dials-rolex.json) contains 4,025 Rolex models captured from Dials on 12 November 2026. The seed can be rerun without creating duplicates or changing existing demo prices. Photos are served from local files. The photo import can be resumed and a missing photo displays a placeholder. Each model links to its original Dials entry. [API contract](docs/api-contract.md) · [Dials developer terms](https://dials.co/developers#terms)

For a database seeded before branch assignments were stored, run `npm run catalog:assign-branches` from `server/` against that database. Run the same command after standalone catalog additions. The initial split shuffles models into two nearly equal branch catalogs. Reruns keep valid existing branch assignments and fill in missing ones. Men, Women, and Unisex are store browsing classifications based on collection.

## MongoDB command-line tool

From the repository root in PowerShell 7.3 or later, install the driver and list the collections in the local review database.

```powershell
python -m pip install -r server/tools/requirements.txt
New-Item -ItemType Directory -Path tmp -Force | Out-Null
python server/tools/mongo_admin.py --db react_store_full_review collections
python server/tools/mongo_admin.py --db react_store_full_review find catalog_models --limit 3
python server/tools/mongo_admin.py --db react_store_full_review export catalog_models --out tmp/catalog-export.json
```

The tool connects to `mongodb://127.0.0.1:27017` by default. Set the `MONGO_URI` environment variable to use a different connection. Choose the database with `--db` or `MONGO_DATABASE`. The review site uses `react_store_full_review`, and the default API setup uses `react_store`. Use `--help` on the tool or any subcommand to see its arguments.

Try the write commands in a separate database. Create `tmp/mongo-items.json` with a JSON array such as `[{"_id":"a","group":"test","priceCents":1000},{"_id":"b","group":"test","priceCents":2000}]`. The first insert and delete commands below show what would change. Check the counts before using `--apply`.

```powershell
python server/tools/mongo_admin.py --db rolx_sandbox insert items --file tmp/mongo-items.json
python server/tools/mongo_admin.py --db rolx_sandbox insert items --file tmp/mongo-items.json --apply
python server/tools/mongo_admin.py --db rolx_sandbox count items --filter '{"group":"test"}'
python server/tools/mongo_admin.py --db rolx_sandbox update items --filter '{"group":"test"}' --set '{"priceCents":2500}' --expect-count 2 --backup tmp/prices-before.json --apply
python server/tools/mongo_admin.py --db rolx_sandbox delete items --filter '{"group":"test"}'
python server/tools/mongo_admin.py --db rolx_sandbox delete items --filter '{"group":"test"}' --expect-count 2 --backup tmp/items-deleted.json --apply
```

Updates and deletes require a nonempty filter. With `--apply`, they also require the expected match count and a new backup filename. Export and backup files use Extended JSON to preserve MongoDB types. You can use `insert` to restore deleted documents from a backup when those IDs are absent. For updates, a backup holds the old values for recovery. An insert with an existing ID reports a conflict instead of replacing the document. Bulk writes can partly apply if a later document fails. Recheck the collection and the reported counts before retrying.

To remove a field, use `update --unset FIELD`. Repeat `--unset` to remove several fields. The dry-run and backup rules for updates also apply to field removal.

Filters use MongoDB's simple collation, so string matches are case sensitive by default. Exports and writes load the selected batch into memory. For large collections, work in smaller batches.

This tool writes directly to MongoDB. App operations such as creating accounts and receiving stock have rules enforced by the NestJS API. Use that API for normal account and warehouse changes, and keep any exports of account or session data private.
