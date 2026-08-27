# Single-folder integration

This one directory is a standalone React/Express/MySQL storefront. Select a template by editing `client/src/store/template.ts`; edit identity, catalog, operations and business metadata in the sibling `store/` modules. Those source files are intentionally plain TypeScript, so a developer can adapt them directly.

Set `DATABASE_URL` from `.env.example`, run `pnpm db:migrate`, then use `pnpm dev`. The client and internal commerce routes are delivered from one Express process and one origin. With no database URL the storefront operates in explicitly reported in-memory development mode; it never falsely reports that those orders survived a restart.

## API contract

| Route | Function |
|---|---|
| `GET /api/health` | Liveness plus `mysql` or `memory` persistence mode |
| `GET /api/catalog` | Live catalogue backed by MySQL when configured |
| `GET /api/catalog/:slug` | One live product |
| `POST /api/orders` | Validated checkout; server calculates all prices and reserves stock atomically |
| `GET /api/orders/:reference?phone=` | Order tracking protected by reference and customer phone |

The checkout API accepts product IDs, quantity, selected option, delivery ID and payment method. It deliberately ignores browser-supplied prices and totals. Wire a payment gateway by creating a payment adapter before changing an order from `confirmed` to `paid`; do not expose gateway secrets to the browser.
