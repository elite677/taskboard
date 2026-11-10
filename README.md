# Taskboard

A Trello-style kanban app. React + Express + PostgreSQL, JWT auth in httpOnly cookies.

## Features
- Sign up / log in / log out (bcrypt-hashed passwords, httpOnly JWT cookie, rate-limited auth routes)
- Boards, lists, and cards with full CRUD
- Drag and drop cards between lists; order is persisted using fractional positions (one PATCH per move) with optimistic UI and rollback
- Per-board authorization: every route checks board membership; only owners can delete a board
- Card descriptions and due dates, with overdue highlighting
- Input validation (Zod), centralized error handling, Helmet, CORS

## Run locally
1. Create a database: `createdb taskboard`
2. Backend:
   ```
   cd server
   cp .env.example .env     # edit DATABASE_URL and JWT_SECRET
   npm install
   npm run db:init          # runs db/schema.sql (needs psql), or paste it into any SQL client
   npm run dev
   ```
3. Frontend (new terminal):
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

## Deploy
- API + Postgres: Render or Railway. Set `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `CLIENT_ORIGIN` (your frontend URL). Run `db/schema.sql` once.
- Frontend: Vercel or Netlify. Set `VITE_API_URL` to your API URL. Add a SPA rewrite so all routes serve `index.html`.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/register, /login, /logout | Auth |
| GET | /api/auth/me | Current user |
| GET, POST | /api/boards | List / create boards |
| GET, PATCH, DELETE | /api/boards/:id | Board with lists and cards |
| POST | /api/boards/:id/lists | Add list |
| PATCH, DELETE | /api/lists/:id | Rename / delete list |
| POST | /api/lists/:id/cards | Add card |
| PATCH, DELETE | /api/cards/:id | Edit / move / delete card |

## Ideas for next
Board invites (the `board_members` table is ready), labels, activity log, list reordering, tests with Vitest + Supertest.
