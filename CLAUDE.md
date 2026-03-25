# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (or `pnpm dev`, `yarn dev` if using other package managers)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linter**: `npm run lint`
- **Run a single test**: *(No test suite configured yet – add tests and a script as needed)*

## High‑Level Architecture

- **Framework**: Next.js 16 app router (files under `app/`).
- **API layer**: Server‑side route handlers in `app/api/*` provide JSON endpoints.
  - `app/api/users/route.ts` – authenticates a user via email & bcrypt, returns minimal profile data.
  - `app/api/todos/route.ts` (also duplicated under `app/api/t/`) – CRUD for todo items, scoped to the authenticated user's `userId`.
- **Database**: MongoDB accessed through a singleton `clientPromise` defined in `lib/mongodb.ts`. Connection string read from `process.env.MONGODB_URI`.
- **Authentication flow**:
  1. `LoginForm` posts credentials to `/api/users`.
  2. On success the user's email is stored in `localStorage` and the UI redirects to `/dashboard`.
  3. Dashboard components read the stored email, fetch todos via `/api/todos?email=...`.
- **Frontend**:
  - UI built with React 19 and the **shadcn/ui** component library (`components/ui/*`).
  - Core pages: `app/page.tsx` (login), `app/dashboard/page.tsx` (main app).
  - Reusable components: `TodoList` (todo UI), `LoginForm`, various layout/utility components under `components/`.
- **State management**: Simple local React `useState` and `useEffect`; no external stores.
- **Styling**: Tailwind CSS (configured via `tailwindcss` and `postcss`).
- **Static assets**: Images in `public/`.
- **Configuration files**: `next.config.ts`, `tsconfig.json`, `package.json` (scripts & dependencies).

## Environment Variables

- `MONGODB_URI` – required for database connectivity.

## Development Tips

- API routes return `{ success: boolean, data?: any, message?: string }` – check the `success` flag before using `data`.
- The `clientPromise` pattern ensures a single MongoDB client per server instance.
- UI components expect the email to be present in `localStorage` under the key `email`.
- When adding new API endpoints, follow the existing pattern of exporting async `GET|POST|PUT|DELETE` functions that return `Response.json(...)`.
