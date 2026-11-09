# React Store

React Store course project with a storefront, a watch catalog, browser cart, order review and contact preview. The Express server provides a health endpoint. The [project plan](docs/project-analysis.md) records the integration and remaining work.

Main color scheme: [Rolex Store color palette](docs/rolex_store_color_palette.pdf).

## Current pages

- `/` shows the storefront and featured items. `/products` and `/products/:slug` show the Dials catalog and details.
- `/cart`, `/dashboard`, and `/check-order` (also `/checkout`) share the browser cart. Product subtotals are displayed in USD when all line prices are available. Stock checks, taxes, delivery, and order submission are pending.
- `/management/branches` loads the Dials catalog and links to watch details. Damascus/Latakia assignments are a demonstration, with stock availability pending.
- `/contact` includes a locally validated form and Rolex website, retailer locator, and social links. Email delivery awaits a recipient and sending service.
- `/login` and `/register` validate forms and use browser localStorage for demo accounts and sessions. Passwords in the demo user records are stored as plain text. Server authentication remains pending.

## Requirements

Node.js 24.14.1 and npm. Install each app independently; there is no root workspace.

## Client

```sh
cd client
npm ci
npm run dev
```

Open http://localhost:5173. Client checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Copy `.env.example` to `.env` only when changing the API origin. The default API base is `http://localhost:5001`.

The catalog reads through the Vite `/api` proxy to Dials. A separate deployment needs a corresponding proxy and SPA route fallback. The Express health server is independent of the catalog provider.

## Server

```sh
cd server
npm ci
npm run dev
```

The API listens on port 5001 by default; `GET http://localhost:5001/health` returns the health response. Set `PORT` and `CLIENT_ORIGIN` using `server/.env.example`. Server checks: `npm run typecheck`, `npm run build`, `npm test`.

The server currently exposes only health and safe error responses. `docs/api-contract.md` distinguishes the implemented health contract from future proposed endpoints. The json-server/db.json fake API on port 5000 is not included.
