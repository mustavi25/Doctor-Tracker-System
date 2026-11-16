# Doctor Tracker

Doctor Tracker is a secure, admin-only web portal for managing doctors and their patients. Admins sign in, create and search doctors, attach patients to them, edit or remove patient records, and watch a live dashboard of totals, patients per doctor, registrations over time and condition breakdowns. It is built as a Next.js client talking over REST to a standalone Express API backed by MongoDB, with the data model, indexes and query patterns designed so lists, filters and pagination stay fast as the data grows.

**Live demo:** `doctor-tracker-system-amber.vercel.app` · **API:** `https://doctor-tracker-api-k9qh.onrender.com/api/health`


---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Setup guide](#setup-guide)
4. [System architecture](#system-architecture)
5. [Technical decisions](#technical-decisions)
6. [Performance evidence](#performance-evidence)
7. [API reference](#api-reference)
8. [Project structure](#project-structure)
9. [Deployment](#deployment)
10. [Scalability and trade-offs](#scalability-and-trade-offs)
11. [Visual evidence](#visual-evidence)

---

## Features

| Area | What it does |
|---|---|
| **Authentication** | Email + password login. JWT stored in an `httpOnly` cookie. Every API route except login is protected; every portal page is route-guarded. Login is rate limited. |
| **Doctors** | Create / edit / delete. List with debounced search (name, email, hospital, specialization), specialization and hospital filters, added-date range, sorting and pagination. Page size 10 / 20 / 50. |
| **Doctor detail** | Profile card plus that doctor's patients: search, condition filter, sort, pagination, add patient, edit patient, delete patient. |
| **Patients** | Dedicated page: list all patients with their doctor, edit (including moving a patient to another doctor), delete, search, filters (condition, doctor, gender, date range), sort and pagination. |
| **Dashboard** | Total doctors and patients, average patients per doctor, new registrations (7 / 30 / 90 day range), area chart over time, patients-per-doctor bar chart (click a bar to open the doctor), condition donut, doctors by specialization. |
| **UX** | Responsive layout (sidebar on desktop, drawer on mobile, cards instead of tables on small screens), skeleton loaders, empty / error / not-found states, toasts, confirm dialogs, filters and pagination stored in the URL (refresh-safe, shareable, back-button friendly). |

## Tech stack

| Layer | Choice |
|---|---|
| Client | Next.js 16 (App Router, Cache Components), React 19, TypeScript, Tailwind CSS v4, shadcn/ui primitives, lucide icons |
| Client data | TanStack Query v5 (caching, request cancellation, `keepPreviousData` paging), Axios, React Hook Form + Zod, Recharts 3 (lazy-loaded) |
| API | Node.js, Express 5, Mongoose 9, Zod validation, `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `express-rate-limit`, `morgan` |
| Database | MongoDB (local or Atlas) |
| API style | REST + JSON, consistent `{ data, meta }` list envelope and `{ message, errors }` error envelope |

## Setup guide

**Prerequisites:** Node.js 20+ (developed on 22) and a MongoDB database: local, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster.

### 1. Clone

```bash
git clone <repo-url>
cd doctor-tracker
```

### 2. API (terminal 1)

```bash
cd server
npm install
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

Open `server/.env` and set at least `MONGO_URI` and `JWT_SECRET` (see the table below). Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Then load the demo data and start the API:

```bash
npm run seed                  # creates the admin user, 12 doctors, ~150 patients
npm run dev                   # http://localhost:5000  (health: /api/health)
```

> `npm run seed` **wipes** the users, doctors and patients collections before inserting. Never point it at data you want to keep.

### 3. Web app (terminal 2)

```bash
cd client
npm install
cp .env.example .env.local    # Windows PowerShell: copy .env.example .env.local
npm run dev                   # http://localhost:3000
```

Open http://localhost:3000 and sign in with `admin@doctortracker.com` / `Admin@12345`.

### Environment variables

`server/.env` (template: `server/.env.example`)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `MONGO_URI` | yes | | MongoDB connection string (include the database name) |
| `JWT_SECRET` | yes | | Secret used to sign login tokens (min. 8 chars; use a long random value) |
| `PORT` | no | `5000` | API port |
| `NODE_ENV` | no | `development` | `production` enables `Secure` cookies, `combined` logs, stricter login rate limit |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `CLIENT_URL` | no | `http://localhost:3000` | Allowed CORS origin |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | no | `admin@doctortracker.com` / `Admin@12345` | Credentials created by the seed script |

`client/.env.local` (template: `client/.env.example`)

| Variable | Required | Purpose |
|---|---|---|
| `API_URL` | yes | Where Next.js proxies `/api/*` to (e.g. `http://localhost:5000`). Server-side only; read when the app is built/started. |

The browser never talks to the API origin directly. `next.config.ts` rewrites `/api/:path*` to `${API_URL}/api/:path*`, which is what makes the auth cookie same-origin (see [Decision 2](#decision-2-httponly-cookie-jwt-behind-a-same-origin-proxy)).

### Useful scripts

| Command (in `server/`) | What it does |
|---|---|
| `npm run dev` / `npm start` | Start the API with nodemon / with node |
| `npm run seed` | Reset and load demo data |
| `npm run seed:bulk` | Reset and load ~200 doctors and ~20,000 patients, to see the indexes at work |
| `npm run explain` | Print the MongoDB query plan of every important query as a Markdown table |
| `npm run indexes` | Non-destructive: make the database indexes match the schemas (drops stale ones) |
| `npm run test:api` | 58 API integration checks (run on a freshly seeded DB with the API running) |

| Command (in `client/`) | What it does |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Develop / production build / serve the build |
| `npm run lint` | ESLint |

## System architecture

```mermaid
flowchart LR
    B["Browser<br/>(React 19, TanStack Query)"]
    subgraph Vercel["Next.js 16 app"]
      P["proxy.ts<br/>route guard"]
      R["rewrites<br/>/api/* proxied to the API"]
      S["App Router pages<br/>(static shell + client views)"]
    end
    subgraph API["Express 5 API"]
      MW["helmet - cors - json(10kb)<br/>cookie-parser - rate limit"]
      AU["protect<br/>(verify JWT cookie)"]
      V["Zod validate<br/>params - query - body"]
      C["controllers"]
      E["central error handler"]
    end
    DB[("MongoDB<br/>users - doctors - patients")]

    B -->|"page requests"| P --> S
    B -->|"fetch /api/..."| R --> MW --> AU --> V --> C
    C -->|"Mongoose (lean, indexed)"| DB
    C --> E
```

**Data flow for a typical request** (the Doctors list with a search term):

1. The user types. The search box waits 400 ms, then writes `?search=...` to the URL. The URL is the single source of truth for list state.
2. The page derives validated params from the URL and calls `useDoctors(params)`. TanStack Query caches by those params, cancels any outdated in-flight request, and keeps the previous page on screen while the new one loads.
3. Axios calls `GET /api/doctors?...` on the **Next.js origin**. A rewrite proxies it to Express, carrying the `httpOnly` cookie.
4. Express: security headers, then `protect` (verifies the JWT), then Zod validation (types, bounds, `limit <= 50`, unknown keys stripped), then the controller.
5. The controller builds an indexed filter, runs `find` and `countDocuments` in parallel, adds per-doctor patient counts with **one** grouped query for the whole page, and replies `{ data, meta }`.
6. Any failure goes to one error handler that returns `{ message, errors }` with the right status (400 validation, 401, 404, 409 duplicate, 500 hidden in production).

**Authentication flow**

```mermaid
sequenceDiagram
    participant U as Browser
    participant N as Next.js (proxy.ts + rewrite)
    participant A as Express API
    U->>N: POST /api/auth/login {email, password}
    N->>A: forwarded
    A->>A: bcrypt compare, sign JWT
    A-->>N: 200 + Set-Cookie token (HttpOnly, SameSite=Lax, Secure in prod)
    N-->>U: cookie stored for the Next.js origin
    U->>N: GET /dashboard (cookie)
    N->>N: proxy.ts checks the cookie exists, then serves the page shell
    U->>N: GET /api/dashboard/stats (cookie)
    N->>A: forwarded with cookie
    A->>A: protect: verify JWT signature + expiry
    A-->>U: 200 data (on 401 the client clears the cookie and redirects to /login)
```

## Technical decisions

### Decision 1: Patients as their own collection, with indexes designed from the query plans

**The choice.** Patients are a separate collection that references a doctor (`patient.doctor -> doctors._id`) instead of an array embedded in each doctor.

**Why not embed?** The spec needs a standalone Patients page that lists, filters, searches and paginates *all* patients, plus dashboard aggregations over patients. Embedded patients would make every one of those a scan-and-unwind over every doctor document, make paginating one doctor's patients awkward, and put an unbounded array inside a document (16 MB limit). A separate collection makes each of those a normal indexed query.

**The cost, and how it is paid.** Showing a doctor's patient count needs a second lookup. The doctors list does it with a *single* grouped query for the 10 doctors on the page (not 10 queries), and the patients list `populate`s only the 10 rows it returns. The dashboard groups first and `$lookup`s only the top 10 doctors, so it joins 10 documents instead of all of them.

**Index design.** List queries have a fixed shape: an equality filter (doctor, condition, specialization...), a sort on `createdAt` and a tie-breaker on `_id` (so pagination never skips or repeats rows). So each compound index is *equality field, then `createdAt`, then `_id`*, in the same direction as the sort:

```js
patientSchema.index({ doctor: 1, createdAt: -1, _id: -1 });    // one doctor's patients
patientSchema.index({ condition: 1, createdAt: -1, _id: -1 }); // condition filter
patientSchema.index({ createdAt: -1, _id: -1 });               // default list, date range
patientSchema.index({ name: 1, _id: 1 });                      // name sort
```

**What `explain()` taught me.** My first version had `{ createdAt: -1 }` and `{ doctor: 1, createdAt: -1 }`, which *looks* right. Running `npm run explain` on 19,440 patients showed otherwise: because the sort also includes `_id`, MongoDB could not use those indexes for ordering and fell back to an in-memory `SORT`. Adding `_id` to each index fixed it:

| Query (patients) | Before: plan | Before: docs examined | After: plan | After: docs examined |
|---|---|---:|---|---:|
| Default list (newest) | `SORT > COLLSCAN` | 19,440 | `LIMIT > FETCH > IXSCAN` | **10** |
| One doctor's patients | `SORT > FETCH > IXSCAN` | 166 | `LIMIT > FETCH > IXSCAN` | **10** |
| Condition filter | `SORT > FETCH > IXSCAN` | 1,972 | `LIMIT > FETCH > IXSCAN` | **10** |
| Date range (30 days) | `SORT > FETCH > IXSCAN` | 7,344 | `LIMIT > FETCH > IXSCAN` | **10** |

A page of 10 rows now costs 10 index entries and 10 documents regardless of how large the collection is.

**Known limits, stated honestly.** Free-text search uses an escaped, case-insensitive regex across several fields. That is what makes "ayes" find "Ayesha" (a MongoDB `$text` index only matches whole words), but an unanchored regex cannot use an index, so it scans (about 26 ms at 20k patients). At much larger scale the right move is Atlas Search or an n-gram index. The three dashboard `$group` aggregations must read every patient to count them (about 100-150 ms at 20k); index hints did not help (measured), so they are cached instead (below).

### Decision 2: `httpOnly` cookie JWT behind a same-origin proxy

**The choice.** The API issues a JWT in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). The browser only ever calls `/api/*` on the Next.js origin, and Next.js rewrites those calls to Express.

**Why not a bearer token in `localStorage`?** Any XSS bug (or a compromised npm package) could read `localStorage` and steal the session. An `httpOnly` cookie is invisible to JavaScript. Because the browser talks to a single origin, the cookie is first-party, there are no CORS preflights, and `SameSite=Lax` blocks cross-site form posts (CSRF) on top of the API being JSON-only.

**Two layers, with different jobs.**

- `proxy.ts` (Next.js 16's replacement for `middleware.ts`) redirects visitors without a session cookie to `/login`. It only checks that the cookie *exists*, so it is a UX guard and is never trusted for security.
- Express's `protect` middleware verifies the JWT signature and expiry on **every** API request. A forged cookie gets past the proxy and is rejected here with 401.

**Details that matter.** Login returns the same error for an unknown email and a wrong password (no user enumeration); passwords are hashed with bcrypt (cost 12); `/auth/login` is rate limited (10 attempts / 15 min in production); request bodies are capped at 10 KB; Zod strips unknown fields so clients cannot mass-assign. On any 401 the client first calls logout to clear the dead cookie, *then* redirects: otherwise `proxy.ts` would see a cookie on `/login` and bounce back to the dashboard in a loop.

**Trade-off.** A stateless JWT cannot be revoked before it expires (7 days here). The next step would be short-lived access tokens with a rotating refresh token, or a token-version field on the user.

### Other decisions, briefly

- **URL as the state of every list** (search, filters, sort, page, range). Refresh, back button and shared links all work, and there is no duplicated client state to keep in sync.
- **TanStack Query instead of Redux.** All shared state is server state. Query keys include the params; mutations invalidate by prefix (a doctor change refreshes doctor lists, patient lists and the dashboard).
- **Dashboard cache.** `GET /dashboard/stats` is cached in memory for 30 s, stores the *promise* (concurrent requests share one computation), and is cleared by every doctor/patient write, so numbers are never stale after a change. It is per-process; with several instances a shared cache (Redis) would replace it.
- **Native `<dialog>` and `<select>`.** The browser provides focus trapping, Escape handling and great mobile pickers, with no extra dependency.
- **Charts are lazy-loaded** (`next/dynamic`, client-only), so Recharts is only downloaded on the dashboard.
- **Render performance.** Table rows and mobile cards are memoised, handlers are stable, search is debounced, and `placeholderData: keepPreviousData` removes loading flicker between pages.

## Performance evidence

Reproduce with `npm run seed:bulk && npm run explain` (MongoDB 8, 200 doctors, 20,359 patients, page size 10):

| Query | Winning plan | Keys | Docs examined | Returned | ms |
|---|---|---:|---:|---:|---:|
| Doctors: default list (newest) | LIMIT > FETCH > IXSCAN(createdAt_-1__id_-1) | 10 | 10 | 10 | 0 |
| Doctors: filter specialization | LIMIT > FETCH > IXSCAN(specialization_1_createdAt_-1__id_-1) | 7 | 7 | 7 | 0 |
| Doctors: filter hospital | LIMIT > FETCH > IXSCAN(hospital_1_createdAt_-1__id_-1) | 10 | 10 | 10 | 0 |
| Doctors: date range (30 days) | LIMIT > FETCH > IXSCAN(createdAt_-1__id_-1) | 10 | 10 | 10 | 0 |
| Doctors: sort by name | LIMIT > FETCH > IXSCAN(name_1__id_1) | 10 | 10 | 10 | 0 |
| Doctors: text search (regex) | SUBPLAN > LIMIT > FETCH > IXSCAN(createdAt_-1__id_-1) | 200 | 200 | 0 | 1 |
| Patients: default list (newest) | LIMIT > FETCH > IXSCAN(createdAt_-1__id_-1) | 10 | 10 | 10 | 0 |
| Patients: one doctor's patients | LIMIT > FETCH > IXSCAN(doctor_1_createdAt_-1__id_-1) | 10 | 10 | 10 | 0 |
| Patients: filter condition | LIMIT > FETCH > IXSCAN(condition_1_createdAt_-1__id_-1) | 10 | 10 | 10 | 0 |
| Patients: date range (30 days) | LIMIT > FETCH > IXSCAN(createdAt_-1__id_-1) | 10 | 10 | 10 | 7 |
| Patients: sort by name | LIMIT > FETCH > IXSCAN(name_1__id_1) | 10 | 10 | 10 | 0 |
| Patients: text search (regex) | SUBPLAN > LIMIT > FETCH > IXSCAN(createdAt_-1__id_-1) | 70 | 70 | 10 | 26 |
| Dashboard: patients per doctor (`$group`) | GROUP > COLLSCAN | 0 | 20,359 | 200 | 145 |
| Dashboard: patients per day (30 days) | GROUP > PROJECTION_COVERED > IXSCAN(createdAt_-1__id_-1) | 8,461 | 0 | 31 | 65 |
| Dashboard: condition breakdown | GROUP > COLLSCAN | 0 | 20,359 | 10 | 107 |

Every paginated list is an index scan that stops after one page. The regex-search and `$group` rows are the deliberate exceptions discussed above. Other measures: `limit` is capped at 50 by validation, reads use `.lean()`, `find` and `countDocuments` run in parallel, the dashboard's totals use `estimatedDocumentCount` (about 1 ms), and the 7 write endpoints clear the dashboard cache.

## API reference

All routes are under `/api`. Everything except `POST /auth/login`, `POST /auth/logout` and `GET /health` requires the session cookie.

| Method | Route | Notes |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` sets the cookie |
| POST | `/auth/logout` | clears the cookie |
| GET | `/auth/me` | current user |
| GET | `/doctors` | `page, limit, search, specialization, hospital, from, to, sort` -> `{ data, meta }` (each doctor includes `patientCount`) |
| POST | `/doctors` | `{ name, specialization, hospital, phone, email }` |
| GET | `/doctors/filters` | distinct specializations and hospitals (filter dropdowns) |
| GET | `/doctors/options` | `{ _id, name, specialization }` for dropdowns (max 500) |
| GET / PUT / DELETE | `/doctors/:id` | delete also removes the doctor's patients |
| GET / POST | `/doctors/:id/patients` | list (`page, limit, search, condition, gender, from, to, sort`) / add |
| DELETE | `/doctors/:id/patients/:patientId` | |
| GET | `/patients` | `page, limit, search, condition, gender, doctor, from, to, sort` (doctor populated) |
| GET | `/patients/conditions` | distinct conditions |
| GET / PUT / DELETE | `/patients/:id` | PUT accepts `null` for `age`, `gender`, `phone` to clear them, and `doctor` to reassign |
| GET | `/dashboard/stats?days=7..365` | totals, patients per doctor, daily series, condition and specialization breakdowns |
| GET | `/health` | liveness probe |

`sort` is one of `newest`, `oldest`, `name_asc`, `name_desc`. List responses are `{ data: [...], meta: { page, limit, total, totalPages } }`. Errors are `{ message, errors?: [{ in, field, message }] }`.

## Project structure

```
doctor-tracker/
├── README.md  ·  render.yaml  ·  .gitignore  ·  docs/screenshots/
├── server/                      Express API
│   ├── test/api.integration.js  API integration checks
│   └── src/
│       ├── config/              env validation (Zod), db connection
│       ├── models/              User, Doctor, Patient (+ indexes)
│       ├── validators/          Zod schemas for params / query / body
│       ├── middleware/          auth (protect), validate, errorHandler
│       ├── controllers/         auth, doctor, patient, dashboard
│       ├── routes/              one router per resource
│       ├── utils/               ApiError, asyncHandler, helpers, cache
│       ├── seed.js  explain.js  sync-indexes.js
│       └── app.js  server.js
└── client/                      Next.js app
    └── src/
        ├── proxy.ts             route guard (Next 16's middleware)
        ├── app/                 login, (portal)/dashboard | doctors | doctors/[id] | patients
        ├── components/          layout, shared (DataTable, Pagination, Modal...), doctors, patients, dashboard
        ├── hooks/               use-doctors, use-patients, use-dashboard, use-auth, use-url-state
        ├── lib/                 api client, params parsing, formatting, chart helpers
        └── types/
```

## Deployment

Free-tier stack: **MongoDB Atlas** (database), **Render** (API), **Vercel** (client).

1. **Atlas.** Create a free M0 cluster, a database user (letters and numbers only in the password), and allow `0.0.0.0/0` under Network Access. Copy the connection string and add the database name: `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/doctor_tracker?retryWrites=true&w=majority`.
2. **Seed the hosted database** from your machine: put the Atlas string in `server/.env` and run `npm run seed`. (This wipes that database.)
3. **API on Render.** New -> Blueprint -> select this repo (it reads `render.yaml`), or create a Web Service manually with root directory `server`, build `npm install`, start `npm start`, health check `/api/health`. Set `MONGO_URI`, `JWT_SECRET` (any long random string), `NODE_ENV=production` and `CLIENT_URL` (https://doctor-tracker-api-k9qh.onrender.com).
4. **Client on Vercel.** Import the repo, set the root directory to `client`, and add the environment variable `API_URL=doctor-tracker-system-amber.vercel.app`. `API_URL` is read when the app is built, so redeploy after changing it.
5. Open the Vercel URL and sign in with the demo credentials.

Notes: Render's free tier sleeps after inactivity, so the first request can take 30-60 s while it wakes (the login spinner covers it). Because the browser only talks to the Vercel origin, the auth cookie is first-party and needs no cross-site cookie settings. Change the demo password (`ADMIN_PASSWORD`) before using real data.

## Scalability and trade-offs

**Already in place:** every list is paginated with a hard cap; indexes match query shapes; reads are `.lean()` and projected; counts and finds run in parallel; the API is stateless (JWT), so it scales horizontally behind a load balancer; lists, dashboard and dropdowns are cached or cancelled client-side; charts are code-split.

**Known trade-offs (and the next step for each):**

| Trade-off | Next step at larger scale |
|---|---|
| Regex search cannot use an index | Atlas Search / n-gram index |
| Dashboard `$group` scans all patients (cached 30 s per process) | Redis cache, or denormalised counters / a pre-aggregated daily collection |
| Stateless JWT cannot be revoked before expiry | Short-lived access token + rotating refresh token |
| `/doctors/options` returns up to 500 doctors | Type-ahead (async combobox) search |
| Dashboard days are bucketed in UTC | Pass the user's time zone to `$dateToString` |
| Single `admin` role | The `role` field and an `authorize()` middleware are already in place for more roles |


