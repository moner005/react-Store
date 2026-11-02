# React Store

React Store course project with a client shell, order review, contact page, API client configuration, and an Express health endpoint. The [project plan](docs/project-analysis.md) distinguishes these frontend additions from the 40 frontend and 12 later backend tasks that remain backlog. There is no fake API, database, authentication, order submission, or inventory mutation yet.

Main color scheme: [Rolex Store color palette](docs/rolex_store_color_palette.pdf).

## Current pages

- `/check-order` (also `/checkout`): review the shared in-memory cart, edit quantities/remove items, and calculate product subtotals in USD when price snapshots exist. Missing prices are shown as incomplete. Storage checks, tax, delivery, and order submission are pending; stock is never presented as confirmed.
- `/contact`: validated name/email/subject/message form plus Rolex website, retailer locator, Instagram, Facebook, and X links. The recipient email will be added later. Preparing a message does not send it.

The cart starts empty because catalog/add-to-cart integration is pending. It is not persisted across reloads. Other unfinished feature routes retain placeholder pages.

## Requirements

Node.js 24.14.1 and npm. Install each app independently; there is no root workspace.

## Client

```sh
cd client
npm ci
npm run dev
```

Open http://localhost:5173. Client checks: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Copy `.env.example` to `.env` only when changing the API origin. The default API base is `http://localhost:5001`.

## Server

```sh
cd server
npm ci
npm run dev
```

The API listens on port 5001 by default; `GET http://localhost:5001/health` returns the health response. Set `PORT` and `CLIENT_ORIGIN` using `server/.env.example`. Server checks: `npm run typecheck`, `npm run build`, `npm test`.

The server currently exposes only health and safe error responses. `docs/api-contract.md` distinguishes the implemented health contract from future proposed endpoints. The json-server/db.json fake API on port 5000 is not included.
