# Repository Guidelines

## Project Structure & Module Organization
- Backend NestJS code lives in `backend/src/**` with domain-focused modules (restaurants, places, ai, health). Build output is emitted to `backend/dist`.
- Frontend Nuxt 4 app sits under `frontend/` with pages, components, stores, and plugins following Nuxt defaults.
- Shared configs sit at the repo root (`docker-compose.yml`, `.env.example`, `scripts/init-mysql.sql`). Keep DTOs in `backend/src/**/dto` and entities under `backend/src/**/entities`.
- Sample environment files are in `backend/.env.example` and `frontend/.env.example`; copy them before local work.

## Build, Test, and Development Commands
- `cd backend && npm ci` — install backend dependencies.
- `npm run start:dev` (backend) — hot-reload API on port 3001.
- `npm run build` / `npm run start:prod` (backend) — compile to `dist` and run the production server.
- `npm run lint` / `npm run format` (backend) — run ESLint and Prettier.
- `npm test` / `npm run test:cov` (backend) — execute Jest specs and coverage.
- `cd frontend && npm ci` then `npm run dev` — start the Nuxt dev server on port 3000.
- `docker compose up -d --build` — launch full stack (MySQL, Redis, backend, frontend).

## Coding Style & Naming Conventions
- TypeScript across backend and frontend; use 2-space indentation.
- Prefer camelCase or kebab-case for filenames (`restaurant.service.ts`, `restaurant-card.vue`). Classes stay PascalCase.
- Run Prettier via `npm run format`; address lint feedback before committing.

## Testing Guidelines
- Backend tests use Jest with `*.spec.ts`; place suites in `backend/test` or next to source.
- Aim for meaningful coverage through `npm run test:cov`; add specs when touching services or controllers.
- Frontend testing is not yet configured—coordinate before introducing frameworks.

## Commit & Pull Request Guidelines
- Write imperative commit messages (e.g., `backend: add restaurant search filters`).
- PRs should state scope (frontend/backend), motivation, linked issues, and include env-change checklists.
- Provide screenshots or sample requests for UI or API changes, and note any manual test steps.

## Security & Configuration Tips
- Never commit secrets; load `.env` files from the provided samples.
- Key variables: DB credentials, Redis URI, `OPENAI_API_KEY`, `JWT_SECRET`, and `API_BASE_URL` for the frontend.
- Backend exposes `/health` for readiness checks—keep it green in deployments.
