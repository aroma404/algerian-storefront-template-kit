# Internal integration contract

The browser uses the core registry's `commerce.api` client to call routes from the same Express server. The server owns prices, inventory, order references and persistence in `data/store-state.json`. A JSON write queue serializes checkout operations; the store writes a temporary file and atomically replaces the state file only after the complete updated state is valid.

| Route | Function |
|---|---|
| `GET /api/health` | Liveness plus `internal` persistence mode |
| `GET /api/catalog` | Internal live catalogue |
| `GET /api/catalog/:slug` | One internal product |
| `POST /api/orders` | Validated checkout with internal inventory reservation |
| `GET /api/orders/:reference?phone=` | Order tracking protected by reference and customer phone |

The checkout API accepts product IDs, quantity, selected option, delivery ID and payment method. It deliberately ignores browser-supplied prices and totals. If later adding an external payment provider, preserve the internal order store as the source of truth and validate signed provider webhooks on the server before changing payment status.
