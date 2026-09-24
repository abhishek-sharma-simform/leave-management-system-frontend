# Leave Management — Frontend

A React + Vite frontend for the [`leave-management-system`](../leave-management-system) API. It
exercises every endpoint the backend exposes: authentication, leave requests
(apply / list / edit / cancel / history), leave balances, and the manager's
approval queue and team calendar.

## Stack

| Concern | Choice |
| --- | --- |
| Build tool | Vite |
| Language | TypeScript |
| Routing | React Router v6 |
| Global state | React Context (auth only) |
| HTTP | Axios, one shared instance |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Toasts | sonner |

Everything else — list data, balances, form state — is plain `useState` /
`useEffect` in the page that needs it. There is deliberately no data-fetching
or form library, so each screen's API calls stay visible at the call site.

## Running it

The backend must be running first:

```bash
cd ../leave-management-system
npx prisma db seed   # once, for the demo accounts and leave types
npm run dev
```

Then, copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to the
backend's URL:

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

Vite proxies `/api` to `VITE_API_BASE_URL` (see `server.proxy` in
[vite.config.ts](vite.config.ts)), so the app is same-origin in development and
needs no CORS configuration. To point at a backend on a different port or
host, change `VITE_API_BASE_URL` in `.env` — nothing else needs touching.

Other scripts:

```bash
npm run build     # tsc -b && vite build
npm run lint
npm run preview   # serve the production build
```

Note that `npm run preview` and any real deployment serve the app without
Vite's dev proxy, so `/api/v1` has to be routed to the backend by whatever is
in front of it (nginx, Caddy, etc.).

## Demo accounts

Created by the backend's `prisma/seed.ts`. The login screen has a button for
each one that fills the form.

| Role | Email | Password |
| --- | --- | --- |
| Manager | `manager@gmail.com` | `Manager@123` |
| Employee | `employee@gmail.com` | `Employee@123` |
| Employee | `employee2@gmail.com` | `Employee2@123` |

Both employees report to the manager, and only employees are seeded with leave
balances — a manager's own dashboard shows no balance cards.

## Screens

| Screen | Route | Role | Endpoints |
| --- | --- | --- | --- |
| Login | `/login` | — | `POST /auth/login` |
| Dashboard | `/dashboard` | both | `GET /leave-balances/me`, `GET /leave-requests/me?limit=5` |
| Apply Leave | `/leave-requests/apply` | both | `GET /leave-types`, `POST /leave-requests` |
| My Requests | `/leave-requests/me` | both | `GET /leave-requests/me` (paged, sorted, status filter) |
| Request Detail | `/leave-requests/:id` | owner | `GET /leave-requests/:id/history`, `PATCH /leave-requests/me/:id`, `POST /leave-requests/me/:id/cancel` |
| Balances | `/leave-balances` | both | `GET /leave-balances/me?year=` |
| Pending Requests | `/manager/requests` | MANAGER | `GET /manager/requests` |
| Manager Request Detail | `/manager/requests/:id` | MANAGER | `GET /manager/requests/:id`, `POST .../approve`, `POST .../reject` |
| Team Calendar | `/calendar` | MANAGER | `GET /calendar?month=&year=` |

## Layout

```text
src/
├── api/          one thin module per backend resource
├── components/
│   ├── layout/   AppLayout, ProtectedRoute, ManagerRoute
│   ├── shared/   StatusBadge, Pagination, tables, empty/error states
│   └── ui/       shadcn/ui primitives (generated — not hand-edited)
├── context/      auth context, provider and hook
├── features/     one folder per screen group
├── hooks/        useApiRequest
├── lib/          axios instance, error normaliser, formatting, auth storage
└── types/        API response types
```

This mirrors the backend's own layering, so `src/api/*` lines up with its
services and `src/features/*` with its controllers.

## Notes on a few decisions

**Error messages.** The backend returns three different error shapes: the Zod
`validate()` middleware gives `{ message, errors: [{ path, message }] }`,
`leaveRequest.controller.ts` gives `{ error }`, and the manager, calendar and
auth controllers give `{ message }`. [`src/lib/errors.ts`](src/lib/errors.ts)
normalises all three in one place, so every screen shows the server's real
message — including the 409 you get editing an already-approved request and the
"Insufficient leave balance" a concurrent approval can produce.

**Auth.** The token and user are kept in `localStorage`, so a refresh keeps you
signed in. The Axios request interceptor attaches the bearer token; the response
interceptor clears the session and redirects on any `401`, which covers both a
missing token and one that expired (they last a day). `ProtectedRoute` and
`ManagerRoute` mirror the backend's `authMiddleware` and
`requireRole("MANAGER")` — the guards are for navigation only, the API is still
the thing enforcing access.

**Dates.** The API stores dates as UTC midnight, so they are formatted in UTC
too. Formatting them locally would shift every date a day earlier for anyone
west of GMT.

**`useApiRequest`.** A ~40-line hook wrapping the fetch-and-render pattern the
screens share. Its loading flag is *derived* — it compares the fetcher that
produced the current result against the current one — rather than being set
inside the effect, which React's compiler lint rejects as a cascading render.
