# Voxara Phase 1

AI influencer analytics SaaS built with Next.js 14, TypeScript, Supabase, Prisma, and Tailwind CSS.

## 1) Clone and install

```bash
git clone <your-repo-url>
cd Voxara
npm install
```

## 2) Create a Supabase project

1. Create a project in the [Supabase Dashboard](https://supabase.com/dashboard)
2. Copy the project URL and anon key into `.env.local`

## 3) Run Supabase migration

```bash
supabase db push
```

This applies `supabase/migrations/001_rls.sql` and enables RLS policies.

## 4) Configure OAuth apps

Create and configure apps for each platform:

- YouTube (Google Cloud): [Google Cloud Console](https://console.cloud.google.com/)
- TikTok: [TikTok for Developers](https://developers.tiktok.com/)
- Instagram: [Meta for Developers](https://developers.facebook.com/)

Add redirect URLs exactly as defined in `.env.example`.

## 5) Configure environment variables

```bash
cp .env.example .env.local
```

Populate all values in `.env.local`.

### Database connectivity notes (important)

This project uses Prisma with Supabase in the standard split:

- `DATABASE_URL`: **pooled** connection (Supabase “Transaction pooler”, commonly port `6543`)
- `DIRECT_URL`: **direct** Postgres connection (Supabase “Direct”, commonly port `5432`)

Prisma Migrate uses `DIRECT_URL`, while runtime queries typically use `DATABASE_URL`.

If your corporate network blocks direct Postgres (`5432`) but allows the pooler (`6543`), this split is the practical fix.

If **both** ports are blocked, use the Docker fallback below (local Postgres) for schema development, or connect from a network that allows outbound Postgres.

## 6) Run Prisma migration

```bash
npx prisma generate
npx prisma migrate dev
```

## 6b) Docker Postgres fallback (local schema dev)

If you cannot reach Supabase Postgres from your laptop, you can still run Prisma against a local Postgres:

```bash
docker compose up -d
```

Then set both URLs to the same local connection string in `.env` / `.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/voxara?sslmode=disable
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/voxara?sslmode=disable
```

## 7) Run local development

```bash
npm run dev
```

## 8) Deploy to Vercel

1. Import the repository into [Vercel](https://vercel.com/)
2. Add all environment variables from `.env.example`
3. Deploy with build command:

```bash
prisma generate && next build
```
