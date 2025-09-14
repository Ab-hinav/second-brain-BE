# Second Brain API (Phase 0)

A small, fast TypeScript API to organize your “second brain” — items like tweets, links, notes, and YouTube videos — into user-owned brains with tags and counts.

Stack: Fastify 5, TypeScript, Zod, Knex (Postgres), fastify-jwt, bcrypt, Swagger.

## Overview

- Brains: A user can create one or more “brains” that own items and tags.
- Items: Currently supports creating Tweet items; more types coming soon (links, notes, videos, YouTube).
- Tags: Tags are per-brain with composite uniqueness `(brain_id, name)` and linked to items via `item_tags`.
- Auth: Email/password auth with JWT; optional FE assertion exchange using ES256 JWS.
- Docs: Optional Swagger UI, plus typed request/response via Zod.

## Project Structure

- `src/server.ts`: App bootstrap, plugin and route registration.
- `src/plugins/*`: Environment validation, security (CORS/helmet/rate-limit), Knex (PG), auth (JWT + bcrypt), Swagger.
- `src/routes/*`: Versioned HTTP routes (mounted under `/api/v1` for authenticated endpoints).
- `src/helpers/*`: Route logic split into helpers (DB queries, validation, mapping).
- `src/util/*`: Error class, error handling plugin, small helpers.

Database: Postgres with searchPath `app`. Ensure your tables exist in the `app` schema or adjust `searchPath` in `src/plugins/knex.ts`.

## Environment

Copy `.env.example` to `.env` and fill values:

```
NODE_ENV=development
HOST=0.0.0.0
PORT=4000
LOG_LEVEL=info

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=second_brain

# JWT for API
JWT_SECRET=your-long-random-secret

# Frontend JWS (optional assertion exchange)
FE_JWS_PUBLIC_PEM="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
FE_JWS_ISS=your-fe-issuer
FE_JWS_AUD=your-fe-audience

# Rate limit
RATE_LIMIT_MAX=120
RATE_LIMIT_TIME_WINDOW=1 minute

# Swagger
SWAGGER_ENABLED=true
SWAGGER_ROUTE=/docs
```

## Run

```bash
npm i
npm run dev         # Dev mode (TSX + pino-pretty)

# Or build + start
npm run build
npm start
```

Swagger UI (if enabled): `http://localhost:4000/docs`

Health: `GET /health` or `GET /health?extended=true` (runs `select 1`).

## Authentication

Two flows are supported:

- Email/password
  - `POST /api/v1/signup` → 201
  - `POST /api/v1/signin` → `{ access_token, refresh_token, expires_at }`
  - `GET  /api/v1/me` → `{ name, email, avatar_url }`
  - `POST /api/v1/auth/refresh` → new token pair

- FE Assertion Exchange (optional)
  - `POST /api/v1/auth/exchange` with a FE-signed ES256 JWS
  - BE verifies using `FE_JWS_PUBLIC_PEM`, then issues API JWTs

Attach `Authorization: Bearer <access_token>` to all authenticated endpoints below.

## Routes (Phase 0)

- Brains
  - `GET  /api/v1/brain-nav`
    - Returns brains owned by the user and boolean flags indicating which content types exist.
  - `POST /api/v1/brain` `{ name, description? }` → `{ id }`
  - `GET  /api/v1/brain-detail/:brainId` → `{ id, name, description, counts }`

- Items
  - `POST /api/v1/item/tweet`
    - Body: `{ title, content, tags: string[], brainId, url?, pinned }`
    - Behavior: Inserts `items` row (content_type=`tweet`), fetches oEmbed for `url` if provided, upserts tags by `(brain_id, name)`, and inserts rows in `item_tags`.

- Misc
  - `GET /api/v1/tags`
    - Returns `{ name, color }[]` for all tags across user-owned brains.

## How It Works

- Plugins
  - `env`: Validates env vars via Zod and decorates `app.config`.
  - `security`: sensible, CORS, helmet, rate-limit.
  - `knex`: Postgres connection with `searchPath: ['app']`, decorates `app.knex`.
  - `auth`: JWT-based auth with bcrypt, decorates `app.authenticate` for route guards.
  - `swagger`: Optional OpenAPI docs.
  - `errors`: NotFound + central error handler (Zod-aware + AppError).

- Brains and Items
  - Brain ownership is enforced by `owner_id` checks before returning details.
  - Content type flags are derived from `items.content_type` per brain.
  - Tag upsert uses `.onConflict(['brain_id','name']).merge()` so tag names can repeat across brains.

## Data Model Notes (expected)

This service expects (names indicative):

- `brains(id, owner_id, name, description, is_default, created_at, ...)`
- `items(id, brain_id, title, content, content_type, url, is_pinned, metadata jsonb, created_by, created_at, ...)`
- `tags(id, brain_id, name, color, ...)`
- `item_tags(item_id, tag_id)`

Constraints recommended:

- Unique `(brain_id, name)` on `tags`.
- Optional unique `(owner_id, name)` on `brains` (Phase 0 uses this uniqueness scope).

## Examples

Create brain

```bash
curl -X POST http://localhost:4000/api/v1/brain \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Work","description":"My work brain"}'
```

Create tweet item

```bash
curl -X POST http://localhost:4000/api/v1/item/tweet \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"tweet","content":"...","tags":["fastify","ts"],"brainId":"<brain_id>","url":"https://x.com/...","pinned":false}'
```

Brain detail with counts

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/brain-detail/<brain_id>
```

## Phase 0 Status

Done

- Auth: signup, signin, me, refresh, optional FE assertion exchange
- Brains: create, navigation flags, detail counts
- Items: create Tweet item with oEmbed + tags
- Tags: list all tags across user-owned brains
- Infra: env validation, security bundle, knex/pg, swagger (optional), central error handling

To Do (next)

- Additional item types: links, notes, videos, YouTube
- Item listing (filter by brain, tag, type, pinned), detail, edit, delete
- Tag management (rename, delete, merge);
- Search and pagination
- Tests (unit/integration) and CI
- Seed/migrations and Docker compose for DB
- Rate limits and quotas per-user (tuning)

## Dev Tips

- Ensure the `app` schema exists in Postgres or adjust `searchPath` in `src/plugins/knex.ts`.
- For FE JWS exchange, you can generate keys with `src/scripts/key-gen.ts` (ES256). Use the public key value in `FE_JWS_PUBLIC_PEM`.
- Logs use pino with pretty printing in dev; use `LOG_LEVEL=debug` for more details.
