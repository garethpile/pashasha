# Local Development Workflow

## 1. Install Dependencies

```bash
npm install
```

This bootstraps workspace dependencies and links the shared `@pashashapay/contracts` package into the frontend and backend projects.

## 2. Prepare Environment Files

Run the bootstrap helper to copy `.env.local` templates and verify CLI dependencies:

```bash
./infra/scripts/bootstrap-local.sh
```

Populate the generated `.env` files with Paystack sandbox keys, Cognito placeholders, and database credentials (matching the Docker compose defaults).

## 3. Start Supporting Services

Launch local Postgres (and future services) via:

```bash
./infra/scripts/start-dev-services.sh
```

- Postgres is exposed on `localhost:5432` with credentials `guard_admin / local_secret`.
- Data persists in a Docker volume named `postgres_data`.

To stop services:

```bash
docker compose -f infra/scripts/docker-compose.dev.yml down
```

## 4. Useful Commands

| Action                    | Command                                 |
| ------------------------- | --------------------------------------- |
| Run frontend dev server   | `npm run dev:frontend`                  |
| Run backend with watcher  | `npm run dev:backend`                   |
| Type-check all workspaces | `npm run typecheck`                     |
| Lint all workspaces       | `npm run lint`                          |
| Format staged files       | `npm run format` (pre-commit via Husky) |

Backends default to port `4000`, frontends to `3000`. Ensure `.env` variables (`NEXT_PUBLIC_API_BASE_URL`, `PAYSTACK_SECRET_KEY`, etc.) align with the running services.

## 5. Testing the Flow

1. Start backend and frontend in separate terminals (`npm run dev` launches both).
2. Visit `http://localhost:3000/g/ldlamini` (placeholder path) to view the guard tipping page.
3. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/guards` to wire up live API calls once implemented.

## 6. Code Quality

Pre-commit hooks run `lint-staged` (Prettier). Run the full check locally before pushing:

```bash
npm run check
```

## 7. Contracts Package

Any shared types or client utilities should live in `packages/contracts`. After modifying, rebuild:

```bash
npm run build --workspace @pashashapay/contracts
```

This keeps generated declaration files (`dist/`) in sync for both frontend and backend consumers.

---
