# Repository Guidelines

## Project Structure & Module Organization
- Root: `docker-compose.yml`, `.env.example`, `scripts/init-mysql.sql`.
- Backend (NestJS + TypeScript): `backend/src/**` with domain modules (e.g., `restaurants`, `places`, `ai`, `health`). Build output in `backend/dist`.
- Frontend (Nuxt 4 + Tailwind + Pinia): `frontend/pages`, `components`, `stores`, `plugins`, `nuxt.config.ts`.
- Env samples: `backend/.env.example`, `frontend/.env.example`.

## Build, Test, and Development Commands
- Backend
  - `cd backend && npm ci` — install deps.
  - `npm run start:dev` — run API with live reload on `:3001`.
  - `npm run build` / `npm run start:prod` — compile and run from `dist`.
  - `npm run lint` / `npm run format` — ESLint and Prettier.
  - `npm test` / `npm run test:cov` — Jest unit tests (add tests as needed).
- Frontend
  - `cd frontend && npm ci` — install deps.
  - `npm run dev` — start Nuxt dev server on `:3000`.
  - `npm run build` / `npm run preview` — production build and preview.
- Docker (full stack)
  - `docker compose up -d --build` — MySQL, Redis, backend, frontend.

## Coding Style & Naming Conventions
- TypeScript everywhere (backend and Nuxt). Use 2‑space indentation.
- Follow Prettier defaults; fix lint with `npm run lint` (backend).
- Naming: modules/dirs kebab-case; classes PascalCase; files camelCase or kebab-case (`restaurant.service.ts`, `restaurant-card.vue`).
- Keep DTOs in `backend/src/**/dto`, entities in `**/entities`.

## Testing Guidelines
- Backend: Jest with file pattern `**/*.spec.ts`. Place tests under `backend/test` or alongside sources.
- Frontend: not configured; if added, prefer Vitest + Vue Test Utils.
- Target meaningful coverage for services and controllers; run `npm run test:cov`.

## Commit & Pull Request Guidelines
- Current history is informal; prefer clear, imperative messages, e.g. `backend: add restaurant search filters`.
- PRs should include:
  - Summary, scope (frontend/backend), and motivation.
  - Linked issue(s) and checklists for env changes.
  - Screenshots or GIFs for UI changes; sample requests for API changes.

## Security & Configuration Tips
- Copy envs from `*.env.example`; never commit secrets. Keys of note: DB, Redis, `OPENAI_API_KEY`, `JWT_SECRET`.
- Local dev: set `API_BASE_URL` in `frontend/.env` to backend URL.
- Health endpoint: backend exposes `/health` for readiness.

## Agent-Specific Instructions
- Respect this guide’s structure when editing. Prefer minimal, focused patches and keep changes within module boundaries. Update env samples and README when introducing new config.
