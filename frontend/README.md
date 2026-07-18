# TripSense — Frontend

React 19 + Vite + TypeScript + Tailwind v4 SPA for the TripSense AI travel
platform. Talks to the FastAPI backend via a dev proxy (`/api → :8000`).

## Quick start

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The backend should be running on `http://localhost:8000` (see `../backend`).
Vite proxies `/api/*` to it, so there are no CORS issues in dev.

## Scripts

| Command           | What it does                     |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server with HMR              |
| `npm run build`   | Typecheck (`tsc -b`) + prod build|
| `npm run preview` | Serve the production build       |
| `npm run lint`    | Oxlint                           |

## Architecture

```
src/
  api/          axios client (auto token-refresh) + typed endpoints
  app/          providers (QueryClient, Theme, Auth, Router)
  components/
    ui/         design-system primitives (Button, Input, Card, Badge…)
    layout/     DashboardLayout, Sidebar, Topbar
    consultant/ CollectedInfoPanel
  contexts/     ThemeContext (dark/light), AuthContext (JWT + refresh)
  lib/          cn(), tokenStore, formatters
  pages/        LandingPage, auth/*, dashboard/*
  types/        API types mirroring backend DTOs
  index.css     Tailwind v4 theme tokens (light + dark)
```

## What's wired to the backend

- **Auth** — register / login persist JWT access+refresh in `localStorage`;
  the axios interceptor transparently refreshes on `401` and retries. Protected
  routes redirect to `/login`.
- **AI Consultant** (`/app/consultant`) — posts to `POST /api/v1/consult`,
  renders the conversation, shows which model answered (`via grok` /
  `via gemini`), and live-updates the **Trip details** panel from
  `collected_info` as the agent learns facts.
- **Dashboard** — reads `GET /api/v1/health` to show live AI/DB status.

## Theming

Class-based dark mode (`.dark` on `<html>`), driven by `ThemeContext` and
persisted. All colors are semantic HSL tokens in `index.css`, exposed to
Tailwind via `@theme inline` (`bg-surface`, `text-muted`, `border-border`…).
