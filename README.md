# Second Brain API

A fast, scalable TypeScript API to organize your "second brain" items (tweets, links, notes, videos) into user-owned spaces. Built with Fastify, Knex (Postgres), and Zod.

## Features

- **Brain Management**: Create and manage multiple brains to segregate content.
- **Item Support**: Store Tweets with auto-fetching oEmbed data (YouTube, Links, Notes coming soon).
- **Tagging**: Categorize items with tags unique to each brain.
- **Authentication**: JWT-based auth with Email/Password or Frontend Assertion Exchange.
- **Documentation**: Integrated Swagger UI.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Postgres Database

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Ab-hinav/second-brain-BE.git
    cd second-brain-be
    npm install
    ```

2.  **Configuration**
    Copy `.env.example` to `.env` and update the values.
    ```bash
    cp .env.example .env
    ```
    *Note: Ensure the `app` schema exists in your Postgres database or update `DB_SEARCH_PATH` in the config.*

3.  **Run the application**
    ```bash
    # Development
    npm run dev

    # Production
    npm run build
    npm start
    ```
    API will be running at `http://localhost:4000`.
    Swagger documentation available at `http://localhost:4000/docs`.

## API Routes

Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/signup` | Register a new user `{ name, email, password }` |
| `POST` | `/signin` | Login `{ email, password }` |
| `POST` | `/auth/refresh` | Refresh access token `{ refreshToken }` |
| `POST` | `/auth/exchange` | Exchange FE assertion for JWT `{ assertion, provider }` |
| `GET` | `/me` | Get current user profile |

### Brains
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/brain-nav` | List all brains with content type flags |
| `POST` | `/brain` | Create a new brain `{ name, description }` |
| `GET` | `/brain-detail/:brainId` | Get brain details and item counts |

### Items & Tags
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/item/tweet` | Add a Tweet `{ title, content, tags, brainId, url, pinned }` |
| `GET` | `/tags` | List all tags across brains |
| `GET` | `/prefill` | Fetch metadata for a URL (Public) |

### System
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | API health status (`?extended=true` for DB check) |
| `GET` | `/` | API Version |

## Development

- **Scripts**:
    - `npm run dev`: Start dev server with hot reload.
    - `npm test`: Run tests using Vitest.
    - `npx tsx src/scripts/key-gen.ts`: Generate keys for FE JWS exchange.

- **Stack**: Fastify 5, TypeScript, Knex (PG), Zod, Swagger.
