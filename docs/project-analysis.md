# Scaffold implementation status — 29 October 2026

This repository currently contains the structural foundation only: a runnable React client scaffold and an Express health endpoint. The planned backlog (40 frontend tasks and 12 later backend tasks) remains open; feature routes are clearly labeled as not implemented. No catalog, authentication, checkout, orders, inventory mutations, fake API, or database behavior is implemented. The runnable baseline is Vite on port 5173 and the Express API on port 5001. The proposed json-server/db.json API on port 5000 is pending.

Local validation (29 October 2026): client lint, typecheck and production build passed; server typecheck/build and all three HTTP tests passed. A production-preview check in Edge passed Home/navigation, direct product/branch routes and reloads, not-found handling, and mobile layout without JavaScript page errors. These are scaffold checks; commerce workflows and production deployment are not verified.

---

# React Store — five-person project plan

Planning baseline: 27 October 2026. This is a proposed specification and assignable backlog, not a record of completed implementation.

Team: five members, all trained in frontend development. Names, available hours, deadline, and backend technology are not yet specified. React frontend comes first; a real backend comes later.

Repository: https://github.com/moner005/react-Store

GitHub reported `Git Repository is empty.` when checked on the planning date. This is historical inspection evidence, not a fresh status check.

The earlier local ShopFlow JavaScript project provides reference behavior: catalog/details, filtering/sorting/pagination, favorites, cart, checkout and browser-saved orders. Those features are not already implemented in this repository. Confirmed added scope: one central warehouse supplying two physical branches.

## 1. Scope and user journeys

Customer journey: choose branch → browse products → view a product → add to cart → enter delivery details → place a demo order → view the saved order.

Stock-management journey: view warehouse stock → receive stock into warehouse → transfer a product to Branch 1 or Branch 2 → view branch balances and transfer history.

Required first release:

- Shared navigation, responsive layout, accessible controls, and useful loading/empty/error states.
- Home page, catalog, search, category filtering, sorting, pagination, product details, and favorites.
- Two fixed branches with names/addresses and a branch selector. Creating/deleting branches is not required.
- Warehouse and branch inventory views, warehouse receipts, warehouse-to-branch transfers, and transfer history.
- Cart, consistent totals, validated checkout, confirmation, and order history/details.
- Zustand browser persistence for cart/branch/favorites, a local fake API for catalog/inventory/orders, and clearly labeled management/demo screens.

Optional after the required flows work: theme switching, coupons, reviews, product variants, customer accounts, stock adjustments, returns, interbranch transfers, and low-stock dashboards. These are separate scope decisions.

## 2. Team ownership

Each person owns their React components, feature behavior, data connections, and verification. Rebalance at milestones using actual effort rather than task count.

Peer review cycle: 1 reviews 2; 2 reviews 3; 3 reviews 4; 4 reviews 5; 5 reviews 1. Choose another reviewer if the assigned reviewer substantially contributed to the change.

| Member | Responsibility | Frontend task IDs |
|---|---|---|
| Member 1 | Setup, shared layout, branch selector, branch inventory page, integration | S01–S08 |
| Member 2 | Catalog, details, favorites and product data | S09–S16 |
| Member 3 | Cart/branch state, quantities, totals and persistence | S17–S24 |
| Member 4 | Checkout, order creation/history/details | S25–S32 |
| Member 5 | Warehouse, stock service, receiving and transfers | S33–S40 |

Member 5 has the heaviest business rules. Member 1 owns the shared stock table/branch screen, Member 3 owns branch-aware cart rules, and Member 4 implements order submission during the service handoff described below.

## 3. Session 7 architecture and project structure

Architecture revised: 29 October 2026, using [Session 7 — Final Project](https://github.com/ZakariaZhlat125/Bytes4Future-Tutorial-/blob/BootCamp/Session-7.md), especially its state-management, API-layer, folder-structure and implementation-pattern sections.

Use React + TypeScript + Vite + React Router + Zustand + TanStack React Query + Axios + Tailwind CSS, with react-hot-toast for notifications. Use `.tsx` for React components and `.ts` for services, stores, hooks without JSX, types and helpers. Configure `@/` to resolve to `src/` in both TypeScript and Vite.

The course supplies the architecture; this plan adapts its domain names and preserves the agreed project scope. Keep the team's page folders (`pages/Products/index.tsx`, for example) and top-level `constants/` preference. The tutorial's `utils/constants.ts` becomes `constants/`; do not maintain duplicate constants in both places. There is one independent application per repository.

### Repository layout

```text
client/   # React + TypeScript + Vite application
server/   # Node + Express + TypeScript API
 docs/    # preserved plan and current API contract
AGENTS.md README.md .gitignore
```

### Project source layout

The following is the planned feature layout. The repository currently contains its structural folders and entry points; feature behavior remains assigned backlog. Files marked **later** belong to the backend/auth phase; **optional** files need an actual caller or assigned task. Grouped filenames under a folder represent planned contents.

```text
client/src/
├── components/
│   ├── common/          # Button, Input, Select, Modal, EmptyState, LoadingSpinner
│   ├── layout/          # Header, Footer, Sidebar, BranchSelector
│   ├── auth/            # LoginForm, ProtectedRoute [later]
│   ├── products/        # ProductCard, ProductFilters, ProductCardSkeleton
│   ├── cart/            # CartItem, CartSummary, CartBadge
│   ├── checkout/        # CustomerForm, CheckoutSummary
│   ├── orders/          # OrderCard, OrderStatusBadge, OrderSummary
│   ├── inventory/       # StockTable, ReceiptForm, TransferForm, TransferHistory
│   └── profile/         # ProfileForm [later, if assigned]
├── pages/
│   ├── Home/index.tsx
│   ├── Products/        # index.tsx, ProductDetails.tsx
│   ├── Favorites/index.tsx
│   ├── Cart/index.tsx
│   ├── Checkout/        # index.tsx, Confirmation.tsx
│   ├── Orders/          # index.tsx, OrderDetails.tsx
│   ├── Warehouse/index.tsx
│   ├── Branches/index.tsx
│   ├── Transfers/index.tsx
│   ├── Login.tsx        # later
│   ├── Register.tsx     # later, if assigned
│   ├── Profile/index.tsx # later, if assigned
│   └── NotFound.tsx
├── layouts/             # MainLayout.tsx, AdminLayout.tsx; AuthLayout.tsx later
├── routes/              # index.tsx; protectedRoutes.tsx later
├── services/
│   ├── apiClient.ts     # the only Axios instance
│   ├── queryClient.ts   # React Query configuration and shared query keys
│   └── api/
│       ├── products.ts  # product/category reads
│       ├── branches.ts  # location/branch reads
│       ├── store.ts     # sole demo stock/order mutation boundary
│       ├── inventory.ts # stock reads; receipt/transfer facade delegates to store.ts
│       ├── orders.ts   # order reads/create facade delegates to store.ts
│       ├── auth.ts     # later
│       └── user.ts     # later, if assigned
├── stores/
│   ├── cartStore.ts     # cart + selected branch; guarded persistence
│   ├── favoritesStore.ts
│   ├── authStore.ts     # later
│   └── uiStore.ts       # optional: genuinely shared sidebar/modal state
├── hooks/               # useProducts.ts, useInventory.ts, useOrders.ts, useDebounce.ts
│                        # useCart.ts only for useful derived rules; useAuth.ts later
├── types/               # product.ts, branch.ts, inventory.ts, cart.ts, order.ts,
│                        # api.ts; user.ts later
├── utils/               # money.ts, totals.ts, validation.ts, storage.ts
├── constants/           # routes.ts, endpoints.ts, locations.ts
├── App.tsx
├── main.tsx
└── index.css
```

### What belongs in each boundary

| Boundary | Responsibility |
|---|---|
| `pages/` | Route-level composition: obtain data via hooks, handle UI states, compose domain components |
| `components/common/` | Domain-independent controls and loading/empty/error feedback |
| Domain component folders | Reusable product/meal/cart/order/inventory views; page-private fragments may stay beside their page |
| `components/layout/` | Header/sidebar/footer building blocks |
| `layouts/` | Complete route shells using those building blocks and nested route outlets |
| `routes/` | Central `createBrowserRouter` configuration, not-found route and later access wrappers |
| `services/apiClient.ts` | One Axios client, environment URL and later auth interceptors |
| `services/queryClient.ts` | One QueryClient plus centrally agreed query-key factories |
| `services/api/` | Typed async domain service objects, transport mapping and the agreed mutation boundary |
| `stores/` | Zustand client state and client-only persistence |
| `hooks/` | Reusable query/mutation behavior, debouncing and derived client rules |
| `types/` | Shared entity, filter, request, response and error interfaces |
| `utils/` | Pure calculations/validation; `storage.ts` is the explicit browser persistence adapter |
| `constants/` | Reused route/endpoint/status/location identifiers, without runtime state |

Dependency direction: pages/layouts → components/hooks → domain services → apiClient; stores, types, constants and utilities support their consumers. Services must not import React components, React hooks, Zustand stores or QueryClient. Query/mutation hooks handle cache effects; services validate/save/return results. There are no direct Axios/fetch calls or hardcoded API URLs inside components. Avoid a general `useFetch` layer that duplicates React Query.

`main.tsx` mounts React. `App.tsx` mounts `QueryClientProvider`, `RouterProvider` and the toast container. Zustand needs no Context cart provider. Keep React Query cached records out of Zustand to avoid competing authorities.

### State ownership

| Data | Owner | Persistence/cache |
|---|---|---|
| Fetched products, branches, stock and orders | React Query | Query cache; durable source is the fake API now, real backend later |
| Cart and client-only selections | Zustand | Validated, namespaced browser persistence |
| Form inputs, quantity picker, component-local dialog | `useState` | Local; no global store unless multiple components need it |
| Search/category/sort/page | URL query params and page state | Query keys include the normalized filters |
| Simple optional theme/language | Context or a small existing mechanism | Introduce only if assigned |
| Account session | Zustand `authStore` [later] | Real session behavior is defined with backend auth |

Use selectors when reading Zustand (for example, the header reads only the item count). Cart totals are derived with shared pure functions, not maintained as an independent mutable total. Query hooks handle loading/error/empty states and request cancellation; detail IDs, filters and branch IDs belong in the corresponding query keys. After an accepted mutation, update/invalidate relevant query caches before treating cached views as current. Disable submit while pending. Query reads may use the course's bounded retry setting; mutation automatic retries stay disabled until a safe retry contract is defined.

### Auth and scope adaptation

Session 7 also teaches demo login, registration and profile. This structural revision reserves their files but keeps the previously agreed account features in the later auth phase; it does not silently add mandatory frontend tasks. If the instructor requires the fake-auth milestone now, assign those tasks explicitly before wiring route guards. Once auth exists, checkout/orders/profile use protected routes, and Store management also needs a staff-role check. Frontend guards improve navigation; backend authorization remains mandatory.

Retain the project's agreed currency, delivery rules and statuses. The tutorial's example tax, phone length and token-storage snippets are not additional business requirements. Clear only this application's session keys and account-scoped query caches on logout; never clear all browser storage. No real card processing is part of the demo.

### Root configuration and fake API

The runnable repository baseline now uses `client/` and `server/`, with root `docs/`, `.gitignore`, `README.md`, and `AGENTS.md`. Vite and TypeScript both resolve `@/` to the client `src/`. The Express scaffold health service runs on port 5001, separate from the still-proposed future fake API. No `db.json`, `json-server`, or `dev:api` script is included; assign and validate that data/API contract before adding it. Each app has its own `.env.example`, and runtime `.env` files stay local.

Normalize the fake API's plain arrays and total-count header into one typed `PaginatedResponse<T>` inside the service layer. Pages always consume that agreed result shape. Map filters to the fake API's `_page`, `_limit`, `q` and domain-category parameters there; map the real backend response in the same boundary later. Do not mix the tutorial's array examples with `.data` pagination access in the same page.

### Store service and cache map

| Operation | Hook/cache identity | Service boundary |
|---|---|---|
| Products/details | `useProducts`; products + normalized filters or product ID | `api/products.ts` reads `/products` and `/categories` |
| Branches | Branch/location read key | `api/branches.ts` reads `/locations` |
| Stock | `useInventory`; stock + location ID | `api/inventory.ts` delegates state reads to `api/store.ts` |
| Orders/details | `useOrders`; orders or order + ID | `api/orders.ts` delegates to `api/store.ts` |
| Receipt/transfer | Inventory mutation; invalidate stock and transfer/receipt keys | `api/store.ts` owns the one serialized write path |
| Checkout | Order mutation; invalidate orders and all affected branch-stock keys | `api/orders.ts` delegates createOrder to `api/store.ts` |

Use namespaced cart/favorites keys such as `react-store-cart` and `react-store-favorites`. Member 3 owns `stores/cartStore.ts`, including the selected branch even when the cart is empty. Member 1's BranchSelector calls that store's guarded actions. A Clear cart and switch action persists the full next cart/branch state before publishing success; a save failure preserves the old state. Zustand persist middleware alone is not proof of that guard: implement and verify the storage adapter/action boundary.

Future fake API design: `db.json` may contain product/category/location resources plus `storeStates: [{ id: "demo", balances, receipts, transfers, orders, processedRequests }]`. This is a schema sketch, not an implemented contract or literal seed JSON. If adopted, `services/api/store.ts` should own aggregate mutations and `api/inventory.ts` / `api/orders.ts` should be thin facades. No cart API or server-synced cart is required in this phase.

If the future json-server fake API is adopted, a single-active-tab queue is only a classroom safeguard: json-server does not supply stock transactions, compare-and-swap, authorization or cross-user uniqueness. A missing response can follow a successful save. Preserve the request ID and cart while unresolved, reconcile using a fresh aggregate read, and do not blindly overwrite it with a stale retry. Durable database transactions and race handling remain SB05–SB07/SB10.

### File ownership

| Member | Primary files/directories | Shared-edit agreement |
|---|---|---|
| Member 1 | `App.tsx`, `main.tsx`, `components/common/`, `components/layout/`, `layouts/`, `routes/`, `services/apiClient.ts`, `services/queryClient.ts`, route constants, `pages/Branches/`, `components/inventory/StockTable.tsx` | Owns setup/provider composition and the reusable stock table; coordinates root config |
| Member 2 | `pages/Products/`, `pages/Favorites/`, `pages/Home/`, `components/products/`, `hooks/useProducts.ts`, `services/api/products.ts`, `stores/favoritesStore.ts`, product types | Supplies product/category data during an API handoff |
| Member 3 | `pages/Cart/`, `components/cart/`, `stores/cartStore.ts`, optional derived `hooks/useCart.ts`, cart types and money/totals/storage helpers | Owns the one cart/branch state; checkout and inventory reuse agreed helpers |
| Member 4 | `pages/Checkout/`, `pages/Orders/`, `components/checkout/`, `components/orders/`, `hooks/useOrders.ts`, `services/api/orders.ts`, order types | Receives exclusive `services/api/store.ts` handoff for S27, then returns ownership |
| Member 5 | `pages/Warehouse/`, `pages/Transfers/`, inventory components except StockTable, `hooks/useInventory.ts`, `services/api/store.ts`, `services/api/inventory.ts`, `services/api/branches.ts`, inventory/location types/constants | Owns aggregate persistence and location/stock seeds except accepted handoffs |

When a fake API is assigned, Member 1 coordinates its data file; Member 2 supplies catalog entries; Member 5 supplies location/aggregate entries in sequence. Return root-file coordination to Member 1 after acceptance. Each owner proposes shared query keys/types before depending on them. Helpers shared across owners are changed through an explicit handoff, never simultaneous edits. Auth/profile/UI-store files remain uncreated until assigned.

## 4. Data and business rules

| Entity | Minimum agreed fields |
|---|---|
| Product | id, name, description, categoryId, priceMinor, imageUrl, active |
| Location | id, name, type (`warehouse` or `branch`), address |
| Stock balance | locationId, productId, quantity |
| Receipt | id, productId, quantity, warehouseId, createdAt |
| Transfer | id, productId, quantity, fromLocationId, toLocationId, createdAt |
| Cart | branchId, items containing productId and quantity |
| Order | id, requestId, branchId, item snapshots, totals, customer, address, createdAt, status |

Use three stable location IDs: one warehouse and two branches. Product data is shared across branches; balances are separate. For this scope, prices are the same at both branches. A stock balance of zero means unavailable; it does not delete the product.

Store invariants:

1. Warehouse stock is not directly sellable on the customer site. A customer order uses exactly one selected branch.
2. A cart does not reserve stock. Availability shown while browsing is advisory; submission validates again.
3. Quantities are positive whole numbers. No operation may leave negative stock.
4. A transfer moves stock from the warehouse to one branch. The source decreases and destination increases by exactly the same quantity. It does not increase total stock across locations.
5. A warehouse receipt increases warehouse stock only. Receiving and transferring are distinct operations.
6. An invalid/insufficient transfer changes neither balance and adds no success history record.
7. Changing branch with a nonempty cart offers Cancel or Clear cart and switch. It never silently moves an existing order/cart to another branch.
8. A confirmed demo save records the order and branch-stock deduction in one aggregate write. A confirmed validation rejection changes nothing. An ambiguous transport outcome remains unresolved until request-ID reconciliation; preserve cart/attempt data and clear the cart only after confirmed success.
9. Order history keeps names and unit prices captured when ordered; later catalog edits do not rewrite old orders.
10. Prices use one agreed currency and integer minor units (for example, cents in a two-decimal currency). Derive totals from lines; format only for display. Currency is a team decision.

Demo integrity boundary: `services/api/store.ts` exclusively reads/validates/writes `/storeStates/demo` through the one Axios client. It serializes receipt/transfer/order changes for one active demo tab. Inventory and order facades delegate to it. One aggregate PUT is a teaching compromise, not a database transaction or cross-user stock guarantee.

For receipts, transfers and orders, keep the same request ID while retrying/reconciling the same attempt. A saved ID with the same payload returns the saved result; the same ID with a different payload is rejected. A new deliberate operation gets a new ID. A read/network error is not proof that the previous write failed; reconcile against the API and surface an unresolved state while uncertain.

Member 5 owns `services/api/store.ts`. Member 4 adds order creation during an exclusive S27 handoff after receipt and transfer operations are accepted. Return file ownership to Member 5 after S27. Member 3 owns separate Zustand cart/branch persistence. A cart-storage failure preserves the previous cart/branch state. Do not claim failed HTTP response means unchanged saved stock.

Future backend authority: product prices, warehouse/branch balances, transfers, and actual order creation belong on the server. Clients send product IDs, quantities, and branch choices; the server calculates and validates accepted results. Browser demo history is not evidence of a real order.

## 5. Task sizing and usage

Each table row is intended to become one GitHub issue and usually one small PR. Tasks are scoped for roughly a focused half-day where practical, but this is not a schedule estimate. Split a row if the assignee cannot explain a single observable outcome or finish it in a reasonable working session. Combine a tiny pair only if ownership and review remain clear.

All task statuses start **Not started**. Dependencies name tasks that must be merged before dependent behavior can be accepted. Developers may build isolated UI against an agreed mock contract earlier.

Every UI task includes responsive styling, accessible labels/focus, and its relevant loading/error/empty state. Every rule task includes a meaningful check of both success and failure. A visually finished page without connected behavior does not complete the issue.

## 6. Frontend tasks

### Member 1 — foundation and branches

| ID | Small task | Depends on | Done when |
|---|---|---|---|
| S01 | Initialize course stack, @/ alias, apiClient/queryClient, fake API script and README | — | Another member can install/run/build from the documented steps |
| S02 | Record routes/constants, shared TypeScript interfaces, file ownership, and inventory rules with team | S01 | Everyone agrees field names, service results, and non-goals before feature integration |
| S03 | Implement global styles and shared controls in components/common | S02 | Common controls show consistent normal, disabled, error, and keyboard-focus states |
| S04 | Add centralized routes, MainLayout/AdminLayout, layout components, and not-found page | S03 | All planned routes open; an unknown route shows a useful recovery link |
| S05 | Build components/layout/BranchSelector using cartStore selectors/actions | S02,S04,S18,S33 | Both branches load from the branch service and can be selected; reload preserves a valid selection from the one shared snapshot |
| S06 | Connect branch switching to nonempty-cart confirmation | S05,S20 | Cancel preserves branch/cart; confirm clears cart and switches exactly once |
| S07 | Build shared components/inventory/StockTable and pages/Branches stock page | S05,S33 | Selecting a branch shows its own quantities; zero/empty/error states work |
| S08 | Complete integration, static-host route configuration, and setup documentation | All other S tasks | Full customer/stock journeys pass; deep-link refresh works in the preview/deployment configuration |

### Member 2 — catalog and favorites

| ID | Small task | Depends on | Done when |
|---|---|---|---|
| S09 | Create product/category db.json entries, types and services/api/products.ts | S02 | Stable IDs/shapes exist; delay/error/empty responses can be demonstrated |
| S10 | Build components/products/ProductCard and React Query catalog grid | S03,S05,S09,S33 | Cards show correct image, name, price, and selected-branch availability |
| S11 | Implement product search and category filtering | S10 | Search and category combine correctly; clear filters restores results |
| S12 | Add sorting and pagination | S11 | Sort applies before pagination; filter changes reset page and counts stay correct |
| S13 | Build pages/Products/ProductDetails.tsx route | S04,S09 | Direct valid link works; bad/missing/inactive product has a useful state |
| S14 | Add stores/favoritesStore.ts and favorites persistence | S10,S13 | Toggle works across list/details and survives refresh; empty favorites is handled |
| S15 | Build pages/Home/index.tsx with featured products and catalog links | S04,S10 | Featured cards navigate to correct details and branch choice remains visible |
| S16 | Integrate add-to-cart and stock feedback in catalog/details | S13,S20,S33 | Correct product is added; unavailable products cannot be added; branch changes refresh availability |

### Member 3 — cart and totals

| ID | Small task | Depends on | Done when |
|---|---|---|---|
| S17 | Define typed Zustand cart/branch actions in stores/cartStore.ts | S02 | Add/update/remove/clear/select-branch have stable contracts and one shared state |
| S18 | Add cart/branch persistence and restore validation | S17 | Reload restores the selected branch and valid lines together; malformed or obsolete data falls back safely with appropriate feedback |
| S19 | Build pages/Cart using components/cart line/summary controls | S03,S17 | Quantity updates/removal/empty cart work without negative or fractional quantities |
| S20 | Enforce branch ownership and add-to-cart stock checks | S05,S17,S33 | Same product merges only within selected branch; quantity cannot exceed current known branch stock |
| S21 | Implement pure shared utils/money.ts and utils/totals.ts calculations | S02,S17 | Cart and checkout use the same arithmetic; amounts display in agreed currency |
| S22 | Add header cart count and cart navigation | S04,S17 | Count equals total quantity and updates from any page |
| S23 | Refresh cart availability and show changed-stock issues | S19,S20 | A cart made stale by a transfer/order cannot silently submit unavailable quantities |
| S24 | Verify cart boundaries and hand off checkout snapshot | S06,S18,S21,S23 | Add twice, refresh, bad storage, insufficient stock, remove last line, and branch switch are checked |

### Member 4 — checkout and orders

| ID | Small task | Depends on | Done when |
|---|---|---|---|
| S25 | Build customer/address form in pages/Checkout | S03,S19 | Required/invalid fields show useful messages; empty cart cannot proceed |
| S26 | Connect read-only branch/items/totals summary | S21,S25 | Summary matches cart and branch; user sees what will be submitted |
| S27 | Implement createOrder in services/api/store.ts during exclusive service handoff | S02,S21,S33,S34,S36,S37 | Stock/order snapshot uses one aggregate write and outcome reconciliation; returns a typed confirmed/unresolved result; file returns to Member 5 |
| S28 | Connect React Query order mutation, pending state and request-ID reconciliation | S26,S27 | Single-tab rapid repeats have one confirmed result; inventory/order caches refresh on confirmation; ambiguous response preserves cart/request ID |
| S29 | Build order confirmation page | S28 | Displays the saved returned order ID, branch, lines, and total; cart clears only after success |
| S30 | Build pages/Orders/index.tsx history list | S27 | Saved orders appear after refresh; no-orders and load failure states work |
| S31 | Build pages/Orders/OrderDetails.tsx route | S30 | Direct saved-order link works; missing order handled; snapshot prices remain unchanged |
| S32 | Verify checkout failure and order integrity cases | S28,S29,S31 | Stale stock, duplicate attempt, confirmed rejection, ambiguous save response, and catalog-price change behave as specified |

### Member 5 — warehouse and inventory

| ID | Small task | Depends on | Done when |
|---|---|---|---|
| S33 | Seed locations/storeStates in db.json; expose services/api/branches.ts and inventory.ts reads | S02,S09 | Branch records and stock reads load; every product has interpretable location-specific balances |
| S34 | Implement serialized mutations and safe snapshot persistence in services/api/store.ts | S33 | Validation rejection changes nothing; confirmed saves publish state; timeout reconciles request ID before any retry |
| S35 | Build pages/Warehouse using shared StockTable | S07,S33 | Warehouse quantities are visible separately from branch quantities |
| S36 | Implement warehouse receipt operation | S34 | Positive whole quantity increases warehouse only and saves one receipt; invalid input changes nothing |
| S37 | Implement warehouse-to-branch transfer operation | S34 | Valid transfer conserves total stock; invalid/insufficient transfer changes neither location |
| S38 | Build warehouse receipt and transfer forms | S03,S35,S36,S37 | User chooses product/destination, sees validation/pending/success/failure, and cannot submit duplicates while pending |
| S39 | Build receipt/transfer history view | S36,S37 | Saved records show product, quantities, locations, date; reload preserves history |
| S40 | Verify inventory boundaries and checkout integration | S27,S38,S39 | Confirmed receipts/transfers/orders update balances/history; validation rejection changes nothing; ambiguous responses remain unresolved until reconciliation |

Recommended Store routes: `/`, `/products`, `/products/:id`, `/favorites`, `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/management/warehouse`, `/management/branches/:branchId`, `/management/transfers`. Receipt forms/history may live on the warehouse page. Management routes are a frontend demonstration, not secure staff authorization.

Example acceptance dataset: product A starts warehouse=20, Branch 1=5, Branch 2=3. Receive 4 → 24/5/3. Transfer 6 to Branch 2 → 18/5/9. Order 2 from Branch 2 → 18/5/7. Attempt transfer of 19 → reject and retain 18/5/7. Attempt another order of 8 from Branch 2 → reject with unchanged stock and no new order.

## 7. Milestones and integration

| Milestone | Work | Exit evidence |
|---|---|---|
| Store A: agreements | S01–S05, S09, S17,S18,S21,S33; partial work can proceed against agreed contracts | App starts, branch chosen, product/stock/cart shapes agreed, one shared money rule |
| Store B: smallest complete sale | S10,S13,S16,S18–S20,S22,S25–S29,S34,S36,S37 and necessary shared pieces | Choose branch → open one product → cart → saved demo order; branch stock decreases correctly |
| Store C: stock operations | S07,S35–S40 | Receive → transfer → branch availability → successful/failed order all agree |
| Store D: complete customer scope | S06,S11,S12,S14,S15,S23,S24,S30–S32,S08 | All required customer features, failure cases, review, and deployment preparation pass |

These are dependency milestones, not calendar weeks. At each milestone, take one ready issue per person. Blocked members can build isolated UI against agreed fixtures, review a PR, or run a specified integration scenario. Do not edit another member's unfinished module without a handoff. Accept the stock mutation boundary before checkout integration. S08 waits for all other required S tasks.

## 8. Backend tasks — later phase

These tasks belong to the later backend phase. All five members will need backend learning/pairing. Choose the course-required stack before estimating. Preserve service contracts where practical and record deliberate changes. Define endpoint paths and schemas before implementing adapters.

| ID | Future task | Primary owner | Done when |
|---|---|---|---|
| SB01 | Choose stack; initialize server, error/validation convention, migrations and seeds | 1 | Fresh server/database setup is reproducible |
| SB02 | Create product, location, balance, receipt, transfer and order schema | 2, reviewed by 3/4/5 | Keys, constraints and relations preserve the agreed data rules |
| SB03 | Implement authentication/authorization with Login.tsx, AuthLayout, ProtectedRoute, useAuth and services/api/auth.ts | 1 | Staff operations are restricted and customers can read only their own orders; guest access needs an explicit design |
| SB04 | Implement product, branch and stock read endpoints | 2 | Search/filter/pagination/details and branch stock follow the agreed contracts |
| SB05 | Implement warehouse receipt transaction | 5 | Balance and receipt commit together; invalid input has no effect; an accepted retry does not receive twice |
| SB06 | Implement stock transfer transaction | 5, pairing 3 | Source/destination/history commit together; concurrent requests cannot overdraw stock; retries do not transfer twice |
| SB07 | Implement order transaction and idempotency | 4, pairing 3 | Server prices items and saves order plus branch-stock deduction atomically; retries return the same accepted result |
| SB08 | Point apiClient to real backend and adapt services/api response/mutation contracts | 1 coordinates; each feature owner | Connected UI handles network/server errors and retries |
| SB09 | Implement authoritative order history/details and identity migration | 4, pairing 1 | History is scoped to user; demo orders are labeled/cleared rather than uploaded as real orders |
| SB10 | Verify concurrency, rollback, duplicate requests and tampering | 3 leads, all contribute | Transfer/order races, transaction failure, altered client price/branch, and unauthorized access are checked |
| SB11 | Prepare backend/frontend release configuration | 1, reviewed by 5 | Migrations, secrets, allowed origins, routing and service URLs are documented/configured |
| SB12 | Verify deployed stock-to-order journey | All five | Deployed API/database evidence proves receipt → transfer → sale and failed-operation invariants |

Pair Members 3+5 on inventory transactions and Members 1+4 on identity/order access. Real payment integration and notifications remain optional independent scopes. A timeout does not prove rejection: retry/reconcile a mutation with its original request ID.

## 9. GitHub workflow and issue template

Keep the issue list in the react-Store repository. Board columns: Backlog → Ready → In progress → Review → Done. Useful labels: `foundation`, `catalog`, `cart`, `checkout`, `orders`, `inventory`, `bug`, `frontend`, `backend-later`.

- Keep `main` runnable. Use feature branches such as `feat/S37-stock-transfer`.
- One active implementation issue per person. Each issue has one accountable owner.
- Open small PRs linked to task IDs; include screenshots for UI and actual verification results.
- One peer approves before merge. The setup owner coordinates app entry, routes/layouts/shared-component/package edits and integration; other feature owners request those edits or get a scheduled handoff.
- Pull the latest main before starting and before final integration checks. Never overwrite a teammate's work to resolve a conflict.
- Assign ownership to shared files explicitly. In particular, serialize edits to the Store mutation service and order-service handoffs.

Copy this into each issue:

```markdown
Task ID and title:
Owner:
Outcome (one observable result):
Dependencies:
Allowed files/module (use the file-ownership table):
Inputs/outputs and shared contracts:
Acceptance checklist:
- Success behavior
- Relevant empty/loading/error/invalid behavior
- Relevant rule/invariant
Verification performed:
Screenshots/demo notes:
Out of scope:
```

Use this document's rows as issue descriptions, then add the exact files once the app is initialized. No GitHub issues, branches, or commits were created by preparing this plan.

## 10. Completion checks

Each feature owner supplies the relevant behavior checks. Automate calculations, Zustand store actions, stock mutation invariants and duplicate submission cases where practical; do not spend time writing tests that only assert static markup. Use a browser smoke pass for the connected journeys and responsive/keyboard behavior.

Frontend release candidate:

- The `@/` alias resolves in both TypeScript and Vite; typecheck and production build accept the same imports.
- Shared props, services and query results use strict TypeScript interfaces without `any`; route lazy loading uses a visible Suspense fallback when introduced.
- Server records are read through React Query hooks and typed `services/api/` modules; client-only state has one Zustand owner. No duplicate cart provider or fetched-data store exists.
- Query keys contain relevant filters/detail/branch IDs; stock/order/status mutations refresh affected cached views.
- A fake API write timeout remains unresolved until reconciled; no success toast, cart clear or blind mutation retry follows an unconfirmed outcome.
- README documents the actual client/server scripts, health endpoint, port selection, `.env.example`, current scaffold limits and later auth entries. If json-server/db.json is added in a later task, document its limitations separately.

- Install, lint, any configured tests/typecheck, and production build pass using the scripts actually defined in that repository.
- All required task acceptance conditions pass; record the commands and outcomes in the PR/project notes.
- Loading, error/retry, empty, unknown-route, bad-ID, refresh, and storage-failure cases are covered at their relevant boundaries.
- Store balances/receipts/transfers/orders agree with the example dataset and invariants.
- Mobile and desktop layouts are usable; controls have labels, keyboard focus, and readable feedback.
- Demo checkout/management behavior is accurately labeled. Do not collect payment card details or call browser-only role selection secure access control.
- README states how to run, how to exercise demo failure/status/stock cases, what is implemented, and what waits for backend.
- Deployment configuration supports direct route visits/refresh. Local build evidence and deployed verification are recorded separately.

Next ready work: agree branding and currency; use the Session 7 Tailwind convention; assign real names to Members 1–5; start S01/S02. Backend implementation is not required before the React learning phase.
