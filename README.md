# IT Stock Inventory Management System

A full-stack IT asset management web application built with **Next.js 14**, **TypeScript**, **Prisma ORM**, **PostgreSQL**, and **Tailwind CSS**. Designed for IT teams to manage hardware assets, track issuances, handle repairs, and generate reports.

---

## Features

- **Dashboard** — Live stats, charts by category and status, recent activity feed
- **Inventory Management** — Full CRUD for IT assets with search, filter, CSV export
- **Employee Management** — Employee profiles with asset assignment history
- **Asset Issuance** — Issue available assets to employees with tracking
- **Asset Return** — Process returns with condition assessment
- **Stock Transfer** — Transfer assets between locations/departments
- **Repair Management** — Track sent-for-repair assets through full lifecycle
- **Reports** — 7 report types with date/category filters and CSV export
- **Activity Logs** — Full audit trail of every action
- **User Management** — Admin can create/manage users with role-based access
- **Settings** — Manage categories, locations, departments

## Default Credentials

| Role       | Username    | Password     |
|------------|-------------|--------------|
| Admin      | `admin`     | `admin123`   |
| IT Manager | `itmanager` | `manager123` |
| Viewer     | `viewer`    | `viewer123`  |

## User Roles

| Permission               | Admin | IT Manager | Viewer |
|--------------------------|-------|------------|--------|
| View all data            | ✅    | ✅         | ✅     |
| Add/edit assets          | ✅    | ✅         | ❌     |
| Issue/return/transfer    | ✅    | ✅         | ❌     |
| Send for repair          | ✅    | ✅         | ❌     |
| Manage users             | ✅    | ❌         | ❌     |
| Manage settings          | ✅    | ❌         | ❌     |
| Delete records           | ✅    | ❌         | ❌     |

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Auth**: NextAuth.js (JWT sessions)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

---

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or remote)
- npm or yarn

### Step 1: Clone & Install

```bash
git clone https://github.com/your-org/it-inventory.git
cd it-inventory
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

<!--DATABASE_URL="postgresql://username:password@localhost:5432/it_inventory?schema=public"
NEXTAUTH_SECRET="your-random-secret-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000". -->



```env
DATABASE_URL="postgresql://neondb_owner:npg_necbDPa60HqC@ep-autumn-bread-apif77tn.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="your-random-secret-string-at-least-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Step 3: Set Up the Database

Option A — Using migrations (recommended for production):
```bash
npm run db:migrate
```

Option B — Push schema directly (faster for development):
```bash
npm run db:push
```

### Step 4: Seed the Database

```bash
npx prisma db seed
```

This creates default admin, IT Manager, Viewer users plus sample categories, locations, departments, and assets.

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with `admin / admin123`.

---

## Prisma Commands Reference

```bash
# View/edit your database in a GUI
npm run db:studio

# Apply schema changes (dev)
npm run db:migrate

# Reset database and re-seed
npx prisma migrate reset

# Generate Prisma client after schema changes
npx prisma generate
```

---

## Production Deployment on Vercel

### Step 1: Set Up PostgreSQL

Use one of these providers (all have free tiers):
- **[Neon](https://neon.tech)** ← Recommended (serverless PostgreSQL, Vercel partner)
- **[Supabase](https://supabase.com)**
- **[PlanetScale](https://planetscale.com)**
- **[Railway](https://railway.app)**

Get your `DATABASE_URL` connection string from your chosen provider.

### Step 2: Deploy to Vercel

#### Option A: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select your repository
4. Configure **Environment Variables** (see below)
5. Click **Deploy**

#### Option B: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 3: Configure Environment Variables on Vercel

In your Vercel project → **Settings** → **Environment Variables**, add:

| Variable           | Value                                             |
|--------------------|---------------------------------------------------|
| `DATABASE_URL`     | Your PostgreSQL connection string                 |
| `NEXTAUTH_SECRET`  | Random 32+ char string (`openssl rand -base64 32`) |
| `NEXTAUTH_URL`     | `https://your-app-name.vercel.app`               |

> **Important**: If using Neon or PlanetScale, append `?pgbouncer=true&connection_limit=1` to your `DATABASE_URL` for serverless compatibility.

### Step 4: Run Database Migration on Production

After deployment, run migrations against your production database:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or connect directly to your DB and run:
DATABASE_URL="your-production-url" npx prisma migrate deploy
```

### Step 5: Seed Production Database

```bash
DATABASE_URL="your-production-url" npx prisma db seed
```

---

## Using Neon (Serverless PostgreSQL) — Recommended for Vercel

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string — use the **pooled connection** for `DATABASE_URL`
4. Your connection string looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
5. For Prisma with Neon, update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")  // for migrations
   }
   ```
   Add `DIRECT_URL` (non-pooled) for migrations, `DATABASE_URL` (pooled) for app queries.

---

## Project Structure

```
it-inventory/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
├── src/
│   ├── app/
│   │   ├── api/             # API routes (REST endpoints)
│   │   │   ├── assets/
│   │   │   ├── employees/
│   │   │   ├── issues/
│   │   │   ├── returns/
│   │   │   ├── transfers/
│   │   │   ├── repairs/
│   │   │   ├── users/
│   │   │   ├── categories/
│   │   │   ├── locations/
│   │   │   ├── departments/
│   │   │   ├── activity-logs/
│   │   │   ├── reports/
│   │   │   └── dashboard/
│   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── inventory/
│   │   │   ├── employees/
│   │   │   ├── issues/
│   │   │   ├── returns/
│   │   │   ├── transfers/
│   │   │   ├── repairs/
│   │   │   ├── reports/
│   │   │   ├── activity-logs/
│   │   │   ├── users/
│   │   │   └── settings/
│   │   ├── login/           # Login page
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Root redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/          # Sidebar, TopNav
│   │   ├── forms/           # Modal forms for each entity
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── utils.ts         # Utility functions
│   ├── types/
│   │   └── next-auth.d.ts   # TypeScript type extensions
│   └── middleware.ts        # Auth route protection
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## Environment Variables Reference

| Variable          | Required | Description                                    |
|-------------------|----------|------------------------------------------------|
| `DATABASE_URL`    | Yes      | PostgreSQL connection string                   |
| `NEXTAUTH_SECRET` | Yes      | Secret for JWT signing (min 32 chars)          |
| `NEXTAUTH_URL`    | Yes      | Full URL of your app (with https in prod)      |
| `DIRECT_URL`      | No       | Non-pooled URL for migrations (Neon/PgBouncer) |

---

## Troubleshooting

**"Prisma client not generated" error on Vercel:**
The `postinstall` script runs `prisma generate` automatically. Ensure `prisma` is in `devDependencies`.

**Database connection errors in serverless:**
Add `connection_limit=1` to your connection string:
```
postgresql://...?connection_limit=1&sslmode=require
```

**Auth redirect loop:**
Ensure `NEXTAUTH_URL` exactly matches your deployed URL including `https://`.

**Seed fails on production:**
Run seed locally with the production `DATABASE_URL`:
```bash
DATABASE_URL="your-prod-url" npx prisma db seed
```

---

## License

MIT — free to use and modify.
