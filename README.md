# Backend — ProjectFlow API

This folder contains the **server** for the internal project management app. It is a **Node.js + Express** REST API with **MongoDB**, **JWT authentication**, **Socket.IO** for real-time updates, and an optional **Redis** adapter for scaling sockets.

---

## What this backend does (in simple terms)

1. **Sign up / log in** — Creates users, hashes passwords, returns a **JWT token** (a signed string the frontend keeps to prove “I am logged in”).
2. **Projects** — Create, list, update, delete projects; manage who is on each project.
3. **Tasks** — Create, update, delete tasks inside a project; Kanban columns; assignees; priorities; due dates; version checks to avoid overwriting someone else’s edit.
4. **Comments & activity** — Comments on tasks and an activity log for task changes.
5. **Admin overview** — Workspace admins can call a special endpoint to see counts and lists of all users and projects.
6. **Real-time (Socket.IO)** — After a successful write, the server can emit events so other browsers update without refreshing.

---

## What you need installed first (prerequisites)

| Requirement | Why |
|-------------|-----|
| **Node.js 20 or newer** | The code uses modern JavaScript; `package.json` says `>=20`. [Download Node](https://nodejs.org/) (LTS is fine). |
| **npm** | Comes with Node; used to install packages and run scripts. |
| **MongoDB** | All users, projects, tasks, etc. are stored here. You can run **MongoDB locally** or use **MongoDB Atlas** (cloud) and paste the connection string. |
| **Redis (optional for local dev)** | If `REDIS_URL` is empty, the app still runs; Socket.IO works in **single-server** mode. If you set Redis, multiple backend instances can share socket messages. |

**Check versions in a terminal:**

```bash
node -v
npm -v
```

You should see Node **v20.x** (or higher) and npm **10.x** (or similar).

---

## Step-by-step: run the backend on your computer

### Step 1 — Open a terminal in this folder

Go to the project on your machine, then into the backend folder:

```bash
cd backend
```

(On Windows PowerShell or Command Prompt, the path might look like `cd "C:\...\project-management-app\backend"`.)

### Step 2 — Install dependencies

This downloads all libraries listed in `package.json` into `node_modules/`.

```bash
npm install
```

Wait until it finishes without errors.

### Step 3 — Create your environment file

The server reads **environment variables** from a file named `.env` (this file is **not** committed to Git for security).

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

   On **Windows PowerShell**, if `cp` does not work, use:

   ```powershell
   copy .env.example .env
   ```

2. Open `.env` in any text editor and adjust values (see **Environment variables** below).

### Step 4 — Start MongoDB

- **Local MongoDB:** start the MongoDB service so it listens on the URI you put in `MONGODB_URI` (default is `mongodb://127.0.0.1:27017/...`).
- **Atlas:** create a cluster, get a connection string, and set `MONGODB_URI` to that string.

If MongoDB is not running, the server will **fail to start** with a connection error.

### Step 5 — (Optional) Start Redis

Only needed if you set `REDIS_URL` in `.env`. If you leave `REDIS_URL` empty, you can skip Redis for local development.

### Step 6 — Start the API server

**Development** (auto-restarts when you change code):

```bash
npm run dev
```

**Production-style** (single run, no file watcher):

```bash
npm start
```

When it works, you should see something like:

```text
MongoDB connected: ...
API listening on http://localhost:5000
```

### Step 7 — Quick health check

Open a browser or use curl:

```text
http://localhost:5000/api/health
```

You should get JSON with `"status": "ok"`.

---

## Environment variables (`.env`) explained

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `NODE_ENV` | Recommended | `development` or `production`. In production, missing `JWT_SECRET` must not be the dev default. |
| `PORT` | Optional | Port the HTTP server listens on. Default **5000**. |
| `MONGODB_URI` | **Yes** | Full MongoDB connection string. Default in example points to local DB `internal_project_management`. |
| `JWT_SECRET` | **Yes** | Secret used to sign tokens. Use a **long random string** in production. |
| `JWT_EXPIRES_IN` | Optional | How long tokens live, e.g. `7d`. |
| `CORS_ORIGIN` | **Yes for browser** | Frontend URL(s) allowed to call the API. Example: `http://localhost:3000`. Multiple origins: comma-separated. |
| `REDIS_URL` | Optional | e.g. `redis://127.0.0.1:6379`. If empty, sockets work without Redis adapter. |
| `RATE_LIMIT_WINDOW_MS` | Optional | Rate limit window in milliseconds. |
| `RATE_LIMIT_MAX` | Optional | Max requests per window per IP. |
| `COMPANY_ADMIN_EMAIL` | Optional | If set, registering with **this exact email** (case-insensitive) assigns workspace **admin** role. |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` | Only for seed script | Used by `npm run seed:admin` (see below). |

---

## NPM scripts (this folder only)

| Command | Meaning |
|---------|---------|
| `npm run dev` | Start server with **nodemon** (restarts on file changes). |
| `npm start` | Start server with **node** (typical for production). |
| `npm run check` | Syntax-check `src/server.js` without running the app. |
| `npm run seed:admin` | Create or promote **one workspace admin** user (needs `SEED_*` in `.env`). |

### Seed admin user (`npm run seed:admin`)

1. Put in `.env` at least:
   - `SEED_ADMIN_EMAIL` — email for the admin account  
   - `SEED_ADMIN_PASSWORD` — **minimum 8 characters**  
   - Optionally `SEED_ADMIN_NAME`  
2. Ensure `MONGODB_URI` is correct and MongoDB is running.  
3. From `backend/` run:

   ```bash
   npm run seed:admin
   ```

- If that email **does not exist**, a new **admin** user is created.  
- If the user exists but is **not** admin, they are **promoted** to admin (password is **not** changed).  
- If the user is **already** admin, the script does nothing.

---

## How the code is organized (`src/`)

| Path | Role |
|------|------|
| `server.js` | Starts HTTP server, connects MongoDB, Redis, Socket.IO. |
| `app.js` | Express app: security middleware, JSON body parser, mounts `/api` routes, 404, error handler. |
| `routes/` | Maps URLs to controllers (`/auth`, `/users`, `/projects`, `/tasks`, `/admin`, …). |
| `controllers/` | Reads `req`, calls services, sends `res` (HTTP + status codes). |
| `services/` | Business rules: who can create a project, task validation, etc. |
| `models/` | Mongoose schemas: `User`, `Project`, `Task`, `Comment`, … |
| `middleware/` | `requireAuth`, `requireRole`, validation wrapper, centralized errors. |
| `validations/` | Zod schemas for request bodies and query params. |
| `sockets/` | Socket.IO: JWT on handshake, `project:join` / `project:leave`, room naming. |
| `config/` | Loads `.env`, DB and Redis helpers. |
| `utils/` | JWT helpers, permissions, pagination, title case, etc. |
| `scripts/` | One-off scripts such as `seed-admin.js`. |

---

## Authentication (how “logged in” works)

1. Client sends `POST /api/auth/register` or `POST /api/auth/login`.  
2. Server returns `{ token, user }`.  
3. For protected routes, the client sends:

   ```http
   Authorization: Bearer <token>
   ```

4. Middleware verifies the JWT and loads the user from MongoDB.

---

## Workspace roles (important)

Stored on each **User** document as `role`:

| Value | Meaning (short) |
|-------|-----------------|
| `admin` | Full workspace admin; sees **all** projects; `/admin` overview; can assign tasks to other admins; etc. |
| `manager` | Workspace “project manager”: can **create** projects, see **all** projects, manage members on any project, same broad access as admin for many operations (except dedicated admin-only bits where coded). |
| `member` | Normal user: sees projects they **own or are added to**; cannot create projects unless promoted. |

**First registered user** in an empty database becomes **admin**.  
Signup form only offers **member** or **manager**; admin can also come from `COMPANY_ADMIN_EMAIL` or the seed script.

*(Project-level roles like “owner” on a single project are separate and live on the project’s `members` array.)*

---

## API base path

All REST routes are under:

```text
http://localhost:<PORT>/api
```

Example: `http://localhost:5000/api/health`.

A full list of endpoints and socket events lives in the **repository root** `README.md` for this monorepo.

---

## Common problems (troubleshooting)

| Problem | What to check |
|---------|----------------|
| `Cannot connect to MongoDB` | MongoDB running? `MONGODB_URI` correct? Firewall / Atlas IP whitelist? |
| `JWT_SECRET must be configured in production` | In production, change `JWT_SECRET` from the dev placeholder. |
| CORS errors in browser | `CORS_ORIGIN` must include your frontend URL **exactly** (including `http://` and port). |
| `401` on every request | Token missing, expired, or wrong `Authorization: Bearer` header. |
| `403` on creating project | Only **admin** and workspace **manager** can create projects. |
| Port already in use | Another app uses `PORT`; change `PORT` in `.env` or stop the other app. |

---

## Production checklist (short)

1. Set `NODE_ENV=production`.  
2. Set a strong `JWT_SECRET`.  
3. Set `MONGODB_URI` to your production cluster.  
4. Set `CORS_ORIGIN` to your real frontend URL(s).  
5. Set `REDIS_URL` if you run **multiple** API instances.  
6. Run `npm install --omit=dev` (optional, to skip devDependencies).  
7. Run `npm start` (use a process manager like **PM2** or your host’s supervisor).

---

## Related documentation

- **Root `README.md`** — Full API table, socket events, monorepo scripts, architecture.  
- **`frontend/README.md`** — How to run the Next.js app and connect it to this API.
