# API contract

## Implemented

### `GET /health`

Returns HTTP 200 with JSON:

```json
{ "status": "ok", "service": "react-store-api" }
```

Unknown routes return HTTP 404 with `{ "error": { "message": "Not found" } }`. Unexpected server errors return HTTP 500 with `{ "error": { "message": "Internal server error" } }`; internal details are not exposed. CORS permits the configured `CLIENT_ORIGIN`.

## External catalog read

The integrated client uses Vite's `/api` proxy to read `GET /v1/models?brand=rolex&page=1&pageSize=24` from Dials. The list and details render catalog metadata. Catalog items can enter the browser cart with an unavailable price. This provider is separate from the Express server.

## Proposed, not implemented

The frontend order-review and contact pages do not add API endpoints. Stock checks, authoritative pricing, order submission, and contact email delivery remain unavailable. The contact recipient will be supplied later; local form validation does not send a message.

Product/category/branch/stock read endpoints, receipt/transfer mutations, order creation/history, authentication, and the json-server resources described in `docs/project-analysis.md` are future work. No endpoint URL or request schema for those features is currently implemented. Assign and agree those contracts before adding client calls.
