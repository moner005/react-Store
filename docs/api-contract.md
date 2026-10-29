# API contract

## Implemented

### `GET /health`

Returns HTTP 200 with JSON:

```json
{ "status": "ok", "service": "react-store-api" }
```

Unknown routes return HTTP 404 with `{ "error": { "message": "Not found" } }`. Unexpected server errors return HTTP 500 with `{ "error": { "message": "Internal server error" } }`; internal details are not exposed. CORS permits the configured `CLIENT_ORIGIN`.

## Proposed, not implemented

Product/category/branch/stock read endpoints, receipt/transfer mutations, order creation/history, authentication, and the json-server resources described in `docs/project-analysis.md` are future work. No endpoint URL or request schema for those features is currently implemented. Assign and agree those contracts before adding client calls.
