# GC Off-Market

Internal tool for Gold Coast real estate agents to log off-market listings and buyer criteria, and see matches by suburb — no addresses, no buyer names, just the 5 key details on each side.

## Quick Start

```bash
npm run setup   # installs backend + frontend deps
npm run dev     # runs API (http://localhost:3001) + UI (http://localhost:5173)
```

### Database

Needs a Postgres database. Set `DATABASE_URL` in `backend/.env` (copy from `backend/.env.example`). Schema auto-applies on server startup — no manual migration needed.

**Railway (recommended):**
- New Railway project → Add a PostgreSQL service (provides `DATABASE_URL` automatically)
- Add a `JWT_SECRET` env var (any long random string)
- Deploy this repo — `railway.toml` handles build/start

## How it works

- Agents self-register (name, email, password) — no admin approval needed.
- Each agent adds **listings** (suburb, price, property type, bedrooms, bathrooms) and **buyers** (suburb, max price, property type, min bedrooms, min bathrooms) — no addresses, no buyer names.
- The **Suburbs** dashboard lists every Gold Coast suburb with listing/buyer counts. Click into one to see all sellers and buyers for that suburb side by side, with match badges.
- A match = same suburb, listing price ≤ buyer's max price, same property type, listing beds/baths ≥ buyer's minimums.
- Agents can edit/delete their own listings and buyers; admins (role set manually in the `users` table) can edit/delete anyone's.

## Tech Stack

- **Backend:** Node.js + Express + PostgreSQL (pg), JWT auth
- **Frontend:** React 18 + Vite + React Router v6
- **Hosting:** Railway
