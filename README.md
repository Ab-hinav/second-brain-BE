
# Second Brain API (Phase 0)

Fastify + TypeScript + Knex + Postgres. Auth via **Auth.js (NextAuth)** encrypted session JWT.

## Setup
```bash
cp .env.example .env
# Edit DATABASE_URL and NEXTAUTH_SECRET; set NEXTAUTH_SALT to your cookie name

npm i
npm run migrate:latest
npm run dev