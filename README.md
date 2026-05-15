# Home Balance

Personal household finance dashboard. Tracks accounts, bills (with 1–36 month cuotas), and ingresos/egresos. Single-password gate, multi-currency.

## Stack

- **Frontend**: React + Vite + TailwindCSS + recharts
- **Backend**: Express + Prisma + PostgreSQL
- **Auth**: shared password from `APP_PASSWORD` env var → JWT (30 days)

## Local development

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env: fill DATABASE_URL (Postgres), APP_PASSWORD, JWT_SECRET
npm install
npx prisma db push        # creates tables in your DB
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api → :5000)
```

Open `http://localhost:5173`, enter the password from `APP_PASSWORD`.

## Deploying to Railway (single service)

The Express server also serves the built React app, so you only need one Railway service plus a Postgres add-on.

1. **Create a Railway project** → add **PostgreSQL** plugin. Copy the `DATABASE_URL` from its Variables tab.
2. **Push this repo to GitHub** (or use `railway up` from this directory).
3. **Add a service from the GitHub repo** (or `railway up`). Railway auto-detects `nixpacks.toml` and:
   - installs both `client/` and `server/`,
   - builds the client (`vite build` → `client/dist/`),
   - generates the Prisma client and pushes the schema to your DB,
   - starts the Express server (which serves `/api/*` plus the static client).
4. **Set service variables**:
   - `DATABASE_URL` — paste from the Postgres plugin (or use the Railway variable reference `${{Postgres.DATABASE_URL}}`)
   - `APP_PASSWORD` — your login password
   - `JWT_SECRET` — a random string (e.g. output of `openssl rand -base64 32`)
5. Open the service URL → login with `APP_PASSWORD`.

To redeploy after code changes: push to the connected branch (or `railway up`). Schema changes are applied automatically on each deploy by `prisma db push`.

## Data model

| Model        | Fields |
|--------------|--------|
| Account      | name, type, currency, balance, notes |
| Bill         | name, totalAmount, cuotas (1–36), startDate, currency, accountId? |
| Transaction  | type (`ingreso`/`egreso`), amount, currency, date, accountId?, billId?, cuotaNumber?, isPaid |

When you create a Bill with N cuotas:
- The backend creates N `Transaction` rows of type `egreso`, `isPaid=false`, dated startDate + 0..N-1 months.
- Each cuota shows on the Facturas page (toggle paid) and the Ingresos/Egresos table (filterable).
- Deleting a Bill keeps its paid cuotas as detached egresos so historical cash flow stays intact.

## Multi-currency

Every account and transaction carries its own ISO currency code. The Overview shows separate totals and a separate cash-flow chart per currency — no conversion happens automatically.

## Notes

- No user table by design — it's a single-user app gated by `APP_PASSWORD`. If you want to share with family, share the password.
- `accountBalance` is stored as a single number you maintain manually. Egresos/ingresos do NOT auto-decrement/increment account balances — they're separate ledgers. Edit a Cuenta to set its current balance whenever you want.
- The Prisma schema can be evolved with `npx prisma db push` (no migration files) or `npx prisma migrate dev --name <name>` (tracked).
