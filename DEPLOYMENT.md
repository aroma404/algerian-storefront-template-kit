# Single-server deployment

Provision one MySQL-compatible database, set `DATABASE_URL`, and run `pnpm install --frozen-lockfile`, `pnpm db:migrate`, and `pnpm build`. Start the project with `pnpm start` and pass the hosting provider's `PORT` environment variable. The one Express process delivers the compiled React client and exposes its internal commerce routes from the same origin.

No standalone frontend deployment, reverse proxy, additional API service, or cross-origin configuration is required. Run `pnpm test` and `pnpm check` before deployment.
